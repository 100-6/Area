/**
 * Configuration du module Gmail
 * Contient la déclaration de tous les triggers (actions) et actions (reactions)
 */
export default {
    name: 'gmail',
    displayName: 'Gmail',
    description: 'Send, read, and manage emails with Gmail',
    iconUrl: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_lockup_default_1x_r5.png',
    color: '#EA4335',
    authType: 'oauth2',
    isActive: true,

    actions: [
        {
            name: 'on_new_email',
            displayName: 'New Email Received',
            description: 'Triggers when a new email is received in your inbox',
            configSchema: {
                type: 'object',
                properties: {
                    from: {
                        type: 'string',
                        title: 'From (optional)',
                        description: 'Only trigger for emails from this sender',
                        format: 'email',
                        example: 'example@gmail.com'
                    },
                    subject: {
                        type: 'string',
                        title: 'Subject contains (optional)',
                        description: 'Only trigger if subject contains this text',
                        maxLength: 200,
                        example: 'invoice'
                    },
                    hasAttachment: {
                        type: 'boolean',
                        title: 'Has attachment',
                        description: 'Only trigger for emails with attachments',
                        default: false
                    },
                    labelId: {
                        type: 'string',
                        title: 'Label ID (optional)',
                        description: 'Only trigger for emails with this label',
                        example: 'INBOX'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Email message ID' },
                    threadId: { type: 'string', description: 'Thread ID' },
                    from: { type: 'string', description: 'Sender email address' },
                    to: { type: 'string', description: 'Recipient email address' },
                    subject: { type: 'string', description: 'Email subject' },
                    snippet: { type: 'string', description: 'Email preview snippet' },
                    body: { type: 'string', description: 'Email body content' },
                    date: { type: 'string', format: 'date-time', description: 'Email date' },
                    labels: { type: 'array', items: { type: 'string' }, description: 'Email labels' },
                    hasAttachments: { type: 'boolean', description: 'Whether email has attachments' }
                }
            }
        },
        {
            name: 'on_labeled_email',
            displayName: 'Email Labeled',
            description: 'Triggers when an email receives a specific label',
            configSchema: {
                type: 'object',
                required: ['labelId'],
                properties: {
                    labelId: {
                        type: 'string',
                        title: 'Label ID',
                        description: 'The label ID to monitor',
                        example: 'Label_123'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Email message ID' },
                    threadId: { type: 'string', description: 'Thread ID' },
                    from: { type: 'string', description: 'Sender email address' },
                    subject: { type: 'string', description: 'Email subject' },
                    snippet: { type: 'string', description: 'Email preview snippet' },
                    labelId: { type: 'string', description: 'Label that was added' },
                    date: { type: 'string', format: 'date-time', description: 'Email date' }
                }
            }
        }
    ],

    reactions: [
        {
            name: 'send_email',
            displayName: 'Send Email',
            description: 'Send an email via Gmail',
            configSchema: {
                type: 'object',
                required: ['to', 'subject', 'body'],
                properties: {
                    to: {
                        type: 'string',
                        title: 'To',
                        description: 'Recipient email address (supports variables like {{from}})',
                        format: 'email',
                        example: 'recipient@example.com'
                    },
                    subject: {
                        type: 'string',
                        title: 'Subject',
                        description: 'Email subject (supports variables like {{subject}})',
                        maxLength: 500,
                        example: 'Re: {{subject}}'
                    },
                    body: {
                        type: 'string',
                        title: 'Body',
                        description: 'Email body content in plain text or HTML (supports variables)',
                        maxLength: 10000,
                        example: 'Hello,\n\nThank you for your email.\n\nBest regards'
                    },
                    cc: {
                        type: 'string',
                        title: 'CC (optional)',
                        description: 'Carbon copy recipients (comma-separated)',
                        example: 'cc1@example.com, cc2@example.com'
                    },
                    bcc: {
                        type: 'string',
                        title: 'BCC (optional)',
                        description: 'Blind carbon copy recipients (comma-separated)',
                        example: 'bcc@example.com'
                    },
                    inReplyTo: {
                        type: 'string',
                        title: 'In Reply To (optional)',
                        description: 'Message ID to reply to (use {{id}} from trigger)',
                        example: '{{id}}'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Sent email message ID' },
                    threadId: { type: 'string', description: 'Thread ID' },
                    labelIds: { type: 'array', items: { type: 'string' }, description: 'Applied labels' }
                }
            }
        },
        {
            name: 'add_label',
            displayName: 'Add Label to Email',
            description: 'Add a label to a specific email',
            configSchema: {
                type: 'object',
                required: ['messageId', 'labelId'],
                properties: {
                    messageId: {
                        type: 'string',
                        title: 'Message ID',
                        description: 'The email message ID (use {{id}} from trigger)',
                        example: '{{id}}'
                    },
                    labelId: {
                        type: 'string',
                        title: 'Label ID',
                        description: 'The label ID to add',
                        example: 'Label_123'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Email message ID' },
                    labelIds: { type: 'array', items: { type: 'string' }, description: 'Current labels' }
                }
            }
        },
        {
            name: 'mark_as_read',
            displayName: 'Mark Email as Read',
            description: 'Mark a specific email as read',
            configSchema: {
                type: 'object',
                required: ['messageId'],
                properties: {
                    messageId: {
                        type: 'string',
                        title: 'Message ID',
                        description: 'The email message ID to mark as read (use {{id}} from trigger)',
                        example: '{{id}}'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Email message ID' },
                    labelIds: { type: 'array', items: { type: 'string' }, description: 'Current labels' }
                }
            }
        },
        {
            name: 'move_to_trash',
            displayName: 'Move Email to Trash',
            description: 'Move a specific email to trash',
            configSchema: {
                type: 'object',
                required: ['messageId'],
                properties: {
                    messageId: {
                        type: 'string',
                        title: 'Message ID',
                        description: 'The email message ID to trash (use {{id}} from trigger)',
                        example: '{{id}}'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Email message ID' },
                    labelIds: { type: 'array', items: { type: 'string' }, description: 'Current labels' }
                }
            }
        }
    ]
};
