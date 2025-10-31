import 'colors';

interface TwitchUser {
    id: string;
    login: string;
    display_name: string;
    type: string;
    broadcaster_type: string;
    description: string;
    profile_image_url: string;
    offline_image_url: string;
    view_count: number;
    email?: string;
    created_at: string;
}

interface TwitchStream {
    id: string;
    user_id: string;
    user_login: string;
    user_name: string;
    game_id: string;
    game_name: string;
    type: string;
    title: string;
    viewer_count: number;
    started_at: string;
    language: string;
    thumbnail_url: string;
    tag_ids: string[];
    is_mature: boolean;
}

interface TwitchFollower {
    user_id: string;
    user_login: string;
    user_name: string;
    followed_at: string;
}

interface TwitchGame {
    id: string;
    name: string;
    box_art_url: string;
}

interface TwitchClip {
    id: string;
    edit_url: string;
}

interface TwitchMarker {
    id: string;
    created_at: string;
    description: string;
    position_seconds: number;
}

interface TwitchChannelInfo {
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    broadcaster_language: string;
    game_id: string;
    game_name: string;
    title: string;
    delay: number;
}

/**
 * Twitch API Service
 * Handles all interactions with Twitch Helix API
 */
export class TwitchApiService {
    private readonly BASE_URL = 'https://api.twitch.tv/helix';
    private clientId: string;

    constructor() {
        this.clientId = process.env.TWITCH_CLIENT_ID || '';
    }

