import { Request, Response, NextFunction } from 'express';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Middleware pour vérifier que l'utilisateur a connecté son compte Trello
 * Doit être utilisé après le middleware requireAuth
 */
export const requireTrelloAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            const error = new Error('User not authenticated') as CustomError;
            error.statusCode = 401;
            error.code = 'UNAUTHORIZED';
            return next(error);
        }
        const trelloAuth = await UserAuthProvider.findByUserAndProvider(userId, 'trello');
        if (!trelloAuth || !trelloAuth.access_token) {
            const error = new Error('Trello account not connected. Please connect your Trello account first.') as CustomError;
            error.statusCode = 403;
            error.code = 'TRELLO_NOT_CONNECTED';
            return next(error);
        }
        next();
    } catch (error) {
        const customError = new Error('Failed to verify Trello authentication') as CustomError;
        customError.statusCode = 500;
        customError.code = 'TRELLO_AUTH_CHECK_FAILED';
        next(customError);
    }
};
