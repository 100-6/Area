import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { requireAuth } from '../../shared/auth/authMiddleware';

const router = Router();
const userController = new UserController();

// GET /api/users/me
router.get('/me', requireAuth, userController.getMe);
// PATCH /api/users/me
router.patch('/me', requireAuth, userController.updateMe);
// DELETE /api/users/me
router.delete('/me', requireAuth, userController.deleteMe);

// POST /api/users/changePassword
router.post('/changePassword', requireAuth, userController.changePassword);

export default router;
