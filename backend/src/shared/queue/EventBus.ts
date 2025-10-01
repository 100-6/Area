import { RedisManager } from './RedisManager';
import 'colors';

/**
 * Event types supported by the system
 */
export type EventType =
    | 'trigger.fired'
    | 'action.started'
    | 'action.completed'
    | 'action.failed'
    | 'area.created'
    | 'area.updated'
    | 'area.deleted'
    | 'area.activated'
    | 'area.deactivated'
    | 'workflow.started'
    | 'workflow.completed'
    | 'workflow.failed';

/**
 * Event data structure
 */
export interface EventData {
    [key: string]: any;
}

/**
 * Event callback function
 */
export type EventCallback = (data: EventData) => void | Promise<void>;

/**
 * EventBus - Simplified event system using Redis Pub/Sub
 * Singleton pattern for centralized event management
 */
export class EventBus {
    private static instance: EventBus;
    private redis: RedisManager;
    private listeners: Map<string, EventCallback[]>;
    private isInitialized: boolean = false;

    private constructor() {
        this.redis = RedisManager.getInstance();
        this.listeners = new Map();
    }

    /**
     * Get EventBus singleton instance
     */
    public static getInstance(): EventBus {
        if (!EventBus.instance)
            EventBus.instance = new EventBus();
        return EventBus.instance;
    }

    /**
     * Initialize EventBus (connect to Redis)
     */
    public async init(): Promise<void> {
        if (this.isInitialized) {
            console.log('EventBus already initialized'.yellow);
            return;
        }
        try {
            await this.redis.connect();
            this.isInitialized = true;
            console.log('EventBus initialized'.green.bold);
        } catch (error) {
            console.error('Failed to initialize EventBus:'.red, error);
            throw error;
        }
    }

    /**
     * Emit an event
     * @param event - Event type
     * @param data - Event data
     */
    public async emit(event: EventType | string, data: EventData): Promise<void> {
        this.ensureInitialized();

        try {
            const eventData = {
                event,
                data,
                timestamp: new Date().toISOString(),
            };
            await this.redis.publish(event, eventData);
            console.log(`Event emitted: ${event}`.cyan, data);
        } catch (error) {
            console.error(`Failed to emit event "${event}":`.red, error);
            throw error;
        }
    }

    /**
     * Listen to an event
     * @param event - Event type
     * @param callback - Callback function
     */
    public async on(event: EventType | string, callback: EventCallback): Promise<void> {
        this.ensureInitialized();

        try {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
                await this.redis.subscribe(event, async (eventData) => {
                    const callbacks = this.listeners.get(event) || [];
                    for (const cb of callbacks) {
                        try {
                            await cb(eventData.data);
                        } catch (error) {
                            console.error(`Error in event handler for "${event}":`.red, error);
                        }
                    }
                });
                console.log(`Listening to event: ${event}`.green);
            }
            this.listeners.get(event)!.push(callback);
        } catch (error) {
            console.error(`Failed to listen to event "${event}":`.red, error);
            throw error;
        }
    }

    /**
     * Remove listener for an event
     * @param event - Event type
     * @param callback - Callback to remove (optional, removes all if not provided)
     */
    public async removeListener(event: EventType | string, callback?: EventCallback): Promise<void> {
        this.ensureInitialized();
        try {
            const callbacks = this.listeners.get(event);

            if (!callbacks) {
                console.log(`No listeners found for event: ${event}`.yellow);
                return;
            }
            if (callback) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                    console.log(`Removed listener for event: ${event}`.yellow);
                }
                if (callbacks.length === 0) {
                    await this.redis.unsubscribe(event);
                    this.listeners.delete(event);
                    console.log(`Unsubscribed from event: ${event}`.yellow);
                }
            } else {
                await this.redis.unsubscribe(event);
                this.listeners.delete(event);
                console.log(`Removed all listeners for event: ${event}`.yellow);
            }
        } catch (error) {
            console.error(`Failed to remove listener for "${event}":`.red, error);
            throw error;
        }
    }

    /**
     * Remove all listeners
     */
    public async removeAllListeners(): Promise<void> {
        this.ensureInitialized();
        try {
            const events = Array.from(this.listeners.keys());

            for (const event of events)
                await this.redis.unsubscribe(event);
            this.listeners.clear();
            console.log('Removed all event listeners'.yellow);
        } catch (error) {
            console.error('Failed to remove all listeners:'.red, error);
            throw error;
        }
    }

    /**
     * Get all active listeners
     */
    public getListeners(): Map<string, number> {
        const result = new Map<string, number>();

        for (const [event, callbacks] of this.listeners.entries())
            result.set(event, callbacks.length);
        return result;
    }

    /**
     * Check if event has listeners
     */
    public hasListeners(event: EventType | string): boolean {
        const callbacks = this.listeners.get(event);

        return callbacks !== undefined && callbacks.length > 0;
    }

    /**
     * Get listener count for an event
     */
    public listenerCount(event: EventType | string): number {
        const callbacks = this.listeners.get(event);

        return callbacks ? callbacks.length : 0;
    }

    /**
     * Emit and wait for all handlers to complete
     * Useful for testing or critical events
     */
    public async emitAndWait(event: EventType | string, data: EventData): Promise<void> {
        await this.emit(event, data);
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    /**
     * Close EventBus (disconnect from Redis)
     */
    public async close(): Promise<void> {
        if (!this.isInitialized)
            return;
        try {
            await this.removeAllListeners();
            await this.redis.disconnect();
            this.isInitialized = false;
            console.log('EventBus closed'.yellow);
        } catch (error) {
            console.error('Failed to close EventBus:'.red, error);
            throw error;
        }
    }

    /**
     * Ensure EventBus is initialized
     */
    private ensureInitialized(): void {
        if (!this.isInitialized)
            throw new Error('EventBus not initialized. Call init() first.');
    }

    /**
     * Get initialization status
     */
    public isReady(): boolean {
        return this.isInitialized;
    }
}

export default EventBus.getInstance();
