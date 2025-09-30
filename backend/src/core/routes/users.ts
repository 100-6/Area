import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { requireAuth } from '../middleware/auth';

const router = Router();
const userController = new UserController();

router
    .route('/me')
    .get(requireAuth, userController.getMe) // GET /api/users/me
    .patch(requireAuth, userController.updateMe) // PATCH /api/users/me
    .delete(requireAuth, userController.deleteMe); // DELETE /api/users/me

router.post('/changePassword', requireAuth, userController.changePassword);

export default router;
