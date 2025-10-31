import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { SlackApiService } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger qui se déclenche quand un nouveau canal Slack est créé
 * Utilise le polling pour vérifier les nouveaux canaux
 */
export class OnChannelCreatedTrigger extends BaseTrigger {
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownChannels: Map<string, Set<string>> = new Map();

    getName(): string {
        return 'on_channel_created';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a new Slack channel is created in the workspace';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                channelType: {
                    type: 'string',
                    enum: ['public', 'private', 'all'],
                    default: 'all'
                },
                pollingInterval: { type: 'number', default: 60000 }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                channelId: { type: 'string' },
                channelName: { type: 'string' },
                creatorId: { type: 'string' },
                isPrivate: { type: 'boolean' },
                timestamp: { type: 'string' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnChannelCreated] Starting trigger for AREA ${areaId}`.cyan);
        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnChannelCreated] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }
        this.validate(config);
        this.isRunning = true;
        await this.initializeChannels(areaId, config);
        const pollingInterval = config.pollingInterval || 60000;
        const interval = setInterval(async () => {
            await this.checkForNewChannels(areaId, config);
        }, pollingInterval);
        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnChannelCreated] Trigger started for AREA ${areaId}`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnChannelCreated] Stopping trigger for AREA ${areaId}`.cyan);
        const interval = this.pollingIntervals.get(areaId);

        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownChannels.delete(areaId);
        }
        this.isRunning = false;
        console.log(`[OnChannelCreated] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialiser la liste des canaux existants
     */
    private async initializeChannels(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area)
                return;
            const slackConnection = await UserAuthProvider.findByUserAndProvider(area.user_id, 'slack');
            if (!slackConnection || !slackConnection.access_token)
                return;
            const accessToken = slackConnection.access_token;
            let channelTypes = 'public_channel,private_channel';
            if (config.channelType === 'public')
                channelTypes = 'public_channel';
            else if (config.channelType === 'private')
                channelTypes = 'private_channel';
            const channels = await SlackApiService.getChannelsList(accessToken, channelTypes);
            const channelIds = channels.map(ch => ch.id);
            this.lastKnownChannels.set(areaId, new Set(channelIds));
            console.log(`[OnChannelCreated] Initialized with ${channelIds.length} channel(s)`.gray);
        } catch (error) {
            console.error(`[OnChannelCreated] Error initializing channels:`.red, error);
        }
    }

    /**
     * Vérifier s'il y a de nouveaux canaux
     */
    private async checkForNewChannels(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area)
                return;
            const slackConnection = await UserAuthProvider.findByUserAndProvider(area.user_id, 'slack');
            if (!slackConnection || !slackConnection.access_token)
                return;
            const accessToken = slackConnection.access_token;
            let channelTypes = 'public_channel,private_channel';
            if (config.channelType === 'public')
                channelTypes = 'public_channel';
            else if (config.channelType === 'private')
                channelTypes = 'private_channel';
            const currentChannels = await SlackApiService.getChannelsList(accessToken, channelTypes);
            const lastKnownChannelIds = this.lastKnownChannels.get(areaId) || new Set<string>();
            const newChannels = currentChannels.filter(ch => !lastKnownChannelIds.has(ch.id));
            if (newChannels.length === 0)
                return;
            for (const channel of newChannels) {
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        channelId: channel.id,
                        channelName: channel.name,
                        creatorId: channel.creator || 'unknown',
                        isPrivate: channel.is_private || false,
                        timestamp: new Date(channel.created * 1000).toISOString()
                    }
                };
                await this.emitTrigger(payload);
            }
            this.lastKnownChannels.set(areaId, new Set(currentChannels.map(ch => ch.id)));
        } catch (error) {
            console.error(`[OnChannelCreated] Error checking for new channels:`.red, error);
        }
    }
}
