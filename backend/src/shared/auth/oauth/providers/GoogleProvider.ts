import crypto from 'crypto';
import { IOAuthProvider } from '../IOAuthProvider';

interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: string;
    id_token?: string;
}

interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
}

interface GoogleErrorResponse {
    error: string;
    error_description?: string;
}

interface OAuthUserProfile {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    accessToken: string;
    refreshToken?: string;
}

export class GoogleProvider implements IOAuthProvider {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.GOOGLE_CLIENT_ID || '';
        this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
        this.redirectUri = process.env.GOOGLE_REDIRECT_URI || '';
    }

    getProviderName(): string {
        return 'google';
    }

    getAuthUrl(customState?: string): string {
        const state = customState || crypto.randomBytes(32).toString('hex');
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            state: state,
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    private async exchangeCodeForToken(code: string): Promise<GoogleTokenResponse> {
        const tokenUrl = 'https://oauth2.googleapis.com/token';
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
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });
            if (!response.ok) {
                const errorText = await response.text();
                let errorData: GoogleErrorResponse;
                try {
                    errorData = JSON.parse(errorText) as GoogleErrorResponse;
                } catch {
                    throw new Error(`Google token exchange failed: ${response.status} ${response.statusText}`);
                }
                throw new Error(`Google token exchange failed: ${errorData.error} - ${errorData.error_description || 'No description'}`);
            }
            const tokenData = await response.json() as GoogleTokenResponse;
            return tokenData;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Google token exchange failed: ${String(error)}`);
        }
    }

    private async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
        try {
            const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get Google user info: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const userInfo = await response.json() as GoogleUserInfo;
            return userInfo;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Failed to get Google user info: ${String(error)}`);
        }
    }

    async handleCallback(code: string): Promise<OAuthUserProfile> {
        try {
            const tokenData = await this.exchangeCodeForToken(code);
            const userInfo = await this.getUserInfo(tokenData.access_token);

            return {
                id: userInfo.id,
                email: userInfo.email,
                firstName: userInfo.given_name || '',
                lastName: userInfo.family_name || '',
                avatarUrl: userInfo.picture || '',
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
            };
        } catch (error) {
            if (error instanceof Error)
                throw new Error(`Google OAuth callback error: ${error.message}`);
            throw new Error(`Google OAuth callback error: ${String(error)}`);
        }
    }

    /**
     * Validate that Google OAuth is properly configured
     */
    isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret && this.redirectUri);
    }

    /**
     * Get Google OAuth configuration status
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
