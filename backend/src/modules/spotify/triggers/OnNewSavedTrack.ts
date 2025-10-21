import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { SpotifyModule } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger that fires when a new track is saved to Your Music on Spotify
 * Uses polling to check for newly saved tracks
 */
export class OnNewSavedTrackTrigger extends BaseTrigger {
    private spotifyModule: SpotifyModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownTrackIds: Map<string, Set<string>> = new Map();

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'on_new_saved_track';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when you save a new track to Your Music on Spotify';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
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
                id: { type: 'string', description: 'Track ID' },
                name: { type: 'string', description: 'Track name' },
                artists: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'Artist names' 
                },
                album: { 
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Album name' },
                        imageUrl: { type: 'string', description: 'Album cover image URL' }
                    }
                },
                durationMs: { type: 'number', description: 'Track duration in milliseconds' },
                uri: { type: 'string', description: 'Spotify URI' },
                addedAt: { type: 'string', description: 'Timestamp when track was saved' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (config.pollingInterval && config.pollingInterval < 30000) {
            throw new Error('Polling interval must be at least 30 seconds (30000ms)');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnNewSavedTrack] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnNewSavedTrack] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        // Initialize with current tracks to avoid triggering on existing saves
        await this.initializeKnownTracks(areaId);

        const pollingInterval = config.pollingInterval || 60000;

        const interval = setInterval(async () => {
            await this.checkForNewTracks(areaId);
        }, pollingInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnNewSavedTrack] Trigger started for AREA ${areaId} with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnNewSavedTrack] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownTrackIds.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnNewSavedTrack] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialize the set of currently saved tracks to avoid triggering on existing saves
     */
    private async initializeKnownTracks(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) return;

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();

            // Get current tracks
            const savedTracks = await apiService.getSavedTracks(accessToken, 50);
            const trackIds = new Set(savedTracks.map(item => item.track.id));

            this.lastKnownTrackIds.set(areaId, trackIds);
            console.log(`[OnNewSavedTrack] Initialized with ${trackIds.size} existing tracks`.gray);
        } catch (error) {
            console.error(`[OnNewSavedTrack] Error initializing known tracks:`.red, error);
        }
    }

    /**
     * Check for newly saved tracks
     */
    private async checkForNewTracks(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnNewSavedTrack] AREA ${areaId} not found`.red);
                return;
            }

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) {
                console.error(`[OnNewSavedTrack] Spotify not connected for user ${area.user_id}`.red);
                return;
            }

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();

            console.log(`[OnNewSavedTrack] Checking for new saved tracks for AREA ${areaId}`.gray);

            // Get current tracks
            const currentSavedTracks = await apiService.getSavedTracks(accessToken, 50);
            const currentTrackIds = new Set(currentSavedTracks.map(item => item.track.id));
            const lastKnownIds = this.lastKnownTrackIds.get(areaId) || new Set<string>();

            // Find new tracks (in current but not in last known)
            const newTracks = currentSavedTracks.filter(item => !lastKnownIds.has(item.track.id));

            // Emit trigger for each new track
            for (const savedTrack of newTracks) {
                const track = savedTrack.track;
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        id: track.id,
                        name: track.name,
                        artists: track.artists.map(artist => artist.name),
                        album: {
                            name: track.album.name,
                            imageUrl: track.album.images[0]?.url || ''
                        },
                        durationMs: track.duration_ms,
                        uri: track.uri,
                        addedAt: savedTrack.added_at
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnNewSavedTrack] New track saved: ${track.name} by ${track.artists.map(a => a.name).join(', ')}`.green);
            }

            // Update last known track IDs
            this.lastKnownTrackIds.set(areaId, currentTrackIds);
        } catch (error) {
            console.error(`[OnNewSavedTrack] Error checking for new tracks:`.red, error);
        }
    }
}
