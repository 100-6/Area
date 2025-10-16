import { BaseModule } from '../_base/BaseModule';
import { GitHubApiService } from './GitHubApiService';
import githubConfig from './config';
import { OnPushTrigger } from './triggers/_index';
import 'colors';

/**
 * Main GitHub Module - Handles complete GitHub integration
 * 
 * This module orchestrates all GitHub-related triggers and actions.
 * It inherits from BaseModule which provides base methods for
 * registering triggers/actions and lifecycle management.
 * 
 * @class GitHubModule
 * @extends {BaseModule}
 * @example
 * // The module is instantiated once (singleton)
 * const githubModule = new GitHubModule();
 * await githubModule.initialize();
 */
export class GitHubModule extends BaseModule {
    /**
     * GitHub API service instance for REST calls
     * @private
     * @type {GitHubApiService}
     */
    private apiService: GitHubApiService;

    /**
     * GitHub module constructor
     * Initializes module configuration and instantiates the API service
     * 
     * @constructor
     */
    constructor() {
        super({
            name: githubConfig.name,
            displayName: githubConfig.displayName,
            description: githubConfig.description,
            iconUrl: githubConfig.iconUrl,
            color: githubConfig.color,
            authType: githubConfig.authType as 'oauth2',
            isActive: githubConfig.isActive
        });

        this.apiService = new GitHubApiService();
    }

    /**
     * Returns the unique module identifier
     * 
     * @returns {string} 'github'
     */
    getName(): string {
        return 'github';
    }

    /**
     * Initializes the GitHub module at server startup
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
     * await githubModule.initialize();
     * // Logs: [GitHub] Initializing GitHub module...
     * //       [GitHub] ✓ Module initialized successfully
     */
    async initialize(): Promise<void> {
        console.log('[GitHub] Initializing GitHub module...'.cyan);

        try {
            // Register triggers
            this.registerTrigger(new OnPushTrigger());

            // TODO: Register actions here when implemented
            // this.registerAction(new CreateIssueAction());

            console.log('[GitHub] ✓ Module initialized successfully'.green.bold);
        } catch (error) {
            console.error('[GitHub] ❌ Failed to initialize module:'.red, error);
            throw error;
        }
    }

    /**
     * Returns the GitHub API service instance
     * 
     * Useful if other parts of the code need direct access to the GitHub API.
     * 
     * @returns {GitHubApiService} The API service instance
     * @example
     * const apiService = githubModule.getApiService();
     * const commits = await apiService.getLatestCommits('owner', 'repo', 'main', token);
     */
    getApiService(): GitHubApiService {
        return this.apiService;
    }

    /**
     * Cleans up and stops the GitHub module during server shutdown
     * 
     * This method is automatically called during server shutdown (SIGTERM, SIGINT).
     * It stops all active triggers and cleans up used resources (intervals, etc.).
     * 
     * @async
     * @returns {Promise<void>}
     * @fires console.log - Cleanup progress logs
     * @example
     * // Automatically called during shutdown
     * await githubModule.cleanup();
     * // Logs: [GitHub] Cleaning up GitHub module...
     * //       [GitHub] ✓ Module cleaned up successfully
     */
    async cleanup(): Promise<void> {
        console.log('[GitHub] Cleaning up GitHub module...'.yellow);

        try {
            // Arrêter tous les triggers actifs
            for (const [name, trigger] of this.triggers) {
                if (trigger.isActive()) {
                    console.log(`[GitHub] Stopping active trigger: ${name}`.yellow);
                }
            }
            await super.cleanup();
            console.log('[GitHub] ✓ Module cleaned up successfully'.green);
        } catch (error) {
            console.error('[GitHub] ❌ Error during cleanup:'.red, error);
        }
    }
}

/**
 * Export de l'instance du module GitHub
 */
export const githubModule = new GitHubModule();



