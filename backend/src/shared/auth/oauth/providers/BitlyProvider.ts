import { IOAuthProvider, OAuthUserProfile } from '../IOAuthProvider';

interface BitlyTokenResponse {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
}

interface BitlyUserEmail {
    email: string;
    is_primary: boolean;
    is_verified: boolean;
}

interface BitlyUserInfo {
    login: string;
    name?: string;
    emails?: BitlyUserEmail[];
    default_group_guid?: string;
    resource_guid?: string;
    account_status?: string;
    created?: string;
    modified?: string;
    avatar_url?: string;
}

/**
 * Bitly OAuth Provider
 * Handles OAuth authentication flow for Bitly API integration
 *
 * Required environment variables:
 * - BITLY_CLIENT_ID
 * - BITLY_CLIENT_SECRET
 * - BITLY_REDIRECT_URI
 */
export class BitlyProvider implements IOAuthProvider {
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly redirectUri: string;

    constructor() {
        this.clientId = process.env.BITLY_CLIENT_ID || '';
        this.clientSecret = process.env.BITLY_CLIENT_SECRET || '';
        this.redirectUri = process.env.BITLY_REDIRECT_URI || '';
    }

    getProviderName(): string {
        return 'bitly';
    }

    /**
     * Generate Bitly OAuth authorization URL
     * @param customState Optional state parameter for CSRF protection
     */
    getAuthUrl(customState?: string): string {
        const state = customState || 'bitly-oauth';
        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            redirect_uri: this.redirectUri,
            state
        });

        // Scopes are optional for Bitly; request read/write access if configured
        const scopes = process.env.BITLY_SCOPES || 'bitlink_edit bitlink_read';
        params.set('scope', scopes);

        return `https://bitly.com/oauth/authorize?${params.toString()}`;
    }

    /**
     * Handle OAuth callback and normalize user profile
     * @param code Authorization code from callback
     */
    async handleCallback(code: string): Promise<OAuthUserProfile> {
        try {
            const tokenData = await this.exchangeCodeForToken(code);
            const userInfo = await this.getUserInfo(tokenData.access_token);

            const userId = userInfo.resource_guid || userInfo.login;
            if (!userId) {
                throw new Error('Bitly user identifier missing from profile response');
            }

            const primaryEmail = userInfo.emails?.find(email => email.is_primary) || userInfo.emails?.[0];
            const email = primaryEmail?.email || `${userInfo.login}@bitly.local`;

            let firstName = '';
            let lastName = '';
            if (userInfo.name) {
                const nameParts = userInfo.name.trim().split(/\s+/);
                firstName = nameParts[0] || '';
                lastName = nameParts.slice(1).join(' ');
            }

            return {
                id: userId,
                email,
                firstName,
                lastName,
                avatarUrl: userInfo.avatar_url || '',
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token
            };
        } catch (error) {
            if (error instanceof Error)
                throw new Error(`Bitly OAuth callback error: ${error.message}`);
            throw new Error(`Bitly OAuth callback error: ${String(error)}`);
        }
    }

    /**
     * Exchange authorization code for access token
     */
    private async exchangeCodeForToken(code: string): Promise<BitlyTokenResponse> {
        const tokenUrl = 'https://api-ssl.bitly.com/oauth/access_token';
        const body = new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code,
            redirect_uri: this.redirectUri,
            grant_type: 'authorization_code'
        });

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body.toString()
        });

        const rawText = await response.text();
        if (!response.ok) {
            throw new Error(`Bitly token exchange failed: ${response.status} ${response.statusText} - ${rawText}`);
        }

        try {
            // Attempt JSON first (newer API responses)
            const json = JSON.parse(rawText) as BitlyTokenResponse;
            if (!json.access_token)
                throw new Error('Missing access_token in Bitly token response');
            return json;
        } catch {
            // Fallback for legacy form-encoded responses
            const parsed = new URLSearchParams(rawText);
            const accessToken = parsed.get('access_token');
            if (!accessToken) {
                throw new Error('Bitly token response missing access_token');
            }
            const refreshToken = parsed.get('refresh_token') || undefined;
            const expiresInString = parsed.get('expires_in');
            const expiresIn = expiresInString ? Number(expiresInString) : undefined;

            return {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_in: expiresIn
            };
        }
    }

    /**
     * Fetch Bitly user profile with access token
     */
    private async getUserInfo(accessToken: string): Promise<BitlyUserInfo> {
        const response = await fetch('https://api-ssl.bitly.com/v4/user', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch Bitly user info: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return await response.json() as BitlyUserInfo;
    }

    /**
     * Check if Bitly OAuth is properly configured
     */
    isConfigured(): boolean {
        return Boolean(this.clientId && this.clientSecret && this.redirectUri);
    }

    /**
     * Return configuration status breakdown
     */
    getConfigStatus(): {
        hasClientId: boolean;
        hasClientSecret: boolean;
        hasRedirectUri: boolean;
        isValid: boolean;
    } {
        const hasClientId = !!this.clientId;
        const hasClientSecret = !!this.clientSecret;
        const hasRedirectUri = !!this.redirectUri;

        return {
            hasClientId,
            hasClientSecret,
            hasRedirectUri,
            isValid: hasClientId && hasClientSecret && hasRedirectUri
        };
    }
}
