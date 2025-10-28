import axios, { AxiosInstance } from 'axios';
import 'colors';

/**
 * Service pour interagir avec l'API Telegram Bot
 * Wrapper pour les appels REST API Telegram
 */
export class TelegramApiService {
    private api: AxiosInstance;
    private botToken: string;

    constructor(botToken: string) {
        this.botToken = botToken;
        this.api = axios.create({
            baseURL: `https://api.telegram.org/bot${botToken}`,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Envoyer un message texte
     * @param chatId - ID du chat de destination
     * @param text - Texte du message
     * @param options - Options supplémentaires
     * @returns Informations sur le message envoyé
     */
    async sendMessage(
        chatId: string | number,
        text: string,
        options: {
            parseMode?: 'Markdown' | 'HTML' | 'None';
            replyToMessageId?: string | number;
            disableWebPagePreview?: boolean;
            disableNotification?: boolean;
        } = {}
    ): Promise<any> {
        try {
            console.log(`[Telegram API] Sending message to chat ${chatId}`.cyan);

            const payload: any = {
                chat_id: chatId,
                text: text
            };

            if (options.parseMode && options.parseMode !== 'None') {
                payload.parse_mode = options.parseMode;
            }

            if (options.replyToMessageId) {
                payload.reply_to_message_id = options.replyToMessageId;
            }

            if (options.disableWebPagePreview) {
                payload.disable_web_page_preview = true;
            }

            if (options.disableNotification) {
                payload.disable_notification = true;
            }

            const response = await this.api.post('/sendMessage', payload);

            if (response.data.ok) {
                console.log(`[Telegram API] ✓ Message sent successfully`.green);
                return response.data.result;
            } else {
                throw new Error(response.data.description || 'Failed to send message');
            }
        } catch (error: any) {
            console.error(`[Telegram API] ❌ Failed to send message:`.red, error.message);
            
            if (error.response?.data?.description) {
                throw new Error(`Telegram API Error: ${error.response.data.description}`);
            }
            
            throw error;
        }
    }

    /**
     * Obtenir les informations sur le bot
     * @returns Informations du bot
     */
    async getMe(): Promise<any> {
        try {
            console.log(`[Telegram API] Fetching bot info...`.cyan);
            const response = await this.api.get('/getMe');

            if (response.data.ok) {
                console.log(`[Telegram API] ✓ Bot info retrieved`.green);
                return response.data.result;
            } else {
                throw new Error(response.data.description || 'Failed to get bot info');
            }
        } catch (error: any) {
            console.error(`[Telegram API] ❌ Failed to get bot info:`.red, error.message);
            throw error;
        }
    }

    /**
     * Obtenir les updates (messages) via polling
     * @param offset - Offset pour le polling
     * @param timeout - Timeout en secondes
     * @returns Liste des updates
     */
    async getUpdates(offset?: number, timeout: number = 30): Promise<any[]> {
        try {
            const params: any = {
                timeout: timeout,
                allowed_updates: ['message', 'edited_message', 'channel_post', 'edited_channel_post']
            };

            if (offset !== undefined) {
                params.offset = offset;
            }

            const response = await this.api.get('/getUpdates', {
                params,
                timeout: (timeout + 5) * 1000 // Axios timeout légèrement supérieur
            });

            if (response.data.ok) {
                return response.data.result;
            } else {
                throw new Error(response.data.description || 'Failed to get updates');
            }
        } catch (error: any) {
            // Erreur 409 = Conflit (webhook actif ou autre instance de polling)
            if (error.response?.status === 409) {
                const errorMsg = error.response?.data?.description || error.message;
                // Logger détaillé seulement la première fois, ensuite juste throw
                throw new Error(`Telegram Bot Conflict: ${errorMsg}`);
            }
            
            // Ne pas logger les timeouts (comportement normal du long polling)
            if (error.code !== 'ECONNABORTED') {
                console.error(`[Telegram API] ❌ Failed to get updates:`.red, error.message);
            }
            throw error;
        }
    }

    /**
     * Méthode statique pour créer une instance avec validation du token
     * @param botToken - Token du bot Telegram
     * @returns Instance de TelegramApiService
     */
    static async create(botToken: string): Promise<TelegramApiService> {
        const service = new TelegramApiService(botToken);
        
        // Valider le token en récupérant les infos du bot
        try {
            await service.getMe();
            return service;
        } catch (error) {
            throw new Error('Invalid Telegram bot token');
        }
    }

    /**
     * Valider un token de bot
     * @param botToken - Token à valider
     * @returns true si le token est valide
     */
    static async validateToken(botToken: string): Promise<boolean> {
        try {
            const service = new TelegramApiService(botToken);
            await service.getMe();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Supprimer le webhook configuré (requis pour utiliser le polling)
     * Telegram ne permet pas d'utiliser getUpdates si un webhook est actif
     * @param dropPendingUpdates - Supprimer les updates en attente
     * @returns true si le webhook a été supprimé avec succès
     */
    async deleteWebhook(dropPendingUpdates: boolean = true): Promise<boolean> {
        try {
            console.log('[Telegram API] Deleting webhook to enable polling...'.cyan);
            
            const response = await this.api.post('/deleteWebhook', {
                drop_pending_updates: dropPendingUpdates
            });

            if (response.data.ok) {
                console.log('[Telegram API] ✓ Webhook deleted successfully'.green);
                return true;
            } else {
                console.warn('[Telegram API] ⚠️  Failed to delete webhook:'.yellow, response.data.description);
                return false;
            }
        } catch (error: any) {
            console.error('[Telegram API] ❌ Error deleting webhook:'.red, error.message);
            return false;
        }
    }

    /**
     * Obtenir les informations du webhook configuré
     * Utile pour diagnostiquer les problèmes de polling
     * @returns Informations sur le webhook
     */
    async getWebhookInfo(): Promise<any> {
        try {
            const response = await this.api.get('/getWebhookInfo');
            
            if (response.data.ok) {
                return response.data.result;
            } else {
                throw new Error(response.data.description || 'Failed to get webhook info');
            }
        } catch (error: any) {
            console.error('[Telegram API] ❌ Failed to get webhook info:'.red, error.message);
            throw error;
        }
    }
}

export default TelegramApiService;
