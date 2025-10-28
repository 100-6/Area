import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { RedditModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

/**
 * Action to upvote a Reddit post or comment
 */
export class UpvoteAction extends BaseAction {
    private redditModule: RedditModule;

    constructor(redditModule: RedditModule) {
        super();
        this.redditModule = redditModule;
    }

    getName(): string {
        return 'upvote';
    }

    getDescription(): string {
        return 'Upvote a Reddit post or comment';
    }

    getRequiredScopes(): string[] {
        return ['vote'];
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['thingId'],
            properties: {
                thingId: {
                    type: 'string',
                    title: 'Thing ID',
                    description: 'Full Reddit ID (t3_xxx for posts, t1_xxx for comments). Use {{fullname}}.',
                    example: '{{fullname}}'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                upvoted: { type: 'boolean', description: 'Whether the upvote was successful' }
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
            console.log(`[Upvote] Executing for AREA ${context.areaId}`.cyan);

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
            await apiService.upvote(thingId, redditAuth.access_token);

            console.log(`[Reddit] ✓ Upvoted ${thingId}`.green);

            return {
                success: true,
                data: {
                    upvoted: true
                }
            };
        } catch (error) {
            console.error(`[Upvote] ❌ Failed to upvote:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
