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
     */
    private replaceVariables(content: string, context: ActionContext): string {
        let result = content;

        if (context.triggerData) {
            if (context.triggerData.author) {
                result = result.replace(/\{\{author\.id\}\}/g, context.triggerData.author.id || '');
                result = result.replace(/\{\{author\.username\}\}/g, context.triggerData.author.username || '');
                result = result.replace(/\{\{author\.tag\}\}/g, context.triggerData.author.tag || '');
            }
            if (context.triggerData.member) {
                result = result.replace(/\{\{member\.id\}\}/g, context.triggerData.member.id || '');
                result = result.replace(/\{\{member\.username\}\}/g, context.triggerData.member.username || '');
                result = result.replace(/\{\{member\.tag\}\}/g, context.triggerData.member.tag || '');
            }
            if (context.triggerData.user) {
                result = result.replace(/\{\{user\.id\}\}/g, context.triggerData.user.id || '');
                result = result.replace(/\{\{user\.username\}\}/g, context.triggerData.user.username || '');
                result = result.replace(/\{\{user\.tag\}\}/g, context.triggerData.user.tag || '');
            }
            if (context.triggerData.reaction) {
                result = result.replace(/\{\{reaction\.emoji\}\}/g, context.triggerData.reaction.emoji || '');
                result = result.replace(/\{\{reaction\.emojiId\}\}/g, context.triggerData.reaction.emojiId || '');
            }
            if (context.triggerData.message) {
                result = result.replace(/\{\{message\.content\}\}/g, context.triggerData.message.content || '');
                result = result.replace(/\{\{message\.id\}\}/g, context.triggerData.message.id || '');
            }
            if (context.triggerData.guild) {
                result = result.replace(/\{\{guild\.name\}\}/g, context.triggerData.guild.name || '');
                result = result.replace(/\{\{guild\.id\}\}/g, context.triggerData.guild.id || '');
            }
        }
        return result;
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
