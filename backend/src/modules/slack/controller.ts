import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../core/middleware/error';
import { OAuthManager } from '../../shared/auth/OAuthManager';
import { JwtManager } from '../../shared/auth/JwtManager';
import { SlackApiService } from './service';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';
import 'colors';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Controller Slack
 * Gère tous les endpoints liés à Slack
 */
export class SlackController {
    private oauthManager: OAuthManager;
    private jwtManager: JwtManager;

    constructor() {
        this.oauthManager = new OAuthManager();
        this.jwtManager = new JwtManager();
    }

    /**
     * GET /api/slack/connect
     * Initie la connexion OAuth Slack (requiert authentication via requireAuth middleware)
     */
    public connect = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const token = req.query.token as string | undefined;
            const isMobile = this.isMobileRequest(req);
            let state: string | undefined;

            if (token || isMobile) {
                const stateData = { token, isMobile };
                state = Buffer.from(JSON.stringify(stateData)).toString('base64');
            }
            const authUrl = this.oauthManager.getSlackAuthUrl(state);
            res.redirect(authUrl);
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/slack/callback
     * Gère le callback OAuth Slack
     */
    public callback = async (req: Request, res: Response): Promise<void> => {
        try {
            const { code, error, state } = req.query;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (e) {
                    console.warn('[Slack] Failed to parse state:', e);
                }
            }
            const isMobile = stateData.isMobile || this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            if (error) {
                console.error('[Slack] OAuth error:', error);
                return res.redirect(`${redirectUrl}/services?error=${error}`);
            }
            if (!code)
                return res.redirect(`${redirectUrl}/services?error=missing_code`);
            if (!stateData.token)
                return res.redirect(`${redirectUrl}/login?error=authentication_required`);
            const decoded = this.jwtManager.verifyToken(stateData.token);
            if (!decoded || !decoded.userId)
                return res.redirect(`${redirectUrl}/login?error=invalid_token`);
            await this.oauthManager.handleSlackCallback(code as string, decoded.userId);
            res.redirect(`${redirectUrl}/services?success=slack`);
        } catch (error) {
            console.error('[Slack] OAuth callback error:'.red, error);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            res.redirect(`${redirectUrl}/services?error=slack_auth_failed`);
        }
    };

    /**
     * GET /api/slack/channels
     * Récupère la liste des canaux Slack disponibles pour l'utilisateur
     */
    public getChannels = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const slackConnection = await UserAuthProvider.findByUserAndProvider(userId, 'slack');
            if (!slackConnection || !slackConnection.access_token) {
                res.status(404).json({ error: 'Slack not connected' });
                return;
            }
            const accessToken = slackConnection.access_token;
            const channels = await SlackApiService.getChannelsList(accessToken, 'public_channel,private_channel');
            res.json({
                success: true,
                channels: channels.map(ch => ({
                    id: ch.id,
                    name: ch.name,
                    isPrivate: ch.is_private,
                    isMember: ch.is_member,
                    topic: ch.topic?.value || '',
                    numMembers: ch.num_members
                }))
            });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/slack/users
     * Récupère la liste des utilisateurs Slack du workspace
     */
    public getUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const slackConnection = await UserAuthProvider.findByUserAndProvider(userId, 'slack');
            if (!slackConnection || !slackConnection.access_token) {
                res.status(404).json({ error: 'Slack not connected' });
                return;
            }
            const accessToken = slackConnection.access_token;
            const users = await SlackApiService.getUsersList(accessToken);
            res.json({
                success: true,
                users: users
                    .filter(u => !u.is_bot)
                    .map(u => ({
                        id: u.id,
                        name: u.name,
                        realName: u.real_name,
                        email: u.profile?.email
                    }))
            });
        } catch (error) {
            next(error);
        }
    });

    /**
     * Détecte si la requête provient d'un appareil mobile
     */
    private isMobileRequest(req: Request): boolean {
        const userAgent = req.headers['user-agent'] || '';
        const isMobileUA = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
        const mobileParam = req.query.mobile === 'true';
        return isMobileUA || mobileParam;
    }

    /**
     * Retourne l'URL de redirection en fonction du type d'appareil
     */
    private getRedirectUrl(isMobile: boolean): string {
        if (isMobile)
            return 'autoarea://oauth';
        else
            return process.env.FRONTEND_URL || 'http://localhost:3000';
    }
}
