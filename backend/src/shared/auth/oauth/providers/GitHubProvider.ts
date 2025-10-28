import { IOAuthProvider, OAuthUserProfile } from '../IOAuthProvider';

interface GitHubTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
}

interface GitHubUserInfo {
    id: number;
    login: string;
    name: string;
    email: string;
    avatar_url: string;
    company: string;
    location: string;
}

interface GitHubEmail {
    email: string;
    primary: boolean;
    verified: boolean;
    visibility: string;
}

interface GitHubErrorResponse {
    message: string;
    documentation_url?: string;
}

export class GitHubProvider implements IOAuthProvider {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.GITHUB_CLIENT_ID || '';
        this.clientSecret = process.env.GITHUB_CLIENT_SECRET || '';
        this.redirectUri = process.env.GITHUB_REDIRECT_URI || '';
    }

    getProviderName(): string {
        return 'github';
    }

    getAuthUrl(customState?: string): string {
        const state = customState || 'github-oauth';
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: 'repo read:org user:email',
            state: state
        });

        return `https://github.com/login/oauth/authorize?${params.toString()}`;
    }

    private async exchangeCodeForToken(code: string): Promise<GitHubTokenResponse> {
        const tokenUrl = 'https://github.com/login/oauth/access_token';
        const params = new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code: code,
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
                let errorData: GitHubErrorResponse;
                try {
                    errorData = JSON.parse(errorText) as GitHubErrorResponse;
                } catch {
                    throw new Error(`GitHub token exchange failed: ${response.status} ${response.statusText}`);
                }
                throw new Error(`GitHub token exchange failed: ${errorData.message}`);
            }

            const tokenData = await response.json() as GitHubTokenResponse;
            return tokenData;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`GitHub token exchange failed: ${String(error)}`);
        }
    }

    private async getUserInfo(accessToken: string): Promise<GitHubUserInfo> {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'User-Agent': 'area-backend',
                    'Accept': 'application/vnd.github.v3+json'
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get GitHub user info: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const userInfo = await response.json() as GitHubUserInfo;
            return userInfo;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Failed to get GitHub user info: ${String(error)}`);
        }
    }

    private async getUserEmails(accessToken: string): Promise<GitHubEmail[]> {
        try {
            const response = await fetch('https://api.github.com/user/emails', {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'User-Agent': 'area-backend',
                    'Accept': 'application/vnd.github.v3+json'
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get GitHub user emails: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const emails = await response.json() as GitHubEmail[];
            return emails;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Failed to get GitHub user emails: ${String(error)}`);
        }
    }

    async handleCallback(code: string): Promise<OAuthUserProfile> {
        try {
            const tokenData = await this.exchangeCodeForToken(code);
            const userInfo = await this.getUserInfo(tokenData.access_token);

            // Get primary email if user's public email is not available
            let email = userInfo.email;
            if (!email) {
                const emails = await this.getUserEmails(tokenData.access_token);
                const primaryEmail = emails.find(e => e.primary && e.verified);
                email = primaryEmail?.email || '';
            }

            if (!email) {
                throw new Error('GitHub user email not available or not verified');
            }

            // Parse name into first and last name
            const nameParts = userInfo.name ? userInfo.name.split(' ') : [userInfo.login];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            return {
                id: userInfo.id.toString(),
                email: email,
                firstName: firstName,
                lastName: lastName,
                avatarUrl: userInfo.avatar_url || '',
                accessToken: tokenData.access_token,
                refreshToken: undefined, // GitHub doesn't provide refresh tokens in OAuth flow
            };
        } catch (error) {
            if (error instanceof Error)
                throw new Error(`GitHub OAuth callback error: ${error.message}`);
            throw new Error(`GitHub OAuth callback error: ${String(error)}`);
        }
    }

    /**
     * Validate that GitHub OAuth is properly configured
     */
    isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret && this.redirectUri);
    }

    /**
     * Get GitHub OAuth configuration status
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
