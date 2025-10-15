import { Router } from 'express';
import { GmailController } from './controller';
import { requireAuth } from '../../core/middleware/auth';
import { requireGmailAuth } from './middlewareGmail';

/**
 * Routes Gmail
 * Préfixe: /api/gmail
 */
const router = Router();
const controller = new GmailController();

/**
 * OAuth Routes
 */
router.get('/connect', controller.connect);
router.get('/callback', controller.callback);

/**
 * Protected routes (require auth + Gmail connection)
 */
router.use(requireAuth);
router.use(requireGmailAuth);

/**
 * GET /api/gmail/labels
 * Récupère la liste des labels Gmail de l'utilisateur
 */
router.get('/labels', controller.getLabels);

/**
 * GET /api/gmail/messages
 * Récupère la liste des messages Gmail
 * Query params: from, subject, hasAttachment, labelIds, maxResults
 */
router.get('/messages', controller.getMessages);

/**
 * GET /api/gmail/messages/:messageId
 * Récupère un message spécifique
 */
router.get('/messages/:messageId', controller.getMessage);

/**
 * POST /api/gmail/send
 * Envoie un email
 * Body: { to, subject, body, cc?, bcc?, inReplyTo? }
 */
router.post('/send', controller.sendEmail);

/**
 * POST /api/gmail/messages/:messageId/label
 * Ajoute un label à un message
 * Body: { labelId }
 */
router.post('/messages/:messageId/label', controller.addLabel);

/**
 * POST /api/gmail/messages/:messageId/read
 * Marque un message comme lu
 */
router.post('/messages/:messageId/read', controller.markAsRead);

/**
 * DELETE /api/gmail/messages/:messageId
 * Déplace un message vers la corbeille
 */
router.delete('/messages/:messageId', controller.moveToTrash);

export default router;
