import { User } from '../models/User';
import { PasswordManager } from '../../shared/auth/PasswordManager';
import { JwtManager } from '../../shared/auth/JwtManager';
import { OAuthManager } from '../../shared/auth/OAuthManager';
import { UserSession } from '../models/UserSession';
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
    refreshToken: string;
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
        const token = this.jwtManager.generateToken({ userId: newUser.id, email: newUser.email });
        const refreshToken = this.jwtManager.generateRefreshToken({ userId: newUser.id, email: newUser.email });
        const refreshExpiry = this.jwtManager.getTokenExpiry(refreshToken) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await UserSession.create(newUser.id, refreshToken, refreshExpiry);
        console.log(`SUCCESS: New user registered: ${email} (ID: ${newUser.id})`.green);
        return {
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.first_name || '',
                lastName: newUser.last_name || '',
                createdAt: newUser.created_at
            },
            token,
            refreshToken
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
        const token = this.jwtManager.generateToken({ userId: user.id, email: user.email });
        const refreshToken = this.jwtManager.generateRefreshToken({ userId: user.id, email: user.email });
        const refreshExpiry = this.jwtManager.getTokenExpiry(refreshToken) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await UserSession.create(user.id, refreshToken, refreshExpiry);
        console.log(`SUCCESS: User logged in: ${email} (ID: ${user.id})`.green);
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                createdAt: user.created_at
            },
            token,
            refreshToken
        };
    }

    /**
     * Obtenir l'URL d'authentification Discord
     */
    getDiscordAuthUrl(state?: string): string {
        if (!this.oauthManager.isDiscordConfigured())
            throw new Error('DISCORD_OAUTH_NOT_CONFIGURED');
        return this.oauthManager.getDiscordAuthUrl(state);
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
            const token = this.jwtManager.generateToken({ userId: user.id, email: user.email });
            const refreshToken = this.jwtManager.generateRefreshToken({ userId: user.id, email: user.email });
            const refreshExpiry = this.jwtManager.getTokenExpiry(refreshToken) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await UserSession.create(user.id, refreshToken, refreshExpiry);
            console.log(`SUCCESS: Discord OAuth login: ${user.email} (ID: ${user.id})`.green);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name || '',
                    lastName: user.last_name || '',
                    createdAt: user.created_at
                },
                token,
                refreshToken
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
    getGoogleAuthUrl(state?: string): string {
        if (!this.oauthManager.isGoogleConfigured())
            throw new Error('GOOGLE_OAUTH_NOT_CONFIGURED');
        return this.oauthManager.getGoogleAuthUrl(state);
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
            const token = this.jwtManager.generateToken({ userId: user.id, email: user.email });
            const refreshToken = this.jwtManager.generateRefreshToken({ userId: user.id, email: user.email });
            const refreshExpiry = this.jwtManager.getTokenExpiry(refreshToken) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await UserSession.create(user.id, refreshToken, refreshExpiry);
            console.log(`SUCCESS: Google OAuth login: ${user.email} (ID: ${user.id})`.green);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name || '',
                    lastName: user.last_name || '',
                    createdAt: user.created_at
                },
                token,
                refreshToken
            };
        } catch (error) {
            console.error('Google OAuth callback error:'.red, error);
            if (error instanceof Error)
                throw error;
            throw new Error('OAUTH_CALLBACK_FAILED');
        }
    }

    /**
     * Exchange refresh token for new access token (no rotation/invalidation logic yet)
     */
    async refreshAccessToken(refreshToken: string): Promise<{ token: string; user: { id: string; email: string } }> {
        try {
            const decoded = this.jwtManager.verifyRefreshToken(refreshToken);

            if (!decoded.userId || !decoded.email)
                throw new Error('INVALID_REFRESH_TOKEN');
            const user = await User.findById(decoded.userId);
            if (!user || !user.is_active)
                throw new Error('USER_NOT_FOUND_OR_INACTIVE');
            const newAccessToken = this.jwtManager.generateToken({ userId: user.id, email: user.email });
            return { token: newAccessToken, user: { id: user.id, email: user.email } };
        } catch (error) {
            if (error instanceof Error) {
                if (['Refresh token expired', 'Invalid refresh token', 'Refresh token verification failed', 'USER_NOT_FOUND_OR_INACTIVE'].includes(error.message))
                    throw error;
            }
            throw new Error('REFRESH_FAILED');
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
            return { userId: decoded.userId, email: decoded.email };
        } catch (error) {
            if (error instanceof Error && (error.message === 'Token expired' || error.message === 'Invalid token' || error.message === 'Token verification failed'))
                throw error;
            if (error instanceof Error && error.message === 'USER_NOT_FOUND_OR_INACTIVE')
                throw error;
            throw new Error('TOKEN_VERIFICATION_FAILED');
        }
    }

    /**
     * Vérifier un token JWT sans lever d'exception (retourne true/false)
     * Utilisé pour vérifier si un utilisateur est déjà authentifié lors d'un callback OAuth
     */
    async verifyJWT(token: string | undefined): Promise<boolean> {
        if (!token)
            return false;

        try {
            const decoded = this.jwtManager.verifyToken(token);
            const user = await User.findById(decoded.userId);
            return !!(user && user.is_active);
        } catch (error) {
            return false;
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
                passwordValidation.errors.forEach(errorMsg => { errors.push({ field: 'password', message: errorMsg }); });
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

    /**
     * Refresh tokens using a valid refresh token (rotation strategy)
     */
    async refreshTokens(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
        if (!refreshToken)
            throw new Error('NO_REFRESH_TOKEN');

        try {
            const decoded = this.jwtManager.verifyToken(refreshToken);
            if (decoded.type !== 'refresh')
                throw new Error('INVALID_REFRESH_TOKEN');
            const session = await UserSession.findActiveByToken(refreshToken);
            if (!session)
                throw new Error('REFRESH_SESSION_NOT_FOUND');
            const newAccessToken = this.jwtManager.generateToken({ userId: decoded.userId, email: decoded.email });
            const newRefreshToken = this.jwtManager.generateRefreshToken({ userId: decoded.userId, email: decoded.email });
            const newExpiry = this.jwtManager.getTokenExpiry(newRefreshToken) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const rotated = await UserSession.rotate(refreshToken, newRefreshToken, newExpiry);
            if (!rotated)
                throw new Error('REFRESH_ROTATION_FAILED');
            return { token: newAccessToken, refreshToken: newRefreshToken };
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error('INVALID_REFRESH_TOKEN');
        }
    }

    /**
     * Logout: invalidate refresh token (session)
     */
    async logout(refreshToken?: string): Promise<void> {
        if (!refreshToken)
            return; // nothing to do
        await UserSession.deactivateByToken(refreshToken);
    }

    /**
     * Obtenir l'URL d'authentification GitHub
     */
    getGitHubAuthUrl(state?: string): string {
        if (!this.oauthManager.isGitHubConfigured())
            throw new Error('GITHUB_OAUTH_NOT_CONFIGURED');
        return this.oauthManager.getGitHubAuthUrl(state);
    }

    /**
     * Gérer le callback GitHub OAuth
     */
    async handleGitHubCallback(code: string): Promise<AuthResult> {
        try {
            const user = await this.oauthManager.handleGitHubCallback(code);

            if (!user || !user.id || !user.email)
                throw new Error('INVALID_OAUTH_USER_DATA');
            if (!user.is_active)
                throw new Error('ACCOUNT_INACTIVE');
            const token = this.jwtManager.generateToken({ userId: user.id, email: user.email });
            const refreshToken = this.jwtManager.generateRefreshToken({ userId: user.id, email: user.email });
            const refreshExpiry = this.jwtManager.getTokenExpiry(refreshToken) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await UserSession.create(user.id, refreshToken, refreshExpiry);
            console.log(`SUCCESS: GitHub OAuth login: ${user.email} (ID: ${user.id})`.green);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name || '',
                    lastName: user.last_name || '',
                    createdAt: user.created_at
                },
                token,
                refreshToken
            };
        } catch (error) {
            console.error('GitHub OAuth callback error:'.red, error);
            if (error instanceof Error)
                throw error;
            throw new Error('OAUTH_CALLBACK_FAILED');
        }
    }

    /**
     * Vérifier si GitHub OAuth est configuré
     */
    isGitHubConfigured(): boolean {
        return this.oauthManager.isGitHubConfigured();
    }

    /**
     * Obtenir l'URL d'authentification GitLab
     */
    getGitLabAuthUrl(state?: string): string {
        if (!this.oauthManager.isGitLabConfigured())
            throw new Error('GITLAB_OAUTH_NOT_CONFIGURED');
        return this.oauthManager.getGitLabAuthUrl(state);
    }

    /**
     * Gérer le callback GitLab OAuth
     */
    async handleGitLabCallback(code: string): Promise<AuthResult> {
        try {
            const user = await this.oauthManager.handleGitLabCallback(code);

            if (!user || !user.id || !user.email)
                throw new Error('INVALID_OAUTH_USER_DATA');
            if (!user.is_active)
                throw new Error('ACCOUNT_INACTIVE');
            const token = this.jwtManager.generateToken({ userId: user.id, email: user.email });
            const refreshToken = this.jwtManager.generateRefreshToken({ userId: user.id, email: user.email });
            const refreshExpiry = this.jwtManager.getTokenExpiry(refreshToken) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await UserSession.create(user.id, refreshToken, refreshExpiry);
            console.log(`SUCCESS: GitLab OAuth login: ${user.email} (ID: ${user.id})`.green);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name || '',
                    lastName: user.last_name || '',
                    createdAt: user.created_at
                },
                token,
                refreshToken
            };
        } catch (error) {
            console.error('GitLab OAuth callback error:'.red, error);
            if (error instanceof Error)
                throw error;
            throw new Error('OAUTH_CALLBACK_FAILED');
        }
    }

    /**
     * Vérifier si GitLab OAuth est configuré
     */
    isGitLabConfigured(): boolean {
        return this.oauthManager.isGitLabConfigured();
    }

    /**
     * Obtenir l'URL d'authentification Dropbox
     */
    getDropboxAuthUrl(state?: string): string {
        if (!this.oauthManager.isDropboxConfigured())
            throw new Error('DROPBOX_OAUTH_NOT_CONFIGURED');
        return this.oauthManager.getDropboxAuthUrl(state);
    }

    /**
     * Gérer le callback Dropbox OAuth
     */
    async handleDropboxCallback(code: string): Promise<AuthResult> {
        try {
            const user = await this.oauthManager.handleDropboxCallback(code);

            if (!user || !user.id || !user.email)
                throw new Error('INVALID_OAUTH_USER_DATA');
            if (!user.is_active)
                throw new Error('ACCOUNT_INACTIVE');
            const token = this.jwtManager.generateToken({ userId: user.id, email: user.email });
            const refreshToken = this.jwtManager.generateRefreshToken({ userId: user.id, email: user.email });
            const refreshExpiry = this.jwtManager.getTokenExpiry(refreshToken) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await UserSession.create(user.id, refreshToken, refreshExpiry);
            console.log(`SUCCESS: Dropbox OAuth login: ${user.email} (ID: ${user.id})`.green);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name || '',
                    lastName: user.last_name || '',
                    createdAt: user.created_at
                },
                token,
                refreshToken
            };
        } catch (error) {
            console.error('Dropbox OAuth callback error:'.red, error);
            if (error instanceof Error)
                throw error;
            throw new Error('OAUTH_CALLBACK_FAILED');
        }
    }

    /**
     * Vérifier si Dropbox OAuth est configuré
     */
    isDropboxConfigured(): boolean {
        return this.oauthManager.isDropboxConfigured();
    }
}

export default AuthService;
