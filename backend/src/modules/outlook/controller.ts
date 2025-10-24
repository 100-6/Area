import { Request, Response, NextFunction } from 'express';
import { outlookModule } from './module';
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
 * Controller Outlook
 * Gère tous les endpoints liés à Outlook
 */
export class OutlookController {
    private oauthManager: OAuthManager;
    private jwtManager: JwtManager;

    constructor() {
        this.oauthManager = new OAuthManager();
        this.jwtManager = new JwtManager();
    }

    /**
     * GET /api/outlook/connect
     * Initie la connexion OAuth Outlook (requiert authentication via requireAuth middleware)
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
            const authUrl = this.oauthManager.getOutlookAuthUrl(state);
            res.redirect(authUrl);
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/outlook/callback
     * Gère le callback OAuth Outlook
     */
    public callback = async (req: Request, res: Response): Promise<void> => {
        try {
            const { code, error, state } = req.query;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (e) {
                    console.warn('[Outlook] Failed to parse state:', e);
                }
            }
            const isMobile = stateData.isMobile || this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            if (error) {
                console.error('[Outlook] OAuth error:', error);
                return res.redirect(`${redirectUrl}/services?error=${error}`);
            }
            if (!code)
                return res.redirect(`${redirectUrl}/services?error=missing_code`);
            if (!stateData.token)
                return res.redirect(`${redirectUrl}/login?error=authentication_required`);
            const decoded = this.jwtManager.verifyToken(stateData.token);
            if (!decoded || !decoded.userId)
                return res.redirect(`${redirectUrl}/login?error=invalid_token`);
            await this.oauthManager.handleOutlookCallback(code as string, decoded.userId);
            res.redirect(`${redirectUrl}/services?success=outlook`);
        } catch (error) {
            console.error('[Outlook] OAuth callback error:'.red, error);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            res.redirect(`${redirectUrl}/services?error=outlook_auth_failed`);
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
     * GET /api/outlook/folders
     * Retourne la liste des dossiers Outlook de l'utilisateur
     */
    public getFolders = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const folders = await outlookModule.getUserFolders(userId);

            res.json({ folders, count: folders.length });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/outlook/messages
     * Retourne la liste des messages Outlook de l'utilisateur
     */
    public getMessages = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { from, subject, hasAttachment, folderName, maxResults } = req.query;
            const filters: any = { maxResults: maxResults ? parseInt(maxResults as string) : 10 };

            if (from)
                filters.from = from as string;
            if (subject)
                filters.subject = subject as string;
            if (hasAttachment === 'true')
                filters.hasAttachment = true;
            if (folderName)
                filters.folderName = folderName as string;
            const messages = await outlookModule.getUserMessages(userId, filters);
            res.json({ messages, count: messages.length });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/outlook/messages/:messageId
     * Retourne un message spécifique
     */
    public getMessage = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { messageId } = req.params;
            const message = await outlookModule.getMessage(userId, messageId);

            res.json({ message });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/outlook/calendar/events
     * Retourne la liste des événements de calendrier
     */
    public getCalendarEvents = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { calendarId, maxResults } = req.query;
            const filters: any = { maxResults: maxResults ? parseInt(maxResults as string) : 10 };

            if (calendarId)
                filters.calendarId = calendarId as string;
            const events = await outlookModule.getUserCalendarEvents(userId, filters);
            res.json({ events, count: events.length });
        } catch (error) {
            next(error);
        }
    });

    /**
     * POST /api/outlook/send
     * Envoie un email
     */
    public sendEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { to, subject, body, contentType, cc, bcc } = req.body;

            if (!to || !subject || !body) {
                const error = new Error('Missing required fields: to, subject, body') as CustomError;
                error.statusCode = 400;
                return next(error);
            }
            const outlookService = outlookModule.getOutlookService();
            const outlookAuth = await UserAuthProvider.findByUserAndProvider(userId, 'outlook');
            if (!outlookAuth || !outlookAuth.access_token) {
                const error = new Error('Outlook not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }
            const result = await outlookService.sendEmail(outlookAuth.access_token, to, subject, body, { contentType, cc, bcc, refreshToken: outlookAuth.refresh_token });
            res.json({ success: true, message: 'Email sent successfully', data: result });
        } catch (error) {
            next(error);
        }
    });

    /**
     * POST /api/outlook/calendar/events
     * Crée un événement de calendrier
     */
    public createCalendarEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { subject, start, end, location, body, attendees } = req.body;

            if (!subject || !start || !end) {
                const error = new Error('Missing required fields: subject, start, end') as CustomError;
                error.statusCode = 400;
                return next(error);
            }
            const outlookService = outlookModule.getOutlookService();
            const outlookAuth = await UserAuthProvider.findByUserAndProvider(userId, 'outlook');
            if (!outlookAuth || !outlookAuth.access_token) {
                const error = new Error('Outlook not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }
            const result = await outlookService.createCalendarEvent(outlookAuth.access_token, subject, start, end, { location, body, attendees, refreshToken: outlookAuth.refresh_token });
            res.json({ success: true, message: 'Calendar event created successfully', data: result });
        } catch (error) {
            next(error);
        }
    });
}

export default OutlookController;
