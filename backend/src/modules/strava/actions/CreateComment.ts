import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { StravaModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to create a comment on a Strava activity
 */
export class CreateCommentAction extends BaseAction {
    private stravaModule: StravaModule;

    constructor(stravaModule: StravaModule) {
        super();
        this.stravaModule = stravaModule;
    }

    getName(): string {
        return 'create_comment';
    }

    getDescription(): string {
        return 'Create a comment on a Strava activity';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['activityId', 'text'],
            properties: {
                activityId: {
                    type: 'number',
                    title: 'Activity ID',
                    description: 'ID of the activity to comment on'
                },
                text: {
                    type: 'string',
                    title: 'Comment Text',
                    description: 'The comment text to post'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether the comment was created successfully' },
                message: { type: 'string', description: 'Status message' },
                activityId: { type: 'number', description: 'ID of the activity' },
                commentText: { type: 'string', description: 'The comment text that was posted' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['activity:write'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.activityId || typeof config.activityId !== 'number') {
            throw new Error('Activity ID is required and must be a number');
        }
        if (!config.text || typeof config.text !== 'string' || config.text.trim() === '') {
            throw new Error('Comment text is required and must be non-empty');
        }
        return true;
    }

    /**
     * Execute the create comment action
     * @param config - Action configuration
     * @param context - Execution context with trigger data and previous outputs
     * @returns Action result with success status
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[CreateComment] Executing action for user ${context.userId}`.cyan);

            // Get user's Strava access token
            const stravaAuth = await UserAuthProvider.findByUserAndProvider(
                context.userId,
                'strava'
            );

            if (!stravaAuth || !stravaAuth.access_token) {
                throw new Error('Strava not connected. Please authenticate with Strava.');
            }

            const accessToken = stravaAuth.access_token;
            const apiService = this.stravaModule.getApiService();

            const activityId = config.activityId as number;
            const commentText = this.replaceVariables(config.text, context);

            // Create comment
            await apiService.createComment(accessToken, activityId, commentText);

            console.log(`[CreateComment] ✅ Successfully created comment on activity ${activityId}`.green);

            return {
                success: true,
                data: {
                    success: true,
                    message: 'Successfully created comment',
                    activityId: activityId,
                    commentText: commentText
                }
            };
        } catch (error: any) {
            console.error(`[CreateComment] ❌ Error:`.red, error);
            return {
                success: false,
                error: error.message || 'Failed to create comment'
            };
        }
    }
}
