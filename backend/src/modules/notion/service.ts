import { BaseModule } from '../_base/BaseModule';
import { NotionApiService } from './NotionApiService';
import notionConfig from './config';
import { OnPageCreatedTrigger, OnPageUpdatedTrigger, OnPropertyStatusChanged, OnCommentAdded } from './triggers/_index';
import { CreatePageAction, UpdatePageAction, DeletePageAction, AppendContentAction } from './actions/_index';
import 'colors';

/**
 * Main Notion Module - Handles complete Notion integration
 * 
 * This module orchestrates all Notion-related triggers and actions.
 * It inherits from BaseModule which provides base methods for
 * registering triggers/actions and lifecycle management.
 * 
 * @class NotionModule
 * @extends {BaseModule}
 */
export class NotionModule extends BaseModule {
    constructor() {
        super({
            name: notionConfig.name,
            displayName: notionConfig.displayName,
            description: notionConfig.description,
            iconUrl: notionConfig.iconUrl,
            color: notionConfig.color,
            authType: notionConfig.authType as 'oauth2',
            isActive: notionConfig.isActive
        });
    }

    getName(): string {
        return 'notion';
    }

    async initialize(): Promise<void> {
        console.log('[Notion] Initializing Notion module...'.cyan);

        try {
            // Register triggers
            this.registerTrigger(new OnPageCreatedTrigger());
            this.registerTrigger(new OnPageUpdatedTrigger());
            this.registerTrigger(new OnPropertyStatusChanged());
            this.registerTrigger(new OnCommentAdded());

            // Register actions
            this.registerAction(new CreatePageAction());
            this.registerAction(new UpdatePageAction());
            this.registerAction(new DeletePageAction());
            this.registerAction(new AppendContentAction());

            console.log('[Notion] ✓ Module initialized with 4 triggers and 4 actions'.green.bold);
        } catch (error) {
            console.error('[Notion] ❌ Failed to initialize module:'.red, error);
            throw error;
        }
    }

    async cleanup(): Promise<void> {
        console.log('[Notion] Cleaning up Notion module...'.yellow);

        try {
            await super.cleanup();
            console.log('[Notion] ✓ Module cleaned up successfully'.green);
        } catch (error) {
            console.error('[Notion] ❌ Error during cleanup:'.red, error);
        }
    }
}

/**
 * Export the Notion module instance
 */
export const notionModule = new NotionModule();
