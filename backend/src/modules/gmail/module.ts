import { BaseModule } from '../_base/BaseModule';
import { GmailService } from './service';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';
import gmailConfig from './config';
import 'colors';

import { OnNewEmailTrigger, OnLabeledEmailTrigger } from './triggers/_index';
import { SendEmailAction, AddLabelAction, MarkAsReadAction, MoveToTrashAction } from './actions/_index';

/**
 * Module Gmail principal
 * Gère l'intégration avec Gmail (triggers, actions)
 */
export class GmailModule extends BaseModule {
    private gmailService: GmailService;

    constructor() {
        super({
            name: gmailConfig.name,
            displayName: gmailConfig.displayName,
            description: gmailConfig.description,
            iconUrl: gmailConfig.iconUrl,
            color: gmailConfig.color,
            authType: gmailConfig.authType as 'oauth2',
            isActive: gmailConfig.isActive
        });
        this.gmailService = new GmailService();
    }

    getName(): string {
        return 'gmail';
    }

    /**
     * Initialiser le module Gmail
     * - Enregistrer les triggers
     * - Enregistrer les actions
     */
    async initialize(): Promise<void> {
        console.log('[Gmail] Initializing Gmail module...'.cyan);

        try {
            // Add Triggers
            this.registerTrigger(new OnNewEmailTrigger());
            this.registerTrigger(new OnLabeledEmailTrigger());
            // Add Actions
            this.registerAction(new SendEmailAction());
            this.registerAction(new AddLabelAction());
            this.registerAction(new MarkAsReadAction());
            this.registerAction(new MoveToTrashAction());
            console.log('[Gmail] ✓ Module initialized successfully'.green.bold);
        } catch (error) {
            console.error('[Gmail] Failed to initialize module:'.red, error);
            throw error;
        }
    }

    /**
     * Obtenir le service Gmail
     */
    getGmailService(): GmailService {
        return this.gmailService;
    }

    /**
     * Nettoyer le module (cleanup)
     */
    async cleanup(): Promise<void> {
        console.log('[Gmail] Cleaning up Gmail module...'.yellow);

        try {
            console.log('[Gmail] ✓ Module cleaned up successfully'.green);
        } catch (error) {
            console.error('[Gmail] Error during cleanup:'.red, error);
        }
    }

    /**
     * Récupère les labels Gmail accessibles par l'utilisateur
     * @param userId ID de l'utilisateur
     * @returns Liste des labels avec informations
     */
    async getUserLabels(userId: string): Promise<any[]> {
        console.log(`[Gmail] Fetching labels for user ${userId}`.cyan);
        const gmailAuth = await UserAuthProvider.findByUserAndProvider(userId, 'gmail');

        if (!gmailAuth || !gmailAuth.access_token)
            throw new Error('GMAIL_NOT_CONNECTED');
        const labels = await this.gmailService.listLabels(gmailAuth.access_token, gmailAuth.refresh_token);
        console.log(`[Gmail] User has ${labels.length} label(s)`.green);
        return labels;
    }

    /**
     * Récupère les messages Gmail de l'utilisateur
     * @param userId ID de l'utilisateur
     * @param filters Filtres optionnels (from, subject, hasAttachment, labelIds, maxResults)
     * @returns Liste des messages avec informations
     */
    async getUserMessages(userId: string, filters?: { from?: string; subject?: string; hasAttachment?: boolean; labelIds?: string[]; maxResults?: number; }): Promise<any[]> {
        console.log(`[Gmail] Fetching messages for user ${userId}`.cyan);
        const gmailAuth = await UserAuthProvider.findByUserAndProvider(userId, 'gmail');

        if (!gmailAuth || !gmailAuth.access_token)
            throw new Error('GMAIL_NOT_CONNECTED');
        const messages = await this.gmailService.listMessages(gmailAuth.access_token, {...filters, refreshToken: gmailAuth.refresh_token});
        console.log(`[Gmail] Found ${messages.length} message(s)`.green);
        return messages;
    }

    /**
     * Récupère un message spécifique
     * @param userId ID de l'utilisateur
     * @param messageId ID du message
     * @returns Informations du message
     */
    async getMessage(userId: string, messageId: string): Promise<any> {
        console.log(`[Gmail] Fetching message ${messageId} for user ${userId}`.cyan);
        const gmailAuth = await UserAuthProvider.findByUserAndProvider(userId, 'gmail');

        if (!gmailAuth || !gmailAuth.access_token)
            throw new Error('GMAIL_NOT_CONNECTED');
        const message = await this.gmailService.getMessage(gmailAuth.access_token, messageId, gmailAuth.refresh_token);
        console.log(`[Gmail] Message retrieved successfully`.green);
        return message;
    }
}

/**
 * Export de l'instance du module Gmail
 */
export const gmailModule = new GmailModule();