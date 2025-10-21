import 'colors';

interface GraphAPIResponse<T = any> {
    value?: T[];
    '@odata.context'?: string;
    '@odata.nextLink'?: string;
}

/**
 * Service Outlook - Gére toutes les interactions avec l'API Microsoft Graph
 */
export class OutlookService {
    private readonly graphBaseUrl = 'https://graph.microsoft.com/v1.0';

    /**
     * Rafraîchir le token d'accès
     */
    private async refreshAccessToken(refreshToken: string): Promise<string> {
        try {
            const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
            const params = new URLSearchParams({
                client_id: process.env.OUTLOOK_CLIENT_ID || '',
                client_secret: process.env.OUTLOOK_CLIENT_SECRET || '',
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            });

            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });
            if (!response.ok)
                throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
            const data = await response.json() as { access_token: string };
            return data.access_token;
        } catch (error) {
            console.error('[Outlook] Error refreshing token:'.red, error);
            throw error;
        }
    }

    /**
     * Effectuer une requête à Microsoft Graph API
     */
    private async graphRequest<T = any>(endpoint: string, accessToken: string, options?: RequestInit, refreshToken?: string): Promise<T> {
        try {
            const url = endpoint.startsWith('http') ? endpoint : `${this.graphBaseUrl}${endpoint}`;
            let response = await fetch(url, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
            });

            if (response.status === 401 && refreshToken) {
                console.log('[Outlook] Token expired, refreshing...'.yellow);
                const newAccessToken = await this.refreshAccessToken(refreshToken);
                response = await fetch(url, {
                    ...options,
                    headers: {
                        'Authorization': `Bearer ${newAccessToken}`,
                        'Content-Type': 'application/json',
                        ...options?.headers,
                    },
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Graph API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            // Si la réponse est vide (ex: sendMail retourne 202 sans body)
            const contentLength = response.headers.get('content-length');
            if (contentLength === '0' || response.status === 204) {
                return {} as T;
            }

            // Vérifier si la réponse a du contenu avant de parser
            const text = await response.text();
            if (!text || text.trim().length === 0) {
                return {} as T;
            }

            return JSON.parse(text) as T;
        } catch (error) {
            console.error('[Outlook] Graph API request error:'.red, error);
            throw error;
        }
    }

    /**
     * Envoyer un email
     */
    async sendEmail(accessToken: string, to: string, subject: string, body: string, options?: { contentType?: 'text' | 'html'; cc?: string; bcc?: string; refreshToken?: string; }): Promise<any> {
        try {
            const message = {
                message: {
                    subject: subject,
                    body: {
                        contentType: options?.contentType === 'html' ? 'HTML' : 'Text',
                        content: body
                    },
                    toRecipients: [
                        {
                            emailAddress: {
                                address: to
                            }
                        }
                    ],
                    ccRecipients: options?.cc ? options.cc.split(',').map(email => ({
                        emailAddress: { address: email.trim() }
                    })) : undefined,
                    bccRecipients: options?.bcc ? options.bcc.split(',').map(email => ({
                        emailAddress: { address: email.trim() }
                    })) : undefined,
                },
                saveToSentItems: true
            };

            console.log('[Outlook] Sending email with payload:'.cyan, JSON.stringify(message, null, 2));

            const response = await this.graphRequest(
                '/me/sendMail',
                accessToken,
                {
                    method: 'POST',
                    body: JSON.stringify(message)
                },
                options?.refreshToken
            );
            console.log(`[Outlook] ✓ Email sent successfully to ${to}`.green);
            console.log(`[Outlook] Response from API:`.cyan, JSON.stringify(response, null, 2));
            return { id: 'sent', sentDateTime: new Date().toISOString() };
        } catch (error) {
            console.error('[Outlook] Error sending email:'.red, error);
            throw error;
        }
    }

    /**
     * Récupérer les messages de l'utilisateur
     */
    async listMessages(accessToken: string, filters?: { folderName?: string; from?: string; subject?: string; hasAttachment?: boolean; maxResults?: number; refreshToken?: string; }): Promise<any[]> {
        try {
            let endpoint = '/me/messages';
            const queryParams: string[] = [];
            const filterConditions: string[] = [];

            if (filters?.from)
                filterConditions.push(`from/emailAddress/address eq '${filters.from}'`);
            if (filters?.subject)
                filterConditions.push(`contains(subject, '${filters.subject}')`);
            if (filters?.hasAttachment)
                filterConditions.push(`hasAttachments eq true`);
            if (filterConditions.length > 0)
                queryParams.push(`$filter=${filterConditions.join(' and ')}`);
            queryParams.push(`$top=${filters?.maxResults || 10}`);
            if (filterConditions.length === 0)
                queryParams.push(`$orderby=receivedDateTime desc`);
            if (queryParams.length > 0)
                endpoint += `?${queryParams.join('&')}`;
            const response = await this.graphRequest<GraphAPIResponse>(endpoint, accessToken, undefined, filters?.refreshToken);
            let messages = response.value || [];
            if (filterConditions.length > 0) {
                messages = messages.sort((a, b) => {
                    const dateA = new Date(a.receivedDateTime || 0).getTime();
                    const dateB = new Date(b.receivedDateTime || 0).getTime();
                    return dateB - dateA;
                });
            }
            console.log(`[Outlook] Found ${messages.length} messages`.cyan);
            return messages.map(msg => this.formatMessage(msg));
        } catch (error) {
            console.error('[Outlook] Error listing messages:'.red, error);
            throw error;
        }
    }

    /**
     * Récupérer un message spécifique
     */
    async getMessage(accessToken: string, messageId: string, refreshToken?: string): Promise<any> {
        try {
            const message = await this.graphRequest(`/me/messages/${messageId}`, accessToken, undefined, refreshToken);

            console.log(`[Outlook] Message ${messageId} retrieved`.cyan);
            return this.formatMessage(message);
        } catch (error) {
            console.error(`[Outlook] Error getting message ${messageId}:`.red, error);
            throw error;
        }
    }

    /**
     * Formater un message pour une structure cohérente
     */
    private formatMessage(msg: any): any {
        return {
            id: msg.id,
            from: msg.from?.emailAddress?.address || '',
            fromName: msg.from?.emailAddress?.name || '',
            to: msg.toRecipients?.[0]?.emailAddress?.address || '',
            subject: msg.subject || '',
            bodyPreview: msg.bodyPreview || '',
            body: msg.body?.content || '',
            receivedDateTime: msg.receivedDateTime || '',
            hasAttachments: msg.hasAttachments || false
        };
    }

    /**
     * Récupérer les pièces jointes d'un message
     */
    async getAttachments(accessToken: string, messageId: string, refreshToken?: string): Promise<any[]> {
        try {
            const response = await this.graphRequest<GraphAPIResponse>(`/me/messages/${messageId}/attachments`, accessToken, undefined, refreshToken);
            const attachments = response.value || [];

            console.log(`[Outlook] Found ${attachments.length} attachments for message ${messageId}`.cyan);
            return attachments.map(att => ({
                id: att.id,
                name: att.name,
                contentType: att.contentType,
                size: att.size
            }));
        } catch (error) {
            console.error(`[Outlook] Error getting attachments for message ${messageId}:`.red, error);
            throw error;
        }
    }

    /**
     * Récupérer les événements de calendrier
     */
    async listCalendarEvents(accessToken: string, filters?: { calendarId?: string; maxResults?: number; refreshToken?: string; }): Promise<any[]> {
        try {
            const calendarPath = filters?.calendarId ? `/me/calendars/${filters.calendarId}` : '/me';
            const endpoint = `${calendarPath}/events?$top=${filters?.maxResults || 10}&$orderby=createdDateTime desc`;
            const response = await this.graphRequest<GraphAPIResponse>(endpoint, accessToken, undefined, filters?.refreshToken);
            const events = response.value || [];

            console.log(`[Outlook] Found ${events.length} calendar events`.cyan);
            return events.map(evt => this.formatCalendarEvent(evt));
        } catch (error) {
            console.error('[Outlook] Error listing calendar events:'.red, error);
            throw error;
        }
    }

    /**
     * Créer un événement de calendrier
     */
    async createCalendarEvent(accessToken: string, subject: string, start: string, end: string, options?: { location?: string; body?: string; attendees?: string; refreshToken?: string; }): Promise<any> {
        try {
            const event = {
                subject: subject,
                start: {
                    dateTime: start,
                    timeZone: 'UTC'
                },
                end: {
                    dateTime: end,
                    timeZone: 'UTC'
                },
                location: options?.location ? {
                    displayName: options.location
                } : undefined,
                body: options?.body ? {
                    contentType: 'Text',
                    content: options.body
                } : undefined,
                attendees: options?.attendees ? options.attendees.split(',').map(email => ({
                    emailAddress: {
                        address: email.trim()
                    },
                    type: 'required'
                })) : undefined
            };
            const response = await this.graphRequest('/me/events', accessToken, {method: 'POST', body: JSON.stringify(event)}, options?.refreshToken);

            console.log(`[Outlook] Calendar event created: ${response.id}`.green);
            return {
                id: response.id,
                webLink: response.webLink,
                createdDateTime: response.createdDateTime
            };
        } catch (error) {
            console.error('[Outlook] Error creating calendar event:'.red, error);
            throw error;
        }
    }

    /**
     * Formater un événement de calendrier
     */
    private formatCalendarEvent(evt: any): any {
        return {
            id: evt.id,
            subject: evt.subject || '',
            bodyPreview: evt.bodyPreview || '',
            start: {
                dateTime: evt.start?.dateTime || '',
                timeZone: evt.start?.timeZone || 'UTC'
            },
            end: {
                dateTime: evt.end?.dateTime || '',
                timeZone: evt.end?.timeZone || 'UTC'
            },
            location: evt.location?.displayName || '',
            organizerName: evt.organizer?.emailAddress?.name || '',
            organizerEmail: evt.organizer?.emailAddress?.address || ''
        };
    }

    /**
     * Récupérer les dossiers mail
     */
    async listFolders(accessToken: string, refreshToken?: string): Promise<any[]> {
        try {
            const response = await this.graphRequest<GraphAPIResponse>('/me/mailFolders', accessToken, undefined, refreshToken);
            const folders = response.value || [];

            console.log(`[Outlook] Found ${folders.length} mail folders`.cyan);
            return folders;
        } catch (error) {
            console.error('[Outlook] Error listing folders:'.red, error);
            throw error;
        }
    }
}
