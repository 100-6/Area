import { Router } from 'express';
import authRoutes from './auth';
import systemRoutes from './system';

const router = Router();

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes système 
router.use('/', systemRoutes);

export default router;
