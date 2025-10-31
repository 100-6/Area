import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { TwitchApiService } from '../TwitchApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to send a message in Twitch chat
 */
export class SendChatMessageAction extends BaseAction {
    private apiService: TwitchApiService;

    constructor(apiService: TwitchApiService) {
        super();
        this.apiService = apiService;
    }

    getName(): string {
        return 'send_chat_message';
    }

    getDescription(): string {
        return 'Send a message to your Twitch chat';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['message'],
            properties: {
                message: {
                    type: 'string',
                    title: 'Message',
                    description: 'The message to send (supports variables like {{user_name}})',
                    maxLength: 500,
                    example: 'Thanks for following, {{user_name}}!'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether message was sent successfully' },
                message_id: { type: 'string', description: 'Sent message ID' },
                sent_at: { type: 'string', format: 'date-time', description: 'Message send timestamp' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['user:write:chat'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.message || typeof config.message !== 'string') {
            throw new Error('Message is required');
        }
        if (config.message.length > 500) {
            throw new Error('Message must be 500 characters or less');
        }
        return true;
    }

    /**
     * Execute the send chat message action
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[SendChatMessage] Executing action for user ${context.userId}`.cyan);

            this.validate(config);

            // Get user's Twitch access token
            const twitchAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                throw new Error('Twitch account not connected');
            }

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;
            const senderId = userData.id;

            // Replace variables in message
            let message = this.replaceVariables(config.message, context.triggerData);

            // Send the message
            const result = await this.apiService.sendChatMessage(
                twitchAuth.access_token,
                broadcasterId,
                senderId,
                message
            );

            console.log(`[SendChatMessage] Message sent successfully: ${message}`.green);

            return {
                success: true,
                data: {
                    success: true,
                    message_id: result.message_id,
                    sent_at: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error(`[SendChatMessage] Error sending message:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send chat message'
            };
        }
    }

    /**
     * Replace variables in the message with trigger data
     */
    protected replaceVariables(message: string, triggerData: any): string {
        if (!triggerData) return message;

        let result = message;
        const variableRegex = /\{\{([^}]+)\}\}/g;
        const matches = message.matchAll(variableRegex);

        for (const match of matches) {
            const variableName = match[1].trim();
            const value = this.getNestedValue(triggerData, variableName);
            if (value !== undefined) {
                result = result.replace(match[0], String(value));
            }
        }

        return result;
    }

    /**
     * Get nested value from object using dot notation
     */
    protected getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
}
