import { BaseModule } from '../_base/BaseModule';
import { WebhookReceiver } from './triggers/WebhookReceiver';
import webhookConfig from './config';
import 'colors';

/**
 * Webhook Module
 * 
 * Allows users to receive HTTP POST webhooks with arbitrary data.
 * Simple name-based endpoints (like ntfy.sh) without authentication tokens.
 * 
 * Features:
 * - Simple webhook creation with user-chosen names
 * - Automatic in-memory registration (no database storage)
 * - Auto-restoration on backend restart via ModuleSync
 * - Support for JSON and form-data payloads
 * 
 * @example
 * ```typescript
 * // User creates workflow with WebhookReceiver trigger
 * // Config: { webhookName: "temperature-sensor" }
 * // Endpoint: POST /webhook/temperature-sensor
 * 
 * // External device sends data:
 * curl -X POST https://api.mirror-area.com/webhook/temperature-sensor \
 *   -H "Content-Type: application/json" \
 *   -d '{"temp": 22.5, "humidity": 60}'
 * 
 * // Workflow actions can use variables:
 * // {{body.temp}} → 22.5
 * // {{receivedAt}} → "2025-10-17T14:30:00Z"
 * ```
 */
export class WebhookModule extends BaseModule {
    constructor() {
        super({
            name: webhookConfig.name,
            displayName: webhookConfig.displayName,
            description: webhookConfig.description,
            iconUrl: webhookConfig.iconUrl,
            color: webhookConfig.color,
            authType: webhookConfig.authType as 'none',
            isActive: webhookConfig.isActive
        });
    }

    /**
     * Get module name
     * @returns Module identifier used in registry
     */
    getName(): string {
        return 'webhook';
    }

    /**
     * Initialize Webhook module
     * Registers all available triggers (currently only WebhookReceiver)
     */
    async initialize(): Promise<void> {
        console.log('[Webhook] Initializing Webhook module...'.cyan);

        try {
            // Register WebhookReceiver trigger
            this.registerTrigger(new WebhookReceiver());

            console.log(
                `[Webhook] ✓ Module initialized successfully with ${this.triggers.size} trigger(s)`.green
            );
        } catch (error) {
            console.error('[Webhook] ❌ Failed to initialize module:'.red, error);
            throw error;
        }
    }

    /**
     * Check if user has access to this module
     * Webhook module requires no authentication (public endpoints)
     * 
     * @param userId - User ID to check (unused for webhook module)
     * @returns Always true - no authentication required
     */
    protected async checkUserAccess(userId: string): Promise<boolean> {
        return true; // Public module, no auth required
    }

    /**
     * Get a registered trigger by name
     * Utility method for route handlers to access trigger instances
     * 
     * @param triggerName - Name of the trigger to retrieve
     * @returns Trigger instance or undefined if not found
     * 
     * @example
     * ```typescript
     * const trigger = webhookModule.getTrigger('WebhookReceiver');
     * await trigger.handleIncomingWebhook('my-sensor', payload);
     * ```
     */
    public getTrigger(triggerName: string): WebhookReceiver | undefined {
        return this.triggers.get(triggerName) as WebhookReceiver | undefined;
    }

    /**
     * Start a webhook listener for a specific workflow
     * 
     * @param areaId - Workflow identifier
     * @param triggerName - Trigger name (typically 'WebhookReceiver')
     * @param config - Trigger configuration containing webhookName
     * @throws Error if trigger not found
     */
    async startWebhook(areaId: string, triggerName: string, config: any): Promise<void> {
        const trigger = this.getTrigger(triggerName);

        if (!trigger) {
            throw new Error(`Trigger "${triggerName}" not found in Webhook module`);
        }

        console.log(
            `[Webhook] Starting webhook "${config.webhookName}" for area ${areaId}`.cyan
        );

        await trigger.start(areaId, config);
    }

    /**
     * Stop a webhook listener for a specific workflow
     * 
     * @param areaId - Workflow identifier
     * @param triggerName - Trigger name (typically 'WebhookReceiver')
     * @throws Error if trigger not found
     */
    async stopWebhook(areaId: string, triggerName: string): Promise<void> {
        const trigger = this.getTrigger(triggerName);

        if (!trigger) {
            throw new Error(`Trigger "${triggerName}" not found in Webhook module`);
        }

        console.log(
            `[Webhook] Stopping webhook for area ${areaId}`.yellow
        );

        await trigger.stop(areaId);
    }

    /**
     * Cleanup module resources
     * Called on graceful shutdown or module unload
     */
    async cleanup(): Promise<void> {
        console.log('[Webhook] Cleaning up Webhook module...'.yellow);

        // Stop all active triggers
        for (const [name, trigger] of this.triggers) {
            if (trigger.isActive()) {
                console.log(`[Webhook] Stopping active trigger: ${name}`.yellow);
            }
        }

        await super.cleanup();

        console.log('[Webhook] ✓ Cleanup completed'.green);
    }
}

/**
 * Singleton instance of WebhookModule
 * Export for use in routes and registry
 */
export const webhookModule = new WebhookModule();
