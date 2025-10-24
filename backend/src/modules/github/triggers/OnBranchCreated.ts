import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { GitHubApiService } from '../GitHubApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

/**
 * OnBranchCreated trigger-specific configuration
 * @interface OnBranchCreatedConfig
 * @extends {TriggerConfig}
 * @property {string} owner - GitHub username or organization that owns the repository
 * @property {string} repo - Repository name to monitor
 */
interface OnBranchCreatedConfig extends TriggerConfig {
    owner: string;
    repo: string;
}

/**
 * GitHub branch creation detection trigger
 * 
 * Monitors a GitHub repository and automatically triggers when
 * a new branch is created.
 * 
 * Uses a polling system (checks every 60 seconds) to
 * detect new branches. Compares branch lists to identify
 * newly created branches.
 * 
 * @class OnBranchCreatedTrigger
 * @extends {BaseTrigger}
 * @example
 * const trigger = new OnBranchCreatedTrigger();
 * await trigger.start('area-uuid', {
 *   owner: 'octocat',
 *   repo: 'Hello-World',
 *   userId: 'user-uuid'
 * });
 * // The trigger will check every 60s for new branches
 */
export class OnBranchCreatedTrigger extends BaseTrigger {
    /**
     * GitHub API service instance for REST calls
     * @private
     * @type {GitHubApiService}
     */
    private githubApi: GitHubApiService;
    
    /**
     * Map storing active polling intervals
     * Key: areaId, Value: NodeJS.Timeout (interval ID)
     * Allows managing multiple AREAs in parallel
     * @private
     * @type {Map<string, NodeJS.Timeout>}
     */
    private activePolls: Map<string, NodeJS.Timeout> = new Map();
    
    /**
     * Map storing the list of branch names seen for each AREA
     * Key: areaId, Value: Set of branch names
     * Used to detect new branches
     * @private
     * @type {Map<string, Set<string>>}
     */
    private knownBranches: Map<string, Set<string>> = new Map();

    /**
     * OnBranchCreated trigger constructor
     * Initializes the GitHub API service
     * @constructor
     */
    constructor() {
        super();
        this.githubApi = new GitHubApiService();
    }

    /**
     * Returns the unique trigger identifier
     * @returns {string} 'on_branch_created'
     */
    getName(): string {
        return 'on_branch_created';
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
        return 'Triggers when a new branch is created in a repository';
    }

