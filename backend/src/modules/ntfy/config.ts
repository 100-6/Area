export default {
    name: 'ntfy',
    displayName: 'Ntfy',
    description: 'Send and receive push notifications via ntfy.sh',
    iconUrl: '/icons/ntfy.png',
    color: '#338574',
    authType: 'none',
    isActive: true,

    actions: [
        {
            name: 'message_received',
            displayName: 'Message Received',
            description: 'Triggers when a message is received on a ntfy topic',
            triggerType: 'polling',
            configSchema: {
                type: 'object',
                required: ['topic'],
                properties: {
                    baseUrl: {
                        type: 'string',
                        description: 'Ntfy server URL',
                        default: 'https://ntfy.sh',
                        example: 'https://ntfy.sh'
                    },
                    topic: {
                        type: 'string',
                        description: 'Topic to subscribe to',
                        example: 'my-alerts',
                        pattern: '^[a-zA-Z0-9_-]+$'
                    },
                    since: {
                        type: 'string',
                        description: 'Only return messages since this time (e.g., "10m", "2h", "all")',
                        default: '10m',
                        example: '10m'
                    },
                    priority: {
                        type: 'array',
                        description: 'Filter by priority (1=min, 5=max)',
                        items: {
                            type: 'number',
                            minimum: 1,
                            maximum: 5
                        }
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'Message ID'
                    },
                    time: {
                        type: 'number',
                        description: 'Unix timestamp'
                    },
                    event: {
                        type: 'string',
                        description: 'Event type (message, open, keepalive)'
                    },
                    topic: {
                        type: 'string',
                        description: 'Topic name'
                    },
                    priority: {
                        type: 'number',
                        description: 'Message priority (1-5)'
                    },
                    tags: {
                        type: 'array',
                        description: 'Message tags',
                        items: { type: 'string' }
                    },
                    title: {
                        type: 'string',
                        description: 'Notification title'
                    },
                    message: {
                        type: 'string',
                        description: 'Notification message body'
                    },
                    click: {
                        type: 'string',
                        description: 'Click URL'
                    }
                }
            }
        }
    ],

    reactions: [
        {
            name: 'send_notification',
            displayName: 'Send Notification',
            description: 'Send a notification to a ntfy topic',
            configSchema: {
                type: 'object',
                required: ['topic', 'message'],
                properties: {
                    baseUrl: {
                        type: 'string',
                        title: 'Server URL',
                        description: 'Ntfy server URL',
                        default: 'https://ntfy.sh',
                        example: 'https://ntfy.sh'
                    },
                    topic: {
                        type: 'string',
                        title: 'Topic',
                        description: 'Topic to publish to',
                        example: 'my-alerts',
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
                        description: 'Emoji shortcodes or tags (e.g., ["warning", "skull"])',
                        items: { type: 'string' }
                    },
                    click: {
                        type: 'string',
                        title: 'Click URL (optional)',
                        description: 'URL to open when notification is clicked',
                        format: 'uri'
                    },
                    delay: {
                        type: 'string',
                        title: 'Delay (optional)',
                        description: 'Schedule delivery (e.g., "30min", "2h", "1d")',
                        pattern: '^\\d+(s|m|min|h|d)$'
                    }
                }
            },
            outputSchema: {
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
                    }
                }
            }
        },
        {
            name: 'send_notification_with_attachment',
            displayName: 'Send Notification with Attachment',
            description: 'Send a notification with an external URL attachment',
            configSchema: {
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
            },
            outputSchema: {
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
            }
        }
    ]
};
