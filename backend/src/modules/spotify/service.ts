import { BaseModule } from '../_base/BaseModule';
import { SpotifyApiService } from './SpotifyApiService';
import spotifyConfig from './config';
import { 
    OnNewFollowedShowTrigger,
    OnNewSavedEpisodeTrigger,
    OnNewSavedTrackTrigger,
    OnNewShowFromSearchTrigger,
    OnNewRecentlyPlayedTrackTrigger,
    OnNewSavedAlbumTrigger,
    OnNewEpisodeFromFollowedShowTrigger,
    OnNewEpisodeFromSearchTrigger,
    OnNewTrackAddedToPlaylistTrigger
} from './triggers/_index';
import {
    SkipTrackAction,
    PausePlaybackAction,
    AddTrackToQueueAction,
    AddTrackToPlaylistAction,
    SaveTrackBySearchAction,
    FollowPlaylistAction,
    StartPlaybackAction,
    AddTrackToPlaylistBySearchAction
} from './actions/_index';
import 'colors';

/**
 * Main Spotify Module - Handles complete Spotify integration
 * 
 * This module orchestrates all Spotify-related triggers and actions.
 * It inherits from BaseModule which provides base methods for
 * registering triggers/actions and lifecycle management.
 * 
 * @class SpotifyModule
 * @extends {BaseModule}
 * @example
 * // The module is instantiated once (singleton)
 * const spotifyModule = new SpotifyModule();
 * await spotifyModule.initialize();
 */
export class SpotifyModule extends BaseModule {
    /**
     * Spotify API service instance for REST calls
     * @private
     * @type {SpotifyApiService}
     */
    private apiService: SpotifyApiService;

    /**
     * Spotify module constructor
     * Initializes module configuration and instantiates the API service
     * 
     * @constructor
     */
    constructor() {
        super({
            name: spotifyConfig.name,
            displayName: spotifyConfig.displayName,
            description: spotifyConfig.description,
            iconUrl: spotifyConfig.iconUrl,
            color: spotifyConfig.color,
            authType: spotifyConfig.authType as 'oauth2',
            isActive: spotifyConfig.isActive
        });

        this.apiService = new SpotifyApiService();
    }

    /**
     * Returns the unique module identifier
     * 
     * @returns {string} 'spotify'
     */
    getName(): string {
        return 'spotify';
    }

    /**
     * Initializes the Spotify module at server startup
     * 
     * This method is automatically called by ModuleRegistry during
     * server startup. It registers all available triggers and actions.
     * 
     * @async
     * @returns {Promise<void>}
     * @throws {Error} If initialization fails (invalid trigger, etc.)
     * @fires console.log - Initialization progress logs
     * @example
     * // Automatically called by ModuleRegistry
     * await spotifyModule.initialize();
     * // Logs: [Spotify] Initializing Spotify module...
     * //       [Spotify] ✓ Module initialized successfully
     */
    async initialize(): Promise<void> {
        console.log('[Spotify] Initializing Spotify module...'.cyan);

        try {
        // Register triggers
        this.registerTrigger(new OnNewFollowedShowTrigger(this));
        this.registerTrigger(new OnNewSavedEpisodeTrigger(this));
        this.registerTrigger(new OnNewSavedTrackTrigger(this));
        this.registerTrigger(new OnNewShowFromSearchTrigger(this));
        this.registerTrigger(new OnNewRecentlyPlayedTrackTrigger(this));
        this.registerTrigger(new OnNewSavedAlbumTrigger(this));
        this.registerTrigger(new OnNewEpisodeFromFollowedShowTrigger(this));
        this.registerTrigger(new OnNewEpisodeFromSearchTrigger(this));
        this.registerTrigger(new OnNewTrackAddedToPlaylistTrigger(this));
        
        // Register actions
        this.registerAction(new SkipTrackAction(this));
        this.registerAction(new PausePlaybackAction(this));
        this.registerAction(new AddTrackToQueueAction(this));
        this.registerAction(new AddTrackToPlaylistAction(this));
        this.registerAction(new SaveTrackBySearchAction(this));
        this.registerAction(new FollowPlaylistAction(this));
        this.registerAction(new StartPlaybackAction(this));
        this.registerAction(new AddTrackToPlaylistBySearchAction(this));

            console.log('[Spotify] ✓ Module initialized successfully'.green.bold);
        } catch (error) {
            console.error('[Spotify] ❌ Failed to initialize module:'.red, error);
            throw error;
        }
    }

    /**
     * Returns the Spotify API service instance
     * 
     * Useful if other parts of the code need direct access to the Spotify API.
     * 
     * @returns {SpotifyApiService} The API service instance
     * @example
     * const apiService = spotifyModule.getApiService();
     * const currentTrack = await apiService.getCurrentlyPlayingTrack(token);
     */
    getApiService(): SpotifyApiService {
        return this.apiService;
    }

    /**
     * Cleans up and stops the Spotify module during server shutdown
     * 
     * This method is automatically called during server shutdown (SIGTERM, SIGINT).
     * It stops all active triggers and cleans up used resources (intervals, etc.).
     * 
     * @async
     * @returns {Promise<void>}
     * @fires console.log - Cleanup progress logs
     * @example
     * // Automatically called during shutdown
     * await spotifyModule.cleanup();
     * // Logs: [Spotify] Cleaning up Spotify module...
     * //       [Spotify] ✓ Module cleaned up successfully
     */
    async cleanup(): Promise<void> {
        console.log('[Spotify] Cleaning up Spotify module...'.yellow);

        try {
            // Stop all active triggers
            for (const [name, trigger] of this.triggers) {
                if (trigger.isActive()) {
                    console.log(`[Spotify] Stopping active trigger: ${name}`.yellow);
                }
            }
            await super.cleanup();
            console.log('[Spotify] ✓ Module cleaned up successfully'.green);
        } catch (error) {
            console.error('[Spotify] ❌ Error during cleanup:'.red, error);
        }
    }
}

/**
 * Export the Spotify module instance
 */
export const spotifyModule = new SpotifyModule();