    /**
     * Make authenticated request to Twitch API
     */
    private async makeRequest<T>(
        endpoint: string,
        accessToken: string,
        options: RequestInit = {}
    ): Promise<T> {
        try {
            const response = await fetch(`${this.BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Client-Id': this.clientId,
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Twitch API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            return await response.json() as T;
        } catch (error) {
            console.error('Twitch API request failed:'.red, error);
            throw error;
        }
    }

    /**
     * Get current user information
     */
    async getCurrentUser(accessToken: string): Promise<TwitchUser> {
        const data = await this.makeRequest<{ data: TwitchUser[] }>('/users', accessToken);
        if (!data.data || data.data.length === 0) {
            throw new Error('No user data returned');
        }
        return data.data[0];
    }

    /**
     * Get user by ID or login
     */
    async getUser(accessToken: string, userId?: string, userLogin?: string): Promise<TwitchUser> {
        const params = new URLSearchParams();
        if (userId) params.append('id', userId);
        if (userLogin) params.append('login', userLogin);

        const data = await this.makeRequest<{ data: TwitchUser[] }>(
            `/users?${params.toString()}`,
            accessToken
        );
        if (!data.data || data.data.length === 0) {
            throw new Error('User not found');
        }
        return data.data[0];
    }

    /**
     * Get stream information (if live)
     */
    async getStream(accessToken: string, userId: string): Promise<TwitchStream | null> {
        const data = await this.makeRequest<{ data: TwitchStream[] }>(
            `/streams?user_id=${userId}`,
            accessToken
        );
        return data.data && data.data.length > 0 ? data.data[0] : null;
    }

    /**
     * Get multiple streams
     */
    async getStreams(accessToken: string, userIds: string[]): Promise<TwitchStream[]> {
        const params = userIds.map(id => `user_id=${id}`).join('&');
        const data = await this.makeRequest<{ data: TwitchStream[] }>(
            `/streams?${params}`,
            accessToken
        );
        return data.data || [];
    }

    /**
     * Get channel information
     */
    async getChannelInfo(accessToken: string, broadcasterId: string): Promise<TwitchChannelInfo> {
        const data = await this.makeRequest<{ data: TwitchChannelInfo[] }>(
            `/channels?broadcaster_id=${broadcasterId}`,
            accessToken
        );
        if (!data.data || data.data.length === 0) {
            throw new Error('Channel not found');
        }
        return data.data[0];
    }

    /**
     * Update channel information (title, game, etc.)
     */
    async updateChannelInfo(
        accessToken: string,
        broadcasterId: string,
        updates: { title?: string; game_id?: string; broadcaster_language?: string; delay?: number }
    ): Promise<void> {
        await this.makeRequest(
            `/channels?broadcaster_id=${broadcasterId}`,
            accessToken,
            {
                method: 'PATCH',
                body: JSON.stringify(updates),
            }
        );
    }

    /**
     * Search for games/categories
     */
    async searchGames(accessToken: string, query: string): Promise<TwitchGame[]> {
        const data = await this.makeRequest<{ data: TwitchGame[] }>(
            `/search/categories?query=${encodeURIComponent(query)}`,
            accessToken
        );
        return data.data || [];
    }

    /**
     * Get game by ID
     */
    async getGame(accessToken: string, gameId: string): Promise<TwitchGame> {
        const data = await this.makeRequest<{ data: TwitchGame[] }>(
            `/games?id=${gameId}`,
            accessToken
        );
        if (!data.data || data.data.length === 0) {
            throw new Error('Game not found');
        }
        return data.data[0];
    }

    /**
     * Get channel followers
     */
    async getFollowers(
        accessToken: string,
        broadcasterId: string,
        first: number = 20
    ): Promise<{ data: TwitchFollower[]; total: number }> {
        const result = await this.makeRequest<{ data: TwitchFollower[]; total: number }>(
            `/channels/followers?broadcaster_id=${broadcasterId}&first=${first}`,
            accessToken
        );
        return result;
    }

    /**
     * Send chat message (requires user access token with chat permissions)
     */
    async sendChatMessage(
        accessToken: string,
        broadcasterId: string,
        senderId: string,
        message: string
    ): Promise<{ message_id: string }> {
        const data = await this.makeRequest<{ data: Array<{ message_id: string }> }>(
            '/chat/messages',
            accessToken,
            {
                method: 'POST',
                body: JSON.stringify({
                    broadcaster_id: broadcasterId,
                    sender_id: senderId,
                    message: message,
                }),
            }
        );
        if (!data.data || data.data.length === 0) {
            throw new Error('Failed to send message');
        }
        return data.data[0];
    }

    /**
     * Send chat announcement
     */
    async sendAnnouncement(
        accessToken: string,
        broadcasterId: string,
        moderatorId: string,
        message: string,
        color: 'blue' | 'green' | 'orange' | 'purple' | 'primary' = 'primary'
    ): Promise<void> {
        await this.makeRequest(
            `/chat/announcements?broadcaster_id=${broadcasterId}&moderator_id=${moderatorId}`,
            accessToken,
            {
                method: 'POST',
                body: JSON.stringify({ message, color }),
            }
        );
    }

    /**
     * Create a clip
     */
    async createClip(accessToken: string, broadcasterId: string, hasDelay: boolean = false): Promise<TwitchClip> {
        const data = await this.makeRequest<{ data: TwitchClip[] }>(
            `/clips?broadcaster_id=${broadcasterId}&has_delay=${hasDelay}`,
            accessToken,
            { method: 'POST' }
        );
        if (!data.data || data.data.length === 0) {
            throw new Error('Failed to create clip');
        }
        return data.data[0];
    }

    /**
     * Create a stream marker
     */
    async createStreamMarker(
        accessToken: string,
        userId: string,
        description?: string
    ): Promise<TwitchMarker> {
        const body: any = { user_id: userId };
        if (description) body.description = description;

        const data = await this.makeRequest<{ data: TwitchMarker[] }>(
            '/streams/markers',
            accessToken,
            {
                method: 'POST',
                body: JSON.stringify(body),
            }
        );
        if (!data.data || data.data.length === 0) {
            throw new Error('Failed to create marker');
        }
        return data.data[0];
    }

    /**
     * Start a commercial
     */
    async startCommercial(
        accessToken: string,
        broadcasterId: string,
        length: 30 | 60 | 90 | 120 | 150 | 180
    ): Promise<{ length: number; message: string; retry_after: number }> {
        const data = await this.makeRequest<{ data: Array<{ length: number; message: string; retry_after: number }> }>(
            '/channels/commercial',
            accessToken,
            {
                method: 'POST',
                body: JSON.stringify({
                    broadcaster_id: broadcasterId,
                    length: length,
                }),
            }
        );
        if (!data.data || data.data.length === 0) {
            throw new Error('Failed to start commercial');
        }
        return data.data[0];
    }

    /**
     * Get moderators for a channel
     */
    async getModerators(accessToken: string, broadcasterId: string): Promise<Array<{ user_id: string; user_login: string; user_name: string }>> {
        const data = await this.makeRequest<{ data: Array<{ user_id: string; user_login: string; user_name: string }> }>(
            `/moderation/moderators?broadcaster_id=${broadcasterId}`,
            accessToken
        );
        return data.data || [];
    }

    /**
     * Ban a user
     */
    async banUser(
        accessToken: string,
        broadcasterId: string,
        moderatorId: string,
        userId: string,
        reason?: string,
        duration?: number
    ): Promise<void> {
        const body: any = {
            data: {
                user_id: userId,
            }
        };
        if (reason) body.data.reason = reason;
        if (duration) body.data.duration = duration;

        await this.makeRequest(
            `/moderation/bans?broadcaster_id=${broadcasterId}&moderator_id=${moderatorId}`,
            accessToken,
            {
                method: 'POST',
                body: JSON.stringify(body),
            }
        );
    }

    /**
     * Check if a user is a moderator
     */
    async isUserModerator(accessToken: string, broadcasterId: string, userId: string): Promise<boolean> {
        try {
            const mods = await this.getModerators(accessToken, broadcasterId);
            return mods.some(mod => mod.user_id === userId);
        } catch {
            return false;
        }
    }

    /**
     * Get broadcaster subscriptions
     */
    async getSubscriptions(
        accessToken: string,
        broadcasterId: string,
        first: number = 100
    ): Promise<{ data: Array<{ user_id: string; user_login: string; user_name: string; tier: string; is_gift: boolean }> }> {
        const data = await this.makeRequest<{ data: Array<{ user_id: string; user_login: string; user_name: string; tier: string; is_gift: boolean }> }>(
            `/subscriptions?broadcaster_id=${broadcasterId}&first=${first}`,
            accessToken
        );
        return data;
    }

    /**
     * Create a poll
     */
    async createPoll(
        accessToken: string,
        broadcasterId: string,
        title: string,
        choices: string[],
        duration: number,
        bitsVotingEnabled: boolean = false,
        bitsPerVote: number = 0
    ): Promise<{ data: Array<{ id: string; title: string; choices: any[] }> }> {
        const body: any = {
            broadcaster_id: broadcasterId,
            title: title,
            choices: choices.map(c => ({ title: c })),
            duration: duration
        };

        if (bitsVotingEnabled) {
            body.bits_voting_enabled = true;
            body.bits_per_vote = bitsPerVote;
        }

        const data = await this.makeRequest<{ data: Array<{ id: string; title: string; choices: any[] }> }>(
            '/polls',
            accessToken,
            {
                method: 'POST',
                body: JSON.stringify(body)
            }
        );
        return data;
    }

    /**
     * Create a prediction
     */
    async createPrediction(
        accessToken: string,
        broadcasterId: string,
        title: string,
        outcomes: string[],
        predictionWindow: number
    ): Promise<{ data: Array<{ id: string; title: string; outcomes: any[] }> }> {
        const body = {
            broadcaster_id: broadcasterId,
            title: title,
            outcomes: outcomes.map(o => ({ title: o })),
            prediction_window: predictionWindow
        };

        const data = await this.makeRequest<{ data: Array<{ id: string; title: string; outcomes: any[] }> }>(
            '/predictions',
            accessToken,
            {
                method: 'POST',
                body: JSON.stringify(body)
            }
        );
        return data;
    }

    /**
     * Send a shoutout
     */
    async sendShoutout(
        accessToken: string,
        fromBroadcasterId: string,
        toBroadcasterId: string,
        moderatorId: string
    ): Promise<void> {
        await this.makeRequest(
            `/chat/shoutouts?from_broadcaster_id=${fromBroadcasterId}&to_broadcaster_id=${toBroadcasterId}&moderator_id=${moderatorId}`,
            accessToken,
            { method: 'POST' }
        );
    }

    /**
     * Update chat settings
     */
    async updateChatSettings(
        accessToken: string,
        broadcasterId: string,
        moderatorId: string,
        settings: {
            slow_mode?: boolean;
            slow_mode_wait_time?: number;
            follower_mode?: boolean;
            follower_mode_duration?: number;
            subscriber_mode?: boolean;
            emote_mode?: boolean;
            unique_chat_mode?: boolean;
        }
    ): Promise<void> {
        await this.makeRequest(
            `/chat/settings?broadcaster_id=${broadcasterId}&moderator_id=${moderatorId}`,
            accessToken,
            {
                method: 'PATCH',
                body: JSON.stringify(settings)
            }
        );
    }

    /**
     * Get channel point custom reward redemptions
     */
    async getCustomRewardRedemptions(
        accessToken: string,
        broadcasterId: string,
        rewardId?: string,
        status: string = 'UNFULFILLED',
        first: number = 50
    ): Promise<{ data: Array<{ id: string; user_id: string; user_login: string; user_name: string; user_input: string; reward: any; redeemed_at: string }> }> {
        let url = `/channel_points/custom_reward_redemptions?broadcaster_id=${broadcasterId}&status=${status}&first=${first}`;
        if (rewardId) {
            url += `&reward_id=${rewardId}`;
        }

        const data = await this.makeRequest<{ data: Array<{ id: string; user_id: string; user_login: string; user_name: string; user_input: string; reward: any; redeemed_at: string }> }>(
            url,
            accessToken
        );
        return data;
    }
}
