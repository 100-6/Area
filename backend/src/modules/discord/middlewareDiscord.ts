import { Request, Response, NextFunction } from 'express';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';
import { DiscordBotClient } from './DiscordBotClient';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Middleware pour vérifier que l'utilisateur est connecté à Discord via OAuth
 * Doit être utilisé APRÈS requireAuth
 */
export async function requireDiscordAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user.id;
        const discordAuth = await UserAuthProvider.findByUserAndProvider(userId, 'discord');

        if (!discordAuth) {
            const error = new Error('DISCORD_NOT_CONNECTED') as CustomError;
            error.statusCode = 403;
            error.code = 'DISCORD_NOT_CONNECTED';
            error.message = 'User is not connected to Discord. Please authenticate with Discord first.';
            return next(error);
        }
        if (discordAuth.token_expires_at && new Date(discordAuth.token_expires_at) < new Date()) {
            const error = new Error('DISCORD_TOKEN_EXPIRED') as CustomError;
            error.statusCode = 403;
            error.code = 'DISCORD_TOKEN_EXPIRED';
            error.message = 'Discord authentication has expired. Please re-authenticate with Discord.';
            return next(error);
        }
        next();
    } catch (error) {
        const authError = new Error('DISCORD_AUTH_CHECK_FAILED') as CustomError;
        authError.statusCode = 500;
        authError.code = 'DISCORD_AUTH_CHECK_FAILED';
        authError.message = 'Failed to verify Discord authentication';
        next(authError);
    }
}

/**
 * Middleware pour vérifier que le bot Discord est connecté
 * Doit être utilisé sur les routes qui nécessitent le bot
 */
export function requireDiscordBotConnected(_req: Request, _res: Response, next: NextFunction): void {
    const botClient = DiscordBotClient.getInstance();

    if (!botClient.isConnected()) {
        const error = new Error('DISCORD_BOT_NOT_CONNECTED') as CustomError;
        error.statusCode = 503;
        error.code = 'DISCORD_BOT_NOT_CONNECTED';
        error.message = 'Discord bot is not connected. Please wait for the bot to connect.';
        return next(error);
    }
    next();
}
