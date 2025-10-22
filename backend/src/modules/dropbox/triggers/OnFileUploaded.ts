import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { DropboxApiService, DropboxFile } from '../DropboxApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

/**
 * OnFileUploaded trigger-specific configuration
 * @interface OnFileUploadedConfig
 * @extends {TriggerConfig}
 * @property {string} folderPath - Dropbox folder path to monitor (use "" for root)
 */
interface OnFileUploadedConfig extends TriggerConfig {
    folderPath: string;
}

/**
 * Dropbox file upload detection trigger
 * 
 * Monitors a Dropbox folder and automatically triggers when
 * a new file is uploaded.
 * 
 * Uses a polling system (checks every 60 seconds) to
 * detect new files. Compares file lists to identify
 * newly uploaded files.
 * 
 * @class OnFileUploadedTrigger
 * @extends {BaseTrigger}
 * @example
 * const trigger = new OnFileUploadedTrigger();
 * await trigger.start('area-uuid', {
 *   folderPath: '/Logs',
 *   userId: 'user-uuid'
 * });
 * // The trigger will check every 60s for new files
 */
export class OnFileUploadedTrigger extends BaseTrigger {
    /**
     * Dropbox API service instance for REST calls
     * @private
     * @type {DropboxApiService}
     */
    private dropboxApi: DropboxApiService;
    
    /**
     * Map storing active polling intervals
     * Key: areaId, Value: NodeJS.Timeout (interval ID)
     * Allows managing multiple AREAs in parallel
     * @private
     * @type {Map<string, NodeJS.Timeout>}
     */
    private activePolls: Map<string, NodeJS.Timeout> = new Map();
    
    /**
     * Map storing the set of known file IDs for each AREA
     * Key: areaId, Value: Set of file IDs
     * Used to detect new files
     * @private
     * @type {Map<string, Set<string>>}
     */
    private knownFiles: Map<string, Set<string>> = new Map();

    /**
     * OnFileUploaded trigger constructor
     * Initializes the Dropbox API service
     * @constructor
     */
    constructor() {
        super();
        this.dropboxApi = new DropboxApiService();
    }

    /**
     * Returns the unique trigger identifier
     * @returns {string} 'on_file_uploaded'
     */
    getName(): string {
        return 'on_file_uploaded';
    }

    /**
     * Returns the trigger type
     * @returns {'polling'} This trigger uses polling (periodic checks)
     */
    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    /**
     * Returns the trigger description
     * @returns {string} Short description of the trigger
     */
    getDescription(): string {
        return 'Triggers when a new file is uploaded to a Dropbox folder';
    }

