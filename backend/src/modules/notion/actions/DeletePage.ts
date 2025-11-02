import { BaseAction, ActionConfig, ActionResult, ActionContext } from '../../_base/BaseAction';
import { NotionApiService } from '../NotionApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

interface DeletePageConfig extends ActionConfig {
    pageId: string;
}

/**
 * Notion Delete Page Action
 * Archives (deletes) a Notion page
 */
export class DeletePageAction extends BaseAction {
    getName(): string {
        return 'delete_page';
    }

    getDescription(): string {
        return 'Archive (delete) a Notion page';
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
                    description: 'ID of the page to delete/archive'
                }
            }
        };
    }

    validate(config: ActionConfig): boolean {
        const cfg = config as DeletePageConfig;
        if (!cfg.pageId) {
            throw new Error('Page ID is required');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const processedConfig = this.replaceVariablesInConfig(config, context) as DeletePageConfig;
        this.validate(processedConfig);

        console.log(`[DeletePage] Deleting page ${processedConfig.pageId}`.cyan);

        try {
            const notionAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'notion');
            if (!notionAuth || !notionAuth.access_token) {
                throw new Error('Notion not connected for this user');
            }

            const notionApi = new NotionApiService(notionAuth.access_token);

            // Archive the page
            const page = await notionApi.archivePage(processedConfig.pageId);

            console.log(`[DeletePage] ✅ Page deleted: ${page.id}`.green);

            return {
                success: true,
                data: {
                    pageId: page.id,
                    archived: true,
                    archivedAt: page.last_edited_time
                }
            };
        } catch (error: any) {
            console.error(`[DeletePage] ❌ Error:`.red, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
