import { BaseModule } from '../_base/BaseModule';
import { ConvertAmount } from './actions/ConvertAmount';
import currencyConfig from './config';
import 'colors';

export class CurrencyModule extends BaseModule {
    constructor() {
        super({
            name: currencyConfig.name,
            displayName: currencyConfig.displayName,
            description: currencyConfig.description,
            iconUrl: currencyConfig.iconUrl,
            color: currencyConfig.color,
            authType: currencyConfig.authType as 'none',
            isActive: currencyConfig.isActive
        });
    }

    getName(): string {
        return 'currency';
    }

    async initialize(): Promise<void> {
        console.log('[Currency] Initializing Currency module...'.cyan);
        try {
            this.registerAction(new ConvertAmount());
            console.log(`[Currency] Module initialized successfully with ${this.actions.size} action(s)`.green);
        } catch (error) {
            console.error('[Currency] Failed to initialize module:'.red, error);
            throw error;
        }
    }

    protected async checkUserAccess(userId: string): Promise<boolean> {
        return true;
    }

    async cleanup(): Promise<void> {
        console.log('[Currency] Cleaning up Currency module...'.yellow);
        await super.cleanup();
    }
}

export const currencyModule = new CurrencyModule();
