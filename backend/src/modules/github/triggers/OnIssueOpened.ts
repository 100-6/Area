import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { GitHubApiService } from '../GitHubApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

/**
 * OnIssueOpened trigger-specific configuration
 * @interface OnIssueOpenedConfig
 * @extends {TriggerConfig}
 * @property {string} owner - GitHub username or organization that owns the repository
 * @property {string} repo - Repository name to monitor
 */
interface OnIssueOpenedConfig extends TriggerConfig {
    owner: string;
    repo: string;
}

/**
 * GitHub issue opened detection trigger
 * 
 * Monitors a GitHub repository and automatically triggers when
 * a new issue is opened.
 * 
 * Uses a polling system (checks every 60 seconds) to
 * detect new issues. Compares issue lists to identify
 * newly opened issues.
 * 
 * @class OnIssueOpenedTrigger
 * @extends {BaseTrigger}
 * @example
 * const trigger = new OnIssueOpenedTrigger();
 * await trigger.start('area-uuid', {
 *   owner: 'octocat',
 *   repo: 'Hello-World',
 *   userId: 'user-uuid'
 * });
 * // The trigger will check every 60s for new issues
 */
export class OnIssueOpenedTrigger extends BaseTrigger {
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
     * Map storing the set of known issue IDs for each AREA
     * Key: areaId, Value: Set of issue IDs
     * Used to detect new issues
     * @private
     * @type {Map<string, Set<number>>}
     */
    private knownIssues: Map<string, Set<number>> = new Map();

    /**
     * OnIssueOpened trigger constructor
     * Initializes the GitHub API service
     * @constructor
     */
    constructor() {
        super();
        this.githubApi = new GitHubApiService();
    }

    /**
     * Returns the unique trigger identifier
     * @returns {string} 'on_issue_opened'
     */
    getName(): string {
        return 'on_issue_opened';
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
        return 'Triggers when a new issue is opened in a repository';
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
     * @property {Object} properties - Available variables (issueNumber, title, etc.)
     * @example
     * // In an action, you can use:
     * // {{issueNumber}}, {{issueTitle}}, {{issueAuthor}}, {{issueBody}}, {{issueUrl}}, {{repository}}
     */
    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                issueNumber: {
                    type: 'number',
                    description: 'Issue number in the repository'
                },
                issueTitle: {
                    type: 'string',
                    description: 'Title of the issue'
                },
                issueAuthor: {
                    type: 'string',
                    description: 'Username of the person who opened the issue'
                },
                issueBody: {
                    type: 'string',
                    description: 'Body/description of the issue'
                },
                issueUrl: {
                    type: 'string',
                    description: 'URL to the issue on GitHub'
                },
                repository: {
                    type: 'string',
                    description: 'Repository full name (owner/repo)'
                },
                labels: {
                    type: 'array',
                    description: 'Array of label names'
                },
                createdAt: {
                    type: 'string',
                    description: 'Issue creation timestamp'
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
        const cfg = config as OnIssueOpenedConfig;
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
     * 3. Fetches the current list of open issues (baseline)
     * 4. Starts polling every 60 seconds
     * 5. Compares issue lists to detect new issues
     * 6. Emits a trigger event if a new issue is detected
     * 
     * @async
     * @param {string} areaId - UUID of the AREA to monitor
     * @param {TriggerConfig} config - Trigger configuration (owner, repo)
     * @returns {Promise<void>}
     * @throws {Error} If the AREA is not found
     * @throws {Error} If the user is not connected to GitHub
     * @throws {Error} If the repository doesn't exist or is not accessible
     * @fires trigger.fired - Event emitted when a new issue is detected
     * @example
     * await trigger.start('area-uuid-123', {
     *   owner: 'octocat',
     *   repo: 'Hello-World'
     * });
     * // Logs: [GitHub] Starting on_issue_opened trigger for octocat/Hello-World
     * //       [GitHub] Initial issues: 5 open issues
     */
    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as OnIssueOpenedConfig;
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
        console.log(`[GitHub] Starting on_issue_opened trigger for ${cfg.owner}/${cfg.repo}`.green);

        // Fetch initial list of open issues to establish baseline
        try {
            const issues = await this.githubApi.getIssues(
                cfg.owner,
                cfg.repo,
                accessToken,
                'open'
            );

            const issueIds = new Set(issues.map(i => i.id));
            this.knownIssues.set(areaId, issueIds);
            console.log(`[GitHub] Initial issues: ${issueIds.size} open issues`.cyan);
        } catch (error) {
            console.error(`[GitHub] Error fetching initial issues:`.red, error);
            throw error;
        }

        // Poll every 60 seconds
        const pollInterval = setInterval(async () => {
            try {
                const issues = await this.githubApi.getIssues(
                    cfg.owner,
                    cfg.repo,
                    accessToken,
                    'open'
                );

                const currentIssueIds = new Set(issues.map(i => i.id));
                const knownIssueIds = this.knownIssues.get(areaId);

                if (!knownIssueIds) {
                    return;
                }

                // Find new issues (in current but not in known)
                const newIssueIds = Array.from(currentIssueIds).filter(
                    id => !knownIssueIds.has(id)
                );

                // Trigger for each new issue
                for (const issueId of newIssueIds) {
                    const issue = issues.find(i => i.id === issueId);
                    if (!issue) continue;

                    console.log(`[GitHub] New issue opened: #${issue.number} - ${issue.title}`.cyan);

                    const payload: TriggerPayload = {
                        areaId,
                        triggerName: this.getName(),
                        triggerType: this.getType(),
                        timestamp: new Date().toISOString(),
                        data: {
                            issueNumber: issue.number,
                            issueTitle: issue.title,
                            issueAuthor: issue.user.login,
                            issueBody: issue.body || '',
                            issueUrl: issue.html_url,
                            repository: `${cfg.owner}/${cfg.repo}`,
                            labels: issue.labels.map(l => l.name),
                            createdAt: issue.created_at
                        }
                    };

                    await this.emitTrigger(payload);
                }

                // Update known issues
                this.knownIssues.set(areaId, currentIssueIds);
            } catch (error) {
                console.error(`[GitHub] Error polling issues:`.red, error);
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
     * 2. Removes data from memory (issue list, interval)
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
     * // Logs: [GitHub] Stopping on_issue_opened trigger for AREA area-uuid-123
     */
    async stop(areaId: string): Promise<void> {
        console.log(`[GitHub] Stopping on_issue_opened trigger for AREA ${areaId}`.yellow);
        const pollInterval = this.activePolls.get(areaId);
        if (pollInterval) {
            clearInterval(pollInterval);
            this.activePolls.delete(areaId);
        }
        this.knownIssues.delete(areaId);

        if (this.activePolls.size === 0) {
            this.isRunning = false;
        }
    }
}

