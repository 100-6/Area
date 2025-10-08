import axios from 'axios';
import 'colors';

/**
 * Interface pour les guilds retournées par l'API Discord
 */
interface DiscordGuild {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
    features: string[];
}

/**
 * Interface pour les informations du user Discord
 */
interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    email?: string;
}

/**
 * Service pour interagir avec l'API Discord REST
 * Permet de récupérer les guilds et permissions d'un utilisateur
 */
export class DiscordApiService {
    private static readonly DISCORD_API_BASE = process.env.DISCORD_API_BASE || 'https://discord.com/api/v10';

    /**
     * Récupère les guilds auxquelles l'utilisateur a accès via son OAuth token
     * @param accessToken Token OAuth du user
     * @returns Liste des guilds avec permissions
     */
    static async getUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
        try {
            console.log('[DiscordApiService] Fetching user guilds from Discord API...'.cyan);
            const response = await axios.get<DiscordGuild[]>(
                `${this.DISCORD_API_BASE}/users/@me/guilds`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log(`[DiscordApiService] Found ${response.data.length} guild(s) for user`.green);
            return response.data;
        } catch (error) {
            console.error('[DiscordApiService] Error fetching user guilds:'.red, error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401)
                    throw new Error('DISCORD_TOKEN_INVALID');
                if (error.response?.status === 429)
                    throw new Error('DISCORD_RATE_LIMITED');
            }
            throw new Error('DISCORD_API_ERROR');
        }
    }

    /**
     * Récupère les informations du user Discord
     * @param accessToken Token OAuth du user
     * @returns Informations du user
     */
    static async getUserInfo(accessToken: string): Promise<DiscordUser> {
        try {
            console.log('[DiscordApiService] Fetching user info from Discord API...'.cyan);
            const response = await axios.get<DiscordUser>(
                `${this.DISCORD_API_BASE}/users/@me`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log(`[DiscordApiService] Got user info for ${response.data.username}`.green);
            return response.data;
        } catch (error) {
            console.error('[DiscordApiService] Error fetching user info:'.red, error);
            throw new Error('DISCORD_API_ERROR');
        }
    }

    /**
     * Vérifie si un utilisateur a une permission spécifique sur une guild
     * @param permissions Permissions en format bitfield (string)
     * @param requiredPermission Permission requise (bitfield)
     * @returns true si l'utilisateur a la permission
     */
    static hasPermission(permissions: string, requiredPermission: bigint): boolean {
        const userPermissions = BigInt(permissions);
        const ADMINISTRATOR = BigInt(0x8);

        if ((userPermissions & ADMINISTRATOR) === ADMINISTRATOR)
            return true;
        return (userPermissions & requiredPermission) === requiredPermission;
    }

    /**
     * Permissions Discord courantes (bitfield)
     */
    static readonly Permissions = {
        MANAGE_GUILD: BigInt(0x20),           // Manage server
        MANAGE_CHANNELS: BigInt(0x10),        // Manage channels
        MANAGE_ROLES: BigInt(0x10000000),     // Manage roles
        KICK_MEMBERS: BigInt(0x2),            // Kick members
        BAN_MEMBERS: BigInt(0x4),             // Ban members
        ADMINISTRATOR: BigInt(0x8),           // Administrator
        VIEW_CHANNEL: BigInt(0x400),          // View channels
        SEND_MESSAGES: BigInt(0x800),         // Send messages
        MANAGE_MESSAGES: BigInt(0x2000),      // Manage messages
    };

    /**
     * Filtre les guilds du bot pour ne garder que celles où le user a accès
     * @param botGuildIds IDs des guilds où le bot est présent
     * @param userGuilds Guilds du user avec permissions
     * @param requiredPermission Permission minimale requise (par défaut MANAGE_GUILD)
     * @returns IDs des guilds filtrées
     */
    static filterAuthorizedGuilds(botGuildIds: string[], userGuilds: DiscordGuild[], requiredPermission: bigint = this.Permissions.MANAGE_GUILD): string[] {
        console.log('[DiscordApiService] Filtering authorized guilds...'.cyan);
        const authorizedGuildIds = userGuilds
            .filter(guild => {
                if (!botGuildIds.includes(guild.id))
                    return false;
                if (guild.owner)
                    return true;
                return this.hasPermission(guild.permissions, requiredPermission);
            })
            .map(guild => guild.id);
        console.log(`[DiscordApiService] User has access to ${authorizedGuildIds.length}/${botGuildIds.length} bot guilds`.green);
        return authorizedGuildIds;
    }

    /**
     * Vérifie si un user a accès à une guild spécifique
     * @param guildId ID de la guild
     * @param userGuilds Guilds du user
     * @param requiredPermission Permission requise
     * @returns true si le user a accès
     */
    static canAccessGuild(guildId: string, userGuilds: DiscordGuild[], requiredPermission: bigint = this.Permissions.MANAGE_GUILD): boolean {
        const guild = userGuilds.find(g => g.id === guildId);

        if (!guild)
            return false;
        if (guild.owner)
            return true;
        return this.hasPermission(guild.permissions, requiredPermission);
    }
}
