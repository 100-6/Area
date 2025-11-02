/**
 * Configuration for the Notion module
 * Contains declaration of all triggers and actions
 */
export default {
    name: 'notion',
    displayName: 'Notion',
    description: 'Automate your Notion workspace with page creation, updates, and database management',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
    color: '#000000',
    authType: 'oauth2',
    isActive: true,

    actions: [
        {
            name: 'page.created',
            displayName: 'Page Created',
            description: 'Triggers when a new page is created in a specific database',
            configSchema: {
                type: 'object',
                required: ['databaseId'],
                properties: {
                    databaseId: {
                        type: 'string',
                        title: 'Database ID',
                        description: 'ID of the Notion database to monitor (found in database URL)',
                        example: '12345678-1234-1234-1234-123456789abc'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    pageId: {
                        type: 'string',
                        description: 'Unique ID of the created page'
                    },
                    pageUrl: {
                        type: 'string',
                        description: 'Direct URL to the page'
                    },
                    title: {
                        type: 'string',
                        description: 'Title of the page'
                    },
                    createdTime: {
                        type: 'string',
                        description: 'When the page was created (ISO 8601 format)'
                    },
                    createdBy: {
                        type: 'string',
                        description: 'ID of the user who created the page'
                    },
                    properties: {
                        type: 'object',
                        description: 'All properties of the page (Status, Tags, etc.)'
                    }
                }
            }
        },
        {
            name: 'page.updated',
            displayName: 'Page Updated',
            description: 'Triggers when a page in a database is updated',
            configSchema: {
                type: 'object',
                required: ['databaseId'],
                properties: {
                    databaseId: {
                        type: 'string',
                        title: 'Database ID',
                        description: 'ID of the Notion database to monitor',
                        example: '12345678-1234-1234-1234-123456789abc'
                    },
                    watchProperty: {
                        type: 'string',
                        title: 'Watch Specific Property (Optional)',
                        description: 'Only trigger when this property changes (e.g., "Status", "Priority")',
                        example: 'Status'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    pageId: {
                        type: 'string',
                        description: 'Unique ID of the updated page'
                    },
                    pageUrl: {
                        type: 'string',
                        description: 'Direct URL to the page'
                    },
                    title: {
                        type: 'string',
                        description: 'Title of the page'
                    },
                    lastEditedTime: {
                        type: 'string',
                        description: 'When the page was last edited (ISO 8601 format)'
                    },
                    lastEditedBy: {
                        type: 'string',
                        description: 'ID of the user who last edited the page'
                    },
                    properties: {
                        type: 'object',
                        description: 'Current properties of the page'
                    },
                    changedProperty: {
                        type: 'string',
                        description: 'Name of the property that changed (if watchProperty is set)'
                    }
                }
            }
        },
        {
            name: 'property.status_changed',
            displayName: 'Property Status Changed',
            description: 'Triggers when a specific property (like Status) changes value',
            configSchema: {
                type: 'object',
                required: ['databaseId', 'propertyName'],
                properties: {
                    databaseId: {
                        type: 'string',
                        title: 'Database ID',
                        description: 'ID of the Notion database to monitor',
                        example: '12345678-1234-1234-1234-123456789abc'
                    },
                    propertyName: {
                        type: 'string',
                        title: 'Property Name',
                        description: 'Name of the property to watch (e.g., "Status", "Priority")',
                        example: 'Status'
                    },
                    fromValue: {
                        type: 'string',
                        title: 'From Value (Optional)',
                        description: 'Only trigger when changing FROM this specific value',
                        example: 'To Do'
                    },
                    toValue: {
                        type: 'string',
                        title: 'To Value (Optional)',
                        description: 'Only trigger when changing TO this specific value',
                        example: 'Done'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    pageId: { type: 'string', description: 'Page ID' },
                    pageUrl: { type: 'string', description: 'Page URL' },
                    title: { type: 'string', description: 'Page title' },
                    propertyName: { type: 'string', description: 'Property that changed' },
                    oldValue: { type: 'string', description: 'Previous value' },
                    newValue: { type: 'string', description: 'New value' },
                    changedAt: { type: 'string', description: 'When it changed' },
                    changedBy: { type: 'string', description: 'User who changed it' }
                }
            }
        },
        {
            name: 'comment.added',
            displayName: 'Comment Added',
            description: 'Triggers when a new comment is added to a page',
            configSchema: {
                type: 'object',
                properties: {
                    pageId: {
                        type: 'string',
                        title: 'Page ID (Optional)',
                        description: 'Monitor specific page, or leave empty for all pages',
                        example: '12345678-1234-1234-1234-123456789abc'
                    },
                    databaseId: {
                        type: 'string',
                        title: 'Database ID (Optional)',
                        description: 'Monitor all pages in this database',
                        example: '12345678-1234-1234-1234-123456789abc'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    commentId: { type: 'string', description: 'Comment ID' },
                    pageId: { type: 'string', description: 'Page ID where comment was added' },
                    pageUrl: { type: 'string', description: 'Page URL' },
                    commentText: { type: 'string', description: 'Comment text content' },
                    createdBy: { type: 'string', description: 'User who added comment' },
                    createdAt: { type: 'string', description: 'When comment was added' }
                }
            }
        }
    ],

    reactions: [
        {
            name: 'create_page',
            displayName: 'Create Page',
            description: 'Create a new page in a Notion database',
            configSchema: {
                type: 'object',
                required: ['databaseId', 'title'],
                properties: {
                    databaseId: {
                        type: 'string',
                        title: 'Database ID',
                        description: 'ID of the database where the page will be created',
                        example: '12345678-1234-1234-1234-123456789abc'
                    },
                    title: {
                        type: 'string',
                        title: 'Page Title',
                        description: 'Title of the new page. Use {{variable}} for dynamic data.',
                        example: 'New Task: {{title}}'
                    },
                    content: {
                        type: 'string',
                        title: 'Page Content (Optional)',
                        description: 'Markdown or plain text content for the page body',
                        example: 'Description: {{description}}\nCreated from: {{source}}'
                    },
                    properties: {
                        type: 'object',
                        title: 'Additional Properties (Optional)',
                        description: 'JSON object with database properties (Status, Tags, etc.)',
                        example: '{"Status": {"select": {"name": "To Do"}}, "Priority": {"select": {"name": "High"}}}'
                    }
                }
            }
        },
        {
            name: 'update_page',
            displayName: 'Update Page',
            description: 'Update properties or content of an existing Notion page',
            configSchema: {
                type: 'object',
                required: ['pageId'],
                properties: {
                    pageId: {
                        type: 'string',
                        title: 'Page ID',
                        description: 'ID of the page to update. Use {{pageId}} from trigger.',
                        example: '{{pageId}}'
                    },
                    title: {
                        type: 'string',
                        title: 'New Title (Optional)',
                        description: 'Update the page title',
                        example: 'Updated: {{title}}'
                    },
                    properties: {
                        type: 'object',
                        title: 'Update Properties',
                        description: 'JSON object with properties to update',
                        example: '{"Status": {"select": {"name": "Done"}}, "CompletedAt": {"date": {"start": "2025-11-02"}}}'
                    }
                }
            }
        },
        {
            name: 'delete_page',
            displayName: 'Delete Page',
            description: 'Archive (delete) a Notion page',
            configSchema: {
                type: 'object',
                required: ['pageId'],
                properties: {
                    pageId: {
                        type: 'string',
                        title: 'Page ID',
                        description: 'ID of the page to delete/archive. Use {{pageId}} from trigger.',
                        example: '{{pageId}}'
                    }
                }
            }
        },
        {
            name: 'append_content',
            displayName: 'Append Content',
            description: 'Add content blocks to the end of a Notion page',
            configSchema: {
                type: 'object',
                required: ['pageId', 'content'],
                properties: {
                    pageId: {
                        type: 'string',
                        title: 'Page ID',
                        description: 'ID of the page to append content to. Use {{pageId}} from trigger.',
                        example: '{{pageId}}'
                    },
                    content: {
                        type: 'string',
                        title: 'Content',
                        description: 'Text content to append. Use {{variable}} for dynamic data.',
                        example: '✅ Completed at {{timestamp}}\nNotes: {{notes}}'
                    },
                    blockType: {
                        type: 'string',
                        title: 'Block Type',
                        description: 'Type of content block',
                        enum: ['paragraph', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item', 'code'],
                        default: 'paragraph'
                    }
                }
            }
        },
        {
            name: 'add_comment',
            displayName: 'Add Comment',
            description: 'Add a comment to a Notion page',
            configSchema: {
                type: 'object',
                required: ['pageId', 'comment'],
                properties: {
                    pageId: {
                        type: 'string',
                        title: 'Page ID',
                        description: 'ID of the page to comment on. Use {{pageId}} from trigger.',
                        example: '{{pageId}}'
                    },
                    comment: {
                        type: 'string',
                        title: 'Comment Text',
                        description: 'Comment to add to the page. Use {{variable}} for dynamic data.',
                        example: 'Update from {{source}}: {{message}}'
                    }
                }
            }
        },
        {
            name: 'query_database',
            displayName: 'Query Database',
            description: 'Retrieve pages from a Notion database with filters',
            configSchema: {
                type: 'object',
                required: ['databaseId'],
                properties: {
                    databaseId: {
                        type: 'string',
                        title: 'Database ID',
                        description: 'ID of the database to query',
                        example: '12345678-1234-1234-1234-123456789abc'
                    },
                    filter: {
                        type: 'object',
                        title: 'Filter (Optional)',
                        description: 'JSON filter object (Notion API format)',
                        example: '{"property": "Status", "select": {"equals": "Done"}}'
                    },
                    sorts: {
                        type: 'array',
                        title: 'Sort Order (Optional)',
                        description: 'Array of sort objects',
                        example: '[{"property": "Created", "direction": "descending"}]'
                    },
                    pageSize: {
                        type: 'number',
                        title: 'Page Size',
                        description: 'Number of results to return (max 100)',
                        default: 10,
                        minimum: 1,
                        maximum: 100
                    }
                }
            }
        }
    ]
};
