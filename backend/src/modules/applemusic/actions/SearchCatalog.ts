import axios from 'axios';
import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';

interface SearchCatalogConfig extends ActionConfig {
    term: string;
    entity?: 'song' | 'album' | 'musicArtist' | 'musicVideo' | 'all';
    limit?: number;
    country?: string;
    includeExplicit?: boolean;
}

export class SearchCatalog extends BaseAction {
    getName(): string {
        return 'search_catalog';
    }

    getDescription(): string {
        return 'Search the Apple Music / iTunes catalog for songs, albums or artists.';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['term'],
            properties: {
                term: {
                    type: 'string',
                    title: 'Search term',
                    description: 'Keyword to search for (song title, artist name, album, etc.)'
                },
                entity: {
                    type: 'string',
                    enum: ['song', 'album', 'musicArtist', 'musicVideo', 'all'],
                    default: 'song',
                    description: 'Restrict the search to a specific catalog entity'
                },
                limit: {
                    type: 'number',
                    minimum: 1,
                    maximum: 50,
                    default: 5,
                    description: 'Maximum number of results to return'
                },
                country: {
                    type: 'string',
                    description: 'Store country code (ISO 3166-1 alpha-2)',
                    default: 'US'
                },
                includeExplicit: {
                    type: 'boolean',
                    description: 'Include explicit content in results',
                    default: true
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
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
        };
    }

    getRequiredScopes(): string[] {
        return [];
    }

    validate(config: ActionConfig): boolean {
        const cfg = config as SearchCatalogConfig;

        if (!cfg.term || typeof cfg.term !== 'string' || cfg.term.trim().length === 0)
            throw new Error('term is required and must be a non-empty string');

        if (cfg.limit !== undefined) {
            const limit = Number(cfg.limit);
            if (Number.isNaN(limit) || limit < 1 || limit > 50)
                throw new Error('limit must be a number between 1 and 50');
        }

        if (cfg.country && (typeof cfg.country !== 'string' || cfg.country.length !== 2))
            throw new Error('country must be a 2-letter ISO code');

        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const resolved = this.replaceVariablesInConfig(config, context) as SearchCatalogConfig;
        this.validate(resolved);

        const params: Record<string, any> = {
            term: resolved.term,
            media: 'music',
            country: (resolved.country || 'US').toUpperCase(),
            limit: resolved.limit ?? 5
        };

        // Only add entity parameter if it's provided and not 'all'
        if (resolved.entity && resolved.entity !== 'all')
            params.entity = resolved.entity;

        if (resolved.includeExplicit === false)
            params.explicit = 'No';
        else
            params.explicit = 'Yes';

        try {
            const response = await axios.get('https://itunes.apple.com/search', {
                params,
                paramsSerializer: paramsObj => {
                    const usp = new URLSearchParams();
                    for (const [key, value] of Object.entries(paramsObj)) {
                        if (value === undefined || value === null)
                            continue;
                        usp.append(key, String(value));
                    }
                    return usp.toString();
                }
            });

            const data = response.data;
            const simplifiedResults = Array.isArray(data.results)
                ? data.results.map((item: any) => ({
                      id:
                          (item.trackId && String(item.trackId)) ||
                          (item.collectionId && String(item.collectionId)) ||
                          (item.artistId && String(item.artistId)) ||
                          null,
                      type: item.kind || item.wrapperType || 'unknown',
                      name: item.trackName || item.collectionName || item.artistName || null,
                      artistName: item.artistName || null,
                      albumName: item.collectionName || null,
                      previewUrl: item.previewUrl || null,
                      artworkUrl: item.artworkUrl100 || item.artworkUrl60 || null,
                      releaseDate: item.releaseDate || null,
                      url: item.trackViewUrl || item.collectionViewUrl || item.artistViewUrl || null
                  }))
                : [];

            return {
                success: true,
                data: {
                    resultCount: data.resultCount ?? simplifiedResults.length,
                    results: simplifiedResults
                }
            };
        } catch (error: any) {
            const message = error?.response?.data?.errorMessage || error?.message || 'Apple Music search failed';
            throw new Error(message);
        }
    }
}
