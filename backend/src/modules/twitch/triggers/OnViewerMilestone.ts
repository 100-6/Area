import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { TwitchApiService } from '../TwitchApiService';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger that fires when viewer count reaches specific milestones
 */
export class OnViewerMilestoneTrigger extends BaseTrigger {
    private apiService: TwitchApiService;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private reachedMilestones: Map<string, Set<number>> = new Map();

    constructor(apiService: TwitchApiService) {
        super();
        this.apiService = apiService;
    }

    getName(): string {
        return 'on_viewer_milestone';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when viewer count reaches specific thresholds';
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
                thresholds: {
                    type: 'array',
                    items: { type: 'number' },
                    default: [50, 100, 500, 1000],
                    description: 'Viewer count thresholds to trigger on'
                }
            },
            required: ['thresholds']
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                viewer_count: { type: 'number', description: 'Current viewer count' },
                threshold_reached: { type: 'number', description: 'Milestone threshold reached' },
                stream_id: { type: 'string', description: 'Stream ID' },
                game_name: { type: 'string', description: 'Current game/category' },
                reached_at: { type: 'string', format: 'date-time', description: 'Milestone timestamp' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const interval = config.checkInterval || 30;
        if (interval < 15 || interval > 120) {
            throw new Error('Check interval must be between 15 and 120 seconds');
        }

        if (!config.thresholds || !Array.isArray(config.thresholds) || config.thresholds.length === 0) {
            throw new Error('At least one threshold must be specified');
        }

        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnViewerMilestone] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnViewerMilestone] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        this.reachedMilestones.set(areaId, new Set());

        const checkInterval = (config.checkInterval || 30) * 1000;

        const interval = setInterval(async () => {
            await this.checkViewerMilestones(areaId, config);
        }, checkInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnViewerMilestone] Trigger started for AREA ${areaId}`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnViewerMilestone] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.reachedMilestones.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnViewerMilestone] Trigger stopped for AREA ${areaId}`.green);
    }

    private async checkViewerMilestones(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnViewerMilestone] AREA ${areaId} not found`.red);
                return;
            }

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                console.error(`[OnViewerMilestone] Twitch not connected for user ${area.user_id}`.red);
                return;
            }

            const userData = twitchAuth.provider_data as any;
            const userId = userData.id;

            const stream = await this.apiService.getStream(twitchAuth.access_token, userId);

            if (!stream) {
                // Stream offline, reset milestones for next stream
                this.reachedMilestones.set(areaId, new Set());
                return;
            }

            const viewerCount = stream.viewer_count;
            const thresholds = config.thresholds as number[];
            const reached = this.reachedMilestones.get(areaId) || new Set();

            for (const threshold of thresholds) {
                if (viewerCount >= threshold && !reached.has(threshold)) {
                    reached.add(threshold);

                    const payload: TriggerPayload = {
                        areaId,
                        triggerName: this.getName(),
                        triggerType: this.getType(),
                        timestamp: new Date().toISOString(),
                        data: {
                            viewer_count: viewerCount,
                            threshold_reached: threshold,
                            stream_id: stream.id,
                            game_name: stream.game_name,
                            reached_at: new Date().toISOString()
                        }
                    };

                    await this.emitTrigger(payload);
                    console.log(`[OnViewerMilestone] Milestone reached: ${threshold} viewers (current: ${viewerCount})`.green);
                }
            }

            this.reachedMilestones.set(areaId, reached);
        } catch (error) {
            console.error(`[OnViewerMilestone] Error checking viewer milestones:`.red, error);
        }
    }
}
