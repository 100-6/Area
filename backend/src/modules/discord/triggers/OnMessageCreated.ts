import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { DiscordBotClient } from '../DiscordBotClient';
import 'colors';

/**
 * Trigger: Nouveau message créé sur Discord
 * Se déclenche quand un message est posté dans un channel spécifique
 */
export class OnMessageCreated extends BaseTrigger {
    private botClient: DiscordBotClient;
    private listeners: Map<string, (data: any) => void> = new Map();

    constructor() {
        super();
        this.botClient = DiscordBotClient.getInstance();
    }

    getName(): string {
        return 'on_message_created';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'webhook';
    }

    getDescription(): string {
        return 'Triggers when a new message is posted in a Discord channel';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['channelId'],
            properties: {
                channelId: {
                    type: 'string',
                    title: 'Channel ID',
                    description: 'The Discord channel ID to monitor',
                    pattern: '^[0-9]{17,19}$'
                },
                keyword: {
                    type: 'string',
                    title: 'Keyword (optional)',
                    description: 'Only trigger if message contains this keyword',
                    minLength: 1,
                    maxLength: 100
                },
                authorId: {
                    type: 'string',
                    title: 'Author ID (optional)',
                    description: 'Only trigger for messages from this user',
                    pattern: '^[0-9]{17,19}$'
                },
                ignoreBots: {
                    type: 'boolean',
                    title: 'Ignore bots',
                    description: 'Ignore messages from bots',
                    default: true
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                message: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Message ID' },
                        content: { type: 'string', description: 'Message content text' },
                        channelId: { type: 'string', description: 'Channel ID where message was posted' },
                        channelName: { type: 'string', description: 'Channel name' },
                        guildId: { type: 'string', description: 'Server (guild) ID' },
                        guildName: { type: 'string', description: 'Server (guild) name' },
                        timestamp: { type: 'string', format: 'date-time', description: 'Message timestamp' },
                        hasAttachments: { type: 'boolean', description: 'Whether message has attachments' },
                        attachments: { type: 'array', description: 'Array of attachments' }
                    }
                },
                author: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Author user ID' },
                        tag: { type: 'string', description: 'Author Discord tag (username#discriminator)' },
                        username: { type: 'string', description: 'Author username' }
                    }
                }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (!config.channelId)
            throw new Error('channelId is required');
        const channelIdPattern = /^[0-9]{17,19}$/;
        if (!channelIdPattern.test(config.channelId))
            throw new Error('Invalid Discord channel ID format');
        if (config.keyword && (config.keyword.length < 1 || config.keyword.length > 100))
            throw new Error('Keyword must be between 1 and 100 characters');
        if (config.authorId && !channelIdPattern.test(config.authorId))
            throw new Error('Invalid Discord user ID format');
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnMessageCreated] Starting trigger for AREA ${areaId}`.cyan);
        this.validate(config);

        if (!this.botClient.isConnected())
            await this.botClient.connect();
        const listener = async (eventData: any) => {
            try {
                if (eventData.channelId !== config.channelId)
                    return;
                if (config.keyword) {
                    const keyword = config.keyword.toLowerCase();
                    const content = eventData.content.toLowerCase();
                    if (!content.includes(keyword))
                        return;
                }
                if (config.authorId && eventData.authorId !== config.authorId)
                    return;
                if (config.ignoreBots && eventData.authorId === this.botClient.getClient().user?.id)
                    return;
                console.log(`[OnMessageCreated] Trigger fired for AREA ${areaId}`.green);
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        message: {
                            id: eventData.messageId,
                            content: eventData.content,
                            channelId: eventData.channelId,
                            channelName: eventData.channelName,
                            guildId: eventData.guildId,
                            guildName: eventData.guildName,
                            timestamp: eventData.timestamp,
                            hasAttachments: eventData.hasAttachments,
                            attachments: eventData.attachments
                        },
                        author: {
                            id: eventData.authorId,
                            tag: eventData.authorTag,
                            username: eventData.authorUsername
                        }
                    }
                };
                await this.emitTrigger(payload);
            } catch (error) {
                console.error(`[OnMessageCreated] Error processing event:`.red, error);
            }
        };
        this.listeners.set(areaId, listener);
        await this.eventBus.on('discord.message.created', listener);
        this.botClient.registerTrigger(this.getName(), areaId);
        this.isRunning = true;
        console.log(`[OnMessageCreated] ✓ Trigger started for AREA ${areaId}`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnMessageCreated] Stopping trigger for AREA ${areaId}`.yellow);

        const listener = this.listeners.get(areaId);
        if (listener) {
            await this.eventBus.removeListener('discord.message.created', listener);
            this.listeners.delete(areaId);
        }
        this.botClient.unregisterTrigger(this.getName(), areaId);
        this.isRunning = false;
        console.log(`[OnMessageCreated] ✓ Trigger stopped for AREA ${areaId}`.yellow);
    }
}
