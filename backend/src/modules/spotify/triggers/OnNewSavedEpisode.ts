import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { SpotifyModule } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger that fires when a new episode is saved to user's library on Spotify
 * Uses polling to check for newly saved episodes
 */
export class OnNewSavedEpisodeTrigger extends BaseTrigger {
    private spotifyModule: SpotifyModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownEpisodeIds: Map<string, Set<string>> = new Map();

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'on_new_saved_episode';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when you save a new episode to your library on Spotify';
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
                id: { type: 'string', description: 'Episode ID' },
                name: { type: 'string', description: 'Episode name' },
                description: { type: 'string', description: 'Episode description' },
                durationMs: { type: 'number', description: 'Episode duration in milliseconds' },
                releaseDate: { type: 'string', description: 'Episode release date' },
                imageUrl: { type: 'string', description: 'Episode cover image URL' },
                uri: { type: 'string', description: 'Spotify URI' },
                externalUrl: { type: 'string', description: 'Spotify web URL' },
                show: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Show ID' },
                        name: { type: 'string', description: 'Show name' },
                        publisher: { type: 'string', description: 'Show publisher' }
                    }
                }
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
        console.log(`[OnNewSavedEpisode] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnNewSavedEpisode] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        // Initialize with current episodes to avoid triggering on existing saves
        await this.initializeKnownEpisodes(areaId);

        const pollingInterval = config.pollingInterval || 60000;

        const interval = setInterval(async () => {
            await this.checkForNewEpisodes(areaId);
        }, pollingInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnNewSavedEpisode] Trigger started for AREA ${areaId} with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnNewSavedEpisode] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownEpisodeIds.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnNewSavedEpisode] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialize the set of currently saved episodes to avoid triggering on existing saves
     */
    private async initializeKnownEpisodes(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) return;

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();

            // Get current episodes
            const episodes = await apiService.getSavedEpisodes(accessToken, 50);
            const episodeIds = new Set(episodes.map(episode => episode.id));

            this.lastKnownEpisodeIds.set(areaId, episodeIds);
            console.log(`[OnNewSavedEpisode] Initialized with ${episodeIds.size} existing episodes`.gray);
        } catch (error) {
            console.error(`[OnNewSavedEpisode] Error initializing known episodes:`.red, error);
        }
    }

    /**
     * Check for newly saved episodes
     */
    private async checkForNewEpisodes(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnNewSavedEpisode] AREA ${areaId} not found`.red);
                return;
            }

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) {
                console.error(`[OnNewSavedEpisode] Spotify not connected for user ${area.user_id}`.red);
                return;
            }

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();

            console.log(`[OnNewSavedEpisode] Checking for new saved episodes for AREA ${areaId}`.gray);

            // Get current episodes
            const currentEpisodes = await apiService.getSavedEpisodes(accessToken, 50);
            const currentEpisodeIds = new Set(currentEpisodes.map(episode => episode.id));
            const lastKnownIds = this.lastKnownEpisodeIds.get(areaId) || new Set<string>();

            // Find new episodes (in current but not in last known)
            const newEpisodes = currentEpisodes.filter(episode => !lastKnownIds.has(episode.id));

            // Emit trigger for each new episode
            for (const episode of newEpisodes) {
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        id: episode.id,
                        name: episode.name,
                        description: episode.description,
                        durationMs: episode.duration_ms,
                        releaseDate: episode.release_date,
                        imageUrl: episode.images[0]?.url || '',
                        uri: episode.uri,
                        externalUrl: episode.external_urls.spotify,
                        show: {
                            id: episode.show.id,
                            name: episode.show.name,
                            publisher: episode.show.publisher
                        }
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnNewSavedEpisode] New episode saved: ${episode.name} from ${episode.show.name}`.green);
            }

            // Update last known episode IDs
            this.lastKnownEpisodeIds.set(areaId, currentEpisodeIds);
        } catch (error) {
            console.error(`[OnNewSavedEpisode] Error checking for new episodes:`.red, error);
        }
    }
}
