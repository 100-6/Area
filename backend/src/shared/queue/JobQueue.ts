import Bull, { Queue, Job, JobOptions } from 'bull';
import { RedisManager } from './RedisManager';
import 'colors';

/**
 * Queue names
 */
export enum QueueName {
    TRIGGER_EVENTS = 'trigger-events',
    ACTION_EXECUTIONS = 'action-executions',
}

/**
 * Job data interfaces
 */
export interface TriggerEventJob {
    areaId: string;
    triggerData: any;
    timestamp: string;
}

export interface ActionExecutionJob {
    areaId: string;
    executionId: string;
    actionData: any;
    timestamp: string;
}

export type JobData = TriggerEventJob | ActionExecutionJob;

/**
 * JobQueue - Bull queue manager
 */
export class JobQueue {
    private static instance: JobQueue;
    private queues: Map<string, Queue>;
    private redis: RedisManager;

    private constructor() {
        this.queues = new Map();
        this.redis = RedisManager.getInstance();
    }

    /**
     * Get JobQueue singleton instance
     */
    public static getInstance(): JobQueue {
        if (!JobQueue.instance)
            JobQueue.instance = new JobQueue();
        return JobQueue.instance;
    }

    /**
     * Initialize queues
     */
    public async init(): Promise<void> {
        try {
            const redisConfig = this.redis.getConfig();
            const triggerQueue = new Bull(QueueName.TRIGGER_EVENTS, {
                redis: redisConfig,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 60000,
                    },
                    removeOnComplete: 100,
                    removeOnFail: 500,
                },
            });
            const actionQueue = new Bull(QueueName.ACTION_EXECUTIONS, {
                redis: redisConfig,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 60000,
                    },
                    removeOnComplete: 100,
                    removeOnFail: 500,
                },
            });
            this.queues.set(QueueName.TRIGGER_EVENTS, triggerQueue);
            this.queues.set(QueueName.ACTION_EXECUTIONS, actionQueue);
            this.setupEventListeners(triggerQueue, QueueName.TRIGGER_EVENTS);
            this.setupEventListeners(actionQueue, QueueName.ACTION_EXECUTIONS);
            console.log('JobQueue initialized with queues:'.green.bold);
            console.log(`   - ${QueueName.TRIGGER_EVENTS}`.cyan);
            console.log(`   - ${QueueName.ACTION_EXECUTIONS}`.cyan);
        } catch (error) {
            console.error('Failed to initialize JobQueue:'.red, error);
            throw error;
        }
    }

    /**
     * Setup event listeners for a queue
     */
    private setupEventListeners(queue: Queue, name: string): void {
        queue.on('completed', (job: Job) => {
            console.log(`Job completed in ${name}:`.green, job.id);
        });
        queue.on('failed', (job: Job, err: Error) => {
            console.error(`Job failed in ${name}:`.red, job.id, err.message);
        });
        queue.on('stalled', (job: Job) => {
            console.warn(`Job stalled in ${name}:`.yellow, job.id);
        });
        queue.on('error', (error: Error) => {
            console.error(`Queue error in ${name}:`.red, error);
        });
    }

    /**
     * Add a job to a queue
     */
    public async addJob(queueName: QueueName | string, data: JobData, options?: JobOptions): Promise<Job> {
        const queue = this.getQueue(queueName);

        if (!queue)
            throw new Error(`Queue "${queueName}" not found`);
        try {
            const job = await queue.add(data, options);
            console.log(`Job added to ${queueName}:`.cyan, job.id);
            return job;
        } catch (error) {
            console.error(`Failed to add job to ${queueName}:`.red, error);
            throw error;
        }
    }

    /**
     * Process jobs from a queue
     */
    public async process(queueName: QueueName | string, handler: (job: Job<JobData>) => Promise<any>): Promise<void> {
        const queue = this.getQueue(queueName);

        if (!queue)
            throw new Error(`Queue "${queueName}" not found`);
        queue.process(async (job: Job<JobData>) => {
            console.log(`Processing job in ${queueName}:`.cyan, job.id);
            try {
                const result = await handler(job);
                console.log(`Job processed successfully:`.green, job.id);
                return result;
            } catch (error) {
                console.error(`Job processing failed:`.red, job.id, error);
                throw error;
            }
        });
        console.log(`Started processing queue: ${queueName}`.green);
    }

    /**
     * Get a job by ID
     */
    public async getJob(queueName: QueueName | string, jobId: string): Promise<Job | null> {
        const queue = this.getQueue(queueName);

        if (!queue)
            throw new Error(`Queue "${queueName}" not found`);
        return await queue.getJob(jobId);
    }

    /**
     * Get job counts
     */
    public async getJobCounts(queueName: QueueName | string): Promise<{waiting: number; active: number; completed: number; failed: number; delayed: number;}> {
        const queue = this.getQueue(queueName);

        if (!queue)
            throw new Error(`Queue "${queueName}" not found`);
        return await queue.getJobCounts();
    }

    /**
     * Get all jobs by status
     */
    public async getJobs(queueName: QueueName | string, status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed', start = 0, end = 10): Promise<Job[]> {
        const queue = this.getQueue(queueName);

        if (!queue)
            throw new Error(`Queue "${queueName}" not found`);
        return await queue.getJobs([status], start, end);
    }

    /**
     * Clean old jobs
     */
    public async clean(queueName: QueueName | string,grace: number, status: 'completed' | 'failed' = 'completed'): Promise<Job[]> {
        const queue = this.getQueue(queueName);

        if (!queue)
            throw new Error(`Queue "${queueName}" not found`);
        return await queue.clean(grace, status);
    }

    /**
     * Pause a queue
     */
    public async pause(queueName: QueueName | string): Promise<void> {
        const queue = this.getQueue(queueName);

        if (!queue)
            throw new Error(`Queue "${queueName}" not found`);
        await queue.pause();
        console.log(`Queue paused: ${queueName}`.yellow);
    }

    /**
     * Resume a queue
     */
    public async resume(queueName: QueueName | string): Promise<void> {
        const queue = this.getQueue(queueName);

        if (!queue) {
            throw new Error(`Queue "${queueName}" not found`);
        }

        await queue.resume();
        console.log(`▶Queue resumed: ${queueName}`.green);
    }

    /**
     * Empty a queue (remove all jobs)
     */
    public async empty(queueName: QueueName | string): Promise<void> {
        const queue = this.getQueue(queueName);

        if (!queue)
            throw new Error(`Queue "${queueName}" not found`);
        await queue.empty();
        console.log(`Queue emptied: ${queueName}`.yellow);
    }

    /**
     * Close all queues
     */
    public async close(): Promise<void> {
        const closePromises = Array.from(this.queues.values()).map((queue) => queue.close());

        await Promise.all(closePromises);
        this.queues.clear();
        console.log('JobQueue closed'.yellow);
    }

    /**
     * Get queue instance
     */
    private getQueue(queueName: string): Queue | undefined {
        return this.queues.get(queueName);
    }

    /**
     * Get all queue names
     */
    public getQueueNames(): string[] {
        return Array.from(this.queues.keys());
    }

    /**
     * Check if queue exists
     */
    public hasQueue(queueName: string): boolean {
        return this.queues.has(queueName);
    }
}

export default JobQueue.getInstance();
