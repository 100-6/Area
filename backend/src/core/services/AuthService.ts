import { User } from '../models/User';
import { PasswordManager } from '../../shared/auth/PasswordManager';
import { JwtManager } from '../../shared/auth/JwtManager';
import { OAuthManager } from '../../shared/auth/OAuthManager';
import 'colors';

interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

interface LoginData {
    email: string;
    password: string;
}

interface AuthResult {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        createdAt: Date;
    };
    token: string;
}

interface ValidationError {
    field: string;
    message: string;
}

class AuthService {
    private jwtManager: JwtManager;
    private oauthManager: OAuthManager;

    constructor() {
        this.jwtManager = new JwtManager();
        this.oauthManager = new OAuthManager();
    }

    /**
     * Enregistrer un nouvel utilisateur avec email/password
     */
    async register(registerData: RegisterData): Promise<AuthResult> {
        const { email, password, firstName, lastName } = registerData;
        const validationErrors = this.validateRegistrationData(registerData);

        if (validationErrors.length > 0) {
            const error = new Error('VALIDATION_FAILED') as any;
            error.validationErrors = validationErrors;
            throw error;
        }
        const existingUser = await User.findByEmail(email);
        if (existingUser)
            throw new Error('USER_ALREADY_EXISTS');
        const hashedPassword = await PasswordManager.hashPassword(password);
        const newUser = await User.create({
            email,
            password_hash: hashedPassword,
            first_name: firstName,
            last_name: lastName,
            registration_method: 'email',
            email_verified: false
        });
        const token = this.jwtManager.generateToken({userId: newUser.id, email: newUser.email});
        console.log(`SUCCESS: New user registered: ${email} (ID: ${newUser.id})`.green);
        return {
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.first_name || '',
                lastName: newUser.last_name || '',
                createdAt: newUser.created_at
            },
            token
        };
    }

    /**
     * Connexion avec email/password
     */
    async login(loginData: LoginData): Promise<AuthResult> {
        const { email, password } = loginData;
        const validationErrors = this.validateLoginData(loginData);

        if (validationErrors.length > 0) {
            const error = new Error('VALIDATION_FAILED') as any;
            error.validationErrors = validationErrors;
            throw error;
        }
        const user = await User.findByEmail(email);
        if (!user || !user.password_hash)
            throw new Error('INVALID_CREDENTIALS');
        if (!user.is_active)
            throw new Error('ACCOUNT_INACTIVE');
        const isPasswordValid = await PasswordManager.comparePassword(password, user.password_hash);
        if (!isPasswordValid)
            throw new Error('INVALID_CREDENTIALS');
        await User.updateLastLogin(user.id);
        const token = this.jwtManager.generateToken({userId: user.id, email: user.email});
        console.log(`SUCCESS: User logged in: ${email} (ID: ${user.id})`.green);
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                createdAt: user.created_at
            },
            token
        };
    }

    /**
     * Obtenir l'URL d'authentification Discord
     */
    getDiscordAuthUrl(): string {
        if (!this.oauthManager.isDiscordConfigured())
            throw new Error('DISCORD_OAUTH_NOT_CONFIGURED');
        return this.oauthManager.getDiscordAuthUrl();
    }

    /**
     * Gérer le callback Discord OAuth
     */
    async handleDiscordCallback(code: string): Promise<AuthResult> {
        try {
            const user = await this.oauthManager.handleDiscordCallback(code);

            if (!user || !user.id || !user.email)
                throw new Error('INVALID_OAUTH_USER_DATA');
            if (!user.is_active)
                throw new Error('ACCOUNT_INACTIVE');
            const token = this.jwtManager.generateToken({userId: user.id, email: user.email});
            console.log(`SUCCESS: Discord OAuth login: ${user.email} (ID: ${user.id})`.green);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name || '',
                    lastName: user.last_name || '',
                    createdAt: user.created_at
                },
                token
            };
        } catch (error) {
            console.error('Discord OAuth callback error:'.red, error);
            if (error instanceof Error)
                throw error;
            throw new Error('OAUTH_CALLBACK_FAILED');
        }
    }

    /**
     * Obtenir l'URL d'authentification Google
     */
    getGoogleAuthUrl(): string {
        if (!this.oauthManager.isGoogleConfigured())
            throw new Error('GOOGLE_OAUTH_NOT_CONFIGURED');
        return this.oauthManager.getGoogleAuthUrl();
    }

    /**
     * Gérer le callback Google OAuth
     */
    async handleGoogleCallback(code: string): Promise<AuthResult> {
        try {
            const user = await this.oauthManager.handleGoogleCallback(code);

            if (!user || !user.id || !user.email)
                throw new Error('INVALID_OAUTH_USER_DATA');
            if (!user.is_active)
                throw new Error('ACCOUNT_INACTIVE');
            const token = this.jwtManager.generateToken({userId: user.id, email: user.email});
            console.log(`SUCCESS: Google OAuth login: ${user.email} (ID: ${user.id})`.green);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name || '',
                    lastName: user.last_name || '',
                    createdAt: user.created_at
                },
                token
            };
        } catch (error) {
            console.error('Google OAuth callback error:'.red, error);
            if (error instanceof Error)
                throw error;
            throw new Error('OAUTH_CALLBACK_FAILED');
        }
    }

    /**
     * Vérifier un token JWT
     */
    async verifyToken(token: string): Promise<{ userId: string; email: string }> {
        try {
            const decoded = this.jwtManager.verifyToken(token);
            const user = await User.findById(decoded.userId);

            if (!user || !user.is_active)
                throw new Error('USER_NOT_FOUND_OR_INACTIVE');
            return {userId: decoded.userId, email: decoded.email};
        } catch (error) {
            if (error instanceof Error && (error.message === 'Token expired' || error.message === 'Invalid token' || error.message === 'Token verification failed'))
                throw error;
            if (error instanceof Error && error.message === 'USER_NOT_FOUND_OR_INACTIVE')
                throw error;
            throw new Error('TOKEN_VERIFICATION_FAILED');
        }
    }

    /**
     * Validation des données d'enregistrement
     */
    private validateRegistrationData(data: RegisterData): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!data.email)
            errors.push({ field: 'email', message: 'Email is required' });
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
            errors.push({ field: 'email', message: 'Invalid email format' });
        if (!data.password) {
            errors.push({ field: 'password', message: 'Password is required' });
        } else {
            const passwordValidation = PasswordManager.validatePasswordStrength(data.password);
            if (!passwordValidation.isValid)
                passwordValidation.errors.forEach(errorMsg => {errors.push({ field: 'password', message: errorMsg });});
        }
        if (!data.firstName)
            errors.push({ field: 'firstName', message: 'First name is required' });
        else if (data.firstName.length < 2)
            errors.push({ field: 'firstName', message: 'First name must be at least 2 characters' });
        else if (data.firstName.length > 50)
            errors.push({ field: 'firstName', message: 'First name must be less than 50 characters' });
        if (!data.lastName)
            errors.push({ field: 'lastName', message: 'Last name is required' });
        else if (data.lastName.length < 2)
            errors.push({ field: 'lastName', message: 'Last name must be at least 2 characters' });
        else if (data.lastName.length > 50)
            errors.push({ field: 'lastName', message: 'Last name must be less than 50 characters' });
        return errors;
    }

    /**
     * Validation des données de connexion
     */
    private validateLoginData(data: LoginData): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!data.email)
            errors.push({ field: 'email', message: 'Email is required' });
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
            errors.push({ field: 'email', message: 'Invalid email format' });
        if (!data.password)
            errors.push({ field: 'password', message: 'Password is required' });
        return errors;
    }

    /**
     * Vérifier si Google OAuth est configuré
     */
    isGoogleConfigured(): boolean {
        return this.oauthManager.isGoogleConfigured();
    }

    /**
     * Vérifier si Discord OAuth est configuré
     */
    isDiscordConfigured(): boolean {
        return this.oauthManager.isDiscordConfigured();
    }

    /**
     * Obtenir le statut de tous les providers OAuth
     */
    getOAuthProvidersStatus(): any {
        return this.oauthManager.getProvidersStatus();
    }
}

export default AuthService;
