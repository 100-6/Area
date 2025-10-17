import { BaseModule } from '../_base/BaseModule';
import { MessageReceivedTrigger } from './triggers/MessageReceivedTrigger';
import { SendNotification } from './actions/SendNotification';
import { SendNotificationWithAttachment } from './actions/SendNotificationWithAttachment';
import ntfyConfig from './config';
import 'colors';

/**
 * Ntfy Module
 * Manages ntfy push notification triggers and actions
 */
export class NtfyModule extends BaseModule {
    constructor() {
        super({
            name: ntfyConfig.name,
            displayName: ntfyConfig.displayName,
            description: ntfyConfig.description,
            iconUrl: ntfyConfig.iconUrl,
            color: ntfyConfig.color,
            authType: ntfyConfig.authType as 'none',
            isActive: ntfyConfig.isActive
        });
    }

    /**
     * Module name
     */
    getName(): string {
        return 'ntfy';
    }

    /**
     * Initialize the Ntfy module
     * Registers all triggers and actions
     */
    async initialize(): Promise<void> {
        console.log('[Ntfy] Initializing Ntfy module...'.cyan);
        
        try {
            // Register trigger
            this.registerTrigger(new MessageReceivedTrigger());
            
            // Register actions
            this.registerAction(new SendNotification());
            this.registerAction(new SendNotificationWithAttachment());
            
            console.log(`[Ntfy] Module initialized successfully with ${this.triggers.size} triggers and ${this.actions.size} actions`.green);
        } catch (error) {
            console.error('[Ntfy] Failed to initialize module:'.red, error);
            throw error;
        }
    }

    /**
     * Ntfy module doesn't require authentication
     */
    protected async checkUserAccess(userId: string): Promise<boolean> {
        return true;
    }

    /**
     * Clean up the Ntfy module
     */
    async cleanup(): Promise<void> {
        console.log('[Ntfy] Cleaning up Ntfy module...'.yellow);
        
        // Stop all active triggers
        for (const [name, trigger] of this.triggers) {
            if (trigger.isActive()) {
                console.log(`[Ntfy] Stopping active trigger: ${name}`.yellow);
            }
        }
        
        await super.cleanup();
    }
}

export const ntfyModule = new NtfyModule();
