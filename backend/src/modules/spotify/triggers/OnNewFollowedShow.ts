import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { SpotifyModule } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger that fires when a new show is followed on Spotify
 * Uses polling to check for newly followed shows
 */
export class OnNewFollowedShowTrigger extends BaseTrigger {
    private spotifyModule: SpotifyModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownShowIds: Map<string, Set<string>> = new Map();

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'on_new_followed_show';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when you follow a new show on Spotify';
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
                id: { type: 'string', description: 'Show ID' },
                name: { type: 'string', description: 'Show name' },
                publisher: { type: 'string', description: 'Show publisher' },
                description: { type: 'string', description: 'Show description' },
                imageUrl: { type: 'string', description: 'Show cover image URL' },
                totalEpisodes: { type: 'number', description: 'Total number of episodes' },
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
        console.log(`[OnNewFollowedShow] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnNewFollowedShow] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        // Initialize with current shows to avoid triggering on existing follows
        await this.initializeKnownShows(areaId);

        const pollingInterval = config.pollingInterval || 60000;

        const interval = setInterval(async () => {
            await this.checkForNewShows(areaId);
        }, pollingInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnNewFollowedShow] Trigger started for AREA ${areaId} with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnNewFollowedShow] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownShowIds.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnNewFollowedShow] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialize the set of currently followed shows to avoid triggering on existing follows
     */
    private async initializeKnownShows(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) return;

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();

            // Get current shows
            const shows = await apiService.getSavedShows(accessToken, 50);
            const showIds = new Set(shows.map(show => show.id));

            this.lastKnownShowIds.set(areaId, showIds);
            console.log(`[OnNewFollowedShow] Initialized with ${showIds.size} existing shows`.gray);
        } catch (error) {
            console.error(`[OnNewFollowedShow] Error initializing known shows:`.red, error);
        }
    }

    /**
     * Check for newly followed shows
     */
    private async checkForNewShows(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnNewFollowedShow] AREA ${areaId} not found`.red);
                return;
            }

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) {
                console.error(`[OnNewFollowedShow] Spotify not connected for user ${area.user_id}`.red);
                return;
            }

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();

            console.log(`[OnNewFollowedShow] Checking for new followed shows for AREA ${areaId}`.gray);

            // Get current shows
            const currentShows = await apiService.getSavedShows(accessToken, 50);
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
                        externalUrl: show.external_urls.spotify
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnNewFollowedShow] New show followed: ${show.name} by ${show.publisher}`.green);
            }

            // Update last known show IDs
            this.lastKnownShowIds.set(areaId, currentShowIds);
        } catch (error) {
            console.error(`[OnNewFollowedShow] Error checking for new shows:`.red, error);
        }
    }
}
