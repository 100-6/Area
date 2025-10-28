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
 * @property {Object} user - User who created the issue
 * @property {string} user.login - Username of the creator
 * @property {string} body - Issue body/description
 * @property {string} created_at - Creation timestamp (ISO 8601)
 * @property {string} updated_at - Last update timestamp (ISO 8601)
 * @property {string|null} closed_at - Closing timestamp (ISO 8601) or null
 * @property {Array} labels - Array of labels
 */
export interface GitHubIssue {
    id: number;
    number: number;
    title: string;
    html_url: string;
    state: string;
    user: {
        login: string;
    };
    body: string | null;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    labels: Array<{
        name: string;
        color: string;
    }>;
}

/**
 * Interface representing a GitHub branch returned by the API
 * @interface GitHubBranch
 * @property {string} name - Branch name
 * @property {Object} commit - Commit information
 * @property {string} commit.sha - SHA of the latest commit on this branch
 * @property {string} commit.url - API URL of the commit
 * @property {boolean} protected - Whether the branch is protected
 */
export interface GitHubBranch {
    name: string;
    commit: {
        sha: string;
        url: string;
    };
    protected: boolean;
}

/**
 * Interface representing a GitHub organization returned by the API
 * @interface GitHubOrganization
 * @property {string} login - Organization username
 * @property {number} id - Unique organization ID
 * @property {string} avatar_url - URL of the organization's avatar
 * @property {string} description - Organization description
 * @property {string} url - API URL of the organization
 */
export interface GitHubOrganization {
    login: string;
    id: number;
    avatar_url: string;
    description: string | null;
    url: string;
}

/**
 * Interface representing a GitHub repository returned by the API
 * @interface GitHubRepository
 * @property {number} id - Unique repository ID
 * @property {string} name - Repository name
 * @property {string} full_name - Full repository name (owner/repo)
 * @property {string} html_url - Full URL of the repository on GitHub
 * @property {string} description - Repository description
 * @property {boolean} private - Whether the repository is private
 * @property {boolean} fork - Whether the repository is a fork
 * @property {Object} owner - Repository owner information
 * @property {string} owner.login - Owner username
 * @property {string} owner.avatar_url - Owner avatar URL
 * @property {string} default_branch - Default branch name
 * @property {string} created_at - Creation timestamp (ISO 8601)
 * @property {string} updated_at - Last update timestamp (ISO 8601)
 */
export interface GitHubRepository {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string | null;
    private: boolean;
    fork: boolean;
    owner: {
        login: string;
        avatar_url: string;
    };
    default_branch: string;
    created_at: string;
    updated_at: string;
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
     * Fetches all branches from a GitHub repository
     * 
     * @async
     * @param {string} owner - Repository owner name (username or organization)
     * @param {string} repo - Repository name
     * @param {string} accessToken - User's GitHub OAuth token (scope: repo)
     * @param {number} [perPage=100] - Number of branches to retrieve per page (1-100)
     * @returns {Promise<GitHubBranch[]>} List of branches
     * @throws {Error} If the GitHub API returns an error (401, 404, etc.)
     * @example
     * const branches = await githubApi.getBranches('octocat', 'Hello-World', 'ghp_abc123...');
     * console.log(branches.map(b => b.name)); // ['main', 'develop', 'feature/xyz']
     */
    async getBranches(
        owner: string,
        repo: string,
        accessToken: string,
        perPage: number = 100
    ): Promise<GitHubBranch[]> {
        try {
            const url = `${this.baseUrl}/repos/${owner}/${repo}/branches?per_page=${perPage}`;
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

            return await response.json() as GitHubBranch[];
        } catch (error) {
            console.error('[GitHub API] Error fetching branches:'.red, error);
            throw error;
        }
    }

