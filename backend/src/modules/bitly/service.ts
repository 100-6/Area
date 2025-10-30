import { BaseModule } from '../_base/BaseModule';
import bitlyConfig from './config';
import { BitlyApiService } from './BitlyApiService';
import 'colors';
import {
    OnNewBitlinkCreatedTrigger,
    OnBitlinkClickThresholdTrigger
} from './triggers/_index';
import {
    CreateBitlinkAction,
    UpdateBitlinkDestinationAction
} from './actions/_index';

/**
 * Bitly Module
 * Manages registration of Bitly triggers and reactions
 */
export class BitlyModule extends BaseModule {
    private apiService: BitlyApiService;

    constructor() {
        super({
            name: bitlyConfig.name,
            displayName: bitlyConfig.displayName,
            description: bitlyConfig.description,
            iconUrl: bitlyConfig.iconUrl,
            color: bitlyConfig.color,
            authType: bitlyConfig.authType as 'oauth2',
            isActive: bitlyConfig.isActive
        });

        this.apiService = new BitlyApiService();
    }

    getName(): string {
        return 'bitly';
    }

    async initialize(): Promise<void> {
        console.log('[Bitly] Initializing Bitly module...'.cyan);

        try {
            // Register triggers
            this.registerTrigger(new OnNewBitlinkCreatedTrigger(this));
            this.registerTrigger(new OnBitlinkClickThresholdTrigger(this));

            // Register actions (reactions)
            this.registerAction(new CreateBitlinkAction(this));
            this.registerAction(new UpdateBitlinkDestinationAction(this));

            console.log('[Bitly] ✓ Module initialized successfully'.green.bold);
        } catch (error) {
            console.error('[Bitly] ❌ Failed to initialize module:'.red, error);
            throw error;
        }
    }

    getApiService(): BitlyApiService {
        return this.apiService;
    }

    async cleanup(): Promise<void> {
        console.log('[Bitly] Cleaning up Bitly module...'.yellow);

        try {
            await super.cleanup();
            console.log('[Bitly] ✓ Module cleaned up successfully'.green);
        } catch (error) {
            console.error('[Bitly] ❌ Error during cleanup:'.red, error);
        }
    }
}

export const bitlyModule = new BitlyModule();
