import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { NotionApiService } from '../NotionApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

interface OnPageCreatedConfig extends TriggerConfig {
    databaseId: string;
}

/**
 * Notion page creation detection trigger
 */
export class OnPageCreatedTrigger extends BaseTrigger {
    private activePolls: Map<string, NodeJS.Timeout> = new Map();
    private knownPages: Map<string, Set<string>> = new Map();
    private readonly POLL_INTERVAL_MS = 60000; // 60 seconds

    constructor() {
        super();
    }

    getName(): string {
        return 'page.created';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a new page is created in a specific Notion database';
    }

    getConfigSchema(): any {
        return {
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
        };
    }

    getOutputSchema(): any {
        return {
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
        };
    }

    validate(config: TriggerConfig): boolean {
        const cfg = config as OnPageCreatedConfig;
        if (!cfg.databaseId) {
            throw new Error('Database ID is required');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as OnPageCreatedConfig;
        console.log(`[NotionTrigger] 🚀 START called for AREA ${areaId}`.bgBlue.white);
        console.log(`[NotionTrigger] 📋 Config:`, JSON.stringify(cfg, null, 2));
        
        this.validate(cfg);

        const area = await Area.findById(areaId);
        if (!area) {
            throw new Error(`AREA ${areaId} not found`);
        }
        console.log(`[NotionTrigger] ✅ Area found: ${area.id}, User: ${area.user_id}`.cyan);

        const notionAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'notion');
        if (!notionAuth || !notionAuth.access_token) {
            console.error(`[NotionTrigger] ❌ No Notion auth found for user ${area.user_id}`.red);
            throw new Error('Notion not connected for this user');
        }
        console.log(`[NotionTrigger] ✅ Notion auth found for user ${area.user_id}`.cyan);

        const accessToken = notionAuth.access_token;

        // Initial sync to avoid triggering on existing pages
        console.log(`[NotionTrigger] 🔄 Starting initial sync...`.yellow);
        await this.syncExistingPages(areaId, area.user_id, cfg, accessToken);

        // Start polling
        console.log(`[NotionTrigger] ⏰ Starting polling (every ${this.POLL_INTERVAL_MS / 1000}s)...`.yellow);
        const pollInterval = setInterval(async () => {
            await this.checkForNewPages(areaId, area.user_id, cfg, accessToken);
        }, this.POLL_INTERVAL_MS);

        this.activePolls.set(areaId, pollInterval);
        console.log(`[NotionTrigger] ✅ page.created started for AREA ${areaId}`.green);
        console.log(`[NotionTrigger] 📊 Active polls: ${this.activePolls.size}, Known pages: ${this.knownPages.get(areaId)?.size || 0}`.cyan);
    }

    async stop(areaId: string): Promise<void> {
        const pollInterval = this.activePolls.get(areaId);
        if (pollInterval) {
            clearInterval(pollInterval);
            this.activePolls.delete(areaId);
        }
        this.knownPages.delete(areaId);
        console.log(`[NotionTrigger] page.created stopped for AREA ${areaId}`.yellow);
    }

    /**
     * Initial sync: Load all existing pages to avoid triggering on them
     */
    private async syncExistingPages(
        areaId: string,
        userId: string,
        config: OnPageCreatedConfig,
        accessToken: string
    ): Promise<void> {
        console.log(`[NotionTrigger] 🔍 Syncing existing pages for database ${config.databaseId}...`.yellow);
        try {
            const notionApi = new NotionApiService(accessToken);

            // Query database to get existing pages
            console.log(`[NotionTrigger] 📡 Querying database...`.cyan);
            const response = await notionApi.queryDatabase(config.databaseId, undefined, undefined, 100);
            console.log(`[NotionTrigger] 📦 Received ${response.results.length} existing pages`.cyan);

            // Store all existing page IDs
            const pageIds = new Set<string>();
            response.results.forEach(page => {
                pageIds.add(page.id);
                const title = NotionApiService.extractTitle(page.properties);
                console.log(`[NotionTrigger]   - Page: "${title}" (${page.id.substring(0, 8)}...)`.gray);
            });

            this.knownPages.set(areaId, pageIds);

            console.log(`[NotionTrigger] ✅ Synced ${pageIds.size} existing pages for AREA ${areaId}`.green);
        } catch (error: any) {
            console.error(`[NotionTrigger] ❌ Error syncing existing pages:`.red, error.message);
            console.error(`[NotionTrigger] Stack:`.red, error.stack);
        }
    }

    /**
     * Check for new pages in the database
     */
    private async checkForNewPages(
        areaId: string,
        userId: string,
        config: OnPageCreatedConfig,
        accessToken: string
    ): Promise<void> {
        console.log(`[NotionTrigger] 🔍 Checking for new pages... (AREA: ${areaId})`.bgCyan.black);
        try {
            const notionApi = new NotionApiService(accessToken);

            // Get recent pages from database
            console.log(`[NotionTrigger] 📡 Querying database ${config.databaseId}...`.cyan);
            const response = await notionApi.queryDatabase(config.databaseId, undefined, undefined, 20);
            console.log(`[NotionTrigger] 📦 Received ${response.results.length} pages from database`.cyan);

            const knownPageIds = this.knownPages.get(areaId) || new Set<string>();
            console.log(`[NotionTrigger] 💾 Known pages count: ${knownPageIds.size}`.gray);
            
            const newPages: any[] = [];

            // Check each page
            for (const page of response.results) {
                const title = NotionApiService.extractTitle(page.properties);
                const isKnown = knownPageIds.has(page.id);
                const isArchived = page.archived;
                
                console.log(`[NotionTrigger]   📄 Page: "${title}"`.gray);
                console.log(`[NotionTrigger]      - ID: ${page.id.substring(0, 8)}...`.gray);
                console.log(`[NotionTrigger]      - Known: ${isKnown}, Archived: ${isArchived}`.gray);
                
                if (!knownPageIds.has(page.id) && !page.archived) {
                    // This is a new page!
                    console.log(`[NotionTrigger]      ✨ NEW PAGE DETECTED!`.bgGreen.white);
                    newPages.push(page);
                    knownPageIds.add(page.id);
                }
            }

            // Update known pages
            this.knownPages.set(areaId, knownPageIds);
            console.log(`[NotionTrigger] 📊 Summary: Found ${newPages.length} new pages, Total known: ${knownPageIds.size}`.cyan);

            // Trigger workflow for each new page
            for (const page of newPages) {
                const title = NotionApiService.extractTitle(page.properties);
                
                console.log(`[NotionTrigger] 🚀 TRIGGERING workflow for: "${title}" (${page.id})`.bgGreen.white);

                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        pageId: page.id,
                        pageUrl: page.url,
                        title: title,
                        createdTime: page.created_time,
                        createdBy: page.created_by.id,
                        properties: page.properties,
                    },
                };

                console.log(`[NotionTrigger] 📤 Emitting trigger:fired event with payload:`.yellow);
                console.log(JSON.stringify(payload, null, 2).yellow);
                
                this.eventBus.emit('trigger.fired', payload);
                console.log(`[NotionTrigger] ✅ Event emitted successfully`.green);
            }
            
            if (newPages.length === 0) {
                console.log(`[NotionTrigger] ℹ️  No new pages detected`.gray);
            }
        } catch (error: any) {
            console.error(`[NotionTrigger] ❌ Error checking for new pages:`.bgRed.white, error.message);
            console.error(`[NotionTrigger] Stack:`.red, error.stack);
        }
    }
}
