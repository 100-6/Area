import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { SpotifyModule } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger that fires when a new show appears in a Spotify search
 * Uses polling to check for new shows matching the search query
 */
export class OnNewShowFromSearchTrigger extends BaseTrigger {
    private spotifyModule: SpotifyModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownShowIds: Map<string, Set<string>> = new Map();

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'on_new_show_from_search';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a new show appears in your search on Spotify';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['searchQuery'],
            properties: {
                searchQuery: {
                    type: 'string',
                    description: 'Search query to monitor (e.g., "tech podcast", "comedy show")',
                    minLength: 1
                },
                pollingInterval: { 
                    type: 'number', 
                    default: 300000, // 5 minutes default (search is less frequent)
                    minimum: 60000,
                    description: 'Polling interval in milliseconds (minimum 60 seconds)' 
                },
                maxResults: {
                    type: 'number',
                    default: 20,
                    minimum: 1,
                    maximum: 50,
                    description: 'Maximum number of search results to check'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Show ID' },
                name: { type: 'string', description: 'Show name' },
                publisher: { type: 'string', description: 'Show publisher' },
                description: { type: 'string', description: 'Show description' },
                imageUrl: { type: 'string', description: 'Show cover image URL' },
                totalEpisodes: { type: 'number', description: 'Total number of episodes' },
                uri: { type: 'string', description: 'Spotify URI' },
                externalUrl: { type: 'string', description: 'Spotify web URL' },
                searchQuery: { type: 'string', description: 'The search query that found this show' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (!config.searchQuery || typeof config.searchQuery !== 'string' || config.searchQuery.trim().length === 0) {
            throw new Error('searchQuery is required and must be a non-empty string');
        }
        if (config.pollingInterval && config.pollingInterval < 60000) {
            throw new Error('Polling interval must be at least 60 seconds (60000ms)');
        }
        if (config.maxResults && (config.maxResults < 1 || config.maxResults > 50)) {
            throw new Error('maxResults must be between 1 and 50');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnNewShowFromSearch] Starting trigger for AREA ${areaId} with query: "${config.searchQuery}"`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnNewShowFromSearch] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        // Initialize with current search results to avoid triggering on existing shows
        await this.initializeKnownShows(areaId, config);

        const pollingInterval = config.pollingInterval || 300000;

        const interval = setInterval(async () => {
            await this.checkForNewShows(areaId, config);
        }, pollingInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnNewShowFromSearch] Trigger started for AREA ${areaId} with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnNewShowFromSearch] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownShowIds.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnNewShowFromSearch] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialize the set of current search results to avoid triggering on existing shows
     */
    private async initializeKnownShows(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) return;

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();
            const maxResults = config.maxResults || 20;

            // Get current search results
            const shows = await apiService.searchShows(accessToken, config.searchQuery, maxResults);
            const showIds = new Set(shows.map(show => show.id));

            this.lastKnownShowIds.set(areaId, showIds);
            console.log(`[OnNewShowFromSearch] Initialized with ${showIds.size} existing shows for query "${config.searchQuery}"`.gray);
        } catch (error) {
            console.error(`[OnNewShowFromSearch] Error initializing known shows:`.red, error);
        }
    }

    /**
     * Check for new shows in the search results
     */
    private async checkForNewShows(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnNewShowFromSearch] AREA ${areaId} not found`.red);
                return;
            }

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) {
                console.error(`[OnNewShowFromSearch] Spotify not connected for user ${area.user_id}`.red);
                return;
            }

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();
            const maxResults = config.maxResults || 20;

            console.log(`[OnNewShowFromSearch] Checking for new shows for query "${config.searchQuery}" (AREA ${areaId})`.gray);

            // Get current search results
            const currentShows = await apiService.searchShows(accessToken, config.searchQuery, maxResults);
            const currentShowIds = new Set(currentShows.map(show => show.id));
            const lastKnownIds = this.lastKnownShowIds.get(areaId) || new Set<string>();

            // Find new shows (in current but not in last known)
            const newShows = currentShows.filter(show => !lastKnownIds.has(show.id));

            // Emit trigger for each new show
            for (const show of newShows) {
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        id: show.id,
                        name: show.name,
                        publisher: show.publisher,
                        description: show.description,
                        imageUrl: show.images[0]?.url || '',
                        totalEpisodes: show.total_episodes,
                        uri: show.uri,
                        externalUrl: show.external_urls.spotify,
                        searchQuery: config.searchQuery
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnNewShowFromSearch] New show found: "${show.name}" by ${show.publisher} (query: "${config.searchQuery}")`.green);
            }

            // Update last known show IDs
            this.lastKnownShowIds.set(areaId, currentShowIds);
        } catch (error) {
            console.error(`[OnNewShowFromSearch] Error checking for new shows:`.red, error);
        }
    }
}
