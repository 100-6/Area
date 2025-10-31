import { Router } from 'express';
import { requireAuth } from '../../core/middleware/auth';
import { BitlyController } from './controller';
import { requireBitlyAuth } from './middlewareBitly';

/**
 * Routes Bitly
 * Prefix: /api/bitly
 */
const router = Router();
const controller = new BitlyController();

// OAuth endpoints
router.get('/connect', controller.connect);
router.get('/callback', controller.callback);

// Protected endpoints
router.use(requireAuth);
router.use(requireBitlyAuth);

router.get('/me', controller.getCurrentUser);
router.get('/groups', controller.getGroups);
router.get('/bitlinks', controller.getBitlinks);
router.post('/bitlinks', controller.createBitlink);

export default router;
