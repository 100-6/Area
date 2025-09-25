import { GoogleProvider } from './oauth/providers/GoogleProvider';
import { GitHubProvider } from './oauth/providers/GitHubProvider';
import { User } from '../../core/models/User';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';

interface OAuthUser {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    email_verified: boolean;
    is_active: boolean;
    registration_method: string;
    last_login_at?: Date;
    created_at: Date;
    updated_at: Date;
}

export class OAuthManager {
    private googleProvider: GoogleProvider;
    private gitHubProvider: GitHubProvider;

    constructor() {
        this.googleProvider = new GoogleProvider();
        this.gitHubProvider = new GitHubProvider();
    }

    /**
     * Generate Google OAuth URL
     */
    getGoogleAuthUrl(): string {
        return this.googleProvider.getAuthUrl();
    }

    /**
     * Handle Google OAuth callback
     */
    async handleGoogleCallback(code: string): Promise<OAuthUser> {
        try {
            const googleProfile = await this.googleProvider.handleCallback(code);
            return await this.findOrCreateUserFromGoogle(googleProfile);
        } catch (error) {
            throw new Error(`Google OAuth error: ${error}`);
        }
    }

    /**
     * Find or create user from Google profile
     */
    private async findOrCreateUserFromGoogle(googleProfile: any): Promise<OAuthUser> {
        try {
            const existingAuthProvider = await UserAuthProvider.findByProviderAndId('google', googleProfile.id);

            if (existingAuthProvider) {
                const user = await User.findById(existingAuthProvider.user_id);
                if (!user)
                    throw new Error(`User not found for auth provider: ${existingAuthProvider.user_id}`);
                await UserAuthProvider.updateTokens(user.id, 'google', googleProfile.accessToken, googleProfile.refreshToken);
                await User.updateLastLogin(user.id);
                return user;
            }
            let user = await User.findByEmail(googleProfile.email);
            if (!user) {
                user = await User.create({ 
                    email: googleProfile.email, 
                    first_name: googleProfile.firstName || '', 
                    last_name: googleProfile.lastName || '', 
                    avatar_url: googleProfile.avatarUrl || '', 
                    email_verified: true, 
                    registration_method: 'oauth' 
                });
            }
            await UserAuthProvider.createOrUpdate({ 
                user_id: user.id, 
                provider: 'google', 
                provider_user_id: googleProfile.id, 
                provider_email: googleProfile.email, 
                provider_data: googleProfile, 
                access_token: googleProfile.accessToken, 
                refresh_token: googleProfile.refreshToken || null, 
                is_primary: true 
            });
            await User.updateLastLogin(user.id);
            return user;

        } catch (error) {
            throw new Error(`User creation/update error: ${error}`);
        }
    }

    /**
     * Check if Google OAuth is configured
     */
    isGoogleConfigured(): boolean {
        return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    }

    /**
     * Generate GitHub OAuth URL
     */
    getGitHubAuthUrl(): string {
        return this.gitHubProvider.getAuthUrl();
    }

    /**
     * Handle GitHub OAuth callback
     */
    async handleGitHubCallback(code: string): Promise<OAuthUser> {
        try {
            const gitHubProfile = await this.gitHubProvider.handleCallback(code);
            return await this.findOrCreateUserFromGitHub(gitHubProfile);
        } catch (error) {
            throw new Error(`GitHub OAuth error: ${error}`);
        }
    }

    /**
     * Find or create user from GitHub profile
     */
    private async findOrCreateUserFromGitHub(gitHubProfile: any): Promise<OAuthUser> {
        try {
            const existingAuthProvider = await UserAuthProvider.findByProviderAndId('github', gitHubProfile.id);

            if (existingAuthProvider) {
                const user = await User.findById(existingAuthProvider.user_id);
                if (!user)
                    throw new Error(`User not found for auth provider: ${existingAuthProvider.user_id}`);
                await UserAuthProvider.updateTokens(user.id, 'github', gitHubProfile.accessToken, undefined);
                await User.updateLastLogin(user.id);
                return user;
            }

            let user = await User.findByEmail(gitHubProfile.email);
            if (!user) {
                user = await User.create({ 
                    email: gitHubProfile.email, 
                    first_name: gitHubProfile.firstName || '', 
                    last_name: gitHubProfile.lastName || '', 
                    avatar_url: gitHubProfile.avatarUrl || '', 
                    email_verified: true, 
                    registration_method: 'oauth' 
                });
            }

            await UserAuthProvider.createOrUpdate({ 
                user_id: user.id, 
                provider: 'github', 
                provider_user_id: gitHubProfile.id, 
                provider_email: gitHubProfile.email, 
                provider_data: gitHubProfile, 
                access_token: gitHubProfile.accessToken, 
                refresh_token: undefined, 
                is_primary: true 
            });

            await User.updateLastLogin(user.id);
            return user;

        } catch (error) {
            throw new Error(`User creation/update error: ${error}`);
        }
    }

    /**
     * Check if GitHub OAuth is configured
     */
    isGitHubConfigured(): boolean {
        return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
    }

}
