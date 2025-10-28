import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { RedditModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

/**
 * Action to save a Reddit post
 */
export class SavePostAction extends BaseAction {
    private redditModule: RedditModule;

    constructor(redditModule: RedditModule) {
        super();
        this.redditModule = redditModule;
    }

    getName(): string {
        return 'save_post';
    }

    getDescription(): string {
        return 'Save a Reddit post to your saved posts';
    }

    getRequiredScopes(): string[] {
        return ['save'];
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['postId'],
            properties: {
                postId: {
                    type: 'string',
                    title: 'Post ID',
                    description: 'Full Reddit post ID (t3_xxx) or just the ID. Use {{fullname}} or {{id}}.',
                    example: '{{fullname}}'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                saved: { type: 'boolean', description: 'Whether the post was saved successfully' }
            }
        };
    }

    validate(config: ActionConfig): boolean {
        if (!config.postId || typeof config.postId !== 'string') {
            throw new Error('postId is required and must be a string');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[SavePost] Executing for AREA ${context.areaId}`.cyan);

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

            // Ensure postId has t3_ prefix
            if (!postId.startsWith('t3_')) {
                postId = `t3_${postId}`;
            }

            const apiService = this.redditModule.getApiService();
            await apiService.savePost(postId, redditAuth.access_token);

            console.log(`[Reddit] ✓ Post ${postId} saved`.green);

            return {
                success: true,
                data: {
                    saved: true
                }
            };
        } catch (error) {
            console.error(`[SavePost] ❌ Failed to save post:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
