import { Router } from 'express';
import authRoutes from './auth';
import systemRoutes from './system';
import userRoutes from './users';

const router = Router();

router.use('/', systemRoutes);

router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);

export default router;
