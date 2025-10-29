import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { RedditModule } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger that fires when a user saves a new post
 * Uses polling to check for newly saved posts
 */
export class OnNewSavedPostTrigger extends BaseTrigger {
    private redditModule: RedditModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownPostIds: Map<string, Set<string>> = new Map();

    constructor(redditModule: RedditModule) {
        super();
        this.redditModule = redditModule;
    }

    getName(): string {
        return 'on_new_saved_post';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when you save a new post on Reddit';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                pollingInterval: { 
                    type: 'number', 
                    default: 120000, 
                    minimum: 60000,
                    description: 'Polling interval in milliseconds (minimum 60 seconds)' 
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Post ID' },
                title: { type: 'string', description: 'Post title' },
                author: { type: 'string', description: 'Author username' },
                subreddit: { type: 'string', description: 'Subreddit name' },
                selftext: { type: 'string', description: 'Post text content (for text posts)' },
                url: { type: 'string', description: 'Post URL' },
                permalink: { type: 'string', description: 'Reddit permalink' },
                score: { type: 'number', description: 'Post score' },
                numComments: { type: 'number', description: 'Number of comments' },
                created: { type: 'string', description: 'Creation timestamp' },
                fullname: { type: 'string', description: 'Full Reddit ID (t3_xxx)' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (config.pollingInterval && config.pollingInterval < 60000) {
            throw new Error('Polling interval must be at least 60 seconds (60000ms)');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnNewSavedPost] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnNewSavedPost] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(config);
        this.isRunning = true;

        // Initialize with current saved posts
        await this.initializeKnownPosts(areaId);

        const pollingInterval = config.pollingInterval || 120000;

        const interval = setInterval(async () => {
            await this.checkForNewSavedPosts(areaId);
        }, pollingInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnNewSavedPost] Trigger started with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnNewSavedPost] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownPostIds.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnNewSavedPost] Trigger stopped for AREA ${areaId}`.green);
    }

    private async initializeKnownPosts(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnNewSavedPost] AREA ${areaId} not found`.red);
                return;
            }

            const redditAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'reddit');
            if (!redditAuth || !redditAuth.access_token) {
                console.error(`[OnNewSavedPost] No Reddit authentication found for user ${area.user_id}`.red);
                return;
            }

            console.log(`[OnNewSavedPost] Initializing known posts for AREA ${areaId}`.gray);
            const accessToken = redditAuth.access_token;
            const apiService = this.redditModule.getApiService();

            const savedPosts = await apiService.getSavedPosts(accessToken, 25);
            const postIds = new Set(savedPosts.map(post => post.id));

            this.lastKnownPostIds.set(areaId, postIds);
            console.log(`[OnNewSavedPost] ✓ Initialized with ${postIds.size} existing saved posts`.green);
        } catch (error: any) {
            console.error(`[OnNewSavedPost] ❌ Error initializing known posts:`.red, error.message);
            
            // Initialize with empty set so polling can continue
            // (user might fix auth or API issues later)
            this.lastKnownPostIds.set(areaId, new Set());
            console.log(`[OnNewSavedPost] Initialized with empty set, will retry on next poll`.yellow);
            
            // Re-throw to let the caller know initialization failed
            throw error;
        }
    }

    private async checkForNewSavedPosts(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnNewSavedPost] AREA ${areaId} not found`.red);
                return;
            }

            const redditAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'reddit');
            if (!redditAuth || !redditAuth.access_token) {
                console.error(`[OnNewSavedPost] Reddit not connected for user ${area.user_id}`.red);
                return;
            }

            const accessToken = redditAuth.access_token;
            const apiService = this.redditModule.getApiService();

            console.log(`[OnNewSavedPost] Checking for newly saved posts`.gray);

            const currentSavedPosts = await apiService.getSavedPosts(accessToken, 25);
            const currentPostIds = new Set(currentSavedPosts.map(post => post.id));
            const lastKnownIds = this.lastKnownPostIds.get(areaId) || new Set<string>();

            const newPosts = currentSavedPosts.filter(post => !lastKnownIds.has(post.id));

            for (const post of newPosts) {
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        id: post.id,
                        title: post.title,
                        author: post.author,
                        subreddit: post.subreddit,
                        selftext: post.selftext || '',
                        url: post.url,
                        permalink: `https://reddit.com${post.permalink}`,
                        score: post.score,
                        numComments: post.num_comments,
                        created: new Date(post.created_utc * 1000).toISOString(),
                        fullname: `t3_${post.id}`
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnNewSavedPost] New saved post: ${post.title}`.green);
            }

            this.lastKnownPostIds.set(areaId, currentPostIds);
        } catch (error) {
            console.error(`[OnNewSavedPost] Error checking for saved posts:`.red, error);
        }
    }
}
