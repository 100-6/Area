import { Request, Response, NextFunction } from 'express';
import { TwitchApiService } from './TwitchApiService';
import { asyncHandler } from '../../core/middleware/error';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';
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

    constructor() {
        this.apiService = new TwitchApiService();
    }

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
}
