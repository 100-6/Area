import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';

export class SendWebhookMessage extends BaseAction {
    getName(): string {
        return 'send_webhook_message';
    }

    getDescription(): string {
        return 'Send a message to a Discord channel via webhook';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['webhookUrl', 'content'],
            properties: {
                webhookUrl: {
                    type: 'string',
                    title: 'Webhook URL',
                    description: 'The Discord webhook URL to send the message to',
                    format: 'uri'
                },
                content: {
                    type: 'string',
                    title: 'Message Content',
                    description: 'The text message to send (supports variables like {{author.username}})',
                    minLength: 1,
                    maxLength: 2000
                },
                username: {
                    type: 'string',
                    title: 'Username (optional)',
                    description: 'Override the default username of the webhook'
                },
                avatarUrl: {
                    type: 'string',
                    title: 'Avatar URL (optional)',
                    description: 'Override the default avatar of the webhook',
                    format: 'uri'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                webhookUrl: { type: 'string', description: 'Webhook URL used' },
                content: { type: 'string', description: 'Content that was sent' },
                username: { type: 'string', description: 'Username used for the webhook' },
                sentAt: { type: 'string', format: 'date-time', description: 'When message was sent' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return []; // Pas besoin de permissions spécifiques
    }

    validate(config: ActionConfig): boolean {
        if (!config.webhookUrl)
            throw new Error('webhookUrl is required');
        if (!config.content)
            throw new Error('content is required');
        if (typeof config.webhookUrl !== 'string' || !config.webhookUrl.startsWith('https://discord.com/api/webhooks/'))
            throw new Error('Invalid Discord webhook URL');
        if (config.content.length < 1 || config.content.length > 2000)
            throw new Error('Message content must be between 1 and 2000 characters');
        return true;
    }

    parseVariables(template: string, context: ActionContext): string {
        return template.replace(/{{\s*([^}]+)\s*}}/g, (match, p1) => {
            const keys = p1.split('.');
            let value: any = context;
            for (const key of keys) {
                if (value && key in value) {
                    value = value[key];
                } else {
                    return match; // Return the original placeholder if not found
                }
            }
            return String(value);
        });
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const payload: any = {
            content: this.parseVariables(config.content, context)
        };

        if (config.username) {
            payload.username = this.parseVariables(config.username, context);
        }
        if (config.avatarUrl) {
            payload.avatar_url = this.parseVariables(config.avatarUrl, context);
        }

        const response = await fetch(config.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to send webhook message: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return { 
            success: true,
            data: {
                webhookUrl: config.webhookUrl,
                content: payload.content,
                username: payload.username,
                sentAt: new Date().toISOString()
            }
        };
    }
}