import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { requireAuth } from '../../shared/auth/authMiddleware';

const router = Router();
const userController = new UserController();

// GET /api/users/me
router.get('/me', requireAuth, userController.getMe);

export default router;
