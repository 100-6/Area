import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { NotionApiService } from '../NotionApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

interface OnPageUpdatedConfig extends TriggerConfig {
    databaseId: string;
    watchProperty?: string; // Optional: only trigger when this property changes
}

/**
 * Notion page update detection trigger
 */
export class OnPageUpdatedTrigger extends BaseTrigger {
    private activePolls: Map<string, NodeJS.Timeout> = new Map();
    private pageStates: Map<string, Map<string, string>> = new Map(); // areaId -> (pageId -> lastEditedTime)
    private readonly POLL_INTERVAL_MS = 60000; // 60 seconds

    constructor() {
        super();
    }

    getName(): string {
        return 'page.updated';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a page in a database is updated';
    }

    getConfigSchema(): any {
        return {
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
        };
    }

    getOutputSchema(): any {
        return {
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
        };
    }

    validate(config: TriggerConfig): boolean {
        const cfg = config as OnPageUpdatedConfig;
        if (!cfg.databaseId) {
            throw new Error('Database ID is required');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as OnPageUpdatedConfig;
        this.validate(cfg);

        const area = await Area.findById(areaId);
        if (!area) {
            throw new Error(`AREA ${areaId} not found`);
        }

        const notionAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'notion');
        if (!notionAuth || !notionAuth.access_token) {
            throw new Error('Notion not connected for this user');
        }

        const accessToken = notionAuth.access_token;

        // Initial sync to record current state of pages
        await this.syncPageStates(areaId, area.user_id, cfg, accessToken);

        // Start polling
        const pollInterval = setInterval(async () => {
            await this.checkForUpdates(areaId, area.user_id, cfg, accessToken);
        }, this.POLL_INTERVAL_MS);

        this.activePolls.set(areaId, pollInterval);
        console.log(`[NotionTrigger] page.updated started for AREA ${areaId}`.green);
    }

    async stop(areaId: string): Promise<void> {
        const pollInterval = this.activePolls.get(areaId);
        if (pollInterval) {
            clearInterval(pollInterval);
            this.activePolls.delete(areaId);
        }
        this.pageStates.delete(areaId);
        console.log(`[NotionTrigger] page.updated stopped for AREA ${areaId}`.yellow);
    }

    /**
     * Initial sync: Record current state of all pages
     */
    private async syncPageStates(
        areaId: string,
        userId: string,
        config: OnPageUpdatedConfig,
        accessToken: string
    ): Promise<void> {
        try {
            const notionApi = new NotionApiService(accessToken);

            // Query database to get all pages
            const response = await notionApi.queryDatabase(config.databaseId, undefined, undefined, 100);

            // Store lastEditedTime for each page
            const states = new Map<string, string>();
            response.results.forEach(page => {
                states.set(page.id, page.last_edited_time);
            });

            this.pageStates.set(areaId, states);

            console.log(`[NotionTrigger] Synced ${states.size} pages for AREA ${areaId}`.cyan);
        } catch (error: any) {
            console.error(`[NotionTrigger] Error syncing page states:`.red, error.message);
        }
    }

    /**
     * Check for updated pages
     */
    private async checkForUpdates(
        areaId: string,
        userId: string,
        config: OnPageUpdatedConfig,
        accessToken: string
    ): Promise<void> {
        try {
            const notionApi = new NotionApiService(accessToken);

            // Get recent pages from database
            const response = await notionApi.queryDatabase(config.databaseId, undefined, undefined, 50);

            const currentStates = this.pageStates.get(areaId) || new Map<string, string>();
            const updatedPages: any[] = [];

            // Check each page
            for (const page of response.results) {
                if (page.archived) continue;

                const lastKnownEditTime = currentStates.get(page.id);
                
                if (lastKnownEditTime && lastKnownEditTime !== page.last_edited_time) {
                    // Page was updated!
                    updatedPages.push(page);
                }

                // Update state
                currentStates.set(page.id, page.last_edited_time);
            }

            // Update states
            this.pageStates.set(areaId, currentStates);

            // Trigger workflow for each updated page
            for (const page of updatedPages) {
                const title = NotionApiService.extractTitle(page.properties);
                
                console.log(`[NotionTrigger] Page updated: "${title}" (${page.id})`.green);

                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        pageId: page.id,
                        pageUrl: page.url,
                        title: title,
                        lastEditedTime: page.last_edited_time,
                        lastEditedBy: page.last_edited_by.id,
                        properties: page.properties,
                        changedProperty: config.watchProperty || null,
                    },
                };

                this.eventBus.emit('trigger.fired', payload);
            }
        } catch (error: any) {
            console.error(`[NotionTrigger] Error checking for updates:`.red, error.message);
        }
    }
}
