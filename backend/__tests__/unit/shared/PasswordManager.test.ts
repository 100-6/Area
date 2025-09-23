import { PasswordManager } from '../../../src/shared/auth/PasswordManager';

describe('PasswordManager', () => {
    describe('hashPassword', () => {
        it('should hash a password successfully', async () => {
            const password = 'TestPassword123!';
            const hashedPassword = await PasswordManager.hashPassword(password);

            expect(hashedPassword).toBeDefined();
            expect(hashedPassword).not.toBe(password);
            expect(hashedPassword.length).toBeGreaterThan(50);
            expect(hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$')).toBe(true);
        });

        it('should create different hashes for the same password', async () => {
            const password = 'TestPassword123!';
            const hash1 = await PasswordManager.hashPassword(password);
            const hash2 = await PasswordManager.hashPassword(password);

            expect(hash1).not.toBe(hash2);
        });

        it('should throw error for empty password', async () => {
            await expect(PasswordManager.hashPassword('')).rejects.toThrow();
        });
    });

    describe('comparePassword', () => {
        it('should return true for correct password', async () => {
            const password = 'TestPassword123!';
            const hashedPassword = await PasswordManager.hashPassword(password);
            const isMatch = await PasswordManager.comparePassword(password, hashedPassword);

            expect(isMatch).toBe(true);
        });

        it('should return false for incorrect password', async () => {
            const correctPassword = 'TestPassword123!';
            const wrongPassword = 'WrongPassword456!';
            const hashedPassword = await PasswordManager.hashPassword(correctPassword);
            const isMatch = await PasswordManager.comparePassword(wrongPassword, hashedPassword);

            expect(isMatch).toBe(false);
        });

        it('should return false for empty password', async () => {
            const hashedPassword = await PasswordManager.hashPassword('TestPassword123!');
            const isMatch = await PasswordManager.comparePassword('', hashedPassword);

            expect(isMatch).toBe(false);
        });
    });

    describe('validatePasswordStrength', () => {
        it('should validate a strong password', () => {
            const strongPassword = 'StrongPass123!';
            const result = PasswordManager.validatePasswordStrength(strongPassword);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject password too short', () => {
            const shortPassword = 'Sh0rt!';
            const result = PasswordManager.validatePasswordStrength(shortPassword);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters long');
        });

        it('should reject password without lowercase', () => {
            const noLowercase = 'PASSWORD123!';
            const result = PasswordManager.validatePasswordStrength(noLowercase);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
        });

        it('should reject password without uppercase', () => {
            const noUppercase = 'password123!';
            const result = PasswordManager.validatePasswordStrength(noUppercase);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });

        it('should reject password without numbers', () => {
            const noNumbers = 'PasswordOnly!';
            const result = PasswordManager.validatePasswordStrength(noNumbers);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('should reject password without special characters', () => {
            const noSpecial = 'Password123';
            const result = PasswordManager.validatePasswordStrength(noSpecial);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one special character');
        });

        it('should return multiple errors for very weak password', () => {
            const veryWeakPassword = 'weak';
            const result = PasswordManager.validatePasswordStrength(veryWeakPassword);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(3);
            expect(result.errors).toContain('Password must be at least 8 characters long');
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
            expect(result.errors).toContain('Password must contain at least one number');
            expect(result.errors).toContain('Password must contain at least one special character');
        });

        it('should handle edge case passwords', () => {
            const passwords = ['Password123@', 'Password123#', 'Password123$', 'Password123%', 'Password123^', 'Password123&', 'Password123*',];

            passwords.forEach(password => {
                const result = PasswordManager.validatePasswordStrength(password);
                expect(result.isValid).toBe(true);
            });
        });
    });
});
