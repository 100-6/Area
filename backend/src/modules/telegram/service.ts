import { BaseModule } from '../_base/BaseModule';
import { TelegramBotClient } from './TelegramBotClient';
import { TelegramApiService } from './TelegramApiService';
import telegramConfig from './config';
import 'colors';

import { OnMessageReceived } from './triggers/_index';
import { SendMessage } from './actions/_index';

/**
 * Module Telegram principal
 * Gère l'intégration avec Telegram (bot, triggers, actions)
 */
export class TelegramModule extends BaseModule {
    private botClient: TelegramBotClient;

    constructor() {
        super({
            name: telegramConfig.name,
            displayName: telegramConfig.displayName,
            description: telegramConfig.description,
            iconUrl: telegramConfig.iconUrl,
            color: telegramConfig.color,
            authType: telegramConfig.authType as 'bot_token',
            isActive: telegramConfig.isActive
        });
        this.botClient = TelegramBotClient.getInstance();
    }

    getName(): string {
        return 'telegram';
    }

    /**
     * Initialiser le module Telegram
     * - Connecter le bot
     * - Enregistrer les triggers
     * - Enregistrer les actions
     */
    async initialize(): Promise<void> {
        console.log('[Telegram] Initializing Telegram module...'.cyan);

        try {
            // Connecter le bot
            await this.connectBot();

            // Enregistrer les triggers
            this.registerTrigger(new OnMessageReceived());

            // Enregistrer les actions
            this.registerAction(new SendMessage());

            console.log('[Telegram] ✓ Module initialized successfully'.green.bold);
        } catch (error) {
            console.error('[Telegram] ❌ Failed to initialize module:'.red, error);
            throw error;
        }
    }

    /**
     * Connecter le bot Telegram
     */
    private async connectBot(): Promise<void> {
        try {
            if (!process.env.TELEGRAM_BOT_TOKEN) {
                console.warn('[Telegram] ⚠️  TELEGRAM_BOT_TOKEN not configured, bot features will be disabled'.yellow.bold);
                return;
            }

            console.log('[Telegram] Connecting bot to Telegram...'.cyan);
            await this.botClient.connect();
            console.log('[Telegram] ✓ Bot connected successfully'.green);
        } catch (error) {
            console.error('[Telegram] ❌ Failed to connect bot:'.red, error);
            throw error;
        }
    }

    /**
     * Obtenir le client Telegram bot
     */
    getBotClient(): TelegramBotClient {
        return this.botClient;
    }

    /**
     * Vérifier si le bot est connecté
     */
    isBotConnected(): boolean {
        return this.botClient.isConnected();
    }

    /**
     * Déconnecter le bot Telegram (cleanup)
     */
    async cleanup(): Promise<void> {
        console.log('[Telegram] Cleaning up Telegram module...'.yellow);

        try {
            await this.botClient.disconnect();
            console.log('[Telegram] ✓ Module cleaned up successfully'.green);
        } catch (error) {
            console.error('[Telegram] ❌ Error during cleanup:'.red, error);
        }
    }

    /**
     * Récupère les informations du bot
     * @returns Informations du bot
     */
    async getBotInfo(): Promise<any> {
        console.log('[Telegram] Fetching bot info'.cyan);

        if (!this.botClient.isConnected()) {
            throw new Error('TELEGRAM_BOT_NOT_CONNECTED');
        }

        return this.botClient.getBotInfo();
    }

    /**
     * Envoyer un message de test
     * @param chatId - ID du chat
     * @param text - Texte du message
     * @returns Informations sur le message envoyé
     */
    async sendTestMessage(chatId: string | number, text: string): Promise<any> {
        console.log(`[Telegram] Sending test message to chat ${chatId}`.cyan);

        if (!this.botClient.isConnected()) {
            throw new Error('TELEGRAM_BOT_NOT_CONNECTED');
        }

        const apiService = this.botClient.getApiService();
        const sentMessage = await apiService.sendMessage(chatId, text);

        console.log(`[Telegram] Test message sent to chat ${chatId}`.green);
        return sentMessage;
    }

    /**
     * Valider un token de bot Telegram
     * @param botToken - Token à valider
     * @returns true si le token est valide
     */
    async validateBotToken(botToken: string): Promise<boolean> {
        console.log('[Telegram] Validating bot token'.cyan);

        try {
            const isValid = await TelegramApiService.validateToken(botToken);
            
            if (isValid) {
                console.log('[Telegram] ✓ Bot token is valid'.green);
            } else {
                console.log('[Telegram] ❌ Bot token is invalid'.red);
            }

            return isValid;
        } catch (error) {
            console.error('[Telegram] ❌ Error validating token:'.red, error);
            return false;
        }
    }
}

/**
 * Export de l'instance du module Telegram
 */
export const telegramModule = new TelegramModule();
