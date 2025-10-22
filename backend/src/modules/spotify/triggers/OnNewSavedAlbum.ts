import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { SpotifyModule } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger that fires when a user saves a new album on Spotify
 * Uses polling to check for newly saved albums
 */
export class OnNewSavedAlbumTrigger extends BaseTrigger {
    private spotifyModule: SpotifyModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownAlbumIds: Map<string, Set<string>> = new Map();

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'on_new_saved_album';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when you save a new album to Your Music on Spotify';
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
                albumId: { type: 'string', description: 'Album ID' },
                albumName: { type: 'string', description: 'Album name' },
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
                releaseDate: { type: 'string', description: 'Album release date' },
                totalTracks: { type: 'number', description: 'Total number of tracks' },
                albumImageUrl: { type: 'string', description: 'Album cover image URL' },
                addedAt: { type: 'string', description: 'Timestamp when the album was saved (ISO 8601)' },
                uri: { type: 'string', description: 'Spotify URI' },
                externalUrl: { type: 'string', description: 'Spotify web URL' }
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
        console.log(`[OnNewSavedAlbum] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnNewSavedAlbum] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        // Initialize with current saved albums to avoid triggering on existing saves
        await this.initializeKnownAlbums(areaId);

        const pollingInterval = config.pollingInterval || 60000;

        const interval = setInterval(async () => {
            await this.checkForNewSavedAlbums(areaId);
        }, pollingInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnNewSavedAlbum] Trigger started for AREA ${areaId} with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnNewSavedAlbum] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownAlbumIds.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnNewSavedAlbum] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialize the set of current saved albums to avoid triggering on existing saves
     */
    private async initializeKnownAlbums(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) return;

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();

            // Get current saved albums
            const albums = await apiService.getSavedAlbums(accessToken, 50);
            const albumIds = new Set(albums.map(album => album.id));

            this.lastKnownAlbumIds.set(areaId, albumIds);
            console.log(`[OnNewSavedAlbum] Initialized with ${albumIds.size} existing saved albums`.gray);
        } catch (error) {
            console.error(`[OnNewSavedAlbum] Error initializing known albums:`.red, error);
        }
    }

    /**
     * Check for newly saved albums
     */
    private async checkForNewSavedAlbums(areaId: string): Promise<void> {
        try {
            console.log(`[OnNewSavedAlbum] Checking for new saved albums for AREA ${areaId}`.gray);

            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnNewSavedAlbum] AREA ${areaId} not found`.red);
                return;
            }

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) {
                console.error(`[OnNewSavedAlbum] Spotify not connected for user ${area.user_id}`.red);
                return;
            }

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();

            // Get current saved albums
            const currentAlbums = await apiService.getSavedAlbums(accessToken, 50);
            const currentAlbumIds = new Set(currentAlbums.map(album => album.id));
            const lastKnownIds = this.lastKnownAlbumIds.get(areaId) || new Set<string>();

            // Find new albums (in current but not in last known)
            const newAlbums = currentAlbums.filter(album => !lastKnownIds.has(album.id));

            // Emit trigger for each new album
            for (const album of newAlbums) {
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        albumId: album.id,
                        albumName: album.name,
                        artists: album.artists.map((artist: any) => artist.name),
                        artistIds: album.artists.map((artist: any) => artist.id),
                        releaseDate: album.release_date,
                        totalTracks: album.total_tracks,
                        albumImageUrl: album.images[0]?.url || '',
                        addedAt: album.added_at,
                        uri: album.uri,
                        externalUrl: album.external_urls.spotify
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnNewSavedAlbum] ✅ New album saved: "${album.name}" by ${album.artists.map((a: any) => a.name).join(', ')}`.green);
            }

            // Update last known album IDs
            this.lastKnownAlbumIds.set(areaId, currentAlbumIds);
        } catch (error) {
            console.error(`[OnNewSavedAlbum] Error checking for new saved albums:`.red, error);
        }
    }
}
