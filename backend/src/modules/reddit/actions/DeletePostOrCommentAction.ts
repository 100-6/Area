import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { RedditModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

/**
 * Action to delete a post or comment
 */
export class DeletePostOrCommentAction extends BaseAction {
    private redditModule: RedditModule;

    constructor(redditModule: RedditModule) {
        super();
        this.redditModule = redditModule;
    }

    getName(): string {
        return 'delete_post_or_comment';
    }

    getDescription(): string {
        return 'Delete a post or comment that you created';
    }

    getRequiredScopes(): string[] {
        return ['edit'];
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['thingId'],
            properties: {
                thingId: {
                    type: 'string',
                    title: 'Thing ID',
                    description: 'Full ID of the post or comment to delete (t1_xxx for comment, t3_xxx for post). Use {{variable}} for dynamic data.',
                    example: '{{fullname}}'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                thingId: { type: 'string', description: 'ID of the deleted thing' },
                deletedAt: { type: 'string', description: 'Timestamp when deletion occurred' }
            }
        };
    }

    validate(config: ActionConfig): boolean {
        if (!config.thingId || typeof config.thingId !== 'string') {
            throw new Error('thingId is required and must be a string');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[DeletePostOrComment] Executing for AREA ${context.areaId}`.cyan);

            const area = await Area.findById(context.areaId);
            if (!area) {
                throw new Error(`AREA ${context.areaId} not found`);
            }

            const redditAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'reddit');
            if (!redditAuth || !redditAuth.access_token) {
                throw new Error('Reddit not connected for this user');
            }

            // Replace variables
            const thingId = this.replaceVariables(config.thingId, context);

            const apiService = this.redditModule.getApiService();
            await apiService.deletePost(
                thingId,
                redditAuth.access_token
            );

            console.log(`[DeletePostOrComment] ✓ Deleted ${thingId}`.green);

            return {
                success: true,
                data: {
                    thingId: thingId,
                    deletedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error(`[DeletePostOrComment] ❌ Failed to delete:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
