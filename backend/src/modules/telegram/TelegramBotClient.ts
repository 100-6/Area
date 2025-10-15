import { TelegramApiService } from './TelegramApiService';
import { EventBus } from '../../shared/queue/EventBus';
import 'colors';

/**
 * Interface pour un update Telegram
 */
interface TelegramUpdate {
    update_id: number;
    message?: TelegramMessage;
    edited_message?: TelegramMessage;
    channel_post?: TelegramMessage;
    edited_channel_post?: TelegramMessage;
}

/**
 * Interface pour un message Telegram
 */
interface TelegramMessage {
    message_id: number;
    from?: TelegramUser;
    chat: TelegramChat;
    date: number;
    text?: string;
    photo?: any[];
    video?: any;
    document?: any;
    audio?: any;
    voice?: any;
    sticker?: any;
    reply_to_message?: TelegramMessage;
    entities?: any[];
}

/**
 * Interface pour un utilisateur Telegram
 */
interface TelegramUser {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

/**
 * Interface pour un chat Telegram
 */
interface TelegramChat {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    title?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
}

/**
 * Client Telegram Bot - Singleton
 * Gère la connexion au bot Telegram et écoute les événements via long polling
 */
export class TelegramBotClient {
    private static instance: TelegramBotClient;
    private apiService: TelegramApiService | null = null;
    private eventBus: EventBus;
    private isRunning: boolean = false;
    private isReady: boolean = false;
    private lastUpdateId: number = 0;
    private pollingInterval: NodeJS.Timeout | null = null;
    private registeredTriggers: Set<string> = new Set();
    private botInfo: any = null;

    private constructor() {
        this.eventBus = EventBus.getInstance();
    }

    /**
     * Singleton instance
     */
    public static getInstance(): TelegramBotClient {
        if (!TelegramBotClient.instance) {
            TelegramBotClient.instance = new TelegramBotClient();
        }
        return TelegramBotClient.instance;
    }

    /**
     * Connecter le bot à Telegram
     */
    async connect(): Promise<void> {
        const token = process.env.TELEGRAM_BOT_TOKEN;

        if (!token) {
            console.error('[Telegram Bot] ❌ TELEGRAM_BOT_TOKEN not found in environment variables'.red.bold);
            throw new Error('TELEGRAM_BOT_TOKEN is required');
        }

        if (this.isReady) {
            console.log('[Telegram Bot] Already connected'.yellow);
            return;
        }

        try {
            console.log('[Telegram Bot] Connecting to Telegram...'.cyan);

            // Créer le service API
            this.apiService = await TelegramApiService.create(token);

            // Récupérer les informations du bot
            this.botInfo = await this.apiService.getMe();
            this.isReady = true;

            console.log(`[Telegram Bot] ✓ Ready! Logged in as @${this.botInfo.username}`.green.bold);
            console.log(`[Telegram Bot] Bot ID: ${this.botInfo.id}`.cyan);

            // Démarrer le polling
            await this.startPolling();
        } catch (error) {
            console.error('[Telegram Bot] ❌ Failed to connect:'.red, error);
            throw error;
        }
    }

    /**
     * Démarrer le long polling pour recevoir les updates
     */
    private async startPolling(): Promise<void> {
        if (this.isRunning) {
            console.warn('[Telegram Bot] Polling already running'.yellow);
            return;
        }

        this.isRunning = true;
        console.log('[Telegram Bot] Starting long polling...'.cyan);

        // Fonction de polling récursive
        const poll = async () => {
            if (!this.isRunning || !this.apiService) {
                return;
            }

            try {
                const updates = await this.apiService.getUpdates(this.lastUpdateId + 1, 30);

                if (updates && updates.length > 0) {
                    console.log(`[Telegram Bot] Received ${updates.length} update(s)`.gray);

                    for (const update of updates) {
                        await this.handleUpdate(update);
                        this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
                    }
                }
            } catch (error: any) {
                if (error.code !== 'ECONNABORTED') {
                    console.error('[Telegram Bot] Polling error:'.red, error.message);
                }
            }

            // Continuer le polling
            if (this.isRunning) {
                setImmediate(poll);
            }
        };

        // Démarrer le polling
        poll();
        console.log('[Telegram Bot] ✓ Long polling started'.green);
    }

    /**
     * Arrêter le polling
     */
    private stopPolling(): void {
        if (this.isRunning) {
            this.isRunning = false;
            console.log('[Telegram Bot] Polling stopped'.yellow);
        }
    }

    /**
     * Gérer un update Telegram
     */
    private async handleUpdate(update: TelegramUpdate): Promise<void> {
        try {
            // Gérer les différents types d'updates
            if (update.message) {
                await this.handleMessage(update.message, false);
            } else if (update.edited_message) {
                await this.handleMessage(update.edited_message, true);
            } else if (update.channel_post) {
                await this.handleMessage(update.channel_post, false);
            } else if (update.edited_channel_post) {
                await this.handleMessage(update.edited_channel_post, true);
            }
        } catch (error) {
            console.error('[Telegram Bot] Error handling update:'.red, error);
        }
    }

