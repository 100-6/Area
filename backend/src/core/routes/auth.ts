import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

// Route pour obtenir les informations de l'utilisateur actuel
router.get('/me', authController.getCurrentUser);

export default router;
