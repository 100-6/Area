import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { TelegramBotClient } from '../TelegramBotClient';
import 'colors';

/**
 * Trigger: Message reçu sur Telegram
 * Se déclenche quand un nouveau message est reçu dans un chat spécifique
 */
export class OnMessageReceived extends BaseTrigger {
    private botClient: TelegramBotClient;
    private listeners: Map<string, (data: any) => void> = new Map();

    constructor() {
        super();
        this.botClient = TelegramBotClient.getInstance();
    }

    getName(): string {
        return 'on_message_received';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a new message is received in a Telegram chat';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['chatId'],
            properties: {
                chatId: {
                    type: 'string',
                    title: 'Chat ID',
                    description: 'The Telegram chat ID to monitor. To get your chat ID, send /myid to @autoepitechbot on Telegram',
                    pattern: '^-?[0-9]+$'
                },
                keyword: {
                    type: 'string',
                    title: 'Keyword (optional)',
                    description: 'Only trigger if message contains this keyword',
                    minLength: 1,
                    maxLength: 100
                },
                messageType: {
                    type: 'string',
                    title: 'Message Type (optional)',
                    description: 'Filter by message type',
                    enum: ['any', 'text', 'photo', 'video', 'document', 'audio', 'voice', 'sticker'],
                    default: 'any'
                },
                fromUserId: {
                    type: 'string',
                    title: 'From User ID (optional)',
                    description: 'Only trigger for messages from this user',
                    pattern: '^[0-9]+$'
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

    /**
     * Schéma de sortie du trigger
     * Définit la structure des données disponibles pour les actions suivantes
     */
    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                message: {
                    type: 'object',
                    properties: {
                        id: { type: 'number', description: 'Message ID' },
                        text: { type: 'string', description: 'Message text content' },
                        date: { type: 'string', format: 'date-time', description: 'Message timestamp' },
                        type: { type: 'string', description: 'Message type (text, photo, video, etc.)' },
                        isEdited: { type: 'boolean', description: 'Whether the message was edited' },
                        entities: { type: 'array', description: 'Message entities (links, mentions, etc.)' },
                        replyToMessage: {
                            type: 'object',
                            nullable: true,
                            properties: {
                                id: { type: 'number', description: 'Replied message ID' },
                                text: { type: 'string', description: 'Replied message text' }
                            }
                        }
                    }
                },
                from: {
                    type: 'object',
                    nullable: true,
                    properties: {
                        id: { type: 'number', description: 'User ID' },
                        isBot: { type: 'boolean', description: 'Whether user is a bot' },
                        firstName: { type: 'string', description: 'User first name' },
                        lastName: { type: 'string', description: 'User last name' },
                        username: { type: 'string', description: 'User username' },
                        languageCode: { type: 'string', description: 'User language code' }
                    }
                },
                chat: {
                    type: 'object',
                    properties: {
                        id: { type: 'number', description: 'Chat ID' },
                        type: { type: 'string', description: 'Chat type (private, group, supergroup, channel)' },
                        title: { type: 'string', description: 'Chat title (for groups/channels)' },
                        username: { type: 'string', description: 'Chat username' },
                        firstName: { type: 'string', description: 'Chat first name (for private chats)' },
                        lastName: { type: 'string', description: 'Chat last name (for private chats)' }
                    }
                },
                timestamp: { type: 'string', format: 'date-time', description: 'Event timestamp' }
            }
        };
    }

    /**
     * Valider la configuration du trigger
     */
    validate(config: TriggerConfig): boolean {
        if (!config.chatId) {
            throw new Error('chatId is required');
        }

        // Valider le format du chatId (peut être négatif pour les groupes)
        const chatIdPattern = /^-?[0-9]+$/;
        if (!chatIdPattern.test(config.chatId)) {
            throw new Error('Invalid Telegram chat ID format');
        }

        // Valider le keyword si présent
        if (config.keyword && (config.keyword.length < 1 || config.keyword.length > 100)) {
            throw new Error('Keyword must be between 1 and 100 characters');
        }

        // Valider le messageType si présent
        if (config.messageType) {
            const validTypes = ['any', 'text', 'photo', 'video', 'document', 'audio', 'voice', 'sticker'];
            if (!validTypes.includes(config.messageType)) {
                throw new Error(`Invalid message type. Must be one of: ${validTypes.join(', ')}`);
            }
        }

        // Valider le fromUserId si présent
        if (config.fromUserId) {
            const userIdPattern = /^[0-9]+$/;
            if (!userIdPattern.test(config.fromUserId)) {
                throw new Error('Invalid Telegram user ID format');
            }
        }

        return true;
    }

    /**
     * Démarrer le trigger
     * @param areaId - ID de l'area
     * @param config - Configuration du trigger
     */
    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnMessageReceived] Starting trigger for AREA ${areaId}`.cyan);
        
        // Valider la configuration
        this.validate(config);

        // S'assurer que le bot est connecté
        if (!this.botClient.isConnected()) {
            await this.botClient.connect();
        }

        // Créer un listener pour cet area
        const listener = async (eventData: any) => {
            try {
                // Filtrer par chatId
                if (eventData.chat.id.toString() !== config.chatId.toString()) {
                    return;
                }

                // Filtrer par keyword si configuré
                if (config.keyword) {
                    const keyword = config.keyword.toLowerCase();
                    const text = (eventData.message.text || '').toLowerCase();
                    if (!text.includes(keyword)) {
                        return;
                    }
                }

                // Filtrer par type de message si configuré
                if (config.messageType && config.messageType !== 'any') {
                    if (eventData.message.type !== config.messageType) {
                        return;
                    }
                }

                // Filtrer par userId si configuré
                if (config.fromUserId && eventData.from) {
                    if (eventData.from.id.toString() !== config.fromUserId) {
                        return;
                    }
                }

                // Ignorer les bots si configuré
                if (config.ignoreBots && eventData.from && eventData.from.isBot) {
                    return;
                }

                console.log(`[OnMessageReceived] Trigger fired for AREA ${areaId}`.green);

                // Créer le payload du trigger
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: eventData
                };

                // Émettre le trigger
                await this.emitTrigger(payload);
            } catch (error) {
                console.error(`[OnMessageReceived] Error processing event:`.red, error);
            }
        };

        // Enregistrer le listener
        this.listeners.set(areaId, listener);
        
        // Écouter l'événement sur l'EventBus
        await this.eventBus.on('telegram.message.received', listener);

        // Enregistrer le trigger auprès du bot client
        this.botClient.registerTrigger(this.getName(), areaId);

        this.isRunning = true;
        console.log(`[OnMessageReceived] ✓ Trigger started for AREA ${areaId}`.green);
    }

    /**
     * Arrêter le trigger
     * @param areaId - ID de l'area
     */
    async stop(areaId: string): Promise<void> {
        console.log(`[OnMessageReceived] Stopping trigger for AREA ${areaId}`.yellow);

        // Récupérer et supprimer le listener
        const listener = this.listeners.get(areaId);
        if (listener) {
            await this.eventBus.removeListener('telegram.message.received', listener);
            this.listeners.delete(areaId);
        }

        // Désenregistrer le trigger auprès du bot client
        this.botClient.unregisterTrigger(this.getName(), areaId);

        this.isRunning = false;
        console.log(`[OnMessageReceived] ✓ Trigger stopped for AREA ${areaId}`.yellow);
    }
}
