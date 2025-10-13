import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { DiscordBotClient } from '../DiscordBotClient';
import { TextChannel } from 'discord.js';
import 'colors';

/**
 * Action: Envoyer un message sur Discord
 * Envoie un message texte dans un channel spécifique
 */
export class SendMessage extends BaseAction {
    private botClient: DiscordBotClient;

    constructor() {
        super();
        this.botClient = DiscordBotClient.getInstance();
    }

    getName(): string {
        return 'send_message';
    }

    getDescription(): string {
        return 'Send a text message to a Discord channel';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['channelId', 'content'],
            properties: {
                channelId: {
                    type: 'string',
                    title: 'Channel ID',
                    description: 'The Discord channel ID where to send the message',
                    pattern: '^[0-9]{17,19}$'
                },
                content: {
                    type: 'string',
                    title: 'Message Content',
                    description: 'The text message to send (supports variables like {{author.username}})',
                    minLength: 1,
                    maxLength: 2000
                },
                replyToMessageId: {
                    type: 'string',
                    title: 'Reply to Message ID (optional)',
                    description: 'Reply to a specific message',
                    pattern: '^[0-9]{17,19}$'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                messageId: { type: 'string', description: 'ID of the sent message' },
                channelId: { type: 'string', description: 'Channel ID where message was sent' },
                content: { type: 'string', description: 'Content of the sent message' },
                timestamp: { type: 'string', format: 'date-time', description: 'When message was sent' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['bot']; // Nécessite le bot Discord
    }

    validate(config: ActionConfig): boolean {
        if (!config.channelId)
            throw new Error('channelId is required');
        if (!config.content)
            throw new Error('content is required');
        const channelIdPattern = /^[0-9]{17,19}$/;
        if (!channelIdPattern.test(config.channelId))
            throw new Error('Invalid Discord channel ID format');
        if (config.content.length < 1 || config.content.length > 2000)
            throw new Error('Message content must be between 1 and 2000 characters');
        if (config.replyToMessageId) {
            const messageIdPattern = /^[0-9]{17,19}$/;
            if (!messageIdPattern.test(config.replyToMessageId))
                throw new Error('Invalid Discord message ID format');
        }

        return true;
    }

    /**
     * Remplacer les variables dans le contenu du message
     * Exemple: "Hello {{author.username}}" -> "Hello John"
     * Supporte aussi les variables des actions précédentes: {{generatedText}}
     */
    private replaceVariables(content: string, context: ActionContext): string {
        let result = content;

        // Replace previous outputs from other actions
        if (context.previousOutputs) {
            console.log('[SendMessage] Previous outputs:', JSON.stringify(context.previousOutputs, null, 2));
            
            for (const [nodeId, output] of Object.entries(context.previousOutputs)) {
                // Flatten the output object to support nested properties
                const flatOutput = this.flattenObject(output);
                
                for (const [key, value] of Object.entries(flatOutput)) {
                    if (value !== null && value !== undefined) {
                        // Replace both with and without nodeId prefix
                        const regex1 = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                        const regex2 = new RegExp(`\\{\\{${nodeId}\\.${key}\\}\\}`, 'g');
                        
                        result = result.replace(regex1, String(value));
                        result = result.replace(regex2, String(value));
                    }
                }
            }
        }

        return result;
    }

    /**
     * Flatten nested object into dot notation
     * { a: { b: 'value' } } => { 'a.b': 'value' }
     */
    private flattenObject(obj: any, prefix = ''): Record<string, any> {
        let flattened: Record<string, any> = {};
        
        for (const key in obj) {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(flattened, this.flattenObject(value, newKey));
            } else {
                flattened[newKey] = value;
            }
        }
        
        return flattened;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            console.log(`[SendMessage] Executing for AREA ${context.areaId}`.cyan);
            if (!this.botClient.isConnected())
                throw new Error('Discord bot is not connected');
            const client = this.botClient.getClient();
            const channel = await client.channels.fetch(config.channelId);
            if (!channel)
                throw new Error(`Channel ${config.channelId} not found`);
            if (!channel.isTextBased())
                throw new Error(`Channel ${config.channelId} is not a text channel`);
            const content = this.replaceVariables(config.content, context);
            const messageOptions: any = { content: content };
            if (config.replyToMessageId)
                messageOptions.reply = { messageReference: config.replyToMessageId };
            const sentMessage = await (channel as TextChannel).send(messageOptions);
            const executionTime = Date.now() - startTime;
            console.log(`[SendMessage] ✓ Message sent to channel ${config.channelId}`.green);
            return {
                success: true,
                data: {
                    messageId: sentMessage.id,
                    channelId: sentMessage.channelId,
                    content: sentMessage.content,
                    timestamp: sentMessage.createdAt.toISOString()
                },
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[SendMessage] ❌ Failed to send message:`.red, error);
            return {
                success: false,
                error: (error as Error).message,
                executionTime
            };
        }
    }
}
