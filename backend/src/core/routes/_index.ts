import { Router } from 'express';
import authRoutes from './auth';
import systemRoutes from './system';
import userRoutes from './users';
import areaRoutes from './areas';
import workflowRoutes from './workflow';
import moduleRoutes from './modules';
import servicesRoutes from './services';

import discordRoutes from '../../modules/discord/routes';
import gmailRoutes from '../../modules/gmail/routes';
import outlookRoutes from '../../modules/outlook/routes';
import telegramRoutes from '../../modules/telegram/routes';
import webhookRoutes from '../../modules/webhook/routes';
import spotifyRoutes from '../../modules/spotify/routes';

const router = Router();

// Public routes (no authentication required)
router.use('/webhook', webhookRoutes);

router.use('/', systemRoutes);

router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/areas', areaRoutes);
router.use('/api/workflows', workflowRoutes);
router.use('/api/modules', moduleRoutes);
router.use('/api/services', servicesRoutes);

router.use('/api/discord', discordRoutes);
router.use('/api/gmail', gmailRoutes);
router.use('/api/outlook', outlookRoutes);
router.use('/api/telegram', telegramRoutes);
router.use('/api/spotify', spotifyRoutes);

export default router;
