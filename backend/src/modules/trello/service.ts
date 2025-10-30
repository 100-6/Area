import { BaseModule } from '../_base/BaseModule';
import { TrelloApiService } from './TrelloApiService';
import trelloConfig from './config';
import { OnBoardCreatedTrigger, OnBoardUpdatedTrigger, OnBoardClosedTrigger } from './triggers/_index';
import { CreateCardAction, MoveCardAction, DeleteCardAction, CreateListAction, DeleteListAction } from './actions/_index';
import 'colors';

/**
 * Main Trello Module - Handles complete Trello integration
 */
export class TrelloModule extends BaseModule {
    private apiService: TrelloApiService;

    constructor() {
        super({
            name: trelloConfig.name,
            displayName: trelloConfig.displayName,
            description: trelloConfig.description,
            iconUrl: trelloConfig.iconUrl,
            color: trelloConfig.color,
            authType: trelloConfig.authType as 'oauth2',
            isActive: trelloConfig.isActive
        });

        this.apiService = new TrelloApiService();
    }

    getName(): string {
        return 'trello';
    }

    async initialize(): Promise<void> {
        console.log('[Trello] Initializing Trello module...'.cyan);

        try {
            // Register triggers
            this.registerTrigger(new OnBoardCreatedTrigger());
            this.registerTrigger(new OnBoardUpdatedTrigger());
            this.registerTrigger(new OnBoardClosedTrigger());

            // Register actions
            this.registerAction(new CreateCardAction());
            this.registerAction(new MoveCardAction());
            this.registerAction(new DeleteCardAction());
            this.registerAction(new CreateListAction());
            this.registerAction(new DeleteListAction());

            console.log('[Trello] ✓ Module initialized successfully'.green.bold);
        } catch (error) {
            console.error('[Trello] ❌ Failed to initialize module:'.red, error);
            throw error;
        }
    }

    getApiService(): TrelloApiService {
        return this.apiService;
    }

    async cleanup(): Promise<void> {
        console.log('[Trello] Cleaning up Trello module...'.yellow);

        try {
            for (const [name, trigger] of this.triggers) {
                if (trigger.isActive()) {
                    console.log(`[Trello] Stopping active trigger: ${name}`.yellow);
                }
            }
            await super.cleanup();
            console.log('[Trello] ✓ Module cleaned up successfully'.green);
        } catch (error) {
            console.error('[Trello] ❌ Error during cleanup:'.red, error);
        }
    }
}

export const trelloModule = new TrelloModule();
