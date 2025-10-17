/**
 * WebhookRegistry - In-memory storage for active webhook mappings
 * 
 * This singleton maintains a mapping between webhook names and their associated area IDs.
 * It's rebuilt automatically on backend restart via ModuleSync calling trigger.start().
 * 
 * @example
 * ```typescript
 * const registry = WebhookRegistry.getInstance();
 * registry.register('temperature-sensor', 'area-123');
 * const areaId = registry.getAreaId('temperature-sensor'); // 'area-123'
 * ```
 */
export class WebhookRegistry {
    private static instance: WebhookRegistry;
    private webhooks: Map<string, string> = new Map();

    private constructor() {}

    /**
     * Get singleton instance of WebhookRegistry
     * @returns The shared WebhookRegistry instance
     */
    public static getInstance(): WebhookRegistry {
        if (!WebhookRegistry.instance) {
            WebhookRegistry.instance = new WebhookRegistry();
        }
        return WebhookRegistry.instance;
    }

    /**
     * Register a webhook name to area ID mapping
     * If the webhook name already exists, it will be overwritten (last one wins)
     * 
     * @param name - Unique webhook name (e.g., 'my-sensor')
     * @param areaId - Area ID that owns this webhook
     * @throws Error if name or areaId is empty
     */
    public register(name: string, areaId: string): void {
        if (!name || !areaId) {
            throw new Error('Webhook name and areaId are required');
        }

        this.webhooks.set(name, areaId);
    }

    /**
     * Remove a webhook registration by name
     * 
     * @param name - Webhook name to unregister
     */
    public unregister(name: string): void {
        this.webhooks.delete(name);
    }

    /**
     * Get the area ID associated with a webhook name
     * 
     * @param name - Webhook name to lookup
     * @returns Area ID if found, undefined otherwise
     */
    public getAreaId(name: string): string | undefined {
        return this.webhooks.get(name);
    }

    /**
     * Check if a webhook name is registered
     * 
     * @param name - Webhook name to check
     * @returns true if webhook exists, false otherwise
     */
    public exists(name: string): boolean {
        return this.webhooks.has(name);
    }

    /**
     * Get all registered webhooks
     * 
     * @returns Map of webhook names to area IDs
     */
    public getAllWebhooks(): Map<string, string> {
        return new Map(this.webhooks);
    }

    /**
     * Find webhook name by area ID
     * Useful for cleanup when stopping a workflow
     * 
     * @param areaId - Area ID to search for
     * @returns Webhook name if found, undefined otherwise
     */
    public findByAreaId(areaId: string): string | undefined {
        for (const [name, id] of this.webhooks.entries()) {
            if (id === areaId) {
                return name;
            }
        }
        return undefined;
    }

    /**
     * Clear all webhooks (used in tests)
     */
    public clear(): void {
        this.webhooks.clear();
    }

    /**
     * Get count of registered webhooks
     * 
     * @returns Number of active webhooks
     */
    public size(): number {
        return this.webhooks.size;
    }
}
