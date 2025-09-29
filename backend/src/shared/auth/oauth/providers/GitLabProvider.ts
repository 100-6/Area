import { IOAuthProvider, OAuthUserProfile } from '../IOAuthProvider';

interface GitLabTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
}

interface GitLabUserInfo {
    id: number;
    username: string;
    name: string;
    email: string;
    avatar_url: string;
    web_url: string;
    created_at: string;
    bio: string;
    location: string;
}

interface GitLabErrorResponse {
    message: string;
    error?: string;
    error_description?: string;
}

export class GitLabProvider implements IOAuthProvider {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;
    private baseUrl: string;

    constructor() {
        this.clientId = process.env.GITLAB_CLIENT_ID || '';
        this.clientSecret = process.env.GITLAB_CLIENT_SECRET || '';
        this.redirectUri = process.env.GITLAB_REDIRECT_URI || '';
        this.baseUrl = process.env.GITLAB_BASE_URL || 'https://gitlab.com';
    }

    getProviderName(): string {
        return 'gitlab';
    }

    getAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: 'read_user',
            state: 'gitlab-oauth'
        });

        return `${this.baseUrl}/oauth/authorize?${params.toString()}`;
    }

    private async exchangeCodeForToken(code: string): Promise<GitLabTokenResponse> {
        const tokenUrl = `${this.baseUrl}/oauth/token`;
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
                let errorData: GitLabErrorResponse;
                try {
                    errorData = JSON.parse(errorText) as GitLabErrorResponse;
                } catch {
                    throw new Error(`GitLab token exchange failed: ${response.status} ${response.statusText}`);
                }
                throw new Error(`GitLab token exchange failed: ${errorData.error || errorData.message}`);
            }

            const tokenData = await response.json() as GitLabTokenResponse;
            return tokenData;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`GitLab token exchange failed: ${String(error)}`);
        }
    }

    private async getUserInfo(accessToken: string): Promise<GitLabUserInfo> {
        try {
            const response = await fetch(`${this.baseUrl}/api/v4/user`, {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get GitLab user info: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const userInfo = await response.json() as GitLabUserInfo;
            return userInfo;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Failed to get GitLab user info: ${String(error)}`);
        }
    }

    async handleCallback(code: string): Promise<OAuthUserProfile> {
        try {
            const tokenData = await this.exchangeCodeForToken(code);
            const userInfo = await this.getUserInfo(tokenData.access_token);

            if (!userInfo.email) {
                throw new Error('GitLab user email not available');
            }

            // Parse name into first and last name
            const nameParts = userInfo.name ? userInfo.name.split(' ') : [userInfo.username];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            return {
                id: userInfo.id.toString(),
                email: userInfo.email,
                firstName: firstName,
                lastName: lastName,
                avatarUrl: userInfo.avatar_url || '',
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
            };
        } catch (error) {
            if (error instanceof Error)
                throw new Error(`GitLab OAuth callback error: ${error.message}`);
            throw new Error(`GitLab OAuth callback error: ${String(error)}`);
        }
    }

    /**
     * Validate that GitLab OAuth is properly configured
     */
    isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret && this.redirectUri);
    }

    /**
     * Get GitLab OAuth configuration status
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
