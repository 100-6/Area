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
     * GET /api/trello/callback?oauth_token=xxx&oauth_verifier=xxx
     */
    public callback = async (req: Request, res: Response): Promise<void> => {
        console.log('[Trello OAuth Controller] 🎯 Callback route reached!'.bgGreen.white);
        console.log('[Trello OAuth Controller] Query params:', req.query);

        try {
            const { oauth_token, oauth_verifier, error } = req.query;
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);

            if (error) {
                console.error(`[Trello] OAuth error:`.red, error);
                return res.redirect(`${redirectUrl}/services?error=${error}`);
            }
            if (!oauth_token || !oauth_verifier) {
                console.error(`[Trello] Missing oauth_token or oauth_verifier`.red);
                return res.redirect(`${redirectUrl}/services?error=missing_params`);
            }
            console.log(`[Trello] Processing callback...`.cyan);
            await this.oauthManager.handleTrelloCallback(
                oauth_token as string,
                oauth_verifier as string
            );
            console.log(`[Trello] ✓ Connection successful`.green);
            res.redirect(`${redirectUrl}/services?success=trello`);
        } catch (error: any) {
            console.error(`[Trello] Callback failed:`.red, error.message);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            res.redirect(`${redirectUrl}/services?error=trello_auth_failed`);
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
