import { Router } from 'express';
import { OutlookController } from './controller';
import { requireAuth } from '../../core/middleware/auth';
import { requireOutlookAuth } from './middlewareOutlook';

/**
 * Routes Outlook
 * Préfixe: /api/outlook
 */
const router = Router();
const controller = new OutlookController();

/**
 * OAuth Routes
 */
router.get('/connect', controller.connect);
router.get('/callback', controller.callback);

/**
 * Protected routes (require auth + Outlook connection)
 */
router.use(requireAuth);
router.use(requireOutlookAuth);

/**
 * GET /api/outlook/folders
 * Récupère la liste des dossiers Outlook de l'utilisateur
 */
router.get('/folders', controller.getFolders);

/**
 * GET /api/outlook/messages
 * Récupère la liste des messages Outlook
 * Query params: from, subject, hasAttachment, folderName, maxResults
 */
router.get('/messages', controller.getMessages);

/**
 * GET /api/outlook/messages/:messageId
 * Récupère un message spécifique
 */
router.get('/messages/:messageId', controller.getMessage);

/**
 * GET /api/outlook/calendar/events
 * Récupère la liste des événements de calendrier
 * Query params: calendarId, maxResults
 */
router.get('/calendar/events', controller.getCalendarEvents);

/**
 * POST /api/outlook/send
 * Envoie un email
 * Body: { to, subject, body, contentType?, cc?, bcc? }
 */
router.post('/send', controller.sendEmail);

/**
 * POST /api/outlook/calendar/events
 * Crée un événement de calendrier
 * Body: { subject, start, end, location?, body?, attendees? }
 */
router.post('/calendar/events', controller.createCalendarEvent);

export default router;
