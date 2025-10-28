import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { RedditModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

/**
 * Action to set flair on a post
 */
export class SetFlairAction extends BaseAction {
    private redditModule: RedditModule;

    constructor(redditModule: RedditModule) {
        super();
        this.redditModule = redditModule;
    }

    getName(): string {
        return 'set_flair';
    }

    getDescription(): string {
        return 'Set flair on a post in a subreddit';
    }

    getRequiredScopes(): string[] {
        return ['flair'];
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['subreddit', 'postId', 'flairText'],
            properties: {
                subreddit: {
                    type: 'string',
                    title: 'Subreddit',
                    description: 'Subreddit name (without r/). Use {{variable}} for dynamic data.',
                    example: '{{subreddit}}'
                },
                postId: {
                    type: 'string',
                    title: 'Post ID',
                    description: 'Full post ID (t3_xxx). Use {{variable}} for dynamic data.',
                    example: '{{fullname}}'
                },
                flairText: {
                    type: 'string',
                    title: 'Flair Text',
                    description: 'Text for the flair. Use {{variable}} for dynamic data.',
                    example: 'Discussion'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                postId: { type: 'string', description: 'ID of the post' },
                subreddit: { type: 'string', description: 'Subreddit name' },
                flairText: { type: 'string', description: 'Flair text that was set' },
                setAt: { type: 'string', description: 'Timestamp when flair was set' }
            }
        };
    }

    validate(config: ActionConfig): boolean {
        if (!config.subreddit || typeof config.subreddit !== 'string') {
            throw new Error('subreddit is required and must be a string');
        }
        if (!config.postId || typeof config.postId !== 'string') {
            throw new Error('postId is required and must be a string');
        }
        if (!config.flairText || typeof config.flairText !== 'string') {
            throw new Error('flairText is required and must be a string');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[SetFlair] Executing for AREA ${context.areaId}`.cyan);

            const area = await Area.findById(context.areaId);
            if (!area) {
                throw new Error(`AREA ${context.areaId} not found`);
            }

            const redditAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'reddit');
            if (!redditAuth || !redditAuth.access_token) {
                throw new Error('Reddit not connected for this user');
            }

            // Replace variables
            const subreddit = this.replaceVariables(config.subreddit, context);
            const postId = this.replaceVariables(config.postId, context);
            const flairText = this.replaceVariables(config.flairText, context);

            const apiService = this.redditModule.getApiService();
            await apiService.setFlair(
                subreddit,
                postId,
                flairText,
                redditAuth.access_token
            );

            console.log(`[SetFlair] ✓ Set flair "${flairText}" on post ${postId} in r/${subreddit}`.green);

            return {
                success: true,
                data: {
                    postId: postId,
                    subreddit: subreddit,
                    flairText: flairText,
                    setAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error(`[SetFlair] ❌ Failed to set flair:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
