import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { SpotifyModule } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger that fires when a new episode is released that matches a search query on Spotify
 * Uses polling to check for newly released episodes matching the search
 */
export class OnNewEpisodeFromSearchTrigger extends BaseTrigger {
    private spotifyModule: SpotifyModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownEpisodeIds: Map<string, Set<string>> = new Map();

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'on_new_episode_from_search';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a new episode is released that matches your search query on Spotify';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['searchQuery'],
            properties: {
                searchQuery: {
                    type: 'string',
                    title: 'Search Query',
                    description: 'Episode search query (e.g., "tech podcast", "programming tutorial")'
                },
                maxResults: {
                    type: 'number',
                    title: 'Max Results',
                    default: 10,
                    minimum: 1,
                    maximum: 50,
                    description: 'Maximum number of search results to check (1-50)'
                },
                pollingInterval: { 
                    type: 'number', 
                    default: 300000, 
                    minimum: 60000,
                    description: 'Polling interval in milliseconds (minimum 1 minute, default 5 minutes)' 
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                episodeId: { type: 'string', description: 'Episode ID' },
                episodeName: { type: 'string', description: 'Episode name' },
                description: { type: 'string', description: 'Episode description' },
                durationMs: { type: 'number', description: 'Episode duration in milliseconds' },
                releaseDate: { type: 'string', description: 'Episode release date' },
                showId: { type: 'string', description: 'Show ID' },
                showName: { type: 'string', description: 'Show name' },
                showPublisher: { type: 'string', description: 'Show publisher' },
                episodeImageUrl: { type: 'string', description: 'Episode image URL' },
                uri: { type: 'string', description: 'Spotify URI' },
                externalUrl: { type: 'string', description: 'Spotify web URL' },
                searchQuery: { type: 'string', description: 'Search query that matched this episode' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (!config.searchQuery || typeof config.searchQuery !== 'string' || config.searchQuery.trim() === '') {
            throw new Error('searchQuery is required and must be a non-empty string');
        }
        if (config.pollingInterval && config.pollingInterval < 60000) {
            throw new Error('Polling interval must be at least 1 minute (60000ms)');
        }
        if (config.maxResults && (config.maxResults < 1 || config.maxResults > 50)) {
            throw new Error('maxResults must be between 1 and 50');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnNewEpisodeFromSearch] Starting trigger for AREA ${areaId} with search query: "${config.searchQuery}"`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnNewEpisodeFromSearch] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        // Initialize with current search results to avoid triggering on existing episodes
        await this.initializeKnownEpisodes(areaId, config);

        const pollingInterval = config.pollingInterval || 300000;

        const interval = setInterval(async () => {
            await this.checkForNewEpisodesFromSearch(areaId, config);
        }, pollingInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnNewEpisodeFromSearch] Trigger started for AREA ${areaId} with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnNewEpisodeFromSearch] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownEpisodeIds.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnNewEpisodeFromSearch] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialize the set of current episodes from search to avoid triggering on existing episodes
     */
    private async initializeKnownEpisodes(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) return;

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();

            const maxResults = config.maxResults || 10;
            const episodes = await apiService.searchEpisodes(accessToken, config.searchQuery, maxResults);
            const episodeIds = new Set(episodes.map(episode => episode.id));

            this.lastKnownEpisodeIds.set(areaId, episodeIds);
            console.log(`[OnNewEpisodeFromSearch] Initialized with ${episodeIds.size} existing episodes for query "${config.searchQuery}"`.gray);
        } catch (error) {
            console.error(`[OnNewEpisodeFromSearch] Error initializing known episodes:`.red, error);
        }
    }

    /**
     * Check for new episodes from search query
     */
    private async checkForNewEpisodesFromSearch(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            console.log(`[OnNewEpisodeFromSearch] Checking for new episodes matching "${config.searchQuery}" for AREA ${areaId}`.gray);

            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnNewEpisodeFromSearch] AREA ${areaId} not found`.red);
                return;
            }

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) {
                console.error(`[OnNewEpisodeFromSearch] Spotify not connected for user ${area.user_id}`.red);
                return;
            }

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();

            const maxResults = config.maxResults || 10;
            const currentEpisodes = await apiService.searchEpisodes(accessToken, config.searchQuery, maxResults);
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
                        episodeId: episode.id,
                        episodeName: episode.name,
                        description: episode.description,
                        durationMs: episode.duration_ms,
                        releaseDate: episode.release_date,
                        showId: episode.show.id,
                        showName: episode.show.name,
                        showPublisher: episode.show.publisher,
                        episodeImageUrl: episode.images[0]?.url || '',
                        uri: episode.uri,
                        externalUrl: episode.external_urls.spotify,
                        searchQuery: config.searchQuery
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnNewEpisodeFromSearch] ✅ New episode from search: "${episode.name}" from show "${episode.show.name}"`.green);
            }

            // Update last known episode IDs
            this.lastKnownEpisodeIds.set(areaId, currentEpisodeIds);
        } catch (error) {
            console.error(`[OnNewEpisodeFromSearch] Error checking for new episodes:`.red, error);
        }
    }
}
