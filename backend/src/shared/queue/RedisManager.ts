import { createClient, RedisClientType } from 'redis';
import 'colors';

export class RedisManager {
    private static instance: RedisManager;
    private client: RedisClientType;
    private publisher: RedisClientType;
    private subscriber: RedisClientType;
    private isConnected: boolean = false;
    private host: string;
    private port: number;
    private password?: string;

    private constructor() {
        this.host = process.env.REDIS_HOST || 'localhost';
        this.port = parseInt(process.env.REDIS_PORT || '6379');
        this.password = process.env.REDIS_PASSWORD;
        this.client = createClient({
            socket: {
                host: this.host,
                port: this.port,
            },
            password: this.password,
        });
        this.publisher = this.client.duplicate();
        this.subscriber = this.client.duplicate();
        this.setupEventHandlers();
    }

    /**
     * Singleton instance
     */
    public static getInstance(): RedisManager {
        if (!RedisManager.instance)
            RedisManager.instance = new RedisManager();
        return RedisManager.instance;
    }

    /**
     * Setup event handlers for all clients
     */
    private setupEventHandlers(): void {
        this.client.on('connect', () => {
            console.log('Redis main client connected'.green);
        });
        this.client.on('error', (err) => {
            console.error('Redis main client error:'.red, err);
            this.isConnected = false;
        });
        this.publisher.on('connect', () => {
            console.log('Redis publisher connected'.green);
        });
        this.publisher.on('error', (err) => {
            console.error('Redis publisher error:'.red, err);
        });
        this.subscriber.on('connect', () => {
            console.log('Redis subscriber connected'.green);
        });
        this.subscriber.on('error', (err) => {
            console.error('Redis subscriber error:'.red, err);
        });
    }

    /**
     * Connect all Redis clients
     */
    public async connect(): Promise<void> {
        try {
            if (!this.isConnected) {
                await Promise.all([
                    this.client.connect(),
                    this.publisher.connect(),
                    this.subscriber.connect(),
                ]);
                this.isConnected = true;
                console.log('All Redis clients connected successfully'.green.bold);
            }
        } catch (error) {
            console.error('Failed to connect to Redis:'.red, error);
            throw new Error(`Redis connection failed: ${error}`);
        }
    }

    /**
     * Disconnect all Redis clients
     */
    public async disconnect(): Promise<void> {
        try {
            await Promise.all([
                this.client.quit(),
                this.publisher.quit(),
                this.subscriber.quit(),
            ]);
            this.isConnected = false;
            console.log('All Redis clients disconnected'.yellow);
        } catch (error) {
            console.error('Error disconnecting Redis:'.red, error);
        }
    }

    /**
     * Get main Redis client
     */
    public getClient(): RedisClientType {
        if (!this.isConnected)
            throw new Error('Redis is not connected. Call connect() first.');
        return this.client;
    }

    /**
     * Get publisher client
     */
    public getPublisher(): RedisClientType {
        if (!this.isConnected)
            throw new Error('Redis is not connected. Call connect() first.');
        return this.publisher;
    }

    /**
     * Get subscriber client
     */
    public getSubscriber(): RedisClientType {
        if (!this.isConnected)
            throw new Error('Redis is not connected. Call connect() first.');
        return this.subscriber;
    }

    /**
     * Check if Redis is connected
     */
    public isHealthy(): boolean {
        return this.isConnected;
    }

    /**
     * Publish a message to a Redis channel
     * @param channel - Channel name
     * @param message - Message to publish (will be JSON stringified)
     */
    public async publish(channel: string, message: any): Promise<void> {
        try {
            if (!this.isConnected)
                throw new Error('Redis is not connected. Call connect() first.');
            const serializedMessage = JSON.stringify(message);
            await this.publisher.publish(channel, serializedMessage);
            console.log(`Published to channel "${channel}":`.cyan, message);
        } catch (error) {
            console.error(`Failed to publish to channel "${channel}":`.red, error);
            throw error;
        }
    }

