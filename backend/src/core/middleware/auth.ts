import { Request, Response, NextFunction } from 'express';
import { JwtManager } from '../../shared/auth/JwtManager';
import { User } from '../models/User';

declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            id: string;
            email: string;
        };
    }
}

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

const jwtManager = new JwtManager();

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const error = new Error('AUTHORIZATION_HEADER_MISSING') as CustomError;
            error.statusCode = 401;
            error.code = 'AUTHORIZATION_HEADER_MISSING';
            return next(error);
        }
        const token = authHeader.substring('Bearer '.length);
        try {
            const decoded = jwtManager.verifyToken(token);
            const user = await User.findById(decoded.userId);
            if (!user || !user.is_active) {
                const error = new Error('USER_NOT_FOUND_OR_INACTIVE') as CustomError;
                error.statusCode = 401;
                error.code = 'USER_NOT_FOUND_OR_INACTIVE';
                return next(error);
            }
            req.user = { id: user.id, email: user.email };
            next();
        } catch (jwtError) {
            const error = new Error((jwtError as Error).message) as CustomError;
            error.statusCode = 401;
            error.code = 'TOKEN_ERROR';
            next(error);
        }
    } catch (error) {
        const authError = new Error('AUTHENTICATION_FAILED') as CustomError;
        authError.statusCode = 401;
        authError.code = 'AUTHENTICATION_FAILED';
        next(authError);
    }
}
