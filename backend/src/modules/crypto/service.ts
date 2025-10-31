import { BaseModule } from '../_base/BaseModule';
import { GetPriceSnapshot } from './actions/GetPriceSnapshot';
import cryptoConfig from './config';
import 'colors';

export class CryptoModule extends BaseModule {
    constructor() {
        super({
            name: cryptoConfig.name,
            displayName: cryptoConfig.displayName,
            description: cryptoConfig.description,
            iconUrl: cryptoConfig.iconUrl,
            color: cryptoConfig.color,
            authType: cryptoConfig.authType as 'none',
            isActive: cryptoConfig.isActive
        });
    }

    getName(): string {
        return 'crypto';
    }

    async initialize(): Promise<void> {
        console.log('[Crypto] Initializing Crypto module...'.cyan);
        try {
            this.registerAction(new GetPriceSnapshot());
            console.log(`[Crypto] Module initialized successfully with ${this.actions.size} action(s)`.green);
        } catch (error) {
            console.error('[Crypto] Failed to initialize module:'.red, error);
            throw error;
        }
    }

    protected async checkUserAccess(userId: string): Promise<boolean> {
        return true;
    }

    async cleanup(): Promise<void> {
        console.log('[Crypto] Cleaning up Crypto module...'.yellow);
        await super.cleanup();
    }
}

export const cryptoModule = new CryptoModule();
