import axios from 'axios';
import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';

interface SearchBooksConfig extends ActionConfig {
    query: string;
    language?: string;
    maxResults?: number;
    orderBy?: 'relevance' | 'newest';
    printType?: 'all' | 'books' | 'magazines';
}

export class SearchBooks extends BaseAction {
    getName(): string {
        return 'search_books';
    }

    getDescription(): string {
        return 'Search for books, magazines and authors information via Google Books.';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['query'],
            properties: {
                query: {
                    type: 'string',
                    title: 'Search query',
                    description: 'Keywords such as title, author, ISBN, etc.'
                },
                language: {
                    type: 'string',
                    title: 'Language',
                    description: 'Restrict results to a language (ISO 639-1 code)'
                },
                maxResults: {
                    type: 'number',
                    title: 'Max results',
                    minimum: 1,
                    maximum: 20,
                    default: 5
                },
                orderBy: {
                    type: 'string',
                    enum: ['relevance', 'newest'],
                    default: 'relevance',
                    description: 'Sort order for search results'
                },
                printType: {
                    type: 'string',
                    enum: ['all', 'books', 'magazines'],
                    default: 'all',
                    description: 'Filter by print type'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
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
        };
    }

    getRequiredScopes(): string[] {
        return [];
    }

    validate(config: ActionConfig): boolean {
        const cfg = config as SearchBooksConfig;

        if (!cfg.query || typeof cfg.query !== 'string' || cfg.query.trim().length === 0)
            throw new Error('query is required and must be a non-empty string');

        if (cfg.maxResults !== undefined) {
            const maxResults = Number(cfg.maxResults);
            if (Number.isNaN(maxResults) || maxResults < 1 || maxResults > 20)
                throw new Error('maxResults must be between 1 and 20');
        }

        if (cfg.language && (typeof cfg.language !== 'string' || cfg.language.length !== 2))
            throw new Error('language must be a 2-letter ISO 639-1 code');

        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const resolved = this.replaceVariablesInConfig(config, context) as SearchBooksConfig;
        this.validate(resolved);

        const params: Record<string, any> = {
            q: resolved.query,
            maxResults: resolved.maxResults ?? 5
        };

        // Only add optional parameters if they have valid non-empty values
        const orderBy = resolved.orderBy ?? 'relevance';
        if (orderBy) {
            params.orderBy = orderBy;
        }

        const printType = resolved.printType ?? 'all';
        if (printType) {
            params.printType = printType;
        }

        if (resolved.language && resolved.language.trim() !== '') {
            params.langRestrict = resolved.language;
        }

        try {
            const response = await axios.get('https://www.googleapis.com/books/v1/volumes', { params });
            const data = response.data;

            const items = Array.isArray(data.items)
                ? data.items.map((item: any) => {
                      const volume = item.volumeInfo || {};
                      return {
                          id: item.id || null,
                          title: volume.title || null,
                          subtitle: volume.subtitle || null,
                          authors: volume.authors || [],
                          publisher: volume.publisher || null,
                          publishedDate: volume.publishedDate || null,
                          description: volume.description || null,
                          pageCount: volume.pageCount || null,
                          categories: volume.categories || [],
                          averageRating: volume.averageRating ?? null,
                          maturityRating: volume.maturityRating || null,
                          language: volume.language || null,
                          thumbnail: volume.imageLinks?.thumbnail || volume.imageLinks?.smallThumbnail || null,
                          infoLink: volume.infoLink || null
                      };
                  })
                : [];

            return {
                success: true,
                data: {
                    totalItems: data.totalItems ?? items.length,
                    items
                }
            };
        } catch (error: any) {
            const message = error?.response?.data?.error?.message || error?.message || 'Google Books search failed';
            throw new Error(message);
        }
    }
}
