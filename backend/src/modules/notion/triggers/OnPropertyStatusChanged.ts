import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { NotionApiService } from '../NotionApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { Area } from '../../../core/models/Area';
import 'colors';

interface PropertyStatusConfig extends TriggerConfig {
    databaseId: string;
    propertyName: string;
    fromValue?: string;
    toValue?: string;
}

interface PropertyState {
    [pageId: string]: {
        [propertyName: string]: any;
    };
}

/**
 * Notion On Property Status Changed Trigger
 * Monitors specific property changes in a database
 */
export class OnPropertyStatusChanged extends BaseTrigger {
    private activePolls: Map<string, NodeJS.Timeout> = new Map();
    private propertyStates: Map<string, PropertyState> = new Map();
    private readonly POLL_INTERVAL_MS = 60000; // 60 seconds

    constructor() {
        super();
    }

    getName(): string {
        return 'property.status_changed';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a specific property value changes in a Notion database';
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                pageId: { type: 'string', description: 'ID of the page' },
                pageUrl: { type: 'string', description: 'URL of the page' },
                title: { type: 'string', description: 'Page title' },
                propertyName: { type: 'string', description: 'Name of the changed property' },
                oldValue: { type: 'string', description: 'Previous value' },
                newValue: { type: 'string', description: 'New value' },
                changedAt: { type: 'string', description: 'ISO timestamp of the change' }
            }
        };
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['databaseId', 'propertyName'],
            properties: {
                databaseId: {
                    type: 'string',
                    title: 'Database ID',
                    description: 'ID of the database to monitor'
                },
                propertyName: {
                    type: 'string',
                    title: 'Property Name',
                    description: 'Name of the property to watch (e.g., "Status")'
                },
                fromValue: {
                    type: 'string',
                    title: 'From Value (Optional)',
                    description: 'Only trigger when changing FROM this value'
                },
                toValue: {
                    type: 'string',
                    title: 'To Value (Optional)',
                    description: 'Only trigger when changing TO this value'
                }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const cfg = config as PropertyStatusConfig;
        if (!cfg.databaseId || !cfg.propertyName) {
            throw new Error('Database ID and property name are required');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as PropertyStatusConfig;
        this.validate(cfg);

        console.log(`[PropertyStatusChanged] Starting trigger for database ${cfg.databaseId}, property "${cfg.propertyName}"`.cyan);

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

            // Initial sync to avoid triggering on existing pages
            await this.syncPropertyStates(areaId, area.user_id, cfg, accessToken);

            // Poll every 60 seconds
            const pollInterval = setInterval(async () => {
                await this.checkForChanges(areaId, area.user_id, cfg, accessToken);
            }, this.POLL_INTERVAL_MS);

            this.activePolls.set(areaId, pollInterval);
            console.log(`[PropertyStatusChanged] ✅ Trigger started successfully`.green);
        } catch (error: any) {
            console.error(`[PropertyStatusChanged] ❌ Error starting trigger:`.red, error.message);
            throw error;
        }
    }

    async stop(areaId: string): Promise<void> {
        const pollInterval = this.activePolls.get(areaId);
        if (pollInterval) {
            clearInterval(pollInterval);
            this.activePolls.delete(areaId);
        }
        this.propertyStates.delete(areaId);
        console.log(`[PropertyStatusChanged] 🛑 Trigger stopped`.yellow);
    }

    private async syncPropertyStates(areaId: string, userId: string, config: PropertyStatusConfig, accessToken: string): Promise<void> {
        const notionApi = new NotionApiService(accessToken);

        try {
            const response = await notionApi.queryDatabase(config.databaseId);
            const pages = response.results as any[];

            const state: PropertyState = {};

            for (const page of pages) {
                const propertyValue = this.extractPropertyValue(page.properties[config.propertyName]);
                state[page.id] = {
                    [config.propertyName]: propertyValue
                };
            }

            this.propertyStates.set(areaId, state);
            console.log(`[PropertyStatusChanged] Synced ${pages.length} pages`.gray);
        } catch (error: any) {
            console.error(`[PropertyStatusChanged] Sync error:`.red, error.message);
        }
    }

    private async checkForChanges(areaId: string, userId: string, config: PropertyStatusConfig, accessToken: string): Promise<void> {
        const notionApi = new NotionApiService(accessToken);

        try {
            const response = await notionApi.queryDatabase(config.databaseId);
            const pages = response.results as any[];

            const currentState = this.propertyStates.get(areaId) || {};
            const newState: PropertyState = {};

            for (const page of pages) {
                const propertyValue = this.extractPropertyValue(page.properties[config.propertyName]);
                newState[page.id] = {
                    [config.propertyName]: propertyValue
                };

                const oldValue = currentState[page.id]?.[config.propertyName];
                const newValue = propertyValue;

                // Check if value changed
                if (oldValue !== undefined && oldValue !== newValue) {
                    // Apply filters if specified
                    if (config.fromValue && oldValue !== config.fromValue) {
                        continue;
                    }
                    if (config.toValue && newValue !== config.toValue) {
                        continue;
                    }

                    const title = this.extractTitle(page.properties);
                    const pageUrl = page.url;

                    console.log(`[PropertyStatusChanged] 🔔 Property changed: ${config.propertyName} from "${oldValue}" to "${newValue}" in page "${title}"`.green);

                    const payload: TriggerPayload = {
                        areaId,
                        triggerName: this.getName(),
                        triggerType: this.getType(),
                        timestamp: new Date().toISOString(),
                        data: {
                            pageId: page.id,
                            pageUrl,
                            title,
                            propertyName: config.propertyName,
                            oldValue: String(oldValue),
                            newValue: String(newValue),
                            changedAt: new Date().toISOString()
                        }
                    };

                    this.eventBus.emit('trigger.fired', payload);
                }
            }

            this.propertyStates.set(areaId, newState);
        } catch (error: any) {
            console.error(`[PropertyStatusChanged] Check error:`.red, error.message);
        }
    }

    private extractPropertyValue(property: any): any {
        if (!property) return null;

        switch (property.type) {
            case 'select':
                return property.select?.name || null;
            case 'status':
                return property.status?.name || null;
            case 'multi_select':
                return property.multi_select?.map((s: any) => s.name).join(', ') || null;
            case 'checkbox':
                return property.checkbox;
            case 'number':
                return property.number;
            case 'date':
                return property.date?.start || null;
            case 'rich_text':
                return property.rich_text?.[0]?.plain_text || null;
            case 'title':
                return property.title?.[0]?.plain_text || null;
            default:
                return JSON.stringify(property);
        }
    }

    private extractTitle(properties: any): string {
        const titleProp = Object.values(properties).find((prop: any) => prop.type === 'title') as any;
        return titleProp?.title?.[0]?.plain_text || 'Untitled';
    }
}
