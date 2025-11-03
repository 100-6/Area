import { Request, Response } from 'express';
import { OAuthManager } from '../../shared/auth/OAuthManager';
import { JwtManager } from '../../shared/auth/JwtManager';
import 'colors';

/**
 * Trello OAuth Controller
 * Handles OAuth authorization and callback for Trello service integration
 */
export class TrelloOAuthController {
    private oauthManager: OAuthManager;
    private jwtManager: JwtManager;

    constructor() {
        this.oauthManager = new OAuthManager();
        this.jwtManager = new JwtManager();
    }

    /**
     * Initiate Trello OAuth flow
     * GET /api/trello/connect?token=xxx&mobile=true
     */
    public authorize = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.query.token as string | undefined;
            const isMobile = this.isMobileRequest(req);

            if (!token) {
                res.status(400).json({
                    success: false,
                    error: 'TOKEN_REQUIRED',
                    message: 'token query parameter is required'
                });
                return;
            }
            const decoded = this.jwtManager.verifyToken(token);
            if (!decoded || !decoded.userId) {
                res.status(401).json({
                    success: false,
                    error: 'INVALID_TOKEN',
                    message: 'Invalid or expired token'
                });
                return;
            }
            console.log(`[Trello] Initiating OAuth for user ${decoded.userId}${isMobile ? ' (mobile)' : ''}`.cyan);
            const stateData = { userId: decoded.userId, isMobile };
            const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
            const authUrl = await this.oauthManager.getTrelloAuthUrl(state);
            console.log(`[Trello] Redirecting to: ${authUrl}`.gray);
            res.redirect(authUrl);
        } catch (error: any) {
            console.error(`[Trello] Authorization failed:`.red, error.message);
            res.status(500).json({
                success: false,
                error: 'AUTHORIZATION_FAILED',
                message: error.message
            });
        }
    };

    /**
     * Handle Trello OAuth callback
     * GET /api/trello/callback?state=xxx
     * Trello uses response_type=token which returns the token in the URL fragment (#token=xxx)
     * The fragment is only accessible client-side, so we serve an HTML page to extract it
     */
    public callback = async (req: Request, res: Response): Promise<void> => {
        console.log('[Trello OAuth Controller] 🎯 Callback route reached!'.bgGreen.white);
        console.log('[Trello OAuth Controller] Query params:', req.query);

        try {
            const { state } = req.query;
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);

            if (!state) {
                console.error(`[Trello] Missing state parameter`.red);
                return res.redirect(`${redirectUrl}/services?error=missing_state`);
            }
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https: http:;");
            const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Trello Authentication</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            text-align: center;
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Connecting to Trello...</h2>
        <div class="spinner"></div>
        <p id="status">Please wait while we complete the authentication.</p>
    </div>
    <script>
        (function() {
            const statusEl = document.getElementById('status');

            // Extract token from URL fragment
            const fragment = window.location.hash.substring(1);
            const params = new URLSearchParams(fragment);
            const token = params.get('token');

            if (!token) {
                statusEl.textContent = 'Error: No token received from Trello';
                setTimeout(() => {
                    window.location.href = '${redirectUrl}/services?error=no_token';
                }, 2000);
                return;
            }

            console.log('[Trello] Token received, processing...');

            // Send token to backend for processing
            fetch('/api/trello/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token,
                    state: '${state}'
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    statusEl.textContent = 'Success! Redirecting...';
                    window.location.href = '${redirectUrl}/services?success=trello';
                } else {
                    statusEl.textContent = 'Error: ' + (data.message || 'Authentication failed');
                    setTimeout(() => {
                        window.location.href = '${redirectUrl}/services?error=' + encodeURIComponent(data.error || 'auth_failed');
                    }, 2000);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                statusEl.textContent = 'Network error occurred';
                setTimeout(() => {
                    window.location.href = '${redirectUrl}/services?error=network_error';
                }, 2000);
            });
        })();
    </script>
</body>
</html>
            `;

            res.send(html);
        } catch (error: any) {
            console.error(`[Trello] Callback failed:`.red, error.message);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            res.redirect(`${redirectUrl}/services?error=trello_auth_failed`);
        }
    };

    /**
     * Process the Trello token received from the callback HTML page
     * POST /api/trello/process
     */
    public process = async (req: Request, res: Response): Promise<void> => {
        console.log('[Trello OAuth Controller] 🔄 Processing token...'.bgBlue.white);
        console.log('[Trello OAuth Controller] Request body:', req.body);

        try {
            const { token, state } = req.body;

            if (!token) {
                console.error(`[Trello] Missing token in request body`.red);
                res.status(400).json({
                    success: false,
                    error: 'MISSING_TOKEN',
                    message: 'Token is required'
                });
                return;
            }
            if (!state) {
                console.error(`[Trello] Missing state in request body`.red);
                res.status(400).json({
                    success: false,
                    error: 'MISSING_STATE',
                    message: 'State is required'
                });
                return;
            }
            let stateData;
            try {
                stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
            } catch (error) {
                console.error(`[Trello] Failed to decode state:`.red, error);
                res.status(400).json({
                    success: false,
                    error: 'INVALID_STATE',
                    message: 'Invalid state parameter'
                });
                return;
            }
            const { userId } = stateData;
            if (!userId) {
                console.error(`[Trello] Missing userId in state`.red);
                res.status(400).json({
                    success: false,
                    error: 'INVALID_STATE',
                    message: 'User ID not found in state'
                });
                return;
            }
            console.log(`[Trello] Processing token for user ${userId}`.cyan);
            await this.oauthManager.handleTrelloCallback(token, userId);
            console.log(`[Trello] ✓ Connection successful for user ${userId}`.green);
            res.json({
                success: true,
                message: 'Trello connected successfully'
            });
        } catch (error: any) {
            console.error(`[Trello] Process failed:`.red, error.message);
            res.status(500).json({
                success: false,
                error: 'PROCESS_FAILED',
                message: error.message
            });
        }
    };

    private isMobileRequest(req: Request): boolean {
        const userAgent = req.headers['user-agent'] || '';
        const isMobileUA = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
        const mobileParam = req.query.mobile === 'true';
        return isMobileUA || mobileParam;
    }

    private getRedirectUrl(isMobile: boolean): string {
        if (isMobile)
            return 'autoarea://oauth';
        else
            return process.env.FRONTEND_URL || 'http://localhost:3000';
    }
}
