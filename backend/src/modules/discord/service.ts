import { BaseModule } from '../_base/BaseModule';
import { DiscordBotClient } from './DiscordBotClient';
import discordConfig from './config';
import 'colors';

import { OnMessageCreated, OnMemberJoin, OnReactionAdded } from './triggers/_index';
import { SendMessage, AddRole, KickMember, SendWebhookMessage} from './actions/_index';

/**
 * Module Discord principal
 * Gère l'intégration avec Discord (bot, triggers, actions)
 */
export class DiscordModule extends BaseModule {
    private botClient: DiscordBotClient;

    constructor() {
        super({
            name: discordConfig.name,
            displayName: discordConfig.displayName,
            description: discordConfig.description,
            iconUrl: discordConfig.iconUrl,
            color: discordConfig.color,
            authType: discordConfig.authType as 'oauth2',
            isActive: discordConfig.isActive
        });

        this.botClient = DiscordBotClient.getInstance();
    }

    getName(): string {
        return 'discord';
    }

    /**
     * Initialiser le module Discord
     * - Connecter le bot
     * - Enregistrer les triggers
     * - Enregistrer les actions
     */
    async initialize(): Promise<void> {
        console.log('[Discord] Initializing Discord module...'.cyan);

        try {
            await this.connectBot();
            // Add Triggers
            this.registerTrigger(new OnMessageCreated());
            this.registerTrigger(new OnMemberJoin());
            this.registerTrigger(new OnReactionAdded());
            // Add Actions
            this.registerAction(new SendMessage());
            this.registerAction(new AddRole());
            this.registerAction(new KickMember());
            this.registerAction(new SendWebhookMessage());
            console.log('[Discord] ✓ Module initialized successfully'.green.bold);
        } catch (error) {
            console.error('[Discord] ❌ Failed to initialize module:'.red, error);
            throw error;
        }
    }

    /**
     * Connecter le bot Discord
     */
    private async connectBot(): Promise<void> {
        try {
            if (!process.env.DISCORD_BOT_TOKEN) {
                console.warn('[Discord] ⚠️  DISCORD_BOT_TOKEN not configured, bot features will be disabled'.yellow.bold);
                return;
            }
            console.log('[Discord] Connecting bot to Discord...'.cyan);
            await this.botClient.connect();
            console.log('[Discord] ✓ Bot connected successfully'.green);
        } catch (error) {
            console.error('[Discord] ❌ Failed to connect bot:'.red, error);
            throw error;
        }
        }

    /**
     * Vérifier l'accès utilisateur au module
     * Pour Discord, on vérifie si l'utilisateur a connecté son compte via OAuth
     */
    protected async checkUserAccess(userId: string): Promise<boolean> {
        // TODO: Implement actual check from database
        // but need implement userservice model connection first so for now just log and return true
        return true;
    }

    /**
     * Hook appelé quand un utilisateur se connecte au service Discord via OAuth
     */
    async onUserConnected(userId: string, accessToken: string): Promise<void> {
        console.log(`[Discord] User ${userId} connected to Discord`.green);
        // TODO: Store tokens in the database
        // but need implement userservice model connection first so for now just log
        
    }

    /**
     * Hook appelé quand un utilisateur se déconnecte du service Discord
     */
    async onUserDisconnected(userId: string): Promise<void> {
        console.log(`[Discord] User ${userId} disconnected from Discord`.yellow);
        // TODO: Disable active triggers for this user
    }

    /**
     * Arrêter tous les triggers d'un utilisateur
     */
    private async stopAllUserTriggers(userId: string): Promise<void> {
        console.log(`[Discord] Stopping all triggers for user ${userId}`.yellow);
        // TODO: Implement logic to stop all active triggers
    }

    /**
     * Obtenir le client Discord bot
     */
    getBotClient(): DiscordBotClient {
        return this.botClient;
    }

    /**
     * Vérifier si le bot est connecté
     */
    isBotConnected(): boolean {
        return this.botClient.isConnected();
    }

    /**
     * Déconnecter le bot Discord (cleanup)
     */
    async cleanup(): Promise<void> {
        console.log('[Discord] Cleaning up Discord module...'.yellow);
        
        try {
            await this.botClient.disconnect();
            console.log('[Discord] ✓ Module cleaned up successfully'.green);
        } catch (error) {
            console.error('[Discord] ❌ Error during cleanup:'.red, error);
        }
    }
}

/**
 * Export de l'instance du module Discord
 */
export const discordModule = new DiscordModule();
