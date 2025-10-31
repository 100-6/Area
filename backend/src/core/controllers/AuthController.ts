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
            const token = req.query.token as string | undefined;
            const isMobile = this.isMobileRequest(req);
            let state: string | undefined;

            if (token || isMobile) {
                const stateData = { token, isMobile };
                state = Buffer.from(JSON.stringify(stateData)).toString('base64');
            }
            const authUrl = this.authService.getDiscordAuthUrl(state);
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
            const { code, error, state } = req.query;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (e) {
                    console.warn('Failed to parse state:', e);
                }
            }
            const isMobile = stateData.isMobile || this.isMobileRequest(req);
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
            const isAlreadyAuthenticated = await this.authService.verifyJWT(stateData.token);
            if (isAlreadyAuthenticated) {
                const decoded = await this.authService.verifyToken(stateData.token as string);
                await this.authService.handleDiscordCallback(code as string, decoded.userId);
                res.redirect(`${redirectUrl}/service/success?service=discord`);
            } else {
                const result = await this.authService.handleDiscordCallback(code as string);
                res.redirect(`${redirectUrl}/auth/success?token=${result.token}&provider=discord&refresh=${result.refreshToken}`);
            }
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
            const token = req.query.token as string | undefined;
            const isMobile = this.isMobileRequest(req);
            let state: string | undefined;

            if (token || isMobile) {
                const stateData = { token, isMobile };
                state = Buffer.from(JSON.stringify(stateData)).toString('base64');
            }
            const authUrl = this.authService.getGoogleAuthUrl(state);
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
            const { code, error, state } = req.query;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (e) {
                    console.warn('Failed to parse state:', e);
                }
            }
            const isMobile = stateData.isMobile || this.isMobileRequest(req);
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
            const isAlreadyAuthenticated = await this.authService.verifyJWT(stateData.token);
            if (isAlreadyAuthenticated) {
                const decoded = await this.authService.verifyToken(stateData.token as string);
                await this.authService.handleGoogleCallback(code as string, decoded.userId);
                res.redirect(`${redirectUrl}/service/success?service=google`);
            } else {
                const result = await this.authService.handleGoogleCallback(code as string);
                res.redirect(`${redirectUrl}/auth/success?token=${result.token}&provider=google&refresh=${result.refreshToken}`);
            }
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
            const token = req.query.token as string | undefined;
            const isMobile = this.isMobileRequest(req);
            let state: string | undefined;

            if (token || isMobile) {
                const stateData = { token, isMobile };
                state = Buffer.from(JSON.stringify(stateData)).toString('base64');
            }
            const authUrl = this.authService.getGitHubAuthUrl(state);
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
            const { code, error, state } = req.query;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (e) {
                    console.warn('Failed to parse state:', e);
                }
            }
            const isMobile = stateData.isMobile || this.isMobileRequest(req);
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
            const isAlreadyAuthenticated = await this.authService.verifyJWT(stateData.token);
            if (isAlreadyAuthenticated) {
                const decoded = await this.authService.verifyToken(stateData.token as string);
                await this.authService.handleGitHubCallback(code as string, decoded.userId);
                res.redirect(`${redirectUrl}/service/success?service=github`);
            } else {
                const result = await this.authService.handleGitHubCallback(code as string);
                res.redirect(`${redirectUrl}/auth/success?token=${result.token}&provider=github&refresh=${result.refreshToken}`);
            }
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
            const token = req.query.token as string | undefined;
            const isMobile = this.isMobileRequest(req);
            let state: string | undefined;

            if (token || isMobile) {
                const stateData = { token, isMobile };
                state = Buffer.from(JSON.stringify(stateData)).toString('base64');
            }
            const authUrl = this.authService.getGitLabAuthUrl(state);
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
            const { code, error, state } = req.query;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (e) {
                    console.warn('Failed to parse state:', e);
                }
            }
            const isMobile = stateData.isMobile || this.isMobileRequest(req);
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
            const isAlreadyAuthenticated = await this.authService.verifyJWT(stateData.token);
            if (isAlreadyAuthenticated) {
                const decoded = await this.authService.verifyToken(stateData.token as string);
                await this.authService.handleGitLabCallback(code as string, decoded.userId);
                res.redirect(`${redirectUrl}/service/success?service=gitlab`);
            } else {
                const result = await this.authService.handleGitLabCallback(code as string);
                res.redirect(`${redirectUrl}/auth/success?token=${result.token}&provider=gitlab&refresh=${result.refreshToken}`);
            }
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
     * Initiate Dropbox OAuth
     * GET /api/auth/dropbox
     */
    public dropboxLogin = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.query.token as string | undefined;
            const isMobile = this.isMobileRequest(req);
            let state: string | undefined;

            if (token || isMobile) {
                const stateData = { token, isMobile };
                state = Buffer.from(JSON.stringify(stateData)).toString('base64');
            }
            const authUrl = this.authService.getDropboxAuthUrl(state);
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
            const { code, error, state } = req.query;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (e) {
                    console.warn('Failed to parse state:', e);
                }
            }
            const isMobile = stateData.isMobile || this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            if (error) {
                console.error('Dropbox OAuth error:', error);
                res.redirect(`${redirectUrl}/auth/error?error=${error}`);
                return;
            }
            if (!code) {
                res.redirect(`${redirectUrl}/auth/error?message=${encodeURIComponent('Authorization code missing')}`);
                return;
            }
            const isAlreadyAuthenticated = await this.authService.verifyJWT(stateData.token);
            if (isAlreadyAuthenticated) {
                const decoded = await this.authService.verifyToken(stateData.token as string);
                await this.authService.handleDropboxCallback(code as string, decoded.userId);
                res.redirect(`${redirectUrl}/service/success?service=dropbox`);
            } else {
                const result = await this.authService.handleDropboxCallback(code as string);
                res.redirect(`${redirectUrl}/auth/success?token=${result.token}&provider=dropbox&refresh=${result.refreshToken}`);
            }
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
     * Initiate Trello OAuth
     * GET /api/auth/trello
     */
    public trelloLogin = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.query.token as string | undefined;
            const isMobile = this.isMobileRequest(req);
            let state: string | undefined;

            if (token || isMobile) {
                const stateData = { token, isMobile };
                state = Buffer.from(JSON.stringify(stateData)).toString('base64');
            }
            const authUrl = this.authService.getTrelloAuthUrl(state);
            res.redirect(authUrl);
        } catch (error) {
            console.error('Trello OAuth redirect error:'.red, error);
            if (error instanceof Error && error.message === 'TRELLO_OAUTH_NOT_CONFIGURED')
                res.status(500).json({ error: 'Trello OAuth not configured' });
            else
                res.status(500).json({ error: 'Failed to initiate Trello OAuth' });
        }
    };

    /**
     * Handle Trello OAuth callback
     * GET /api/auth/trello/callback
     * Note: Trello uses hash fragment (#token=...) instead of query parameters
     * This endpoint serves an HTML page to extract the token from the hash
     */
    public trelloCallback = async (req: Request, res: Response): Promise<void> => {
        try {
            const { state } = req.query;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (e) {
                    console.warn('Failed to parse state:', e);
                }
            }
            const isMobile = stateData.isMobile || this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            const baseUrl = `${req.protocol}://${req.get('host')}`;

            // Send HTML page that will extract token from hash and redirect
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https:;");
            res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trello Authentication</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f5f5f5; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { margin: 20px 0; font-size: 16px; }
        .error { color: #d32f2f; }
        .success { color: #388e3c; }
        .debug { margin-top: 20px; padding: 10px; background: #f0f0f0; font-size: 12px; text-align: left; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Trello Authentication</h2>
        <div class="status" id="status">Processing authentication...</div>
        <div class="debug" id="debug"></div>
    </div>
    <script type="text/javascript">
        (function() {
            var statusEl = document.getElementById('status');
            var debugEl = document.getElementById('debug');
            
            function debug(msg) {
                console.log(msg);
                debugEl.innerHTML += msg + '<br>';
            }
            
            try {
                debug('Page loaded');
                debug('Full URL: ' + window.location.href);
                
                var hash = window.location.hash.substring(1);
                debug('Hash: ' + hash);
                
                var params = new URLSearchParams(hash);
                var token = params.get('token');
                debug('Token: ' + (token ? token.substring(0, 20) + '...' : 'null'));
                
                if (!token) {
                    statusEl.textContent = 'Error: Token missing from URL';
                    statusEl.className = 'status error';
                    setTimeout(function() {
                        window.location.href = '${redirectUrl}/auth/error?message=' + encodeURIComponent('Token missing');
                    }, 2000);
                    return;
                }
                
                statusEl.textContent = 'Token received, validating...';
                
                var processUrl = '/api/auth/trello/process';
                debug('POST URL: ' + processUrl);
                
                var xhr = new XMLHttpRequest();
                xhr.open('POST', processUrl, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                
                xhr.onload = function() {
                    debug('Response status: ' + xhr.status);
                    debug('Response text: ' + xhr.responseText.substring(0, 100));
                    
                    if (xhr.status === 200) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            if (data.success) {
                                statusEl.textContent = 'Success! Redirecting...';
                                statusEl.className = 'status success';
                                var redirectTarget = data.isAuthenticated 
                                    ? '${redirectUrl}/service/success?service=trello'
                                    : '${redirectUrl}/auth/success?token=' + data.token + '&provider=trello&refresh=' + data.refreshToken;
                                debug('Redirecting to: ' + redirectTarget);
                                setTimeout(function() {
                                    window.location.href = redirectTarget;
                                }, 1000);
                            } else {
                                statusEl.textContent = 'Error: ' + (data.error || 'Authentication failed');
                                statusEl.className = 'status error';
                                debug('Auth error: ' + (data.error || 'unknown'));
                                setTimeout(function() {
                                    window.location.href = '${redirectUrl}/auth/error?message=' + encodeURIComponent(data.error || 'Authentication failed');
                                }, 2000);
                            }
                        } catch (e) {
                            debug('JSON parse error: ' + e.message);
                            statusEl.textContent = 'Error parsing response';
                            statusEl.className = 'status error';
                        }
                    } else {
                        statusEl.textContent = 'Server error: ' + xhr.status;
                        statusEl.className = 'status error';
                        setTimeout(function() {
                            window.location.href = '${redirectUrl}/auth/error?message=' + encodeURIComponent('Server error');
                        }, 2000);
                    }
                };
                
                xhr.onerror = function() {
                    debug('XHR error event fired');
                    debug('XHR status: ' + xhr.status);
                    debug('XHR readyState: ' + xhr.readyState);
                    statusEl.textContent = 'Network error occurred';
                    statusEl.className = 'status error';
                    setTimeout(function() {
                        window.location.href = '${redirectUrl}/auth/error?message=' + encodeURIComponent('Network error');
                    }, 3000);
                };
                
                var payload = JSON.stringify({ 
                    token: token,
                    state: '${state || ''}'
                });
                debug('Sending payload: ' + payload.substring(0, 100));
                xhr.send(payload);
                
            } catch (err) {
                debug('Exception: ' + err.message);
                statusEl.textContent = 'Error: ' + err.message;
                statusEl.className = 'status error';
            }
        })();
    </script>
</body>
</html>`);
        } catch (error) {
            console.error('Trello OAuth callback error:'.red, error);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            res.redirect(`${redirectUrl}/auth/error?message=${encodeURIComponent('Authentication failed')}`);
        }
    };

    /**
     * Process Trello token (called from callback HTML page)
     * POST /api/auth/trello/process
     */
    public trelloProcess = async (req: Request, res: Response): Promise<void> => {
        try {
            const { token, state } = req.body;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (e) {
                    console.warn('Failed to parse state:', e);
                }
            }

            if (!token) {
                res.json({ success: false, error: 'Token missing' });
                return;
            }

            const isAlreadyAuthenticated = await this.authService.verifyJWT(stateData.token);
            if (isAlreadyAuthenticated) {
                const decoded = await this.authService.verifyToken(stateData.token as string);
                await this.authService.handleTrelloCallback(token, decoded.userId);
                res.json({ success: true, isAuthenticated: true });
            } else {
                const result = await this.authService.handleTrelloCallback(token);
                res.json({ 
                    success: true, 
                    isAuthenticated: false,
                    token: result.token, 
                    refreshToken: result.refreshToken 
                });
            }
        } catch (error) {
            console.error('Trello OAuth process error:'.red, error);
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
            res.json({ success: false, error: errorMessage });
        }
    };

    /**
     * Initiate Twitch OAuth
     * GET /api/auth/twitch
     */
    public twitchLogin = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.query.token as string | undefined;
            const isMobile = this.isMobileRequest(req);
            let state: string | undefined;

            if (token || isMobile) {
                const stateData = { token, isMobile };
                state = Buffer.from(JSON.stringify(stateData)).toString('base64');
            }
            const authUrl = this.authService.getTwitchAuthUrl(state);
            res.redirect(authUrl);
        } catch (error) {
            console.error('Twitch OAuth redirect error:'.red, error);
            if (error instanceof Error && error.message === 'TWITCH_OAUTH_NOT_CONFIGURED')
                res.status(500).json({ error: 'Twitch OAuth not configured' });
            else
                res.status(500).json({ error: 'Failed to initiate Twitch OAuth' });
        }
    };

    /**
     * Handle Twitch OAuth callback
     * GET /api/auth/twitch/callback
     */
    public twitchCallback = async (req: Request, res: Response): Promise<void> => {
        try {
            const { code, error, state } = req.query;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (e) {
                    console.warn('Failed to parse state:', e);
                }
            }
            const isMobile = stateData.isMobile || this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            if (error) {
                console.error('Twitch OAuth error:', error);
                res.redirect(`${redirectUrl}/auth/error?error=${error}`);
                return;
            }
            if (!code) {
                res.redirect(`${redirectUrl}/auth/error?message=${encodeURIComponent('Authorization code missing')}`);
                return;
            }
            const isAlreadyAuthenticated = await this.authService.verifyJWT(stateData.token);
            if (isAlreadyAuthenticated) {
                const decoded = await this.authService.verifyToken(stateData.token as string);
                await this.authService.handleTwitchCallback(code as string, decoded.userId);
                res.redirect(`${redirectUrl}/service/success?service=twitch`);
            } else {
                const result = await this.authService.handleTwitchCallback(code as string);
                res.redirect(`${redirectUrl}/auth/success?token=${result.token}&provider=twitch&refresh=${result.refreshToken}`);
            }
        } catch (error) {
            console.error('Twitch OAuth callback error:'.red, error);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            let errorMessage = 'Authentication failed';
            if (error instanceof Error) {
                switch (error.message) {
                    case 'INVALID_OAUTH_USER_DATA':
                        errorMessage = 'Invalid user data received from Twitch';
                        break;
                    case 'ACCOUNT_INACTIVE':
                        errorMessage = 'Account is inactive';
                        break;
                    case 'OAUTH_CALLBACK_FAILED':
                        errorMessage = 'Twitch authentication failed';
                        break;
                }
            }
            res.redirect(`${redirectUrl}/auth/error?message=${encodeURIComponent(errorMessage)}&provider=twitch`);
        }
    };

    /*                                   ^                                    */
    /*                                   |                                    */
    /* =============================   OAuth    ============================= */

    /**
     * Détecter si la requête provient d'un device mobile
     */
    private isMobileRequest(req: Request): boolean {
        const userAgent = req.headers['user-agent'] || '';
        const isMobileUA = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
        const mobileParam = req.query.mobile === 'true';

        return isMobileUA || mobileParam;
    }

    /**
     * Obtenir l'URL de redirection appropriée selon le type de client
     */
    private getRedirectUrl(isMobile: boolean): string {
        if (isMobile)
            return 'autoarea://oauth';
        else
            return process.env.FRONTEND_URL || 'http://localhost:3000';
    }
}
