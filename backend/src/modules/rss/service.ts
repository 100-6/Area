import { BaseModule } from '../_base/BaseModule';
import { NewFeedItem } from './triggers/NewFeedItem';
import rssConfig from './config';
import 'colors';

/**
 * RSS Module
 * Monitors RSS/Atom feeds for new items with optional pattern matching
 */
export class RssModule extends BaseModule {
    constructor() {
        super({
            name: rssConfig.name,
            displayName: rssConfig.displayName,
            description: rssConfig.description,
            iconUrl: rssConfig.iconUrl,
            color: rssConfig.color,
            authType: rssConfig.authType as 'none',
            isActive: rssConfig.isActive
        });
    }

    /**
     * Module name
     */
    getName(): string {
        return 'rss';
    }

    /**
     * Initialize the RSS module
     * Registers all triggers and actions
     */
    async initialize(): Promise<void> {
        console.log('[RSS] Initializing RSS module...'.cyan);
        
        try {
            // Register trigger
            this.registerTrigger(new NewFeedItem());
            
            console.log(`[RSS] ✓ Module initialized successfully with ${this.triggers.size} trigger(s)`.green);
        } catch (error) {
            console.error('[RSS] Failed to initialize module:'.red, error);
            throw error;
        }
    }

    /**
     * RSS module doesn't require authentication (public feeds)
     */
    protected async checkUserAccess(userId: string): Promise<boolean> {
        return true;
    }

    /**
     * Clean up the RSS module
     */
    async cleanup(): Promise<void> {
        console.log('[RSS] Cleaning up RSS module...'.yellow);
        
        // Stop all active triggers
        for (const [name, trigger] of this.triggers) {
            if (trigger.isActive()) {
                console.log(`[RSS] Stopping active trigger: ${name}`.yellow);
            }
        }
        
        await super.cleanup();
    }
}

export const rssModule = new RssModule();
