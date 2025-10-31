/**
 * Configuration du module Slack
 * Contient la déclaration de tous les triggers (actions) et actions (reactions)
 */
export default {
    name: 'slack',
    displayName: 'Slack',
    description: 'Automate Slack workspace with messages, channels, reactions, and team collaboration',
    iconUrl: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg',
    color: '#4A154B',
    authType: 'oauth2',
    isActive: true,

    actions: [
        {
            name: 'on_new_message',
            displayName: 'New Message Posted',
            description: 'Triggers when a new message is posted in a Slack channel',
            configSchema: {
                type: 'object',
                required: ['channelId'],
                properties: {
                    channelId: {
                        type: 'string',
                        title: 'Channel ID',
                        description: 'The Slack channel ID to monitor (e.g., C01234ABC)',
                        minLength: 1,
                        example: 'C01234ABCDE'
                    },
                    keyword: {
                        type: 'string',
                        title: 'Keyword (optional)',
                        description: 'Only trigger if message contains this keyword',
                        minLength: 1,
                        maxLength: 100,
                        example: 'urgent'
                    },
                    userId: {
                        type: 'string',
                        title: 'User ID (optional)',
                        description: 'Only trigger for messages from this user (e.g., U01234ABC)',
                        minLength: 1,
                        example: 'U01234ABCDE'
                    },
                    ignoreBots: {
                        type: 'boolean',
                        title: 'Ignore bots',
                        description: 'Ignore messages from bot users',
                        default: true
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    messageId: { type: 'string', description: 'Message timestamp ID' },
                    channelId: { type: 'string', description: 'Channel ID' },
                    userId: { type: 'string', description: 'User ID who posted the message' },
                    username: { type: 'string', description: 'Username' },
                    text: { type: 'string', description: 'Message text content' },
                    timestamp: { type: 'string', description: 'Message timestamp' },
                    threadTs: { type: 'string', description: 'Thread timestamp (if in a thread)' }
                }
            }
        },
        {
            name: 'on_direct_message',
            displayName: 'New Direct Message Received',
            description: 'Triggers when a new direct message is received',
            configSchema: {
                type: 'object',
                properties: {
                    userId: {
                        type: 'string',
                        title: 'User ID (optional)',
                        description: 'Only trigger for DMs from this specific user',
                        minLength: 1,
                        example: 'U01234ABCDE'
                    },
                    keyword: {
                        type: 'string',
                        title: 'Keyword (optional)',
                        description: 'Only trigger if message contains this keyword',
                        minLength: 1,
                        maxLength: 100,
                        example: 'help'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    messageId: { type: 'string', description: 'Message timestamp ID' },
                    channelId: { type: 'string', description: 'DM channel ID' },
                    userId: { type: 'string', description: 'User ID who sent the DM' },
                    username: { type: 'string', description: 'Username' },
                    text: { type: 'string', description: 'Message text content' },
                    timestamp: { type: 'string', description: 'Message timestamp' }
                }
            }
        },
        {
            name: 'on_user_joined_channel',
            displayName: 'User Joined Channel',
            description: 'Triggers when a user joins a Slack channel',
            configSchema: {
                type: 'object',
                required: ['channelId'],
                properties: {
                    channelId: {
                        type: 'string',
                        title: 'Channel ID',
                        description: 'The Slack channel ID to monitor',
                        minLength: 1,
                        example: 'C01234ABCDE'
                    },
                    ignoreBots: {
                        type: 'boolean',
                        title: 'Ignore bots',
                        description: 'Ignore when bot users join the channel',
                        default: true
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'User ID who joined' },
                    username: { type: 'string', description: 'Username' },
                    channelId: { type: 'string', description: 'Channel ID' },
                    channelName: { type: 'string', description: 'Channel name' },
                    timestamp: { type: 'string', description: 'When the user joined' }
                }
            }
        },
        {
            name: 'on_reaction_added',
            displayName: 'Reaction Added to Message',
            description: 'Triggers when a reaction emoji is added to a message',
            configSchema: {
                type: 'object',
                required: ['channelId'],
                properties: {
                    channelId: {
                        type: 'string',
                        title: 'Channel ID',
                        description: 'The Slack channel ID to monitor',
                        minLength: 1,
                        example: 'C01234ABCDE'
                    },
                    emoji: {
                        type: 'string',
                        title: 'Emoji (optional)',
                        description: 'Only trigger for this specific emoji (without colons)',
                        minLength: 1,
                        maxLength: 100,
                        example: 'thumbsup'
                    },
                    ignoreBots: {
                        type: 'boolean',
                        title: 'Ignore bots',
                        description: 'Ignore reactions from bot users',
                        default: true
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    messageId: { type: 'string', description: 'Message timestamp ID' },
                    channelId: { type: 'string', description: 'Channel ID' },
                    userId: { type: 'string', description: 'User ID who added the reaction' },
                    username: { type: 'string', description: 'Username' },
                    emoji: { type: 'string', description: 'Emoji name (without colons)' },
                    timestamp: { type: 'string', description: 'When the reaction was added' }
                }
            }
        },
        {
            name: 'on_channel_created',
            displayName: 'Channel Created',
            description: 'Triggers when a new Slack channel is created in the workspace',
            configSchema: {
                type: 'object',
                properties: {
                    channelType: {
                        type: 'string',
                        title: 'Channel Type (optional)',
                        description: 'Filter by channel type',
                        enum: ['public', 'private', 'all'],
                        default: 'all'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    channelId: { type: 'string', description: 'New channel ID' },
                    channelName: { type: 'string', description: 'Channel name' },
                    creatorId: { type: 'string', description: 'User ID who created the channel' },
                    isPrivate: { type: 'boolean', description: 'Whether the channel is private' },
                    timestamp: { type: 'string', description: 'When the channel was created' }
                }
            }
        },
        {
            name: 'on_file_shared',
            displayName: 'File Shared in Channel',
            description: 'Triggers when a file is shared in a Slack channel',
            configSchema: {
                type: 'object',
                required: ['channelId'],
                properties: {
                    channelId: {
                        type: 'string',
                        title: 'Channel ID',
                        description: 'The Slack channel ID to monitor',
                        minLength: 1,
                        example: 'C01234ABCDE'
                    },
                    fileType: {
                        type: 'string',
                        title: 'File Type (optional)',
                        description: 'Only trigger for specific file types (e.g., pdf, image, video)',
                        minLength: 1,
                        example: 'pdf'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    fileId: { type: 'string', description: 'File ID' },
                    fileName: { type: 'string', description: 'File name' },
                    fileType: { type: 'string', description: 'File type' },
                    fileUrl: { type: 'string', description: 'File URL' },
                    fileSize: { type: 'number', description: 'File size in bytes' },
                    channelId: { type: 'string', description: 'Channel ID' },
                    userId: { type: 'string', description: 'User ID who shared the file' },
                    username: { type: 'string', description: 'Username' },
                    timestamp: { type: 'string', description: 'When the file was shared' }
                }
            }
        }
    ],

    reactions: [
        {
            name: 'send_message',
            displayName: 'Send Message to Channel',
            description: 'Send a text message to a Slack channel',
            configSchema: {
                type: 'object',
                required: ['channelId', 'text'],
                properties: {
                    channelId: {
                        type: 'string',
                        title: 'Channel ID',
                        description: 'The Slack channel ID where to send the message',
                        minLength: 1,
                        example: 'C01234ABCDE'
                    },
                    text: {
                        type: 'string',
                        title: 'Message Text',
                        description: 'The text message to send (supports variables like {{username}})',
                        minLength: 1,
                        maxLength: 4000,
                        example: 'Welcome {{username}} to the channel!'
                    },
                    threadTs: {
                        type: 'string',
                        title: 'Thread Timestamp (optional)',
                        description: 'Reply to a specific thread (use {{messageId}} from trigger)',
                        example: '{{messageId}}'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    messageId: { type: 'string', description: 'Sent message timestamp ID' },
                    channelId: { type: 'string', description: 'Channel ID' },
                    text: { type: 'string', description: 'Message text' }
                }
            }
        },
        {
            name: 'send_direct_message',
            displayName: 'Send Direct Message',
            description: 'Send a direct message to a Slack user',
            configSchema: {
                type: 'object',
                required: ['userId', 'text'],
                properties: {
                    userId: {
                        type: 'string',
                        title: 'User ID',
                        description: 'The Slack user ID to send the DM to (use {{userId}} from trigger)',
                        minLength: 1,
                        example: '{{userId}}'
                    },
                    text: {
                        type: 'string',
                        title: 'Message Text',
                        description: 'The text message to send (supports variables)',
                        minLength: 1,
                        maxLength: 4000,
                        example: 'Hello! Your request has been processed.'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    messageId: { type: 'string', description: 'Sent message timestamp ID' },
                    channelId: { type: 'string', description: 'DM channel ID' },
                    userId: { type: 'string', description: 'Recipient user ID' }
                }
            }
        },
        {
            name: 'reply_in_thread',
            displayName: 'Reply in Thread',
            description: 'Reply to a message in a thread',
            configSchema: {
                type: 'object',
                required: ['channelId', 'threadTs', 'text'],
                properties: {
                    channelId: {
                        type: 'string',
                        title: 'Channel ID',
                        description: 'The Slack channel ID',
                        minLength: 1,
                        example: 'C01234ABCDE'
                    },
                    threadTs: {
                        type: 'string',
                        title: 'Thread Timestamp',
                        description: 'The parent message timestamp (use {{messageId}} from trigger)',
                        minLength: 1,
                        example: '{{messageId}}'
                    },
                    text: {
                        type: 'string',
                        title: 'Reply Text',
                        description: 'The text message to reply (supports variables)',
                        minLength: 1,
                        maxLength: 4000,
                        example: 'Thanks for your message, {{username}}!'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    messageId: { type: 'string', description: 'Reply message timestamp ID' },
                    channelId: { type: 'string', description: 'Channel ID' },
                    threadTs: { type: 'string', description: 'Parent thread timestamp' }
                }
            }
        },
        {
            name: 'create_channel',
            displayName: 'Create Channel',
            description: 'Create a new Slack channel',
            configSchema: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: {
                        type: 'string',
                        title: 'Channel Name',
                        description: 'The channel name (lowercase, no spaces, max 80 chars)',
                        minLength: 1,
                        maxLength: 80,
                        pattern: '^[a-z0-9-_]+$',
                        example: 'new-project-team'
                    },
                    isPrivate: {
                        type: 'boolean',
                        title: 'Private Channel',
                        description: 'Create a private channel (default: public)',
                        default: false
                    },
                    description: {
                        type: 'string',
                        title: 'Description (optional)',
                        description: 'Channel description',
                        maxLength: 250,
                        example: 'Project coordination channel'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    channelId: { type: 'string', description: 'Created channel ID' },
                    channelName: { type: 'string', description: 'Channel name' },
                    isPrivate: { type: 'boolean', description: 'Whether the channel is private' }
                }
            }
        },
        {
            name: 'invite_user_to_channel',
            displayName: 'Invite User to Channel',
            description: 'Invite a user to a Slack channel',
            configSchema: {
                type: 'object',
                required: ['channelId', 'userId'],
                properties: {
                    channelId: {
                        type: 'string',
                        title: 'Channel ID',
                        description: 'The Slack channel ID',
                        minLength: 1,
                        example: 'C01234ABCDE'
                    },
                    userId: {
                        type: 'string',
                        title: 'User ID',
                        description: 'The user ID to invite (use {{userId}} from trigger)',
                        minLength: 1,
                        example: '{{userId}}'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    channelId: { type: 'string', description: 'Channel ID' },
                    userId: { type: 'string', description: 'Invited user ID' },
                    success: { type: 'boolean', description: 'Whether the invitation succeeded' }
                }
            }
        },
        {
            name: 'set_channel_topic',
            displayName: 'Set Channel Topic',
            description: 'Set or update the topic of a Slack channel',
            configSchema: {
                type: 'object',
                required: ['channelId', 'topic'],
                properties: {
                    channelId: {
                        type: 'string',
                        title: 'Channel ID',
                        description: 'The Slack channel ID',
                        minLength: 1,
                        example: 'C01234ABCDE'
                    },
                    topic: {
                        type: 'string',
                        title: 'Topic',
                        description: 'The channel topic (supports variables, max 250 chars)',
                        minLength: 0,
                        maxLength: 250,
                        example: 'Weekly standup - Next meeting: {{date}}'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    channelId: { type: 'string', description: 'Channel ID' },
                    topic: { type: 'string', description: 'Updated topic' }
                }
            }
        },
        {
            name: 'add_reaction',
            displayName: 'Add Reaction to Message',
            description: 'Add an emoji reaction to a Slack message',
            configSchema: {
                type: 'object',
                required: ['channelId', 'messageTs', 'emoji'],
                properties: {
                    channelId: {
                        type: 'string',
                        title: 'Channel ID',
                        description: 'The Slack channel ID',
                        minLength: 1,
                        example: 'C01234ABCDE'
                    },
                    messageTs: {
                        type: 'string',
                        title: 'Message Timestamp',
                        description: 'The message timestamp (use {{messageId}} from trigger)',
                        minLength: 1,
                        example: '{{messageId}}'
                    },
                    emoji: {
                        type: 'string',
                        title: 'Emoji',
                        description: 'The emoji name without colons (e.g., thumbsup, heart, fire)',
                        minLength: 1,
                        maxLength: 100,
                        example: 'thumbsup'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    channelId: { type: 'string', description: 'Channel ID' },
                    messageTs: { type: 'string', description: 'Message timestamp' },
                    emoji: { type: 'string', description: 'Added emoji' },
                    success: { type: 'boolean', description: 'Whether the reaction was added' }
                }
            }
        },
        {
            name: 'pin_message',
            displayName: 'Pin Message',
            description: 'Pin a message in a Slack channel',
            configSchema: {
                type: 'object',
                required: ['channelId', 'messageTs'],
                properties: {
                    channelId: {
                        type: 'string',
                        title: 'Channel ID',
                        description: 'The Slack channel ID',
                        minLength: 1,
                        example: 'C01234ABCDE'
                    },
                    messageTs: {
                        type: 'string',
                        title: 'Message Timestamp',
                        description: 'The message timestamp to pin (use {{messageId}} from trigger)',
                        minLength: 1,
                        example: '{{messageId}}'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    channelId: { type: 'string', description: 'Channel ID' },
                    messageTs: { type: 'string', description: 'Pinned message timestamp' },
                    success: { type: 'boolean', description: 'Whether the message was pinned' }
                }
            }
        }
    ]
};
