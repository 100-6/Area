import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { SlackApiService } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger qui se déclenche quand un utilisateur rejoint un canal Slack
 * Utilise le polling pour vérifier les nouveaux membres
 */
export class OnUserJoinedChannelTrigger extends BaseTrigger {
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownMembers: Map<string, Set<string>> = new Map(); // areaId -> Set of member IDs

    getName(): string {
        return 'on_user_joined_channel';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a user joins a Slack channel';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['channelId'],
            properties: {
                channelId: { type: 'string', minLength: 1 },
                ignoreBots: { type: 'boolean', default: true },
                pollingInterval: { type: 'number', default: 60000 }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                userId: { type: 'string' },
                username: { type: 'string' },
                channelId: { type: 'string' },
                channelName: { type: 'string' },
                timestamp: { type: 'string' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (!config.channelId || config.channelId.trim() === '')
            throw new Error('Channel ID is required');
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnUserJoinedChannel] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnUserJoinedChannel] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }
        this.validate(config);
        this.isRunning = true;
        await this.initializeMembers(areaId, config);
        const pollingInterval = config.pollingInterval || 60000;
        const interval = setInterval(async () => {
            await this.checkForNewMembers(areaId, config);
        }, pollingInterval);
        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnUserJoinedChannel] Trigger started for AREA ${areaId}`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnUserJoinedChannel] Stopping trigger for AREA ${areaId}`.cyan);
        const interval = this.pollingIntervals.get(areaId);

        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownMembers.delete(areaId);
        }
        this.isRunning = false;
        console.log(`[OnUserJoinedChannel] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialiser la liste des membres actuels du canal
     */
    private async initializeMembers(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area)
                return;
            const slackConnection = await UserAuthProvider.findByUserAndProvider(area.user_id, 'slack');
            if (!slackConnection || !slackConnection.access_token)
                return;
            const accessToken = slackConnection.access_token;
            const members = await SlackApiService.getChannelMembers(accessToken, config.channelId);
            this.lastKnownMembers.set(areaId, new Set(members));
            console.log(`[OnUserJoinedChannel] Initialized with ${members.length} member(s)`.gray);
        } catch (error) {
            console.error(`[OnUserJoinedChannel] Error initializing members:`.red, error);
        }
    }

    /**
     * Vérifier s'il y a de nouveaux membres
     */
    private async checkForNewMembers(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area)
                return;
            const slackConnection = await UserAuthProvider.findByUserAndProvider(area.user_id, 'slack');
            if (!slackConnection || !slackConnection.access_token)
                return;
            const accessToken = slackConnection.access_token;
            const currentMembers = await SlackApiService.getChannelMembers(accessToken, config.channelId);
            const lastKnownMemberIds = this.lastKnownMembers.get(areaId) || new Set<string>();
            const newMembers = currentMembers.filter(memberId => !lastKnownMemberIds.has(memberId));
            if (newMembers.length === 0)
                return;
            const channels = await SlackApiService.getChannelsList(accessToken, 'public_channel,private_channel');
            const channel = channels.find(ch => ch.id === config.channelId);
            const channelName = channel?.name || 'unknown';
            for (const userId of newMembers) {
                try {
                    const userInfo = await SlackApiService.getUserInfo(accessToken, userId);
                    if (config.ignoreBots && userInfo.is_bot)
                        continue;
                    const payload: TriggerPayload = {
                        areaId,
                        triggerName: this.getName(),
                        triggerType: this.getType(),
                        timestamp: new Date().toISOString(),
                        data: {
                            userId: userId,
                            username: userInfo.name,
                            channelId: config.channelId,
                            channelName: channelName,
                            timestamp: new Date().toISOString()
                        }
                    };
                    await this.emitTrigger(payload);
                } catch (error) {
                    console.error(`[OnUserJoinedChannel] Error processing user ${userId}:`.red, error);
                }
            }
            this.lastKnownMembers.set(areaId, new Set(currentMembers));
        } catch (error) {
            console.error(`[OnUserJoinedChannel] Error checking for new members:`.red, error);
        }
    }
}
