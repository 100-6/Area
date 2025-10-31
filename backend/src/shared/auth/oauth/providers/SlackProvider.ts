import crypto from 'crypto';
import { IOAuthProvider, OAuthUserProfile } from '../IOAuthProvider';

interface SlackTokenResponse {
    ok: boolean;
    access_token: string;
    token_type: string;
    scope: string;
    bot_user_id?: string;
    app_id: string;
    team: {
        name: string;
        id: string;
    };
    authed_user: {
        id: string;
        scope: string;
        access_token: string;
        token_type: string;
    };
    refresh_token?: string;
    expires_in?: number;
    error?: string;
}

interface SlackUserInfo {
    ok: boolean;
    user: {
        id: string;
        team_id: string;
        name: string;
        real_name?: string;
        profile: {
            email?: string;
            image_192?: string;
            image_512?: string;
            first_name?: string;
            last_name?: string;
        };
    };
    error?: string;
}

interface SlackErrorResponse {
    ok: false;
    error: string;
}

export class SlackProvider implements IOAuthProvider {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.SLACK_CLIENT_ID || '';
        this.clientSecret = process.env.SLACK_CLIENT_SECRET || '';
        this.redirectUri = process.env.SLACK_REDIRECT_URI || '';
    }

    getProviderName(): string {
        return 'slack';
    }

    getAuthUrl(customState?: string): string {
        const state = customState || crypto.randomBytes(32).toString('hex');
        const scopes = [
            'channels:history',
            'channels:read',
            'channels:write.invites',
            'channels:write.topic',
            'chat:write',
            'groups:history',
            'groups:read',
            'im:history',
            'im:read',
            'im:write',
            'reactions:read',
            'reactions:write',
            'users:read',
            'users:read.email',
            'files:read',
            'pins:write',
        ];

        // User scopes pour accéder aux données de l'utilisateur connecté
        const userScopes = [
            'channels:history',
            'channels:read',
            'chat:write',
            'groups:history',
            'groups:read',
            'im:history',
            'im:read',
            'im:write',
            'reactions:read',
            'reactions:write',
            'users:read',
            'files:read',
        ];

        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: scopes.join(','),
            state: state,
            user_scope: userScopes.join(','),
        });

        return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
    }

    private async exchangeCodeForToken(code: string): Promise<SlackTokenResponse> {
        const tokenUrl = 'https://slack.com/api/oauth.v2.access';
        const params = new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code: code,
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
                throw new Error(`Slack token exchange failed: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const tokenData = await response.json() as SlackTokenResponse;
            if (!tokenData.ok)
                throw new Error(`Slack token exchange failed: ${tokenData.error || 'Unknown error'}`);
            return tokenData;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Slack token exchange failed: ${String(error)}`);
        }
    }

    private async getUserInfo(botToken: string, userId: string): Promise<SlackUserInfo> {
        try {
            // Utiliser users.info avec le bot token pour récupérer les infos de l'utilisateur
            const response = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${botToken}`,
                    'Accept': 'application/json'
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get Slack user info: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const userInfo = await response.json() as SlackUserInfo;
            if (!userInfo.ok)
                throw new Error(`Failed to get Slack user info: ${userInfo.error || 'Unknown error'}`);
            return userInfo;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Failed to get Slack user info: ${String(error)}`);
        }
    }

    async handleCallback(code: string): Promise<OAuthUserProfile> {
        try {
            const tokenData = await this.exchangeCodeForToken(code);

            // Utiliser le bot token et l'user ID pour récupérer les infos
            const botToken = tokenData.access_token;
            const userId = tokenData.authed_user.id;
            const userInfo = await this.getUserInfo(botToken, userId);

            const user = userInfo.user;
            const email = user.profile.email || `${user.name}@slack.local`;
            const firstName = user.profile.first_name || user.real_name?.split(' ')[0] || user.name;
            const lastName = user.profile.last_name || user.real_name?.split(' ').slice(1).join(' ') || '';
            const avatarUrl = user.profile.image_512 || user.profile.image_192 || '';

            return {
                id: user.id,
                email: email,
                firstName: firstName,
                lastName: lastName,
                avatarUrl: avatarUrl,
                accessToken: tokenData.authed_user.access_token, // User token (pour DMs et accès utilisateur)
                refreshToken: tokenData.refresh_token,
            };
        } catch (error) {
            if (error instanceof Error)
                throw new Error(`Slack OAuth callback error: ${error.message}`);
            throw new Error(`Slack OAuth callback error: ${String(error)}`);
        }
    }

    /**
     * Validate that Slack OAuth is properly configured
     */
    isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret && this.redirectUri);
    }

    /**
     * Get Slack OAuth configuration status
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
