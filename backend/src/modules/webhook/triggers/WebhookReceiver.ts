import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { WebhookRegistry } from '../WebhookRegistry';
import webhookConfig from '../config';
import 'colors';

/**
 * WebhookReceiver Trigger
 * 
 * Allows users to receive HTTP POST webhooks with custom data.
 * Similar to ntfy.sh - simple name-based endpoints without tokens.
 * 
 * @example
 * User configures: { webhookName: "temperature-sensor" }
 * Endpoint becomes: POST /webhook/temperature-sensor
 * 
 * External device sends:
 * ```bash
 * curl -X POST https://mirror-area.com/webhook/temperature-sensor \
 *   -H "Content-Type: application/json" \
 *   -d '{"temp": 22.5, "humidity": 60}'
 * ```
 * 
 * Workflow receives variables:
 * - {{body.temp}} → 22.5
 * - {{body.humidity}} → 60
 * - {{receivedAt}} → "2025-10-17T14:30:00Z"
 */
export class WebhookReceiver extends BaseTrigger {
    private registry: WebhookRegistry;

    constructor() {
        super();
        this.registry = WebhookRegistry.getInstance();
    }

    /**
     * Get unique trigger name
     * @returns Trigger identifier used in module registry
     */
    getName(): string {
        return 'webhook_received';
    }

    /**
     * Get trigger type
     * @returns 'webhook' - this trigger responds to external HTTP requests
     */
    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'webhook';
    }

    /**
     * Get human-readable description
     * @returns Trigger description for UI display
     */
    getDescription(): string {
        return 'Receive HTTP POST webhooks with custom data. Choose a name and get a unique endpoint URL.';
    }

    /**
     * Get configuration schema for UI form generation
     * @returns JSON Schema defining required config fields
     */
    getConfigSchema(): any {
        return webhookConfig.actions[0].configSchema;
    }

    /**
     * Get output schema for variable templating
     * Defines the data structure available to downstream actions
     * @returns JSON Schema of webhook payload structure
     */
    getOutputSchema(): any {
        return webhookConfig.actions[0].outputSchema;
    }

    /**
     * Validate trigger configuration
     * @param config - User-provided configuration
     * @returns true if valid
     * @throws Error if validation fails
     */
    validate(config: TriggerConfig): boolean {
        if (!config.webhookName) {
            throw new Error('Webhook name is required');
        }

        const name = config.webhookName;

        // Validate format: alphanumeric, dash, underscore only
        if (!/^[a-z0-9-_]+$/.test(name)) {
            throw new Error('Webhook name must contain only lowercase letters, numbers, dashes, and underscores');
        }

        // Validate length
        if (name.length < 3 || name.length > 50) {
            throw new Error('Webhook name must be between 3 and 50 characters');
        }

        return true;
    }

    /**
     * Start webhook listener for a specific workflow
     * 
     * Called when:
     * - User activates a workflow with this trigger
     * - Backend restarts and ModuleSync restores active workflows
     * 
     * @param areaId - Unique workflow identifier
     * @param config - Trigger configuration containing webhookName
     * @throws Error if webhook name is already registered (optional enforcement)
     */
    async start(areaId: string, config: TriggerConfig): Promise<void> {
        await this.onBeforeStart(areaId, config);

        // Validate configuration
        this.validate(config);

        const webhookName = config.webhookName as string;

        // Check if name is already taken
        const existingAreaId = this.registry.getAreaId(webhookName);
        if (existingAreaId && existingAreaId !== areaId) {
            console.warn(
                `[WebhookReceiver] ⚠️  Webhook "${webhookName}" already registered to area ${existingAreaId}, overwriting with ${areaId}`.yellow
            );
        }

        // Register in-memory mapping
        this.registry.register(webhookName, areaId);

        this.isRunning = true;

        console.log(
            `[WebhookReceiver] ✓ Registered: POST /webhook/${webhookName} → Area ${areaId}`.green
        );

        await this.onAfterStart(areaId, config);
    }

    /**
     * Stop webhook listener
     * 
     * Called when:
     * - User deactivates or deletes a workflow
     * - Workflow is being reconfigured
     * 
     * @param areaId - Unique workflow identifier
     */
    async stop(areaId: string): Promise<void> {
        await this.onBeforeStop(areaId);

        // Find webhook name by area ID
        const webhookName = this.registry.findByAreaId(areaId);

        if (webhookName) {
            this.registry.unregister(webhookName);
            console.log(
                `[WebhookReceiver] ✗ Unregistered: /webhook/${webhookName}`.yellow
            );
        } else {
            console.warn(
                `[WebhookReceiver] ⚠️  No webhook found for area ${areaId}`.yellow
            );
        }

        this.isRunning = false;

        await this.onAfterStop(areaId);
    }

    /**
     * Handle incoming webhook POST request
     * 
     * Called by the webhook route handler when a POST request is received.
     * This method enriches the payload with metadata and emits the trigger event.
     * 
     * @param webhookName - Name from the URL path
     * @param payload - Enriched request data (body, headers, timestamp, etc.)
     * @throws Error if webhook is not registered
     * 
     * @example
     * ```typescript
     * // In routes.ts
     * const payload = {
     *   receivedAt: new Date().toISOString(),
     *   webhookName: 'temperature-sensor',
     *   contentType: 'application/json',
     *   body: { temp: 22.5 },
     *   headers: { 'user-agent': 'ESP32' }
     * };
     * 
     * await trigger.handleIncomingWebhook('temperature-sensor', payload);
     * ```
     */
    async handleIncomingWebhook(webhookName: string, payload: any): Promise<void> {
        const areaId = this.registry.getAreaId(webhookName);

        if (!areaId) {
            throw new Error(`Webhook "${webhookName}" is not registered`);
        }

        console.log(
            `[WebhookReceiver] 📨 Received POST on /webhook/${webhookName}`.cyan
        );

        // Prepare trigger payload
        const triggerPayload: TriggerPayload = {
            areaId,
            triggerName: this.getName(),
            triggerType: this.getType(),
            timestamp: payload.receivedAt || new Date().toISOString(),
            data: payload
        };

        // Emit trigger event via EventBus
        await this.emitTrigger(triggerPayload);

        console.log(
            `[WebhookReceiver] ✓ Trigger fired for area ${areaId}`.green
        );
    }
}
