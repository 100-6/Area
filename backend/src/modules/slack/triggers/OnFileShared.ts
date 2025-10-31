import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { SlackApiService } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger qui se déclenche quand un fichier est partagé dans un canal Slack
 * Utilise le polling pour vérifier les nouveaux fichiers
 */
export class OnFileSharedTrigger extends BaseTrigger {
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastCheckedMessageTs: Map<string, string> = new Map();

    getName(): string {
        return 'on_file_shared';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a file is shared in a Slack channel';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['channelId'],
            properties: {
                channelId: { type: 'string', minLength: 1 },
                fileType: { type: 'string' },
                pollingInterval: { type: 'number', default: 30000 }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                fileId: { type: 'string' },
                fileName: { type: 'string' },
                fileType: { type: 'string' },
                fileUrl: { type: 'string' },
                fileSize: { type: 'number' },
                channelId: { type: 'string' },
                userId: { type: 'string' },
                username: { type: 'string' },
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
        console.log(`[OnFileShared] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnFileShared] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }
        this.validate(config);
        this.isRunning = true;
        await this.initializeLastCheckedMessageTs(areaId, config);
        const pollingInterval = config.pollingInterval || 30000;
        const interval = setInterval(async () => {
            await this.checkForNewFiles(areaId, config);
        }, pollingInterval);
        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnFileShared] Trigger started for AREA ${areaId}`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnFileShared] Stopping trigger for AREA ${areaId}`.cyan);
        const interval = this.pollingIntervals.get(areaId);

        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastCheckedMessageTs.delete(areaId);
        }
        this.isRunning = false;
        console.log(`[OnFileShared] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialiser le dernier message vérifié
     */
    private async initializeLastCheckedMessageTs(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area)
                return;
            const slackConnection = await UserAuthProvider.findByUserAndProvider(area.user_id, 'slack');
            if (!slackConnection || !slackConnection.access_token)
                return;
            const accessToken = slackConnection.access_token;
            const messages = await SlackApiService.getChannelHistory(accessToken, config.channelId, 1);
            if (messages.length > 0) {
                this.lastCheckedMessageTs.set(areaId, messages[0].ts);
                console.log(`[OnFileShared] Initialized with last message ts: ${messages[0].ts}`.gray);
            }
        } catch (error) {
            console.error(`[OnFileShared] Error initializing:`.red, error);
        }
    }

    /**
     * Vérifier s'il y a de nouveaux fichiers partagés
     */
    private async checkForNewFiles(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area)
                return;
            const slackConnection = await UserAuthProvider.findByUserAndProvider(area.user_id, 'slack');
            if (!slackConnection || !slackConnection.access_token)
                return;
            const accessToken = slackConnection.access_token;
            const lastTs = this.lastCheckedMessageTs.get(areaId);
            const messages = await SlackApiService.getChannelHistory(
                accessToken,
                config.channelId,
                20,
                lastTs
            );
            if (messages.length === 0)
                return;
            const sortedMessages = messages.sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));
            for (const message of sortedMessages) {
                if (lastTs && message.ts <= lastTs)
                    continue;
                if (!message.files || message.files.length === 0) {
                    this.lastCheckedMessageTs.set(areaId, message.ts);
                    continue;
                }
                for (const file of message.files) {
                    if (config.fileType && file.filetype !== config.fileType)
                        continue;
                    let username = 'unknown';
                    if (message.user) {
                        try {
                            const userInfo = await SlackApiService.getUserInfo(accessToken, message.user);
                            username = userInfo.name;
                        } catch (error) {
                            console.warn(`[OnFileShared] Could not fetch user info`.yellow);
                        }
                    }
                    const payload: TriggerPayload = {
                        areaId,
                        triggerName: this.getName(),
                        triggerType: this.getType(),
                        timestamp: new Date().toISOString(),
                        data: {
                            fileId: file.id,
                            fileName: file.name,
                            fileType: file.filetype,
                            fileUrl: file.url_private,
                            fileSize: file.size,
                            channelId: config.channelId,
                            userId: message.user || 'unknown',
                            username,
                            timestamp: message.ts
                        }
                    };
                    await this.emitTrigger(payload);
                }
                this.lastCheckedMessageTs.set(areaId, message.ts);
            }
        } catch (error) {
            console.error(`[OnFileShared] Error checking for new files:`.red, error);
        }
    }
}
