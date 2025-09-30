import { IOAuthProvider, OAuthUserProfile } from '../IOAuthProvider';

interface DropboxTokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    uid: string;
    account_id: string;
}

interface DropboxUserInfo {
    account_id: string;
    name: {
        given_name: string;
        surname: string;
        familiar_name: string;
        display_name: string;
        abbreviated_name: string;
    };
    email: string;
    email_verified: boolean;
    profile_photo_url?: string;
    disabled: boolean;
    country: string;
    locale: string;
    referral_link: string;
    is_paired: boolean;
    account_type: {
        '.tag': string;
    };
    root_info: {
        '.tag': string;
        root_namespace_id: string;
        home_namespace_id: string;
    };
}

interface DropboxErrorResponse {
    error: string;
    error_description?: string;
}

export class DropboxProvider implements IOAuthProvider {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.DROPBOX_CLIENT_ID || '';
        this.clientSecret = process.env.DROPBOX_CLIENT_SECRET || '';
        this.redirectUri = process.env.DROPBOX_REDIRECT_URI || '';
    }

    getProviderName(): string {
        return 'dropbox';
    }

    getAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            state: 'dropbox-oauth',
            token_access_type: 'offline' // Pour obtenir un refresh token
        });

        return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
    }

    private async exchangeCodeForToken(code: string): Promise<DropboxTokenResponse> {
        const tokenUrl = 'https://api.dropboxapi.com/oauth2/token';
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
                    'Accept': 'application/json'
                },
                body: params.toString(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorData: DropboxErrorResponse;
                try {
                    errorData = JSON.parse(errorText) as DropboxErrorResponse;
                } catch {
                    throw new Error(`Dropbox token exchange failed: ${response.status} ${response.statusText}`);
                }
                throw new Error(`Dropbox token exchange failed: ${errorData.error} - ${errorData.error_description || 'No description'}`);
            }

            const tokenData = await response.json() as DropboxTokenResponse;
            return tokenData;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Dropbox token exchange failed: ${String(error)}`);
        }
    }

    private async getUserInfo(accessToken: string): Promise<DropboxUserInfo> {
        try {
            const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(null)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get Dropbox user info: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const userInfo = await response.json() as DropboxUserInfo;
            return userInfo;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Failed to get Dropbox user info: ${String(error)}`);
        }
    }

    async handleCallback(code: string): Promise<OAuthUserProfile> {
        try {
            const tokenData = await this.exchangeCodeForToken(code);
            const userInfo = await this.getUserInfo(tokenData.access_token);

            if (!userInfo.email) {
                throw new Error('Dropbox user email not available');
            }

            if (!userInfo.email_verified) {
                throw new Error('Dropbox user email not verified');
            }

            if (userInfo.disabled) {
                throw new Error('Dropbox account is disabled');
            }

            return {
                id: userInfo.account_id,
                email: userInfo.email,
                firstName: userInfo.name.given_name || '',
                lastName: userInfo.name.surname || '',
                avatarUrl: userInfo.profile_photo_url || '',
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
            };
        } catch (error) {
            if (error instanceof Error)
                throw new Error(`Dropbox OAuth callback error: ${error.message}`);
            throw new Error(`Dropbox OAuth callback error: ${String(error)}`);
        }
    }

    /**
     * Validate that Dropbox OAuth is properly configured
     */
    isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret && this.redirectUri);
    }

    /**
     * Get Dropbox OAuth configuration status
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
