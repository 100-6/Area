import { GoogleProvider } from './oauth/providers/GoogleProvider';
import { GmailProvider } from './oauth/providers/GmailProvider';
import { GitHubProvider } from './oauth/providers/GitHubProvider';
import { GitLabProvider } from './oauth/providers/GitLabProvider';
import { DropboxProvider } from './oauth/providers/DropboxProvider';
import { DiscordProvider } from './oauth/providers/DiscordProvider';
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
    private gmailProvider: GmailProvider;
    private gitHubProvider: GitHubProvider;
    private gitLabProvider: GitLabProvider;
    private dropboxProvider: DropboxProvider;
    private discordProvider: DiscordProvider;

    constructor() {
        this.googleProvider = new GoogleProvider();
        this.gmailProvider = new GmailProvider();
        this.gitHubProvider = new GitHubProvider();
        this.gitLabProvider = new GitLabProvider();
        this.dropboxProvider = new DropboxProvider();
        this.discordProvider = new DiscordProvider();
    }

    /**
     * Generate Google OAuth URL
     */
    getGoogleAuthUrl(state?: string): string {
        return this.googleProvider.getAuthUrl(state);
    }

    /**
     * Generate Gmail OAuth URL
     */
    getGmailAuthUrl(state?: string): string {
        return this.gmailProvider.getAuthUrl(state);
    }

    /**
     * Generate Discord OAuth URL
     */
    getDiscordAuthUrl(state?: string): string {
        return this.discordProvider.getAuthUrl(state);
    }

    /**
     * Handle Google OAuth callback
     */
    async handleGoogleCallback(code: string, authenticatedUserId?: string): Promise<OAuthUser> {
        try {
            const googleProfile = await this.googleProvider.handleCallback(code);
            return await this.findOrCreateUserFromOAuth('google', googleProfile, authenticatedUserId);
        } catch (error) {
            throw new Error(`Google OAuth error: ${error}`);
        }
    }

    /**
     * Handle Gmail OAuth callback
     */
    async handleGmailCallback(code: string, authenticatedUserId?: string): Promise<OAuthUser> {
        try {
            const gmailProfile = await this.gmailProvider.handleCallback(code);
            return await this.findOrCreateUserFromOAuth('gmail', gmailProfile, authenticatedUserId);
        } catch (error) {
            throw new Error(`Gmail OAuth error: ${error}`);
        }
    }

    /**
     * Handle Discord OAuth callback
     */
    async handleDiscordCallback(code: string, authenticatedUserId?: string): Promise<OAuthUser> {
        try {
            const discordProfile = await this.discordProvider.handleCallback(code);
            return await this.findOrCreateUserFromOAuth('discord', discordProfile, authenticatedUserId);
        } catch (error) {
            throw new Error(`Discord OAuth error: ${error}`);
        }
    }

    /**
     * Find or create user from OAuth profile (refactorisé pour être réutilisé)
     * @param provider - OAuth provider name (e.g., 'google', 'discord')
     * @param oauthProfile - OAuth profile data
     * @param authenticatedUserId - Optional user ID if already authenticated (for linking accounts)
     */
    private async findOrCreateUserFromOAuth(provider: string, oauthProfile: any, authenticatedUserId?: string): Promise<OAuthUser> {
        try {
            const existingAuthProvider = await UserAuthProvider.findByProviderAndId(provider, oauthProfile.id);
            let user: OAuthUser | null = null;

            if (existingAuthProvider) {
                const user = await User.findById(existingAuthProvider.user_id);
                if (!user)
                    throw new Error(`User not found for auth provider: ${existingAuthProvider.user_id}`);
                await UserAuthProvider.updateTokens(user.id, provider, oauthProfile.accessToken, oauthProfile.refreshToken);
                await User.updateLastLogin(user.id);
                return user;
            }
            if (authenticatedUserId) {
                user = await User.findById(authenticatedUserId);
                if (!user)
                    throw new Error(`Authenticated user not found: ${authenticatedUserId}`);
            } else {
                user = await User.findByEmail(oauthProfile.email);
                if (!user) {
                    user = await User.create({
                        email: oauthProfile.email,
                        first_name: oauthProfile.firstName || '',
                        last_name: oauthProfile.lastName || '',
                        avatar_url: oauthProfile.avatarUrl || '',
                        email_verified: true,
                        registration_method: 'oauth'
                    });
                }
            }
            await UserAuthProvider.createOrUpdate({
                user_id: user.id,
                provider: provider,
                provider_user_id: oauthProfile.id,
                provider_email: oauthProfile.email,
                provider_data: oauthProfile,
                access_token: oauthProfile.accessToken,
                refresh_token: oauthProfile.refreshToken || null,
                is_primary: !authenticatedUserId
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
        return this.googleProvider.isConfigured();
    }

    /**
     * Check if Gmail OAuth is configured
     */
    isGmailConfigured(): boolean {
        return this.gmailProvider.isConfigured();
    }

    /**
     * Check if Discord OAuth is configured
     */
    isDiscordConfigured(): boolean {
        return this.discordProvider.isConfigured();
    }

    /**
     * Get all OAuth providers status
     */
    getProvidersStatus(): {
        google: { isConfigured: boolean; status: any };
        gmail: { isConfigured: boolean; status: any };
        discord: { isConfigured: boolean; status: any };
    } {
        return {
            google: {
                isConfigured: this.googleProvider.isConfigured(),
                status: this.googleProvider.getConfigStatus()
            },
            gmail: {
                isConfigured: this.gmailProvider.isConfigured(),
                status: this.gmailProvider.getConfigStatus()
            },
            discord: {
                isConfigured: this.discordProvider.isConfigured(),
                status: this.discordProvider.getConfigStatus()
            }
        };
    }

    /**
     * Generate GitHub OAuth URL
     */
    getGitHubAuthUrl(state?: string): string {
        return this.gitHubProvider.getAuthUrl(state);
    }

    /**
     * Handle GitHub OAuth callback
     */
    async handleGitHubCallback(code: string, authenticatedUserId?: string): Promise<OAuthUser> {
        try {
            const gitHubProfile = await this.gitHubProvider.handleCallback(code);
            return await this.findOrCreateUserFromGitHub(gitHubProfile, authenticatedUserId);
        } catch (error) {
            throw new Error(`GitHub OAuth error: ${error}`);
        }
    }

    /**
     * Find or create user from GitHub profile
     * @param gitHubProfile - GitHub profile data
     * @param authenticatedUserId - Optional user ID if already authenticated (for linking accounts)
     */
    private async findOrCreateUserFromGitHub(gitHubProfile: any, authenticatedUserId?: string): Promise<OAuthUser> {
        try {
            const existingAuthProvider = await UserAuthProvider.findByProviderAndId('github', gitHubProfile.id);
            let user: OAuthUser | null = null;

            if (existingAuthProvider) {
                const user = await User.findById(existingAuthProvider.user_id);
                if (!user)
                    throw new Error(`User not found for auth provider: ${existingAuthProvider.user_id}`);
                await UserAuthProvider.updateTokens(user.id, 'github', gitHubProfile.accessToken, undefined);
                await User.updateLastLogin(user.id);
                return user;
            }
            if (authenticatedUserId) {
                user = await User.findById(authenticatedUserId);
                if (!user)
                    throw new Error(`Authenticated user not found: ${authenticatedUserId}`);
            } else {
                user = await User.findByEmail(gitHubProfile.email);
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
            }
            await UserAuthProvider.createOrUpdate({
                user_id: user.id,
                provider: 'github',
                provider_user_id: gitHubProfile.id,
                provider_email: gitHubProfile.email,
                provider_data: gitHubProfile,
                access_token: gitHubProfile.accessToken,
                refresh_token: undefined,
                is_primary: !authenticatedUserId
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

    /**
     * Generate GitLab OAuth URL
     */
    getGitLabAuthUrl(state?: string): string {
        return this.gitLabProvider.getAuthUrl(state);
    }

    /**
     * Handle GitLab OAuth callback
     */
    async handleGitLabCallback(code: string, authenticatedUserId?: string): Promise<OAuthUser> {
        try {
            const gitLabProfile = await this.gitLabProvider.handleCallback(code);
            return await this.findOrCreateUserFromOAuth('gitlab', gitLabProfile, authenticatedUserId);
        } catch (error) {
            throw new Error(`GitLab OAuth error: ${error}`);
        }
    }

    /**
     * Check if GitLab OAuth is configured
     */
    isGitLabConfigured(): boolean {
        return !!(process.env.GITLAB_CLIENT_ID && process.env.GITLAB_CLIENT_SECRET);
    }

    /**
     * Generate Dropbox OAuth URL
     */
    getDropboxAuthUrl(state?: string): string {
        return this.dropboxProvider.getAuthUrl(state);
    }

    /**
     * Handle Dropbox OAuth callback
     */
    async handleDropboxCallback(code: string, authenticatedUserId?: string): Promise<OAuthUser> {
        try {
            const dropboxProfile = await this.dropboxProvider.handleCallback(code);
            return await this.findOrCreateUserFromOAuth('dropbox', dropboxProfile, authenticatedUserId);
        } catch (error) {
            throw new Error(`Dropbox OAuth error: ${error}`);
        }
    }

    /**
     * Check if Dropbox OAuth is configured
     */
    isDropboxConfigured(): boolean {
        return !!(process.env.DROPBOX_CLIENT_ID && process.env.DROPBOX_CLIENT_SECRET);
    }

}
