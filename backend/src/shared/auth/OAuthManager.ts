// backend/src/shared/auth/OAuthManager.ts
import { GoogleProvider } from './oauth/providers/GoogleProvider';
import { GitHubProvider } from './oauth/providers/GitHubProvider';
import { GitLabProvider } from './oauth/providers/GitLabProvider';
import { DropboxProvider } from './oauth/providers/DropboxProvider';
import { DiscordProvider } from './oauth/providers/DiscordProvider';
import { SlackProvider } from './oauth/providers/SlackProvider';
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
    private gitLabProvider: GitLabProvider;
    private dropboxProvider: DropboxProvider;
    private discordProvider: DiscordProvider;
    private slackProvider: SlackProvider;

    constructor() {
        this.googleProvider = new GoogleProvider();
        this.gitHubProvider = new GitHubProvider();
        this.gitLabProvider = new GitLabProvider();
        this.dropboxProvider = new DropboxProvider();
        this.discordProvider = new DiscordProvider();
        this.slackProvider = new SlackProvider();
    }

    /**
     * Generate Google OAuth URL
     */
    getGoogleAuthUrl(): string {
        return this.googleProvider.getAuthUrl();
    }

    /**
     * Generate Discord OAuth URL
     */
    getDiscordAuthUrl(): string {
        return this.discordProvider.getAuthUrl();
    }

    /**
     * Handle Google OAuth callback
     */
    async handleGoogleCallback(code: string): Promise<OAuthUser> {
        try {
            const googleProfile = await this.googleProvider.handleCallback(code);
            return await this.findOrCreateUserFromOAuth('google', googleProfile);
        } catch (error) {
            throw new Error(`Google OAuth error: ${error}`);
        }
    }

    /**
     * Handle Discord OAuth callback
     */
    async handleDiscordCallback(code: string): Promise<OAuthUser> {
        try {
            const discordProfile = await this.discordProvider.handleCallback(code);
            return await this.findOrCreateUserFromOAuth('discord', discordProfile);
        } catch (error) {
            throw new Error(`Discord OAuth error: ${error}`);
        }
    }

    /**
     * Find or create user from OAuth profile (refactorisé pour être réutilisé)
     */
    private async findOrCreateUserFromOAuth(provider: string, oauthProfile: any): Promise<OAuthUser> {
        try {
            const existingAuthProvider = await UserAuthProvider.findByProviderAndId(provider, oauthProfile.id);

            if (existingAuthProvider) {
                const user = await User.findById(existingAuthProvider.user_id);
                if (!user)
                    throw new Error(`User not found for auth provider: ${existingAuthProvider.user_id}`);
                await UserAuthProvider.updateTokens(user.id, provider, oauthProfile.accessToken, oauthProfile.refreshToken);
                await User.updateLastLogin(user.id);
                return user;
            }
            let user = await User.findByEmail(oauthProfile.email);
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
            await UserAuthProvider.createOrUpdate({ 
                user_id: user.id, 
                provider: provider, 
                provider_user_id: oauthProfile.id, 
                provider_email: oauthProfile.email, 
                provider_data: oauthProfile, 
                access_token: oauthProfile.accessToken, 
                refresh_token: oauthProfile.refreshToken || null, 
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
        return this.googleProvider.isConfigured();
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
        discord: { isConfigured: boolean; status: any };
        slack: { isConfigured: boolean; status: any };
    } {
        return {
            google: {
                isConfigured: this.googleProvider.isConfigured(),
                status: this.googleProvider.getConfigStatus()
            },
            discord: {
                isConfigured: this.discordProvider.isConfigured(),
                status: this.discordProvider.getConfigStatus()
            },
            slack: {
                isConfigured: this.slackProvider.isConfigured(),
                status: this.slackProvider.getConfigStatus()
            }
        };
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

    /**
     * Generate GitLab OAuth URL
     */
    getGitLabAuthUrl(): string {
        return this.gitLabProvider.getAuthUrl();
    }

    /**
     * Handle GitLab OAuth callback
     */
    async handleGitLabCallback(code: string): Promise<OAuthUser> {
        try {
            const gitLabProfile = await this.gitLabProvider.handleCallback(code);
            return await this.findOrCreateUserFromOAuth('gitlab', gitLabProfile);
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
    getDropboxAuthUrl(): string {
        return this.dropboxProvider.getAuthUrl();
    }

    /**
     * Handle Dropbox OAuth callback
     */
    async handleDropboxCallback(code: string): Promise<OAuthUser> {
        try {
            const dropboxProfile = await this.dropboxProvider.handleCallback(code);
            return await this.findOrCreateUserFromOAuth('dropbox', dropboxProfile);
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

    /**
     * Generate Slack OAuth URL
     */
    getSlackAuthUrl(): string {
        return this.slackProvider.getAuthUrl();
    }

    /**
     * Handle Slack OAuth callback
     */
    async handleSlackCallback(code: string): Promise<OAuthUser> {
        try {
            const slackProfile = await this.slackProvider.handleCallback(code);
            return await this.findOrCreateUserFromOAuth('slack', slackProfile);
        } catch (error) {
            throw new Error(`Slack OAuth error: ${error}`);
        }
    }

    /**
     * Check if Slack OAuth is configured
     */
    isSlackConfigured(): boolean {
        return this.slackProvider.isConfigured();
    }

}
