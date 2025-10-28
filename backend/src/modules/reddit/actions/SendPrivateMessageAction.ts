import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { RedditModule } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

/**
 * Action to send a private message on Reddit
 */
export class SendPrivateMessageAction extends BaseAction {
    private redditModule: RedditModule;

    constructor(redditModule: RedditModule) {
        super();
        this.redditModule = redditModule;
    }

    getName(): string {
        return 'send_private_message';
    }

    getDescription(): string {
        return 'Send a private message to a Reddit user';
    }

    getRequiredScopes(): string[] {
        return ['privatemessages'];
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['to', 'subject', 'body'],
            properties: {
                to: {
                    type: 'string',
                    title: 'Recipient',
                    description: 'Username of the recipient (without u/). Use {{variable}} for dynamic data.',
                    example: '{{sender}}'
                },
                subject: {
                    type: 'string',
                    title: 'Subject',
                    description: 'Message subject. Use {{variable}} for dynamic data.',
                    example: 'Re: {{subject}}'
                },
                body: {
                    type: 'string',
                    title: 'Message Body',
                    description: 'Message content. Use {{variable}} for dynamic data.',
                    example: 'Thanks for your message: {{body}}'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                recipient: { type: 'string', description: 'Username of the recipient' },
                subject: { type: 'string', description: 'Message subject' },
                sentAt: { type: 'string', description: 'Timestamp when message was sent' }
            }
        };
    }

    validate(config: ActionConfig): boolean {
        if (!config.to || typeof config.to !== 'string') {
            throw new Error('to (recipient) is required and must be a string');
        }
        if (!config.subject || typeof config.subject !== 'string') {
            throw new Error('subject is required and must be a string');
        }
        if (!config.body || typeof config.body !== 'string') {
            throw new Error('body is required and must be a string');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[SendPrivateMessage] Executing for AREA ${context.areaId}`.cyan);

            const area = await Area.findById(context.areaId);
            if (!area) {
                throw new Error(`AREA ${context.areaId} not found`);
            }

            const redditAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'reddit');
            if (!redditAuth || !redditAuth.access_token) {
                throw new Error('Reddit not connected for this user');
            }

            // Replace variables
            const to = this.replaceVariables(config.to, context);
            const subject = this.replaceVariables(config.subject, context);
            const body = this.replaceVariables(config.body, context);

            const apiService = this.redditModule.getApiService();
            await apiService.sendPrivateMessage(
                to,
                subject,
                body,
                redditAuth.access_token
            );

            console.log(`[SendPrivateMessage] ✓ Message sent to u/${to}`.green);

            return {
                success: true,
                data: {
                    recipient: to,
                    subject: subject,
                    sentAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error(`[SendPrivateMessage] ❌ Failed to send message:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
