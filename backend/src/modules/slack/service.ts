import axios from 'axios';
import 'colors';

/**
 * Interface pour les messages Slack
 */
interface SlackMessage {
    type: string;
    user?: string;
    text: string;
    ts: string;
    thread_ts?: string;
    bot_id?: string;
    subtype?: string;
    files?: SlackFile[];
}

/**
 * Interface pour les canaux Slack
 */
interface SlackChannel {
    id: string;
    name: string;
    is_channel: boolean;
    is_private: boolean;
    is_im: boolean;
    is_mpim: boolean;
    created: number;
    creator?: string;
    is_member: boolean;
    topic?: {
        value: string;
        creator: string;
        last_set: number;
    };
    purpose?: {
        value: string;
        creator: string;
        last_set: number;
    };
    num_members?: number;
}

/**
 * Interface pour les utilisateurs Slack
 */
interface SlackUser {
    id: string;
    name: string;
    real_name?: string;
    profile?: {
        email?: string;
        image_192?: string;
        first_name?: string;
        last_name?: string;
    };
    is_bot?: boolean;
}

/**
 * Interface pour les fichiers Slack
 */
interface SlackFile {
    id: string;
    name: string;
    title: string;
    mimetype: string;
    filetype: string;
    size: number;
    url_private: string;
    url_private_download: string;
    timestamp: number;
    user: string;
}

/**
 * Interface pour les réactions Slack
 */
interface SlackReaction {
    name: string;
    users: string[];
    count: number;
}

/**
 * Interface pour les réponses de l'API Slack
 */
interface SlackApiResponse {
    ok: boolean;
    error?: string;
    warning?: string;
}

interface SlackMessagesResponse extends SlackApiResponse {
    messages: SlackMessage[];
    has_more: boolean;
    response_metadata?: {
        next_cursor?: string;
    };
}

interface SlackChannelsResponse extends SlackApiResponse {
    channels: SlackChannel[];
    response_metadata?: {
        next_cursor?: string;
    };
}

interface SlackUsersResponse extends SlackApiResponse {
    members: SlackUser[];
    response_metadata?: {
        next_cursor?: string;
    };
}

interface SlackPostMessageResponse extends SlackApiResponse {
    ts: string;
    channel: string;
    message: SlackMessage;
}

interface SlackChannelCreateResponse extends SlackApiResponse {
    channel: SlackChannel;
}

interface SlackUserInfoResponse extends SlackApiResponse {
    user: SlackUser;
}

/**
 * Service pour interagir avec l'API Slack REST
 * Permet de gérer les messages, canaux, utilisateurs, réactions, etc.
 */
export class SlackApiService {
    private static readonly SLACK_API_BASE = 'https://slack.com/api';

