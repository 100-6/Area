import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { OutlookService } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action: Envoyer un email via Outlook
 * Envoie un email avec possibilité de personnalisation (CC, BCC, HTML/Text)
 */
export class SendEmail extends BaseAction {
    private outlookService: OutlookService;

    constructor() {
        super();
        this.outlookService = new OutlookService();
    }

    getName(): string {
        return 'send_email';
    }

    getDescription(): string {
        return 'Send an email via Outlook';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['to', 'subject', 'body'],
            properties: {
                to: { type: 'string', format: 'email' },
                subject: { type: 'string', maxLength: 500 },
                body: { type: 'string', maxLength: 10000 },
                contentType: { type: 'string', enum: ['text', 'html'], default: 'text' },
                cc: { type: 'string' },
                bcc: { type: 'string' }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Sent email message ID' },
                sentDateTime: { type: 'string', format: 'date-time', description: 'Sent date and time' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['https://graph.microsoft.com/Mail.Send'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.to || !config.subject || !config.body)
            throw new Error('Les champs "to", "subject" et "body" sont requis');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(config.to) && !config.to.includes('{{'))
            throw new Error('L\'adresse email "to" est invalide');
        return true;
    }


    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            console.log(`[SendEmail] Executing for AREA ${context.areaId}`.cyan);
            const area = await Area.findById(context.areaId);
            if (!area)
                throw new Error(`AREA ${context.areaId} not found`);
            const outlookAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'outlook');
            if (!outlookAuth || !outlookAuth.access_token)
                throw new Error('Outlook not connected for this user. Please connect your Outlook account.');
            const accessToken = outlookAuth.access_token;
            const refreshToken = outlookAuth.refresh_token;
            // Use the standard replaceVariables method from BaseAction
            const to = this.replaceVariables(config.to, context, true);
            const subject = this.replaceVariables(config.subject, context, true);
            const body = this.replaceVariables(config.body, context, true);
            const cc = config.cc ? this.replaceVariables(config.cc, context) : undefined;
            const bcc = config.bcc ? this.replaceVariables(config.bcc, context) : undefined;
            const contentType = config.contentType || 'text';
            const result = await this.outlookService.sendEmail(accessToken, to, subject, body, { contentType, cc, bcc, refreshToken });
            const executionTime = Date.now() - startTime;
            console.log(`[SendEmail] ✓ Email sent to ${to}`.green);
            return {
                success: true,
                data: { id: result.id, sentDateTime: result.sentDateTime },
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[SendEmail] ❌ Failed to send email:`.red, error);
            return { success: false, error: (error as Error).message, executionTime };
        }
    }
}
