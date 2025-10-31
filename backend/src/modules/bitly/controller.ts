import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../core/middleware/error';
import { OAuthManager } from '../../shared/auth/OAuthManager';
import { JwtManager } from '../../shared/auth/JwtManager';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';
import { bitlyModule } from './service';
import type { CreateBitlinkPayload } from './BitlyApiService';
import 'colors';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

export class BitlyController {
    private oauthManager: OAuthManager;
    private jwtManager: JwtManager;

    constructor() {
        this.oauthManager = new OAuthManager();
        this.jwtManager = new JwtManager();
    }

    /**
     * GET /api/bitly/connect
     * Initiates OAuth2 flow with Bitly
     */
    public connect = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const token = req.query.token as string | undefined;
        const isMobile = this.isMobileRequest(req);
        let state: string | undefined;

        if (token || isMobile) {
            const stateData = { token, isMobile };
            state = Buffer.from(JSON.stringify(stateData)).toString('base64');
        }

        const authUrl = this.oauthManager.getBitlyAuthUrl(state);
        res.redirect(authUrl);
    });

    /**
     * GET /api/bitly/callback
     * Handles OAuth2 callback from Bitly
     */
    public callback = async (req: Request, res: Response): Promise<void> => {
        try {
            const { code, error, state } = req.query;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (parseError) {
                    console.warn('[Bitly] Failed to parse state payload'.yellow, parseError);
                }
            }

            const isMobile = stateData.isMobile || this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);

            if (error) {
                console.error('[Bitly] OAuth error:', error);
                return res.redirect(`${redirectUrl}/services?error=${error}`);
            }

            if (!code) {
                return res.redirect(`${redirectUrl}/services?error=missing_code`);
            }

            if (!stateData.token) {
                return res.redirect(`${redirectUrl}/login?error=authentication_required`);
            }

            let decoded;
            try {
                decoded = this.jwtManager.verifyToken(stateData.token);
            } catch (verifyError) {
                console.error('[Bitly] Failed to verify state token'.red, verifyError);
                return res.redirect(`${redirectUrl}/login?error=invalid_token`);
            }

            if (!decoded || !decoded.userId) {
                return res.redirect(`${redirectUrl}/login?error=invalid_token`);
            }

            await this.oauthManager.handleBitlyCallback(code as string, decoded.userId);

            res.redirect(`${redirectUrl}/services?success=bitly`);
        } catch (callbackError) {
            console.error('[Bitly] OAuth callback error:'.red, callbackError);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            res.redirect(`${redirectUrl}/services?error=bitly_auth_failed`);
        }
    };

    /**
     * GET /api/bitly/me
     * Returns Bitly user profile
     */
    public getCurrentUser = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                const error = new Error('User not authenticated') as CustomError;
                error.statusCode = 401;
                error.code = 'UNAUTHORIZED';
                return next(error);
            }

            const bitlyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'bitly');
            if (!bitlyAuth || !bitlyAuth.access_token) {
                const error = new Error('Bitly account not connected') as CustomError;
                error.statusCode = 403;
                error.code = 'BITLY_NOT_CONNECTED';
                return next(error);
            }

            const apiService = bitlyModule.getApiService();
            const profile = await apiService.getCurrentUser(bitlyAuth.access_token);

            res.json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/bitly/groups
     * Returns groups accessible by the user
     */
    public getGroups = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                const error = new Error('User not authenticated') as CustomError;
                error.statusCode = 401;
                error.code = 'UNAUTHORIZED';
                return next(error);
            }

            const bitlyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'bitly');
            if (!bitlyAuth || !bitlyAuth.access_token) {
                const error = new Error('Bitly account not connected') as CustomError;
                error.statusCode = 403;
                error.code = 'BITLY_NOT_CONNECTED';
                return next(error);
            }

            const apiService = bitlyModule.getApiService();
            const groups = await apiService.getGroups(bitlyAuth.access_token);

            res.json({ success: true, data: groups });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/bitly/bitlinks
     * Returns recently created bitlinks for a group (default group if not provided)
     * Query params:
     *  - groupGuid?: string
     *  - size?: number (default 20)
     */
    public getBitlinks = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                const error = new Error('User not authenticated') as CustomError;
                error.statusCode = 401;
                error.code = 'UNAUTHORIZED';
                return next(error);
            }

            const bitlyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'bitly');
            if (!bitlyAuth || !bitlyAuth.access_token) {
                const error = new Error('Bitly account not connected') as CustomError;
                error.statusCode = 403;
                error.code = 'BITLY_NOT_CONNECTED';
                return next(error);
            }

            const apiService = bitlyModule.getApiService();
            const size = req.query.size ? Math.min(Number(req.query.size), 100) : 20;
            let groupGuid = req.query.groupGuid as string | undefined;

            if (!groupGuid) {
                groupGuid = await apiService.getDefaultGroupGuid(bitlyAuth.access_token) || undefined;
            }

            if (!groupGuid) {
                const error = new Error('No Bitly group found for this user') as CustomError;
                error.statusCode = 404;
                error.code = 'BITLY_GROUP_NOT_FOUND';
                return next(error);
            }

            const bitlinks = await apiService.getGroupBitlinks(bitlyAuth.access_token, groupGuid, size);

            res.json({ success: true, groupGuid, count: bitlinks.length, data: bitlinks });
        } catch (error) {
            next(error);
        }
    });

    /**
     * POST /api/bitly/bitlinks
     * Creates a new bitlink
     */
    public createBitlink = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                const error = new Error('User not authenticated') as CustomError;
                error.statusCode = 401;
                error.code = 'UNAUTHORIZED';
                return next(error);
            }

            const { longUrl, domain, groupGuid, title, tags } = req.body;

            if (!longUrl || typeof longUrl !== 'string') {
                const error = new Error('longUrl is required') as CustomError;
                error.statusCode = 400;
                error.code = 'BITLY_INVALID_PAYLOAD';
                return next(error);
            }

            const bitlyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'bitly');
            if (!bitlyAuth || !bitlyAuth.access_token) {
                const error = new Error('Bitly account not connected') as CustomError;
                error.statusCode = 403;
                error.code = 'BITLY_NOT_CONNECTED';
                return next(error);
            }

            const apiService = bitlyModule.getApiService();
            let resolvedGroupGuid = groupGuid;

            if (!resolvedGroupGuid) {
                resolvedGroupGuid = await apiService.getDefaultGroupGuid(bitlyAuth.access_token) || undefined;
            }

            const payload: CreateBitlinkPayload = {
                long_url: longUrl,
                domain,
                group_guid: resolvedGroupGuid,
                title,
                tags
            };

            const newBitlink = await apiService.createBitlink(bitlyAuth.access_token, payload);

            res.status(201).json({ success: true, data: newBitlink });
        } catch (error) {
            next(error);
        }
    });

    private isMobileRequest(req: Request): boolean {
        const userAgent = req.headers['user-agent'] || '';
        const isMobileUA = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
        const mobileParam = req.query.mobile === 'true';
        return isMobileUA || mobileParam;
    }

    private getRedirectUrl(isMobile: boolean): string {
        if (isMobile) {
            return 'autoarea://oauth';
        }
        return process.env.FRONTEND_URL || 'http://localhost:3000';
    }
}
