import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { DiscordBotClient } from '../DiscordBotClient';
import 'colors';

/**
 * Trigger: Réaction ajoutée à un message Discord
 * Se déclenche quand quelqu'un réagit à un message
 */
export class OnReactionAdded extends BaseTrigger {
    private botClient: DiscordBotClient;
    private listeners: Map<string, (data: any) => void> = new Map();

    constructor() {
        super();
        this.botClient = DiscordBotClient.getInstance();
    }

    getName(): string {
        return 'on_reaction_added';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'webhook';
    }

    getDescription(): string {
        return 'Triggers when a reaction is added to a Discord message';
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
                messageId: {
                    type: 'string',
                    title: 'Message ID (optional)',
                    description: 'Monitor reactions on a specific message only',
                    pattern: '^[0-9]{17,19}$'
                },
                emoji: {
                    type: 'string',
                    title: 'Emoji (optional)',
                    description: 'Only trigger for a specific emoji (e.g., "👍", "✅")',
                    minLength: 1,
                    maxLength: 100
                },
                ignoreBots: {
                    type: 'boolean',
                    title: 'Ignore bots',
                    description: 'Ignore reactions from bots',
                    default: true
                }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (!config.channelId) {
            throw new Error('channelId is required');
        }

        const idPattern = /^[0-9]{17,19}$/;
        if (!idPattern.test(config.channelId)) {
            throw new Error('Invalid Discord channel ID format');
        }

        if (config.messageId && !idPattern.test(config.messageId)) {
            throw new Error('Invalid Discord message ID format');
        }

        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnReactionAdded] Starting trigger for AREA ${areaId}`.cyan);
        
        this.validate(config);

        if (!this.botClient.isConnected()) {
            await this.botClient.connect();
        }

        const listener = async (eventData: any) => {
            try {
                // Filtrer par channel
                if (eventData.channelId !== config.channelId) {
                    return;
                }

                // Filtrer par message spécifique si configuré
                if (config.messageId && eventData.messageId !== config.messageId) {
                    return;
                }

                // Filtrer par emoji si configuré
                if (config.emoji && eventData.emoji !== config.emoji) {
                    return;
                }

                // Ignorer les bots si configuré
                if (config.ignoreBots && eventData.userId === this.botClient.getClient().user?.id) {
                    return;
                }

                console.log(`[OnReactionAdded] Trigger fired for AREA ${areaId} - ${eventData.emoji} by ${eventData.userTag}`.green);

                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        reaction: {
                            emoji: eventData.emoji,
                            emojiId: eventData.emojiId,
                            emojiAnimated: eventData.emojiAnimated
                        },
                        message: {
                            id: eventData.messageId,
                            content: eventData.messageContent,
                            authorId: eventData.messageAuthorId,
                            channelId: eventData.channelId
                        },
                        user: {
                            id: eventData.userId,
                            tag: eventData.userTag,
                            username: eventData.username
                        },
                        guild: {
                            id: eventData.guildId
                        }
                    }
                };

                await this.emitTrigger(payload);
            } catch (error) {
                console.error(`[OnReactionAdded] Error processing event:`.red, error);
            }
        };

        this.listeners.set(areaId, listener);
        await this.eventBus.on('discord.reaction.added', listener);
        this.botClient.registerTrigger(this.getName(), areaId);

        this.isRunning = true;
        console.log(`[OnReactionAdded] ✓ Trigger started for AREA ${areaId}`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnReactionAdded] Stopping trigger for AREA ${areaId}`.yellow);

        const listener = this.listeners.get(areaId);
        if (listener) {
            await this.eventBus.removeListener('discord.reaction.added', listener);
            this.listeners.delete(areaId);
        }

        this.botClient.unregisterTrigger(this.getName(), areaId);
        this.isRunning = false;
        console.log(`[OnReactionAdded] ✓ Trigger stopped for AREA ${areaId}`.yellow);
    }
}
