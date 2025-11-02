import { BaseAction, ActionConfig, ActionResult, ActionContext } from '../../_base/BaseAction';
import { NotionApiService } from '../NotionApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

interface CreatePageConfig extends ActionConfig {
    databaseId: string;
    title: string;
    content?: string;
    properties?: Record<string, any>;
}

/**
 * Notion Create Page Action
 * Creates a new page in a Notion database
 */
export class CreatePageAction extends BaseAction {
    getName(): string {
        return 'create_page';
    }

    getDescription(): string {
        return 'Create a new page in a Notion database';
    }

    getRequiredScopes(): string[] {
        return []; // Notion uses workspace-level access
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['databaseId', 'title'],
            properties: {
                databaseId: {
                    type: 'string',
                    title: 'Database ID',
                    description: 'ID of the database where the page will be created'
                },
                title: {
                    type: 'string',
                    title: 'Page Title',
                    description: 'Title of the new page'
                },
                content: {
                    type: 'string',
                    title: 'Page Content (Optional)',
                    description: 'Text content for the page body'
                },
                properties: {
                    type: 'object',
                    title: 'Additional Properties (Optional)',
                    description: 'JSON object with database properties'
                }
            }
        };
    }

    validate(config: ActionConfig): boolean {
        const cfg = config as CreatePageConfig;
        if (!cfg.databaseId || !cfg.title) {
            throw new Error('Database ID and title are required');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        // Replace variables in config
        const processedConfig = this.replaceVariablesInConfig(config, context) as CreatePageConfig;
        this.validate(processedConfig);

        console.log(`[CreatePage] Creating page in database ${processedConfig.databaseId}`.cyan);

        try {
            const notionAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'notion');
            if (!notionAuth || !notionAuth.access_token) {
                throw new Error('Notion not connected for this user');
            }

            const notionApi = new NotionApiService(notionAuth.access_token);

            // Build properties object
            const properties: Record<string, any> = {
                ...NotionApiService.createTitleProperty(processedConfig.title),
                ...(processedConfig.properties || {})
            };

            // Build content blocks if provided
            const content = processedConfig.content 
                ? [NotionApiService.createParagraphBlock(processedConfig.content)]
                : undefined;

            // Create the page
            const page = await notionApi.createPage(processedConfig.databaseId, properties, content);

            console.log(`[CreatePage] ✅ Page created: ${page.id}`.green);

            return {
                success: true,
                data: {
                    pageId: page.id,
                    pageUrl: page.url,
                    title: processedConfig.title,
                    createdAt: page.created_time
                }
            };
        } catch (error: any) {
            console.error(`[CreatePage] ❌ Error:`.red, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
