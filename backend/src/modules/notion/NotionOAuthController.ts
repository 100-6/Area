import { Request, Response } from 'express';
import { OAuthManager } from '../../shared/auth/OAuthManager';
import 'colors';

/**
 * Notion OAuth Controller
 * Handles OAuth authorization and callback for Notion service integration
 */
export class NotionOAuthController {
    private oauthManager: OAuthManager;

    constructor() {
        this.oauthManager = new OAuthManager();
    }

    /**
     * Initiate Notion OAuth flow
     * GET /api/notion/authorize?userId=xxx
     */
    public authorize = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.query;

            if (!userId || typeof userId !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'USER_ID_REQUIRED',
                    message: 'userId query parameter is required'
                });
                return;
            }

            console.log(`[Notion] Initiating OAuth for user ${userId}`.cyan);
            const authUrl = await this.oauthManager.getNotionAuthUrl(userId);
            
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
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

            // User denied authorization
            if (error) {
                console.error(`[Notion] OAuth error:`.red, error);
                res.redirect(`${frontendUrl}/integrations?service=notion&status=error&message=${error}`);
                return;
            }

            if (!code || !state) {
                console.error(`[Notion] Missing code or state`.red);
                res.status(400).json({
                    success: false,
                    error: 'INVALID_CALLBACK',
                    message: 'Missing code or state parameter'
                });
                return;
            }

            console.log(`[Notion] Processing callback...`.cyan);
            await this.oauthManager.handleNotionCallback(
                code as string,
                state as string
            );

            console.log(`[Notion] ✓ Connection successful`.green);
            res.redirect(`${frontendUrl}/integrations?service=notion&status=success`);
        } catch (error: any) {
            console.error(`[Notion] Callback failed:`.red, error.message);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${frontendUrl}/integrations?service=notion&status=error&message=${encodeURIComponent(error.message)}`);
        }
    };
}
