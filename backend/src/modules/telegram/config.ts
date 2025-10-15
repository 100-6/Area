/**
 * Configuration du module Telegram
 * Contient la déclaration de tous les triggers (actions) et actions (reactions)
 */
export default {
    name: 'telegram',
    displayName: 'Telegram',
    description: 'Integrate with Telegram for reading and sending messages via bot',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg',
    color: '#0088cc',
    authType: 'bot_token',
    isActive: true,

    actions: [
        {
            name: 'on_message_received',
            displayName: 'Message Received',
            description: 'Triggers when a new message is received in a Telegram chat',
            configSchema: {
                type: 'object',
                required: ['chatId'],
                properties: {
                    chatId: {
                        type: 'string',
                        title: 'Chat ID',
                        description: 'The Telegram chat ID to monitor (can be user, group, or channel)',
                        pattern: '^-?[0-9]+$',
                        example: '123456789'
                    },
                    keyword: {
                        type: 'string',
                        title: 'Keyword (optional)',
                        description: 'Only trigger if message contains this keyword',
                        minLength: 1,
                        maxLength: 100,
                        example: 'hello'
                    },
                    messageType: {
                        type: 'string',
                        title: 'Message Type (optional)',
                        description: 'Filter by message type',
                        enum: ['any', 'text', 'photo', 'video', 'document', 'audio', 'voice', 'sticker'],
                        default: 'any'
                    },
                    fromUserId: {
                        type: 'string',
                        title: 'From User ID (optional)',
                        description: 'Only trigger for messages from this user',
                        pattern: '^[0-9]+$',
                        example: '987654321'
                    },
                    ignoreBots: {
                        type: 'boolean',
                        title: 'Ignore bots',
                        description: 'Ignore messages from bots',
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
            description: 'Send a text message to a Telegram chat',
            configSchema: {
                type: 'object',
                required: ['chatId', 'text'],
                properties: {
                    chatId: {
                        type: 'string',
                        title: 'Chat ID',
                        description: 'The Telegram chat ID where to send the message (supports variables like {{chat.id}})',
                        pattern: '^(-?[0-9]+|\\{\\{.+\\}\\})$',
                        example: '{{chat.id}}'
                    },
                    text: {
                        type: 'string',
                        title: 'Message Text',
                        description: 'The text message to send (supports variables and max 4096 characters)',
                        minLength: 1,
                        maxLength: 4096,
                        example: 'Hello {{from.first_name}}! You said: {{message.text}}'
                    },
                    parseMode: {
                        type: 'string',
                        title: 'Parse Mode (optional)',
                        description: 'Text formatting mode',
                        enum: ['None', 'Markdown', 'HTML'],
                        default: 'None'
                    },
                    replyToMessageId: {
                        type: 'string',
                        title: 'Reply to Message ID (optional)',
                        description: 'Reply to a specific message (supports variables like {{message.id}})',
                        pattern: '^([0-9]+|\\{\\{.+\\}\\})$',
                        example: '{{message.id}}'
                    },
                    disableWebPagePreview: {
                        type: 'boolean',
                        title: 'Disable Web Page Preview',
                        description: 'Disable link previews for URLs in the message',
                        default: false
                    },
                    disableNotification: {
                        type: 'boolean',
                        title: 'Silent Message',
                        description: 'Send message silently (users will receive notification without sound)',
                        default: false
                    }
                }
            }
        }
    ]
};
