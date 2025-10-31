import { Request, Response, NextFunction } from 'express';
import { stravaModule } from './service';
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
 * Controller Strava
 * Gère tous les endpoints liés à Strava
 */
export class StravaController {
    private oauthManager: OAuthManager;
    private jwtManager: JwtManager;

    constructor() {
        this.oauthManager = new OAuthManager();
        this.jwtManager = new JwtManager();
    }

    /**
     * GET /api/strava/connect
     * Initie la connexion OAuth Strava
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
            const authUrl = this.oauthManager.getStravaAuthUrl(state);
            res.redirect(authUrl);
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/strava/callback
     * Gère le callback OAuth Strava
     */
    public callback = async (req: Request, res: Response): Promise<void> => {
        try {
            const { code, error, state, scope } = req.query;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (e) {
                    console.warn('[Strava] Failed to parse state:', e);
                }
            }
            const isMobile = stateData.isMobile || this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            
            if (error) {
                console.error('[Strava] OAuth error:', error);
                return res.redirect(`${redirectUrl}/services?error=${error}`);
            }
            if (!code)
                return res.redirect(`${redirectUrl}/services?error=missing_code`);
            if (!stateData.token)
                return res.redirect(`${redirectUrl}/login?error=authentication_required`);
            
            const decoded = this.jwtManager.verifyToken(stateData.token);
            if (!decoded || !decoded.userId)
                return res.redirect(`${redirectUrl}/login?error=invalid_token`);
            
            await this.oauthManager.handleStravaCallback(code as string, decoded.userId, scope as string);
            res.redirect(`${redirectUrl}/services?success=strava`);
        } catch (error) {
            console.error('[Strava] OAuth callback error:'.red, error);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            res.redirect(`${redirectUrl}/services?error=strava_auth_failed`);
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
     * GET /api/strava/athlete
     * Retourne le profil de l'athlète Strava
     */
    public getAthlete = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const stravaAuth = await UserAuthProvider.findByUserAndProvider(userId, 'strava');

            if (!stravaAuth || !stravaAuth.access_token) {
                const error = new Error('Strava not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = stravaModule.getApiService();
            const athlete = await apiService.getAthlete(stravaAuth.access_token);

            res.json({ athlete });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/strava/activities
     * Retourne les activités de l'athlète
     */
    public getActivities = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const perPage = req.query.perPage ? parseInt(req.query.perPage as string) : 30;
            const before = req.query.before ? parseInt(req.query.before as string) : undefined;
            const after = req.query.after ? parseInt(req.query.after as string) : undefined;
            
            const stravaAuth = await UserAuthProvider.findByUserAndProvider(userId, 'strava');

            if (!stravaAuth || !stravaAuth.access_token) {
                const error = new Error('Strava not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = stravaModule.getApiService();
            const activities = await apiService.getActivities(
                stravaAuth.access_token,
                page,
                perPage,
                before,
                after
            );

            res.json({ activities, count: activities.length });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/strava/activities/:id
     * Retourne une activité spécifique
     */
    public getActivity = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const activityId = parseInt(req.params.id);
            
            if (isNaN(activityId)) {
                const error = new Error('Invalid activity ID') as CustomError;
                error.statusCode = 400;
                return next(error);
            }

            const stravaAuth = await UserAuthProvider.findByUserAndProvider(userId, 'strava');

            if (!stravaAuth || !stravaAuth.access_token) {
                const error = new Error('Strava not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = stravaModule.getApiService();
            const activity = await apiService.getActivity(stravaAuth.access_token, activityId);

            res.json({ activity });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/strava/athlete/:id/stats
     * Retourne les statistiques de l'athlète
     */
    public getAthleteStats = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const athleteId = parseInt(req.params.id);
            
            if (isNaN(athleteId)) {
                const error = new Error('Invalid athlete ID') as CustomError;
                error.statusCode = 400;
                return next(error);
            }

            const stravaAuth = await UserAuthProvider.findByUserAndProvider(userId, 'strava');

            if (!stravaAuth || !stravaAuth.access_token) {
                const error = new Error('Strava not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = stravaModule.getApiService();
            const stats = await apiService.getAthleteStats(stravaAuth.access_token, athleteId);

            res.json({ stats });
        } catch (error) {
            next(error);
        }
    });

    /**
     * POST /api/strava/activities/:id/kudos
     * Donne des kudos à une activité
     */
    public giveKudos = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const activityId = parseInt(req.params.id);
            
            if (isNaN(activityId)) {
                const error = new Error('Invalid activity ID') as CustomError;
                error.statusCode = 400;
                return next(error);
            }

            const stravaAuth = await UserAuthProvider.findByUserAndProvider(userId, 'strava');

            if (!stravaAuth || !stravaAuth.access_token) {
                const error = new Error('Strava not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = stravaModule.getApiService();
            await apiService.giveKudos(stravaAuth.access_token, activityId);

            res.json({ success: true, message: 'Kudos given' });
        } catch (error) {
            next(error);
        }
    });

    /**
     * POST /api/strava/activities/:id/comments
     * Crée un commentaire sur une activité
     */
    public createComment = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const activityId = parseInt(req.params.id);
            const { text } = req.body;
            
            if (isNaN(activityId)) {
                const error = new Error('Invalid activity ID') as CustomError;
                error.statusCode = 400;
                return next(error);
            }

            if (!text || typeof text !== 'string' || text.trim() === '') {
                const error = new Error('Comment text is required') as CustomError;
                error.statusCode = 400;
                return next(error);
            }

            const stravaAuth = await UserAuthProvider.findByUserAndProvider(userId, 'strava');

            if (!stravaAuth || !stravaAuth.access_token) {
                const error = new Error('Strava not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = stravaModule.getApiService();
            await apiService.createComment(stravaAuth.access_token, activityId, text);

            res.json({ success: true, message: 'Comment created' });
        } catch (error) {
            next(error);
        }
    });
}

export default StravaController;