    /**
     * Gérer les commandes du bot
     */
    private async handleCommand(message: TelegramMessage): Promise<void> {
        if (!this.apiService || !message.text || !message.from) {
            return;
        }

        const command = message.text.split(' ')[0].toLowerCase();
        const chatId = message.chat.id;

        try {
            switch (command) {
                case '/start':
                    await this.apiService.sendMessage(
                        chatId,
                        `👋 Welcome to Mirror-Area Bot!\n\n` +
                        `I'm here to help you automate tasks.\n\n` +
                        `Commands:\n` +
                        `/myid - Get your chat ID\n` +
                        `/help - Show help message\n\n` +
                        `To use me in your automations, you'll need your chat ID.`
                    );
                    break;

                case '/myid':
                    const chatType = message.chat.type;
                    const chatInfo = chatType === 'private'
                        ? `👤 Your personal chat ID is: \`${chatId}\``
                        : `👥 This ${chatType} chat ID is: \`${chatId}\``;
                    
                    await this.apiService.sendMessage(
                        chatId,
                        `${chatInfo}\n\n` +
                        `Use this ID in your Mirror-Area triggers to monitor messages in this chat.\n\n` +
                        `📋 Copy this ID and paste it in the "Chat ID" field when creating a Telegram trigger.`,
                        { parseMode: 'Markdown' }
                    );
                    console.log(`[Telegram Bot] Sent chat ID ${chatId} to user`.cyan);
                    break;

                case '/help':
                    await this.apiService.sendMessage(
                        chatId,
                        `🤖 *Mirror-Area Bot Help*\n\n` +
                        `This bot allows you to create automated workflows.\n\n` +
                        `*Available Commands:*\n` +
                        `/start - Welcome message\n` +
                        `/myid - Get your chat ID\n` +
                        `/help - Show this help\n\n` +
                        `*How to use:*\n` +
                        `1. Get your chat ID with /myid\n` +
                        `2. Go to Mirror-Area dashboard\n` +
                        `3. Create a new Area with Telegram trigger\n` +
                        `4. Use your chat ID in the configuration\n\n` +
                        `For more info, visit the Mirror-Area documentation.`,
                        { parseMode: 'Markdown' }
                    );
                    break;
            }
        } catch (error) {
            console.error(`[Telegram Bot] Error handling command ${command}:`.red, error);
        }
    }

    /**
     * Gérer un message reçu
     */
    private async handleMessage(message: TelegramMessage, isEdited: boolean): Promise<void> {
        try {
            // Gérer les commandes spéciales du bot
            if (message.text && message.text.startsWith('/')) {
                await this.handleCommand(message);
            }

            // Déterminer le type de message
            let messageType = 'text';
            if (message.photo) messageType = 'photo';
            else if (message.video) messageType = 'video';
            else if (message.document) messageType = 'document';
            else if (message.audio) messageType = 'audio';
            else if (message.voice) messageType = 'voice';
            else if (message.sticker) messageType = 'sticker';

            const eventData = {
                message: {
                    id: message.message_id,
                    text: message.text || '',
                    date: new Date(message.date * 1000).toISOString(),
                    type: messageType,
                    isEdited: isEdited,
                    entities: message.entities || [],
                    replyToMessage: message.reply_to_message ? {
                        id: message.reply_to_message.message_id,
                        text: message.reply_to_message.text || ''
                    } : null
                },
                from: message.from ? {
                    id: message.from.id,
                    isBot: message.from.is_bot,
                    firstName: message.from.first_name,
                    lastName: message.from.last_name || '',
                    username: message.from.username || '',
                    languageCode: message.from.language_code || ''
                } : null,
                chat: {
                    id: message.chat.id,
                    type: message.chat.type,
                    title: message.chat.title || '',
                    username: message.chat.username || '',
                    firstName: message.chat.first_name || '',
                    lastName: message.chat.last_name || ''
                },
                timestamp: new Date().toISOString()
            };

            const logPrefix = isEdited ? 'edited' : 'received';
            const messagePreview = (message.text || `[${messageType}]`).substring(0, 50);
            const fromDisplay = message.from?.username || message.from?.first_name || 'Unknown';
            
            console.log(`[Telegram Bot] Message ${logPrefix}: "${messagePreview}..." from ${fromDisplay}`.gray);

            // Émettre l'événement vers l'EventBus
            await this.eventBus.emit('telegram.message.received', eventData);
        } catch (error) {
            console.error('[Telegram Bot] Error handling message:'.red, error);
        }
    }

    /**
     * Obtenir le service API
     */
    getApiService(): TelegramApiService {
        if (!this.apiService) {
            throw new Error('Telegram Bot is not connected');
        }
        return this.apiService;
    }

    /**
     * Obtenir les informations du bot
     */
    getBotInfo(): any {
        return this.botInfo;
    }

    /**
     * Vérifier si le bot est connecté
     */
    isConnected(): boolean {
        return this.isReady;
    }

    /**
     * Déconnecter le bot
     */
    async disconnect(): Promise<void> {
        if (this.isRunning) {
            this.stopPolling();
        }

        this.apiService = null;
        this.isReady = false;
        this.botInfo = null;
        console.log('[Telegram Bot] Disconnected'.yellow);
    }

    /**
     * Enregistrer un trigger actif
     */
    registerTrigger(triggerName: string, areaId: string): void {
        const key = `${triggerName}:${areaId}`;
        this.registeredTriggers.add(key);
        console.log(`[Telegram Bot] Trigger registered: ${key}`.green);
    }

    /**
     * Désenregistrer un trigger
     */
    unregisterTrigger(triggerName: string, areaId: string): void {
        const key = `${triggerName}:${areaId}`;
        this.registeredTriggers.delete(key);
        console.log(`[Telegram Bot] Trigger unregistered: ${key}`.yellow);
    }

    /**
     * Vérifier si un trigger est enregistré
     */
    isTriggerRegistered(triggerName: string, areaId: string): boolean {
        const key = `${triggerName}:${areaId}`;
        return this.registeredTriggers.has(key);
    }
}

export default TelegramBotClient;
