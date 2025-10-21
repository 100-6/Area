import crypto from 'crypto';
import { IOAuthProvider } from '../IOAuthProvider';

interface OutlookTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: string;
    id_token?: string;
}

interface OutlookUserInfo {
    id: string;
    mail: string;
    displayName: string;
    givenName: string;
    surname: string;
}

interface OutlookErrorResponse {
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
 * Outlook OAuth Provider
 * Uses Microsoft OAuth with Outlook-specific scopes
 * Uses OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET with Microsoft Graph permissions
 */
export class OutlookProvider implements IOAuthProvider {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.OUTLOOK_CLIENT_ID || '';
        this.clientSecret = process.env.OUTLOOK_CLIENT_SECRET || '';
        this.redirectUri = process.env.OUTLOOK_REDIRECT_URI || '';
    }

    getProviderName(): string {
        return 'outlook';
    }

    getAuthUrl(customState?: string): string {
        const state = customState || crypto.randomBytes(32).toString('hex');

        console.log('[OutlookProvider] Generating auth URL...'.cyan);
        console.log(`  Client ID: ${this.clientId ? this.clientId.substring(0, 10) + '...' : 'MISSING'}`.gray);
        console.log(`  Redirect URI: ${this.redirectUri}`.gray);
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: 'openid email profile offline_access User.Read Mail.Send Mail.ReadWrite Calendars.ReadWrite',
            prompt: 'consent',
            state: state,
        });
        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
        console.log(`[OutlookProvider] ✓ Auth URL generated`.green);
        return authUrl;
    }

    private async exchangeCodeForToken(code: string): Promise<OutlookTokenResponse> {
        console.log('[OutlookProvider] Exchanging code for token...'.cyan);

        const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
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
                console.error('[OutlookProvider] Token exchange failed:'.red, errorText);
                let errorData: OutlookErrorResponse;
                try {
                    errorData = JSON.parse(errorText) as OutlookErrorResponse;
                } catch {
                    throw new Error(`Outlook token exchange failed: ${response.status} ${response.statusText}`);
                }
                throw new Error(`Outlook token exchange failed: ${errorData.error} - ${errorData.error_description || 'No description'}`);
            }
            const tokenData = await response.json() as OutlookTokenResponse;
            console.log('[OutlookProvider] ✓ Token received, scopes:'.green, tokenData.scope);
            return tokenData;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Outlook token exchange failed: ${String(error)}`);
        }
    }

    private async getUserInfo(accessToken: string): Promise<OutlookUserInfo> {
        try {
            const response = await fetch('https://graph.microsoft.com/v1.0/me',
                { headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get Outlook user info: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const userInfo = await response.json() as OutlookUserInfo;
            return userInfo;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Failed to get Outlook user info: ${String(error)}`);
        }
    }

    async handleCallback(code: string): Promise<OAuthUserProfile> {
        try {
            const tokenData = await this.exchangeCodeForToken(code);
            const userInfo = await this.getUserInfo(tokenData.access_token);

            return {
                id: userInfo.id,
                email: userInfo.mail,
                firstName: userInfo.givenName || '',
                lastName: userInfo.surname || '',
                avatarUrl: '',
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
            };
        } catch (error) {
            if (error instanceof Error)
                throw new Error(`Outlook OAuth callback error: ${error.message}`);
            throw new Error(`Outlook OAuth callback error: ${String(error)}`);
        }
    }

    /**
     * Validate that Outlook OAuth is properly configured
     */
    isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret && this.redirectUri);
    }

    /**
     * Get Outlook OAuth configuration status
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
