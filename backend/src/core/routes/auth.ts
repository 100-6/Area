import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.get('/verify', authController.verifyToken);

router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

router.get('/discord', authController.discordLogin);
router.get('/discord/callback', authController.discordCallback);

router.get('/github', authController.gitHubLogin);
router.get('/github/callback', authController.gitHubCallback);

export default router;