    /**
     * Récupère l'historique des messages d'un canal
     * @param accessToken Bot token OAuth
     * @param channelId ID du canal Slack
     * @param limit Nombre de messages à récupérer (défaut: 100)
     * @param oldest Timestamp le plus ancien (optionnel)
     * @returns Liste des messages
     */
    static async getChannelHistory(accessToken: string, channelId: string, limit: number = 100, oldest?: string): Promise<SlackMessage[]> {
        try {
            console.log(`[SlackApiService] Fetching history for channel ${channelId}...`.cyan);
            const params: any = {
                channel: channelId,
                limit: limit,
            };

            if (oldest)
                params.oldest = oldest;
            const response = await axios.get<SlackMessagesResponse>(
                `${this.SLACK_API_BASE}/conversations.history`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    params
                }
            );
            if (!response.data.ok)
                throw new Error(`Slack API error: ${response.data.error}`);
            console.log(`[SlackApiService] Found ${response.data.messages.length} message(s)`.green);
            return response.data.messages;
        } catch (error) {
            console.error('[SlackApiService] Error fetching channel history:'.red, error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401)
                    throw new Error('SLACK_TOKEN_INVALID');
                if (error.response?.status === 429)
                    throw new Error('SLACK_RATE_LIMITED');
            }
            throw new Error('SLACK_API_ERROR');
        }
    }

    /**
     * Envoie un message dans un canal Slack
     * @param accessToken Bot token OAuth
     * @param channelId ID du canal
     * @param text Texte du message
     * @param threadTs Thread timestamp (optionnel)
     * @returns Timestamp du message envoyé
     */
    static async postMessage(accessToken: string, channelId: string, text: string, threadTs?: string): Promise<{ ts: string; channel: string }> {
        try {
            console.log(`[SlackApiService] Posting message to channel ${channelId}...`.cyan);
            const payload: any = {
                channel: channelId,
                text: text,
            };

            if (threadTs)
                payload.thread_ts = threadTs;
            const response = await axios.post<SlackPostMessageResponse>(
                `${this.SLACK_API_BASE}/chat.postMessage`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (!response.data.ok)
                throw new Error(`Slack API error: ${response.data.error}`);
            console.log(`[SlackApiService] Message sent successfully (ts: ${response.data.ts})`.green);
            return {ts: response.data.ts, channel: response.data.channel};
        } catch (error) {
            console.error('[SlackApiService] Error posting message:'.red, error);
            throw new Error('SLACK_API_ERROR');
        }
    }

    /**
     * Ouvre une conversation DM avec un utilisateur et envoie un message
     * @param accessToken Bot token OAuth
     * @param userId ID de l'utilisateur
     * @param text Texte du message
     * @returns Timestamp du message et channel ID
     */
    static async sendDirectMessage(accessToken: string, userId: string, text: string): Promise<{ ts: string; channel: string }> {
        try {
            console.log(`[SlackApiService] Opening DM with user ${userId}...`.cyan);
            const openResponse = await axios.post<{ ok: boolean; channel: { id: string }; error?: string }>(
                `${this.SLACK_API_BASE}/conversations.open`,
                { users: userId },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!openResponse.data.ok)
                throw new Error(`Slack API error: ${openResponse.data.error}`);
            const dmChannelId = openResponse.data.channel.id;
            return await this.postMessage(accessToken, dmChannelId, text);
        } catch (error) {
            console.error('[SlackApiService] Error sending DM:'.red, error);
            throw new Error('SLACK_API_ERROR');
        }
    }

    /**
     * Récupère la liste des canaux (publics et privés)
     * @param accessToken Bot token OAuth
     * @param types Types de canaux (par défaut: public_channel,private_channel)
     * @param limit Nombre de canaux à récupérer
     * @returns Liste des canaux
     */
    static async getChannelsList(accessToken: string, types: string = 'public_channel,private_channel', limit: number = 1000): Promise<SlackChannel[]> {
        try {
            console.log('[SlackApiService] Fetching channels list...'.cyan);
            const response = await axios.get<SlackChannelsResponse>(
                `${this.SLACK_API_BASE}/conversations.list`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        types,
                        limit,
                        exclude_archived: true
                    }
                }
            );

            if (!response.data.ok)
                throw new Error(`Slack API error: ${response.data.error}`);
            console.log(`[SlackApiService] Found ${response.data.channels.length} channel(s)`.green);
            return response.data.channels;
        } catch (error) {
            console.error('[SlackApiService] Error fetching channels:'.red, error);
            throw new Error('SLACK_API_ERROR');
        }
    }

    /**
     * Crée un nouveau canal Slack
     * @param accessToken Bot token OAuth
     * @param name Nom du canal (doit être en minuscules, sans espaces)
     * @param isPrivate Canal privé ou public
     * @returns Informations du canal créé
     */
    static async createChannel(accessToken: string, name: string, isPrivate: boolean = false): Promise<SlackChannel> {
        try {
            console.log(`[SlackApiService] Creating ${isPrivate ? 'private' : 'public'} channel: ${name}...`.cyan);
            const response = await axios.post<SlackChannelCreateResponse>(
                `${this.SLACK_API_BASE}/conversations.create`,
                {
                    name,
                    is_private: isPrivate
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data.ok)
                throw new Error(`Slack API error: ${response.data.error}`);
            console.log(`[SlackApiService] Channel created: ${response.data.channel.id}`.green);
            return response.data.channel;
        } catch (error) {
            console.error('[SlackApiService] Error creating channel:'.red, error);
            throw new Error('SLACK_API_ERROR');
        }
    }

    /**
     * Invite un utilisateur dans un canal
     * @param accessToken Bot token OAuth
     * @param channelId ID du canal
     * @param userId ID de l'utilisateur à inviter
     * @returns Succès de l'invitation
     */
    static async inviteUserToChannel(accessToken: string, channelId: string, userId: string): Promise<boolean> {
        try {
            console.log(`[SlackApiService] Inviting user ${userId} to channel ${channelId}...`.cyan);
            const response = await axios.post<SlackApiResponse>(
                `${this.SLACK_API_BASE}/conversations.invite`,
                {
                    channel: channelId,
                    users: userId
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data.ok)
                throw new Error(`Slack API error: ${response.data.error}`);
            console.log('[SlackApiService] User invited successfully'.green);
            return true;
        } catch (error) {
            console.error('[SlackApiService] Error inviting user:'.red, error);
            throw new Error('SLACK_API_ERROR');
        }
    }

    /**
     * Définit le sujet d'un canal
     * @param accessToken Bot token OAuth
     * @param channelId ID du canal
     * @param topic Nouveau sujet
     * @returns Sujet mis à jour
     */
    static async setChannelTopic(accessToken: string, channelId: string, topic: string): Promise<string> {
        try {
            console.log(`[SlackApiService] Setting topic for channel ${channelId}...`.cyan);
            const response = await axios.post<{ ok: boolean; topic: string; error?: string }>(
                `${this.SLACK_API_BASE}/conversations.setTopic`,
                {
                    channel: channelId,
                    topic
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data.ok)
                throw new Error(`Slack API error: ${response.data.error}`);
            console.log('[SlackApiService] Topic updated successfully'.green);
            return response.data.topic;
        } catch (error) {
            console.error('[SlackApiService] Error setting channel topic:'.red, error);
            throw new Error('SLACK_API_ERROR');
        }
    }

    /**
     * Ajoute une réaction emoji à un message
     * @param accessToken Bot token OAuth
     * @param channelId ID du canal
     * @param messageTs Timestamp du message
     * @param emoji Nom de l'emoji (sans colons)
     * @returns Succès de l'ajout
     */
    static async addReaction(accessToken: string, channelId: string, messageTs: string, emoji: string): Promise<boolean> {
        try {
            console.log(`[SlackApiService] Adding reaction :${emoji}: to message ${messageTs}...`.cyan);
            const response = await axios.post<SlackApiResponse>(
                `${this.SLACK_API_BASE}/reactions.add`,
                {
                    channel: channelId,
                    timestamp: messageTs,
                    name: emoji
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data.ok)
                throw new Error(`Slack API error: ${response.data.error}`);
            console.log('[SlackApiService] Reaction added successfully'.green);
            return true;
        } catch (error) {
            console.error('[SlackApiService] Error adding reaction:'.red, error);
            throw new Error('SLACK_API_ERROR');
        }
    }

    /**
     * Épingle un message dans un canal
     * @param accessToken Bot token OAuth
     * @param channelId ID du canal
     * @param messageTs Timestamp du message
     * @returns Succès de l'épinglage
     */
    static async pinMessage(accessToken: string, channelId: string, messageTs: string): Promise<boolean> {
        try {
            console.log(`[SlackApiService] Pinning message ${messageTs} in channel ${channelId}...`.cyan);
            const response = await axios.post<SlackApiResponse>(
                `${this.SLACK_API_BASE}/pins.add`,
                {
                    channel: channelId,
                    timestamp: messageTs
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data.ok)
                throw new Error(`Slack API error: ${response.data.error}`);
            console.log('[SlackApiService] Message pinned successfully'.green);
            return true;
        } catch (error) {
            console.error('[SlackApiService] Error pinning message:'.red, error);
            throw new Error('SLACK_API_ERROR');
        }
    }

    /**
     * Récupère les informations d'un utilisateur
     * @param accessToken Bot token OAuth
     * @param userId ID de l'utilisateur
     * @returns Informations de l'utilisateur
     */
    static async getUserInfo(accessToken: string, userId: string): Promise<SlackUser> {
        try {
            console.log(`[SlackApiService] Fetching user info for ${userId}...`.cyan);
            const response = await axios.get<SlackUserInfoResponse>(
                `${this.SLACK_API_BASE}/users.info`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    params: { user: userId }
                }
            );

            if (!response.data.ok)
                throw new Error(`Slack API error: ${response.data.error}`);
            console.log(`[SlackApiService] Got user info for ${response.data.user.name}`.green);
            return response.data.user;
        } catch (error) {
            console.error('[SlackApiService] Error fetching user info:'.red, error);
            throw new Error('SLACK_API_ERROR');
        }
    }

    /**
     * Récupère la liste des membres du workspace
     * @param accessToken Bot token OAuth
     * @param limit Nombre de membres à récupérer
     * @returns Liste des utilisateurs
     */
    static async getUsersList(accessToken: string, limit: number = 1000): Promise<SlackUser[]> {
        try {
            console.log('[SlackApiService] Fetching users list...'.cyan);
            const response = await axios.get<SlackUsersResponse>(
                `${this.SLACK_API_BASE}/users.list`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    params: { limit }
                }
            );

            if (!response.data.ok)
                throw new Error(`Slack API error: ${response.data.error}`);
            console.log(`[SlackApiService] Found ${response.data.members.length} user(s)`.green);
            return response.data.members;
        } catch (error) {
            console.error('[SlackApiService] Error fetching users:'.red, error);
            throw new Error('SLACK_API_ERROR');
        }
    }

    /**
     * Récupère les membres d'un canal
     * @param accessToken Bot token OAuth
     * @param channelId ID du canal
     * @returns Liste des IDs des membres
     */
    static async getChannelMembers(accessToken: string, channelId: string): Promise<string[]> {
        try {
            console.log(`[SlackApiService] Fetching members for channel ${channelId}...`.cyan);
            const response = await axios.get<{ ok: boolean; members: string[]; error?: string }>(
                `${this.SLACK_API_BASE}/conversations.members`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    params: { channel: channelId }
                }
            );

            if (!response.data.ok)
                throw new Error(`Slack API error: ${response.data.error}`);
            console.log(`[SlackApiService] Found ${response.data.members.length} member(s)`.green);
            return response.data.members;
        } catch (error) {
            console.error('[SlackApiService] Error fetching channel members:'.red, error);
            throw new Error('SLACK_API_ERROR');
        }
    }

    /**
     * Récupère les réactions d'un message spécifique
     * @param accessToken Bot token OAuth
     * @param channelId ID du canal
     * @param messageTs Timestamp du message
     * @returns Objet avec le message et ses réactions
     */
    static async getMessageReactions(accessToken: string, channelId: string, messageTs: string): Promise<{ reactions: SlackReaction[]; message: SlackMessage }> {
        try {
            const response = await axios.get<{ ok: boolean; message: SlackMessage & { reactions?: SlackReaction[] }; error?: string }>(
                `${this.SLACK_API_BASE}/reactions.get`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        channel: channelId,
                        timestamp: messageTs,
                        full: true
                    }
                }
            );

            if (!response.data.ok)
                throw new Error(`Slack API error: ${response.data.error}`);
            return {reactions: response.data.message.reactions || [], message: response.data.message};
        } catch (error) {
            console.error('[SlackApiService] Error fetching message reactions:'.red, error);
            if (axios.isAxiosError(error) && error.response?.data?.error === 'message_not_found')
                return { reactions: [], message: {} as SlackMessage };
            throw new Error('SLACK_API_ERROR');
        }
    }
}
