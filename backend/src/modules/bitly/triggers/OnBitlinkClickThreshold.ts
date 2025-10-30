import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { BitlyModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

type ClickSummaryUnit = 'minute' | 'hour' | 'day' | 'week' | 'month';

interface BitlinkClickThresholdConfig extends TriggerConfig {
    bitlink: string;
    threshold: number;
    pollingInterval?: number;
    unit?: ClickSummaryUnit;
}

/**
 * Trigger that fires when a Bitly link reaches a click threshold
 */
export class OnBitlinkClickThresholdTrigger extends BaseTrigger {
    private bitlyModule: BitlyModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastClickCounts: Map<string, number> = new Map();
    private targetBitlinks: Map<string, string> = new Map();
    private areaUsers: Map<string, string> = new Map();
    private thresholds: Map<string, number> = new Map();
    private units: Map<string, ClickSummaryUnit> = new Map();

    constructor(bitlyModule: BitlyModule) {
        super();
        this.bitlyModule = bitlyModule;
    }

    getName(): string {
        return 'on_bitlink_click_threshold';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a Bitly link reaches the specified click threshold';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['bitlink', 'threshold'],
            properties: {
                bitlink: {
                    type: 'string',
                    title: 'Bitlink',
                    description: 'Bitly link to monitor (format: bit.ly/abc123 or custom domain)',
                    example: 'bit.ly/abc123'
                },
                threshold: {
                    type: 'number',
                    title: 'Click threshold',
                    description: 'Number of clicks that will trigger the reaction',
                    minimum: 1,
                    example: 100
                },
                unit: {
                    type: 'string',
                    title: 'Aggregation unit',
                    description: 'Time unit for click aggregation',
                    enum: ['minute', 'hour', 'day', 'week', 'month'],
                    default: 'day'
                },
                pollingInterval: {
                    type: 'number',
                    title: 'Polling interval (ms)',
                    description: 'How often to check click statistics (minimum 60 seconds)',
                    default: 300000,
                    minimum: 60000
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                bitlink: { type: 'string', description: 'Bitlink being monitored' },
                threshold: { type: 'number', description: 'Configured threshold' },
                totalClicks: { type: 'number', description: 'Total number of clicks detected' },
                previousClicks: { type: 'number', description: 'Click count from previous check' },
                reachedAt: { type: 'string', format: 'date-time', description: 'Timestamp when threshold was reached' },
                unit: { type: 'string', description: 'Aggregation unit used for the summary' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const typed = config as BitlinkClickThresholdConfig;
        if (!typed.bitlink || typeof typed.bitlink !== 'string' || typed.bitlink.trim() === '') {
            throw new Error('bitlink is required');
        }
        if (!typed.threshold || typeof typed.threshold !== 'number' || typed.threshold < 1) {
            throw new Error('threshold must be a positive number');
        }
        if (typed.pollingInterval && typed.pollingInterval < 60000) {
            throw new Error('Polling interval must be at least 60 seconds (60000ms)');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[Bitly:ClickThreshold] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[Bitly:ClickThreshold] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);

        const typed = config as BitlinkClickThresholdConfig;
        const normalizedBitlink = this.normalizeBitlink(typed.bitlink);
        const pollingInterval = typed.pollingInterval || 300000;
        const unit = typed.unit || 'day';

        try {
            const area = await Area.findById(areaId);
            if (!area) {
                throw new Error(`AREA ${areaId} not found`);
            }

            this.areaUsers.set(areaId, area.user_id);
            this.targetBitlinks.set(areaId, normalizedBitlink);
            this.thresholds.set(areaId, typed.threshold);
            this.units.set(areaId, unit);

            const bitlyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'bitly');
            if (!bitlyAuth || !bitlyAuth.access_token) {
                throw new Error(`Bitly not connected for user ${area.user_id}`);
            }

            const apiService = this.bitlyModule.getApiService();
            const summary = await apiService.getBitlinkClickSummary(bitlyAuth.access_token, normalizedBitlink, unit, -1);
            this.lastClickCounts.set(areaId, summary.total_clicks || 0);

            const interval = setInterval(async () => {
                await this.checkThreshold(areaId);
            }, pollingInterval);

            this.pollingIntervals.set(areaId, interval);
            this.isRunning = true;
            console.log(`[Bitly:ClickThreshold] Trigger started for AREA ${areaId} (interval ${pollingInterval}ms)`.green);
        } catch (error) {
            console.error(`[Bitly:ClickThreshold] Failed to start trigger for AREA ${areaId}:`.red, error);
            this.isRunning = false;
            throw error;
        }
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[Bitly:ClickThreshold] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
        }

        this.pollingIntervals.delete(areaId);
        this.lastClickCounts.delete(areaId);
        this.targetBitlinks.delete(areaId);
        this.areaUsers.delete(areaId);
        this.thresholds.delete(areaId);
        this.units.delete(areaId);

        if (this.pollingIntervals.size === 0) {
            this.isRunning = false;
        }

        console.log(`[Bitly:ClickThreshold] Trigger stopped for AREA ${areaId}`.green);
    }

    private async checkThreshold(areaId: string): Promise<void> {
        const userId = this.areaUsers.get(areaId);
        const bitlink = this.targetBitlinks.get(areaId);
        const threshold = this.thresholds.get(areaId);
        const unit = this.units.get(areaId) || 'day';

        if (!userId || !bitlink || threshold === undefined) {
            console.warn(`[Bitly:ClickThreshold] Missing configuration for AREA ${areaId}, stopping trigger`.yellow);
            await this.stop(areaId);
            return;
        }

        try {
            const bitlyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'bitly');
            if (!bitlyAuth || !bitlyAuth.access_token) {
                console.warn(`[Bitly:ClickThreshold] Bitly not connected for user ${userId}, stopping trigger`.yellow);
                await this.stop(areaId);
                return;
            }

            const apiService = this.bitlyModule.getApiService();
            const summary = await apiService.getBitlinkClickSummary(bitlyAuth.access_token, bitlink, unit, -1);
            const totalClicks = summary.total_clicks || 0;
            const previousClicks = this.lastClickCounts.get(areaId) ?? 0;

            if (previousClicks < threshold && totalClicks >= threshold) {
                console.log(`[Bitly:ClickThreshold] Threshold reached for ${bitlink}: ${totalClicks} clicks`.green);
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        bitlink,
                        threshold,
                        totalClicks,
                        previousClicks,
                        reachedAt: new Date().toISOString(),
                        unit
                    }
                };
                await this.emitTrigger(payload);
            }

            this.lastClickCounts.set(areaId, totalClicks);
        } catch (error) {
            console.error(`[Bitly:ClickThreshold] Error while checking threshold (AREA ${areaId}):`.red, error);
        }
    }

    private normalizeBitlink(bitlink: string): string {
        const trimmed = bitlink.trim();
        if (trimmed.includes('/')) {
            return trimmed.replace(/^https?:\/\//i, '');
        }
        // Default to bit.ly domain if only hash provided
        return `bit.ly/${trimmed}`;
    }
}
