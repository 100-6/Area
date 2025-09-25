const jwt = require('jsonwebtoken');

interface JwtPayload {
    userId: string;
    email: string;
    type?: string;
    iat?: number;
    exp?: number;
    iss?: string;
    aud?: string;
}

interface DecodedToken {
    userId?: string;
    email?: string;
    type?: string;
    iat?: number;
    exp?: number;
    iss?: string;
    aud?: string;
}

export class JwtManager {
    private secretKey: string;
    private expiresIn: string;

    constructor() {
        this.secretKey = process.env.JWT_SECRET || '';
        this.expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    }

    /**
     * Generate JWT token
     */
    generateToken(payload: { userId: string; email: string;[key: string]: unknown }): string {
        const tokenPayload = {
            userId: payload.userId,
            email: payload.email,
            iat: Math.floor(Date.now() / 1000),
        };

        return jwt.sign(tokenPayload, this.secretKey, {
            expiresIn: this.expiresIn,
            issuer: 'area-backend',
            audience: 'area-frontend',
        });
    }

    /**
     * Verify JWT token
     */
    verifyToken(token: string): JwtPayload {
        try {
            const decoded = jwt.verify(token, this.secretKey, { issuer: 'area-backend', audience: 'area-frontend', });

            return decoded as JwtPayload;
        } catch (error: unknown) {
            const err = error as Error & { name: string };
            if (err.name === 'TokenExpiredError') {
                throw new Error('Token expired');
            } else if (err.name === 'JsonWebTokenError') {
                throw new Error('Invalid token');
            } else {
                throw new Error('Token verification failed');
            }
        }
    }

    /**
     * Decode token without verification
     */
    decodeToken(token: string): DecodedToken | null {
        const decoded = jwt.decode(token);

        if (!decoded || typeof decoded === 'string')
            return null;
        return decoded as DecodedToken;
    }

    /**
     * Generate refresh token
     */
    generateRefreshToken(payload: { userId: string; email: string }): string {
        const tokenPayload = {
            userId: payload.userId,
            email: payload.email,
            type: 'refresh',
        };

        return jwt.sign(tokenPayload, this.secretKey, {
            expiresIn: '30d',
            issuer: 'area-backend',
            audience: 'area-frontend',
        });
    }

    /**
     * Verify a refresh token (separate to allow different error messaging/logic later)
     */
    verifyRefreshToken(token: string): JwtPayload {
        try {
            const decoded = jwt.verify(token, this.secretKey, { issuer: 'area-backend', audience: 'area-frontend' });
            if ((decoded as JwtPayload).type !== 'refresh')
                throw new Error('Invalid refresh token');
            return decoded as JwtPayload;
        } catch (error: unknown) {
            const err = error as Error & { name: string };
            if (err.name === 'TokenExpiredError') {
                throw new Error('Refresh token expired');
            } else if (err.name === 'JsonWebTokenError') {
                throw new Error('Invalid refresh token');
            } else {
                throw new Error('Refresh token verification failed');
            }
        }
    }

    /**
     * Check if token is expired
     */
    isTokenExpired(token: string): boolean {
        try {
            const decoded = jwt.decode(token);

            if (!decoded || typeof decoded === 'string')
                return true;
            const tokenData = decoded as DecodedToken;
            if (!tokenData.exp)
                return true;
            const currentTime = Math.floor(Date.now() / 1000);
            return tokenData.exp < currentTime;
        } catch (error: unknown) {
            return true;
        }
    }

    /**
     * Get token expiry date
     */
    getTokenExpiry(token: string): Date | null {
        try {
            const decoded = jwt.decode(token);

            if (!decoded || typeof decoded === 'string')
                return null;
            const tokenData = decoded as DecodedToken;
            if (!tokenData.exp)
                return null;
            return new Date(tokenData.exp * 1000);
        } catch (error: unknown) {
            return null;
        }
    }
}
