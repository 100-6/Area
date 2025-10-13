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
    enterprise?: {
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
}

interface SlackUserInfo {
    ok: boolean;
    user: {
        id: string;
        team_id: string;
        name: string;
        deleted: boolean;
        color: string;
        real_name: string;
        tz: string;
        tz_label: string;
        tz_offset: number;
        profile: {
            title: string;
            phone: string;
            skype: string;
            real_name: string;
            real_name_normalized: string;
            display_name: string;
            display_name_normalized: string;
            fields: any;
            status_text: string;
            status_emoji: string;
            status_expiration: number;
            avatar_hash: string;
            email?: string;
            image_24: string;
            image_32: string;
            image_48: string;
            image_72: string;
            image_192: string;
            image_512: string;
            status_text_canonical: string;
            team: string;
        };
        is_admin: boolean;
        is_owner: boolean;
        is_primary_owner: boolean;
        is_restricted: boolean;
        is_ultra_restricted: boolean;
        is_bot: boolean;
        is_app_user: boolean;
        updated: number;
    };
}

interface SlackErrorResponse {
    ok: boolean;
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

    getAuthUrl(): string {
        const state = crypto.randomBytes(32).toString('hex');
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: 'users:read,users:read.email',
            user_scope: 'identity.basic,identity.email,identity.avatar',
            state: state,
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

            const data = await response.json() as SlackTokenResponse | SlackErrorResponse;
            
            if (!data.ok) {
                const errorData = data as SlackErrorResponse;
                throw new Error(`Slack token exchange failed: ${errorData.error}`);
            }

            if (!response.ok) {
                throw new Error(`Slack token exchange failed: ${response.status} ${response.statusText}`);
            }

            return data as SlackTokenResponse;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Slack token exchange failed: ${String(error)}`);
        }
    }

    private async getUserInfo(accessToken: string, userId: string): Promise<SlackUserInfo> {
        try {
            const params = new URLSearchParams({
                user: userId,
            });

            const response = await fetch(`https://slack.com/api/users.info?${params.toString()}`, {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                },
            });

            const data = await response.json() as SlackUserInfo | SlackErrorResponse;

            if (!data.ok) {
                const errorData = data as SlackErrorResponse;
                throw new Error(`Failed to get Slack user info: ${errorData.error}`);
            }

            if (!response.ok) {
                throw new Error(`Failed to get Slack user info: ${response.status} ${response.statusText}`);
            }

            return data as SlackUserInfo;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Failed to get Slack user info: ${String(error)}`);
        }
    }

    async handleCallback(code: string): Promise<OAuthUserProfile> {
        try {
            const tokenData = await this.exchangeCodeForToken(code);
            
            // Use the authed_user token to get user information
            const userAccessToken = tokenData.authed_user.access_token;
            const userId = tokenData.authed_user.id;
            
            const userInfo = await this.getUserInfo(userAccessToken, userId);

            const displayName = userInfo.user.profile.real_name || userInfo.user.name;
            const nameParts = displayName.split(' ');
            const firstName = nameParts[0] || userInfo.user.name;
            const lastName = nameParts.slice(1).join(' ') || '';
            
            // Slack email might not be available depending on scopes
            const email = userInfo.user.profile.email || `${userInfo.user.name}@slack.local`;
            const avatarUrl = userInfo.user.profile.image_192 || userInfo.user.profile.image_72 || '';

            return {
                id: userInfo.user.id,
                email: email,
                firstName: firstName,
                lastName: lastName,
                avatarUrl: avatarUrl,
                accessToken: userAccessToken,
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
