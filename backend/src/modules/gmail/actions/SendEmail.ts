import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { GmailService } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action: Envoyer un email via Gmail
 * Envoie un email avec possibilité de personnalisation (CC, BCC, réponse)
 */
export class SendEmail extends BaseAction {
    private gmailService: GmailService;

    constructor() {
        super();
        this.gmailService = new GmailService();
    }

    getName(): string {
        return 'send_email';
    }

    getDescription(): string {
        return 'Send an email via Gmail';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['to', 'subject', 'body'],
            properties: {
                to: { type: 'string', format: 'email' },
                subject: { type: 'string', maxLength: 500 },
                body: { type: 'string', maxLength: 10000 },
                cc: { type: 'string' },
                bcc: { type: 'string' },
                inReplyTo: { type: 'string' }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Sent email message ID' },
                threadId: { type: 'string', description: 'Thread ID' },
                labelIds: { type: 'array', items: { type: 'string' }, description: 'Applied labels' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['https://www.googleapis.com/auth/gmail.send'];
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
            const gmailAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'gmail');
            if (!gmailAuth || !gmailAuth.access_token)
                throw new Error('Gmail not connected for this user. Please connect your Gmail account.');
            const accessToken = gmailAuth.access_token;
            const refreshToken = gmailAuth.refresh_token;
            // Use the standard replaceVariables method from BaseAction
            const to = this.replaceVariables(config.to, context, true);
            const subject = this.replaceVariables(config.subject, context, true);
            const body = this.replaceVariables(config.body, context, true);
            const cc = config.cc ? this.replaceVariables(config.cc, context) : undefined;
            const bcc = config.bcc ? this.replaceVariables(config.bcc, context) : undefined;
            const inReplyTo = config.inReplyTo ? this.replaceVariables(config.inReplyTo, context) : undefined;
            const result = await this.gmailService.sendEmail(accessToken, to, subject, body, { cc, bcc, inReplyTo, refreshToken });
            const executionTime = Date.now() - startTime;
            console.log(`[SendEmail] ✓ Email sent to ${to}`.green);
            return {
                success: true, 
                data: {id: result.id, threadId: result.threadId, labelIds: result.labelIds || []}, 
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[SendEmail] ❌ Failed to send email:`.red, error);
            return {success: false, error: (error as Error).message,executionTime};
        }
    }
}
