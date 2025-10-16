import 'colors';

/**
 * Interface representing a GitHub commit returned by the API
 * @interface GitHubCommit
 * @property {string} sha - Unique SHA hash of the commit
 * @property {Object} commit - Commit details
 * @property {string} commit.message - Commit message
 * @property {Object} commit.author - Author information
 * @property {string} commit.author.name - Author's name
 * @property {string} commit.author.email - Author's email
 * @property {string} commit.author.date - Commit date (ISO 8601)
 * @property {Object|null} author - GitHub author information
 * @property {string} author.login - GitHub username of the author
 * @property {string} html_url - Full URL of the commit on GitHub
 */
export interface GitHubCommit {
    sha: string;
    commit: {
        message: string;
        author: {
            name: string;
            email: string;
            date: string;
        };
    };
    author: {
        login: string;
    } | null;
    html_url: string;
}

/**
 * Interface representing a GitHub issue returned by the API
 * @interface GitHubIssue
 * @property {number} id - Unique issue ID
 * @property {number} number - Issue number in the repository
 * @property {string} title - Issue title
 * @property {string} html_url - Full URL of the issue on GitHub
 * @property {string} state - Issue state (open, closed)
 */
export interface GitHubIssue {
    id: number;
    number: number;
    title: string;
    html_url: string;
    state: string;
}

/**
 * Abstraction service to interact with the GitHub REST API v3
 * Centralizes all API calls to GitHub to facilitate maintenance
 * and error handling.
 * 
 * @class GitHubApiService
 * @example
 * const githubApi = new GitHubApiService();
 * const commits = await githubApi.getLatestCommits('octocat', 'Hello-World', 'main', token);
 */
export class GitHubApiService {
    /**
     * Base URL of the GitHub REST API v3
     * @private
     * @readonly
     */
    private baseUrl = 'https://api.github.com';

    /**
     * Fetches the latest commits from a GitHub repository branch
     * 
     * @async
     * @param {string} owner - Repository owner name (username or organization)
     * @param {string} repo - Repository name
     * @param {string} branch - Branch name to query
     * @param {string} accessToken - User's GitHub OAuth token (scope: repo)
     * @param {number} [perPage=1] - Number of commits to retrieve (1-100)
     * @returns {Promise<GitHubCommit[]>} List of commits
     * @throws {Error} If the GitHub API returns an error (401, 404, etc.)
     * @example
     * const commits = await githubApi.getLatestCommits(
     *   'octocat',
     *   'Hello-World',
     *   'main',
     *   'ghp_abc123...',
     *   5
     * );
     * console.log(commits[0].commit.message); // "Initial commit"
     */
    async getLatestCommits(
        owner: string, 
        repo: string, 
        branch: string, 
        accessToken: string, 
        perPage: number = 1
    ): Promise<GitHubCommit[]> {
        try {
            const url = `${this.baseUrl}/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${perPage}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'AREA-Platform'
                }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`GitHub API error: ${response.status} - ${error}`);
            }

            return await response.json() as GitHubCommit[];
        } catch (error) {
            console.error('[GitHub API] Error fetching commits:'.red, error);
            throw error;
        }
    }

    /**
     * Creates a new issue in a GitHub repository
     * 
     * @async
     * @param {string} owner - Repository owner name (username or organization)
     * @param {string} repo - Repository name
     * @param {string} title - Issue title (1-256 characters)
     * @param {string} body - Issue description/content (Markdown supported)
     * @param {string} accessToken - User's GitHub OAuth token (scope: repo)
     * @param {string[]} [labels] - Optional array of labels to add to the issue
     * @returns {Promise<GitHubIssue>} The created issue with its ID and number
     * @throws {Error} If the GitHub API returns an error (401, 404, 422, etc.)
     * @example
     * const issue = await githubApi.createIssue(
     *   'octocat',
     *   'Hello-World',
     *   'Bug found',
     *   'There is a bug in the login function',
     *   'ghp_abc123...',
     *   ['bug', 'urgent']
     * );
     * console.log(`Issue #${issue.number} created`); // "Issue #42 created"
     */
    async createIssue(
        owner: string, 
        repo: string, 
        title: string, 
        body: string, 
        accessToken: string, 
        labels?: string[]
    ): Promise<GitHubIssue> {
        try {
            const url = `${this.baseUrl}/repos/${owner}/${repo}/issues`;
            const payload: any = {
                title,
                body: body || ''
            };

            if (labels && labels.length > 0) {
                payload.labels = labels;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'AREA-Platform'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`GitHub API error: ${response.status} - ${error}`);
            }

            return await response.json() as GitHubIssue;
        } catch (error) {
            console.error('[GitHub API] Error creating issue:'.red, error);
            throw error;
        }
    }

    /**
     * Verifies the validity of a GitHub OAuth token
     * Makes a call to the /user endpoint to check if the token is valid
     * 
     * @async
     * @param {string} accessToken - GitHub OAuth token to verify
     * @returns {Promise<boolean>} true if the token is valid, false otherwise
     * @example
     * const isValid = await githubApi.verifyToken('ghp_abc123...');
     * if (isValid) {
     *   console.log('Token is valid');
     * } else {
     *   console.log('Token is invalid or expired');
     * }
     */
    async verifyToken(accessToken: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/user`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'AREA-Platform'
                }
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

