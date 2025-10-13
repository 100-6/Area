import { Router } from 'express';
import { OpenAIController } from './controller';
import { requireAuth } from '../../core/middleware/auth';

/**
 * Routes OpenAI
 * Préfixe: /api/openai
 */
const router = Router();
const controller = new OpenAIController();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/openai/status
 * Vérifie si l'utilisateur a configuré une clé API OpenAI
 */
router.get('/status', controller.getStatus);

/**
 * POST /api/openai/connect
 * Enregistre la clé API OpenAI de l'utilisateur
 */
router.post('/connect', controller.connect);

/**
 * POST /api/openai/disconnect
 * Supprime la clé API OpenAI de l'utilisateur
 */
router.post('/disconnect', controller.disconnect);

/**
 * GET /api/openai/models
 * Retourne la liste des modèles GPT disponibles
 */
router.get('/models', controller.getModels);

export default router;
