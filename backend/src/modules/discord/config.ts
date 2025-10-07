/**
 * Configuration du module Discord
 * Contient la déclaration de tous les triggers (actions) et actions (reactions)
 */
export default {
    name: 'discord',
    displayName: 'Discord',
    description: 'Integrate with Discord servers for messages, members, reactions, and more',
    iconUrl: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
    color: '#5865F2',
    authType: 'oauth2',
    isActive: true,

    actions: [
        {
            name: 'on_message_created',
            displayName: 'New Message Posted',
            description: 'Triggers when a new message is posted in a Discord channel',
            configSchema: {
                type: 'object',
                required: ['channelId'],
                properties: {
                    channelId: {
                        type: 'string',
                        title: 'Channel ID',
                        description: 'The Discord channel ID to monitor',
                        pattern: '^[0-9]{17,19}$',
                        example: '1234567890123456789'
                    },
                    keyword: {
                        type: 'string',
                        title: 'Keyword (optional)',
                        description: 'Only trigger if message contains this keyword',
                        minLength: 1,
                        maxLength: 100,
                        example: 'hello'
                    },
                    authorId: {
                        type: 'string',
                        title: 'Author ID (optional)',
                        description: 'Only trigger for messages from this user',
                        pattern: '^[0-9]{17,19}$',
                        example: '9876543210987654321'
                    },
                    ignoreBots: {
                        type: 'boolean',
                        title: 'Ignore bots',
                        description: 'Ignore messages from bots',
                        default: true
                    }
                }
            }
        },
        {
            name: 'on_member_join',
            displayName: 'Member Joins Server',
            description: 'Triggers when a new member joins a Discord server',
            configSchema: {
                type: 'object',
                required: ['guildId'],
                properties: {
                    guildId: {
                        type: 'string',
                        title: 'Server ID',
                        description: 'The Discord server (guild) ID to monitor',
                        pattern: '^[0-9]{17,19}$',
                        example: '1234567890123456789'
                    },
                    ignoreBots: {
                        type: 'boolean',
                        title: 'Ignore bots',
                        description: 'Ignore when bots join the server',
                        default: true
                    }
                }
            }
        },
        {
            name: 'on_reaction_added',
            displayName: 'Reaction Added',
            description: 'Triggers when a reaction is added to a Discord message',
            configSchema: {
                type: 'object',
                required: ['channelId'],
                properties: {
                    channelId: {
                        type: 'string',
                        title: 'Channel ID',
                        description: 'The Discord channel ID to monitor',
                        pattern: '^[0-9]{17,19}$',
                        example: '1234567890123456789'
                    },
                    messageId: {
                        type: 'string',
                        title: 'Message ID (optional)',
                        description: 'Monitor reactions on a specific message only',
                        pattern: '^[0-9]{17,19}$',
                        example: '9876543210987654321'
                    },
                    emoji: {
                        type: 'string',
                        title: 'Emoji (optional)',
                        description: 'Only trigger for a specific emoji',
                        minLength: 1,
                        maxLength: 100,
                        example: '👍'
                    },
                    ignoreBots: {
                        type: 'boolean',
                        title: 'Ignore bots',
                        description: 'Ignore reactions from bots',
                        default: true
                    }
                }
            }
        }
    ],

    reactions: [
        {
            name: 'send_message',
            displayName: 'Send Message',
            description: 'Send a text message to a Discord channel',
            configSchema: {
                type: 'object',
                required: ['channelId', 'content'],
                properties: {
                    channelId: {
                        type: 'string',
                        title: 'Channel ID',
                        description: 'The Discord channel ID where to send the message',
                        pattern: '^[0-9]{17,19}$',
                        example: '1234567890123456789'
                    },
                    content: {
                        type: 'string',
                        title: 'Message Content',
                        description: 'The text message to send (supports variables like {{author.username}})',
                        minLength: 1,
                        maxLength: 2000,
                        example: 'Welcome {{member.username}} to the server!'
                    },
                    replyToMessageId: {
                        type: 'string',
                        title: 'Reply to Message ID (optional)',
                        description: 'Reply to a specific message',
                        pattern: '^[0-9]{17,19}$',
                        example: '9876543210987654321'
                    }
                }
            }
        },
        {
            name: 'add_role',
            displayName: 'Add Role to Member',
            description: 'Add a role to a Discord server member',
            configSchema: {
                type: 'object',
                required: ['guildId', 'roleId', 'userId'],
                properties: {
                    guildId: {
                        type: 'string',
                        title: 'Server ID',
                        description: 'The Discord server (guild) ID',
                        pattern: '^[0-9]{17,19}$',
                        example: '1234567890123456789'
                    },
                    userId: {
                        type: 'string',
                        title: 'User ID',
                        description: 'The user ID to add the role to (use {{member.id}} for trigger data)',
                        pattern: '^[0-9]{17,19}$',
                        example: '{{member.id}}'
                    },
                    roleId: {
                        type: 'string',
                        title: 'Role ID',
                        description: 'The role ID to add to the member',
                        pattern: '^[0-9]{17,19}$',
                        example: '5555555555555555555'
                    },
                    reason: {
                        type: 'string',
                        title: 'Reason (optional)',
                        description: 'The reason for adding the role (shown in audit log)',
                        maxLength: 512,
                        example: 'Automated role assignment via AREA'
                    }
                }
            }
        },
        {
            name: 'kick_member',
            displayName: 'Kick Member',
            description: 'Kick a member from a Discord server',
            configSchema: {
                type: 'object',
                required: ['guildId', 'userId'],
                properties: {
                    guildId: {
                        type: 'string',
                        title: 'Server ID',
                        description: 'The Discord server (guild) ID',
                        pattern: '^[0-9]{17,19}$',
                        example: '1234567890123456789'
                    },
                    userId: {
                        type: 'string',
                        title: 'User ID',
                        description: 'The user ID to kick (use {{member.id}} for trigger data)',
                        pattern: '^[0-9]{17,19}$',
                        example: '{{member.id}}'
                    },
                    reason: {
                        type: 'string',
                        title: 'Reason (optional)',
                        description: 'The reason for kicking the member (shown in audit log)',
                        maxLength: 512,
                        example: 'Automated moderation via AREA'
                    }
                }
            }
        }
    ]
};
