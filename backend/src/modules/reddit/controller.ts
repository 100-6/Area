import { Request, Response, NextFunction } from 'express';
import { redditModule } from './service';
import { asyncHandler } from '../../core/middleware/error';
import { OAuthManager } from '../../shared/auth/OAuthManager';
import { JwtManager } from '../../shared/auth/JwtManager';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';
import 'colors';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Controller Reddit
 * Handles all Reddit-related endpoints
 */
export class RedditController {
    private oauthManager: OAuthManager;
    private jwtManager: JwtManager;

    constructor() {
        this.oauthManager = new OAuthManager();
        this.jwtManager = new JwtManager();
    }

    /**
     * GET /api/reddit/connect
     * Initiates Reddit OAuth connection
     */
    public connect = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const token = req.query.token as string | undefined;
            const isMobile = this.isMobileRequest(req);
            let state: string | undefined;

            if (token || isMobile) {
                const stateData = { token, isMobile };
                state = Buffer.from(JSON.stringify(stateData)).toString('base64');
            }
            const authUrl = this.oauthManager.getRedditAuthUrl(state);
            res.redirect(authUrl);
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/reddit/callback
     * Handles Reddit OAuth callback
     */
    public callback = async (req: Request, res: Response): Promise<void> => {
        try {
            const { code, error, state } = req.query;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (e) {
                    console.warn('[Reddit] Failed to parse state:', e);
                }
            }
            const isMobile = stateData.isMobile || this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            if (error) {
                console.error('[Reddit] OAuth error:', error);
                return res.redirect(`${redirectUrl}/services?error=${error}`);
            }
            if (!code)
                return res.redirect(`${redirectUrl}/services?error=missing_code`);
            if (!stateData.token)
                return res.redirect(`${redirectUrl}/login?error=authentication_required`);
            const decoded = this.jwtManager.verifyToken(stateData.token);
            if (!decoded || !decoded.userId)
                return res.redirect(`${redirectUrl}/login?error=invalid_token`);
            await this.oauthManager.handleRedditCallback(code as string, decoded.userId);
            res.redirect(`${redirectUrl}/services?success=reddit`);
        } catch (error) {
            console.error('[Reddit] OAuth callback error:'.red, error);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            res.redirect(`${redirectUrl}/services?error=reddit_auth_failed`);
        }
    };

    private isMobileRequest(req: Request): boolean {
        const userAgent = req.headers['user-agent'] || '';
        const isMobileUA = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
        const mobileParam = req.query.mobile === 'true';
        return isMobileUA || mobileParam;
    }

    private getRedirectUrl(isMobile: boolean): string {
        if (isMobile)
            return 'autoarea://oauth';
        else
            return process.env.FRONTEND_URL || 'http://localhost:3000';
    }

    /**
     * GET /api/reddit/me
     * Returns the current user's Reddit profile
     */
    public getCurrentUser = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const redditAuth = await UserAuthProvider.findByUserAndProvider(userId, 'reddit');

            if (!redditAuth || !redditAuth.access_token) {
                const error = new Error('Reddit not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = redditModule.getApiService();
            const user = await apiService.getCurrentUser(redditAuth.access_token);

            res.json({ user });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/reddit/r/:subreddit
     * Returns posts from a subreddit
     */
    public getSubredditPosts = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { subreddit } = req.params;
            const sort = (req.query.sort as 'hot' | 'new' | 'top' | 'rising') || 'hot';
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 25;

            const redditAuth = await UserAuthProvider.findByUserAndProvider(userId, 'reddit');

            if (!redditAuth || !redditAuth.access_token) {
                const error = new Error('Reddit not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = redditModule.getApiService();
            const posts = await apiService.getSubredditPosts(subreddit, redditAuth.access_token, sort, limit);

            res.json({ posts, count: posts.length });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/reddit/saved
     * Returns the user's saved posts
     */
    public getSavedPosts = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 25;

            const redditAuth = await UserAuthProvider.findByUserAndProvider(userId, 'reddit');

            if (!redditAuth || !redditAuth.access_token) {
                const error = new Error('Reddit not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            console.log(`[Reddit Controller] Fetching saved posts for user ${userId}`.gray);
            const apiService = redditModule.getApiService();
            const posts = await apiService.getSavedPosts(redditAuth.access_token, limit);

            console.log(`[Reddit Controller] ✓ Returning ${posts.length} saved posts`.green);
            res.json({ posts, count: posts.length });
        } catch (error: any) {
            console.error(`[Reddit Controller] Error in getSavedPosts:`.red, error.message);
            next(error);
        }
    });

    /**
     * POST /api/reddit/submit
     * Submit a text post to a subreddit
     */
    public submitPost = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { subreddit, title, text } = req.body;

            if (!subreddit || !title || !text) {
                const error = new Error('Missing required fields: subreddit, title, text') as CustomError;
                error.statusCode = 400;
                return next(error);
            }

            const redditAuth = await UserAuthProvider.findByUserAndProvider(userId, 'reddit');

            if (!redditAuth || !redditAuth.access_token) {
                const error = new Error('Reddit not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = redditModule.getApiService();
            const result = await apiService.submitPost(subreddit, title, text, redditAuth.access_token);

            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    });

    /**
     * POST /api/reddit/comment
     * Submit a comment on a post
     */
    public submitComment = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { postId, text } = req.body;

            if (!postId || !text) {
                const error = new Error('Missing required fields: postId, text') as CustomError;
                error.statusCode = 400;
                return next(error);
            }

            const redditAuth = await UserAuthProvider.findByUserAndProvider(userId, 'reddit');

            if (!redditAuth || !redditAuth.access_token) {
                const error = new Error('Reddit not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = redditModule.getApiService();
            const result = await apiService.submitComment(postId, text, redditAuth.access_token);

            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    });
}

export default RedditController;
