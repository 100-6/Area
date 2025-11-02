import { Router } from 'express';
import { TrelloController } from './controller';
import { TrelloOAuthController } from './TrelloOAuthController';
import { requireAuth } from '../../core/middleware/auth';
import { requireTrelloAuth } from './middlewareTrello';

/**
 * Routes Trello
 * Préfixe: /api/trello
 */
const router = Router();
const controller = new TrelloController();
const oauthController = new TrelloOAuthController();

/**
 * PUBLIC OAuth routes (no auth required)
 */

/**
 * GET /api/trello/connect
 * Initiate Trello OAuth flow
 * Query params: userId (required)
 */
router.get('/connect', oauthController.authorize);

/**
 * GET /api/trello/callback
 * Handle Trello OAuth callback
 */
router.get('/callback', oauthController.callback);

/**
 * Protected routes (require auth + Trello connection)
 */
router.use(requireAuth);
router.use(requireTrelloAuth);

/**
 * GET /api/trello/boards
 * Récupère la liste des boards Trello de l'utilisateur
 */
router.get('/boards', controller.getBoards);

/**
 * GET /api/trello/boards/:boardId
 * Récupère un board spécifique
 */
router.get('/boards/:boardId', controller.getBoard);

export default router;
