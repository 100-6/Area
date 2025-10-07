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
        return 'webhook'; // Événement en temps réel via WebSocket
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

    validate(config: TriggerConfig): boolean {
        if (!config.channelId) {
            throw new Error('channelId is required');
        }

        // Vérifier le format du channel ID
        const channelIdPattern = /^[0-9]{17,19}$/;
        if (!channelIdPattern.test(config.channelId)) {
            throw new Error('Invalid Discord channel ID format');
        }

        // Si un keyword est fourni, vérifier sa longueur
        if (config.keyword && (config.keyword.length < 1 || config.keyword.length > 100)) {
            throw new Error('Keyword must be between 1 and 100 characters');
        }

        // Si un authorId est fourni, vérifier son format
        if (config.authorId && !channelIdPattern.test(config.authorId)) {
            throw new Error('Invalid Discord user ID format');
        }

        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnMessageCreated] Starting trigger for AREA ${areaId}`.cyan);
        
        // Valider la config
        this.validate(config);

        // Vérifier que le bot est connecté
        if (!this.botClient.isConnected()) {
            await this.botClient.connect();
        }

        // Créer un listener pour cet AREA
        const listener = async (eventData: any) => {
            try {
                // Filtrer par channel
                if (eventData.channelId !== config.channelId) {
                    return;
                }

                // Filtrer par keyword si configuré
                if (config.keyword) {
                    const keyword = config.keyword.toLowerCase();
                    const content = eventData.content.toLowerCase();
                    if (!content.includes(keyword)) {
                        return;
                    }
                }

                // Filtrer par auteur si configuré
                if (config.authorId && eventData.authorId !== config.authorId) {
                    return;
                }

                // Ignorer les bots si configuré
                if (config.ignoreBots && eventData.authorId === this.botClient.getClient().user?.id) {
                    return;
                }

                console.log(`[OnMessageCreated] Trigger fired for AREA ${areaId}`.green);

                // Construire le payload
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

                // Émettre le trigger
                await this.emitTrigger(payload);
            } catch (error) {
                console.error(`[OnMessageCreated] Error processing event:`.red, error);
            }
        };

        // Stocker le listener
        this.listeners.set(areaId, listener);

        // S'abonner à l'événement
        await this.eventBus.on('discord.message.created', listener);

        // Enregistrer le trigger dans le bot client
        this.botClient.registerTrigger(this.getName(), areaId);

        this.isRunning = true;
        console.log(`[OnMessageCreated] ✓ Trigger started for AREA ${areaId}`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnMessageCreated] Stopping trigger for AREA ${areaId}`.yellow);

        // Récupérer le listener
        const listener = this.listeners.get(areaId);
        if (listener) {
            // Se désabonner
            await this.eventBus.removeListener('discord.message.created', listener);
            this.listeners.delete(areaId);
        }

        // Désenregistrer du bot client
        this.botClient.unregisterTrigger(this.getName(), areaId);

        this.isRunning = false;
        console.log(`[OnMessageCreated] ✓ Trigger stopped for AREA ${areaId}`.yellow);
    }
}
