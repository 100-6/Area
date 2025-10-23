import { BaseModule } from '../_base/BaseModule';
import { DropboxApiService } from './DropboxApiService';
import dropboxConfig from './config';
import { OnFileUploadedTrigger } from './triggers/_index';
import { 
    UploadFileAction, 
    CreateSharedLinkAction, 
    DeleteFileAction, 
    MoveFileAction, 
    CopyFileAction 
} from './actions/_index';
import 'colors';

/**
 * Main Dropbox Module - Handles complete Dropbox integration
 * 
 * This module orchestrates all Dropbox-related triggers and actions.
 * It inherits from BaseModule which provides base methods for
 * registering triggers/actions and lifecycle management.
 * 
 * @class DropboxModule
 * @extends {BaseModule}
 * @example
 * // The module is instantiated once (singleton)
 * const dropboxModule = new DropboxModule();
 * await dropboxModule.initialize();
 */
export class DropboxModule extends BaseModule {
    /**
     * Dropbox API service instance for REST calls
     * @private
     * @type {DropboxApiService}
     */
    private apiService: DropboxApiService;

    /**
     * Dropbox module constructor
     * Initializes module configuration and instantiates the API service
     * 
     * @constructor
     */
    constructor() {
        super({
            name: dropboxConfig.name,
            displayName: dropboxConfig.displayName,
            description: dropboxConfig.description,
            iconUrl: dropboxConfig.iconUrl,
            color: dropboxConfig.color,
            authType: dropboxConfig.authType as 'oauth2',
            isActive: dropboxConfig.isActive
        });

        this.apiService = new DropboxApiService();
    }

    /**
     * Returns the unique module identifier
     * 
     * @returns {string} 'dropbox'
     */
    getName(): string {
        return 'dropbox';
    }

    /**
     * Initializes the Dropbox module at server startup
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
     * await dropboxModule.initialize();
     * // Logs: [Dropbox] Initializing Dropbox module...
     * //       [Dropbox] ✓ Module initialized successfully
     */
    async initialize(): Promise<void> {
        console.log('[Dropbox] Initializing Dropbox module...'.cyan);

        try {
            // Register triggers
            this.registerTrigger(new OnFileUploadedTrigger());

            // Register actions
            this.registerAction(new UploadFileAction());
            this.registerAction(new CreateSharedLinkAction());
            this.registerAction(new DeleteFileAction());
            this.registerAction(new MoveFileAction());
            this.registerAction(new CopyFileAction());

            console.log('[Dropbox] ✓ Module initialized successfully'.green.bold);
        } catch (error) {
            console.error('[Dropbox] ❌ Failed to initialize module:'.red, error);
            throw error;
        }
    }

    /**
     * Returns the Dropbox API service instance
     * 
     * Useful if other parts of the code need direct access to the Dropbox API.
     * 
     * @returns {DropboxApiService} The API service instance
     * @example
     * const apiService = dropboxModule.getApiService();
     * const files = await apiService.listFolder('/Documents', token);
     */
    getApiService(): DropboxApiService {
        return this.apiService;
    }

    /**
     * Cleans up and stops the Dropbox module during server shutdown
     * 
     * This method is automatically called during server shutdown (SIGTERM, SIGINT).
     * It stops all active triggers and cleans up used resources (intervals, etc.).
     * 
     * @async
     * @returns {Promise<void>}
     * @fires console.log - Cleanup progress logs
     * @example
     * // Automatically called during shutdown
     * await dropboxModule.cleanup();
     * // Logs: [Dropbox] Cleaning up Dropbox module...
     * //       [Dropbox] ✓ Module cleaned up successfully
     */
    async cleanup(): Promise<void> {
        console.log('[Dropbox] Cleaning up Dropbox module...'.yellow);

        try {
            // Stop all active triggers
            for (const [name, trigger] of this.triggers) {
                if (trigger.isActive()) {
                    console.log(`[Dropbox] Stopping active trigger: ${name}`.yellow);
                }
            }
            await super.cleanup();
            console.log('[Dropbox] ✓ Module cleaned up successfully'.green);
        } catch (error) {
            console.error('[Dropbox] ❌ Error during cleanup:'.red, error);
        }
    }
}

/**
 * Export the Dropbox module instance
 */
export const dropboxModule = new DropboxModule();

