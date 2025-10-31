/**
 * Twitch module configuration
 * Defines triggers and actions for Twitch integration
 */
export default {
    name: 'twitch',
    displayName: 'Twitch',
    description: 'Automate your Twitch streams, chat, and channel management',
    iconUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIZIRMX5-Or4ggVfjID7HhXrLzrdeOJ3kkUQ&s',
    color: '#9146FF',
    authType: 'oauth2',
    isActive: true,

    actions: [
        {
            name: 'on_stream_start',
            displayName: 'Stream Started',
            description: 'Triggers when your stream goes live',
            configSchema: {
                type: 'object',
                properties: {
                    checkInterval: {
                        type: 'number',
                        title: 'Check Interval (seconds)',
                        description: 'How often to check if stream is live',
                        default: 60,
                        minimum: 30,
                        maximum: 300
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Stream ID' },
                    user_id: { type: 'string', description: 'Broadcaster user ID' },
                    user_login: { type: 'string', description: 'Broadcaster login name' },
                    user_name: { type: 'string', description: 'Broadcaster display name' },
                    game_id: { type: 'string', description: 'Game/Category ID' },
                    game_name: { type: 'string', description: 'Game/Category name' },
                    type: { type: 'string', description: 'Stream type (live)' },
                    title: { type: 'string', description: 'Stream title' },
                    viewer_count: { type: 'number', description: 'Current viewer count' },
                    started_at: { type: 'string', format: 'date-time', description: 'Stream start time' },
                    language: { type: 'string', description: 'Stream language' },
                    thumbnail_url: { type: 'string', description: 'Stream thumbnail URL' }
                }
            }
        },
        {
            name: 'on_stream_end',
            displayName: 'Stream Ended',
            description: 'Triggers when your stream goes offline',
            configSchema: {
                type: 'object',
                properties: {
                    checkInterval: {
                        type: 'number',
                        title: 'Check Interval (seconds)',
                        description: 'How often to check if stream is offline',
                        default: 60,
                        minimum: 30,
                        maximum: 300
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    user_id: { type: 'string', description: 'Broadcaster user ID' },
                    user_login: { type: 'string', description: 'Broadcaster login name' },
                    user_name: { type: 'string', description: 'Broadcaster display name' },
                    ended_at: { type: 'string', format: 'date-time', description: 'Stream end time' },
                    duration: { type: 'number', description: 'Stream duration in seconds' }
                }
            }
        },
        {
            name: 'on_new_follower',
            displayName: 'New Follower',
            description: 'Triggers when someone follows your channel',
            configSchema: {
                type: 'object',
                properties: {
                    checkInterval: {
                        type: 'number',
                        title: 'Check Interval (seconds)',
                        description: 'How often to check for new followers',
                        default: 120,
                        minimum: 60,
                        maximum: 600
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    follower_user_id: { type: 'string', description: 'Follower user ID' },
                    follower_user_login: { type: 'string', description: 'Follower login name' },
                    follower_user_name: { type: 'string', description: 'Follower display name' },
                    followed_at: { type: 'string', format: 'date-time', description: 'Follow timestamp' }
                }
            }
        },
        {
            name: 'on_title_change',
            displayName: 'Stream Title Changed',
            description: 'Triggers when stream title is updated',
            configSchema: {
                type: 'object',
                properties: {
                    checkInterval: {
                        type: 'number',
                        title: 'Check Interval (seconds)',
                        description: 'How often to check for title changes',
                        default: 60,
                        minimum: 30,
                        maximum: 300
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    old_title: { type: 'string', description: 'Previous stream title' },
                    new_title: { type: 'string', description: 'New stream title' },
                    changed_at: { type: 'string', format: 'date-time', description: 'Change timestamp' }
                }
            }
        },
        {
            name: 'on_raid',
            displayName: 'Raid Received',
            description: 'Triggers when someone raids your channel',
            configSchema: {
                type: 'object',
                properties: {
                    checkInterval: {
                        type: 'number',
                        title: 'Check Interval (seconds)',
                        description: 'How often to check for raids',
                        default: 30,
                        minimum: 15,
                        maximum: 120
                    },
                    minimumRaiders: {
                        type: 'number',
                        title: 'Minimum Raiders',
                        description: 'Minimum viewers to consider as raid',
                        default: 5,
                        minimum: 1
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    raider_user_id: { type: 'string', description: 'Raider user ID' },
                    raider_user_login: { type: 'string', description: 'Raider login name' },
                    raider_user_name: { type: 'string', description: 'Raider display name' },
                    viewer_count: { type: 'number', description: 'Approximate number of raiders' },
                    detected_at: { type: 'string', format: 'date-time', description: 'Detection timestamp' }
                }
            }
        },
        {
            name: 'on_subscription',
            displayName: 'New Subscription',
            description: 'Triggers when someone subscribes to your channel',
            configSchema: {
                type: 'object',
                properties: {
                    checkInterval: {
                        type: 'number',
                        title: 'Check Interval (seconds)',
                        description: 'How often to check for new subscribers',
                        default: 60,
                        minimum: 30,
                        maximum: 300
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    subscriber_user_id: { type: 'string', description: 'Subscriber user ID' },
                    subscriber_user_login: { type: 'string', description: 'Subscriber login name' },
                    subscriber_user_name: { type: 'string', description: 'Subscriber display name' },
                    tier: { type: 'string', description: 'Subscription tier (1000/2000/3000)' },
                    is_gift: { type: 'boolean', description: 'Whether subscription is a gift' },
                    subscribed_at: { type: 'string', format: 'date-time', description: 'Subscription timestamp' }
                }
            }
        },
        {
            name: 'on_viewer_milestone',
            displayName: 'Viewer Milestone',
            description: 'Triggers when viewer count reaches specific thresholds',
            configSchema: {
                type: 'object',
                required: ['thresholds'],
                properties: {
                    checkInterval: {
                        type: 'number',
                        title: 'Check Interval (seconds)',
                        description: 'How often to check viewer count',
                        default: 30,
                        minimum: 15,
                        maximum: 120
                    },
                    thresholds: {
                        type: 'array',
                        title: 'Thresholds',
                        description: 'Viewer count thresholds to trigger on',
                        items: { type: 'number' },
                        default: [50, 100, 500, 1000],
                        example: [50, 100, 500, 1000]
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    viewer_count: { type: 'number', description: 'Current viewer count' },
                    threshold_reached: { type: 'number', description: 'Milestone threshold reached' },
                    stream_id: { type: 'string', description: 'Stream ID' },
                    game_name: { type: 'string', description: 'Current game/category' },
                    reached_at: { type: 'string', format: 'date-time', description: 'Milestone timestamp' }
                }
            }
        },
        {
            name: 'on_channel_points_redemption',
            displayName: 'Channel Points Redeemed',
            description: 'Triggers when someone redeems a channel points reward',
            configSchema: {
                type: 'object',
                properties: {
                    checkInterval: {
                        type: 'number',
                        title: 'Check Interval (seconds)',
                        description: 'How often to check for redemptions',
                        default: 20,
                        minimum: 10,
                        maximum: 120
                    },
                    rewardId: {
                        type: 'string',
                        title: 'Reward ID',
                        description: 'Specific reward ID to monitor (optional)',
                        example: ''
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    redemption_id: { type: 'string', description: 'Redemption ID' },
                    user_id: { type: 'string', description: 'User who redeemed' },
                    user_login: { type: 'string', description: 'User login name' },
                    user_name: { type: 'string', description: 'User display name' },
                    user_input: { type: 'string', description: 'User input text' },
                    reward_id: { type: 'string', description: 'Reward ID' },
                    reward_title: { type: 'string', description: 'Reward title' },
                    reward_cost: { type: 'number', description: 'Reward cost in points' },
                    redeemed_at: { type: 'string', format: 'date-time', description: 'Redemption timestamp' }
                }
            }
        }
    ],

    reactions: [
        {
            name: 'send_chat_message',
            displayName: 'Send Chat Message',
            description: 'Send a message to your Twitch chat',
            configSchema: {
                type: 'object',
                required: ['message'],
                properties: {
                    message: {
                        type: 'string',
                        title: 'Message',
                        description: 'The message to send (supports variables like {{follower_user_name}})',
                        maxLength: 500,
                        example: 'Thanks for following, {{follower_user_name}}!'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    message_id: { type: 'string', description: 'Sent message ID' },
                    sent_at: { type: 'string', format: 'date-time', description: 'Message send timestamp' }
                }
            }
        },
        {
            name: 'update_stream_title',
            displayName: 'Update Stream Title',
            description: 'Update your stream title',
            configSchema: {
                type: 'object',
                required: ['title'],
                properties: {
                    title: {
                        type: 'string',
                        title: 'Stream Title',
                        description: 'New stream title (supports variables)',
                        maxLength: 140,
                        example: 'Playing {{game_name}} - Welcome!'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Updated title' },
                    updated_at: { type: 'string', format: 'date-time', description: 'Update timestamp' }
                }
            }
        },
        {
            name: 'update_game_category',
            displayName: 'Update Game/Category',
            description: 'Change your stream category/game',
            configSchema: {
                type: 'object',
                required: ['game_name'],
                properties: {
                    game_name: {
                        type: 'string',
                        title: 'Game/Category Name',
                        description: 'Name of the game or category',
                        example: 'Just Chatting'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    game_id: { type: 'string', description: 'Game ID' },
                    game_name: { type: 'string', description: 'Game name' },
                    updated_at: { type: 'string', format: 'date-time', description: 'Update timestamp' }
                }
            }
        },
        {
            name: 'create_clip',
            displayName: 'Create Clip',
            description: 'Create a clip of your stream',
            configSchema: {
                type: 'object',
                properties: {
                    has_delay: {
                        type: 'boolean',
                        title: 'Has Delay',
                        description: 'Whether to add delay before capturing',
                        default: false
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Clip ID' },
                    edit_url: { type: 'string', description: 'URL to edit the clip' },
                    url: { type: 'string', description: 'Public clip URL (available after processing)' }
                }
            }
        },
        {
            name: 'create_stream_marker',
            displayName: 'Create Stream Marker',
            description: 'Create a marker in your stream for easy navigation later',
            configSchema: {
                type: 'object',
                properties: {
                    description: {
                        type: 'string',
                        title: 'Marker Description',
                        description: 'Description of the marker (supports variables)',
                        maxLength: 140,
                        example: 'New follower: {{follower_user_name}}'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Marker ID' },
                    created_at: { type: 'string', format: 'date-time', description: 'Marker timestamp' },
                    description: { type: 'string', description: 'Marker description' },
                    position_seconds: { type: 'number', description: 'Position in stream (seconds)' }
                }
            }
        },
        {
            name: 'start_commercial',
            displayName: 'Start Commercial',
            description: 'Start a commercial break on your stream',
            configSchema: {
                type: 'object',
                required: ['length'],
                properties: {
                    length: {
                        type: 'number',
                        title: 'Commercial Length (seconds)',
                        description: 'Duration of the commercial',
                        enum: [30, 60, 90, 120, 150, 180],
                        default: 30
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    length: { type: 'number', description: 'Commercial duration' },
                    retry_after: { type: 'number', description: 'Seconds until next commercial is available' },
                    message: { type: 'string', description: 'Success message' }
                }
            }
        },
        {
            name: 'send_announcement',
            displayName: 'Send Announcement',
            description: 'Send a highlighted announcement in chat',
            configSchema: {
                type: 'object',
                required: ['message'],
                properties: {
                    message: {
                        type: 'string',
                        title: 'Announcement Message',
                        description: 'The announcement message (supports variables)',
                        maxLength: 500,
                        example: 'Stream starting in 5 minutes!'
                    },
                    color: {
                        type: 'string',
                        title: 'Announcement Color',
                        description: 'Color of the announcement',
                        enum: ['blue', 'green', 'orange', 'purple', 'primary'],
                        default: 'primary'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    message_id: { type: 'string', description: 'Announcement message ID' },
                    sent_at: { type: 'string', format: 'date-time', description: 'Send timestamp' }
                }
            }
        },
        {
            name: 'create_poll',
            displayName: 'Create Poll',
            description: 'Create a poll in your Twitch channel',
            configSchema: {
                type: 'object',
                required: ['title', 'choices', 'duration'],
                properties: {
                    title: {
                        type: 'string',
                        title: 'Poll Title',
                        description: 'Question for the poll',
                        maxLength: 60,
                        example: 'What game should we play next?'
                    },
                    choices: {
                        type: 'array',
                        title: 'Choices',
                        description: 'Poll choices (2-5 options)',
                        items: { type: 'string', maxLength: 25 },
                        minItems: 2,
                        maxItems: 5,
                        example: ['Game A', 'Game B', 'Game C']
                    },
                    duration: {
                        type: 'number',
                        title: 'Duration (seconds)',
                        description: 'Poll duration (15-1800)',
                        minimum: 15,
                        maximum: 1800,
                        default: 60
                    },
                    bits_voting_enabled: {
                        type: 'boolean',
                        title: 'Enable Bits Voting',
                        default: false
                    },
                    bits_per_vote: {
                        type: 'number',
                        title: 'Bits Per Vote',
                        minimum: 1,
                        maximum: 10000,
                        default: 10
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', description: 'Whether poll was created' },
                    poll_id: { type: 'string', description: 'Poll ID' },
                    title: { type: 'string', description: 'Poll title' }
                }
            }
        },
        {
            name: 'send_shoutout',
            displayName: 'Send Shoutout',
            description: 'Send a shoutout to another broadcaster',
            configSchema: {
                type: 'object',
                required: ['to_broadcaster_login'],
                properties: {
                    to_broadcaster_login: {
                        type: 'string',
                        title: 'Broadcaster Username',
                        description: 'Username to shoutout (supports variables)',
                        example: 'shroud'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', description: 'Whether shoutout was sent' },
                    to_broadcaster: { type: 'string', description: 'Broadcaster username' }
                }
            }
        },
        {
            name: 'ban_user',
            displayName: 'Ban/Timeout User',
            description: 'Ban or timeout a user in your channel',
            configSchema: {
                type: 'object',
                required: ['username'],
                properties: {
                    username: {
                        type: 'string',
                        title: 'Username',
                        description: 'Username to ban (supports variables)',
                        example: 'baduser123'
                    },
                    duration: {
                        type: 'number',
                        title: 'Duration (seconds)',
                        description: 'Timeout duration (0 = permanent ban)',
                        minimum: 0,
                        maximum: 1209600,
                        default: 600
                    },
                    reason: {
                        type: 'string',
                        title: 'Reason',
                        description: 'Ban reason',
                        maxLength: 500
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', description: 'Whether ban was applied' },
                    username: { type: 'string', description: 'Banned username' },
                    duration: { type: 'number', description: 'Ban duration' }
                }
            }
        },
        {
            name: 'create_prediction',
            displayName: 'Create Prediction',
            description: 'Create a prediction in your channel',
            configSchema: {
                type: 'object',
                required: ['title', 'outcomes', 'prediction_window'],
                properties: {
                    title: {
                        type: 'string',
                        title: 'Prediction Title',
                        description: 'Question for prediction',
                        maxLength: 45,
                        example: 'Will I win this match?'
                    },
                    outcomes: {
                        type: 'array',
                        title: 'Outcomes',
                        description: 'Exactly 2 options',
                        items: { type: 'string', maxLength: 25 },
                        minItems: 2,
                        maxItems: 2,
                        example: ['Yes', 'No']
                    },
                    prediction_window: {
                        type: 'number',
                        title: 'Window (seconds)',
                        description: 'Time for voting (30-1800)',
                        minimum: 30,
                        maximum: 1800,
                        default: 120
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', description: 'Whether prediction was created' },
                    prediction_id: { type: 'string', description: 'Prediction ID' },
                    title: { type: 'string', description: 'Prediction title' }
                }
            }
        },
        {
            name: 'update_chat_settings',
            displayName: 'Update Chat Settings',
            description: 'Update chat moderation settings',
            configSchema: {
                type: 'object',
                properties: {
                    slow_mode: {
                        type: 'boolean',
                        title: 'Slow Mode',
                        description: 'Enable slow mode'
                    },
                    slow_mode_wait_time: {
                        type: 'number',
                        title: 'Slow Mode Wait (seconds)',
                        description: 'Seconds between messages (3-120)',
                        minimum: 3,
                        maximum: 120,
                        default: 30
                    },
                    follower_mode: {
                        type: 'boolean',
                        title: 'Follower Only Mode'
                    },
                    follower_mode_duration: {
                        type: 'number',
                        title: 'Follower Duration (minutes)',
                        minimum: 0,
                        maximum: 129600,
                        default: 0
                    },
                    subscriber_mode: {
                        type: 'boolean',
                        title: 'Subscriber Only Mode'
                    },
                    emote_mode: {
                        type: 'boolean',
                        title: 'Emote Only Mode'
                    },
                    unique_chat_mode: {
                        type: 'boolean',
                        title: 'Unique Chat Mode (R9K)'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', description: 'Whether settings were updated' },
                    settings: { type: 'object', description: 'Applied settings' }
                }
            }
        }
    ]
};