    /**
     * Subscribe to a Redis channel
     * @param channel - Channel name
     * @param callback - Function to call when message received
     */
    public async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
        try {
            if (!this.isConnected)
                throw new Error('Redis is not connected. Call connect() first.');
            await this.subscriber.subscribe(channel, (serializedMessage) => {
                try {
                    const message = JSON.parse(serializedMessage);
                    console.log(`Received from channel "${channel}":`.cyan, message);
                    callback(message);
                } catch (error) {
                    console.error(`Failed to parse message from channel "${channel}":`.red, error);
                }
            });
            console.log(`Subscribed to channel: ${channel}`.green);
        } catch (error) {
            console.error(`Failed to subscribe to channel "${channel}":`.red, error);
            throw error;
        }
    }

    /**
     * Unsubscribe from a Redis channel
     * @param channel - Channel name
     */
    public async unsubscribe(channel: string): Promise<void> {
        try {
            if (!this.isConnected)
                throw new Error('Redis is not connected. Call connect() first.');
            await this.subscriber.unsubscribe(channel);
            console.log(`Unsubscribed from channel: ${channel}`.yellow);
        } catch (error) {
            console.error(`Failed to unsubscribe from channel "${channel}":`.red, error);
            throw error;
        }
    }

    /**
     * Subscribe to multiple channels with pattern matching
     * @param pattern - Pattern to match (e.g., "event:*")
     * @param callback - Function to call when message received
     */
    public async pSubscribe(pattern: string, callback: (message: any, channel: string) => void): Promise<void> {
        try {
            if (!this.isConnected)
                throw new Error('Redis is not connected. Call connect() first.');
            await this.subscriber.pSubscribe(pattern, (serializedMessage, channel) => {
                try {
                    const message = JSON.parse(serializedMessage);
                    console.log(`Received from pattern "${pattern}" on channel "${channel}":`.cyan, message);
                    callback(message, channel);
                } catch (error) {
                    console.error(`Failed to parse message from pattern "${pattern}":`.red, error);
                }
            });
            console.log(`Pattern subscribed: ${pattern}`.green);
        } catch (error) {
            console.error(`Failed to pattern subscribe "${pattern}":`.red, error);
            throw error;
        }
    }

    /**
     * Unsubscribe from pattern
     * @param pattern - Pattern to unsubscribe from
     */
    public async pUnsubscribe(pattern: string): Promise<void> {
        try {
            if (!this.isConnected)
                throw new Error('Redis is not connected. Call connect() first.');
            await this.subscriber.pUnsubscribe(pattern);
            console.log(`Pattern unsubscribed: ${pattern}`.yellow);
        } catch (error) {
            console.error(`Failed to pattern unsubscribe "${pattern}":`.red, error);
            throw error;
        }
    }

    /**
     * Get Redis configuration for Bull Queue
     * @returns Configuration object for Bull
     */
    public getConfig(): { host: string; port: number; password?: string } {
        return {
            host: this.host,
            port: this.port,
            password: this.password,
        };
    }

    /**
     * Get Redis connection string for Bull
     * @returns Redis connection string
     */
    public getConnectionString(): string {
        if (this.password)
            return `redis://:${this.password}@${this.host}:${this.port}`;
        return `redis://${this.host}:${this.port}`;
    }

    /**
     * Test Redis connection
     */
    public async ping(): Promise<boolean> {
        try {
            const result = await this.client.ping();

            return result === 'PONG';
        } catch (error) {
            console.error('Redis ping failed:'.red, error);
            return false;
        }
    }

    /**
     * Get Redis info
     */
    public async getInfo(): Promise<any> {
        try {
            const info = await this.client.info();

            return info;
        } catch (error) {
            console.error('Failed to get Redis info:'.red, error);
            return null;
        }
    }
}

export default RedisManager;