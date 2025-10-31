import { IOAuthProvider, OAuthUserProfile } from '../IOAuthProvider';

interface StravaTokenResponse {
    token_type: string;
    expires_at: number;
    expires_in: number;
    refresh_token: string;
    access_token: string;
    athlete: {
        id: number;
        username: string;
        resource_state: number;
        firstname: string;
        lastname: string;
        city: string;
        state: string;
        country: string;
        sex: string;
        premium: boolean;
        summit: boolean;
        created_at: string;
        updated_at: string;
        badge_type_id: number;
        profile_medium: string;
        profile: string;
        friend: null;
        follower: null;
    };
}

interface StravaErrorResponse {
    message: string;
    errors: Array<{
        resource: string;
        field: string;
        code: string;
    }>;
}

/**
 * Strava OAuth Provider
 * Handles OAuth authentication flow for Strava API integration
 * 
 * Required environment variables:
 * - STRAVA_CLIENT_ID
 * - STRAVA_CLIENT_SECRET
 * - STRAVA_REDIRECT_URI
 */
export class StravaProvider implements IOAuthProvider {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.STRAVA_CLIENT_ID || '';
        this.clientSecret = process.env.STRAVA_CLIENT_SECRET || '';
        this.redirectUri = process.env.STRAVA_REDIRECT_URI || '';
    }

    getProviderName(): string {
        return 'strava';
    }

    /**
     * Generate Strava OAuth authorization URL
     * @param customState - Optional state parameter for CSRF protection
     * @returns Authorization URL
     */
    getAuthUrl(customState?: string): string {
        const state = customState || 'strava-oauth';
        const scopes = [
            'read',
            'activity:read',
            'activity:read_all',
            'activity:write',
            'profile:read_all'
        ];

        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            redirect_uri: this.redirectUri,
            approval_prompt: 'auto',
            scope: scopes.join(','),
            state: state
        });

        return `https://www.strava.com/oauth/authorize?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     * @param code - Authorization code from callback
     * @returns Token response with access_token and refresh_token
     */
    private async exchangeCodeForToken(code: string): Promise<StravaTokenResponse> {
        const tokenUrl = 'https://www.strava.com/oauth/token';
        
        try {
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    code: code,
                    grant_type: 'authorization_code'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorData: StravaErrorResponse;
                try {
                    errorData = JSON.parse(errorText) as StravaErrorResponse;
                    throw new Error(`Strava token exchange failed: ${errorData.message}`);
                } catch {
                    throw new Error(`Strava token exchange failed: ${response.status} ${response.statusText}`);
                }
            }

            const tokenData = await response.json() as StravaTokenResponse;
            return tokenData;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Strava token exchange failed: ${String(error)}`);
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
            const athlete = tokenData.athlete;

            // Strava doesn't provide email in the athlete object by default
            // We'll use the athlete ID as a unique identifier
            const email = athlete.username ? `${athlete.username}@strava.local` : `${athlete.id}@strava.local`;

            return {
                id: athlete.id.toString(),
                email: email,
                firstName: athlete.firstname || '',
                lastName: athlete.lastname || '',
                avatarUrl: athlete.profile || athlete.profile_medium || '',
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
            };
        } catch (error) {
            if (error instanceof Error)
                throw new Error(`Strava OAuth callback error: ${error.message}`);
            throw new Error(`Strava OAuth callback error: ${String(error)}`);
        }
    }

    /**
     * Validate that Strava OAuth is properly configured
     * @returns true if all required environment variables are set
     */
    isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret && this.redirectUri);
    }

    /**
     * Get Strava OAuth configuration status
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
