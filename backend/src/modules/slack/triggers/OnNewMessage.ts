import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { SlackApiService } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger qui se déclenche quand un nouveau message est posté dans un canal Slack
 * Utilise le polling pour vérifier les nouveaux messages
 */
export class OnNewMessageTrigger extends BaseTrigger {
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastCheckedMessageTs: Map<string, string> = new Map();

    getName(): string {
        return 'on_new_message';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a new message is posted in a Slack channel';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['channelId'],
            properties: {
                channelId: { type: 'string', minLength: 1 },
                keyword: { type: 'string' },
                userId: { type: 'string' },
                ignoreBots: { type: 'boolean', default: true },
                pollingInterval: { type: 'number', default: 30000, description: 'Polling interval in milliseconds' }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                messageId: { type: 'string' },
                channelId: { type: 'string' },
                userId: { type: 'string' },
                username: { type: 'string' },
                text: { type: 'string' },
                timestamp: { type: 'string' },
                threadTs: { type: 'string' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (!config.channelId || config.channelId.trim() === '')
            throw new Error('Channel ID is required');
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnNewMessage] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnNewMessage] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }
        this.validate(config);
        this.isRunning = true;
        await this.initializeLastCheckedMessageTs(areaId, config);
        const pollingInterval = config.pollingInterval || 30000;
        const interval = setInterval(async () => {
            await this.checkForNewMessages(areaId, config);
        }, pollingInterval);
        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnNewMessage] Trigger started for AREA ${areaId} with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnNewMessage] Stopping trigger for AREA ${areaId}`.cyan);
        const interval = this.pollingIntervals.get(areaId);

        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastCheckedMessageTs.delete(areaId);
        }
        this.isRunning = false;
        console.log(`[OnNewMessage] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialiser le dernier message vérifié pour éviter de traiter les anciens messages
     * Utilise last_triggered_at de l'AREA pour éviter de retraiter les anciens messages après redémarrage
     */
    private async initializeLastCheckedMessageTs(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area)
                return;
            if (area.last_triggered_at) {
                const lastTriggeredTs = (area.last_triggered_at.getTime() / 1000).toFixed(6);
                this.lastCheckedMessageTs.set(areaId, lastTriggeredTs);
                console.log(`[OnNewMessage] Initialized from last_triggered_at: ${area.last_triggered_at.toISOString()}`.gray);
            } else {
                const slackConnection = await UserAuthProvider.findByUserAndProvider(area.user_id, 'slack');
                if (!slackConnection || !slackConnection.access_token)
                    return;
                const accessToken = slackConnection.access_token;
                const messages = await SlackApiService.getChannelHistory(accessToken, config.channelId, 1);
                if (messages.length > 0) {
                    this.lastCheckedMessageTs.set(areaId, messages[0].ts);
                    console.log(`[OnNewMessage] First run - initialized with current message ts: ${messages[0].ts}`.gray);
                }
            }
        } catch (error) {
            console.error(`[OnNewMessage] Error initializing last checked message ts:`.red, error);
        }
    }

    /**
     * Vérifier s'il y a de nouveaux messages
     */
    private async checkForNewMessages(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area) {
                console.error(`[OnNewMessage] AREA ${areaId} not found`.red);
                return;
            }
            const slackConnection = await UserAuthProvider.findByUserAndProvider(area.user_id, 'slack');
            if (!slackConnection || !slackConnection.access_token) {
                console.error(`[OnNewMessage] Slack not connected for user ${area.user_id}`.red);
                return;
            }
            const accessToken = slackConnection.access_token;
            const lastTs = this.lastCheckedMessageTs.get(areaId);
            const messages = await SlackApiService.getChannelHistory(
                accessToken,
                config.channelId,
                10,
                lastTs
            );
            if (messages.length === 0) {
                return;
            }
            const sortedMessages = messages.sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));
            for (const message of sortedMessages) {
                if (lastTs && parseFloat(message.ts) <= parseFloat(lastTs))
                    continue;
                if (config.ignoreBots && message.bot_id)
                    continue;
                if (config.userId && message.user !== config.userId)
                    continue;
                if (config.keyword && !message.text.toLowerCase().includes(config.keyword.toLowerCase()))
                    continue;
                let username = 'unknown';
                if (message.user) {
                    try {
                        const userInfo = await SlackApiService.getUserInfo(accessToken, message.user);
                        username = userInfo.name;
                    } catch (error) {
                        console.warn(`[OnNewMessage] Could not fetch user info for ${message.user}`.yellow);
                    }
                }
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        messageId: message.ts,
                        channelId: config.channelId,
                        userId: message.user || 'unknown',
                        username,
                        text: message.text,
                        timestamp: message.ts,
                        threadTs: message.thread_ts || null
                    }
                };
                await this.emitTrigger(payload);
                this.lastCheckedMessageTs.set(areaId, message.ts);
            }
        } catch (error) {
            console.error(`[OnNewMessage] Error checking for new messages:`.red, error);
        }
    }
}
