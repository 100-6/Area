import { Request, Response, NextFunction } from 'express';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Middleware pour vérifier que l'utilisateur a connecté son compte Strava
 * Doit être utilisé après le middleware requireAuth
 */
export const requireStravaAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            const error = new Error('User not authenticated') as CustomError;
            error.statusCode = 401;
            error.code = 'UNAUTHORIZED';
            return next(error);
        }

        // Vérifier que l'utilisateur a connecté Strava
        const stravaAuth = await UserAuthProvider.findByUserAndProvider(userId, 'strava');

        if (!stravaAuth || !stravaAuth.access_token) {
            const error = new Error('Strava account not connected. Please connect your Strava account first.') as CustomError;
            error.statusCode = 403;
            error.code = 'STRAVA_NOT_CONNECTED';
            return next(error);
        }

        // L'utilisateur a bien connecté Strava, continuer
        next();
    } catch (error) {
        const customError = new Error('Failed to verify Strava authentication') as CustomError;
        customError.statusCode = 500;
        customError.code = 'STRAVA_AUTH_CHECK_FAILED';
        next(customError);
    }
};
