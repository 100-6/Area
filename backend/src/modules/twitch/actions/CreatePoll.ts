import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { TwitchApiService } from '../TwitchApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to create a poll in Twitch channel
 */
export class CreatePollAction extends BaseAction {
    private apiService: TwitchApiService;

    constructor(apiService: TwitchApiService) {
        super();
        this.apiService = apiService;
    }

    getName(): string {
        return 'create_poll';
    }

    getDescription(): string {
        return 'Create a poll in your Twitch channel';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['title', 'choices', 'duration'],
            properties: {
                title: {
                    type: 'string',
                    title: 'Poll Title',
                    description: 'Question for the poll (max 60 chars)',
                    maxLength: 60,
                    example: 'What game should we play next?'
                },
                choices: {
                    type: 'array',
                    title: 'Choices',
                    description: 'Poll choices (2-5 options)',
                    items: { type: 'string', maxLength: 25 },
                    minItems: 2,
                    maxItems: 5,
                    example: ['Game A', 'Game B', 'Game C']
                },
                duration: {
                    type: 'number',
                    title: 'Duration (seconds)',
                    description: 'Poll duration in seconds (15-1800)',
                    minimum: 15,
                    maximum: 1800,
                    default: 60,
                    example: 60
                },
                bits_voting_enabled: {
                    type: 'boolean',
                    title: 'Enable Bits Voting',
                    description: 'Allow viewers to use bits for votes',
                    default: false
                },
                bits_per_vote: {
                    type: 'number',
                    title: 'Bits Per Vote',
                    description: 'Bits required per vote (if enabled)',
                    minimum: 1,
                    maximum: 10000,
                    default: 10
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether poll was created' },
                poll_id: { type: 'string', description: 'Created poll ID' },
                title: { type: 'string', description: 'Poll title' },
                created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['channel:manage:polls'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.title || typeof config.title !== 'string') {
            throw new Error('Poll title is required');
        }
        if (config.title.length > 60) {
            throw new Error('Poll title must be 60 characters or less');
        }
        if (!Array.isArray(config.choices) || config.choices.length < 2 || config.choices.length > 5) {
            throw new Error('Poll must have 2-5 choices');
        }
        if (!config.duration || config.duration < 15 || config.duration > 1800) {
            throw new Error('Poll duration must be between 15 and 1800 seconds');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[CreatePoll] Executing action for user ${context.userId}`.cyan);

            this.validate(config);

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                throw new Error('Twitch account not connected');
            }

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;

            const result = await this.apiService.createPoll(
                twitchAuth.access_token,
                broadcasterId,
                config.title as string,
                config.choices as string[],
                config.duration as number,
                config.bits_voting_enabled as boolean || false,
                config.bits_per_vote as number || 10
            );

            const poll = result.data[0];

            console.log(`[CreatePoll] Poll created successfully: "${config.title}"`.green);

            return {
                success: true,
                data: {
                    poll_id: poll.id,
                    title: poll.title,
                    created_at: new Date().toISOString()
                },
                message: `Poll created: ${config.title}`
            };
        } catch (error) {
            console.error(`[CreatePoll] Error creating poll:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create poll',
                data: {}
            };
        }
    }
}
