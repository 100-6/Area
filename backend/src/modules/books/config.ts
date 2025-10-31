export default {
    name: 'books',
    displayName: 'Books',
    description: 'Search for books and authors using the Google Books public API',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/29/29302.png',
    color: '#6F42C1',
    authType: 'none',
    isActive: true,

    actions: [],

    reactions: [
        {
            name: 'search_books',
            displayName: 'Search Books',
            description: 'Search the Google Books catalog for matching titles',
            configSchema: {
                type: 'object',
                required: ['query'],
                properties: {
                    query: {
                        type: 'string',
                        title: 'Query',
                        description: 'Keywords to search for (title, author, ISBN...)',
                        example: 'science fiction'
                    },
                    language: {
                        type: 'string',
                        title: 'Language',
                        description: 'Restrict results to a language (ISO 639-1)',
                        example: 'fr'
                    },
                    maxResults: {
                        type: 'number',
                        title: 'Max results',
                        description: 'Maximum number of books to return (1-20)',
                        minimum: 1,
                        maximum: 20,
                        default: 5
                    },
                    orderBy: {
                        type: 'string',
                        title: 'Order by',
                        description: 'Sort results by relevance or newest publications',
                        enum: ['relevance', 'newest'],
                        default: 'relevance'
                    },
                    printType: {
                        type: 'string',
                        title: 'Print type',
                        description: 'Filter by print type',
                        enum: ['all', 'books', 'magazines'],
                        default: 'all'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    totalItems: { type: 'number' },
                    items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: {
                                    anyOf: [
                                        { type: 'string' },
                                        { type: 'null' }
                                    ]
                                },
                                title: {
                                    anyOf: [
                                        { type: 'string' },
                                        { type: 'null' }
                                    ]
                                },
                                subtitle: {
                                    anyOf: [
                                        { type: 'string' },
                                        { type: 'null' }
                                    ]
                                },
                                authors: {
                                    type: 'array',
                                    items: { type: 'string' }
                                },
                                publisher: {
                                    anyOf: [
                                        { type: 'string' },
                                        { type: 'null' }
                                    ]
                                },
                                publishedDate: {
                                    anyOf: [
                                        { type: 'string' },
                                        { type: 'null' }
                                    ]
                                },
                                description: {
                                    anyOf: [
                                        { type: 'string' },
                                        { type: 'null' }
                                    ]
                                },
                                pageCount: {
                                    anyOf: [
                                        { type: 'number' },
                                        { type: 'null' }
                                    ]
                                },
                                categories: {
                                    type: 'array',
                                    items: { type: 'string' }
                                },
                                averageRating: {
                                    anyOf: [
                                        { type: 'number' },
                                        { type: 'null' }
                                    ]
                                },
                                maturityRating: {
                                    anyOf: [
                                        { type: 'string' },
                                        { type: 'null' }
                                    ]
                                },
                                language: {
                                    anyOf: [
                                        { type: 'string' },
                                        { type: 'null' }
                                    ]
                                },
                                thumbnail: {
                                    anyOf: [
                                        { type: 'string' },
                                        { type: 'null' }
                                    ]
                                },
                                infoLink: {
                                    anyOf: [
                                        { type: 'string' },
                                        { type: 'null' }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        }
    ]
};
