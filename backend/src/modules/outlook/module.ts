import { BaseModule } from '../_base/BaseModule';
import { OutlookService } from './service';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';
import outlookConfig from './config';
import 'colors';

import { OnNewEmailTrigger, OnEmailWithAttachmentTrigger, OnCalendarEventCreatedTrigger } from './triggers/_index';
import { SendEmailAction, CreateCalendarEventAction } from './actions/_index';

/**
 * Module Outlook principal
 * Gère l'intégration avec Outlook (triggers, actions)
 */
export class OutlookModule extends BaseModule {
    private outlookService: OutlookService;

    constructor() {
        super({
            name: outlookConfig.name,
            displayName: outlookConfig.displayName,
            description: outlookConfig.description,
            iconUrl: outlookConfig.iconUrl,
            color: outlookConfig.color,
            authType: outlookConfig.authType as 'oauth2',
            isActive: outlookConfig.isActive
        });
        this.outlookService = new OutlookService();
    }

    getName(): string {
        return 'outlook';
    }

    /**
     * Initialiser le module Outlook
     * - Enregistrer les triggers
     * - Enregistrer les actions
     */
    async initialize(): Promise<void> {
        console.log('[Outlook] Initializing Outlook module...'.cyan);

        try {
            // Add Triggers
            this.registerTrigger(new OnNewEmailTrigger());
            this.registerTrigger(new OnEmailWithAttachmentTrigger());
            this.registerTrigger(new OnCalendarEventCreatedTrigger());
            // Add Actions
            this.registerAction(new SendEmailAction());
            this.registerAction(new CreateCalendarEventAction());
            console.log('[Outlook] ✓ Module initialized successfully'.green.bold);
        } catch (error) {
            console.error('[Outlook] Failed to initialize module:'.red, error);
            throw error;
        }
    }

    /**
     * Obtenir le service Outlook
     */
    getOutlookService(): OutlookService {
        return this.outlookService;
    }

    /**
     * Nettoyer le module (cleanup)
     */
    async cleanup(): Promise<void> {
        console.log('[Outlook] Cleaning up Outlook module...'.yellow);

        try {
            console.log('[Outlook] ✓ Module cleaned up successfully'.green);
        } catch (error) {
            console.error('[Outlook] Error during cleanup:'.red, error);
        }
    }

    /**
     * Récupère les dossiers mail accessibles par l'utilisateur
     * @param userId ID de l'utilisateur
     * @returns Liste des dossiers avec informations
     */
    async getUserFolders(userId: string): Promise<any[]> {
        console.log(`[Outlook] Fetching folders for user ${userId}`.cyan);
        const outlookAuth = await UserAuthProvider.findByUserAndProvider(userId, 'outlook');

        if (!outlookAuth || !outlookAuth.access_token)
            throw new Error('OUTLOOK_NOT_CONNECTED');
        const folders = await this.outlookService.listFolders(outlookAuth.access_token, outlookAuth.refresh_token);
        console.log(`[Outlook] User has ${folders.length} folder(s)`.green);
        return folders;
    }

    /**
     * Récupère les messages Outlook de l'utilisateur
     * @param userId ID de l'utilisateur
     * @param filters Filtres optionnels (from, subject, hasAttachment, folderName, maxResults)
     * @returns Liste des messages avec informations
     */
    async getUserMessages(userId: string, filters?: { from?: string; subject?: string; hasAttachment?: boolean; folderName?: string; maxResults?: number; }): Promise<any[]> {
        console.log(`[Outlook] Fetching messages for user ${userId}`.cyan);
        const outlookAuth = await UserAuthProvider.findByUserAndProvider(userId, 'outlook');

        if (!outlookAuth || !outlookAuth.access_token)
            throw new Error('OUTLOOK_NOT_CONNECTED');
        const messages = await this.outlookService.listMessages(outlookAuth.access_token, {...filters, refreshToken: outlookAuth.refresh_token});
        console.log(`[Outlook] Found ${messages.length} message(s)`.green);
        return messages;
    }

    /**
     * Récupère un message spécifique
     * @param userId ID de l'utilisateur
     * @param messageId ID du message
     * @returns Informations du message
     */
    async getMessage(userId: string, messageId: string): Promise<any> {
        console.log(`[Outlook] Fetching message ${messageId} for user ${userId}`.cyan);
        const outlookAuth = await UserAuthProvider.findByUserAndProvider(userId, 'outlook');

        if (!outlookAuth || !outlookAuth.access_token)
            throw new Error('OUTLOOK_NOT_CONNECTED');
        const message = await this.outlookService.getMessage(outlookAuth.access_token, messageId, outlookAuth.refresh_token);
        console.log(`[Outlook] Message retrieved successfully`.green);
        return message;
    }

    /**
     * Récupère les événements de calendrier de l'utilisateur
     * @param userId ID de l'utilisateur
     * @param filters Filtres optionnels (calendarId, maxResults)
     * @returns Liste des événements avec informations
     */
    async getUserCalendarEvents(userId: string, filters?: { calendarId?: string; maxResults?: number; }): Promise<any[]> {
        console.log(`[Outlook] Fetching calendar events for user ${userId}`.cyan);
        const outlookAuth = await UserAuthProvider.findByUserAndProvider(userId, 'outlook');

        if (!outlookAuth || !outlookAuth.access_token)
            throw new Error('OUTLOOK_NOT_CONNECTED');
        const events = await this.outlookService.listCalendarEvents(outlookAuth.access_token, {...filters, refreshToken: outlookAuth.refresh_token});
        console.log(`[Outlook] Found ${events.length} calendar event(s)`.green);
        return events;
    }
}

/**
 * Export de l'instance du module Outlook
 */
export const outlookModule = new OutlookModule();
