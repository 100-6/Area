import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { SpotifyModule } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger that fires when a followed show releases a new episode on Spotify
 * Uses polling to check for new episodes from followed shows
 */
export class OnNewEpisodeFromFollowedShowTrigger extends BaseTrigger {
    private spotifyModule: SpotifyModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownEpisodeIds: Map<string, Set<string>> = new Map();

    constructor(spotifyModule: SpotifyModule) {
        super();
        this.spotifyModule = spotifyModule;
    }

    getName(): string {
        return 'on_new_episode_from_followed_show';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a followed show releases a new episode on Spotify';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                pollingInterval: { 
                    type: 'number', 
                    default: 300000, // 5 minutes default (checking multiple shows can be slow)
                    minimum: 60000,
                    description: 'Polling interval in milliseconds (minimum 60 seconds)' 
                },
                maxEpisodesPerShow: {
                    type: 'number',
                    default: 5,
                    minimum: 1,
                    maximum: 20,
                    description: 'Maximum number of recent episodes to check per show'
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
                showId: { type: 'string', description: 'Show ID' },
                showName: { type: 'string', description: 'Show name' },
                showPublisher: { type: 'string', description: 'Show publisher' },
                description: { type: 'string', description: 'Episode description' },
                durationMs: { type: 'number', description: 'Episode duration in milliseconds' },
                releaseDate: { type: 'string', description: 'Episode release date' },
                imageUrl: { type: 'string', description: 'Episode cover image URL' },
                uri: { type: 'string', description: 'Spotify URI' },
                externalUrl: { type: 'string', description: 'Spotify web URL' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (config.pollingInterval && config.pollingInterval < 60000) {
            throw new Error('Polling interval must be at least 60 seconds (60000ms)');
        }
        if (config.maxEpisodesPerShow && (config.maxEpisodesPerShow < 1 || config.maxEpisodesPerShow > 20)) {
            throw new Error('maxEpisodesPerShow must be between 1 and 20');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnNewEpisodeFromFollowedShow] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnNewEpisodeFromFollowedShow] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        // Initialize with current episodes to avoid triggering on existing episodes
        await this.initializeKnownEpisodes(areaId, config);

        const pollingInterval = config.pollingInterval || 300000;

        const interval = setInterval(async () => {
            await this.checkForNewEpisodes(areaId, config);
        }, pollingInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnNewEpisodeFromFollowedShow] Trigger started for AREA ${areaId} with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnNewEpisodeFromFollowedShow] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownEpisodeIds.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnNewEpisodeFromFollowedShow] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialize the set of current episodes to avoid triggering on existing episodes
     */
    private async initializeKnownEpisodes(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) return;

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();
            const maxEpisodesPerShow = config.maxEpisodesPerShow || 5;

            // Get followed shows
            const followedShows = await apiService.getFollowedShows(accessToken, 50);
            const allEpisodeIds = new Set<string>();

            // Get recent episodes from each show
            for (const show of followedShows) {
                try {
                    const episodes = await apiService.getShowEpisodes(accessToken, show.id, maxEpisodesPerShow);
                    episodes.forEach(episode => allEpisodeIds.add(episode.id));
                } catch (error) {
                    console.error(`[OnNewEpisodeFromFollowedShow] Error getting episodes for show ${show.name}:`.red, error);
                }
            }

            this.lastKnownEpisodeIds.set(areaId, allEpisodeIds);
            console.log(`[OnNewEpisodeFromFollowedShow] Initialized with ${allEpisodeIds.size} existing episodes from ${followedShows.length} shows`.gray);
        } catch (error) {
            console.error(`[OnNewEpisodeFromFollowedShow] Error initializing known episodes:`.red, error);
        }
    }

    /**
     * Check for new episodes from followed shows
     */
    private async checkForNewEpisodes(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            console.log(`[OnNewEpisodeFromFollowedShow] Checking for new episodes for AREA ${areaId}`.gray);

            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnNewEpisodeFromFollowedShow] AREA ${areaId} not found`.red);
                return;
            }

            const spotifyAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'spotify');
            if (!spotifyAuth || !spotifyAuth.access_token) {
                console.error(`[OnNewEpisodeFromFollowedShow] Spotify not connected for user ${area.user_id}`.red);
                return;
            }

            const accessToken = spotifyAuth.access_token;
            const apiService = this.spotifyModule.getApiService();
            const maxEpisodesPerShow = config.maxEpisodesPerShow || 5;

            // Get followed shows
            const followedShows = await apiService.getFollowedShows(accessToken, 50);
            const lastKnownIds = this.lastKnownEpisodeIds.get(areaId) || new Set<string>();
            const currentEpisodeIds = new Set<string>();
            const newEpisodesWithShows: Array<{episode: any, show: any}> = [];

            // Check each show for new episodes
            for (const show of followedShows) {
                try {
                    const episodes = await apiService.getShowEpisodes(accessToken, show.id, maxEpisodesPerShow);
                    
                    for (const episode of episodes) {
                        currentEpisodeIds.add(episode.id);
                        
                        // If this episode is new (not in last known IDs)
                        if (!lastKnownIds.has(episode.id)) {
                            newEpisodesWithShows.push({ episode, show });
                        }
                    }
                } catch (error) {
                    console.error(`[OnNewEpisodeFromFollowedShow] Error checking show ${show.name}:`.red, error);
                }
            }

            // Emit trigger for each new episode
            for (const { episode, show } of newEpisodesWithShows) {
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        episodeId: episode.id,
                        episodeName: episode.name,
                        showId: show.id,
                        showName: show.name,
                        showPublisher: show.publisher,
                        description: episode.description,
                        durationMs: episode.duration_ms,
                        releaseDate: episode.release_date,
                        imageUrl: episode.images[0]?.url || show.images[0]?.url || '',
                        uri: episode.uri,
                        externalUrl: episode.external_urls.spotify
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnNewEpisodeFromFollowedShow] ✅ New episode: "${episode.name}" from "${show.name}"`.green);
            }

            // Update last known episode IDs
            this.lastKnownEpisodeIds.set(areaId, currentEpisodeIds);
        } catch (error) {
            console.error(`[OnNewEpisodeFromFollowedShow] Error checking for new episodes:`.red, error);
        }
    }
}
