import { Request, Response, NextFunction } from 'express';
import { JwtManager } from './JwtManager';
import { User } from '../../core/models/User';

// Étendre l'interface Request pour ajouter user
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
    };
  }
}

const jwtManager = new JwtManager();

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
  res.status(401).json({ error: 'Authorization header missing or malformed' });
  return;
    }
    const token = authHeader.substring('Bearer '.length);
    const decoded = jwtManager.verifyToken(token);
    const user = await User.findById(decoded.userId);
    if (!user || !user.is_active) {
  res.status(401).json({ error: 'User not found or inactive' });
  return;
    }
    req.user = { id: user.id, email: user.email };
    next();
  } catch (error) {
    let message = 'Unauthorized';
    if (error instanceof Error) {
      if (['Token expired', 'Invalid token', 'Token verification failed'].includes(error.message)) {
        message = error.message;
      }
    }
    res.status(401).json({ error: message });
    return;
  }
}
