import { IOAuthProvider, OAuthUserProfile } from '../IOAuthProvider';

interface TrelloTokenResponse {
    token: string;
    idMember: string;
}

interface TrelloMemberInfo {
    id: string;
    email: string;
    fullName: string;
    username: string;
    avatarUrl: string;
}

export class TrelloProvider implements IOAuthProvider {
    private apiKey: string;
    private apiSecret: string;
    private redirectUri: string;
    private readonly appName: string = 'AREA';

    constructor() {
        this.apiKey = process.env.TRELLO_API_KEY || '';
        this.apiSecret = process.env.TRELLO_API_SECRET || '';
        this.redirectUri = process.env.TRELLO_REDIRECT_URI || '';
    }

    getProviderName(): string {
        return 'trello';
    }

    getAuthUrl(customState?: string): string {
        // Build return URL with state parameter if provided
        let returnUrl = this.redirectUri;
        if (customState) {
            returnUrl = `${this.redirectUri}?state=${encodeURIComponent(customState)}`;
        }

        const params = new URLSearchParams({
            expiration: 'never',
            name: this.appName,
            scope: 'read,write,account',
            response_type: 'token',
            key: this.apiKey,
            return_url: returnUrl,
        });

        return `https://trello.com/1/authorize?${params.toString()}`;
    }

    private async getMemberInfo(apiKey: string, token: string): Promise<TrelloMemberInfo> {
        try {
            const response = await fetch(
                `https://api.trello.com/1/members/me?key=${apiKey}&token=${token}&fields=id,email,fullName,username,avatarUrl`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get Trello member info: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const memberInfo = await response.json() as TrelloMemberInfo;
            return memberInfo;
        } catch (error) {
            if (error instanceof Error)
                throw error;
            throw new Error(`Failed to get Trello member info: ${String(error)}`);
        }
    }

    async handleCallback(token: string): Promise<OAuthUserProfile> {
        try {
            // Trello uses a different OAuth flow - the token is directly provided
            // Unlike other providers, Trello doesn't have a code exchange step
            const memberInfo = await this.getMemberInfo(this.apiKey, token);

            if (!memberInfo.email) {
                throw new Error('Trello user email not available');
            }

            // Parse full name into first and last name
            const nameParts = memberInfo.fullName ? memberInfo.fullName.split(' ') : [memberInfo.username];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            return {
                id: memberInfo.id,
                email: memberInfo.email,
                firstName: firstName,
                lastName: lastName,
                avatarUrl: memberInfo.avatarUrl || '',
                accessToken: token,
                refreshToken: undefined, // Trello tokens don't expire, so no refresh token needed
            };
        } catch (error) {
            if (error instanceof Error)
                throw new Error(`Trello OAuth callback error: ${error.message}`);
            throw new Error(`Trello OAuth callback error: ${String(error)}`);
        }
    }

    /**
     * Validate that Trello OAuth is properly configured
     */
    isConfigured(): boolean {
        return !!(this.apiKey && this.apiSecret && this.redirectUri);
    }

    /**
     * Get Trello OAuth configuration status
     */
    getConfigStatus(): { hasApiKey: boolean; hasApiSecret: boolean; hasRedirectUri: boolean; isValid: boolean; } {
        const hasApiKey = !!this.apiKey;
        const hasApiSecret = !!this.apiSecret;
        const hasRedirectUri = !!this.redirectUri;

        return {
            hasApiKey,
            hasApiSecret,
            hasRedirectUri,
            isValid: hasApiKey && hasApiSecret && hasRedirectUri,
        };
    }
}
