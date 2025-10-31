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

router.get('/trello', authController.trelloLogin);
router.get('/trello/callback', authController.trelloCallback);
router.post('/trello/process', authController.trelloProcess);

router.get('/twitch', authController.twitchLogin);
router.get('/twitch/callback', authController.twitchCallback);

router.get('/spotify', (req, res) => {
  res.redirect(`/api/spotify/connect?${req.url.split('?')[1] || ''}`)
});

router.get('/reddit', (req, res) => {
  res.redirect(`/api/reddit/connect?${req.url.split('?')[1] || ''}`)
});

router.get('/strava', (req, res) => {
  res.redirect(`/api/strava/connect?${req.url.split('?')[1] || ''}`)
});

router.get('/strava/callback', (req, res) => {
  res.redirect(`/api/strava/callback?${req.url.split('?')[1] || ''}`)
});

router.get('/gmail', (req, res) => {
  res.redirect(`/api/gmail/connect?${req.url.split('?')[1] || ''}`)
});

router.get('/bitly', (req, res) => {
  res.redirect(`/api/bitly/connect?${req.url.split('?')[1] || ''}`)
});

export default router;
