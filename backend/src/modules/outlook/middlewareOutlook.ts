import { Request, Response, NextFunction } from 'express';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Middleware pour vérifier que l'utilisateur est connecté à Outlook via OAuth
 * Doit être utilisé APRÈS requireAuth
 */
export async function requireOutlookAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user.id;
        const outlookAuth = await UserAuthProvider.findByUserAndProvider(userId, 'outlook');

        if (!outlookAuth) {
            const error = new Error('OUTLOOK_NOT_CONNECTED') as CustomError;
            error.statusCode = 403;
            error.code = 'OUTLOOK_NOT_CONNECTED';
            error.message = 'User is not connected to Outlook. Please authenticate with Microsoft first.';
            return next(error);
        }
        if (outlookAuth.token_expires_at && new Date(outlookAuth.token_expires_at) < new Date()) {
            const error = new Error('OUTLOOK_TOKEN_EXPIRED') as CustomError;
            error.statusCode = 403;
            error.code = 'OUTLOOK_TOKEN_EXPIRED';
            error.message = 'Outlook authentication has expired. Please re-authenticate with Microsoft.';
            return next(error);
        }
        next();
    } catch (error) {
        const authError = new Error('OUTLOOK_AUTH_CHECK_FAILED') as CustomError;
        authError.statusCode = 500;
        authError.code = 'OUTLOOK_AUTH_CHECK_FAILED';
        authError.message = 'Failed to verify Outlook authentication';
        next(authError);
    }
}
