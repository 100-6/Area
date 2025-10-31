import { Request, Response, NextFunction } from 'express';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Middleware pour vérifier que l'utilisateur est connecté à Slack via OAuth
 * Doit être utilisé APRÈS requireAuth
 */
export async function requireSlackAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user?.id;

        if (!userId) {
            const error = new Error('USER_NOT_AUTHENTICATED') as CustomError;
            error.statusCode = 401;
            error.code = 'USER_NOT_AUTHENTICATED';
            error.message = 'User is not authenticated';
            return next(error);
        }
        const slackConnection = await UserAuthProvider.findByUserAndProvider(userId, 'slack');
        if (!slackConnection || !slackConnection.access_token) {
            const error = new Error('SLACK_NOT_CONNECTED') as CustomError;
            error.statusCode = 403;
            error.code = 'SLACK_NOT_CONNECTED';
            error.message = 'User is not connected to Slack. Please authenticate with Slack first.';
            return next(error);
        }
        if (slackConnection.token_expires_at && new Date(slackConnection.token_expires_at) < new Date()) {
            const error = new Error('SLACK_TOKEN_EXPIRED') as CustomError;
            error.statusCode = 403;
            error.code = 'SLACK_TOKEN_EXPIRED';
            error.message = 'Slack authentication has expired. Please re-authenticate with Slack.';
            return next(error);
        }
        next();
    } catch (error) {
        const authError = new Error('SLACK_AUTH_CHECK_FAILED') as CustomError;
        authError.statusCode = 500;
        authError.code = 'SLACK_AUTH_CHECK_FAILED';
        authError.message = 'Failed to verify Slack authentication';
        next(authError);
    }
}
