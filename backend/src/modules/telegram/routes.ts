import { Router } from 'express';
import { TelegramController } from './controller';
import { requireAuth } from '../../core/middleware/auth';

/**
 * Routes Telegram
 * Préfixe: /api/telegram
 */
const router = Router();
const controller = new TelegramController();

// Toutes les routes nécessitent l'authentification
router.use(requireAuth);

/**
 * GET /api/telegram/bot/status
 * Retourne le statut du bot Telegram
 */
router.get('/bot/status', controller.getBotStatus);

/**
 * GET /api/telegram/bot/info
 * Retourne les informations complètes du bot et comment obtenir son chat ID
 */
router.get('/bot/info', controller.getBotInfo);

/**
 * POST /api/telegram/test-message
 * Envoie un message de test
 * Body: { chatId: string, text: string }
 */
router.post('/test-message', controller.sendTestMessage);

/**
 * POST /api/telegram/validate-token
 * Valide un token de bot Telegram
 * Body: { botToken: string }
 */
router.post('/validate-token', controller.validateBotToken);

export default router;
