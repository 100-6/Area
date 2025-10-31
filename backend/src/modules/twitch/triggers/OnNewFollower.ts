import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { TwitchApiService } from '../TwitchApiService';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';
import { consoleModule } from '@/modules/console/service';

/**
 * Trigger that fires when someone follows the channel
 * Uses polling to check for new followers
 */
export class OnNewFollowerTrigger extends BaseTrigger {
    private apiService: TwitchApiService;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownFollowerIds: Map<string, Set<string>> = new Map();

    constructor(apiService: TwitchApiService) {
        super();
        this.apiService = apiService;
    }

    getName(): string {
        return 'on_new_follower';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when someone follows your Twitch channel';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                checkInterval: {
                    type: 'number',
                    default: 120,
                    minimum: 60,
                    maximum: 600,
                    description: 'Check interval in seconds (60-600)'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                follower_user_id: { type: 'string', description: 'Follower user ID' },
                follower_user_login: { type: 'string', description: 'Follower login name' },
                follower_user_name: { type: 'string', description: 'Follower display name' },
                followed_at: { type: 'string', format: 'date-time', description: 'Follow timestamp' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const interval = config.checkInterval || 120;
        if (interval < 60 || interval > 600) {
            throw new Error('Check interval must be between 60 and 600 seconds');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnNewFollower] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnNewFollower] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        // Initialize with current followers
        await this.initializeFollowers(areaId);

        const checkInterval = (config.checkInterval || 120) * 1000;

        const interval = setInterval(async () => {
            await this.checkForNewFollowers(areaId);
        }, checkInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnNewFollower] Trigger started for AREA ${areaId} with interval ${checkInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnNewFollower] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownFollowerIds.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnNewFollower] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialize with current followers to avoid triggering on existing followers
     */
    private async initializeFollowers(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) return;

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;

            const result = await this.apiService.getFollowers(twitchAuth.access_token, broadcasterId, 100);
            const followerIds = new Set(result.data.map(f => f.user_id));

            this.lastKnownFollowerIds.set(areaId, followerIds);
            console.log(`[OnNewFollower] Initialized with ${followerIds.size} existing followers`.gray);
        } catch (error) {
            console.error(`[OnNewFollower] Error initializing followers:`.red, error);
            this.lastKnownFollowerIds.set(areaId, new Set());
        }
    }

    /**
     * Check for new followers
     */
    private async checkForNewFollowers(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnNewFollower] AREA ${areaId} not found`.red);
                return;
            }

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                console.error(`[OnNewFollower] Twitch not connected for user ${area.user_id}`.red);
                return;
            }

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;

            console.log(`[OnNewFollower] Checking for new followers for AREA ${areaId}`.gray);

            const result = await this.apiService.getFollowers(twitchAuth.access_token, broadcasterId, 100);
            const currentFollowerIds = new Set(result.data.map(f => f.user_id));

            const lastKnownIds = this.lastKnownFollowerIds.get(areaId) || new Set();

            // Find new followers
            const newFollowers = result.data.filter(f => !lastKnownIds.has(f.user_id));

            // Emit trigger for each new follower
            for (const follower of newFollowers) {
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        follower_user_id: follower.user_id,
                        follower_user_login: follower.user_login,
                        follower_user_name: follower.user_name,
                        followed_at: follower.followed_at
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnNewFollower] New follower: ${follower.user_name}`.green);
            }

            // Update last known followers
            this.lastKnownFollowerIds.set(areaId, currentFollowerIds);
        } catch (error) {
            console.error(`[OnNewFollower] Error checking for new followers:`.red, error);
        }
    }
}
