import { IOAuthProvider, OAuthUserProfile } from '../IOAuthProvider';

interface TwitchTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope: string[];
}

interface TwitchUserInfo {
    id: string;
    login: string;
    display_name: string;
    type: string;
    broadcaster_type: string;
    description: string;
    profile_image_url: string;
    offline_image_url: string;
    email: string;
    created_at: string;
}

interface TwitchUserResponse {
    data: TwitchUserInfo[];
}

interface TwitchErrorResponse {
    error: string;
    status: number;
    message: string;
}

/**
 * Twitch OAuth Provider
 * Handles OAuth authentication flow for Twitch API integration
 *
 * Required environment variables:
 * - TWITCH_CLIENT_ID
 * - TWITCH_CLIENT_SECRET
 * - TWITCH_REDIRECT_URI
 */
export class TwitchProvider implements IOAuthProvider {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.TWITCH_CLIENT_ID || '';
        this.clientSecret = process.env.TWITCH_CLIENT_SECRET || '';
        this.redirectUri = process.env.TWITCH_REDIRECT_URI || '';
    }

    getProviderName(): string {
        return 'twitch';
    }

    /**
     * Generate Twitch OAuth authorization URL
     * @param customState - Optional state parameter for CSRF protection
     * @returns Authorization URL
     */
    getAuthUrl(customState?: string): string {
        const state = customState || 'twitch-oauth';
        const scopes = [
            'user:read:email',
            'user:read:follows',
            'user:read:subscriptions',
            'channel:read:subscriptions',
            'channel:read:stream_key',
            'clips:edit',
            'user:edit',
            'user:edit:broadcast',
            'moderator:read:followers',  // Required to read channel followers
            'user:write:chat',          // Needed to send chat messages
            'channel:manage:broadcast', // Update stream title & metadata
            'channel:manage:polls',     // Create and manage polls
            'channel:manage:predictions', // Create and resolve predictions
            'moderator:manage:chat_settings', // Update chat settings
            'moderator:manage:banned_users',  // Ban or timeout users
            'moderator:manage:shoutouts' // Send shoutouts
        ];

        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: scopes.join(' '),
            state: state,
            force_verify: 'false'
        });

        return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     * @param code - Authorization code from callback
     * @returns Token response with access_token and refresh_token
     */
    private async exchangeCodeForToken(code: string): Promise<TwitchTokenResponse> {
        const tokenUrl = 'https://id.twitch.tv/oauth2/token';

        const params = new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: this.redirectUri,
        });

        try {
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorData: TwitchErrorResponse;
                try {
                    errorData = JSON.parse(errorText) as TwitchErrorResponse;
                } catch {
                    throw new Error(`Twitch token exchange failed: ${response.status} ${response.statusText}`);
                }
                throw new Error(`Twitch token exchange failed: ${errorData.message}`);
            }

            const tokenData = await response.json() as TwitchTokenResponse;
            return tokenData;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Twitch token exchange failed: ${String(error)}`);
        }
    }

    /**
     * Get user profile from Twitch API
     * @param accessToken - Access token from OAuth flow
     * @returns Twitch user information
     */
    private async getUserInfo(accessToken: string): Promise<TwitchUserInfo> {
        try {
            const response = await fetch('https://api.twitch.tv/helix/users', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Client-Id': this.clientId,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get Twitch user info: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const userResponse = await response.json() as TwitchUserResponse;

            if (!userResponse.data || userResponse.data.length === 0) {
                throw new Error('No user data returned from Twitch API');
            }

            return userResponse.data[0];
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Failed to get Twitch user info: ${String(error)}`);
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

            if (!userInfo.email) {
                throw new Error('Twitch user email not available. User may not have granted email permission.');
            }

            // Parse display name into first and last name
            const nameParts = userInfo.display_name ? userInfo.display_name.split(' ') : [userInfo.login];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            return {
                id: userInfo.id,
                email: userInfo.email,
                firstName: firstName,
                lastName: lastName,
                avatarUrl: userInfo.profile_image_url || '',
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
            };
        } catch (error) {
            if (error instanceof Error)
                throw new Error(`Twitch OAuth callback error: ${error.message}`);
            throw new Error(`Twitch OAuth callback error: ${String(error)}`);
        }
    }

    /**
     * Validate that Twitch OAuth is properly configured
     * @returns true if all required environment variables are set
     */
    isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret && this.redirectUri);
    }

    /**
     * Get Twitch OAuth configuration status
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
