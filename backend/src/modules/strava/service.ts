import { BaseModule } from '../_base/BaseModule';
import { StravaApiService } from './StravaApiService';
import stravaConfig from './config';
import { OnNewActivityTrigger } from './triggers/OnNewActivity';
import { CreateActivityAction } from './actions/CreateActivity';
import { UpdateActivityAction } from './actions/UpdateActivity';
import { GiveKudosAction } from './actions/GiveKudos';
import { CreateCommentAction } from './actions/CreateComment';
import 'colors';

/**
 * Main Strava Module - Handles complete Strava integration
 * 
 * This module orchestrates all Strava-related triggers and actions.
 * It inherits from BaseModule which provides base methods for
 * registering triggers/actions and lifecycle management.
 * 
 * @class StravaModule
 * @extends {BaseModule}
 * @example
 * // The module is instantiated once (singleton)
 * const stravaModule = new StravaModule();
 * await stravaModule.initialize();
 */
export class StravaModule extends BaseModule {
    /**
     * Strava API service instance for REST calls
     * @private
     * @type {StravaApiService}
     */
    private apiService: StravaApiService;

    /**
     * Strava module constructor
     * Initializes module configuration and instantiates the API service
     * 
     * @constructor
     */
    constructor() {
        super({
            name: stravaConfig.name,
            displayName: stravaConfig.displayName,
            description: stravaConfig.description,
            iconUrl: stravaConfig.iconUrl,
            color: stravaConfig.color,
            authType: stravaConfig.authType as 'oauth2',
            isActive: stravaConfig.isActive
        });

        this.apiService = new StravaApiService();
    }

    /**
     * Returns the unique module identifier
     * 
     * @returns {string} 'strava'
     */
    getName(): string {
        return 'strava';
    }

    /**
     * Initializes the Strava module at server startup
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
     * await stravaModule.initialize();
     * // Logs: [Strava] Initializing Strava module...
     * //       [Strava] ✓ Module initialized successfully
     */
    async initialize(): Promise<void> {
        console.log('[Strava] Initializing Strava module...'.cyan);

        try {
            // Register triggers
            this.registerTrigger(new OnNewActivityTrigger(this));

            // Register actions
            this.registerAction(new CreateActivityAction(this));
            this.registerAction(new UpdateActivityAction(this));
            this.registerAction(new GiveKudosAction(this));
            this.registerAction(new CreateCommentAction(this));

            console.log('[Strava] ✓ Module initialized successfully'.green.bold);
        } catch (error) {
            console.error('[Strava] ❌ Failed to initialize module:'.red, error);
            throw error;
        }
    }

    /**
     * Returns the Strava API service instance
     * 
     * Useful if other parts of the code need direct access to the Strava API.
     * 
     * @returns {StravaApiService} The API service instance
     * @example
     * const apiService = stravaModule.getApiService();
     * const activities = await apiService.getActivities(token);
     */
    getApiService(): StravaApiService {
        return this.apiService;
    }

    /**
     * Cleans up and stops the Strava module during server shutdown
     * 
     * This method is automatically called during server shutdown (SIGTERM, SIGINT).
     * It stops all active triggers and cleans up used resources (intervals, etc.).
     * 
     * @async
     * @returns {Promise<void>}
     * @fires console.log - Cleanup progress logs
     * @example
     * // Automatically called during shutdown
     * await stravaModule.cleanup();
     * // Logs: [Strava] Cleaning up Strava module...
     * //       [Strava] ✓ Module cleaned up successfully
     */
    async cleanup(): Promise<void> {
        console.log('[Strava] Cleaning up Strava module...'.yellow);

        try {
            // Stop all active triggers
            for (const [name, trigger] of this.triggers) {
                if (trigger.isActive()) {
                    console.log(`[Strava] Stopping active trigger: ${name}`.yellow);
                }
            }
            await super.cleanup();
            console.log('[Strava] ✓ Module cleaned up successfully'.green);
        } catch (error) {
            console.error('[Strava] ❌ Error during cleanup:'.red, error);
        }
    }
}

/**
 * Export the Strava module instance
 */
export const stravaModule = new StravaModule();