    /**
     * Returns the JSON configuration schema for the trigger
     * Defines required and optional fields to configure this trigger
     * 
     * @returns {Object} JSON Schema for configuration validation
     * @property {Object} properties - Configuration properties
     * @property {string[]} required - Required fields ['owner', 'repo']
     */
    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['owner', 'repo'],
            properties: {
                owner: {
                    type: 'string',
                    title: 'Repository Owner',
                    description: 'GitHub username or organization'
                },
                repo: {
                    type: 'string',
                    title: 'Repository Name',
                    description: 'Name of the repository'
                }
            }
        };
    }

    /**
     * Returns the schema of data produced by this trigger
     * Defines the structure of variables available for subsequent actions
     * 
     * @returns {Object} JSON Schema of output data
     * @property {Object} properties - Available variables (branchName, creator, etc.)
     * @example
     * // In an action, you can use:
     * // {{branchName}}, {{repository}}, {{createdAt}}
     */
    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                branchName: {
                    type: 'string',
                    description: 'Name of the newly created branch'
                },
                repository: {
                    type: 'string',
                    description: 'Repository full name (owner/repo)'
                },
                createdAt: {
                    type: 'string',
                    description: 'Timestamp when the branch was detected'
                },
                latestCommitSha: {
                    type: 'string',
                    description: 'SHA of the latest commit on the new branch'
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
     * const config = { owner: 'octocat', repo: 'Hello-World' };
     * trigger.validate(config); // true
     */
    validate(config: TriggerConfig): boolean {
        const cfg = config as OnBranchCreatedConfig;
        if (!cfg.owner || !cfg.repo) {
            throw new Error('owner and repo are required');
        }
        return true;
    }

    /**
     * Starts the trigger for a specific AREA
     * 
     * This method:
     * 1. Retrieves the AREA to get the user ID
     * 2. Retrieves the user's GitHub OAuth token
     * 3. Fetches the current list of branches (baseline)
     * 4. Starts polling every 60 seconds
     * 5. Compares branch lists to detect new branches
     * 6. Emits a trigger event if a new branch is detected
     * 
     * @async
     * @param {string} areaId - UUID of the AREA to monitor
     * @param {TriggerConfig} config - Trigger configuration (owner, repo)
     * @returns {Promise<void>}
     * @throws {Error} If the AREA is not found
     * @throws {Error} If the user is not connected to GitHub
     * @throws {Error} If the repository doesn't exist or is not accessible
     * @fires trigger.fired - Event emitted when a new branch is detected
     * @example
     * await trigger.start('area-uuid-123', {
     *   owner: 'octocat',
     *   repo: 'Hello-World'
     * });
     * // Logs: [GitHub] Starting on_branch_created trigger for octocat/Hello-World
     * //       [GitHub] Initial branches: main, develop
     */
    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as OnBranchCreatedConfig;
        this.validate(cfg);

        // Retrieve the AREA to get the user ID
        const area = await Area.findById(areaId);
        if (!area) {
            throw new Error(`AREA ${areaId} not found`);
        }

        // Retrieve the user's GitHub OAuth access token
        const githubAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'github');
        if (!githubAuth || !githubAuth.access_token) {
            throw new Error('GitHub not connected for this user');
        }

        const accessToken = githubAuth.access_token;
        console.log(`[GitHub] Starting on_branch_created trigger for ${cfg.owner}/${cfg.repo}`.green);

        // Fetch initial list of branches to establish baseline
        try {
            const branches = await this.githubApi.getBranches(
                cfg.owner,
                cfg.repo,
                accessToken
            );

            const branchNames = new Set(branches.map(b => b.name));
            this.knownBranches.set(areaId, branchNames);
            console.log(`[GitHub] Initial branches (${branchNames.size}): ${Array.from(branchNames).join(', ')}`.cyan);
        } catch (error) {
            console.error(`[GitHub] Error fetching initial branches:`.red, error);
            throw error;
        }

        // Poll every 60 seconds
        const pollInterval = setInterval(async () => {
            try {
                const branches = await this.githubApi.getBranches(
                    cfg.owner,
                    cfg.repo,
                    accessToken
                );

                const currentBranchNames = new Set(branches.map(b => b.name));
                const knownBranchNames = this.knownBranches.get(areaId);

                if (!knownBranchNames) {
                    return;
                }

                // Find new branches (in current but not in known)
                const newBranches = Array.from(currentBranchNames).filter(
                    name => !knownBranchNames.has(name)
                );

                // Trigger for each new branch
                for (const branchName of newBranches) {
                    console.log(`[GitHub] New branch created: ${branchName}`.cyan);

                    const branch = branches.find(b => b.name === branchName);
                    
                    const payload: TriggerPayload = {
                        areaId,
                        triggerName: this.getName(),
                        triggerType: this.getType(),
                        timestamp: new Date().toISOString(),
                        data: {
                            branchName,
                            repository: `${cfg.owner}/${cfg.repo}`,
                            createdAt: new Date().toISOString(),
                            latestCommitSha: branch?.commit.sha || 'unknown'
                        }
                    };

                    await this.emitTrigger(payload);
                }

                // Update known branches
                this.knownBranches.set(areaId, currentBranchNames);
            } catch (error) {
                console.error(`[GitHub] Error polling branches:`.red, error);
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
     * 2. Removes data from memory (branch list, interval)
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
     * // Logs: [GitHub] Stopping on_branch_created trigger for AREA area-uuid-123
     */
    async stop(areaId: string): Promise<void> {
        console.log(`[GitHub] Stopping on_branch_created trigger for AREA ${areaId}`.yellow);
        const pollInterval = this.activePolls.get(areaId);
        if (pollInterval) {
            clearInterval(pollInterval);
            this.activePolls.delete(areaId);
        }
        this.knownBranches.delete(areaId);

        if (this.activePolls.size === 0) {
            this.isRunning = false;
        }
    }
}


