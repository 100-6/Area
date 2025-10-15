import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { GmailService } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action pour déplacer un email vers la corbeille
 */
export class MoveToTrashAction extends BaseAction {
    private gmailService: GmailService;

    constructor() {
        super();
        this.gmailService = new GmailService();
    }

    getName(): string {
        return 'move_to_trash';
    }

    getDescription(): string {
        return 'Move a specific email to trash';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['messageId'],
            properties: {
                messageId: { type: 'string' }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Email message ID' },
                labelIds: { type: 'array', items: { type: 'string' }, description: 'Current labels' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['https://www.googleapis.com/auth/gmail.modify'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.messageId)
            throw new Error('Le champ "messageId" est requis');
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            const area = await Area.findById(context.areaId);

            if (!area)
                return {success: false, error: `AREA ${context.areaId} not found`};
            const gmailAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'gmail');
            if (!gmailAuth || !gmailAuth.access_token)
                return {success: false, error: 'Gmail not connected for this user. Please connect your Gmail account.'};
            const accessToken = gmailAuth.access_token;
            const refreshToken = gmailAuth.refresh_token;
            const messageId = this.replaceVariables(config.messageId, context);
            console.log(`[MoveToTrash] Moving message ${messageId} to trash`.cyan);
            const result = await this.gmailService.moveToTrash(accessToken, messageId, refreshToken);
            return {success: true, data: {id: result.id, labelIds: result.labelIds || []}};
        } catch (error) {
            console.error('[MoveToTrash] Error:'.red, error);
            return {success: false, error: (error as Error).message};
        }
    }
}
