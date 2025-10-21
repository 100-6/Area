import { IOAuthProvider, OAuthUserProfile } from '../IOAuthProvider';

interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
}

interface SpotifyUserInfo {
    id: string;
    display_name: string;
    email: string;
    images: Array<{
        url: string;
        height: number;
        width: number;
    }>;
    country: string;
    product: string; // premium, free, etc.
}

interface SpotifyErrorResponse {
    error: {
        status: number;
        message: string;
    };
}

/**
 * Spotify OAuth Provider
 * Handles OAuth authentication flow for Spotify API integration
 * 
 * Required environment variables:
 * - SPOTIFY_CLIENT_ID
 * - SPOTIFY_CLIENT_SECRET
 * - SPOTIFY_REDIRECT_URI
 */
export class SpotifyProvider implements IOAuthProvider {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.SPOTIFY_CLIENT_ID || '';
        this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
        this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || '';
    }

    getProviderName(): string {
        return 'spotify';
    }

    /**
     * Generate Spotify OAuth authorization URL
     * @param customState - Optional state parameter for CSRF protection
     * @returns Authorization URL
     */
    getAuthUrl(customState?: string): string {
        const state = customState || 'spotify-oauth';
        const scopes = [
            'user-read-private',
            'user-read-email',
            'user-library-read',
            'user-library-modify',
            'playlist-read-private',
            'playlist-read-collaborative',
            'playlist-modify-public',
            'playlist-modify-private',
            'user-read-playback-state',
            'user-modify-playback-state',
            'user-read-currently-playing',
            'user-read-recently-played',
            'user-top-read'
        ];

        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            redirect_uri: this.redirectUri,
            scope: scopes.join(' '),
            state: state,
            show_dialog: 'false'
        });

        return `https://accounts.spotify.com/authorize?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     * @param code - Authorization code from callback
     * @returns Token response with access_token and refresh_token
     */
    private async exchangeCodeForToken(code: string): Promise<SpotifyTokenResponse> {
        const tokenUrl = 'https://accounts.spotify.com/api/token';
        
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
                    'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
                },
                body: params.toString(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorData: SpotifyErrorResponse;
                try {
                    errorData = JSON.parse(errorText) as SpotifyErrorResponse;
                } catch {
                    throw new Error(`Spotify token exchange failed: ${response.status} ${response.statusText}`);
                }
                throw new Error(`Spotify token exchange failed: ${errorData.error.message}`);
            }

            const tokenData = await response.json() as SpotifyTokenResponse;
            return tokenData;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Spotify token exchange failed: ${String(error)}`);
        }
    }

    /**
     * Get user profile from Spotify API
     * @param accessToken - Access token from OAuth flow
     * @returns Spotify user information
     */
    private async getUserInfo(accessToken: string): Promise<SpotifyUserInfo> {
        try {
            const response = await fetch('https://api.spotify.com/v1/me', {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get Spotify user info: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const userInfo = await response.json() as SpotifyUserInfo;
            return userInfo;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Failed to get Spotify user info: ${String(error)}`);
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
                throw new Error('Spotify user email not available. User may not have granted email permission.');
            }

            // Parse display name into first and last name
            const nameParts = userInfo.display_name ? userInfo.display_name.split(' ') : [userInfo.id];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            // Get largest avatar image
            const avatarUrl = userInfo.images && userInfo.images.length > 0 
                ? userInfo.images[0].url 
                : '';

            return {
                id: userInfo.id,
                email: userInfo.email,
                firstName: firstName,
                lastName: lastName,
                avatarUrl: avatarUrl,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
            };
        } catch (error) {
            if (error instanceof Error)
                throw new Error(`Spotify OAuth callback error: ${error.message}`);
            throw new Error(`Spotify OAuth callback error: ${String(error)}`);
        }
    }

    /**
     * Validate that Spotify OAuth is properly configured
     * @returns true if all required environment variables are set
     */
    isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret && this.redirectUri);
    }

    /**
     * Get Spotify OAuth configuration status
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
