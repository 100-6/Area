import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import axios from 'axios';
import 'colors';

/**
 * Action: Send Notification with Attachment
 * Sends a notification with an external URL attachment to a ntfy topic
 */
export class SendNotificationWithAttachment extends BaseAction {
    getName(): string {
        return 'send_notification_with_attachment';
    }

    getDescription(): string {
        return 'Send a notification with an external URL attachment';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['topic', 'message', 'attachmentUrl'],
            properties: {
                baseUrl: {
                    type: 'string',
                    title: 'Server URL',
                    description: 'Ntfy server URL',
                    default: 'https://ntfy.sh'
                },
                topic: {
                    type: 'string',
                    title: 'Topic',
                    description: 'Topic to publish to',
                    pattern: '^[a-zA-Z0-9_-]+$'
                },
                message: {
                    type: 'string',
                    title: 'Message',
                    description: 'Notification message body',
                    minLength: 1,
                    maxLength: 4096
                },
                title: {
                    type: 'string',
                    title: 'Title (optional)',
                    description: 'Notification title',
                    maxLength: 256
                },
                attachmentUrl: {
                    type: 'string',
                    title: 'Attachment URL',
                    description: 'External URL to attach (must be publicly accessible)',
                    format: 'uri'
                },
                filename: {
                    type: 'string',
                    title: 'Filename (optional)',
                    description: 'Display name for the attachment'
                },
                priority: {
                    type: 'number',
                    title: 'Priority',
                    description: 'Message priority (1=min, 3=default, 5=max)',
                    enum: [1, 2, 3, 4, 5],
                    default: 3
                },
                tags: {
                    type: 'array',
                    title: 'Tags (optional)',
                    description: 'Emoji shortcodes or tags',
                    items: { type: 'string' }
                },
                click: {
                    type: 'string',
                    title: 'Click URL (optional)',
                    description: 'URL to open when notification is clicked',
                    format: 'uri'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: {
                    type: 'boolean',
                    description: 'Whether the notification was sent successfully'
                },
                topic: {
                    type: 'string',
                    description: 'Topic the notification was sent to'
                },
                messageId: {
                    type: 'string',
                    description: 'ID of the sent message'
                },
                attachmentUrl: {
                    type: 'string',
                    description: 'URL of the attachment'
                }
            }
        };
    }

    getRequiredScopes(): string[] {
        return [];
    }

    validate(config: ActionConfig): boolean {
        if (!config.topic || typeof config.topic !== 'string') {
            throw new Error('topic is required and must be a string');
        }

        const topicRegex = /^[a-zA-Z0-9_-]+$/;
        if (!topicRegex.test(config.topic)) {
            throw new Error('topic must contain only alphanumeric characters, underscores, and dashes');
        }

        if (!config.message || typeof config.message !== 'string') {
            throw new Error('message is required and must be a string');
        }

        if (config.message.length < 1 || config.message.length > 4096) {
            throw new Error('message must be between 1 and 4096 characters');
        }

        if (!config.attachmentUrl || typeof config.attachmentUrl !== 'string') {
            throw new Error('attachmentUrl is required and must be a valid URL');
        }

        try {
            new URL(config.attachmentUrl);
        } catch {
            throw new Error('attachmentUrl must be a valid URL');
        }

        if (config.title && config.title.length > 256) {
            throw new Error('title must be 256 characters or less');
        }

        if (config.priority && (config.priority < 1 || config.priority > 5)) {
            throw new Error('priority must be between 1 and 5');
        }

        if (config.tags && !Array.isArray(config.tags)) {
            throw new Error('tags must be an array of strings');
        }

        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            console.log(`[SendNotificationWithAttachment] Executing for AREA ${context.areaId}`.cyan);

            const baseUrl = config.baseUrl || 'https://ntfy.sh';
            const topic = this.replaceVariables(config.topic, context);
            const message = this.replaceVariables(config.message, context);
            const title = config.title ? this.replaceVariables(config.title, context) : undefined;
            const attachmentUrl = this.replaceVariables(config.attachmentUrl, context);
            const filename = config.filename ? this.replaceVariables(config.filename, context) : undefined;
            const click = config.click ? this.replaceVariables(config.click, context) : undefined;
            const priority = config.priority || 3;
            const tags = config.tags || [];

            const url = `${baseUrl}/${topic}`;

            console.log(`[SendNotificationWithAttachment] Sending notification to topic "${topic}"`.cyan);
            console.log(`[SendNotificationWithAttachment] Message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`.cyan);
            console.log(`[SendNotificationWithAttachment] Attachment: ${attachmentUrl}`.cyan);

            // Build headers
            const headers: Record<string, string> = {
                'Content-Type': 'text/plain; charset=utf-8',
                'Attach': attachmentUrl
            };

            if (title) {
                headers['Title'] = title;
            }

            if (filename) {
                headers['Filename'] = filename;
            }

            if (priority) {
                headers['Priority'] = priority.toString();
            }

            if (tags && tags.length > 0) {
                headers['Tags'] = tags.join(',');
            }

            if (click) {
                headers['Click'] = click;
            }

            // Send the notification
            const response = await axios.post(url, message, { headers });

            const executionTime = Date.now() - startTime;

            console.log(`[SendNotificationWithAttachment] ✓ Notification sent successfully`.green);
            console.log(`[SendNotificationWithAttachment] Response status: ${response.status}`.green);

            // Extract message ID from response headers
            const messageId = response.headers['x-ntfy-id'] || 'unknown';

            return {
                success: true,
                data: {
                    success: true,
                    topic: topic,
                    messageId: messageId,
                    attachmentUrl: attachmentUrl
                },
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[SendNotificationWithAttachment] ❌ Failed to send notification:`.red, error);

            let errorMessage = 'Unknown error';
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.error || error.message;
                console.error(`[SendNotificationWithAttachment] Status: ${error.response?.status}`.red);
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            return {
                success: false,
                error: errorMessage,
                executionTime
            };
        }
    }
}
