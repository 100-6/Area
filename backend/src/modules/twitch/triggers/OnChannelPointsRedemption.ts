import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { TwitchApiService } from '../TwitchApiService';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger that fires when viewers redeem channel points rewards
 */
export class OnChannelPointsRedemptionTrigger extends BaseTrigger {
    private apiService: TwitchApiService;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private processedRedemptions: Map<string, Set<string>> = new Map();

    constructor(apiService: TwitchApiService) {
        super();
        this.apiService = apiService;
    }

    getName(): string {
        return 'on_channel_points_redemption';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when someone redeems a channel points reward';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                checkInterval: {
                    type: 'number',
                    default: 20,
                    minimum: 10,
                    maximum: 120,
                    description: 'Check interval in seconds (10-120)'
                },
                rewardId: {
                    type: 'string',
                    description: 'Specific reward ID to monitor (optional, leave empty for all rewards)'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                redemption_id: { type: 'string', description: 'Redemption ID' },
                user_id: { type: 'string', description: 'User who redeemed' },
                user_login: { type: 'string', description: 'User login name' },
                user_name: { type: 'string', description: 'User display name' },
                user_input: { type: 'string', description: 'User input text (if required)' },
                reward_id: { type: 'string', description: 'Reward ID' },
                reward_title: { type: 'string', description: 'Reward title' },
                reward_cost: { type: 'number', description: 'Reward cost in channel points' },
                redeemed_at: { type: 'string', format: 'date-time', description: 'Redemption timestamp' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const interval = config.checkInterval || 20;
        if (interval < 10 || interval > 120) {
            throw new Error('Check interval must be between 10 and 120 seconds');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnChannelPointsRedemption] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnChannelPointsRedemption] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        this.processedRedemptions.set(areaId, new Set());

        const checkInterval = (config.checkInterval || 20) * 1000;

        const interval = setInterval(async () => {
            await this.checkForRedemptions(areaId, config);
        }, checkInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnChannelPointsRedemption] Trigger started for AREA ${areaId}`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnChannelPointsRedemption] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.processedRedemptions.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnChannelPointsRedemption] Trigger stopped for AREA ${areaId}`.green);
    }

    private async checkForRedemptions(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnChannelPointsRedemption] AREA ${areaId} not found`.red);
                return;
            }

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                console.error(`[OnChannelPointsRedemption] Twitch not connected for user ${area.user_id}`.red);
                return;
            }

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;
            const rewardId = config.rewardId as string | undefined;

            const result = await this.apiService.getCustomRewardRedemptions(
                twitchAuth.access_token,
                broadcasterId,
                rewardId,
                'UNFULFILLED',
                50
            );

            const processed = this.processedRedemptions.get(areaId) || new Set();

            for (const redemption of result.data) {
                if (!processed.has(redemption.id)) {
                    processed.add(redemption.id);

                    const payload: TriggerPayload = {
                        areaId,
                        triggerName: this.getName(),
                        triggerType: this.getType(),
                        timestamp: new Date().toISOString(),
                        data: {
                            redemption_id: redemption.id,
                            user_id: redemption.user_id,
                            user_login: redemption.user_login,
                            user_name: redemption.user_name,
                            user_input: redemption.user_input || '',
                            reward_id: redemption.reward.id,
                            reward_title: redemption.reward.title,
                            reward_cost: redemption.reward.cost,
                            redeemed_at: redemption.redeemed_at
                        }
                    };

                    await this.emitTrigger(payload);
                    console.log(`[OnChannelPointsRedemption] New redemption: ${redemption.user_name} redeemed "${redemption.reward.title}"`.green);
                }
            }

            // Keep only recent redemptions in memory (max 1000)
            if (processed.size > 1000) {
                const array = Array.from(processed);
                this.processedRedemptions.set(areaId, new Set(array.slice(-500)));
            } else {
                this.processedRedemptions.set(areaId, processed);
            }
        } catch (error) {
            console.error(`[OnChannelPointsRedemption] Error checking for redemptions:`.red, error);
        }
    }
}
