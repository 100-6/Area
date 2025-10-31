import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { TwitchApiService } from '../TwitchApiService';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger that fires when someone subscribes to the channel
 *
 * Note: Real-time subscription detection requires EventSub webhooks.
 * This polling implementation detects new subscribers by checking the subscriber list.
 */
export class OnSubscriptionTrigger extends BaseTrigger {
    private apiService: TwitchApiService;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownSubIds: Map<string, Set<string>> = new Map();

    constructor(apiService: TwitchApiService) {
        super();
        this.apiService = apiService;
    }

    getName(): string {
        return 'on_subscription';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when someone subscribes to your channel';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                checkInterval: {
                    type: 'number',
                    default: 60,
                    minimum: 30,
                    maximum: 300,
                    description: 'Check interval in seconds (30-300)'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                subscriber_user_id: { type: 'string', description: 'Subscriber user ID' },
                subscriber_user_login: { type: 'string', description: 'Subscriber login name' },
                subscriber_user_name: { type: 'string', description: 'Subscriber display name' },
                tier: { type: 'string', description: 'Subscription tier (1000/2000/3000)' },
                is_gift: { type: 'boolean', description: 'Whether subscription is a gift' },
                subscribed_at: { type: 'string', format: 'date-time', description: 'Subscription timestamp' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const interval = config.checkInterval || 60;
        if (interval < 30 || interval > 300) {
            throw new Error('Check interval must be between 30 and 300 seconds');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnSubscription] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnSubscription] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        await this.initializeSubscribers(areaId);

        const checkInterval = (config.checkInterval || 60) * 1000;

        const interval = setInterval(async () => {
            await this.checkForNewSubscribers(areaId);
        }, checkInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnSubscription] Trigger started for AREA ${areaId}`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnSubscription] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownSubIds.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnSubscription] Trigger stopped for AREA ${areaId}`.green);
    }

    private async initializeSubscribers(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) return;

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;

            const result = await this.apiService.getSubscriptions(twitchAuth.access_token, broadcasterId, 100);
            const subIds = new Set(result.data.map(s => s.user_id));

            this.lastKnownSubIds.set(areaId, subIds);
            console.log(`[OnSubscription] Initialized with ${subIds.size} existing subscribers`.gray);
        } catch (error) {
            console.error(`[OnSubscription] Error initializing subscribers:`.red, error);
            this.lastKnownSubIds.set(areaId, new Set());
        }
    }

    private async checkForNewSubscribers(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnSubscription] AREA ${areaId} not found`.red);
                return;
            }

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                console.error(`[OnSubscription] Twitch not connected for user ${area.user_id}`.red);
                return;
            }

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;

            const result = await this.apiService.getSubscriptions(twitchAuth.access_token, broadcasterId, 100);
            const currentSubIds = new Set(result.data.map(s => s.user_id));

            const lastKnownIds = this.lastKnownSubIds.get(areaId) || new Set();

            const newSubscribers = result.data.filter(s => !lastKnownIds.has(s.user_id));

            for (const subscriber of newSubscribers) {
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        subscriber_user_id: subscriber.user_id,
                        subscriber_user_login: subscriber.user_login,
                        subscriber_user_name: subscriber.user_name,
                        tier: subscriber.tier,
                        is_gift: subscriber.is_gift,
                        subscribed_at: new Date().toISOString()
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnSubscription] New subscriber: ${subscriber.user_name} (Tier ${subscriber.tier})`.green);
            }

            this.lastKnownSubIds.set(areaId, currentSubIds);
        } catch (error) {
            console.error(`[OnSubscription] Error checking for new subscribers:`.red, error);
        }
    }
}
