import bcrypt from 'bcryptjs';

export class PasswordManager {
    private static readonly SALT_ROUNDS = 12;

    /**
     * Hash a password
     */
    static async hashPassword(password: string): Promise<string> {
        try {
            if (!password || password.trim() === '')
                throw new Error('Password cannot be empty');
            const salt = await bcrypt.genSalt(PasswordManager.SALT_ROUNDS);
            return await bcrypt.hash(password, salt);
        } catch (error) {
            throw new Error(`Password hashing failed: ${error}`);
        }
    }

    /**
     * Compare password with hash
     */
    static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            throw new Error(`Password comparison failed: ${error}`);
        }
    }

    /**
     * Validate password strength
     */
    static validatePasswordStrength(password: string): {isValid: boolean; errors: string[];} {
        const errors: string[] = [];

        if (password.length < 8)
            errors.push('Password must be at least 8 characters long');
        if (!/[a-z]/.test(password))
            errors.push('Password must contain at least one lowercase letter');
        if (!/[A-Z]/.test(password))
            errors.push('Password must contain at least one uppercase letter');
        if (!/\d/.test(password))
            errors.push('Password must contain at least one number');
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
            errors.push('Password must contain at least one special character');
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
