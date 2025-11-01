import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { SlackApiService } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger qui se déclenche quand un nouveau message privé (DM) est reçu
 * Utilise le polling pour vérifier les nouveaux DMs
 */
export class OnDirectMessageTrigger extends BaseTrigger {
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastCheckedMessageTs: Map<string, string> = new Map();
    private dmChannels: Map<string, string[]> = new Map(); // areaId -> list of DM channel IDs

    getName(): string {
        return 'on_direct_message';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a new direct message is received';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                userId: { type: 'string' },
                keyword: { type: 'string' },
                pollingInterval: { type: 'number', default: 30000 }
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
                timestamp: { type: 'string' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnDirectMessage] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnDirectMessage] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }
        this.validate(config);
        this.isRunning = true;
        await this.initializeDMChannels(areaId, config);
        const pollingInterval = config.pollingInterval || 30000;
        const interval = setInterval(async () => {
            await this.checkForNewDMs(areaId, config);
        }, pollingInterval);
        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnDirectMessage] Trigger started for AREA ${areaId}`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnDirectMessage] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastCheckedMessageTs.delete(areaId);
            this.dmChannels.delete(areaId);
        }
        this.isRunning = false;
        console.log(`[OnDirectMessage] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialiser la liste des canaux DM et le dernier timestamp vérifié
     * Utilise last_triggered_at de l'AREA pour éviter de retraiter les anciens messages après redémarrage
     */
    private async initializeDMChannels(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area)
                return;
            const slackConnection = await UserAuthProvider.findByUserAndProvider(area.user_id, 'slack');
            if (!slackConnection || !slackConnection.access_token)
                return;
            const accessToken = slackConnection.access_token;
            const channels = await SlackApiService.getChannelsList(accessToken, 'im', 1000);
            const dmChannelIds = channels.map(ch => ch.id);
            this.dmChannels.set(areaId, dmChannelIds);
            console.log(`[OnDirectMessage] Found ${dmChannelIds.length} DM channel(s)`.gray);
            if (area.last_triggered_at) {
                const lastTriggeredTs = (area.last_triggered_at.getTime() / 1000).toFixed(6);
                this.lastCheckedMessageTs.set(areaId, lastTriggeredTs);
                console.log(`[OnDirectMessage] Initialized from last_triggered_at: ${area.last_triggered_at.toISOString()}`.gray);
            } else {
                console.log(`[OnDirectMessage] First run - will process new messages only`.gray);
            }
        } catch (error) {
            console.error(`[OnDirectMessage] Error initializing DM channels:`.red, error);
        }
    }

    /**
     * Vérifier s'il y a de nouveaux messages directs
     */
    private async checkForNewDMs(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area)
                return;

            const slackConnection = await UserAuthProvider.findByUserAndProvider(area.user_id, 'slack');
            if (!slackConnection || !slackConnection.access_token)
                return;
            const accessToken = slackConnection.access_token;
            const dmChannelIds = this.dmChannels.get(areaId) || [];
            const lastTs = this.lastCheckedMessageTs.get(areaId);
            for (const channelId of dmChannelIds) {
                try {
                    const messages = await SlackApiService.getChannelHistory(
                        accessToken,
                        channelId,
                        10,
                        lastTs
                    );
                    if (messages.length === 0)
                        continue;
                    const sortedMessages = messages.sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));
                    for (const message of sortedMessages) {
                        if (lastTs && parseFloat(message.ts) <= parseFloat(lastTs)) {
                            console.log(`[OnDirectMessage] Skipping old message ${message.ts} (lastTs: ${lastTs})`.gray);
                            continue;
                        }
                        if (config.userId && message.user !== config.userId) {
                            console.log(`[OnDirectMessage] Skipping message from ${message.user} (expected: ${config.userId})`.gray);
                            continue;
                        }
                        if (config.keyword && !message.text.toLowerCase().includes(config.keyword.toLowerCase())) {
                            console.log(`[OnDirectMessage] Skipping message without keyword "${config.keyword}": "${message.text}"`.gray);
                            continue;
                        }
                        let username = 'unknown';
                        if (message.user) {
                            try {
                                const userInfo = await SlackApiService.getUserInfo(accessToken, message.user);
                                username = userInfo.name;
                            } catch (error) {
                                console.warn(`[OnDirectMessage] Could not fetch user info`.yellow);
                            }
                        }
                        const payload: TriggerPayload = {
                            areaId,
                            triggerName: this.getName(),
                            triggerType: this.getType(),
                            timestamp: new Date().toISOString(),
                            data: {
                                messageId: message.ts,
                                channelId: channelId,
                                userId: message.user || 'unknown',
                                username,
                                text: message.text,
                                timestamp: message.ts
                            }
                        };
                        await this.emitTrigger(payload);
                        this.lastCheckedMessageTs.set(areaId, message.ts);
                    }
                } catch (error) {
                    console.error(`[OnDirectMessage] Error checking DM channel ${channelId}:`.red, error);
                }
            }
        } catch (error) {
            console.error(`[OnDirectMessage] Error checking for new DMs:`.red, error);
        }
    }
}
