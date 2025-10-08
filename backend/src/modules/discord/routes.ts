import { Router } from 'express';
import { DiscordController } from './controller';
import { requireAuth } from '../../core/middleware/auth';
import { requireDiscordAuth, requireDiscordBotConnected } from './middlewareDiscord';

/**
 * Routes Discord
 * Préfixe: /api/discord
 */
const router = Router();
const controller = new DiscordController();

router.use(requireAuth);
router.use(requireDiscordAuth);

/**
 * GET /api/discord/bot/status
 * Retourne le statut du bot Discord
 */
router.get('/bot/status', controller.getBotStatus);

/**
 * GET /api/discord/bot/invite-url
 * Génère l'URL d'invitation du bot
 */
router.get('/bot/invite-url', controller.getBotInviteUrl);

/**
 * GET /api/discord/guilds
 * Liste tous les serveurs Discord où le bot est présent
 */
router.get('/guilds', requireDiscordBotConnected, controller.getGuilds);

/**
 * GET /api/discord/guilds/:guildId/channels
 * Liste les channels d'un serveur
 */
router.get('/guilds/:guildId/channels', requireDiscordBotConnected, controller.getGuildChannels);

/**
 * GET /api/discord/guilds/:guildId/roles
 * Liste les rôles d'un serveur
 */
router.get('/guilds/:guildId/roles', requireDiscordBotConnected, controller.getGuildRoles);

/**
 * GET /api/discord/guilds/:guildId/members/:userId
 * Récupère les informations d'un membre
 */
router.get('/guilds/:guildId/members/:userId', requireDiscordBotConnected, controller.getGuildMember);

export default router;
