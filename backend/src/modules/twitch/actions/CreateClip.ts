import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { TwitchApiService } from '../TwitchApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to create a clip
 */
export class CreateClipAction extends BaseAction {
    private apiService: TwitchApiService;

    constructor(apiService: TwitchApiService) {
        super();
        this.apiService = apiService;
    }

    getName(): string {
        return 'create_clip';
    }

    getDescription(): string {
        return 'Create a clip of your stream';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                has_delay: {
                    type: 'boolean',
                    title: 'Has Delay',
                    description: 'Whether to add delay before capturing',
                    default: false
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether clip was created successfully' },
                id: { type: 'string', description: 'Clip ID' },
                edit_url: { type: 'string', description: 'URL to edit the clip' },
                url: { type: 'string', description: 'Public clip URL (available after processing)' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['clips:edit'];
    }

    validate(config: ActionConfig): boolean {
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[CreateClip] Executing action for user ${context.userId}`.cyan);

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                throw new Error('Twitch account not connected');
            }

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;
            const hasDelay = config.has_delay === true;

            // Create the clip
            const clip = await this.apiService.createClip(
                twitchAuth.access_token,
                broadcasterId,
                hasDelay
            );

            console.log(`[CreateClip] Clip created successfully: ${clip.id}`.green);

            return {
                success: true,
                data: {
                    success: true,
                    id: clip.id,
                    edit_url: clip.edit_url,
                    url: `https://clips.twitch.tv/${clip.id}`
                }
            };
        } catch (error) {
            console.error(`[CreateClip] Error creating clip:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create clip'
            };
        }
    }
}
