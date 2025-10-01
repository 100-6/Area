import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/AuthService';
import UserService from '../services/UserService';
import { asyncHandler } from '../middleware/error';
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

interface CustomError extends Error {
    statusCode?: number;
    validationErrors?: Array<{ field: string; message: string }>;
    code?: string;
}

export class AuthController {
    private authService: AuthService;
    private userService: UserService;

    constructor() {
        this.authService = new AuthService();
        this.userService = new UserService();
    }

    /**
     * Enregistrement d'un nouvel utilisateur
     */
    public register = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const registerData: RegisterRequest = req.body;
        
        try {
            const result = await this.authService.register(registerData);
            res.status(201).json({success: true, message: 'Registration successful', user: result.user, token: result.token, refreshToken: result.refreshToken});
        } catch (error) {
            next(error);
        }
    });

    /**
     * Connexion avec email/password
     */
    public login = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const loginData: LoginRequest = req.body;
        
        console.log('Login attempt for email:'.blue, loginData);
        try {
            const result = await this.authService.login(loginData);
            res.json({success: true, message: 'Login successful', user: result.user, token: result.token, refreshToken: result.refreshToken});
        } catch (error) {
            next(error);
        }
    });

    /**
     * Vérifier un token JWT
     */
    public verifyToken = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            const error = new Error('NO_TOKEN_PROVIDED') as CustomError;
            error.statusCode = 401;
            error.code = 'NO_TOKEN_PROVIDED';
            return next(error);
        }
        try {
            const result = await this.authService.verifyToken(token);
            res.json({success: true, valid: true, user: result});
        } catch (error) {
            next(error);
        }
    });

    /**
     * Route de déconnexion
     */
    public logout = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const refreshToken = (req.body && req.body.refreshToken) || req.headers['x-refresh-token'];
        
        try {
            await this.authService.logout(typeof refreshToken === 'string' ? refreshToken : undefined);
            res.json({success: true, message: 'Logout successful'});
        } catch (error) {
            res.json({success: true, message: 'Logout failed'}); // Always return success to avoid token fishing
        }
    });

    /**
     * Refresh access & refresh token pair
     */
    public refresh = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const refreshToken = req.body?.refreshToken || req.headers['x-refresh-token'];
        
        if (!refreshToken || typeof refreshToken !== 'string') {
            const error = new Error('NO_REFRESH_TOKEN') as CustomError;
            error.statusCode = 400;
            error.code = 'NO_REFRESH_TOKEN';
            return next(error);
        }
        try {
            const tokens = await this.authService.refreshTokens(refreshToken);
            res.json({ success: true, message: 'Tokens refreshed', token: tokens.token, refreshToken: tokens.refreshToken});
        } catch (error) {
            next(error);
        }
    });
    
    /**
     * Helper to set refresh cookie (placeholder—cookie-parser not yet integrated in this commit)
     */
    private setRefreshCookie(res: Response, refreshToken: string) {
        // If you add cookie-parser later, convert to res.cookie('refreshToken', refreshToken, options)
        // For now, expose via header so the frontend can store it; (NOT IDEAL SECURITY) kept minimal per request.
        res.setHeader('x-refresh-token', refreshToken);
    }

    /* =============================   OAuth    ============================= */
    /*                                   |                                    */
    /*                                   v                                    */

    /**
     * Initiate Discord OAuth
     * GET /api/auth/discord
     */
    public discordLogin = async (req: Request, res: Response): Promise<void> => {
        try {
            const authUrl = this.authService.getDiscordAuthUrl();
            res.redirect(authUrl);
        } catch (error) {
            console.error('Discord OAuth redirect error:'.red, error);
            if (error instanceof Error && error.message === 'DISCORD_OAUTH_NOT_CONFIGURED')
                res.status(500).json({ error: 'Discord OAuth not configured' });
            else
                res.status(500).json({ error: 'Failed to initiate Discord OAuth' });
        }
    };

    /**
     * Handle Discord OAuth callback
     * GET /api/auth/discord/callback
     */
    public discordCallback = async (req: Request, res: Response): Promise<void> => {
        try {
            const { code, error } = req.query;
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);

            if (error) {
                console.error('Discord OAuth error:', error);
                res.redirect(`${redirectUrl}/auth/error?error=${error}`);
                return;
            }
            if (!code) {
                res.redirect(`${redirectUrl}/auth/error?message=${encodeURIComponent('Authorization code missing')}`);
                return;
            }
            const result = await this.authService.handleDiscordCallback(code as string);
            // Can't reliably set HttpOnly cookie cross-domain via redirect without same-site alignment; send token in URL as before + (optional) plan for frontend to hit /api/auth/transfer to set cookie server-side.
            res.redirect(`${redirectUrl}/auth/success?token=${result.token}&provider=discord&refresh=${result.refreshToken}`);
        } catch (error) {
            console.error('Discord OAuth callback error:'.red, error);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            let errorMessage = 'Authentication failed';
            if (error instanceof Error) {
                switch (error.message) {
                    case 'INVALID_OAUTH_USER_DATA':
                        errorMessage = 'Invalid user data received from Discord';
                        break;
                    case 'ACCOUNT_INACTIVE':
                        errorMessage = 'Account is inactive';
                        break;
                    case 'OAUTH_CALLBACK_FAILED':
                        errorMessage = 'Discord authentication failed';
                        break;
                }
            }
            res.redirect(`${redirectUrl}/auth/error?message=${encodeURIComponent(errorMessage)}&provider=discord`);
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
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);

            if (error) {
                console.error('Google OAuth error:', error);
                res.redirect(`${redirectUrl}/auth/error?error=${error}`);
                return;
            }
            if (!code) {
                res.redirect(`${redirectUrl}/auth/error?message=${encodeURIComponent('Authorization code missing')}`);
                return;
            }
            const result = await this.authService.handleGoogleCallback(code as string);
            res.redirect(`${redirectUrl}/auth/success?token=${result.token}&refresh=${result.refreshToken}`);
        } catch (error) {
            console.error('Google OAuth callback error:'.red, error);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
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
            res.redirect(`${redirectUrl}/auth/error?message=${encodeURIComponent(errorMessage)}`);
        }
    };

    /**
     * Initiate GitHub OAuth
     * GET /api/auth/github
     */
    public gitHubLogin = async (req: Request, res: Response): Promise<void> => {
        try {
            const authUrl = this.authService.getGitHubAuthUrl();
            res.redirect(authUrl);
        } catch (error) {
            console.error('GitHub OAuth redirect error:'.red, error);
            if (error instanceof Error && error.message === 'GITHUB_OAUTH_NOT_CONFIGURED')
                res.status(500).json({ error: 'GitHub OAuth not configured' });
            else
                res.status(500).json({ error: 'Failed to initiate GitHub OAuth' });
        }
    };

    /**
     * Handle GitHub OAuth callback
     * GET /api/auth/github/callback
     */
    public gitHubCallback = async (req: Request, res: Response): Promise<void> => {
        try {
            const { code, error } = req.query;
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);

            if (error) {
                console.error('GitHub OAuth error:', error);
                res.redirect(`${redirectUrl}/auth/error?error=${error}`);
                return;
            }
            if (!code) {
                res.redirect(`${redirectUrl}/auth/error?message=${encodeURIComponent('Authorization code missing')}`);
                return;
            }
            const result = await this.authService.handleGitHubCallback(code as string);
            res.redirect(`${redirectUrl}/auth/success?token=${result.token}&refresh=${result.refreshToken}`);
        } catch (error) {
            console.error('GitHub OAuth callback error:'.red, error);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
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
            res.redirect(`${redirectUrl}/auth/error?message=${encodeURIComponent(errorMessage)}`);
        }
    };

    /**
     * Initiate GitLab OAuth
     * GET /api/auth/gitlab
     */
    public gitLabLogin = async (req: Request, res: Response): Promise<void> => {
        try {
            const authUrl = this.authService.getGitLabAuthUrl();
            res.redirect(authUrl);
        } catch (error) {
            console.error('GitLab OAuth redirect error:'.red, error);
            if (error instanceof Error && error.message === 'GITLAB_OAUTH_NOT_CONFIGURED')
                res.status(500).json({ error: 'GitLab OAuth not configured' });
            else
                res.status(500).json({ error: 'Failed to initiate GitLab OAuth' });
        }
    };

    /**
     * Handle GitLab OAuth callback
     * GET /api/auth/gitlab/callback
     */
    public gitLabCallback = async (req: Request, res: Response): Promise<void> => {
        try {
            const { code, error } = req.query;
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);

            if (error) {
                console.error('GitLab OAuth error:', error);
                res.redirect(`${redirectUrl}/auth/error?error=${error}`);
                return;
            }
            if (!code) {
                res.redirect(`${redirectUrl}/auth/error?message=${encodeURIComponent('Authorization code missing')}`);
                return;
            }

            const result = await this.authService.handleGitLabCallback(code as string);
            res.redirect(`${redirectUrl}/auth/success?token=${result.token}`);
        } catch (error) {
            console.error('GitLab OAuth callback error:'.red, error);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
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
            res.redirect(`${redirectUrl}/auth/error?message=${encodeURIComponent(errorMessage)}`);
        }
    };

    /**
     * Détecter si la requête provient d'un device mobile
     */
    private isMobileRequest(req: Request): boolean {
        const userAgent = req.headers['user-agent'] || '';
        const isMobileUA = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);

        // Vérifier aussi les paramètres de query pour forcer le mode mobile
        const mobileParam = req.query.mobile === 'true';

        return isMobileUA || mobileParam;
    }

    /**
     * Obtenir l'URL de redirection appropriée selon le type de client
     */
    private getRedirectUrl(isMobile: boolean): string {
        if (isMobile) {
            // Utiliser le custom URL scheme pour l'app mobile
            return 'autoarea://oauth';
        } else {
            // Utiliser l'URL frontend classique pour le web
            return process.env.FRONTEND_URL || 'http://localhost:3000';
        }
    }

    /**
     * Initiate Dropbox OAuth
     * GET /api/auth/dropbox
     */
    public dropboxLogin = async (req: Request, res: Response): Promise<void> => {
        try {
            const authUrl = this.authService.getDropboxAuthUrl();
            res.redirect(authUrl);
        } catch (error) {
            console.error('Dropbox OAuth redirect error:'.red, error);
            if (error instanceof Error && error.message === 'DROPBOX_OAUTH_NOT_CONFIGURED')
                res.status(500).json({ error: 'Dropbox OAuth not configured' });
            else
                res.status(500).json({ error: 'Failed to initiate Dropbox OAuth' });
        }
    };

    /**
     * Handle Dropbox OAuth callback
     * GET /api/auth/dropbox/callback
     */
    public dropboxCallback = async (req: Request, res: Response): Promise<void> => {
        try {
            const { code, error } = req.query;
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);œ

            if (error) {
                console.error('Dropbox OAuth error:', error);
                res.redirect(`${redirectUrl}/auth/error?error=${error}`);
                return;
            }
            if (!code) {
                res.redirect(`${redirectUrl}/auth/error?message=${encodeURIComponent('Authorization code missing')}`);
                return;
            }

            const result = await this.authService.handleDropboxCallback(code as string);
            res.redirect(`${redirectUrl}/auth/success?token=${result.token}`);
        } catch (error) {
            console.error('Dropbox OAuth callback error:'.red, error);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
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
            res.redirect(`${redirectUrl}/auth/error?message=${encodeURIComponent(errorMessage)}`);
        }
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
