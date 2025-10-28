import axios, { AxiosInstance } from 'axios';
import 'colors';

/**
 * Reddit API Service - Handles all Reddit API interactions
 * 
 * This service provides methods to interact with Reddit's REST API.
 * All methods require a valid OAuth2 access token.
 * 
 * @class RedditApiService
 * @example
 * const apiService = new RedditApiService();
 * const posts = await apiService.getSubredditPosts('javascript', token);
 */
export class RedditApiService {
    private client: AxiosInstance;

    /**
     * Initialize the Reddit API service
     * 
     * @constructor
     */
    constructor() {
        this.client = axios.create({
            baseURL: 'https://oauth.reddit.com',
            headers: {
                'User-Agent': 'Mirror-Area/1.0'
            }
        });
    }

    /**
     * Get posts from a subreddit
     * 
     * @param subreddit - Subreddit name (without r/)
     * @param accessToken - OAuth2 access token
     * @param sort - Sort method (hot, new, top, rising)
     * @param limit - Number of posts to retrieve (max 100)
     * @returns Array of posts
     * @throws Error if API request fails
     */
    async getSubredditPosts(
        subreddit: string,
        accessToken: string,
        sort: 'hot' | 'new' | 'top' | 'rising' = 'new',
        limit: number = 25
    ): Promise<any[]> {
        try {
            const response = await this.client.get(`/r/${subreddit}/${sort}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                params: {
                    limit: Math.min(limit, 100)
                }
            });

            return response.data.data.children.map((child: any) => child.data);
        } catch (error: any) {
            console.error('[Reddit API] Error fetching subreddit posts:'.red, error.response?.data || error.message);
            throw new Error(`Failed to fetch subreddit posts: ${error.message}`);
        }
    }

    /**
     * Get user's saved posts
     * 
     * @param accessToken - OAuth2 access token
     * @param limit - Number of posts to retrieve
     * @returns Array of saved posts
     * @throws Error if API request fails
     */
    async getSavedPosts(accessToken: string, limit: number = 25): Promise<any[]> {
        try {
            // First, get the current user to obtain their username
            const userResponse = await this.client.get('/api/v1/me', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            const username = userResponse.data.name;
            console.log(`[Reddit API] Fetching saved posts for user: ${username}`.gray);

            // Then fetch saved posts using the username
            const response = await this.client.get(`/user/${username}/saved`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                params: {
                    limit: Math.min(limit, 100),
                    raw_json: '1'
                }
            });

            console.log(`[Reddit API] ✓ Fetched ${response.data.data.children.length} saved posts`.green);
            return response.data.data.children.map((child: any) => child.data);
        } catch (error: any) {
            console.error('[Reddit API] Error fetching saved posts:'.red, {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
            
            // Provide more helpful error messages
            if (error.response?.status === 400) {
                throw new Error('Reddit API returned 400 Bad Request. This may be due to missing OAuth scopes (history) or invalid endpoint.');
            } else if (error.response?.status === 401) {
                throw new Error('Reddit access token is invalid or expired. Please re-authenticate.');
            } else if (error.response?.status === 403) {
                throw new Error('Access forbidden. Make sure the OAuth token has the "history" scope.');
            }
            
            throw new Error(`Failed to fetch saved posts: ${error.message}`);
        }
    }

    /**
     * Get current user information
     * 
     * @param accessToken - OAuth2 access token
     * @returns User information object
     * @throws Error if API request fails
     */
    async getCurrentUser(accessToken: string): Promise<any> {
        try {
            const response = await this.client.get('/api/v1/me', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('[Reddit API] Error fetching current user:'.red, error.response?.data || error.message);
            throw new Error(`Failed to fetch current user: ${error.message}`);
        }
    }

    /**
     * Submit a post to a subreddit
     * 
     * @param subreddit - Subreddit name (without r/)
     * @param title - Post title
     * @param text - Post text content (for text posts)
     * @param accessToken - OAuth2 access token
     * @returns Posted submission data
     * @throws Error if API request fails
     */
    async submitPost(
        subreddit: string,
        title: string,
        text: string,
        accessToken: string
    ): Promise<any> {
        try {
            const response = await this.client.post('/api/submit', {
                sr: subreddit,
                kind: 'self',
                title: title,
                text: text,
                api_type: 'json'
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('[Reddit API] Error submitting post:'.red, error.response?.data || error.message);
            throw new Error(`Failed to submit post: ${error.message}`);
        }
    }

    /**
     * Submit a comment to a post
     * 
     * @param postId - Full post ID (including t3_ prefix)
     * @param text - Comment text
     * @param accessToken - OAuth2 access token
     * @returns Posted comment data
     * @throws Error if API request fails
     */
    async submitComment(
        postId: string,
        text: string,
        accessToken: string
    ): Promise<any> {
        try {
            const response = await this.client.post('/api/comment', {
                thing_id: postId,
                text: text,
                api_type: 'json'
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('[Reddit API] Error submitting comment:'.red, error.response?.data || error.message);
            throw new Error(`Failed to submit comment: ${error.message}`);
        }
    }

    /**
     * Save a post
     * 
     * @param postId - Full post ID (including t3_ prefix)
     * @param accessToken - OAuth2 access token
     * @throws Error if API request fails
     */
    async savePost(postId: string, accessToken: string): Promise<void> {
        try {
            await this.client.post('/api/save', {
                id: postId
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
        } catch (error: any) {
            console.error('[Reddit API] Error saving post:'.red, error.response?.data || error.message);
            throw new Error(`Failed to save post: ${error.message}`);
        }
    }

    /**
     * Upvote a post or comment
     * 
     * @param thingId - Full ID of the thing to vote on (including prefix)
     * @param accessToken - OAuth2 access token
     * @throws Error if API request fails
     */
    async upvote(thingId: string, accessToken: string): Promise<void> {
        try {
            await this.client.post('/api/vote', {
                id: thingId,
                dir: 1
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
        } catch (error: any) {
            console.error('[Reddit API] Error upvoting:'.red, error.response?.data || error.message);
            throw new Error(`Failed to upvote: ${error.message}`);
        }
    }
}
