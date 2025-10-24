import { Router } from 'express';
import { SpotifyController } from './controller';
import { requireAuth } from '../../core/middleware/auth';
import { requireSpotifyAuth } from './middlewareSpotify';

/**
 * Routes Spotify
 * Préfixe: /api/spotify
 */
const router = Router();
const controller = new SpotifyController();

/**
 * OAuth Routes
 * Note: /connect expects token in query param from frontend
 * /callback is public as it's called by Spotify
 */
router.get('/connect', controller.connect);
router.get('/callback', controller.callback);

/**
 * Protected routes (require auth + Spotify connection)
 */
router.use(requireAuth);
router.use(requireSpotifyAuth);

/**
 * GET /api/spotify/me
 * Récupère le profil de l'utilisateur Spotify
 */
router.get('/me', controller.getCurrentUser);

/**
 * GET /api/spotify/player
 * Récupère l'état de lecture actuel
 */
router.get('/player', controller.getPlaybackState);

/**
 * GET /api/spotify/player/currently-playing
 * Récupère la piste en cours de lecture
 */
router.get('/player/currently-playing', controller.getCurrentTrack);

/**
 * GET /api/spotify/player/recently-played
 * Récupère les pistes récemment écoutées
 * Query params: limit (default: 20)
 */
router.get('/player/recently-played', controller.getRecentlyPlayed);

/**
 * GET /api/spotify/playlists
 * Récupère les playlists de l'utilisateur
 * Query params: limit (default: 20)
 */
router.get('/playlists', controller.getPlaylists);

/**
 * GET /api/spotify/devices
 * Récupère les appareils disponibles
 */
router.get('/devices', controller.getDevices);

/**
 * PUT /api/spotify/player/pause
 * Met en pause la lecture
 * Body: { deviceId?: string }
 */
router.put('/player/pause', controller.pausePlayback);

/**
 * PUT /api/spotify/player/play
 * Reprend la lecture
 * Body: { deviceId?: string }
 */
router.put('/player/play', controller.resumePlayback);

/**
 * POST /api/spotify/player/next
 * Passe à la piste suivante
 * Body: { deviceId?: string }
 */
router.post('/player/next', controller.skipToNext);

/**
 * POST /api/spotify/player/previous
 * Revient à la piste précédente
 * Body: { deviceId?: string }
 */
router.post('/player/previous', controller.skipToPrevious);

/**
 * PUT /api/spotify/player/volume
 * Définit le volume
 * Body: { volumePercent: number, deviceId?: string }
 */
router.put('/player/volume', controller.setVolume);

/**
 * POST /api/spotify/tracks/save
 * Ajoute une piste aux favoris
 * Body: { trackId: string }
 */
router.post('/tracks/save', controller.saveTrack);

/**
 * POST /api/spotify/playlists/:playlistId/tracks
 * Ajoute une piste à une playlist
 * Body: { trackUri: string }
 */
router.post('/playlists/:playlistId/tracks', controller.addTrackToPlaylist);

export default router;
