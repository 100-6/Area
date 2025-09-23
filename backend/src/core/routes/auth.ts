import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

export default router;
