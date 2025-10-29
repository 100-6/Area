import { Router } from 'express';
import { RedditController } from './controller';
import { requireAuth } from '../../core/middleware/auth';

/**
 * Reddit Routes
 * Prefix: /api/reddit
 */
const router = Router();
const controller = new RedditController();

/**
 * OAuth Routes
 * Note: /connect expects token in query param from frontend
 * /callback is public as it's called by Reddit
 */
router.get('/connect', controller.connect);
router.get('/callback', controller.callback);

/**
 * Protected routes (require auth)
 */
router.use(requireAuth);

/**
 * GET /api/reddit/me
 * Get the current user's Reddit profile
 */
router.get('/me', controller.getCurrentUser);

/**
 * GET /api/reddit/r/:subreddit
 * Get posts from a subreddit
 * Query params: sort (hot/new/top/rising, default: hot), limit (default: 25)
 */
router.get('/r/:subreddit', controller.getSubredditPosts);

/**
 * GET /api/reddit/saved
 * Get the user's saved posts
 * Query params: limit (default: 25)
 */
router.get('/saved', controller.getSavedPosts);

/**
 * POST /api/reddit/submit
 * Submit a text post to a subreddit
 * Body: { subreddit: string, title: string, text: string }
 */
router.post('/submit', controller.submitPost);

/**
 * POST /api/reddit/comment
 * Submit a comment on a post
 * Body: { postId: string, text: string }
 */
router.post('/comment', controller.submitComment);

export default router;
