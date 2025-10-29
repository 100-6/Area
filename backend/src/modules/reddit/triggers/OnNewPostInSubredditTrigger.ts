import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { RedditModule } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger configuration for monitoring subreddit posts
 */
interface OnNewPostInSubredditConfig extends TriggerConfig {
    subreddit: string;
    pollingInterval?: number;
}

/**
 * Trigger that fires when a new post appears in a subreddit
 * Uses polling to check for new posts
 */
export class OnNewPostInSubredditTrigger extends BaseTrigger {
    private redditModule: RedditModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownPostIds: Map<string, Set<string>> = new Map();

    constructor(redditModule: RedditModule) {
        super();
        this.redditModule = redditModule;
    }

    getName(): string {
        return 'on_new_post_in_subreddit';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a new post is submitted to a subreddit';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['subreddit'],
            properties: {
                subreddit: {
                    type: 'string',
                    title: 'Subreddit',
                    description: 'Name of the subreddit to monitor (without r/)',
                    example: 'javascript'
                },
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
                score: { type: 'number', description: 'Post score (upvotes - downvotes)' },
                numComments: { type: 'number', description: 'Number of comments' },
                created: { type: 'string', description: 'Creation timestamp' },
                fullname: { type: 'string', description: 'Full Reddit ID (t3_xxx)' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const cfg = config as OnNewPostInSubredditConfig;
        if (!cfg.subreddit) {
            throw new Error('subreddit is required');
        }
        if (cfg.pollingInterval && cfg.pollingInterval < 60000) {
            throw new Error('Polling interval must be at least 60 seconds (60000ms)');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as OnNewPostInSubredditConfig;
        console.log(`[OnNewPostInSubreddit] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnNewPostInSubreddit] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(cfg);
        this.isRunning = true;

        // Initialize with current posts to avoid triggering on existing posts
        await this.initializeKnownPosts(areaId, cfg.subreddit);

        const pollingInterval = cfg.pollingInterval || 120000;

        const interval = setInterval(async () => {
            await this.checkForNewPosts(areaId, cfg.subreddit);
        }, pollingInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnNewPostInSubreddit] Trigger started for r/${cfg.subreddit} with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnNewPostInSubreddit] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownPostIds.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnNewPostInSubreddit] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialize the set of currently existing posts to avoid triggering on them
     */
    private async initializeKnownPosts(areaId: string, subreddit: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const redditAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'reddit');
            if (!redditAuth || !redditAuth.access_token) return;

            const accessToken = redditAuth.access_token;
            const apiService = this.redditModule.getApiService();

            // Get current posts
            const posts = await apiService.getSubredditPosts(subreddit, accessToken, 'new', 25);
            const postIds = new Set(posts.map(post => post.id));

            this.lastKnownPostIds.set(areaId, postIds);
            console.log(`[OnNewPostInSubreddit] Initialized with ${postIds.size} existing posts`.gray);
        } catch (error) {
            console.error(`[OnNewPostInSubreddit] Error initializing known posts:`.red, error);
        }
    }

    /**
     * Check for new posts in the subreddit
     */
    private async checkForNewPosts(areaId: string, subreddit: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnNewPostInSubreddit] AREA ${areaId} not found`.red);
                return;
            }

            const redditAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'reddit');
            if (!redditAuth || !redditAuth.access_token) {
                console.error(`[OnNewPostInSubreddit] Reddit not connected for user ${area.user_id}`.red);
                return;
            }

            const accessToken = redditAuth.access_token;
            const apiService = this.redditModule.getApiService();

            console.log(`[OnNewPostInSubreddit] Checking for new posts in r/${subreddit}`.gray);

            // Get current posts
            const currentPosts = await apiService.getSubredditPosts(subreddit, accessToken, 'new', 25);
            const currentPostIds = new Set(currentPosts.map(post => post.id));
            const lastKnownIds = this.lastKnownPostIds.get(areaId) || new Set<string>();

            // Find new posts (in current but not in last known)
            const newPosts = currentPosts.filter(post => !lastKnownIds.has(post.id));

            // Emit trigger for each new post
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
                console.log(`[OnNewPostInSubreddit] New post in r/${subreddit}: ${post.title}`.green);
            }

            // Update last known post IDs
            this.lastKnownPostIds.set(areaId, currentPostIds);
        } catch (error) {
            console.error(`[OnNewPostInSubreddit] Error checking for new posts:`.red, error);
        }
    }
}
