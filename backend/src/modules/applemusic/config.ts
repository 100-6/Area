export default {
    name: 'applemusic',
    displayName: 'Apple Music',
    description: 'Search the Apple Music / iTunes catalog for songs, albums and artists',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/13/13973.png',
    color: '#FA2C55',
    authType: 'none',
    isActive: true,

    actions: [],

    reactions: [
        {
            name: 'search_catalog',
            displayName: 'Search Catalog',
            description: 'Search songs, albums or artists from the Apple Music public catalog',
            configSchema: {
                type: 'object',
                required: ['term'],
                properties: {
                    term: {
                        type: 'string',
                        title: 'Search term',
                        description: 'Keyword to search for (song title, artist, album, etc.)',
                        example: 'Daft Punk'
                    },
                    entity: {
                        type: 'string',
                        title: 'Entity type',
                        description: 'Limit results to a specific catalog entity',
                        enum: ['song', 'album', 'musicArtist', 'musicVideo', 'all'],
                        default: 'song'
                    },
                    limit: {
                        type: 'number',
                        title: 'Result limit',
                        description: 'Maximum number of results to return (1-50)',
                        minimum: 1,
                        maximum: 50,
                        default: 5
                    },
                    country: {
                        type: 'string',
                        title: 'Store country',
                        description: 'Country code (ISO 3166-1 alpha-2) to localise results',
                        default: 'US',
                        example: 'FR'
                    },
                    includeExplicit: {
                        type: 'boolean',
                        title: 'Include explicit content',
                        description: 'Allow explicit tracks in results',
                        default: true
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    resultCount: { type: 'number' },
                    results: {
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
                                type: { type: 'string' },
                                name: {
                                    anyOf: [
                                        { type: 'string' },
                                        { type: 'null' }
                                    ]
                                },
                                artistName: {
                                    anyOf: [
                                        { type: 'string' },
                                        { type: 'null' }
                                    ]
                                },
                                albumName: {
                                    anyOf: [
                                        { type: 'string' },
                                        { type: 'null' }
                                    ]
                                },
                                previewUrl: {
                                    anyOf: [
                                        { type: 'string' },
                                        { type: 'null' }
                                    ]
                                },
                                artworkUrl: {
                                    anyOf: [
                                        { type: 'string' },
                                        { type: 'null' }
                                    ]
                                },
                                releaseDate: {
                                    anyOf: [
                                        { type: 'string' },
                                        { type: 'null' }
                                    ]
                                },
                                url: {
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
