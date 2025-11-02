import { Router } from 'express';
import { TrelloController } from './controller';
import { requireAuth } from '../../core/middleware/auth';

/**
 * Routes Trello
 * Préfixe: /api/trello
 */
const router = Router();
const controller = new TrelloController();

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
