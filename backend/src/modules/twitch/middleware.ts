import { Request, Response, NextFunction } from 'express';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Middleware to verify that the user has connected their Twitch account
 * Must be used after the requireAuth middleware
 */
export const requireTwitchAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            const error = new Error('User not authenticated') as CustomError;
            error.statusCode = 401;
            error.code = 'UNAUTHORIZED';
            return next(error);
        }

        // Verify that the user has connected Twitch
        const twitchAuth = await UserAuthProvider.findByUserAndProvider(userId, 'twitch');

        if (!twitchAuth || !twitchAuth.access_token) {
            const error = new Error('Twitch account not connected. Please connect your Twitch account first.') as CustomError;
            error.statusCode = 403;
            error.code = 'TWITCH_NOT_CONNECTED';
            return next(error);
        }

        // User has connected Twitch, continue
        next();
    } catch (error) {
        const customError = new Error('Failed to verify Twitch authentication') as CustomError;
        customError.statusCode = 500;
        customError.code = 'TWITCH_AUTH_CHECK_FAILED';
        next(customError);
    }
};
