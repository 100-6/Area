import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { TwitchApiService } from '../TwitchApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to send a shoutout to another broadcaster
 */
export class SendShoutoutAction extends BaseAction {
    private apiService: TwitchApiService;

    constructor(apiService: TwitchApiService) {
        super();
        this.apiService = apiService;
    }

    getName(): string {
        return 'send_shoutout';
    }

    getDescription(): string {
        return 'Send a shoutout to another broadcaster';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['to_broadcaster_login'],
            properties: {
                to_broadcaster_login: {
                    type: 'string',
                    title: 'Broadcaster Username',
                    description: 'Username of the broadcaster to shoutout (supports variables)',
                    example: 'shroud'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether shoutout was sent' },
                to_broadcaster: { type: 'string', description: 'Broadcaster who received shoutout' },
                sent_at: { type: 'string', format: 'date-time', description: 'Shoutout timestamp' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['moderator:manage:shoutouts'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.to_broadcaster_login || typeof config.to_broadcaster_login !== 'string') {
            throw new Error('Broadcaster username is required');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[SendShoutout] Executing action for user ${context.userId}`.cyan);

            this.validate(config);

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                throw new Error('Twitch account not connected');
            }

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;

            // Get target broadcaster ID from username
            const targetBroadcaster = await this.apiService.getUser(
                twitchAuth.access_token,
                undefined,
                config.to_broadcaster_login as string
            );

            await this.apiService.sendShoutout(
                twitchAuth.access_token,
                broadcasterId,
                targetBroadcaster.id,
                broadcasterId
            );

            console.log(`[SendShoutout] Shoutout sent to ${config.to_broadcaster_login}`.green);

            return {
                success: true,
                data: {
                    to_broadcaster: config.to_broadcaster_login,
                    sent_at: new Date().toISOString()
                },
                message: `Shoutout sent to ${config.to_broadcaster_login}`
            };
        } catch (error) {
            console.error(`[SendShoutout] Error sending shoutout:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send shoutout',
                data: {}
            };
        }
    }
}
