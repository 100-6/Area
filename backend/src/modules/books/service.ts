import { BaseModule } from '../_base/BaseModule';
import { SearchBooks } from './actions/SearchBooks';
import booksConfig from './config';
import 'colors';

export class BooksModule extends BaseModule {
    constructor() {
        super({
            name: booksConfig.name,
            displayName: booksConfig.displayName,
            description: booksConfig.description,
            iconUrl: booksConfig.iconUrl,
            color: booksConfig.color,
            authType: booksConfig.authType as 'none',
            isActive: booksConfig.isActive
        });
    }

    getName(): string {
        return 'books';
    }

    async initialize(): Promise<void> {
        console.log('[Books] Initializing Books module...'.cyan);
        try {
            this.registerAction(new SearchBooks());
            console.log(`[Books] Module initialized successfully with ${this.actions.size} action(s)`.green);
        } catch (error) {
            console.error('[Books] Failed to initialize module:'.red, error);
            throw error;
        }
    }

    protected async checkUserAccess(userId: string): Promise<boolean> {
        return true;
    }

    async cleanup(): Promise<void> {
        console.log('[Books] Cleaning up Books module...'.yellow);
        await super.cleanup();
    }
}

export const booksModule = new BooksModule();
