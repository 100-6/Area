import { Request, Response } from 'express';
import { OAuthManager } from '../../shared/auth/OAuthManager';
import { JwtManager } from '../../shared/auth/JwtManager';
import 'colors';

/**
 * Notion OAuth Controller
 * Handles OAuth authorization and callback for Notion service integration
 */
export class NotionOAuthController {
    private oauthManager: OAuthManager;
    private jwtManager: JwtManager;

    constructor() {
        this.oauthManager = new OAuthManager();
        this.jwtManager = new JwtManager();
    }

    /**
     * Initiate Notion OAuth flow
     * GET /api/notion/connect?token=xxx&mobile=true
     */
    public authorize = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.query.token as string | undefined;
            const isMobile = this.isMobileRequest(req);
            let state: string | undefined;

            if (token || isMobile) {
                const stateData = { token, isMobile };
                state = Buffer.from(JSON.stringify(stateData)).toString('base64');
            }

            console.log(`[Notion] Initiating OAuth${isMobile ? ' (mobile)' : ''}`.cyan);
            const authUrl = await this.oauthManager.getNotionAuthUrl(state);

            console.log(`[Notion] Redirecting to: ${authUrl}`.gray);
            res.redirect(authUrl);
        } catch (error: any) {
            console.error(`[Notion] Authorization failed:`.red, error.message);
            res.status(500).json({
                success: false,
                error: 'AUTHORIZATION_FAILED',
                message: error.message
            });
        }
    };

    /**
     * Handle Notion OAuth callback
     * GET /api/notion/callback?code=xxx&state=xxx
     */
    public callback = async (req: Request, res: Response): Promise<void> => {
        console.log('[Notion OAuth Controller] 🎯 Callback route reached!'.bgGreen.white);
        console.log('[Notion OAuth Controller] Query params:', req.query);

        try {
            const { code, state, error } = req.query;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (e) {
                    console.warn('[Notion] Failed to parse state:', e);
                }
            }

            const isMobile = stateData.isMobile || this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);

            // User denied authorization
            if (error) {
                console.error(`[Notion] OAuth error:`.red, error);
                return res.redirect(`${redirectUrl}/services?error=${error}`);
            }

            if (!code) {
                console.error(`[Notion] Missing code`.red);
                return res.redirect(`${redirectUrl}/services?error=missing_code`);
            }

            if (!stateData.token) {
                return res.redirect(`${redirectUrl}/login?error=authentication_required`);
            }

            const decoded = this.jwtManager.verifyToken(stateData.token);
            if (!decoded || !decoded.userId) {
                return res.redirect(`${redirectUrl}/login?error=invalid_token`);
            }

            console.log(`[Notion] Processing callback for user ${decoded.userId}...`.cyan);
            await this.oauthManager.handleNotionCallback(
                code as string,
                decoded.userId
            );

            console.log(`[Notion] ✓ Connection successful`.green);
            res.redirect(`${redirectUrl}/services?success=notion`);
        } catch (error: any) {
            console.error(`[Notion] Callback failed:`.red, error.message);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            res.redirect(`${redirectUrl}/services?error=notion_auth_failed`);
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
