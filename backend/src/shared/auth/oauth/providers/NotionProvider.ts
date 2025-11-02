import axios from 'axios';

interface NotionTokenResponse {
    access_token: string;
    token_type: string;
    bot_id: string;
    workspace_name: string;
    workspace_icon: string;
    workspace_id: string;
    owner: {
        type: string;
        user?: {
            object: string;
            id: string;
            name: string;
            avatar_url: string;
            type: string;
            person: {
                email: string;
            };
        };
    };
}

interface NotionUserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    accessToken: string;
    workspaceId: string;
    workspaceName: string;
}

export class NotionProvider {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;
    private authUrl: string = 'https://api.notion.com/v1/oauth/authorize';
    private tokenUrl: string = 'https://api.notion.com/v1/oauth/token';
    private userUrl: string = 'https://api.notion.com/v1/users/me';

    constructor() {
        this.clientId = process.env.NOTION_CLIENT_ID || '';
        this.clientSecret = process.env.NOTION_CLIENT_SECRET || '';
        this.redirectUri = process.env.NOTION_REDIRECT_URI || 'http://localhost:8080/api/auth/notion/callback';
    }

    /**
     * Generate Notion OAuth authorization URL
     */
    getAuthUrl(state?: string): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            owner: 'user',
        });

        if (state) {
            params.append('state', state);
        }

        return `${this.authUrl}?${params.toString()}`;
    }

    /**
     * Handle OAuth callback and exchange code for access token
     */
    async handleCallback(code: string): Promise<NotionUserProfile> {
        try {
            // Exchange code for access token
            const tokenResponse = await axios.post<NotionTokenResponse>(
                this.tokenUrl,
                {
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.redirectUri,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
                    },
                }
            );

            const { access_token, workspace_id, workspace_name, owner } = tokenResponse.data;

            // Get user information
            let userProfile: NotionUserProfile;

            if (owner.type === 'user' && owner.user) {
                // User owns the workspace
                userProfile = {
                    id: owner.user.id,
                    email: owner.user.person?.email || `${owner.user.id}@notion.local`,
                    firstName: owner.user.name?.split(' ')[0] || 'Notion',
                    lastName: owner.user.name?.split(' ').slice(1).join(' ') || 'User',
                    avatarUrl: owner.user.avatar_url || '',
                    accessToken: access_token,
                    workspaceId: workspace_id,
                    workspaceName: workspace_name || 'Notion Workspace',
                };
            } else {
                // Workspace is owned by a team/organization
                // Fetch current user info using the access token
                const userResponse = await axios.get(this.userUrl, {
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Notion-Version': '2022-06-28',
                    },
                });

                const userData = userResponse.data;
                userProfile = {
                    id: userData.id,
                    email: userData.person?.email || `${userData.id}@notion.local`,
                    firstName: userData.name?.split(' ')[0] || 'Notion',
                    lastName: userData.name?.split(' ').slice(1).join(' ') || 'User',
                    avatarUrl: userData.avatar_url || '',
                    accessToken: access_token,
                    workspaceId: workspace_id,
                    workspaceName: workspace_name || 'Notion Workspace',
                };
            }

            return userProfile;
        } catch (error: any) {
            if (error.response) {
                throw new Error(`Notion OAuth error: ${error.response.data.error || error.response.statusText}`);
            }
            throw new Error(`Notion OAuth error: ${error.message}`);
        }
    }

    /**
     * Check if Notion OAuth is configured
     */
    isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret && this.redirectUri);
    }

    /**
     * Get configuration status for debugging
     */
    getConfigStatus() {
        return {
            clientId: this.clientId ? '✓ Set' : '✗ Missing',
            clientSecret: this.clientSecret ? '✓ Set' : '✗ Missing',
            redirectUri: this.redirectUri || '✗ Missing',
            authUrl: this.authUrl,
            tokenUrl: this.tokenUrl,
        };
    }
}
