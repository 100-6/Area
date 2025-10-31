import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { TwitchApiService } from '../TwitchApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to ban or timeout a user
 */
export class BanUserAction extends BaseAction {
    private apiService: TwitchApiService;

    constructor(apiService: TwitchApiService) {
        super();
        this.apiService = apiService;
    }

    getName(): string {
        return 'ban_user';
    }

    getDescription(): string {
        return 'Ban or timeout a user in your channel';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['username'],
            properties: {
                username: {
                    type: 'string',
                    title: 'Username',
                    description: 'Username to ban/timeout (supports variables)',
                    example: 'baduser123'
                },
                duration: {
                    type: 'number',
                    title: 'Duration (seconds)',
                    description: 'Timeout duration (1-1209600). 0 or empty = permanent ban',
                    minimum: 0,
                    maximum: 1209600,
                    default: 600,
                    example: 600
                },
                reason: {
                    type: 'string',
                    title: 'Reason',
                    description: 'Ban/timeout reason (optional)',
                    maxLength: 500,
                    example: 'Violated chat rules'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether ban was applied' },
                username: { type: 'string', description: 'Banned username' },
                duration: { type: 'number', description: 'Ban duration (0 = permanent)' },
                applied_at: { type: 'string', format: 'date-time', description: 'Ban timestamp' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['moderator:manage:banned_users'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.username || typeof config.username !== 'string') {
            throw new Error('Username is required');
        }
        if (config.duration && (config.duration < 0 || config.duration > 1209600)) {
            throw new Error('Duration must be between 0 and 1209600 seconds');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[BanUser] Executing action for user ${context.userId}`.cyan);

            this.validate(config);

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                throw new Error('Twitch account not connected');
            }

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;

            // Get target user ID from username
            const targetUser = await this.apiService.getUser(
                twitchAuth.access_token,
                undefined,
                config.username as string
            );

            const duration = config.duration as number || 0;
            const reason = config.reason as string || undefined;

            await this.apiService.banUser(
                twitchAuth.access_token,
                broadcasterId,
                broadcasterId,
                targetUser.id,
                reason,
                duration > 0 ? duration : undefined
            );

            const action = duration > 0 ? `timed out for ${duration}s` : 'banned permanently';
            console.log(`[BanUser] User ${config.username} ${action}`.green);

            return {
                success: true,
                data: {
                    username: config.username,
                    duration: duration,
                    applied_at: new Date().toISOString()
                },
                message: `User ${config.username} ${action}`
            };
        } catch (error) {
            console.error(`[BanUser] Error banning user:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to ban user',
                data: {}
            };
        }
    }
}
