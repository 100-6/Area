import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { TwitchApiService } from '../TwitchApiService';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger that fires when someone raids your channel
 *
 * Note: Twitch raids are best detected via EventSub webhooks.
 * This polling implementation checks for recent raids by monitoring
 * viewer count spikes and chat messages.
 *
 * For production use, consider implementing EventSub for real-time raid detection.
 */
export class OnRaidTrigger extends BaseTrigger {
    private apiService: TwitchApiService;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastViewerCount: Map<string, number> = new Map();

    constructor(apiService: TwitchApiService) {
        super();
        this.apiService = apiService;
    }

    getName(): string {
        return 'on_raid';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when someone raids your channel';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                checkInterval: {
                    type: 'number',
                    default: 30,
                    minimum: 15,
                    maximum: 120,
                    description: 'Check interval in seconds (15-120)'
                },
                minimumRaiders: {
                    type: 'number',
                    default: 5,
                    minimum: 1,
                    maximum: 1000,
                    description: 'Minimum viewers to consider as raid'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                raider_user_id: { type: 'string', description: 'Raider user ID (if available)' },
                raider_user_login: { type: 'string', description: 'Raider login name (if available)' },
                raider_user_name: { type: 'string', description: 'Raider display name (if available)' },
                viewer_count: { type: 'number', description: 'Approximate number of raiders' },
                detected_at: { type: 'string', format: 'date-time', description: 'Detection timestamp' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const interval = config.checkInterval || 30;
        if (interval < 15 || interval > 120) {
            throw new Error('Check interval must be between 15 and 120 seconds');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnRaid] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnRaid] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        // Initialize baseline viewer count
        await this.initializeViewerCount(areaId);

        const checkInterval = (config.checkInterval || 30) * 1000;

        const interval = setInterval(async () => {
            await this.checkForRaid(areaId, config);
        }, checkInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnRaid] Trigger started for AREA ${areaId}`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnRaid] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastViewerCount.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnRaid] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialize baseline viewer count
     */
    private async initializeViewerCount(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) return;

            const userData = twitchAuth.provider_data as any;
            const userId = userData.id;

            const stream = await this.apiService.getStream(twitchAuth.access_token, userId);
            const viewerCount = stream ? stream.viewer_count : 0;

            this.lastViewerCount.set(areaId, viewerCount);
            console.log(`[OnRaid] Initialized baseline viewer count: ${viewerCount}`.gray);
        } catch (error) {
            console.error(`[OnRaid] Error initializing viewer count:`.red, error);
            this.lastViewerCount.set(areaId, 0);
        }
    }

    /**
     * Check for potential raid by monitoring viewer count spikes
     */
    private async checkForRaid(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnRaid] AREA ${areaId} not found`.red);
                return;
            }

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                console.error(`[OnRaid] Twitch not connected for user ${area.user_id}`.red);
                return;
            }

            const userData = twitchAuth.provider_data as any;
            const userId = userData.id;

            const stream = await this.apiService.getStream(twitchAuth.access_token, userId);

            if (!stream) {
                // Stream is offline, reset baseline
                this.lastViewerCount.set(areaId, 0);
                return;
            }

            const currentViewers = stream.viewer_count;
            const lastViewers = this.lastViewerCount.get(areaId) || 0;
            const minimumRaiders = config.minimumRaiders || 5;

            // Detect significant viewer spike (potential raid)
            const viewerIncrease = currentViewers - lastViewers;

            if (viewerIncrease >= minimumRaiders) {
                console.log(`[OnRaid] Potential raid detected! Viewer increase: ${viewerIncrease}`.green);

                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        raider_user_id: 'unknown',
                        raider_user_login: 'unknown',
                        raider_user_name: 'Unknown Raider',
                        viewer_count: viewerIncrease,
                        detected_at: new Date().toISOString()
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnRaid] Raid trigger emitted for ~${viewerIncrease} viewers`.green);
            }

            // Update baseline (with smoothing to avoid false positives)
            this.lastViewerCount.set(areaId, currentViewers);
        } catch (error) {
            console.error(`[OnRaid] Error checking for raid:`.red, error);
        }
    }
}
