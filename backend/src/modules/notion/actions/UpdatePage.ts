import { BaseAction, ActionConfig, ActionResult, ActionContext } from '../../_base/BaseAction';
import { NotionApiService } from '../NotionApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

interface UpdatePageConfig extends ActionConfig {
    pageId: string;
    title?: string;
    properties?: Record<string, any>;
}

/**
 * Notion Update Page Action
 * Updates properties of an existing Notion page
 */
export class UpdatePageAction extends BaseAction {
    getName(): string {
        return 'update_page';
    }

    getDescription(): string {
        return 'Update properties or title of an existing Notion page';
    }

    getRequiredScopes(): string[] {
        return [];
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['pageId'],
            properties: {
                pageId: {
                    type: 'string',
                    title: 'Page ID',
                    description: 'ID of the page to update'
                },
                title: {
                    type: 'string',
                    title: 'New Title (Optional)',
                    description: 'Update the page title'
                },
                properties: {
                    type: 'object',
                    title: 'Update Properties',
                    description: 'JSON object with properties to update'
                }
            }
        };
    }

    validate(config: ActionConfig): boolean {
        const cfg = config as UpdatePageConfig;
        if (!cfg.pageId) {
            throw new Error('Page ID is required');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const processedConfig = this.replaceVariablesInConfig(config, context) as UpdatePageConfig;
        this.validate(processedConfig);

        console.log(`[UpdatePage] Updating page ${processedConfig.pageId}`.cyan);

        try {
            const notionAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'notion');
            if (!notionAuth || !notionAuth.access_token) {
                throw new Error('Notion not connected for this user');
            }

            const notionApi = new NotionApiService(notionAuth.access_token);

            // Build properties object
            const properties: Record<string, any> = processedConfig.properties || {};

            // Add title if provided
            if (processedConfig.title) {
                Object.assign(properties, NotionApiService.createTitleProperty(processedConfig.title));
            }

            // Update the page
            const page = await notionApi.updatePage(processedConfig.pageId, properties);

            console.log(`[UpdatePage] ✅ Page updated: ${page.id}`.green);

            return {
                success: true,
                data: {
                    pageId: page.id,
                    pageUrl: page.url,
                    updatedAt: page.last_edited_time
                }
            };
        } catch (error: any) {
            console.error(`[UpdatePage] ❌ Error:`.red, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
