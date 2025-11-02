import { Request, Response, NextFunction } from 'express';
import { TwitchApiService } from './TwitchApiService';
import { asyncHandler } from '../../core/middleware/error';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';
import { OAuthManager } from '../../shared/auth/OAuthManager';
import { JwtManager } from '../../shared/auth/JwtManager';
import 'colors';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Twitch Controller
 * Handles all Twitch-related endpoints
 */
export class TwitchController {
    private apiService: TwitchApiService;
    private oauthManager: OAuthManager;
    private jwtManager: JwtManager;

    constructor() {
        this.apiService = new TwitchApiService();
        this.oauthManager = new OAuthManager();
        this.jwtManager = new JwtManager();
    }

    /**
     * GET /api/twitch/connect
     * Initiate Twitch OAuth flow for linking an account
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

            const authUrl = this.oauthManager.getTwitchAuthUrl(state);
            res.redirect(authUrl);
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/twitch/callback
     * Handle Twitch OAuth callback
     */
    public callback = async (req: Request, res: Response): Promise<void> => {
        try {
            const { code, error, state } = req.query;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (parseError) {
                    console.warn('[Twitch] Failed to parse state:', parseError);
                }
            }

            const isMobile = stateData.isMobile || this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);

            if (error) {
                console.error('[Twitch] OAuth error:', error);
                return res.redirect(`${redirectUrl}/services?error=${error}`);
            }

            if (!code)
                return res.redirect(`${redirectUrl}/services?error=missing_code`);

            if (!stateData.token)
                return res.redirect(`${redirectUrl}/login?error=authentication_required`);

            const decoded = this.jwtManager.verifyToken(stateData.token);
            if (!decoded || !decoded.userId)
                return res.redirect(`${redirectUrl}/login?error=invalid_token`);

            await this.oauthManager.handleTwitchCallback(code as string, decoded.userId);
            res.redirect(`${redirectUrl}/services?success=twitch`);
        } catch (error) {
            console.error('[Twitch] OAuth callback error:'.red, error);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            res.redirect(`${redirectUrl}/services?error=twitch_auth_failed`);
        }
    };

    /**
     * GET /api/twitch/me
     * Get current user's Twitch profile
     */
    public getProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                const error = new Error('Unauthorized') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(userId, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                const error = new Error('Twitch account not connected') as CustomError;
                error.statusCode = 403;
                return next(error);
            }

            const user = await this.apiService.getCurrentUser(twitchAuth.access_token);

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('[Twitch] Error getting profile:'.red, error);
            next(error);
        }
    });

    /**
     * GET /api/twitch/stream
     * Get current stream information (if live)
     */
    public getStream = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                const error = new Error('Unauthorized') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(userId, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                const error = new Error('Twitch account not connected') as CustomError;
                error.statusCode = 403;
                return next(error);
            }

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;

            const stream = await this.apiService.getStream(twitchAuth.access_token, broadcasterId);

            res.json({
                success: true,
                data: stream,
                isLive: !!stream
            });
        } catch (error) {
            console.error('[Twitch] Error getting stream:'.red, error);
            next(error);
        }
    });

    /**
     * GET /api/twitch/channel
     * Get channel information
     */
    public getChannel = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                const error = new Error('Unauthorized') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(userId, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                const error = new Error('Twitch account not connected') as CustomError;
                error.statusCode = 403;
                return next(error);
            }

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;

            const channel = await this.apiService.getChannelInfo(twitchAuth.access_token, broadcasterId);

            res.json({
                success: true,
                data: channel
            });
        } catch (error) {
            console.error('[Twitch] Error getting channel:'.red, error);
            next(error);
        }
    });

    /**
     * GET /api/twitch/followers
     * Get channel followers
     */
    public getFollowers = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                const error = new Error('Unauthorized') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(userId, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                const error = new Error('Twitch account not connected') as CustomError;
                error.statusCode = 403;
                return next(error);
            }

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;

            const result = await this.apiService.getFollowers(twitchAuth.access_token, broadcasterId, 20);

            res.json({
                success: true,
                data: result.data,
                total: result.total
            });
        } catch (error) {
            console.error('[Twitch] Error getting followers:'.red, error);
            next(error);
        }
    });

    /**
     * POST /api/twitch/clip
     * Create a clip
     */
    public createClip = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                const error = new Error('Unauthorized') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(userId, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                const error = new Error('Twitch account not connected') as CustomError;
                error.statusCode = 403;
                return next(error);
            }

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;
            const hasDelay = req.body.has_delay === true;

            const clip = await this.apiService.createClip(twitchAuth.access_token, broadcasterId, hasDelay);

            res.json({
                success: true,
                data: clip
            });
        } catch (error) {
            console.error('[Twitch] Error creating clip:'.red, error);
            next(error);
        }
    });

    /**
     * Detect if the request originates from a mobile device
     */
    private isMobileRequest(req: Request): boolean {
        const userAgent = req.headers['user-agent'] || '';
        const isMobileUA = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
        const mobileParam = req.query.mobile === 'true';
        return isMobileUA || mobileParam;
    }

    /**
     * Determine redirect URL depending on device type
     */
    private getRedirectUrl(isMobile: boolean): string {
        if (isMobile)
            return 'autoarea://oauth';
        return process.env.FRONTEND_URL || 'http://localhost:3000';
    }
}
