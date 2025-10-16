import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { GitHubApiService } from '../GitHubApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

/**
 * OnPush trigger-specific configuration
 * @interface OnPushConfig
 * @extends {TriggerConfig}
 * @property {string} owner - GitHub username or organization that owns the repository
 * @property {string} repo - Repository name to monitor
 * @property {string} branch - Branch to monitor (e.g., 'main', 'develop')
 */
interface OnPushConfig extends TriggerConfig {
    owner: string;
    repo: string;
    branch: string;
}

/**
 * GitHub push detection trigger
 * 
 * Monitors a GitHub repository and automatically triggers when
 * new commits are pushed to a specific branch.
 * 
 * Uses a polling system (checks every 60 seconds) to
 * detect changes. Compares commit SHAs to identify
 * new pushes.
 * 
 * @class OnPushTrigger
 * @extends {BaseTrigger}
 * @example
 * const trigger = new OnPushTrigger();
 * await trigger.start('area-uuid', {
 *   owner: 'octocat',
 *   repo: 'Hello-World',
 *   branch: 'main',
 *   userId: 'user-uuid'
 * });
 * // The trigger will check every 60s for new commits
 */
export class OnPushTrigger extends BaseTrigger {
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
     * Map storing the last commit SHA seen for each AREA
     * Key: areaId, Value: Last commit SHA
     * Used to detect new commits
     * @private
     * @type {Map<string, string>}
     */
    private lastCommitSha: Map<string, string> = new Map();

    /**
     * OnPush trigger constructor
     * Initializes the GitHub API service
     * @constructor
     */
    constructor() {
        super();
        this.githubApi = new GitHubApiService();
    }

    /**
     * Returns the unique trigger identifier
     * @returns {string} 'on_push'
     */
    getName(): string {
        return 'on_push';
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
        return 'Triggers when new commits are pushed to a repository branch';
    }

    /**
     * Returns the JSON configuration schema for the trigger
     * Defines required and optional fields to configure this trigger
     * 
     * @returns {Object} JSON Schema for configuration validation
     * @property {Object} properties - Configuration properties
     * @property {string[]} required - Required fields ['owner', 'repo', 'branch']
     */
    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['owner', 'repo', 'branch'],
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
                },
                branch: {
                    type: 'string',
                    title: 'Branch',
                    description: 'Branch to monitor',
                    default: 'main'
                }
            }
        };
    }

    /**
     * Returns the schema of data produced by this trigger
     * Defines the structure of variables available for subsequent actions
     * 
     * @returns {Object} JSON Schema of output data
     * @property {Object} properties - Available variables (pusher, commitMessage, etc.)
     * @example
     * // In an action, you can use:
     * // {{pusher}}, {{commitMessage}}, {{commitSha}}, {{commitUrl}}, {{repository}}, {{branch}}
     */
    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                pusher: {
                    type: 'string',
                    description: 'Username of the person who pushed'
                },
                commitMessage: {
                    type: 'string',
                    description: 'Latest commit message'
                },
                commitSha: {
                    type: 'string',
                    description: 'Commit SHA hash'
                },
                commitUrl: {
                    type: 'string',
                    description: 'URL to the commit'
                },
                repository: {
                    type: 'string',
                    description: 'Repository full name (owner/repo)'
                },
                branch: {
                    type: 'string',
                    description: 'Branch name'
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
     * const config = { owner: 'octocat', repo: 'Hello-World', branch: 'main' };
     * trigger.validate(config); // true
     */
    validate(config: TriggerConfig): boolean {
        const cfg = config as OnPushConfig;
        if (!cfg.owner || !cfg.repo || !cfg.branch) {
            throw new Error('owner, repo, and branch are required');
        }
        return true;
    }

    /**
     * Starts the trigger for a specific AREA
     * 
     * This method:
     * 1. Retrieves the AREA to get the user ID
     * 2. Retrieves the user's GitHub OAuth token
     * 3. Fetches the current commit (baseline)
     * 4. Starts polling every 60 seconds
     * 5. Compares SHAs to detect new commits
     * 6. Emits a trigger event if a new commit is detected
     * 
     * @async
     * @param {string} areaId - UUID of the AREA to monitor
     * @param {TriggerConfig} config - Trigger configuration (owner, repo, branch)
     * @returns {Promise<void>}
     * @throws {Error} If the AREA is not found
     * @throws {Error} If the user is not connected to GitHub
     * @throws {Error} If the repository doesn't exist or is not accessible
     * @fires trigger.fired - Event emitted when a new push is detected
     * @example
     * await trigger.start('area-uuid-123', {
     *   owner: 'octocat',
     *   repo: 'Hello-World',
     *   branch: 'main'
     * });
     * // Logs: [GitHub] Starting on_push trigger for octocat/Hello-World:main
     * //       [GitHub] Initial commit SHA: a1b2c3d
     */
    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as OnPushConfig;
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
        console.log(`[GitHub] Starting on_push trigger for ${cfg.owner}/${cfg.repo}:${cfg.branch}`.green);

        // Récupérer le dernier commit immédiatement pour initialiser
        try {
            const commits = await this.githubApi.getLatestCommits(
                cfg.owner,
                cfg.repo,
                cfg.branch,
                accessToken,
                1
            );

            if (commits && commits.length > 0) {
                this.lastCommitSha.set(areaId, commits[0].sha);
                console.log(`[GitHub] Initial commit SHA: ${commits[0].sha.substring(0, 7)}`.cyan);
            }
        } catch (error) {
            console.error(`[GitHub] Error fetching initial commit:`.red, error);
            throw error;
        }

        // Poll every 60 seconds
        const pollInterval = setInterval(async () => {
            try {
                const commits = await this.githubApi.getLatestCommits(
                    cfg.owner,
                    cfg.repo,
                    cfg.branch,
                    accessToken,
                    1
                );

                if (commits && commits.length > 0) {
                    const latestCommit = commits[0];
                    const lastSha = this.lastCommitSha.get(areaId);

                    // Only trigger if it's a new commit
                    if (lastSha && lastSha !== latestCommit.sha) {
                        console.log(`[GitHub] New push detected: ${latestCommit.sha.substring(0, 7)}`.cyan);

                        const payload: TriggerPayload = {
                            areaId,
                            triggerName: this.getName(),
                            triggerType: this.getType(),
                            timestamp: new Date().toISOString(),
                            data: {
                                pusher: latestCommit.author?.login || latestCommit.commit.author.name,
                                commitMessage: latestCommit.commit.message,
                                commitSha: latestCommit.sha,
                                commitUrl: latestCommit.html_url,
                                repository: `${cfg.owner}/${cfg.repo}`,
                                branch: cfg.branch
                            }
                        };

                        await this.emitTrigger(payload);
                    }

                    // Update last commit SHA
                    this.lastCommitSha.set(areaId, latestCommit.sha);
                }
            } catch (error) {
                console.error(`[GitHub] Error polling commits:`.red, error);
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
     * 2. Removes data from memory (SHA, interval)
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
     * // Logs: [GitHub] Stopping on_push trigger for AREA area-uuid-123
     */
    async stop(areaId: string): Promise<void> {
        console.log(`[GitHub] Stopping on_push trigger for AREA ${areaId}`.yellow);
        const pollInterval = this.activePolls.get(areaId);
        if (pollInterval) {
            clearInterval(pollInterval);
            this.activePolls.delete(areaId);
        }
        this.lastCommitSha.delete(areaId);

        if (this.activePolls.size === 0) {
            this.isRunning = false;
        }
    }
}



