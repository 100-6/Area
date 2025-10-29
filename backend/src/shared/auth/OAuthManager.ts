import { GoogleProvider } from './oauth/providers/GoogleProvider';
import { GmailProvider } from './oauth/providers/GmailProvider';
import { OutlookProvider } from './oauth/providers/OutlookProvider';
import { GitHubProvider } from './oauth/providers/GitHubProvider';
import { GitLabProvider } from './oauth/providers/GitLabProvider';
import { DropboxProvider } from './oauth/providers/DropboxProvider';
import { DiscordProvider } from './oauth/providers/DiscordProvider';
import { SpotifyProvider } from './oauth/providers/SpotifyProvider';
import { RedditProvider } from './oauth/providers/RedditProvider';
import { StravaProvider } from './oauth/providers/StravaProvider';
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
    private outlookProvider: OutlookProvider;
    private gitHubProvider: GitHubProvider;
    private gitLabProvider: GitLabProvider;
    private dropboxProvider: DropboxProvider;
    private discordProvider: DiscordProvider;
    private spotifyProvider: SpotifyProvider;
    private redditProvider: RedditProvider;
    private stravaProvider: StravaProvider;

    constructor() {
        this.googleProvider = new GoogleProvider();
        this.gmailProvider = new GmailProvider();
        this.outlookProvider = new OutlookProvider();
        this.gitHubProvider = new GitHubProvider();
        this.gitLabProvider = new GitLabProvider();
        this.dropboxProvider = new DropboxProvider();
        this.discordProvider = new DiscordProvider();
        this.spotifyProvider = new SpotifyProvider();
        this.redditProvider = new RedditProvider();
        this.stravaProvider = new StravaProvider();
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
     * Generate Outlook OAuth URL
     */
    getOutlookAuthUrl(state?: string): string {
        return this.outlookProvider.getAuthUrl(state);
    }

    /**
     * Generate Discord OAuth URL
     */
    getDiscordAuthUrl(state?: string): string {
        return this.discordProvider.getAuthUrl(state);
    }

    /**
     * Generate Spotify OAuth URL
     */
    getSpotifyAuthUrl(state?: string): string {
        return this.spotifyProvider.getAuthUrl(state);
    }

    /**
     * Generate Reddit OAuth URL
     */
    getRedditAuthUrl(state?: string): string {
        return this.redditProvider.getAuthUrl(state);
    }

    /**
     * Generate Strava OAuth URL
     */
    getStravaAuthUrl(state?: string): string {
        return this.stravaProvider.getAuthUrl(state);
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
     * Handle Outlook OAuth callback
     */
    async handleOutlookCallback(code: string, authenticatedUserId?: string): Promise<OAuthUser> {
        try {
            const outlookProfile = await this.outlookProvider.handleCallback(code);
            return await this.findOrCreateUserFromOAuth('outlook', outlookProfile, authenticatedUserId);
        } catch (error) {
            throw new Error(`Outlook OAuth error: ${error}`);
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
     * Handle Spotify OAuth callback
     */
    async handleSpotifyCallback(code: string, authenticatedUserId?: string): Promise<OAuthUser> {
        try {
            const spotifyProfile = await this.spotifyProvider.handleCallback(code);
            return await this.findOrCreateUserFromOAuth('spotify', spotifyProfile, authenticatedUserId);
        } catch (error) {
            throw new Error(`Spotify OAuth error: ${error}`);
        }
    }

    /**
     * Handle Reddit OAuth callback
     */
    async handleRedditCallback(code: string, authenticatedUserId?: string): Promise<OAuthUser> {
        try {
            const redditProfile = await this.redditProvider.handleCallback(code);
            return await this.findOrCreateUserFromOAuth('reddit', redditProfile, authenticatedUserId);
        } catch (error) {
            throw new Error(`Reddit OAuth error: ${error}`);
        }
    }

    /**
     * Handle Strava OAuth callback
     */
    async handleStravaCallback(code: string, authenticatedUserId?: string, scope?: string): Promise<OAuthUser> {
        try {
            const stravaProfile = await this.stravaProvider.handleCallback(code);
            return await this.findOrCreateUserFromOAuth('strava', stravaProfile, authenticatedUserId);
        } catch (error) {
            throw new Error(`Strava OAuth error: ${error}`);
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
     * Check if Outlook OAuth is configured
     */
    isOutlookConfigured(): boolean {
        return this.outlookProvider.isConfigured();
    }

    /**
     * Check if Discord OAuth is configured
     */
    isDiscordConfigured(): boolean {
        return this.discordProvider.isConfigured();
    }

    /**
     * Check if Spotify OAuth is configured
     */
    isSpotifyConfigured(): boolean {
        return this.spotifyProvider.isConfigured();
    }

    /**
     * Check if Strava OAuth is configured
     */
    isStravaConfigured(): boolean {
        return this.stravaProvider.isConfigured();
    }

    /**
     * Get all OAuth providers status
     */
    getProvidersStatus(): {
        google: { isConfigured: boolean; status: any };
        gmail: { isConfigured: boolean; status: any };
        outlook: { isConfigured: boolean; status: any };
        discord: { isConfigured: boolean; status: any };
        spotify: { isConfigured: boolean; status: any };
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
            outlook: {
                isConfigured: this.outlookProvider.isConfigured(),
                status: this.outlookProvider.getConfigStatus()
            },
            discord: {
                isConfigured: this.discordProvider.isConfigured(),
                status: this.discordProvider.getConfigStatus()
            },
            spotify: {
                isConfigured: this.spotifyProvider.isConfigured(),
                status: this.spotifyProvider.getConfigStatus()
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
