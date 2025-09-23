import { JwtManager } from '../../../src/shared/auth/JwtManager';

describe('JwtManager', () => {
    let jwtManager: JwtManager;

    beforeEach(() => {
        jwtManager = new JwtManager();
    });

    describe('generateToken', () => {
        it('should generate a valid JWT token', () => {
            const payload = { userId: '123', email: 'test@example.com' };
            const token = jwtManager.generateToken(payload);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });

        it('should generate different tokens for different users', () => {
            const payload1 = { userId: '123', email: 'user1@example.com' };
            const payload2 = { userId: '456', email: 'user2@example.com' };
            const token1 = jwtManager.generateToken(payload1);
            const token2 = jwtManager.generateToken(payload2);

            expect(token1).not.toBe(token2);
        });

        it('should include additional payload data', () => {
            const payload = {userId: '123', email: 'test@example.com', role: 'admin', customData: 'test'};
            const token = jwtManager.generateToken(payload);
            const decoded = jwtManager.decodeToken(token);

            expect(decoded?.userId).toBe('123');
            expect(decoded?.email).toBe('test@example.com');
        });
    });

    describe('verifyToken', () => {
        it('should verify a valid token', () => {
            const payload = { userId: '123', email: 'test@example.com' };
            const token = jwtManager.generateToken(payload);
            const decoded = jwtManager.verifyToken(token);

            expect(decoded.userId).toBe('123');
            expect(decoded.email).toBe('test@example.com');
            expect(decoded.iss).toBe('area-backend');
            expect(decoded.aud).toBe('area-frontend');
        });

        it('should throw error for invalid token', () => {
            const invalidToken = 'invalid.token.here';

            expect(() => jwtManager.verifyToken(invalidToken)).toThrow('Invalid token');
        });

        it('should throw error for malformed token', () => {
            const malformedToken = 'not-a-jwt-token';

            expect(() => jwtManager.verifyToken(malformedToken)).toThrow('Invalid token');
        });

        it('should throw error for token with wrong signature', () => {
            const payload = { userId: '123', email: 'test@example.com' };
            const token = jwtManager.generateToken(payload);
            const tamperedToken = token.slice(0, -10) + 'tampered123';

            expect(() => jwtManager.verifyToken(tamperedToken)).toThrow('Invalid token');
        });
    });

    describe('decodeToken', () => {
        it('should decode token without verification', () => {
            const payload = { userId: '123', email: 'test@example.com' };
            const token = jwtManager.generateToken(payload);
            const decoded = jwtManager.decodeToken(token);

            expect(decoded).toBeDefined();
            expect(decoded?.userId).toBe('123');
            expect(decoded?.email).toBe('test@example.com');
        });

        it('should return null for invalid token', () => {
            const invalidToken = 'invalid-token';
            const decoded = jwtManager.decodeToken(invalidToken);

            expect(decoded).toBeNull();
        });

        it('should return null for empty token', () => {
            const decoded = jwtManager.decodeToken('');

            expect(decoded).toBeNull();
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate a refresh token', () => {
            const payload = { userId: '123', email: 'test@example.com' };
            const refreshToken = jwtManager.generateRefreshToken(payload);

            expect(refreshToken).toBeDefined();
            expect(typeof refreshToken).toBe('string');
            expect(refreshToken.split('.')).toHaveLength(3);
        });

        it('should generate refresh token with correct type', () => {
            const payload = { userId: '123', email: 'test@example.com' };
            const refreshToken = jwtManager.generateRefreshToken(payload);
            const decoded = jwtManager.decodeToken(refreshToken);

            expect(decoded?.type).toBe('refresh');
            expect(decoded?.userId).toBe('123');
            expect(decoded?.email).toBe('test@example.com');
        });
    });

    describe('isTokenExpired', () => {
        it('should return false for valid token', () => {
            const payload = { userId: '123', email: 'test@example.com' };
            const token = jwtManager.generateToken(payload);
            const isExpired = jwtManager.isTokenExpired(token);

            expect(isExpired).toBe(false);
        });

        it('should return true for invalid token', () => {
            const invalidToken = 'invalid-token';
            const isExpired = jwtManager.isTokenExpired(invalidToken);

            expect(isExpired).toBe(true);
        });

        it('should return true for empty token', () => {
            const isExpired = jwtManager.isTokenExpired('');

            expect(isExpired).toBe(true);
        });
    });

    describe('getTokenExpiry', () => {
        it('should return expiry date for valid token', () => {
            const payload = { userId: '123', email: 'test@example.com' };
            const token = jwtManager.generateToken(payload);
            const expiry = jwtManager.getTokenExpiry(token);

            expect(expiry).toBeInstanceOf(Date);
            expect(expiry!.getTime()).toBeGreaterThan(Date.now());
        });

        it('should return null for invalid token', () => {
            const invalidToken = 'invalid-token';
            const expiry = jwtManager.getTokenExpiry(invalidToken);

            expect(expiry).toBeNull();
        });

        it('should return null for empty token', () => {
            const expiry = jwtManager.getTokenExpiry('');

            expect(expiry).toBeNull();
        });
    });
});
