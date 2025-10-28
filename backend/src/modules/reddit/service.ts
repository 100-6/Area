import { BaseModule } from '../_base/BaseModule';
import { RedditApiService } from './RedditApiService';
import redditConfig from './config';
import { OnNewPostInSubredditTrigger, OnNewSavedPostTrigger } from './triggers/_index';
import { SubmitPostAction, SubmitCommentAction, SavePostAction, UpvoteAction } from './actions/_index';
import 'colors';

/**
 * Main Reddit Module - Handles complete Reddit integration
 * 
 * This module orchestrates all Reddit-related triggers and actions.
 * It inherits from BaseModule which provides base methods for
 * registering triggers/actions and lifecycle management.
 * 
 * @class RedditModule
 * @extends {BaseModule}
 * @example
 * // The module is instantiated once (singleton)
 * const redditModule = new RedditModule();
 * await redditModule.initialize();
 */
export class RedditModule extends BaseModule {
    /**
     * Reddit API service instance for REST calls
     * @private
     * @type {RedditApiService}
     */
    private apiService: RedditApiService;

    /**
     * Reddit module constructor
     * Initializes module configuration and instantiates the API service
     * 
     * @constructor
     */
    constructor() {
        super({
            name: redditConfig.name,
            displayName: redditConfig.displayName,
            description: redditConfig.description,
            iconUrl: redditConfig.iconUrl,
            color: redditConfig.color,
            authType: redditConfig.authType as 'oauth2',
            isActive: redditConfig.isActive
        });

        this.apiService = new RedditApiService();
    }

    /**
     * Returns the unique module identifier
     * 
     * @returns {string} 'reddit'
     */
    getName(): string {
        return 'reddit';
    }

    /**
     * Initializes the Reddit module at server startup
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
     * await redditModule.initialize();
     * // Logs: [Reddit] Initializing Reddit module...
     * //       [Reddit] ✓ Module initialized successfully
     */
    async initialize(): Promise<void> {
        console.log('[Reddit] Initializing Reddit module...'.cyan);

        try {
            // Register triggers
            this.registerTrigger(new OnNewPostInSubredditTrigger(this));
            this.registerTrigger(new OnNewSavedPostTrigger(this));

            // Register actions
            this.registerAction(new SubmitPostAction(this));
            this.registerAction(new SubmitCommentAction(this));
            this.registerAction(new SavePostAction(this));
            this.registerAction(new UpvoteAction(this));

            console.log('[Reddit] ✓ Module initialized successfully'.green.bold);
        } catch (error) {
            console.error('[Reddit] ❌ Failed to initialize module:'.red, error);
            throw error;
        }
    }

    /**
     * Returns the Reddit API service instance
     * 
     * Useful if other parts of the code need direct access to the Reddit API.
     * 
     * @returns {RedditApiService} The API service instance
     * @example
     * const apiService = redditModule.getApiService();
     * const posts = await apiService.getSubredditPosts('javascript', token);
     */
    getApiService(): RedditApiService {
        return this.apiService;
    }

    /**
     * Cleans up and stops the Reddit module during server shutdown
     * 
     * This method is automatically called during server shutdown (SIGTERM, SIGINT).
     * It stops all active triggers and cleans up used resources (intervals, etc.).
     * 
     * @async
     * @returns {Promise<void>}
     * @fires console.log - Cleanup progress logs
     * @example
     * // Automatically called during shutdown
     * await redditModule.cleanup();
     * // Logs: [Reddit] Cleaning up Reddit module...
     * //       [Reddit] ✓ Module cleaned up successfully
     */
    async cleanup(): Promise<void> {
        console.log('[Reddit] Cleaning up Reddit module...'.yellow);

        try {
            // Stop all active triggers
            for (const [name, trigger] of this.triggers) {
                if (trigger.isActive()) {
                    console.log(`[Reddit] Stopping active trigger: ${name}`.yellow);
                }
            }
            await super.cleanup();
            console.log('[Reddit] ✓ Module cleaned up successfully'.green);
        } catch (error) {
            console.error('[Reddit] ❌ Error during cleanup:'.red, error);
        }
    }
}

/**
 * Export the Reddit module instance
 */
export const redditModule = new RedditModule();
