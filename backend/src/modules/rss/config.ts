export default {
    name: 'rss',
    displayName: 'RSS Feed',
    description: 'Monitor RSS/Atom feeds for new items with optional pattern matching',
    iconUrl: 'https://cdn2.iconfinder.com/data/icons/New-Social-Media-Icon-Set-V11/512/rss-feeds.png',
    color: '#c4c4c4',
    authType: 'none',
    isActive: true,

    actions: [
        {
            name: 'new_feed_item',
            displayName: 'New Feed Item',
            description: 'Triggers when a new item is published to an RSS/Atom feed',
            triggerType: 'polling',
            configSchema: {
                type: 'object',
                required: ['feedUrl'],
                properties: {
                    feedUrl: {
                        type: 'string',
                        title: 'Feed URL',
                        description: 'RSS or Atom feed URL to monitor',
                        format: 'uri',
                        example: 'https://www.lemonde.fr/rss/une.xml'
                    },
                    pollInterval: {
                        type: 'number',
                        title: 'Poll Interval (ms)',
                        description: 'How often to check for new items (in milliseconds)',
                        default: 300000,
                        minimum: 60000,
                        example: 300000
                    },
                    matchTitle: {
                        type: 'string',
                        title: 'Match Title (optional)',
                        description: 'Regular expression to filter items by title (case-insensitive)',
                        example: 'politique|économie'
                    },
                    matchDescription: {
                        type: 'string',
                        title: 'Match Description (optional)',
                        description: 'Regular expression to filter items by description (case-insensitive)',
                        example: 'France|Europe'
                    },
                    matchKeywords: {
                        type: 'array',
                        title: 'Match Keywords (optional)',
                        description: 'List of keywords to search in title or description (case-insensitive, ANY match)',
                        items: {
                            type: 'string'
                        },
                        example: ['politique', 'économie', 'finance']
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    title: {
                        type: 'string',
                        description: 'Item title'
                    },
                    link: {
                        type: 'string',
                        description: 'Item URL'
                    },
                    description: {
                        type: 'string',
                        description: 'Item description/summary'
                    },
                    pubDate: {
                        type: 'string',
                        description: 'Publication date (ISO 8601)'
                    },
                    updated: {
                        type: 'string',
                        description: 'Last updated date (ISO 8601, Atom feeds only)'
                    },
                    guid: {
                        type: 'string',
                        description: 'Unique item identifier'
                    },
                    mediaUrl: {
                        type: 'string',
                        description: 'Attached media URL (if present)'
                    },
                    mediaWidth: {
                        type: 'number',
                        description: 'Attached media width in pixels (if present)'
                    },
                    mediaHeight: {
                        type: 'number',
                        description: 'Attached media height in pixels (if present)'
                    }
                }
            }
        }
    ],

    reactions: []
};
