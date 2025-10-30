import { Request, Response, NextFunction } from 'express';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Middleware to ensure the authenticated user has connected Bitly
 * Must be used after requireAuth
 */
export const requireBitlyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            const error = new Error('User not authenticated') as CustomError;
            error.statusCode = 401;
            error.code = 'UNAUTHORIZED';
            return next(error);
        }

        const bitlyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'bitly');

        if (!bitlyAuth || !bitlyAuth.access_token) {
            const error = new Error('Bitly account not connected. Please connect your Bitly account first.') as CustomError;
            error.statusCode = 403;
            error.code = 'BITLY_NOT_CONNECTED';
            return next(error);
        }

        next();
    } catch (error) {
        const customError = new Error('Failed to verify Bitly authentication') as CustomError;
        customError.statusCode = 500;
        customError.code = 'BITLY_AUTH_CHECK_FAILED';
        next(customError);
    }
};
