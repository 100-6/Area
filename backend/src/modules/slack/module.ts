import { BaseModule } from '../_base/BaseModule';
import { SlackApiService } from './service';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';
import slackConfig from './config';
import 'colors';

import {
    OnNewMessageTrigger,
    OnDirectMessageTrigger,
    OnUserJoinedChannelTrigger,
    OnReactionAddedTrigger,
    OnChannelCreatedTrigger,
    OnFileSharedTrigger
} from './triggers/_index';

import {
    SendMessageAction,
    SendDirectMessageAction,
    ReplyInThreadAction,
    CreateChannelAction,
    InviteUserToChannelAction,
    SetChannelTopicAction,
    AddReactionAction,
    PinMessageAction
} from './actions/_index';

/**
 * Module Slack principal
 * Gère l'intégration avec Slack (triggers, actions)
 */
export class SlackModule extends BaseModule {
    constructor() {
        super({
            name: slackConfig.name,
            displayName: slackConfig.displayName,
            description: slackConfig.description,
            iconUrl: slackConfig.iconUrl,
            color: slackConfig.color,
            authType: slackConfig.authType as 'oauth2',
            isActive: slackConfig.isActive
        });
    }

    getName(): string {
        return 'slack';
    }

    /**
     * Initialiser le module Slack
     * - Enregistrer les triggers
     * - Enregistrer les actions
     */
    async initialize(): Promise<void> {
        console.log('[Slack] Initializing Slack module...'.cyan);

        try {
            // Register triggers
            this.registerTrigger(new OnNewMessageTrigger());
            this.registerTrigger(new OnDirectMessageTrigger());
            this.registerTrigger(new OnUserJoinedChannelTrigger());
            this.registerTrigger(new OnReactionAddedTrigger());
            this.registerTrigger(new OnChannelCreatedTrigger());
            this.registerTrigger(new OnFileSharedTrigger());

            // Register actions
            this.registerAction(new SendMessageAction());
            this.registerAction(new SendDirectMessageAction());
            this.registerAction(new ReplyInThreadAction());
            this.registerAction(new CreateChannelAction());
            this.registerAction(new InviteUserToChannelAction());
            this.registerAction(new SetChannelTopicAction());
            this.registerAction(new AddReactionAction());
            this.registerAction(new PinMessageAction());
            console.log('[Slack] ✓ Module initialized successfully'.green.bold);
        } catch (error) {
            console.error('[Slack] Failed to initialize module:'.red, error);
            throw error;
        }
    }

    /**
     * Nettoyer le module (cleanup)
     */
    async cleanup(): Promise<void> {
        console.log('[Slack] Cleaning up Slack module...'.yellow);

        try {
            console.log('[Slack] ✓ Module cleaned up successfully'.green);
        } catch (error) {
            console.error('[Slack] Error during cleanup:'.red, error);
        }
    }

    /**
     * Récupère les canaux Slack accessibles par l'utilisateur
     * @param userId ID de l'utilisateur
     * @returns Liste des canaux avec informations
     */
    async getUserChannels(userId: string): Promise<any[]> {
        console.log(`[Slack] Fetching channels for user ${userId}`.cyan);
        const slackConnection = await UserAuthProvider.findByUserAndProvider(userId, 'slack');

        if (!slackConnection || !slackConnection.access_token)
            throw new Error('SLACK_NOT_CONNECTED');
        const channels = await SlackApiService.getChannelsList(slackConnection.access_token, 'public_channel,private_channel');
        console.log(`[Slack] User has access to ${channels.length} channel(s)`.green);
        return channels;
    }

    /**
     * Récupère les utilisateurs du workspace Slack
     * @param userId ID de l'utilisateur
     * @returns Liste des utilisateurs
     */
    async getWorkspaceUsers(userId: string): Promise<any[]> {
        console.log(`[Slack] Fetching workspace users for user ${userId}`.cyan);
        const slackConnection = await UserAuthProvider.findByUserAndProvider(userId, 'slack');

        if (!slackConnection || !slackConnection.access_token)
            throw new Error('SLACK_NOT_CONNECTED');
        const users = await SlackApiService.getUsersList(slackConnection.access_token);
        console.log(`[Slack] Found ${users.length} user(s) in workspace`.green);
        return users;
    }

    /**
     * Récupère l'historique d'un canal Slack
     * @param userId ID de l'utilisateur
     * @param channelId ID du canal
     * @param limit Nombre de messages à récupérer
     * @returns Liste des messages
     */
    async getChannelHistory(userId: string, channelId: string, limit: number = 100): Promise<any[]> {
        console.log(`[Slack] Fetching history for channel ${channelId}`.cyan);
        const slackConnection = await UserAuthProvider.findByUserAndProvider(userId, 'slack');

        if (!slackConnection || !slackConnection.access_token)
            throw new Error('SLACK_NOT_CONNECTED');
        const messages = await SlackApiService.getChannelHistory(slackConnection.access_token, channelId, limit);
        console.log(`[Slack] Retrieved ${messages.length} message(s)`.green);
        return messages;
    }
}

/**
 * Export de l'instance du module Slack
 */
export const slackModule = new SlackModule();
