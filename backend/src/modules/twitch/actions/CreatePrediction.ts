import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { TwitchApiService } from '../TwitchApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to create a prediction in Twitch channel
 */
export class CreatePredictionAction extends BaseAction {
    private apiService: TwitchApiService;

    constructor(apiService: TwitchApiService) {
        super();
        this.apiService = apiService;
    }

    getName(): string {
        return 'create_prediction';
    }

    getDescription(): string {
        return 'Create a prediction in your Twitch channel';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['title', 'outcomes', 'prediction_window'],
            properties: {
                title: {
                    type: 'string',
                    title: 'Prediction Title',
                    description: 'Question for the prediction (max 45 chars)',
                    maxLength: 45,
                    example: 'Will I win this match?'
                },
                outcomes: {
                    type: 'array',
                    title: 'Outcomes',
                    description: 'Prediction outcomes (exactly 2 options)',
                    items: { type: 'string', maxLength: 25 },
                    minItems: 2,
                    maxItems: 2,
                    example: ['Yes', 'No']
                },
                prediction_window: {
                    type: 'number',
                    title: 'Prediction Window (seconds)',
                    description: 'Time for viewers to vote (30-1800)',
                    minimum: 30,
                    maximum: 1800,
                    default: 120,
                    example: 120
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether prediction was created' },
                prediction_id: { type: 'string', description: 'Created prediction ID' },
                title: { type: 'string', description: 'Prediction title' },
                created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['channel:manage:predictions'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.title || typeof config.title !== 'string') {
            throw new Error('Prediction title is required');
        }
        if (config.title.length > 45) {
            throw new Error('Prediction title must be 45 characters or less');
        }
        if (!Array.isArray(config.outcomes) || config.outcomes.length !== 2) {
            throw new Error('Prediction must have exactly 2 outcomes');
        }
        if (!config.prediction_window || config.prediction_window < 30 || config.prediction_window > 1800) {
            throw new Error('Prediction window must be between 30 and 1800 seconds');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[CreatePrediction] Executing action for user ${context.userId}`.cyan);

            this.validate(config);

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                throw new Error('Twitch account not connected');
            }

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;

            const result = await this.apiService.createPrediction(
                twitchAuth.access_token,
                broadcasterId,
                config.title as string,
                config.outcomes as string[],
                config.prediction_window as number
            );

            const prediction = result.data[0];

            console.log(`[CreatePrediction] Prediction created successfully: "${config.title}"`.green);

            return {
                success: true,
                data: {
                    prediction_id: prediction.id,
                    title: prediction.title,
                    created_at: new Date().toISOString()
                },
                message: `Prediction created: ${config.title}`
            };
        } catch (error) {
            console.error(`[CreatePrediction] Error creating prediction:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create prediction',
                data: {}
            };
        }
    }
}
