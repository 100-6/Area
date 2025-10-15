import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { GmailService } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action pour ajouter un label à un email
 */
export class AddLabelAction extends BaseAction {
    private gmailService: GmailService;

    constructor() {
        super();
        this.gmailService = new GmailService();
    }

    getName(): string {
        return 'add_label';
    }

    getDescription(): string {
        return 'Add a label to a specific email';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['messageId', 'labelId'],
            properties: {
                messageId: { type: 'string' },
                labelId: { type: 'string' }
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
        if (!config.messageId || !config.labelId)
            throw new Error('Les champs "messageId" et "labelId" sont requis');
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
            const labelId = this.replaceVariables(config.labelId, context);
            console.log(`[AddLabel] Adding label ${labelId} to message ${messageId}`.cyan);
            const result = await this.gmailService.addLabel(accessToken, messageId, labelId, refreshToken);
            return {success: true, data: {id: result.id, labelIds: result.labelIds || []}};
        } catch (error) {
            console.error('[AddLabel] Error:'.red, error);
            return {success: false, error: (error as Error).message};
        }
    }
}
