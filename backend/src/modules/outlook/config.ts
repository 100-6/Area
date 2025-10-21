/**
 * Configuration du module Outlook
 * Contient la déclaration de tous les triggers (actions) et actions (reactions)
 */
export default {
    name: 'outlook',
    displayName: 'Microsoft Outlook',
    description: 'Send, read, and manage emails and calendar with Outlook',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg',
    color: '#0078D4',
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
                    folderName: {
                        type: 'string',
                        title: 'Folder Name (optional)',
                        description: 'Only trigger for emails in this folder',
                        example: 'Inbox'
                    },
                    from: {
                        type: 'string',
                        title: 'From (optional)',
                        description: 'Only trigger for emails from this sender',
                        format: 'email',
                        example: 'example@outlook.com'
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
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Email message ID' },
                    from: { type: 'string', description: 'Sender email address' },
                    fromName: { type: 'string', description: 'Sender name' },
                    to: { type: 'string', description: 'Recipient email address' },
                    subject: { type: 'string', description: 'Email subject' },
                    bodyPreview: { type: 'string', description: 'Email preview snippet' },
                    body: { type: 'string', description: 'Email body content' },
                    receivedDateTime: { type: 'string', format: 'date-time', description: 'Email received date' },
                    hasAttachments: { type: 'boolean', description: 'Whether email has attachments' }
                }
            }
        },
        {
            name: 'on_email_with_attachment',
            displayName: 'Email with Attachment Received',
            description: 'Triggers when an email with attachments is received',
            configSchema: {
                type: 'object',
                properties: {
                    fileExtension: {
                        type: 'string',
                        title: 'File Extension (optional)',
                        description: 'Only trigger for specific file types (e.g., .pdf, .docx)',
                        example: '.pdf'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Email message ID' },
                    from: { type: 'string', description: 'Sender email address' },
                    subject: { type: 'string', description: 'Email subject' },
                    attachments: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', description: 'Attachment ID' },
                                name: { type: 'string', description: 'Attachment filename' },
                                contentType: { type: 'string', description: 'MIME type' },
                                size: { type: 'number', description: 'Size in bytes' }
                            }
                        },
                        description: 'List of attachments'
                    },
                    receivedDateTime: { type: 'string', format: 'date-time', description: 'Email received date' }
                }
            }
        },
        {
            name: 'on_calendar_event_created',
            displayName: 'Calendar Event Created',
            description: 'Triggers when a new calendar event is created',
            configSchema: {
                type: 'object',
                properties: {
                    calendarId: {
                        type: 'string',
                        title: 'Calendar ID (optional)',
                        description: 'Monitor a specific calendar (leave empty for default calendar)',
                        example: 'AAMkAGI2...'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Event ID' },
                    subject: { type: 'string', description: 'Event title/subject' },
                    bodyPreview: { type: 'string', description: 'Event description preview' },
                    start: {
                        type: 'object',
                        properties: {
                            dateTime: { type: 'string', format: 'date-time', description: 'Start date and time' },
                            timeZone: { type: 'string', description: 'Time zone' }
                        }
                    },
                    end: {
                        type: 'object',
                        properties: {
                            dateTime: { type: 'string', format: 'date-time', description: 'End date and time' },
                            timeZone: { type: 'string', description: 'Time zone' }
                        }
                    },
                    location: { type: 'string', description: 'Event location' },
                    organizerName: { type: 'string', description: 'Organizer name' },
                    organizerEmail: { type: 'string', description: 'Organizer email' }
                }
            }
        }
    ],

    reactions: [
        {
            name: 'send_email',
            displayName: 'Send Email',
            description: 'Send an email via Outlook',
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
                    contentType: {
                        type: 'string',
                        title: 'Content Type',
                        description: 'Email body format',
                        enum: ['text', 'html'],
                        default: 'text'
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
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Sent email message ID' },
                    sentDateTime: { type: 'string', format: 'date-time', description: 'Sent date and time' }
                }
            }
        },
        {
            name: 'create_calendar_event',
            displayName: 'Create Calendar Event',
            description: 'Create a new event in Outlook calendar',
            configSchema: {
                type: 'object',
                required: ['subject', 'start', 'end'],
                properties: {
                    subject: {
                        type: 'string',
                        title: 'Event Subject',
                        description: 'Title of the calendar event (supports variables)',
                        maxLength: 255,
                        example: 'Meeting: {{subject}}'
                    },
                    start: {
                        type: 'string',
                        title: 'Start Date/Time',
                        description: 'Event start date and time (ISO 8601 format)',
                        format: 'date-time',
                        example: '2024-01-15T10:00:00'
                    },
                    end: {
                        type: 'string',
                        title: 'End Date/Time',
                        description: 'Event end date and time (ISO 8601 format)',
                        format: 'date-time',
                        example: '2024-01-15T11:00:00'
                    },
                    location: {
                        type: 'string',
                        title: 'Location (optional)',
                        description: 'Event location',
                        example: 'Conference Room A'
                    },
                    body: {
                        type: 'string',
                        title: 'Description (optional)',
                        description: 'Event description (supports variables)',
                        maxLength: 5000,
                        example: 'Discussion about {{subject}}'
                    },
                    attendees: {
                        type: 'string',
                        title: 'Attendees (optional)',
                        description: 'Comma-separated email addresses of attendees',
                        example: 'attendee1@example.com, attendee2@example.com'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Created event ID' },
                    webLink: { type: 'string', description: 'Link to view event' },
                    createdDateTime: { type: 'string', format: 'date-time', description: 'Creation date and time' }
                }
            }
        }
    ]
};
