import { Request, Response, NextFunction } from 'express';
import { gmailModule } from './module';
import { asyncHandler } from '../../core/middleware/error';
import { OAuthManager } from '../../shared/auth/OAuthManager';
import { JwtManager } from '../../shared/auth/JwtManager';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';
import 'colors';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Controller Gmail
 * Gère tous les endpoints liés à Gmail
 */
export class GmailController {
    private oauthManager: OAuthManager;
    private jwtManager: JwtManager;

    constructor() {
        this.oauthManager = new OAuthManager();
        this.jwtManager = new JwtManager();
    }

    /**
     * GET /api/gmail/connect
     * Initie la connexion OAuth Gmail (requiert authentication via requireAuth middleware)
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
            const authUrl = this.oauthManager.getGmailAuthUrl(state);
            res.redirect(authUrl);
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/gmail/callback
     * Gère le callback OAuth Gmail
     */
    public callback = async (req: Request, res: Response): Promise<void> => {
        try {
            const { code, error, state } = req.query;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (e) {
                    console.warn('[Gmail] Failed to parse state:', e);
                }
            }
            const isMobile = stateData.isMobile || this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            if (error) {
                console.error('[Gmail] OAuth error:', error);
                return res.redirect(`${redirectUrl}/services?error=${error}`);
            }
            if (!code)
                return res.redirect(`${redirectUrl}/services?error=missing_code`);
            if (!stateData.token)
                return res.redirect(`${redirectUrl}/login?error=authentication_required`);
            const decoded = this.jwtManager.verifyToken(stateData.token);
            if (!decoded || !decoded.userId)
                return res.redirect(`${redirectUrl}/login?error=invalid_token`);
            await this.oauthManager.handleGmailCallback(code as string, decoded.userId);
            res.redirect(`${redirectUrl}/services?success=gmail`);
        } catch (error) {
            console.error('[Gmail] OAuth callback error:'.red, error);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            res.redirect(`${redirectUrl}/services?error=gmail_auth_failed`);
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

    /**
     * GET /api/gmail/labels
     * Retourne la liste des labels Gmail de l'utilisateur
     */
    public getLabels = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const labels = await gmailModule.getUserLabels(userId);

            res.json({labels, count: labels.length});
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/gmail/messages
     * Retourne la liste des messages Gmail de l'utilisateur
     */
    public getMessages = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { from, subject, hasAttachment, labelIds, maxResults } = req.query;
            const filters: any = {maxResults: maxResults ? parseInt(maxResults as string) : 10};

            if (from)
                filters.from = from as string;
            if (subject)
                filters.subject = subject as string;
            if (hasAttachment === 'true')
                filters.hasAttachment = true;
            if (labelIds)
                filters.labelIds = (labelIds as string).split(',');
            const messages = await gmailModule.getUserMessages(userId, filters);
            res.json({messages, count: messages.length});
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/gmail/messages/:messageId
     * Retourne un message spécifique
     */
    public getMessage = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { messageId } = req.params;
            const message = await gmailModule.getMessage(userId, messageId);

            res.json({ message });
        } catch (error) {
            next(error);
        }
    });

    /**
     * POST /api/gmail/send
     * Envoie un email
     */
    public sendEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { to, subject, body, cc, bcc, inReplyTo } = req.body;

            if (!to || !subject || !body) {
                const error = new Error('Missing required fields: to, subject, body') as CustomError;
                error.statusCode = 400;
                return next(error);
            }
            const gmailService = gmailModule.getGmailService();
            const gmailAuth = await UserAuthProvider.findByUserAndProvider(userId, 'gmail');
            if (!gmailAuth || !gmailAuth.access_token) {
                const error = new Error('Gmail not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }
            const result = await gmailService.sendEmail(gmailAuth.access_token, to, subject, body, { cc, bcc, inReplyTo, refreshToken: gmailAuth.refresh_token });
            res.json({success: true, message: 'Email sent successfully', data: result});
        } catch (error) {
            next(error);
        }
    });

    /**
     * POST /api/gmail/messages/:messageId/label
     * Ajoute un label à un message
     */
    public addLabel = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { messageId } = req.params;
            const { labelId } = req.body;

            if (!labelId) {
                const error = new Error('Missing required field: labelId') as CustomError;
                error.statusCode = 400;
                return next(error);
            }
            const gmailService = gmailModule.getGmailService();
            const gmailAuth = await UserAuthProvider.findByUserAndProvider(userId, 'gmail');
            if (!gmailAuth || !gmailAuth.access_token) {
                const error = new Error('Gmail not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }
            const result = await gmailService.addLabel(gmailAuth.access_token, messageId, labelId, gmailAuth.refresh_token);
            res.json({success: true, message: 'Label added successfully', data: result});
        } catch (error) {
            next(error);
        }
    });

    /**
     * POST /api/gmail/messages/:messageId/read
     * Marque un message comme lu
     */
    public markAsRead = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { messageId } = req.params;
            const gmailService = gmailModule.getGmailService();
            const gmailAuth = await UserAuthProvider.findByUserAndProvider(userId, 'gmail');

            if (!gmailAuth || !gmailAuth.access_token) {
                const error = new Error('Gmail not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }
            const result = await gmailService.markAsRead(gmailAuth.access_token, messageId, gmailAuth.refresh_token);
            res.json({success: true, message: 'Message marked as read',data: result});
        } catch (error) {
            next(error);
        }
    });

    /**
     * DELETE /api/gmail/messages/:messageId
     * Déplace un message vers la corbeille
     */
    public moveToTrash = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { messageId } = req.params;
            const gmailService = gmailModule.getGmailService();
            const gmailAuth = await UserAuthProvider.findByUserAndProvider(userId, 'gmail');

            if (!gmailAuth || !gmailAuth.access_token) {
                const error = new Error('Gmail not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }
            const result = await gmailService.moveToTrash(gmailAuth.access_token, messageId, gmailAuth.refresh_token);
            res.json({success: true, message: 'Message moved to trash', data: result});
        } catch (error) {
            next(error);
        }
    });
}

export default GmailController;
