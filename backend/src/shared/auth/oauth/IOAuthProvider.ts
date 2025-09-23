export interface OAuthUserProfile {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    accessToken: string;
    refreshToken?: string;
}

export interface IOAuthProvider {
    getAuthUrl(): string;
    handleCallback(code: string): Promise<OAuthUserProfile>;
    getProviderName(): string;
}