    /**
     * Returns the JSON configuration schema for the trigger
     * Defines required and optional fields to configure this trigger
     * 
     * @returns {Object} JSON Schema for configuration validation
     * @property {Object} properties - Configuration properties
     * @property {string[]} required - Required fields ['folderPath']
     */
    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['folderPath'],
            properties: {
                folderPath: {
                    type: 'string',
                    title: 'Folder Path',
                    description: 'Dropbox folder path to monitor (use "" or "/" for root folder)',
                    default: '',
                    example: '/Logs'
                }
            }
        };
    }

    /**
     * Returns the schema of data produced by this trigger
     * Defines the structure of variables available for subsequent actions
     * 
     * @returns {Object} JSON Schema of output data
     * @property {Object} properties - Available variables (fileName, filePath, etc.)
     * @example
     * // In an action, you can use:
     * // {{fileName}}, {{filePath}}, {{fileSize}}, {{uploadedAt}}, {{folderPath}}
     */
    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                fileName: {
                    type: 'string',
                    description: 'Name of the uploaded file'
                },
                filePath: {
                    type: 'string',
                    description: 'Full path to the file in Dropbox'
                },
                fileSize: {
                    type: 'number',
                    description: 'File size in bytes'
                },
                fileSizeFormatted: {
                    type: 'string',
                    description: 'File size formatted (e.g., "1.5 MB")'
                },
                uploadedAt: {
                    type: 'string',
                    description: 'Server modification timestamp'
                },
                folderPath: {
                    type: 'string',
                    description: 'Folder being monitored'
                }
            }
        };
    }

    /**
     * Validates the trigger configuration
     * Checks that all required fields are present
     * 
     * @param {TriggerConfig} config - Configuration to validate
     * @returns {boolean} true if the configuration is valid
     * @throws {Error} If required fields are missing
     * @example
     * const config = { folderPath: '/Logs' };
     * trigger.validate(config); // true
     */
    validate(config: TriggerConfig): boolean {
        const cfg = config as OnFileUploadedConfig;
        if (cfg.folderPath === undefined) {
            throw new Error('folderPath is required (use "" for root folder)');
        }
        return true;
    }

    /**
     * Formats file size to human-readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Starts the trigger for a specific AREA
     * 
     * This method:
     * 1. Retrieves the AREA to get the user ID
     * 2. Retrieves the user's Dropbox OAuth token
     * 3. Fetches the current list of files in the folder (baseline)
     * 4. Starts polling every 60 seconds
     * 5. Compares file lists to detect new files
     * 6. Emits a trigger event if a new file is detected
     * 
     * @async
     * @param {string} areaId - UUID of the AREA to monitor
     * @param {TriggerConfig} config - Trigger configuration (folderPath)
     * @returns {Promise<void>}
     * @throws {Error} If the AREA is not found
     * @throws {Error} If the user is not connected to Dropbox
     * @throws {Error} If the folder doesn't exist or is not accessible
     * @fires trigger.fired - Event emitted when a new file is detected
     * @example
     * await trigger.start('area-uuid-123', {
     *   folderPath: '/Logs'
     * });
     * // Logs: [Dropbox] Starting on_file_uploaded trigger for /Logs
     * //       [Dropbox] Initial files: 5 files
     */
    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as OnFileUploadedConfig;
        this.validate(cfg);

        // Retrieve the AREA to get the user ID
        const area = await Area.findById(areaId);
        if (!area) {
            throw new Error(`AREA ${areaId} not found`);
        }

        // Retrieve the user's Dropbox OAuth access token
        const dropboxAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'dropbox');
        if (!dropboxAuth || !dropboxAuth.access_token) {
            throw new Error('Dropbox not connected for this user');
        }

        const accessToken = dropboxAuth.access_token;
        const folderPath = cfg.folderPath || '';
        console.log(`[Dropbox] Starting on_file_uploaded trigger for folder: ${folderPath || '/ (root)'}`.green);

        // Fetch initial list of files to establish baseline
        try {
            const entries = await this.dropboxApi.listFolder(folderPath, accessToken, false);
            const files = entries.filter(e => e['.tag'] === 'file') as DropboxFile[];
            
            const fileIds = new Set(files.map(f => f.id));
            this.knownFiles.set(areaId, fileIds);
            console.log(`[Dropbox] Initial files: ${fileIds.size} files in ${folderPath || '/'}`.cyan);
        } catch (error) {
            console.error(`[Dropbox] Error fetching initial files:`.red, error);
            throw error;
        }

        // Poll every 60 seconds
        const pollInterval = setInterval(async () => {
            try {
                const entries = await this.dropboxApi.listFolder(folderPath, accessToken, false);
                const files = entries.filter(e => e['.tag'] === 'file') as DropboxFile[];

                const currentFileIds = new Set(files.map(f => f.id));
                const knownFileIds = this.knownFiles.get(areaId);

                if (!knownFileIds) {
                    return;
                }

                // Find new files (in current but not in known)
                const newFileIds = Array.from(currentFileIds).filter(
                    id => !knownFileIds.has(id)
                );

                // Trigger for each new file
                for (const fileId of newFileIds) {
                    const file = files.find(f => f.id === fileId);
                    if (!file) continue;

                    console.log(`[Dropbox] New file uploaded: ${file.name} in ${folderPath || '/'}`.cyan);

                    const payload: TriggerPayload = {
                        areaId,
                        triggerName: this.getName(),
                        triggerType: this.getType(),
                        timestamp: new Date().toISOString(),
                        data: {
                            fileName: file.name,
                            filePath: file.path_display,
                            fileSize: file.size,
                            fileSizeFormatted: this.formatFileSize(file.size),
                            uploadedAt: file.server_modified,
                            folderPath: folderPath || '/'
                        }
                    };

                    await this.emitTrigger(payload);
                }

                // Update known files
                this.knownFiles.set(areaId, currentFileIds);
            } catch (error) {
                console.error(`[Dropbox] Error polling files:`.red, error);
            }
        }, 60000); // 60 seconds

        this.activePolls.set(areaId, pollInterval);
        this.isRunning = true;
    }

    /**
     * Stops the trigger for a specific AREA
     * 
     * This method:
     * 1. Stops the polling interval
     * 2. Removes data from memory (file list, interval)
     * 3. Marks the trigger as inactive if no AREA is being monitored
     * 
     * Automatically called when an AREA is disabled or during
     * server shutdown.
     * 
     * @async
     * @param {string} areaId - UUID of the AREA to stop
     * @returns {Promise<void>}
     * @example
     * await trigger.stop('area-uuid-123');
     * // Logs: [Dropbox] Stopping on_file_uploaded trigger for AREA area-uuid-123
     */
    async stop(areaId: string): Promise<void> {
        console.log(`[Dropbox] Stopping on_file_uploaded trigger for AREA ${areaId}`.yellow);
        const pollInterval = this.activePolls.get(areaId);
        if (pollInterval) {
            clearInterval(pollInterval);
            this.activePolls.delete(areaId);
        }
        this.knownFiles.delete(areaId);

        if (this.activePolls.size === 0) {
            this.isRunning = false;
        }
    }
}

