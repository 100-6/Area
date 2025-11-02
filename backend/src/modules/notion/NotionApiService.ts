import axios, { AxiosInstance } from 'axios';

export interface NotionPage {
    id: string;
    created_time: string;
    last_edited_time: string;
    created_by: { id: string };
    last_edited_by: { id: string };
    archived: boolean;
    url: string;
    properties: Record<string, any>;
}

export interface NotionDatabase {
    id: string;
    title: Array<{ plain_text: string }>;
    properties: Record<string, any>;
}

export interface NotionQueryResponse {
    results: NotionPage[];
    has_more: boolean;
    next_cursor: string | null;
}

export interface NotionComment {
    id: string;
    parent: { page_id: string };
    discussion_id: string;
    created_time: string;
    created_by: { id: string };
    rich_text: Array<{ plain_text: string }>;
}

export class NotionApiService {
    private api: AxiosInstance;
    private static readonly NOTION_VERSION = '2022-06-28';

    constructor(accessToken: string) {
        this.api = axios.create({
            baseURL: 'https://api.notion.com/v1',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Notion-Version': NotionApiService.NOTION_VERSION,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Get a database by ID
     */
    async getDatabase(databaseId: string): Promise<NotionDatabase> {
        try {
            const response = await this.api.get(`/databases/${databaseId}`);
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get database: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Query a database with optional filters and sorts
     */
    async queryDatabase(
        databaseId: string,
        filter?: any,
        sorts?: any[],
        pageSize: number = 100
    ): Promise<NotionQueryResponse> {
        try {
            const response = await this.api.post(`/databases/${databaseId}/query`, {
                filter,
                sorts,
                page_size: Math.min(pageSize, 100),
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to query database: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Get a page by ID
     */
    async getPage(pageId: string): Promise<NotionPage> {
        try {
            const response = await this.api.get(`/pages/${pageId}`);
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get page: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Create a new page in a database
     */
    async createPage(
        databaseId: string,
        properties: Record<string, any>,
        content?: Array<any>
    ): Promise<NotionPage> {
        try {
            const pageData: any = {
                parent: { database_id: databaseId },
                properties,
            };

            if (content && content.length > 0) {
                pageData.children = content;
            }

            const response = await this.api.post('/pages', pageData);
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to create page: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Update a page's properties
     */
    async updatePage(
        pageId: string,
        properties: Record<string, any>
    ): Promise<NotionPage> {
        try {
            const response = await this.api.patch(`/pages/${pageId}`, {
                properties,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to update page: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Archive (delete) a page
     */
    async archivePage(pageId: string): Promise<NotionPage> {
        try {
            const response = await this.api.patch(`/pages/${pageId}`, {
                archived: true,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to archive page: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Restore (unarchive) a page
     */
    async restorePage(pageId: string): Promise<NotionPage> {
        try {
            const response = await this.api.patch(`/pages/${pageId}`, {
                archived: false,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to restore page: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Append blocks (content) to a page
     */
    async appendBlocks(pageId: string, children: Array<any>): Promise<any> {
        try {
            const response = await this.api.patch(`/blocks/${pageId}/children`, {
                children,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to append blocks: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Add a comment to a page
     */
    async addComment(pageId: string, commentText: string): Promise<NotionComment> {
        try {
            const response = await this.api.post('/comments', {
                parent: { page_id: pageId },
                rich_text: [
                    {
                        text: { content: commentText },
                    },
                ],
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to add comment: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Get comments for a page
     */
    async getComments(pageId: string): Promise<NotionComment[]> {
        try {
            const response = await this.api.get('/comments', {
                params: {
                    block_id: pageId,
                },
            });
            return response.data.results;
        } catch (error: any) {
            throw new Error(`Failed to get comments: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Get current user info
     */
    async getCurrentUser(): Promise<any> {
        try {
            const response = await this.api.get('/users/me');
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get current user: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Search for pages and databases
     */
    async search(query?: string, filter?: any): Promise<any> {
        try {
            const response = await this.api.post('/search', {
                query,
                filter,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to search: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Helper: Extract title from page properties
     */
    static extractTitle(properties: Record<string, any>): string {
        // Find the title property (usually named "Name" or "Title")
        const titleProp = Object.values(properties).find(
            (prop: any) => prop.type === 'title'
        ) as any;

        if (!titleProp || !titleProp.title || titleProp.title.length === 0) {
            return 'Untitled';
        }

        return titleProp.title.map((t: any) => t.plain_text).join('');
    }

    /**
     * Helper: Create a paragraph block
     */
    static createParagraphBlock(text: string): any {
        return {
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    {
                        type: 'text',
                        text: { content: text },
                    },
                ],
            },
        };
    }

    /**
     * Helper: Create title property
     */
    static createTitleProperty(title: string): any {
        return {
            title: [
                {
                    text: { content: title },
                },
            ],
        };
    }
}
