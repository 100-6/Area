import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateRegister, validateLogin } from '../middleware/validation';

const router = Router();
const authController = new AuthController();

router.post('/register', validateRegister(), authController.register);
router.post('/login', validateLogin(), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.get('/verify', authController.verifyToken);

router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

router.get('/discord', authController.discordLogin);
router.get('/discord/callback', authController.discordCallback);

router.get('/github', authController.gitHubLogin);
router.get('/github/callback', authController.gitHubCallback);

router.get('/gitlab', authController.gitLabLogin);
router.get('/gitlab/callback', authController.gitLabCallback);

router.get('/dropbox', authController.dropboxLogin);
router.get('/dropbox/callback', authController.dropboxCallback);

router.get('/slack', authController.slackLogin);
router.get('/slack/callback', authController.slackCallback);

export default router;
