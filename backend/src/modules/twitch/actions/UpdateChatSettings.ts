import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { TwitchApiService } from '../TwitchApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to update chat settings
 */
export class UpdateChatSettingsAction extends BaseAction {
    private apiService: TwitchApiService;

    constructor(apiService: TwitchApiService) {
        super();
        this.apiService = apiService;
    }

    getName(): string {
        return 'update_chat_settings';
    }

    getDescription(): string {
        return 'Update chat moderation settings';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                slow_mode: {
                    type: 'boolean',
                    title: 'Slow Mode',
                    description: 'Enable slow mode',
                    default: false
                },
                slow_mode_wait_time: {
                    type: 'number',
                    title: 'Slow Mode Wait (seconds)',
                    description: 'Seconds between messages (3-120)',
                    minimum: 3,
                    maximum: 120,
                    default: 30
                },
                follower_mode: {
                    type: 'boolean',
                    title: 'Follower Only Mode',
                    description: 'Require users to follow before chatting',
                    default: false
                },
                follower_mode_duration: {
                    type: 'number',
                    title: 'Follower Duration (minutes)',
                    description: 'Minutes following required (0-129600)',
                    minimum: 0,
                    maximum: 129600,
                    default: 0
                },
                subscriber_mode: {
                    type: 'boolean',
                    title: 'Subscriber Only Mode',
                    description: 'Only subscribers can chat',
                    default: false
                },
                emote_mode: {
                    type: 'boolean',
                    title: 'Emote Only Mode',
                    description: 'Only emotes allowed in chat',
                    default: false
                },
                unique_chat_mode: {
                    type: 'boolean',
                    title: 'Unique Chat Mode (R9K)',
                    description: 'Prevent duplicate messages',
                    default: false
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether settings were updated' },
                settings: { type: 'object', description: 'Applied settings' },
                updated_at: { type: 'string', format: 'date-time', description: 'Update timestamp' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['moderator:manage:chat_settings'];
    }

    validate(config: ActionConfig): boolean {
        if (config.slow_mode_wait_time !== undefined) {
            const waitTime = config.slow_mode_wait_time as number;
            if (waitTime < 3 || waitTime > 120) {
                throw new Error('Slow mode wait time must be between 3 and 120 seconds');
            }
        }
        if (config.follower_mode_duration !== undefined) {
            const duration = config.follower_mode_duration as number;
            if (duration < 0 || duration > 129600) {
                throw new Error('Follower mode duration must be between 0 and 129600 minutes');
            }
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[UpdateChatSettings] Executing action for user ${context.userId}`.cyan);

            this.validate(config);

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                throw new Error('Twitch account not connected');
            }

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;

            const settings: any = {};
            if (config.slow_mode !== undefined) settings.slow_mode = config.slow_mode;
            if (config.slow_mode_wait_time !== undefined) settings.slow_mode_wait_time = config.slow_mode_wait_time;
            if (config.follower_mode !== undefined) settings.follower_mode = config.follower_mode;
            if (config.follower_mode_duration !== undefined) settings.follower_mode_duration = config.follower_mode_duration;
            if (config.subscriber_mode !== undefined) settings.subscriber_mode = config.subscriber_mode;
            if (config.emote_mode !== undefined) settings.emote_mode = config.emote_mode;
            if (config.unique_chat_mode !== undefined) settings.unique_chat_mode = config.unique_chat_mode;

            await this.apiService.updateChatSettings(
                twitchAuth.access_token,
                broadcasterId,
                broadcasterId,
                settings
            );

            console.log(`[UpdateChatSettings] Chat settings updated`.green);

            return {
                success: true,
                data: {
                    settings: settings,
                    updated_at: new Date().toISOString()
                },
                message: 'Chat settings updated successfully'
            };
        } catch (error) {
            console.error(`[UpdateChatSettings] Error updating chat settings:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update chat settings',
                data: {}
            };
        }
    }
}
