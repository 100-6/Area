import { Router } from 'express';
import { StravaController } from './controller';
import { requireAuth } from '../../core/middleware/auth';
import { requireStravaAuth } from './middlewareStrava';

/**
 * Routes Strava
 * Préfixe: /api/strava
 */
const router = Router();
const controller = new StravaController();

/**
 * OAuth Routes
 * Note: /connect expects token in query param from frontend
 * /callback is public as it's called by Strava
 */
router.get('/connect', controller.connect);
router.get('/callback', controller.callback);

/**
 * Protected routes (require auth + Strava connection)
 */
router.use(requireAuth);
router.use(requireStravaAuth);

/**
 * GET /api/strava/athlete
 * Récupère le profil de l'athlète Strava
 */
router.get('/athlete', controller.getAthlete);

/**
 * GET /api/strava/activities
 * Récupère les activités de l'athlète
 * Query params: page, perPage, before, after
 */
router.get('/activities', controller.getActivities);

/**
 * GET /api/strava/activities/:id
 * Récupère une activité spécifique
 */
router.get('/activities/:id', controller.getActivity);

/**
 * GET /api/strava/athlete/:id/stats
 * Récupère les statistiques de l'athlète
 */
router.get('/athlete/:id/stats', controller.getAthleteStats);

/**
 * POST /api/strava/activities/:id/kudos
 * Donne des kudos à une activité
 */
router.post('/activities/:id/kudos', controller.giveKudos);

/**
 * POST /api/strava/activities/:id/comments
 * Crée un commentaire sur une activité
 * Body: { text: string }
 */
router.post('/activities/:id/comments', controller.createComment);

export default router;
