import crypto from 'crypto';
import { IOAuthProvider, OAuthUserProfile } from '../IOAuthProvider';

interface DiscordTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}

interface DiscordUserInfo {
    id: string;
    username: string;
    discriminator: string;
    global_name?: string;
    avatar?: string;
    email?: string;
    verified?: boolean;
}

interface DiscordErrorResponse {
    error: string;
    error_description?: string;
}

export class DiscordProvider implements IOAuthProvider {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.DISCORD_CLIENT_ID || '';
        this.clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
        this.redirectUri = process.env.DISCORD_REDIRECT_URI || '';
    }

    getProviderName(): string {
        return 'discord';
    }

    getAuthUrl(customState?: string): string {
        const state = customState || crypto.randomBytes(32).toString('hex');
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: 'identify email guilds',
            state: state,
        });

        return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    }

    private async exchangeCodeForToken(code: string): Promise<DiscordTokenResponse> {
        const tokenUrl = 'https://discord.com/api/oauth2/token';
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
                let errorData: DiscordErrorResponse;
                try {
                    errorData = JSON.parse(errorText) as DiscordErrorResponse;
                } catch {
                    throw new Error(`Discord token exchange failed: ${response.status} ${response.statusText}`);
                }
                throw new Error(`Discord token exchange failed: ${errorData.error} - ${errorData.error_description || 'No description'}`);
            }
            const tokenData = await response.json() as DiscordTokenResponse;
            return tokenData;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Discord token exchange failed: ${String(error)}`);
        }
    }

    private async getUserInfo(accessToken: string): Promise<DiscordUserInfo> {
        try {
            const response = await fetch('https://discord.com/api/users/@me', {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get Discord user info: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const userInfo = await response.json() as DiscordUserInfo;
            return userInfo;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Failed to get Discord user info: ${String(error)}`);
        }
    }

    async handleCallback(code: string): Promise<OAuthUserProfile> {
        try {
            const tokenData = await this.exchangeCodeForToken(code);
            const userInfo = await this.getUserInfo(tokenData.access_token);
            const displayName = userInfo.global_name || userInfo.username;
            const avatarUrl = userInfo.avatar ? `https://cdn.discordapp.com/avatars/${userInfo.id}/${userInfo.avatar}.png` : '';

            return {
                id: userInfo.id,
                email: userInfo.email || `${userInfo.username}@discord.local`,
                firstName: displayName.split(' ')[0] || userInfo.username,
                lastName: displayName.split(' ').slice(1).join(' ') || '',
                avatarUrl: avatarUrl,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
            };
        } catch (error) {
            if (error instanceof Error)
                throw new Error(`Discord OAuth callback error: ${error.message}`);
            throw new Error(`Discord OAuth callback error: ${String(error)}`);
        }
    }

    /**
     * Validate that Discord OAuth is properly configured
     */
    isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret && this.redirectUri);
    }

    /**
     * Get Discord OAuth configuration status
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
