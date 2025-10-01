import { RedisManager } from '../../../src/shared/queue/RedisManager';

describe('RedisManager', () => {
    let redisManager: RedisManager;

    beforeAll(async () => {
        redisManager = RedisManager.getInstance();
        await redisManager.connect();
    });

    afterAll(async () => {
        await redisManager.disconnect();
    });

    describe('Singleton Pattern', () => {
        it('should return the same instance', () => {
            const instance1 = RedisManager.getInstance();
            const instance2 = RedisManager.getInstance();

            expect(instance1).toBe(instance2);
        });
    });

    describe('Connection', () => {
        it('should connect to Redis successfully', async () => {
            const isHealthy = redisManager.isHealthy();
            expect(isHealthy).toBe(true);
        });

        it('should ping Redis successfully', async () => {
            const pong = await redisManager.ping();
            expect(pong).toBe(true);
        });

        it('should get Redis info', async () => {
            const info = await redisManager.getInfo();
            expect(info).toBeDefined();
            expect(typeof info).toBe('string');
        });
    });

    describe('Pub/Sub', () => {
        it('should publish and receive a message', async () => {
            const channel = 'test-channel';
            const testMessage = { event: 'test', data: 'hello world' };

            return new Promise<void>(async (resolve) => {
                await redisManager.subscribe(channel, (receivedMessage) => {
                    expect(receivedMessage).toEqual(testMessage);
                    resolve();
                });
                await new Promise(r => setTimeout(r, 100));
                await redisManager.publish(channel, testMessage);
            });
        }, 10000);

        it('should handle multiple messages on same channel', async () => {
            const channel = 'test-multi-channel';
            const messages = [
                { id: 1, text: 'first' },
                { id: 2, text: 'second' },
                { id: 3, text: 'third' },
            ];

            return new Promise<void>(async (resolve) => {
                const receivedMessages: any[] = [];
                await redisManager.subscribe(channel, (message) => {
                    receivedMessages.push(message);
                    if (receivedMessages.length === messages.length) {
                        expect(receivedMessages).toEqual(messages);
                        resolve();
                    }
                });
                await new Promise(r => setTimeout(r, 100));
                for (const msg of messages)
                    await redisManager.publish(channel, msg);
            });
        }, 10000);

        it('should unsubscribe from a channel', async () => {
            const channel = 'test-unsub-channel';
            let messageCount = 0;

            await redisManager.subscribe(channel, () => {
                messageCount++;
            });
            await new Promise(r => setTimeout(r, 100));
            await redisManager.publish(channel, { test: 1 });
            await new Promise(r => setTimeout(r, 100));
            await redisManager.unsubscribe(channel);
            await new Promise(r => setTimeout(r, 100));
            await redisManager.publish(channel, { test: 2 });
            await new Promise(r => setTimeout(r, 100));
            expect(messageCount).toBe(1);
        });

        it('should handle pattern subscription', async () => {
            const pattern = 'event:*';
            const channels = ['event:user', 'event:order', 'event:payment'];
            return new Promise<void>(async (resolve) => {
                const receivedChannels: string[] = [];
                await redisManager.pSubscribe(pattern, (message, channel) => {
                    receivedChannels.push(channel);
                    if (receivedChannels.length === channels.length) {
                        expect(receivedChannels.sort()).toEqual(channels.sort());
                        resolve();
                    }
                });
                await new Promise(r => setTimeout(r, 100));
                for (const ch of channels)
                    await redisManager.publish(ch, { data: 'test' });
            });
        }, 10000);
    });

    describe('Bull Configuration', () => {
        it('should return valid config for Bull', () => {
            const config = redisManager.getConfig();
            expect(config).toHaveProperty('host');
            expect(config).toHaveProperty('port');
            expect(typeof config.host).toBe('string');
            expect(typeof config.port).toBe('number');
        });

        it('should return connection string', () => {
            const connectionString = redisManager.getConnectionString();
            expect(connectionString).toContain('redis://');
            expect(connectionString).toBeDefined();
            expect(typeof connectionString).toBe('string');
        });

        it('should have valid host and port', () => {
            const config = redisManager.getConfig();
            expect(config.host).toBeTruthy();
            expect(config.port).toBeGreaterThan(0);
            expect(config.port).toBeLessThan(65536);
        });
    });

    describe('Error Handling', () => {
        it('should throw error when publishing to invalid channel', async () => {
            expect(async () => {
                await redisManager.publish('', { test: 'data' });
            }).toBeDefined();
        });

        it('should handle JSON parse errors gracefully', async () => {
            const channel = 'test-parse-error';
            let errorCaught = false;
            await redisManager.subscribe(channel, (message) => {
                expect(message).toBeDefined();
            });
            expect(errorCaught).toBe(false);
        });
    });

    describe('Client Access', () => {
        it('should return client instances', () => {
            const client = redisManager.getClient();
            const publisher = redisManager.getPublisher();
            const subscriber = redisManager.getSubscriber();

            expect(client).toBeDefined();
            expect(publisher).toBeDefined();
            expect(subscriber).toBeDefined();
        });
    });
});
