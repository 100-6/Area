import { Request, Response } from 'express';
import { DiscordBotClient } from './DiscordBotClient';
import 'colors';

/**
 * Controller Discord
 * Gère tous les endpoints liés à Discord
 */
export class DiscordController {
    private botClient: DiscordBotClient;

    constructor() {
        this.botClient = DiscordBotClient.getInstance();
    }

    /**
     * GET /api/discord/bot/status
     * Retourne le statut du bot
     */
    public getBotStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const isConnected = this.botClient.isConnected();
            
            if (isConnected) {
                const client = this.botClient.getClient();
                
                res.json({
                    connected: true,
                    username: client.user?.username,
                    tag: client.user?.tag,
                    id: client.user?.id,
                    guildCount: client.guilds.cache.size,
                    uptime: client.uptime
                });
            } else {
                res.json({ connected: false });
            }
        } catch (error) {
            console.error('[DiscordController] Error fetching bot status:'.red, error);
            res.status(500).json({ 
                error: 'Failed to fetch bot status',
                message: (error as Error).message
            });
        }
    };

    /**
     * GET /api/discord/bot/invite-url
     * Génère l'URL d'invitation du bot
     */
    public getBotInviteUrl = async (req: Request, res: Response): Promise<void> => {
        try {
            const clientId = process.env.DISCORD_CLIENT_ID;
            
            if (!clientId) {
                res.status(500).json({ error: 'Discord client ID not configured' });
                return;
            }
            const permissions = '8';
            const inviteUrl = 
                `https://discord.com/api/oauth2/authorize` +
                `?client_id=${clientId}` +
                `&permissions=${permissions}` +
                `&scope=bot%20applications.commands`;
            
            res.json({ inviteUrl, clientId });
        } catch (error) {
            console.error('[DiscordController] Error generating invite URL:'.red, error);
            res.status(500).json({ 
                error: 'Failed to generate bot invite URL',
                message: (error as Error).message
            });
        }
    };

    /**
     * GET /api/discord/guilds
     * Retourne la liste des serveurs Discord
     */
    public getGuilds = async (req: Request, res: Response): Promise<void> => {
        try {
            console.log('[DiscordController] Fetching guilds...'.cyan);
            if (!this.botClient.isConnected()) {
                res.status(503).json({ 
                    error: 'Discord bot is not connected',
                    message: 'Please wait for the bot to connect'
                });
                return;
            }
            const client = this.botClient.getClient();
            const guilds = Array.from(client.guilds.cache.values()).map(guild => ({
                id: guild.id,
                name: guild.name,
                icon: guild.iconURL() || null,
                memberCount: guild.memberCount,
                ownerId: guild.ownerId,
                joinedAt: guild.joinedAt?.toISOString()
            }));
            console.log(`[DiscordController] Found ${guilds.length} guild(s)`.green);
            res.json({ guilds, count: guilds.length });
        } catch (error) {
            console.error('[DiscordController] Error fetching guilds:'.red, error);
            res.status(500).json({ 
                error: 'Failed to fetch Discord guilds',
                message: (error as Error).message
            });
        }
    };

    /**
     * GET /api/discord/guilds/:guildId/channels
     * Retourne les channels d'un serveur
     */
    public getGuildChannels = async (req: Request, res: Response): Promise<void> => {
        try {
            const { guildId } = req.params;
            
            console.log(`[DiscordController] Fetching channels for guild ${guildId}`.cyan);
            if (!this.botClient.isConnected()) {
                res.status(503).json({ error: 'Discord bot is not connected' });
                return;
            }
            const client = this.botClient.getClient();
            const guild = await client.guilds.fetch(guildId);
            if (!guild) {
                res.status(404).json({ error: 'Guild not found' });
                return;
            }
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
            console.log(`[DiscordController] Found ${channels.length} channel(s)`.green);
            res.json({ 
                guildId: guild.id,
                guildName: guild.name,
                channels,
                count: channels.length
            });
        } catch (error) {
            console.error('[DiscordController] Error fetching channels:'.red, error);
            res.status(500).json({ 
                error: 'Failed to fetch Discord channels',
                message: (error as Error).message
            });
        }
    };

    /**
     * GET /api/discord/guilds/:guildId/roles
     * Retourne les rôles d'un serveur
     */
    public getGuildRoles = async (req: Request, res: Response): Promise<void> => {
        try {
            const { guildId } = req.params;
            
            console.log(`[DiscordController] Fetching roles for guild ${guildId}`.cyan);
            if (!this.botClient.isConnected()) {
                res.status(503).json({ error: 'Discord bot is not connected' });
                return;
            }
            const client = this.botClient.getClient();
            const guild = await client.guilds.fetch(guildId);
            if (!guild) {
                res.status(404).json({ error: 'Guild not found' });
                return;
            }
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
            console.log(`[DiscordController] Found ${roles.length} role(s)`.green);
            res.json({ 
                guildId: guild.id,
                guildName: guild.name,
                roles,
                count: roles.length
            });
        } catch (error) {
            console.error('[DiscordController] Error fetching roles:'.red, error);
            res.status(500).json({ 
                error: 'Failed to fetch Discord roles',
                message: (error as Error).message
            });
        }
    };

    /**
     * GET /api/discord/guilds/:guildId/members/:userId
     * Retourne les infos d'un membre
     */
    public getGuildMember = async (req: Request, res: Response): Promise<void> => {
        try {
            const { guildId, userId } = req.params;
            
            console.log(`[DiscordController] Fetching member ${userId} in guild ${guildId}`.cyan);
            if (!this.botClient.isConnected()) {
                res.status(503).json({ error: 'Discord bot is not connected' });
                return;
            }
            const client = this.botClient.getClient();
            const guild = await client.guilds.fetch(guildId);
            if (!guild) {
                res.status(404).json({ error: 'Guild not found' });
                return;
            }
            const member = await guild.members.fetch(userId);
            if (!member) {
                res.status(404).json({ error: 'Member not found' });
                return;
            }
            const memberData = {
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
            res.json({ member: memberData });
        } catch (error) {
            console.error('[DiscordController] Error fetching member:'.red, error);
            res.status(500).json({ 
                error: 'Failed to fetch Discord member',
                message: (error as Error).message
            });
        }
    };
}

export default DiscordController;
