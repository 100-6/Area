import { Request, Response, NextFunction } from 'express';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Middleware pour vérifier que l'utilisateur est connecté à Gmail via OAuth
 * Doit être utilisé APRÈS requireAuth
 */
export async function requireGmailAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user.id;
        const gmailAuth = await UserAuthProvider.findByUserAndProvider(userId, 'gmail');

        if (!gmailAuth) {
            const error = new Error('GMAIL_NOT_CONNECTED') as CustomError;
            error.statusCode = 403;
            error.code = 'GMAIL_NOT_CONNECTED';
            error.message = 'User is not connected to Gmail. Please authenticate with Gmail first.';
            return next(error);
        }
        if (gmailAuth.token_expires_at && new Date(gmailAuth.token_expires_at) < new Date()) {
            const error = new Error('GMAIL_TOKEN_EXPIRED') as CustomError;
            error.statusCode = 403;
            error.code = 'GMAIL_TOKEN_EXPIRED';
            error.message = 'Gmail authentication has expired. Please re-authenticate with Google.';
            return next(error);
        }
        next();
    } catch (error) {
        const authError = new Error('GMAIL_AUTH_CHECK_FAILED') as CustomError;
        authError.statusCode = 500;
        authError.code = 'GMAIL_AUTH_CHECK_FAILED';
        authError.message = 'Failed to verify Gmail authentication';
        next(authError);
    }
}
