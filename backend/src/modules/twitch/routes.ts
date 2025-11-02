import { Router } from 'express';
import { TwitchController } from './controller';
import { requireAuth } from '../../core/middleware/auth';
import { requireTwitchAuth } from './middleware';

/**
 * Twitch Routes
 * Prefix: /api/twitch
 */
const router = Router();
const controller = new TwitchController();

/**
 * OAuth routes (public)
 */
router.get('/connect', controller.connect);
router.get('/callback', controller.callback);

/**
 * Protected routes (require auth + Twitch connection)
 */
router.use(requireAuth);
router.use(requireTwitchAuth);

/**
 * GET /api/twitch/me
 * Get the current user's Twitch profile
 */
router.get('/me', controller.getProfile);

/**
 * GET /api/twitch/stream
 * Get current stream information (if live)
 */
router.get('/stream', controller.getStream);

/**
 * GET /api/twitch/channel
 * Get channel information
 */
router.get('/channel', controller.getChannel);

/**
 * GET /api/twitch/followers
 * Get channel followers
 */
router.get('/followers', controller.getFollowers);

/**
 * POST /api/twitch/clip
 * Create a clip of the stream
 * Body: { has_delay?: boolean }
 */
router.post('/clip', controller.createClip);

export default router;
