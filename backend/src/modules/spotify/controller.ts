import { Request, Response, NextFunction } from 'express';
import { spotifyModule } from './service';
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
 * Controller Spotify
 * Gère tous les endpoints liés à Spotify
 */
export class SpotifyController {
    private oauthManager: OAuthManager;
    private jwtManager: JwtManager;

    constructor() {
        this.oauthManager = new OAuthManager();
        this.jwtManager = new JwtManager();
    }

    /**
     * GET /api/spotify/connect
     * Initie la connexion OAuth Spotify
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
            const authUrl = this.oauthManager.getSpotifyAuthUrl(state);
            res.redirect(authUrl);
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/spotify/callback
     * Gère le callback OAuth Spotify
     */
    public callback = async (req: Request, res: Response): Promise<void> => {
        try {
            const { code, error, state } = req.query;
            let stateData: { token?: string; isMobile?: boolean } = {};

            if (state && typeof state === 'string') {
                try {
                    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                } catch (e) {
                    console.warn('[Spotify] Failed to parse state:', e);
                }
            }
            const isMobile = stateData.isMobile || this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            if (error) {
                console.error('[Spotify] OAuth error:', error);
                return res.redirect(`${redirectUrl}/services?error=${error}`);
            }
            if (!code)
                return res.redirect(`${redirectUrl}/services?error=missing_code`);
            if (!stateData.token)
                return res.redirect(`${redirectUrl}/login?error=authentication_required`);
            const decoded = this.jwtManager.verifyToken(stateData.token);
            if (!decoded || !decoded.userId)
                return res.redirect(`${redirectUrl}/login?error=invalid_token`);
            await this.oauthManager.handleSpotifyCallback(code as string, decoded.userId);
            res.redirect(`${redirectUrl}/services?success=spotify`);
        } catch (error) {
            console.error('[Spotify] OAuth callback error:'.red, error);
            const isMobile = this.isMobileRequest(req);
            const redirectUrl = this.getRedirectUrl(isMobile);
            res.redirect(`${redirectUrl}/services?error=spotify_auth_failed`);
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
     * GET /api/spotify/me
     * Retourne le profil de l'utilisateur Spotify
     */
    public getCurrentUser = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'spotify');

            if (!spotifyAuth || !spotifyAuth.access_token) {
                const error = new Error('Spotify not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = spotifyModule.getApiService();
            const user = await apiService.getCurrentUser(spotifyAuth.access_token);

            res.json({ user });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/spotify/player
     * Retourne l'état de lecture actuel
     */
    public getPlaybackState = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'spotify');

            if (!spotifyAuth || !spotifyAuth.access_token) {
                const error = new Error('Spotify not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = spotifyModule.getApiService();
            const playback = await apiService.getCurrentPlayback(spotifyAuth.access_token);

            res.json({ playback });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/spotify/playlists
     * Retourne les playlists de l'utilisateur
     */
    public getPlaylists = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'spotify');

            if (!spotifyAuth || !spotifyAuth.access_token) {
                const error = new Error('Spotify not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = spotifyModule.getApiService();
            const playlists = await apiService.getUserPlaylists(spotifyAuth.access_token, limit);

            res.json({ playlists, count: playlists.length });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/spotify/player/currently-playing
     * Retourne la piste en cours de lecture
     */
    public getCurrentTrack = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'spotify');

            if (!spotifyAuth || !spotifyAuth.access_token) {
                const error = new Error('Spotify not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = spotifyModule.getApiService();
            const track = await apiService.getCurrentlyPlayingTrack(spotifyAuth.access_token);

            res.json({ track });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/spotify/player/recently-played
     * Retourne les pistes récemment écoutées
     */
    public getRecentlyPlayed = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'spotify');

            if (!spotifyAuth || !spotifyAuth.access_token) {
                const error = new Error('Spotify not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = spotifyModule.getApiService();
            const tracks = await apiService.getRecentlyPlayedTracks(spotifyAuth.access_token, limit);

            res.json({ tracks, count: tracks.length });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/spotify/devices
     * Retourne les appareils disponibles
     */
    public getDevices = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'spotify');

            if (!spotifyAuth || !spotifyAuth.access_token) {
                const error = new Error('Spotify not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = spotifyModule.getApiService();
            const devices = await apiService.getAvailableDevices(spotifyAuth.access_token);

            res.json({ devices, count: devices.length });
        } catch (error) {
            next(error);
        }
    });

    /**
     * PUT /api/spotify/player/pause
     * Met en pause la lecture
     */
    public pausePlayback = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { deviceId } = req.body;
            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'spotify');

            if (!spotifyAuth || !spotifyAuth.access_token) {
                const error = new Error('Spotify not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = spotifyModule.getApiService();
            await apiService.pausePlayback(spotifyAuth.access_token, deviceId);

            res.json({ success: true, message: 'Playback paused' });
        } catch (error) {
            next(error);
        }
    });

    /**
     * PUT /api/spotify/player/play
     * Reprend la lecture
     */
    public resumePlayback = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { deviceId } = req.body;
            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'spotify');

            if (!spotifyAuth || !spotifyAuth.access_token) {
                const error = new Error('Spotify not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = spotifyModule.getApiService();
            await apiService.resumePlayback(spotifyAuth.access_token, deviceId);

            res.json({ success: true, message: 'Playback resumed' });
        } catch (error) {
            next(error);
        }
    });

    /**
     * POST /api/spotify/player/next
     * Passe à la piste suivante
     */
    public skipToNext = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { deviceId } = req.body;
            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'spotify');

