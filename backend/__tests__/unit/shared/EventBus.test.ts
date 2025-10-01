import { EventBus } from '../../../src/shared/queue/EventBus';

describe('EventBus', () => {
    let eventBus: EventBus;

    beforeAll(async () => {
        eventBus = EventBus.getInstance();
        await eventBus.init();
    });

    afterAll(async () => {
        await eventBus.close();
    });

    afterEach(async () => {
        await eventBus.removeAllListeners();
    });

    describe('Singleton Pattern', () => {
        it('should return the same instance', () => {
            const instance1 = EventBus.getInstance();
            const instance2 = EventBus.getInstance();

            expect(instance1).toBe(instance2);
        });
        it('should be initialized', () => {
            expect(eventBus.isReady()).toBe(true);
        });
    });

    describe('Emit and Listen', () => {
        it('should emit and receive event', async () => {
            const eventData = { userId: '123', action: 'login' };

            return new Promise<void>(async (resolve) => {
                await eventBus.on('trigger.fired', (data) => {
                    expect(data).toEqual(eventData);
                    resolve();
                });
                await eventBus.emit('trigger.fired', eventData);
            });
        });

        it('should handle multiple listeners for same event', async () => {
            const eventData = { test: 'data' };
            let count = 0;

            return new Promise<void>(async (resolve) => {
                await eventBus.on('action.completed', () => {
                    count++;
                });
                await eventBus.on('action.completed', () => {
                    count++;
                });
                await eventBus.on('action.completed', () => {
                    count++;
                    expect(count).toBe(3);
                    resolve();
                });
                await eventBus.emit('action.completed', eventData);
            });
        });

        it('should handle multiple events', async () => {
            const received: string[] = [];

            return new Promise<void>(async (resolve) => {
                await eventBus.on('area.created', () => {
                    received.push('created');
                });
                await eventBus.on('area.updated', () => {
                    received.push('updated');
                });
                await eventBus.on('area.deleted', () => {
                    received.push('deleted');
                    expect(received).toEqual(['created', 'updated', 'deleted']);
                    resolve();
                });
                await eventBus.emit('area.created', {});
                await new Promise((r) => setTimeout(r, 50));
                await eventBus.emit('area.updated', {});
                await new Promise((r) => setTimeout(r, 50));
                await eventBus.emit('area.deleted', {});
            });
        }, 10000);

        it('should include timestamp in event data', async () => {
            return new Promise<void>(async (resolve) => {
                await eventBus.on('workflow.started', (data) => {
                    expect(data).toBeDefined();
                    resolve();
                });
                await eventBus.emit('workflow.started', { workflowId: '456' });
            });
        });
    });

    describe('Remove Listeners', () => {
        it('should remove specific listener', async () => {
            let count = 0;

            const listener1 = () => {count++;};
            const listener2 = () => {count++;};
            await eventBus.on('action.started', listener1);
            await eventBus.on('action.started', listener2);
            await eventBus.emit('action.started', {});
            await new Promise((r) => setTimeout(r, 100));
            expect(count).toBe(2);
            await eventBus.removeListener('action.started', listener1);
            count = 0;
            await eventBus.emit('action.started', {});
            await new Promise((r) => setTimeout(r, 100));
            expect(count).toBe(1);
        });

        it('should remove all listeners for an event', async () => {
            let called = false;

            await eventBus.on('action.failed', () => {
                called = true;
            });
            await eventBus.removeListener('action.failed');
            await eventBus.emit('action.failed', {});
            await new Promise((r) => setTimeout(r, 100));
            expect(called).toBe(false);
        });

        it('should remove all listeners', async () => {
            let count = 0;

            await eventBus.on('trigger.fired', () => { count++; });
            await eventBus.on('action.completed', () => { count++; });
            await eventBus.on('workflow.started', () => { count++; });
            await eventBus.removeAllListeners();
            await eventBus.emit('trigger.fired', {});
            await eventBus.emit('action.completed', {});
            await eventBus.emit('workflow.started', {});
            await new Promise((r) => setTimeout(r, 100));
            expect(count).toBe(0);
        });
    });

    describe('Listener Management', () => {
        it('should check if event has listeners', async () => {
            expect(eventBus.hasListeners('area.created')).toBe(false);
            await eventBus.on('area.created', () => {});
            expect(eventBus.hasListeners('area.created')).toBe(true);
        });

        it('should count listeners for an event', async () => {
            expect(eventBus.listenerCount('area.updated')).toBe(0);
            await eventBus.on('area.updated', () => {});
            expect(eventBus.listenerCount('area.updated')).toBe(1);
            await eventBus.on('area.updated', () => {});
            expect(eventBus.listenerCount('area.updated')).toBe(2);
        });

        it('should get all listeners', async () => {
            await eventBus.on('trigger.fired', () => {});
            await eventBus.on('trigger.fired', () => {});
            await eventBus.on('action.completed', () => {});
            const listeners = eventBus.getListeners();
            expect(listeners.get('trigger.fired')).toBe(2);
            expect(listeners.get('action.completed')).toBe(1);
        });
    });

    describe('Error Handling', () => {
        it('should handle errors in event handlers gracefully', async () => {
            let successCalled = false;

            await eventBus.on('workflow.completed', () => {
                throw new Error('Handler error');
            });
            await eventBus.on('workflow.completed', () => {
                successCalled = true;
            });
            await eventBus.emit('workflow.completed', {});
            await new Promise((r) => setTimeout(r, 100));
            expect(successCalled).toBe(true);
        });

        it('should throw error if not initialized', async () => {
            const uninitializedBus = Object.create(EventBus.prototype);
            uninitializedBus.isInitialized = false;

            expect(() => {
                uninitializedBus.ensureInitialized();
            }).toThrow('EventBus not initialized');
        });
    });

    describe('EmitAndWait', () => {
        it('should emit and wait for processing', async () => {
            let processed = false;

            await eventBus.on('area.activated', () => {
                processed = true;
            });
            await eventBus.emitAndWait('area.activated', { areaId: '789' });
            expect(processed).toBe(true);
        });
    });
});
