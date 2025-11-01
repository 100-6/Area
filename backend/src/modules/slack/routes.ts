import { Router } from 'express';
import { SlackController } from './controller';
import { requireAuth } from '../../core/middleware/auth';
import { requireSlackAuth } from './middlewareSlack';

/**
 * Routes Slack
 * Préfixe: /api/slack
 */
const router = Router();
const controller = new SlackController();

/**
 * OAuth Routes (public)
 */
router.get('/connect', controller.connect);
router.get('/callback', controller.callback);

/**
 * Protected routes (require auth + Slack connection)
 */
router.use(requireAuth);
router.use(requireSlackAuth);

/**
 * GET /api/slack/channels
 * Récupère la liste des canaux Slack disponibles
 */
router.get('/channels', controller.getChannels);

/**
 * GET /api/slack/users
 * Récupère la liste des utilisateurs Slack du workspace
 */
router.get('/users', controller.getUsers);

export default router;
