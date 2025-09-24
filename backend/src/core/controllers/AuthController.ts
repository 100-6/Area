import { Request, Response } from 'express';
import AuthService from '../services/AuthService';
import 'colors';

interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

interface LoginRequest {
    email: string;
    password: string;
}

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    /**
     * Enregistrement d'un nouvel utilisateur
     */
    public register = async (req: Request, res: Response): Promise<void> => {
        try {
            const registerData: RegisterRequest = req.body;
            const result = await this.authService.register(registerData);

            res.status(201).json({message: 'Registration successful', user: result.user, token: result.token});
        } catch (error) {
            console.error('ERROR: Registration failed:'.red, error);
            this.handleServiceError(error, res);
        }
    };

    /**
     * Connexion avec email/password
     */
    public login = async (req: Request, res: Response): Promise<void> => {
        try {
            const loginData: LoginRequest = req.body;
            const result = await this.authService.login(loginData);

            res.json({message: 'Login successful', user: result.user, token: result.token});
        } catch (error) {
            console.error('ERROR: Login failed:'.red, error);
            this.handleServiceError(error, res);
        }
    };

    /**
     * Initiate Google OAuth
     * GET /api/auth/google
     */
    public googleLogin = async (req: Request, res: Response): Promise<void> => {
        try {
            const authUrl = this.authService.getGoogleAuthUrl();
            res.redirect(authUrl);
        } catch (error) {
            console.error('Google OAuth redirect error:'.red, error);
            if (error instanceof Error && error.message === 'GOOGLE_OAUTH_NOT_CONFIGURED')
                res.status(500).json({ error: 'Google OAuth not configured' });
            else
                res.status(500).json({ error: 'Failed to initiate Google OAuth' });
        }
    };

    /**
     * Handle Google OAuth callback
     * GET /api/auth/google/callback
     */
    public googleCallback = async (req: Request, res: Response): Promise<void> => {
        try {
            const { code, error } = req.query;
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

            if (error) {
                console.error('Google OAuth error:', error);
                res.redirect(`${frontendUrl}/auth/error?error=${error}`);
                return;
            }
            if (!code) {
                res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent('Authorization code missing')}`);
                return;
            }
            const result = await this.authService.handleGoogleCallback(code as string);
            res.redirect(`${frontendUrl}/auth/success?token=${result.token}`);
        } catch (error) {
            console.error('Google OAuth callback error:'.red, error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            let errorMessage = 'Authentication failed';
            if (error instanceof Error) {
                switch (error.message) {
                    case 'INVALID_OAUTH_USER_DATA':
                        errorMessage = 'Invalid user data received';
                        break;
                    case 'ACCOUNT_INACTIVE':
                        errorMessage = 'Account is inactive';
                        break;
                    case 'OAUTH_CALLBACK_FAILED':
                        errorMessage = 'OAuth authentication failed';
                        break;
                }
            }
            res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(errorMessage)}`);
        }
    };

    /**
     * Vérifier un token JWT
     */
    public verifyToken = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                res.status(401).json({ error: 'No token provided' });
                return;
            }
            const result = await this.authService.verifyToken(token);
            res.json({valid: true, user: result});
        } catch (error) {
            console.error('Token verification error:'.red, error);
            let errorMessage = 'Invalid or expired token';
            if (error instanceof Error) {
                switch (error.message) {
                    case 'USER_NOT_FOUND_OR_INACTIVE':
                        errorMessage = 'User not found or inactive';
                        break;
                    case 'Token expired':
                        errorMessage = 'Token expired';
                        break;
                    case 'Invalid token':
                        errorMessage = 'Invalid token';
                        break;
                }
            }
            res.status(401).json({valid: false, error: errorMessage});
        }
    };

    /**
     * Obtenir les informations de l'utilisateur actuel
     * GET /api/auth/me
     */
    public getCurrentUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                res.status(401).json({ error: 'No token provided' });
                return;
            }

            const user = await this.authService.getCurrentUser(token);
            res.json({
                success: true,
                user: user
            });
        } catch (error) {
            console.error('Get current user error:'.red, error);
            let errorMessage = 'Failed to get user information';
            let statusCode = 500;

            if (error instanceof Error) {
                switch (error.message) {
                    case 'USER_NOT_FOUND_OR_INACTIVE':
                        errorMessage = 'User not found or inactive';
                        statusCode = 404;
                        break;
                    case 'Token expired':
                        errorMessage = 'Token expired';
                        statusCode = 401;
                        break;
                    case 'Invalid token':
                    case 'TOKEN_VERIFICATION_FAILED':
                        errorMessage = 'Invalid token';
                        statusCode = 401;
                        break;
                }
            }

            res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    };

    /**
     * Route de déconnexion
     */
    public logout = (req: Request, res: Response): void => {
        res.json({ message: 'Logout successful' });
    };

    /**
     * Gérer les erreurs du service
     */
    private handleServiceError(error: any, res: Response): void {
        if (!(error instanceof Error)) {
            res.status(500).json({error: 'Internal server error', message: 'Une erreur inconnue est survenue'});
            return;
        }
        switch (error.message) {
            case 'USER_ALREADY_EXISTS':
                res.status(409).json({error: 'User already exists', message: 'Un compte existe déjà avec cet email'});
                break;
            case 'INVALID_CREDENTIALS':
                res.status(401).json({error: 'Invalid credentials', message: 'Email ou mot de passe incorrect'});
                break;
            case 'ACCOUNT_INACTIVE':
                res.status(403).json({error: 'Account inactive', message: 'Ce compte est inactif'});
                break;
            case 'VALIDATION_FAILED':
                res.status(400).json({error: 'Validation failed', details: (error as any).validationErrors || []});
                break;
            default:
                res.status(500).json({error: 'Internal server error', message: 'Une erreur est survenue'});
        }
    }
}
