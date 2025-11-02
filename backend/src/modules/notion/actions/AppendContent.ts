import { BaseAction, ActionConfig, ActionResult, ActionContext } from '../../_base/BaseAction';
import { NotionApiService } from '../NotionApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

interface AppendContentConfig extends ActionConfig {
    pageId: string;
    content: string;
    blockType?: 'paragraph' | 'heading_2' | 'heading_3' | 'bulleted_list_item' | 'numbered_list_item' | 'code';
}

/**
 * Notion Append Content Action
 * Adds content blocks to the end of a Notion page
 */
export class AppendContentAction extends BaseAction {
    getName(): string {
        return 'append_content';
    }

    getDescription(): string {
        return 'Add content blocks to the end of a Notion page';
    }

    getRequiredScopes(): string[] {
        return [];
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['pageId', 'content'],
            properties: {
                pageId: {
                    type: 'string',
                    title: 'Page ID',
                    description: 'ID of the page to append content to'
                },
                content: {
                    type: 'string',
                    title: 'Content',
                    description: 'Text content to append'
                },
                blockType: {
                    type: 'string',
                    title: 'Block Type',
                    description: 'Type of content block',
                    enum: ['paragraph', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item', 'code'],
                    default: 'paragraph'
                }
            }
        };
    }

    validate(config: ActionConfig): boolean {
        const cfg = config as AppendContentConfig;
        if (!cfg.pageId || !cfg.content) {
            throw new Error('Page ID and content are required');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const processedConfig = this.replaceVariablesInConfig(config, context) as AppendContentConfig;
        this.validate(processedConfig);

        console.log(`[AppendContent] Appending content to page ${processedConfig.pageId}`.cyan);

        try {
            const notionAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'notion');
            if (!notionAuth || !notionAuth.access_token) {
                throw new Error('Notion not connected for this user');
            }

            const notionApi = new NotionApiService(notionAuth.access_token);

            const blockType = processedConfig.blockType || 'paragraph';

            // Create block based on type
            const block = this.createBlock(blockType, processedConfig.content);

            // Append the block
            await notionApi.appendBlocks(processedConfig.pageId, [block]);

            console.log(`[AppendContent] ✅ Content appended to page ${processedConfig.pageId}`.green);

            return {
                success: true,
                data: {
                    pageId: processedConfig.pageId,
                    blockType,
                    contentLength: processedConfig.content.length
                }
            };
        } catch (error: any) {
            console.error(`[AppendContent] ❌ Error:`.red, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    private createBlock(type: string, content: string): any {
        const richText = [{
            type: 'text',
            text: { content }
        }];

        switch (type) {
            case 'heading_2':
                return {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: { rich_text: richText }
                };
            case 'heading_3':
                return {
                    object: 'block',
                    type: 'heading_3',
                    heading_3: { rich_text: richText }
                };
            case 'bulleted_list_item':
                return {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: { rich_text: richText }
                };
            case 'numbered_list_item':
                return {
                    object: 'block',
                    type: 'numbered_list_item',
                    numbered_list_item: { rich_text: richText }
                };
            case 'code':
                return {
                    object: 'block',
                    type: 'code',
                    code: { 
                        rich_text: richText,
                        language: 'plain text'
                    }
                };
            case 'paragraph':
            default:
                return {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: { rich_text: richText }
                };
        }
    }
}
