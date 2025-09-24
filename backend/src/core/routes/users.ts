import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { requireAuth } from '../../shared/auth/authMiddleware';

const router = Router();
const userController = new UserController();

// GET /api/users/me
router.get('/me', requireAuth, userController.getMe);

// POST /api/users/changePassword
router.post('/changePassword', requireAuth, userController.changePassword);

export default router;
