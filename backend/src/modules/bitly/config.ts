/**
 * Bitly module configuration
 * Provides triggers and reactions for Bitly link management
 */
export default {
    name: 'bitly',
    displayName: 'Bitly',
    description: 'Automate link shortening workflows and react to Bitly analytics',
    iconUrl: 'https://cdn.iconscout.com/icon/free/png-256/free-bitly-5542272-4618164.png',
    color: '#ee6123',
    authType: 'oauth2',
    isActive: true,

    actions: [
        {
            name: 'on_new_bitlink',
            displayName: 'New Bitlink Created',
            description: 'Triggers when a new Bitly link is created in your account',
            configSchema: {
                type: 'object',
                properties: {
                    pollingInterval: {
                        type: 'number',
                        title: 'Polling interval (ms)',
                        description: 'How often to check for new Bitly links (minimum 60 seconds)',
                        default: 120000,
                        minimum: 60000
                    },
                    groupGuid: {
                        type: 'string',
                        title: 'Group GUID',
                        description: 'Bitly group to monitor. Leave empty for default group.'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Bitlink identifier' },
                    link: { type: 'string', description: 'Short link URL' },
                    longUrl: { type: 'string', description: 'Original long URL' },
                    title: { type: 'string', description: 'Bitlink title' },
                    createdAt: { type: 'string', description: 'Creation timestamp' },
                    groupGuid: { type: 'string', description: 'Group GUID where the bitlink was created' }
                }
            }
        },
        {
            name: 'on_bitlink_click_threshold',
            displayName: 'Bitlink Click Threshold Reached',
            description: 'Triggers when a Bitly link reaches the specified number of clicks',
            configSchema: {
                type: 'object',
                required: ['bitlink', 'threshold'],
                properties: {
                    bitlink: {
                        type: 'string',
                        title: 'Bitlink',
                        description: 'Bitly link to monitor (format: bit.ly/abc123)'
                    },
                    threshold: {
                        type: 'number',
                        title: 'Threshold',
                        description: 'Number of clicks required to trigger this action',
                        minimum: 1
                    },
                    unit: {
                        type: 'string',
                        title: 'Aggregation unit',
                        description: 'Time unit for click aggregation',
                        enum: ['minute', 'hour', 'day', 'week', 'month'],
                        default: 'day'
                    },
                    pollingInterval: {
                        type: 'number',
                        title: 'Polling interval (ms)',
                        description: 'How often to check click statistics (minimum 60 seconds)',
                        default: 300000,
                        minimum: 60000
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    bitlink: { type: 'string' },
                    threshold: { type: 'number' },
                    totalClicks: { type: 'number' },
                    previousClicks: { type: 'number' },
                    reachedAt: { type: 'string' },
                    unit: { type: 'string' }
                }
            }
        }
    ],
    reactions: [
        {
            name: 'create_bitlink',
            displayName: 'Create Bitlink',
            description: 'Create a new Bitly short link from a long URL',
            configSchema: {
                type: 'object',
                required: ['longUrl'],
                properties: {
                    longUrl: {
                        type: 'string',
                        title: 'Long URL',
                        description: 'Destination URL to shorten'
                    },
                    domain: {
                        type: 'string',
                        title: 'Domain',
                        description: 'Bitly domain to use (bit.ly, custom domain, etc.)'
                    },
                    groupGuid: {
                        type: 'string',
                        title: 'Group GUID',
                        description: 'Bitly group identifier (optional)'
                    },
                    title: {
                        type: 'string',
                        title: 'Title',
                        description: 'Optional title for the bitlink'
                    },
                    tags: {
                        type: 'array',
                        title: 'Tags',
                        description: 'Tags to assign to the bitlink',
                        items: { type: 'string' }
                    }
                }
            }
        },
        {
            name: 'update_bitlink_destination',
            displayName: 'Update Bitlink Destination',
            description: 'Update the destination URL, title, or tags of an existing bitlink',
            configSchema: {
                type: 'object',
                required: ['bitlink', 'newLongUrl'],
                properties: {
                    bitlink: {
                        type: 'string',
                        title: 'Bitlink',
                        description: 'Bitly link to update (format: bit.ly/abc123)'
                    },
                    newLongUrl: {
                        type: 'string',
                        title: 'New Long URL',
                        description: 'New destination URL'
                    },
                    title: {
                        type: 'string',
                        title: 'New Title',
                        description: 'Optional new title for the bitlink'
                    },
                    tags: {
                        type: 'array',
                        title: 'Tags',
                        description: 'Tags to set on the bitlink',
                        items: { type: 'string' }
                    }
                }
            }
        }
    ]
};
