import { Request, Response } from 'express';
import { OAuthManager } from '../../shared/auth/OAuthManager';
import 'colors';

/**
 * Trello OAuth Controller
 * Handles OAuth authorization and callback for Trello service integration
 */
export class TrelloOAuthController {
    private oauthManager: OAuthManager;

    constructor() {
        this.oauthManager = new OAuthManager();
    }

    /**
     * Initiate Trello OAuth flow
     * GET /api/trello/authorize?userId=xxx
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

            console.log(`[Trello] Initiating OAuth for user ${userId}`.cyan);
            const authUrl = await this.oauthManager.getTrelloAuthUrl(userId);
            
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
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

            // User denied authorization
            if (error) {
                console.error(`[Trello] OAuth error:`.red, error);
                res.redirect(`${frontendUrl}/integrations?service=trello&status=error&message=${error}`);
                return;
            }

            if (!oauth_token || !oauth_verifier) {
                console.error(`[Trello] Missing oauth_token or oauth_verifier`.red);
                res.status(400).json({
                    success: false,
                    error: 'INVALID_CALLBACK',
                    message: 'Missing oauth_token or oauth_verifier parameter'
                });
                return;
            }

            console.log(`[Trello] Processing callback...`.cyan);
            await this.oauthManager.handleTrelloCallback(
                oauth_token as string,
                oauth_verifier as string
            );

            console.log(`[Trello] ✓ Connection successful`.green);
            res.redirect(`${frontendUrl}/integrations?service=trello&status=success`);
        } catch (error: any) {
            console.error(`[Trello] Callback failed:`.red, error.message);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${frontendUrl}/integrations?service=trello&status=error&message=${encodeURIComponent(error.message)}`);
        }
    };
}
