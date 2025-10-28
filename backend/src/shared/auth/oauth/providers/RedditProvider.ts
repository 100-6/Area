import { IOAuthProvider, OAuthUserProfile } from '../IOAuthProvider';

interface RedditTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
}

interface RedditUserInfo {
    id: string;
    name: string;
    icon_img: string;
    created_utc: number;
    link_karma: number;
    comment_karma: number;
}

interface RedditErrorResponse {
    error: string;
    message?: string;
}

/**
 * Reddit OAuth Provider
 * Handles OAuth authentication flow for Reddit API integration
 * 
 * Required environment variables:
 * - REDDIT_CLIENT_ID
 * - REDDIT_CLIENT_SECRET
 * - REDDIT_REDIRECT_URI
 */
export class RedditProvider implements IOAuthProvider {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.REDDIT_CLIENT_ID || '';
        this.clientSecret = process.env.REDDIT_CLIENT_SECRET || '';
        this.redirectUri = process.env.REDDIT_REDIRECT_URI || '';
    }

    getProviderName(): string {
        return 'reddit';
    }

    /**
     * Generate Reddit OAuth authorization URL
     * @param customState - Optional state parameter for CSRF protection
     * @returns Authorization URL
     */
    getAuthUrl(customState?: string): string {
        const state = customState || 'reddit-oauth';
        const scopes = [
            'identity',
            'read',
            'save',
            'submit',
            'vote',
            'history',
            'mysubreddits'
        ];

        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            redirect_uri: this.redirectUri,
            scope: scopes.join(' '),
            state: state,
            duration: 'permanent'
        });

        return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     * @param code - Authorization code from callback
     * @returns Token response with access_token and refresh_token
     */
    private async exchangeCodeForToken(code: string): Promise<RedditTokenResponse> {
        const tokenUrl = 'https://www.reddit.com/api/v1/access_token';
        
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this.redirectUri,
        });

        try {
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
                    'User-Agent': 'Mirror-Area/1.0'
                },
                body: params.toString(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorData: RedditErrorResponse;
                try {
                    errorData = JSON.parse(errorText) as RedditErrorResponse;
                } catch {
                    throw new Error(`Reddit token exchange failed: ${response.status} ${response.statusText}`);
                }
                throw new Error(`Reddit token exchange failed: ${errorData.error}`);
            }

            const tokenData = await response.json() as RedditTokenResponse;
            return tokenData;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Reddit token exchange failed: ${String(error)}`);
        }
    }

    /**
     * Get user profile from Reddit API
     * @param accessToken - Access token from OAuth flow
     * @returns Reddit user information
     */
    private async getUserInfo(accessToken: string): Promise<RedditUserInfo> {
        try {
            const response = await fetch('https://oauth.reddit.com/api/v1/me', {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'User-Agent': 'Mirror-Area/1.0'
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get Reddit user info: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const userInfo = await response.json() as RedditUserInfo;
            return userInfo;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Failed to get Reddit user info: ${String(error)}`);
        }
    }

    /**
     * Handle OAuth callback and return user profile
     * @param code - Authorization code from callback
     * @returns Normalized user profile
     */
    async handleCallback(code: string): Promise<OAuthUserProfile> {
        try {
            const tokenData = await this.exchangeCodeForToken(code);
            const userInfo = await this.getUserInfo(tokenData.access_token);

            // Reddit doesn't provide email in the API response
            // Use username@reddit.local as a placeholder
            const email = `${userInfo.name}@reddit.local`;

            // Clean up icon URL (remove query parameters)
            let avatarUrl = '';
            if (userInfo.icon_img) {
                try {
                    const url = new URL(userInfo.icon_img);
                    avatarUrl = `${url.protocol}//${url.host}${url.pathname}`;
                } catch {
                    avatarUrl = userInfo.icon_img;
                }
            }

            return {
                id: userInfo.id,
                email: email,
                firstName: userInfo.name,
                lastName: '',
                avatarUrl: avatarUrl,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
            };
        } catch (error) {
            if (error instanceof Error)
                throw new Error(`Reddit OAuth callback error: ${error.message}`);
            throw new Error(`Reddit OAuth callback error: ${String(error)}`);
        }
    }

    /**
     * Validate that Reddit OAuth is properly configured
     * @returns true if all required environment variables are set
     */
    isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret && this.redirectUri);
    }

    /**
     * Get Reddit OAuth configuration status
     * @returns Configuration status object
     */
    getConfigStatus(): { hasClientId: boolean; hasClientSecret: boolean; hasRedirectUri: boolean; isValid: boolean; } {
        const hasClientId = !!this.clientId;
        const hasClientSecret = !!this.clientSecret;
        const hasRedirectUri = !!this.redirectUri;

        return {
            hasClientId,
            hasClientSecret,
            hasRedirectUri,
            isValid: hasClientId && hasClientSecret && hasRedirectUri,
        };
    }
}
