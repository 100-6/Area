import crypto from 'crypto';
import { IOAuthProvider } from '../IOAuthProvider';

interface GmailTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: string;
    id_token?: string;
}

interface GmailUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
}

interface GmailErrorResponse {
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

/**
 * Gmail OAuth Provider
 * Uses Google OAuth with Gmail-specific scopes
 * Reuses GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET but with Gmail permissions
 */
export class GmailProvider implements IOAuthProvider {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.GOOGLE_CLIENT_ID || '';
        this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
        this.redirectUri = process.env.GMAIL_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || '';
    }

    getProviderName(): string {
        return 'gmail';
    }

    getAuthUrl(customState?: string): string {
        const state = customState || crypto.randomBytes(32).toString('hex');
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: 'openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.labels',
            prompt: 'consent',
            access_type: 'offline',
            state: state,
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    private async exchangeCodeForToken(code: string): Promise<GmailTokenResponse> {
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
                let errorData: GmailErrorResponse;
                try {
                    errorData = JSON.parse(errorText) as GmailErrorResponse;
                } catch {
                    throw new Error(`Gmail token exchange failed: ${response.status} ${response.statusText}`);
                }
                throw new Error(`Gmail token exchange failed: ${errorData.error} - ${errorData.error_description || 'No description'}`);
            }
            const tokenData = await response.json() as GmailTokenResponse;
            return tokenData;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Gmail token exchange failed: ${String(error)}`);
        }
    }

    private async getUserInfo(accessToken: string): Promise<GmailUserInfo> {
        try {
            const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get Gmail user info: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const userInfo = await response.json() as GmailUserInfo;
            return userInfo;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Failed to get Gmail user info: ${String(error)}`);
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
                throw new Error(`Gmail OAuth callback error: ${error.message}`);
            throw new Error(`Gmail OAuth callback error: ${String(error)}`);
        }
    }

    /**
     * Validate that Gmail OAuth is properly configured
     */
    isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret && this.redirectUri);
    }

    /**
     * Get Gmail OAuth configuration status
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
