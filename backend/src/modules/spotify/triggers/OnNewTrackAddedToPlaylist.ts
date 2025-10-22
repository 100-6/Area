import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { SpotifyModule } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger that fires when a new track is added to a specified Spotify playlist
 * Uses polling to monitor changes to a playlist's track list
 */
export class OnNewTrackAddedToPlaylistTrigger extends BaseTrigger {
    private spotifyModule: SpotifyModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownTrackIds: Map<string, Set<string>> = new Map();

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'on_new_track_added_to_playlist';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a new track is added to a specified playlist on Spotify';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['playlistId'],
            properties: {
                playlistId: {
                    type: 'string',
                    title: 'Playlist ID',
                    description: 'Spotify playlist ID to monitor (from playlist URL: spotify.com/playlist/[ID])'
                },
                pollingInterval: { 
                    type: 'number', 
                    default: 60000, 
                    minimum: 30000,
                    description: 'Polling interval in milliseconds (minimum 30 seconds)' 
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                playlistId: { type: 'string', description: 'Playlist ID' },
                trackId: { type: 'string', description: 'Track ID' },
                trackName: { type: 'string', description: 'Track name' },
                artists: { 
                    type: 'array', 
                    description: 'Array of artist names',
                    items: { type: 'string' }
                },
                artistIds: {
                    type: 'array',
                    description: 'Array of artist IDs',
                    items: { type: 'string' }
                },
                albumId: { type: 'string', description: 'Album ID' },
                albumName: { type: 'string', description: 'Album name' },
                albumImageUrl: { type: 'string', description: 'Album cover image URL' },
                durationMs: { type: 'number', description: 'Track duration in milliseconds' },
                addedAt: { type: 'string', description: 'Timestamp when track was added to playlist (ISO 8601)' },
                addedBy: { type: 'string', description: 'User ID who added the track' },
                uri: { type: 'string', description: 'Spotify URI' },
                externalUrl: { type: 'string', description: 'Spotify web URL' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (!config.playlistId || typeof config.playlistId !== 'string' || config.playlistId.trim() === '') {
            throw new Error('playlistId is required and must be a non-empty string');
        }
        if (config.pollingInterval && config.pollingInterval < 30000) {
            throw new Error('Polling interval must be at least 30 seconds (30000ms)');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnNewTrackAddedToPlaylist] Starting trigger for AREA ${areaId} with playlist ${config.playlistId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnNewTrackAddedToPlaylist] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        // Initialize with current playlist tracks to avoid triggering on existing tracks
        await this.initializeKnownTracks(areaId, config);

        const pollingInterval = config.pollingInterval || 60000;

        const interval = setInterval(async () => {
            await this.checkForNewTracks(areaId, config);
        }, pollingInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnNewTrackAddedToPlaylist] Trigger started for AREA ${areaId} with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnNewTrackAddedToPlaylist] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownTrackIds.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnNewTrackAddedToPlaylist] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialize the set of current tracks in playlist to avoid triggering on existing tracks
     */
    private async initializeKnownTracks(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) return;

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();

            // Get current playlist tracks
            const tracks = await apiService.getPlaylistTracks(accessToken, config.playlistId, 100);
            const trackIds = new Set(tracks.map(item => item.track.id).filter(Boolean));

            this.lastKnownTrackIds.set(areaId, trackIds);
            console.log(`[OnNewTrackAddedToPlaylist] Initialized with ${trackIds.size} existing tracks`.gray);
        } catch (error) {
            console.error(`[OnNewTrackAddedToPlaylist] Error initializing known tracks:`.red, error);
        }
    }

    /**
     * Check for newly added tracks to the playlist
     */
    private async checkForNewTracks(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            console.log(`[OnNewTrackAddedToPlaylist] Checking playlist ${config.playlistId} for AREA ${areaId}`.gray);

            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnNewTrackAddedToPlaylist] AREA ${areaId} not found`.red);
                return;
            }

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) {
                console.error(`[OnNewTrackAddedToPlaylist] Spotify not connected for user ${area.user_id}`.red);
                return;
            }

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();

            // Get current playlist tracks
            const currentTracks = await apiService.getPlaylistTracks(accessToken, config.playlistId, 100);
            const currentTrackIds = new Set(currentTracks.map(item => item.track.id).filter(Boolean));
            const lastKnownIds = this.lastKnownTrackIds.get(areaId) || new Set<string>();

            // Find new tracks (in current but not in last known)
            const newTracks = currentTracks.filter(item => 
                item.track?.id && !lastKnownIds.has(item.track.id)
            );

            // Emit trigger for each new track
            for (const item of newTracks) {
                if (!item.track) continue;

                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        playlistId: config.playlistId,
                        trackId: item.track.id,
                        trackName: item.track.name,
                        artists: item.track.artists?.map((artist: any) => artist.name) || [],
                        artistIds: item.track.artists?.map((artist: any) => artist.id) || [],
                        albumId: item.track.album?.id,
                        albumName: item.track.album?.name,
                        albumImageUrl: item.track.album?.images?.[0]?.url || '',
                        durationMs: item.track.duration_ms,
                        addedAt: item.addedAt,
                        addedBy: item.addedBy?.id,
                        uri: item.track.uri,
                        externalUrl: item.track.external_urls?.spotify
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnNewTrackAddedToPlaylist] ✅ New track added: "${item.track.name}" by ${item.track.artists?.map((a: any) => a.name).join(', ')}`.green);
            }

            // Update last known track IDs
            this.lastKnownTrackIds.set(areaId, currentTrackIds);
        } catch (error) {
            console.error(`[OnNewTrackAddedToPlaylist] Error checking for new tracks:`.red, error);
        }
    }
}
