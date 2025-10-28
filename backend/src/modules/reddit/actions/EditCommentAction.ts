import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { RedditModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

/**
 * Action to edit an existing comment or post
 */
export class EditCommentAction extends BaseAction {
    private redditModule: RedditModule;

    constructor(redditModule: RedditModule) {
        super();
        this.redditModule = redditModule;
    }

    getName(): string {
        return 'edit_comment';
    }

    getDescription(): string {
        return 'Edit an existing comment or post that you created';
    }

    getRequiredScopes(): string[] {
        return ['edit'];
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['thingId', 'newText'],
            properties: {
                thingId: {
                    type: 'string',
                    title: 'Thing ID',
                    description: 'Full ID of the comment or post to edit (t1_xxx for comment, t3_xxx for post). Use {{variable}} for dynamic data.',
                    example: '{{fullname}}'
                },
                newText: {
                    type: 'string',
                    title: 'New Text',
                    description: 'New content for the comment or post. Use {{variable}} for dynamic data.',
                    example: 'Updated: {{body}}'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                thingId: { type: 'string', description: 'ID of the edited thing' },
                editedAt: { type: 'string', description: 'Timestamp when edit was made' }
            }
        };
    }

    validate(config: ActionConfig): boolean {
        if (!config.thingId || typeof config.thingId !== 'string') {
            throw new Error('thingId is required and must be a string');
        }
        if (!config.newText || typeof config.newText !== 'string') {
            throw new Error('newText is required and must be a string');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[EditComment] Executing for AREA ${context.areaId}`.cyan);

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
            const newText = this.replaceVariables(config.newText, context);

            const apiService = this.redditModule.getApiService();
            await apiService.editUserText(
                thingId,
                newText,
                redditAuth.access_token
            );

            console.log(`[EditComment] ✓ Edited ${thingId}`.green);

            return {
                success: true,
                data: {
                    thingId: thingId,
                    editedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error(`[EditComment] ❌ Failed to edit:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
