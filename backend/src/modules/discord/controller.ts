import { Request, Response, NextFunction } from 'express';
import { DiscordBotClient } from './DiscordBotClient';
import { discordModule } from './service';
import { asyncHandler } from '../../core/middleware/error';
import 'colors';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

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
    public getBotStatus = asyncHandler(async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
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
    });

    /**
     * GET /api/discord/bot/invite-url
     * Génère l'URL d'invitation du bot
     */
    public getBotInviteUrl = asyncHandler(async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        const clientId = process.env.DISCORD_CLIENT_ID;

        if (!clientId) {
            const error = new Error('DISCORD_OAUTH_NOT_CONFIGURED') as CustomError;
            error.statusCode = 500;
            return next(error);
        }
        const permissions = '8';
        const inviteUrl =
            `https://discord.com/api/oauth2/authorize` +
            `?client_id=${clientId}` +
            `&permissions=${permissions}` +
            `&scope=bot%20applications.commands`;
        res.json({ inviteUrl, clientId });
    });

    /**
     * GET /api/discord/guilds
     * Retourne la liste des serveurs Discord où le user a accès
     */
    public getGuilds = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const guilds = await discordModule.getUserAccessibleGuilds(userId);

            res.json({ guilds, count: guilds.length });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/discord/guilds/:guildId/channels
     * Retourne les channels d'un serveur (seulement si le user a accès)
     */
    public getGuildChannels = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { guildId } = req.params;
            const userId = req.user.id;
            const result = await discordModule.getGuildChannels(userId, guildId);

            res.json(result);
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/discord/guilds/:guildId/roles
     * Retourne les rôles d'un serveur (seulement si le user a accès)
     */
    public getGuildRoles = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { guildId } = req.params;
            const userId = req.user.id;
            const result = await discordModule.getGuildRoles(userId, guildId);

            res.json(result);
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/discord/guilds/:guildId/members/:userId
     * Retourne les infos d'un membre (seulement si le user a accès)
     */
    public getGuildMember = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { guildId, userId: memberId } = req.params;
            const userId = req.user.id;
            const member = await discordModule.getGuildMember(userId, guildId, memberId);

            res.json({ member });
        } catch (error) {
            next(error);
        }
    });
}

export default DiscordController;
