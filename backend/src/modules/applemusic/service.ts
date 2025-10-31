import { BaseModule } from '../_base/BaseModule';
import { SearchCatalog } from './actions/SearchCatalog';
import applemusicConfig from './config';
import 'colors';

export class AppleMusicModule extends BaseModule {
    constructor() {
        super({
            name: applemusicConfig.name,
            displayName: applemusicConfig.displayName,
            description: applemusicConfig.description,
            iconUrl: applemusicConfig.iconUrl,
            color: applemusicConfig.color,
            authType: applemusicConfig.authType as 'none',
            isActive: applemusicConfig.isActive
        });
    }

    getName(): string {
        return 'applemusic';
    }

    async initialize(): Promise<void> {
        console.log('[AppleMusic] Initializing Apple Music module...'.cyan);
        try {
            this.registerAction(new SearchCatalog());
            console.log(
                `[AppleMusic] Module initialized successfully with ${this.actions.size} action(s)`.green
            );
        } catch (error) {
            console.error('[AppleMusic] Failed to initialize module:'.red, error);
            throw error;
        }
    }

    protected async checkUserAccess(userId: string): Promise<boolean> {
        return true;
    }

    async cleanup(): Promise<void> {
        console.log('[AppleMusic] Cleaning up Apple Music module...'.yellow);
        await super.cleanup();
    }
}

export const applemusicModule = new AppleMusicModule();