    /**
     * Fetches issues from a GitHub repository
     * 
     * @async
     * @param {string} owner - Repository owner name (username or organization)
     * @param {string} repo - Repository name
     * @param {string} accessToken - User's GitHub OAuth token (scope: repo)
     * @param {string} [state='all'] - Filter by state: 'open', 'closed', or 'all'
     * @param {number} [perPage=100] - Number of issues to retrieve per page (1-100)
     * @returns {Promise<GitHubIssue[]>} List of issues
     * @throws {Error} If the GitHub API returns an error (401, 404, etc.)
     * @example
     * const issues = await githubApi.getIssues('octocat', 'Hello-World', 'ghp_abc123...', 'open');
     * console.log(issues.map(i => i.title)); // ['Bug in login', 'Feature request']
     */
    async getIssues(
        owner: string,
        repo: string,
        accessToken: string,
        state: 'open' | 'closed' | 'all' = 'all',
        perPage: number = 100
    ): Promise<GitHubIssue[]> {
        try {
            const url = `${this.baseUrl}/repos/${owner}/${repo}/issues?state=${state}&per_page=${perPage}&sort=created&direction=desc`;
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

            return await response.json() as GitHubIssue[];
        } catch (error) {
            console.error('[GitHub API] Error fetching issues:'.red, error);
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

    /**
     * Fetches authenticated user information
     * Useful for debugging and verifying token validity
     * 
     * @async
     * @param {string} accessToken - GitHub OAuth token
     * @returns {Promise<any>} User information
     */
    async getAuthenticatedUser(accessToken: string): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/user`, {
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

            return await response.json();
        } catch (error) {
            console.error('[GitHub API] Error fetching authenticated user:'.red, error);
            throw error;
        }
    }

    /**
     * Fetches all organizations the authenticated user belongs to
     * 
     * @async
     * @param {string} accessToken - User's GitHub OAuth token (scope: read:org)
     * @param {number} [perPage=100] - Number of organizations to retrieve per page (1-100)
     * @returns {Promise<GitHubOrganization[]>} List of organizations
     * @throws {Error} If the GitHub API returns an error (401, 403, etc.)
     * @example
     * const orgs = await githubApi.getUserOrganizations('ghp_abc123...');
     * console.log(orgs.map(o => o.login)); // ['github', 'nodejs', 'microsoft']
     */
    async getUserOrganizations(
        accessToken: string,
        perPage: number = 100
    ): Promise<GitHubOrganization[]> {
        try {
            const url = `${this.baseUrl}/user/orgs?per_page=${perPage}`;
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

            return await response.json() as GitHubOrganization[];
        } catch (error) {
            console.error('[GitHub API] Error fetching user organizations:'.red, error);
            throw error;
        }
    }

    /**
     * Fetches all repositories accessible to the authenticated user
     * Includes owned repos, organization repos, and collaborator repos
     * 
     * @async
     * @param {string} accessToken - User's GitHub OAuth token (scope: repo)
     * @param {number} [perPage=100] - Number of repositories to retrieve per page (1-100)
     * @param {'all' | 'owner' | 'member'} [affiliation='all'] - Filter by affiliation type
     * @param {'created' | 'updated' | 'pushed' | 'full_name'} [sort='updated'] - Sort method
     * @returns {Promise<GitHubRepository[]>} List of repositories
     * @throws {Error} If the GitHub API returns an error (401, 403, etc.)
     * @example
     * const repos = await githubApi.getAllRepositories('ghp_abc123...', 100, 'owner');
     * console.log(repos.map(r => r.full_name)); // ['user/repo1', 'user/repo2']
     */
    async getAllRepositories(
        accessToken: string,
        perPage: number = 100,
        affiliation: 'all' | 'owner' | 'member' = 'all',
        sort: 'created' | 'updated' | 'pushed' | 'full_name' = 'updated'
    ): Promise<GitHubRepository[]> {
        try {
            // Essayer d'abord avec /user/repos (repos de l'utilisateur authentifié)
            const url = `${this.baseUrl}/user/repos?per_page=${perPage}&sort=${sort}&direction=desc`;
            console.log('[GitHub API] Fetching repositories from:', url);
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'AREA-Platform'
                }
            });

            console.log('[GitHub API] Response status:', response.status);
            console.log('[GitHub API] Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const error = await response.text();
                console.error('[GitHub API] Error response:', error);
                throw new Error(`GitHub API error: ${response.status} - ${error}`);
            }

            const repos = await response.json() as GitHubRepository[];
            console.log('[GitHub API] Fetched', repos.length, 'repositories');
            
            // Si on a demandé un filtrage spécifique, le faire côté serveur
            if (affiliation !== 'all') {
                const filtered = repos.filter(repo => {
                    if (affiliation === 'owner') {
                        return !repo.fork; // Approximation: les repos non-fork sont généralement owned
                    } else if (affiliation === 'member') {
                        return repo.fork; // Approximation
                    }
                    return true;
                });
                return filtered;
            }

            return repos;
        } catch (error) {
            console.error('[GitHub API] Error fetching repositories:'.red, error);
            throw error;
        }
    }

    /**
     * Fetches all branches from a specific GitHub repository
     * This is an alias for the existing getBranches method
     * 
     * @async
     * @param {string} owner - Repository owner name (username or organization)
     * @param {string} repo - Repository name
     * @param {string} accessToken - User's GitHub OAuth token (scope: repo)
     * @param {number} [perPage=100] - Number of branches to retrieve per page (1-100)
     * @returns {Promise<GitHubBranch[]>} List of branches
     * @throws {Error} If the GitHub API returns an error (401, 404, etc.)
     * @example
     * const branches = await githubApi.getRepositoryBranches('octocat', 'Hello-World', 'ghp_abc123...');
     * console.log(branches.map(b => b.name)); // ['main', 'develop', 'feature/xyz']
     */
    async getRepositoryBranches(
        owner: string,
        repo: string,
        accessToken: string,
        perPage: number = 100
    ): Promise<GitHubBranch[]> {
        return this.getBranches(owner, repo, accessToken, perPage);
    }
}

