import { Router } from 'express';
import authRoutes from './auth';
import systemRoutes from './system';
import userRoutes from './users';
import areaRoutes from './areas';
import workflowRoutes from './workflow';
import moduleRoutes from './modules';
import discordRoutes from '../../modules/discord/routes';

const router = Router();

router.use('/', systemRoutes);

router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/areas', areaRoutes);
router.use('/api/workflows', workflowRoutes);
router.use('/api/modules', moduleRoutes);

router.use('/api/discord', discordRoutes);

export default router;
