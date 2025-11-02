import { Router } from 'express';
import { TrelloController } from './controller';
import { TrelloOAuthController } from './TrelloOAuthController';
import { requireAuth } from '../../core/middleware/auth';

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
 * GET /api/trello/authorize
 * Initiate Trello OAuth flow
 * Query params: userId (required)
 */
router.get('/authorize', oauthController.authorize);

/**
 * GET /api/trello/callback
 * Handle Trello OAuth callback
 */
router.get('/callback', oauthController.callback);

/**
 * Protected routes (require auth)
 */
router.use(requireAuth);

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

/**
 * GET /api/trello/connect
 * Vérifie la connexion Trello de l'utilisateur
 */
router.get('/connect', controller.getConnection);

export default router;
