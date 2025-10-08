import { BaseModule } from '../_base/BaseModule';
import { DiscordBotClient } from './DiscordBotClient';
import { DiscordApiService } from './DiscordApiService';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';
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

    /**
     * Récupère les guilds Discord accessibles par l'utilisateur
     * @param userId ID de l'utilisateur
     * @returns Liste des guilds avec informations
     */
    async getUserAccessibleGuilds(userId: string): Promise<any[]> {
        console.log(`[Discord] Fetching accessible guilds for user ${userId}`.cyan);
        const discordAuth = await UserAuthProvider.findByUserAndProvider(userId, 'discord');

        if (!discordAuth || !discordAuth.access_token)
            throw new Error('DISCORD_NOT_CONNECTED');
        const userGuilds = await DiscordApiService.getUserGuilds(discordAuth.access_token);
        const client = this.botClient.getClient();
        const botGuildIds = Array.from(client.guilds.cache.keys());
        const authorizedGuildIds = DiscordApiService.filterAuthorizedGuilds(botGuildIds, userGuilds, DiscordApiService.Permissions.MANAGE_GUILD);
        const guilds = Array.from(client.guilds.cache.values())
            .filter(guild => authorizedGuildIds.includes(guild.id))
            .map(guild => ({
                id: guild.id,
                name: guild.name,
                icon: guild.iconURL() || null,
                memberCount: guild.memberCount,
                ownerId: guild.ownerId,
                joinedAt: guild.joinedAt?.toISOString()
            }));
        console.log(`[Discord] User has access to ${guilds.length} guild(s)`.green);
        return guilds;
    }

    /**
     * Récupère les channels d'une guild si l'utilisateur a accès
     * @param userId ID de l'utilisateur
     * @param guildId ID de la guild
     * @returns Informations de la guild et ses channels
     */
    async getGuildChannels(userId: string, guildId: string): Promise<any> {
        console.log(`[Discord] Fetching channels for guild ${guildId}, user ${userId}`.cyan);
        const discordAuth = await UserAuthProvider.findByUserAndProvider(userId, 'discord');

        if (!discordAuth || !discordAuth.access_token)
            throw new Error('DISCORD_NOT_CONNECTED');
        const userGuilds = await DiscordApiService.getUserGuilds(discordAuth.access_token);
        const hasAccess = DiscordApiService.canAccessGuild(guildId, userGuilds, DiscordApiService.Permissions.MANAGE_CHANNELS);
        if (!hasAccess)
            throw new Error('ACCESS_DENIED');
        const client = this.botClient.getClient();
        const guild = await client.guilds.fetch(guildId);
        if (!guild)
            throw new Error('GUILD_NOT_FOUND');
        const channels = Array.from(guild.channels.cache.values())
            .filter(channel => channel.isTextBased())
            .map(channel => ({
                id: channel.id,
                name: channel.name,
                type: channel.type,
                parentId: channel.parentId,
                position: (channel as any).position || 0
            }))
            .sort((a, b) => a.position - b.position);
        console.log(`[Discord] Found ${channels.length} channel(s)`.green);
        return {
            guildId: guild.id,
            guildName: guild.name,
            channels,
            count: channels.length
        };
    }

    /**
     * Récupère les rôles d'une guild si l'utilisateur a accès
     * @param userId ID de l'utilisateur
     * @param guildId ID de la guild
     * @returns Informations de la guild et ses rôles
     */
    async getGuildRoles(userId: string, guildId: string): Promise<any> {
        console.log(`[Discord] Fetching roles for guild ${guildId}, user ${userId}`.cyan);
        const discordAuth = await UserAuthProvider.findByUserAndProvider(userId, 'discord');

        if (!discordAuth || !discordAuth.access_token)
            throw new Error('DISCORD_NOT_CONNECTED');
        const userGuilds = await DiscordApiService.getUserGuilds(discordAuth.access_token);
        const hasAccess = DiscordApiService.canAccessGuild(guildId, userGuilds, DiscordApiService.Permissions.MANAGE_ROLES);
        if (!hasAccess)
            throw new Error('ACCESS_DENIED');
        const client = this.botClient.getClient();
        const guild = await client.guilds.fetch(guildId);
        if (!guild)
            throw new Error('GUILD_NOT_FOUND');
        const roles = Array.from(guild.roles.cache.values())
            .filter(role => role.id !== guild.id)
            .map(role => ({
                id: role.id,
                name: role.name,
                color: role.hexColor,
                position: role.position,
                managed: role.managed,
                mentionable: role.mentionable,
                hoist: role.hoist
            }))
            .sort((a, b) => b.position - a.position);
        console.log(`[Discord] Found ${roles.length} role(s)`.green);
        return {
            guildId: guild.id,
            guildName: guild.name,
            roles,
            count: roles.length
        };
    }

    /**
     * Récupère les informations d'un membre d'une guild
     * @param userId ID de l'utilisateur
     * @param guildId ID de la guild
     * @param memberId ID du membre à récupérer
     * @returns Informations du membre
     */
    async getGuildMember(userId: string, guildId: string, memberId: string): Promise<any> {
        console.log(`[Discord] Fetching member ${memberId} in guild ${guildId}, user ${userId}`.cyan);
        const discordAuth = await UserAuthProvider.findByUserAndProvider(userId, 'discord');

        if (!discordAuth || !discordAuth.access_token)
            throw new Error('DISCORD_NOT_CONNECTED');
        const userGuilds = await DiscordApiService.getUserGuilds(discordAuth.access_token);
        const hasAccess = DiscordApiService.canAccessGuild(guildId, userGuilds, DiscordApiService.Permissions.VIEW_CHANNEL);
        if (!hasAccess)
            throw new Error('ACCESS_DENIED');
        const client = this.botClient.getClient();
        const guild = await client.guilds.fetch(guildId);
        if (!guild)
            throw new Error('GUILD_NOT_FOUND');
        const member = await guild.members.fetch(memberId);
        if (!member)
            throw new Error('MEMBER_NOT_FOUND');
        return {
            id: member.id,
            username: member.user.username,
            tag: member.user.tag,
            avatarUrl: member.user.displayAvatarURL(),
            joinedAt: member.joinedAt?.toISOString(),
            roles: member.roles.cache.map(role => ({
                id: role.id,
                name: role.name,
                color: role.hexColor
            })),
            nickname: member.nickname,
            isBot: member.user.bot
        };
    }
}

/**
 * Export de l'instance du module Discord
 */
export const discordModule = new DiscordModule();
