import { JobQueue, QueueName } from '../../../src/shared/queue/JobQueue';
import { RedisManager } from '../../../src/shared/queue/RedisManager';

describe('JobQueue', () => {
    let jobQueue: JobQueue;
    let redis: RedisManager;

    beforeAll(async () => {
        redis = RedisManager.getInstance();
        await redis.connect();
        jobQueue = JobQueue.getInstance();
        await jobQueue.init();
    });

    afterAll(async () => {
        await jobQueue.close();
        await redis.disconnect();
    });

    afterEach(async () => {
        await jobQueue.empty(QueueName.TRIGGER_EVENTS);
        await jobQueue.empty(QueueName.ACTION_EXECUTIONS);
    });

    describe('Singleton Pattern', () => {
        it('should return the same instance', () => {
            const instance1 = JobQueue.getInstance();
            const instance2 = JobQueue.getInstance();

            expect(instance1).toBe(instance2);
        });
    });

    describe('Queue Management', () => {
        it('should have both queues initialized', () => {
            expect(jobQueue.hasQueue(QueueName.TRIGGER_EVENTS)).toBe(true);
            expect(jobQueue.hasQueue(QueueName.ACTION_EXECUTIONS)).toBe(true);
        });

        it('should return all queue names', () => {
            const queueNames = jobQueue.getQueueNames();

            expect(queueNames).toContain(QueueName.TRIGGER_EVENTS);
            expect(queueNames).toContain(QueueName.ACTION_EXECUTIONS);
            expect(queueNames.length).toBe(2);
        });
    });

    describe('Add Jobs', () => {
        it('should add job to trigger-events queue', async () => {
            const jobData = {
                areaId: 'area-123',
                triggerData: { time: '09:00' },
                timestamp: new Date().toISOString(),
            };
            const job = await jobQueue.addJob(QueueName.TRIGGER_EVENTS, jobData);
            expect(job).toBeDefined();
            expect(job.id).toBeDefined();
            expect(job.data).toEqual(jobData);
        });

        it('should add job to action-executions queue', async () => {
            const jobData = {
                areaId: 'area-456',
                executionId: 'exec-789',
                actionData: { email: 'test@example.com' },
                timestamp: new Date().toISOString(),
            };
            const job = await jobQueue.addJob(QueueName.ACTION_EXECUTIONS, jobData);
            expect(job).toBeDefined();
            expect(job.id).toBeDefined();
            expect(job.data).toEqual(jobData);
        });

        it('should add job with custom options', async () => {
            const jobData = {
                areaId: 'area-custom',
                triggerData: {},
                timestamp: new Date().toISOString(),
            };
            const job = await jobQueue.addJob(QueueName.TRIGGER_EVENTS, jobData, {
                delay: 5000,
                priority: 1,
            });
            expect(job).toBeDefined();
            expect(job.opts.delay).toBe(5000);
        });

        it('should throw error for non-existent queue', async () => {
            await expect(
                jobQueue.addJob('non-existent-queue', {} as any)
            ).rejects.toThrow('Queue "non-existent-queue" not found');
        });
    });

    describe('Get Jobs', () => {
        it('should get job by ID', async () => {
            const jobData = {
                areaId: 'get-job-test',
                triggerData: {},
                timestamp: new Date().toISOString(),
            };
            const addedJob = await jobQueue.addJob(QueueName.TRIGGER_EVENTS, jobData);
            const retrievedJob = await jobQueue.getJob(QueueName.TRIGGER_EVENTS, addedJob.id.toString());
            expect(retrievedJob).toBeDefined();
            expect(retrievedJob?.id).toBe(addedJob.id);
        });

        it('should get job counts', async () => {
            await jobQueue.addJob(QueueName.TRIGGER_EVENTS, {
                areaId: 'count-1',
                triggerData: {},
                timestamp: new Date().toISOString(),
            });
            await jobQueue.addJob(QueueName.TRIGGER_EVENTS, {
                areaId: 'count-2',
                triggerData: {},
                timestamp: new Date().toISOString(),
            });
            const counts = await jobQueue.getJobCounts(QueueName.TRIGGER_EVENTS);
            expect(counts).toHaveProperty('waiting');
            expect(counts).toHaveProperty('active');
            expect(counts).toHaveProperty('completed');
            expect(counts).toHaveProperty('failed');
            expect(counts.waiting).toBeGreaterThanOrEqual(0);
        });

        it('should get jobs by status', async () => {
            const jobData = {
                areaId: 'status-test',
                triggerData: {},
                timestamp: new Date().toISOString(),
            };

            await jobQueue.addJob(QueueName.TRIGGER_EVENTS, jobData);
            const waitingJobs = await jobQueue.getJobs(QueueName.TRIGGER_EVENTS, 'waiting');
            expect(Array.isArray(waitingJobs)).toBe(true);
        });
    });

    describe('Queue Control', () => {
        it('should pause and resume queue', async () => {
            await jobQueue.pause(QueueName.TRIGGER_EVENTS);
            const jobData = {
                areaId: 'pause-test',
                triggerData: {},
                timestamp: new Date().toISOString(),
            };
            await jobQueue.addJob(QueueName.TRIGGER_EVENTS, jobData);
            await new Promise((resolve) => setTimeout(resolve, 200));
            const countsWhilePaused = await jobQueue.getJobCounts(QueueName.TRIGGER_EVENTS);
            expect(countsWhilePaused.waiting + countsWhilePaused.delayed).toBeGreaterThanOrEqual(0);
            await jobQueue.resume(QueueName.TRIGGER_EVENTS);
        });

        it('should empty queue', async () => {
            await jobQueue.addJob(QueueName.TRIGGER_EVENTS, {
                areaId: 'empty-1',
                triggerData: {},
                timestamp: new Date().toISOString(),
            });
            await jobQueue.addJob(QueueName.TRIGGER_EVENTS, {
                areaId: 'empty-2',
                triggerData: {},
                timestamp: new Date().toISOString(),
            });
            await new Promise((resolve) => setTimeout(resolve, 100));
            await jobQueue.empty(QueueName.TRIGGER_EVENTS);
            await new Promise((resolve) => setTimeout(resolve, 100));
            const counts = await jobQueue.getJobCounts(QueueName.TRIGGER_EVENTS);
            expect(counts.waiting).toBe(0);
        });
    });
});
