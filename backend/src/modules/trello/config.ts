/**
 * Configuration for the Trello module
 * Contains declaration of all triggers and actions
 */
export default {
    name: 'trello',
    displayName: 'Trello',
    description: 'Automate your Trello workflows with board events detection',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/174/174874.png',
    color: '#0079BF',
    authType: 'oauth2',
    isActive: true,

    actions: [
        {
            name: 'board.created',
            displayName: 'Board Created',
            description: 'Triggers when a new board is created in Trello',
            configSchema: {
                type: 'object',
                required: [],
                properties: {
                    boardId: {
                        type: ['string', 'null'],
                        title: 'Board ID (optional)',
                        description: 'Trello board ID to monitor. Leave empty to listen for every new board.',
                        default: '',
                        example: '5f4dcc3b5aa765416c5f2ba1'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    boardId: {
                        type: 'string',
                        description: 'ID of the created board'
                    },
                    boardName: {
                        type: 'string',
                        description: 'Name of the created board'
                    },
                    boardUrl: {
                        type: 'string',
                        description: 'URL to the board'
                    },
                    createdBy: {
                        type: 'string',
                        description: 'Name of the user who created the board'
                    },
                    createdAt: {
                        type: 'string',
                        description: 'Timestamp when the board was created'
                    }
                }
            }
        },
        {
            name: 'board.updated',
            displayName: 'Board Updated',
            description: 'Triggers when a board name or description is modified',
            configSchema: {
                type: 'object',
                required: ['boardId'],
                properties: {
                    boardId: {
                        type: 'string',
                        title: 'Board ID',
                        description: 'Trello board ID to monitor',
                        example: '5f4dcc3b5aa765416c5f2ba1'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    boardId: {
                        type: 'string',
                        description: 'ID of the updated board'
                    },
                    boardName: {
                        type: 'string',
                        description: 'Current name of the board'
                    },
                    changes: {
                        type: 'object',
                        description: 'Object containing the changes (old and new values)'
                    },
                    updatedBy: {
                        type: 'string',
                        description: 'Name of the user who updated the board'
                    },
                    updatedAt: {
                        type: 'string',
                        description: 'Timestamp when the board was updated'
                    }
                }
            }
        },
        {
            name: 'board.closed',
            displayName: 'Board Closed',
            description: 'Triggers when a board is archived/closed',
            configSchema: {
                type: 'object',
                required: ['boardId'],
                properties: {
                    boardId: {
                        type: 'string',
                        title: 'Board ID',
                        description: 'Trello board ID to monitor',
                        example: '5f4dcc3b5aa765416c5f2ba1'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    boardId: {
                        type: 'string',
                        description: 'ID of the closed board'
                    },
                    boardName: {
                        type: 'string',
                        description: 'Name of the closed board'
                    },
                    closed: {
                        type: 'boolean',
                        description: 'Board closed status (always true)'
                    },
                    closedBy: {
                        type: 'string',
                        description: 'Name of the user who closed the board'
                    },
                    closedAt: {
                        type: 'string',
                        description: 'Timestamp when the board was closed'
                    }
                }
            }
        }
    ],

    reactions: [
        {
            name: 'card.create',
            displayName: 'Create Card',
            description: 'Create a new card in a Trello list',
            configSchema: {
                type: 'object',
                required: ['listId', 'name'],
                properties: {
                    listId: {
                        type: 'string',
                        title: 'List ID',
                        description: 'ID of the list where to create the card',
                        example: '5f4dcc3b5aa765416c5f2ba1'
                    },
                    name: {
                        type: 'string',
                        title: 'Card Name',
                        description: 'Title of the card',
                        example: 'New task to complete'
                    },
                    desc: {
                        type: 'string',
                        title: 'Description',
                        description: 'Card description (optional)',
                        example: 'This is a detailed description of the task'
                    },
                    position: {
                        type: 'string',
                        enum: ['top', 'bottom'],
                        title: 'Position',
                        description: 'Where to place the card in the list',
                        default: 'bottom'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    cardId: { type: 'string', description: 'ID of the created card' },
                    cardName: { type: 'string', description: 'Name of the created card' },
                    cardUrl: { type: 'string', description: 'URL to the card' },
                    listId: { type: 'string', description: 'ID of the list' },
                    boardId: { type: 'string', description: 'ID of the board' }
                }
            }
        },
        {
            name: 'card.move',
            displayName: 'Move Card',
            description: 'Move a card to another list',
            configSchema: {
                type: 'object',
                required: ['cardId', 'listId'],
                properties: {
                    cardId: {
                        type: 'string',
                        title: 'Card ID',
                        description: 'ID of the card to move',
                        example: '5f4dcc3b5aa765416c5f2ba1'
                    },
                    listId: {
                        type: 'string',
                        title: 'Destination List ID',
                        description: 'ID of the list where to move the card',
                        example: '5f4dcc3b5aa765416c5f2ba2'
                    },
                    position: {
                        type: 'string',
                        enum: ['top', 'bottom'],
                        title: 'Position',
                        description: 'Where to place the card in the list',
                        default: 'bottom'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    cardId: { type: 'string', description: 'ID of the moved card' },
                    cardName: { type: 'string', description: 'Name of the card' },
                    cardUrl: { type: 'string', description: 'URL to the card' },
                    newListId: { type: 'string', description: 'ID of the new list' }
                }
            }
        },
        {
            name: 'card.delete',
            displayName: 'Delete Card',
            description: 'Delete a card from Trello',
            configSchema: {
                type: 'object',
                required: ['cardId'],
                properties: {
                    cardId: {
                        type: 'string',
                        title: 'Card ID',
                        description: 'ID of the card to delete',
                        example: '5f4dcc3b5aa765416c5f2ba1'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    cardId: { type: 'string', description: 'ID of the deleted card' },
                    deleted: { type: 'boolean', description: 'Always true' }
                }
            }
        },
        {
            name: 'list.create',
            displayName: 'Create List',
            description: 'Create a new list in a Trello board',
            configSchema: {
                type: 'object',
                required: ['boardId', 'name'],
                properties: {
                    boardId: {
                        type: 'string',
                        title: 'Board ID',
                        description: 'ID of the board where to create the list',
                        example: '5f4dcc3b5aa765416c5f2ba1'
                    },
                    name: {
                        type: 'string',
                        title: 'List Name',
                        description: 'Name of the new list',
                        example: 'To Do'
                    },
                    position: {
                        type: 'string',
                        enum: ['top', 'bottom'],
                        title: 'Position',
                        description: 'Where to place the list in the board',
                        default: 'bottom'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    listId: { type: 'string', description: 'ID of the created list' },
                    listName: { type: 'string', description: 'Name of the list' },
                    boardId: { type: 'string', description: 'ID of the board' }
                }
            }
        },
        {
            name: 'list.delete',
            displayName: 'Archive List',
            description: 'Archive (close) a list in Trello',
            configSchema: {
                type: 'object',
                required: ['listId'],
                properties: {
                    listId: {
                        type: 'string',
                        title: 'List ID',
                        description: 'ID of the list to archive',
                        example: '5f4dcc3b5aa765416c5f2ba1'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    listId: { type: 'string', description: 'ID of the archived list' },
                    archived: { type: 'boolean', description: 'Always true' }
                }
            }
        }
    ]
};
