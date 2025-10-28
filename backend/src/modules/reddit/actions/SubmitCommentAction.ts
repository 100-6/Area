import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { RedditModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

/**
 * Action to submit a comment on a Reddit post
 */
export class SubmitCommentAction extends BaseAction {
    private redditModule: RedditModule;

    constructor(redditModule: RedditModule) {
        super();
        this.redditModule = redditModule;
    }

    getName(): string {
        return 'submit_comment';
    }

    getDescription(): string {
        return 'Submit a comment on a Reddit post';
    }

    getRequiredScopes(): string[] {
        return ['submit'];
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['postId', 'text'],
            properties: {
                postId: {
                    type: 'string',
                    title: 'Post ID',
                    description: 'Full Reddit post ID (t3_xxx) or just the ID. Use {{fullname}} or {{id}}.',
                    example: '{{fullname}}'
                },
                text: {
                    type: 'string',
                    title: 'Comment Text',
                    description: 'Text of the comment. Use {{variable}} for dynamic data.',
                    example: 'Great post about {{title}}!'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                commentId: { type: 'string', description: 'ID of the created comment' }
            }
        };
    }

    validate(config: ActionConfig): boolean {
        if (!config.postId || typeof config.postId !== 'string') {
            throw new Error('postId is required and must be a string');
        }
        if (!config.text || typeof config.text !== 'string') {
            throw new Error('text is required and must be a string');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[SubmitComment] Executing for AREA ${context.areaId}`.cyan);

            const area = await Area.findById(context.areaId);
            if (!area) {
                throw new Error(`AREA ${context.areaId} not found`);
            }

            const redditAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'reddit');
            if (!redditAuth || !redditAuth.access_token) {
                throw new Error('Reddit not connected for this user');
            }

            // Replace variables
            let postId = this.replaceVariables(config.postId, context);
            const text = this.replaceVariables(config.text, context);

            // Ensure postId has t3_ prefix
            if (!postId.startsWith('t3_')) {
                postId = `t3_${postId}`;
            }

            const apiService = this.redditModule.getApiService();
            const result = await apiService.submitComment(
                postId,
                text,
                redditAuth.access_token
            );

            console.log(`[Reddit] ✓ Comment submitted on post ${postId}`.green);

            return {
                success: true,
                data: {
                    commentId: result.json?.data?.things?.[0]?.data?.id || ''
                }
            };
        } catch (error) {
            console.error(`[SubmitComment] ❌ Failed to submit comment:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
