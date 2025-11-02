import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { NotionApiService } from '../NotionApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

interface CommentAddedConfig extends TriggerConfig {
    pageId?: string;
    databaseId?: string;
}

/**
 * Notion On Comment Added Trigger
 * Monitors new comments on pages
 */
export class OnCommentAdded extends BaseTrigger {
    private activePolls: Map<string, NodeJS.Timeout> = new Map();
    private knownComments: Map<string, Set<string>> = new Map();
    private readonly POLL_INTERVAL_MS = 60000; // 60 seconds

    constructor() {
        super();
    }

    getName(): string {
        return 'comment.added';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a new comment is added to a Notion page or database';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                pageId: {
                    type: 'string',
                    title: 'Page ID (Optional)',
                    description: 'ID of a specific page to monitor comments on'
                },
                databaseId: {
                    type: 'string',
                    title: 'Database ID (Optional)',
                    description: 'ID of database to monitor comments on all pages'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                commentId: {
                    type: 'string',
                    description: 'Unique ID of the comment'
                },
                pageId: {
                    type: 'string',
                    description: 'ID of the page the comment is on'
                },
                content: {
                    type: 'string',
                    description: 'Text content of the comment'
                },
                createdBy: {
                    type: 'string',
                    description: 'ID of the user who created the comment'
                },
                createdTime: {
                    type: 'string',
                    description: 'When the comment was created (ISO 8601 format)'
                }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const cfg = config as CommentAddedConfig;
        if (!cfg.pageId && !cfg.databaseId) {
            throw new Error('Either pageId or databaseId is required');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as CommentAddedConfig;
        this.validate(cfg);

        console.log(`[CommentAdded] Starting trigger for ${cfg.pageId ? 'page' : 'database'}`.cyan);

        try {
            const area = await Area.findById(areaId);
            if (!area) {
                throw new Error(`AREA ${areaId} not found`);
            }

            const notionAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'notion');
            if (!notionAuth || !notionAuth.access_token) {
                throw new Error('Notion not connected for this user');
            }

            const accessToken = notionAuth.access_token;

            // Initial sync to avoid triggering on existing comments
            await this.syncExistingComments(areaId, area.user_id, cfg, accessToken);

            // Poll every 60 seconds
            const pollInterval = setInterval(async () => {
                await this.checkForNewComments(areaId, area.user_id, cfg, accessToken);
            }, this.POLL_INTERVAL_MS);

            this.activePolls.set(areaId, pollInterval);
            console.log(`[CommentAdded] ✅ Trigger started successfully`.green);
        } catch (error: any) {
            console.error(`[CommentAdded] ❌ Error starting trigger:`.red, error.message);
            throw error;
        }
    }

    async stop(areaId: string): Promise<void> {
        const pollInterval = this.activePolls.get(areaId);
        if (pollInterval) {
            clearInterval(pollInterval);
            this.activePolls.delete(areaId);
        }
        this.knownComments.delete(areaId);
        console.log(`[CommentAdded] 🛑 Trigger stopped`.yellow);
    }

    private async syncExistingComments(
        areaId: string,
        userId: string,
        config: CommentAddedConfig,
        accessToken: string
    ): Promise<void> {
        const notionApi = new NotionApiService(accessToken);
        const commentIds = new Set<string>();

        try {
            if (config.pageId) {
                // Monitor single page
                const comments = await notionApi.getComments(config.pageId);
                comments.forEach((comment: any) => commentIds.add(comment.id));
            } else if (config.databaseId) {
                // Monitor all pages in database
                const response = await notionApi.queryDatabase(config.databaseId, undefined, undefined, 20);
                for (const page of response.results) {
                    const comments = await notionApi.getComments(page.id);
                    comments.forEach((comment: any) => commentIds.add(comment.id));
                }
            }

            this.knownComments.set(areaId, commentIds);
            console.log(`[CommentAdded] Synced ${commentIds.size} existing comments`.gray);
        } catch (error: any) {
            console.error(`[CommentAdded] Sync error:`.red, error.message);
        }
    }

    private async checkForNewComments(
        areaId: string,
        userId: string,
        config: CommentAddedConfig,
        accessToken: string
    ): Promise<void> {
        const notionApi = new NotionApiService(accessToken);
        const knownCommentIds = this.knownComments.get(areaId) || new Set<string>();
        const newComments: Array<{ comment: any; pageId: string }> = [];

        try {
            if (config.pageId) {
                // Check single page
                const comments = await notionApi.getComments(config.pageId);
                for (const comment of comments) {
                    if (!knownCommentIds.has(comment.id)) {
                        newComments.push({ comment, pageId: config.pageId });
                        knownCommentIds.add(comment.id);
                    }
                }
            } else if (config.databaseId) {
                // Check all pages in database
                const response = await notionApi.queryDatabase(config.databaseId, undefined, undefined, 20);
                for (const page of response.results) {
                    const comments = await notionApi.getComments(page.id);
                    for (const comment of comments) {
                        if (!knownCommentIds.has(comment.id)) {
                            newComments.push({ comment, pageId: page.id });
                            knownCommentIds.add(comment.id);
                        }
                    }
                }
            }

            this.knownComments.set(areaId, knownCommentIds);

            // Trigger workflow for each new comment
            for (const { comment, pageId } of newComments) {
                const content = comment.rich_text?.map((rt: any) => rt.plain_text).join('') || '';

                console.log(`[CommentAdded] 🔔 New comment on page ${pageId}: "${content.substring(0, 50)}..."`.green);

                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        commentId: comment.id,
                        pageId,
                        content,
                        createdBy: comment.created_by.id,
                        createdTime: comment.created_time
                    }
                };

                this.eventBus.emit('trigger.fired', payload);
            }
        } catch (error: any) {
            console.error(`[CommentAdded] Check error:`.red, error.message);
        }
    }
}
