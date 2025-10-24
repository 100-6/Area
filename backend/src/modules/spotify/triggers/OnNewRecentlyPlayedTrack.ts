import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { SpotifyModule } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger that fires when a new track is played on Spotify
 * Uses polling to check for recently played tracks
 */
export class OnNewRecentlyPlayedTrackTrigger extends BaseTrigger {
    private spotifyModule: SpotifyModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastPlayedAt: Map<string, string> = new Map();

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'on_new_recently_played_track';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers every time you play a new track on Spotify';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                pollingInterval: { 
                    type: 'number', 
                    default: 30000, // 30 seconds default (needs to be frequent for real-time feel)
                    minimum: 15000,
                    description: 'Polling interval in milliseconds (minimum 15 seconds)' 
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
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
                playedAt: { type: 'string', description: 'Timestamp when the track was played (ISO 8601)' },
                uri: { type: 'string', description: 'Spotify URI' },
                externalUrl: { type: 'string', description: 'Spotify web URL' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (config.pollingInterval && config.pollingInterval < 15000) {
            throw new Error('Polling interval must be at least 15 seconds (15000ms)');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnNewRecentlyPlayedTrack] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnNewRecentlyPlayedTrack] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        // Initialize with current most recent track to avoid triggering on existing plays
        await this.initializeLastPlayed(areaId);

        const pollingInterval = config.pollingInterval || 30000;

        const interval = setInterval(async () => {
            await this.checkForNewPlayedTracks(areaId);
        }, pollingInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnNewRecentlyPlayedTrack] Trigger started for AREA ${areaId} with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnNewRecentlyPlayedTrack] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastPlayedAt.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnNewRecentlyPlayedTrack] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialize with the most recent track to avoid triggering on existing plays
     */
    private async initializeLastPlayed(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) return;

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();

            // Get the most recent track
            const recentTracks = await apiService.getRecentlyPlayedTracks(accessToken, 1);
            if (recentTracks.length > 0) {
                const mostRecent = recentTracks[0];
                this.lastPlayedAt.set(areaId, mostRecent.played_at);
                console.log(`[OnNewRecentlyPlayedTrack] Initialized with last played: "${mostRecent.track.name}" at ${mostRecent.played_at}`.gray);
            }
        } catch (error) {
            console.error(`[OnNewRecentlyPlayedTrack] Error initializing last played:`.red, error);
        }
    }

    /**
     * Check for newly played tracks
     */
    private async checkForNewPlayedTracks(areaId: string): Promise<void> {
        try {
            console.log(`[OnNewRecentlyPlayedTrack] Checking for new played tracks for AREA ${areaId}`.gray);

            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnNewRecentlyPlayedTrack] AREA ${areaId} not found`.red);
                return;
            }

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) {
                console.error(`[OnNewRecentlyPlayedTrack] Spotify not connected for user ${area.user_id}`.red);
                return;
            }

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();

            // Get recent tracks (limit to 50 to catch multiple plays in one polling interval)
            const recentTracks = await apiService.getRecentlyPlayedTracks(accessToken, 50);
            console.log(`[OnNewRecentlyPlayedTrack] Got ${recentTracks.length} recent tracks from Spotify`.gray);
            
            if (recentTracks.length === 0) return;

            const lastKnownPlayedAt = this.lastPlayedAt.get(areaId);
            console.log(`[OnNewRecentlyPlayedTrack] Last known played at: ${lastKnownPlayedAt}`.gray);
            console.log(`[OnNewRecentlyPlayedTrack] Most recent track played at: ${recentTracks[0].played_at}`.gray);
            
            // Find new tracks (played after the last known timestamp)
            const newTracks = lastKnownPlayedAt 
                ? recentTracks.filter(item => new Date(item.played_at) > new Date(lastKnownPlayedAt))
                : []; // Don't trigger on first check

            console.log(`[OnNewRecentlyPlayedTrack] Found ${newTracks.length} new tracks`.cyan);

            // Sort by played_at ascending (oldest first) to trigger in chronological order
            newTracks.sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime());

            // Emit trigger for each new track
            for (const item of newTracks) {
                const track = item.track;
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        trackId: track.id,
                        trackName: track.name,
                        artists: track.artists.map((artist: any) => artist.name),
                        artistIds: track.artists.map((artist: any) => artist.id),
                        albumId: track.album.id,
                        albumName: track.album.name,
                        albumImageUrl: track.album.images[0]?.url || '',
                        durationMs: track.duration_ms,
                        playedAt: item.played_at,
                        uri: track.uri,
                        externalUrl: track.external_urls.spotify
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnNewRecentlyPlayedTrack] ✅ New track played: "${track.name}" by ${track.artists.map((a: any) => a.name).join(', ')}`.green);
            }

            // Update last played timestamp to the most recent track
            if (recentTracks.length > 0) {
                this.lastPlayedAt.set(areaId, recentTracks[0].played_at);
            }
        } catch (error) {
            console.error(`[OnNewRecentlyPlayedTrack] Error checking for new played tracks:`.red, error);
        }
    }
}
