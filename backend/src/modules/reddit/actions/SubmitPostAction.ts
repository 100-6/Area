import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { RedditModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

/**
 * Action to submit a post to a subreddit
 */
export class SubmitPostAction extends BaseAction {
    private redditModule: RedditModule;

    constructor(redditModule: RedditModule) {
        super();
        this.redditModule = redditModule;
    }

    getName(): string {
        return 'submit_post';
    }

    getDescription(): string {
        return 'Submit a text post to a subreddit';
    }

    getRequiredScopes(): string[] {
        return ['submit'];
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['subreddit', 'title', 'text'],
            properties: {
                subreddit: {
                    type: 'string',
                    title: 'Subreddit',
                    description: 'Subreddit name (without r/)',
                    example: 'test'
                },
                title: {
                    type: 'string',
                    title: 'Post Title',
                    description: 'Title of the post. Use {{variable}} for dynamic data.',
                    example: 'New post about {{title}}'
                },
                text: {
                    type: 'string',
                    title: 'Post Text',
                    description: 'Text content of the post. Use {{variable}} for dynamic data.',
                    example: 'This is about: {{selftext}}'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                postId: { type: 'string', description: 'ID of the created post' },
                url: { type: 'string', description: 'URL of the created post' }
            }
        };
    }

    validate(config: ActionConfig): boolean {
        if (!config.subreddit || typeof config.subreddit !== 'string') {
            throw new Error('subreddit is required and must be a string');
        }
        if (!config.title || typeof config.title !== 'string') {
            throw new Error('title is required and must be a string');
        }
        if (!config.text || typeof config.text !== 'string') {
            throw new Error('text is required and must be a string');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[SubmitPost] Executing for AREA ${context.areaId}`.cyan);

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
            const title = this.replaceVariables(config.title, context);
            const text = this.replaceVariables(config.text, context);

            const apiService = this.redditModule.getApiService();
            const result = await apiService.submitPost(
                subreddit,
                title,
                text,
                redditAuth.access_token
            );

            console.log(`[Reddit] ✓ Post submitted to r/${subreddit}`.green);

            return {
                success: true,
                data: {
                    postId: result.json?.data?.id || '',
                    url: result.json?.data?.url || ''
                }
            };
        } catch (error) {
            console.error(`[SubmitPost] ❌ Failed to submit post:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
