import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import 'colors';

/**
 * Service Gmail - Gére toutes les interactions avec l'API Gmail
 */
export class GmailService {
    private oauth2Client: OAuth2Client;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    }

    /**
     * Créer un client Gmail authentifié pour un utilisateur
     */
    private getGmailClient(accessToken: string, refreshToken?: string) {
        this.oauth2Client.setCredentials({access_token: accessToken, refresh_token: refreshToken});

        return google.gmail({ version: 'v1', auth: this.oauth2Client });
    }

    /**
     * Envoyer un email
     */
    async sendEmail(accessToken: string, to: string, subject: string, body: string, options?: { cc?: string; bcc?: string; inReplyTo?: string; refreshToken?: string; }): Promise<any> {
        try {
            const gmail = this.getGmailClient(accessToken, options?.refreshToken);

            // Construire les headers
            const headers = [
                `To: ${to}`,
                options?.cc ? `Cc: ${options.cc}` : '',
                options?.bcc ? `Bcc: ${options.bcc}` : '',
                `Subject: ${subject}`,
                options?.inReplyTo ? `In-Reply-To: ${options.inReplyTo}` : '',
                options?.inReplyTo ? `References: ${options.inReplyTo}` : '',
                'Content-Type: text/html; charset=utf-8'
            ].filter(line => line !== '').join('\n');

            // RFC 822: Headers, ligne vide, puis body
            const email = headers + '\n\n' + body;

            const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            const response = await gmail.users.messages.send({userId: 'me', requestBody: {raw: encodedEmail, threadId: options?.inReplyTo}});

            console.log(`[Gmail] Email sent successfully: ${response.data.id}`.green);
            return response.data;
        } catch (error) {
            console.error('[Gmail] Error sending email:'.red, error);
            throw error;
        }
    }

    /**
     * Récupérer les messages de l'utilisateur
     */
    async listMessages(accessToken: string, filters?: { from?: string; subject?: string; hasAttachment?: boolean; labelIds?: string[]; maxResults?: number; refreshToken?: string; }): Promise<any[]> {
        try {
            const gmail = this.getGmailClient(accessToken, filters?.refreshToken);
            let query = '';

            if (filters?.from)
                query += `from:${filters.from} `;
            if (filters?.subject)
                query += `subject:${filters.subject} `;
            if (filters?.hasAttachment)
                query += 'has:attachment ';
            const response = await gmail.users.messages.list({userId: 'me', q: query.trim() || undefined, labelIds: filters?.labelIds, maxResults: filters?.maxResults || 10});
            const messages = response.data.messages || [];
            console.log(`[Gmail] Found ${messages.length} messages`.cyan);
            const detailedMessages = await Promise.all(messages.map(msg => this.getMessage(accessToken, msg.id!, filters?.refreshToken)));
            return detailedMessages;
        } catch (error) {
            console.error('[Gmail] Error listing messages:'.red, error);
            throw error;
        }
    }

    /**
     * Récupérer un message spécifique
     */
    async getMessage(accessToken: string, messageId: string, refreshToken?: string): Promise<any> {
        try {
            const gmail = this.getGmailClient(accessToken, refreshToken);
            const response = await gmail.users.messages.get({userId: 'me', id: messageId, format: 'full'});
            const message = response.data;
            const headers = message.payload?.headers || [];
            const getHeader = (name: string) => {
                const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
                return header?.value || '';
            };
            let body = '';

            if (message.payload?.body?.data) {
                body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
            } else if (message.payload?.parts) {
                const textPart = message.payload.parts.find((part: any) => part.mimeType === 'text/plain' || part.mimeType === 'text/html');
                if (textPart?.body?.data)
                    body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
            }
            return {
                id: message.id,
                threadId: message.threadId,
                from: getHeader('From'),
                to: getHeader('To'),
                subject: getHeader('Subject'),
                snippet: message.snippet,
                body: body,
                date: getHeader('Date'),
                labels: message.labelIds || [],
                hasAttachments: message.payload?.parts?.some((part: any) => part.filename) || false
            };
        } catch (error) {
            console.error(`[Gmail] Error getting message ${messageId}:`.red, error);
            throw error;
        }
    }

    /**
     * Ajouter un label à un message
     */
    async addLabel(accessToken: string, messageId: string, labelId: string, refreshToken?: string): Promise<any> {
        try {
            const gmail = this.getGmailClient(accessToken, refreshToken);
            const response = await gmail.users.messages.modify({userId: 'me', id: messageId, requestBody: {addLabelIds: [labelId]}});

            console.log(`[Gmail] Label ${labelId} added to message ${messageId}`.green);
            return response.data;
        } catch (error) {
            console.error('[Gmail] Error adding label:'.red, error);
            throw error;
        }
    }

    /**
     * Marquer un message comme lu
     */
    async markAsRead(accessToken: string, messageId: string, refreshToken?: string): Promise<any> {
        try {
            const gmail = this.getGmailClient(accessToken, refreshToken);
            const response = await gmail.users.messages.modify({userId: 'me', id: messageId, requestBody: {removeLabelIds: ['UNREAD']}});

            console.log(`[Gmail] Message ${messageId} marked as read`.green);
            return response.data;
        } catch (error) {
            console.error('[Gmail] Error marking message as read:'.red, error);
            throw error;
        }
    }

    /**
     * Déplacer un message vers la corbeille
     */
    async moveToTrash(accessToken: string, messageId: string, refreshToken?: string): Promise<any> {
        try {
            const gmail = this.getGmailClient(accessToken, refreshToken);
            const response = await gmail.users.messages.trash({userId: 'me', id: messageId});

            console.log(`[Gmail] Message ${messageId} moved to trash`.green);
            return response.data;
        } catch (error) {
            console.error('[Gmail] Error moving message to trash:'.red, error);
            throw error;
        }
    }

    /**
     * Récupérer les labels de l'utilisateur
     */
    async listLabels(accessToken: string, refreshToken?: string): Promise<any[]> {
        try {
            const gmail = this.getGmailClient(accessToken, refreshToken);
            const response = await gmail.users.labels.list({userId: 'me'});
            const labels = response.data.labels || [];

            console.log(`[Gmail] Found ${labels.length} labels`.cyan);
            return labels;
        } catch (error) {
            console.error('[Gmail] Error listing labels:'.red, error);
            throw error;
        }
    }

    /**
     * Regarder les changements (pour le systéme de push notifications)
     * Utilisé pour les triggers en temps réel
     */
    async watch(accessToken: string, topicName: string, labelIds?: string[], refreshToken?: string): Promise<any> {
        try {
            const gmail = this.getGmailClient(accessToken, refreshToken);
            const response = await gmail.users.watch({userId: 'me', requestBody: {topicName: topicName, labelIds: labelIds || ['INBOX']}});

            console.log(`[Gmail] Watch enabled for topic ${topicName}`.green);
            return response.data;
        } catch (error) {
            console.error('[Gmail] Error enabling watch:'.red, error);
            throw error;
        }
    }

    /**
     * Arréter de regarder les changements
     */
    async stopWatch(accessToken: string, refreshToken?: string): Promise<void> {
        try {
            const gmail = this.getGmailClient(accessToken, refreshToken);

            await gmail.users.stop({userId: 'me'});
            console.log('[Gmail] Watch stopped'.green);
        } catch (error) {
            console.error('[Gmail] Error stopping watch:'.red, error);
            throw error;
        }
    }
}