            if (!spotifyAuth || !spotifyAuth.access_token) {
                const error = new Error('Spotify not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = spotifyModule.getApiService();
            await apiService.skipToNext(spotifyAuth.access_token, deviceId);

            res.json({ success: true, message: 'Skipped to next track' });
        } catch (error) {
            next(error);
        }
    });

    /**
     * POST /api/spotify/player/previous
     * Revient à la piste précédente
     */
    public skipToPrevious = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { deviceId } = req.body;
            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'spotify');

            if (!spotifyAuth || !spotifyAuth.access_token) {
                const error = new Error('Spotify not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = spotifyModule.getApiService();
            await apiService.skipToPrevious(spotifyAuth.access_token, deviceId);

            res.json({ success: true, message: 'Skipped to previous track' });
        } catch (error) {
            next(error);
        }
    });

    /**
     * PUT /api/spotify/player/volume
     * Définit le volume
     */
    public setVolume = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { volumePercent, deviceId } = req.body;

            if (volumePercent === undefined || volumePercent < 0 || volumePercent > 100) {
                const error = new Error('Invalid volume. Must be between 0 and 100') as CustomError;
                error.statusCode = 400;
                return next(error);
            }

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'spotify');

            if (!spotifyAuth || !spotifyAuth.access_token) {
                const error = new Error('Spotify not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = spotifyModule.getApiService();
            await apiService.setVolume(spotifyAuth.access_token, volumePercent, deviceId);

            res.json({ success: true, message: `Volume set to ${volumePercent}%` });
        } catch (error) {
            next(error);
        }
    });

    /**
     * POST /api/spotify/tracks/save
     * Ajoute une piste aux favoris
     */
    public saveTrack = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { trackId } = req.body;

            if (!trackId) {
                const error = new Error('Missing required field: trackId') as CustomError;
                error.statusCode = 400;
                return next(error);
            }

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'spotify');

            if (!spotifyAuth || !spotifyAuth.access_token) {
                const error = new Error('Spotify not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = spotifyModule.getApiService();
            await apiService.saveTrack(spotifyAuth.access_token, trackId);

            res.json({ success: true, message: 'Track saved to library' });
        } catch (error) {
            next(error);
        }
    });

    /**
     * POST /api/spotify/playlists/:playlistId/tracks
     * Ajoute une piste à une playlist
     */
    public addTrackToPlaylist = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const { playlistId } = req.params;
            const { trackUri } = req.body;

            if (!trackUri) {
                const error = new Error('Missing required field: trackUri') as CustomError;
                error.statusCode = 400;
                return next(error);
            }

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(userId, 'spotify');

            if (!spotifyAuth || !spotifyAuth.access_token) {
                const error = new Error('Spotify not configured for this user') as CustomError;
                error.statusCode = 401;
                return next(error);
            }

            const apiService = spotifyModule.getApiService();
            await apiService.addTrackToPlaylist(spotifyAuth.access_token, playlistId, trackUri);

            res.json({ success: true, message: 'Track added to playlist' });
        } catch (error) {
            next(error);
        }
    });
}

export default SpotifyController;
