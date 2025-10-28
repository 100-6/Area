import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { RedditModule } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger configuration for monitoring keywords in a subreddit
 */
interface OnKeywordInSubredditConfig extends TriggerConfig {
    subreddit: string;
    keywords: string[];
    matchTitle?: boolean;
    matchBody?: boolean;
    pollingInterval?: number;
}

/**
 * Trigger that fires when a keyword appears in new posts in a subreddit
 * Monitors both titles and body content for specified keywords
 */
export class OnKeywordInSubredditTrigger extends BaseTrigger {
    private redditModule: RedditModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownPostIds: Map<string, Set<string>> = new Map();

    constructor(redditModule: RedditModule) {
        super();
        this.redditModule = redditModule;
    }

    getName(): string {
        return 'on_keyword_in_subreddit';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a keyword appears in new posts in a subreddit';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['subreddit', 'keywords'],
            properties: {
                subreddit: {
                    type: 'string',
                    title: 'Subreddit',
                    description: 'Name of the subreddit to monitor (without r/)',
                    example: 'javascript'
                },
                keywords: {
                    type: 'array',
                    title: 'Keywords',
                    description: 'List of keywords to watch for (case-insensitive)',
                    items: {
                        type: 'string'
                    },
                    minItems: 1,
                    example: ['react', 'vue', 'angular']
                },
                matchTitle: {
                    type: 'boolean',
                    title: 'Match in Title',
                    description: 'Search for keywords in post titles',
                    default: true
                },
                matchBody: {
                    type: 'boolean',
                    title: 'Match in Body',
                    description: 'Search for keywords in post body/content',
                    default: true
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
                selftext: { type: 'string', description: 'Post text content' },
                url: { type: 'string', description: 'Post URL' },
                permalink: { type: 'string', description: 'Reddit permalink' },
                score: { type: 'number', description: 'Post score' },
                numComments: { type: 'number', description: 'Number of comments' },
                created: { type: 'string', description: 'Creation timestamp' },
                fullname: { type: 'string', description: 'Full Reddit ID (t3_xxx)' },
                matchedKeyword: { type: 'string', description: 'The keyword that triggered this match' },
                matchedIn: { type: 'string', description: 'Where the keyword was found (title, body, or both)' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const cfg = config as OnKeywordInSubredditConfig;
        if (!cfg.subreddit) {
            throw new Error('subreddit is required');
        }
        if (!cfg.keywords || !Array.isArray(cfg.keywords) || cfg.keywords.length === 0) {
            throw new Error('keywords must be a non-empty array');
        }
        if (cfg.pollingInterval && cfg.pollingInterval < 60000) {
            throw new Error('Polling interval must be at least 60 seconds (60000ms)');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as OnKeywordInSubredditConfig;
        console.log(`[OnKeywordInSubreddit] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnKeywordInSubreddit] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(cfg);
        this.isRunning = true;

        // Initialize with current posts to avoid triggering on existing posts
        await this.initializeKnownPosts(areaId, cfg.subreddit);

        const pollingInterval = cfg.pollingInterval || 120000;

        const interval = setInterval(async () => {
            await this.checkForKeywords(areaId, cfg);
        }, pollingInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnKeywordInSubreddit] Trigger started for r/${cfg.subreddit} watching keywords: ${cfg.keywords.join(', ')}`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnKeywordInSubreddit] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownPostIds.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnKeywordInSubreddit] Trigger stopped for AREA ${areaId}`.green);
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
            console.log(`[OnKeywordInSubreddit] Initialized with ${postIds.size} existing posts`.gray);
        } catch (error) {
            console.error(`[OnKeywordInSubreddit] Error initializing known posts:`.red, error);
        }
    }

    /**
     * Check for new posts containing keywords
     */
    private async checkForKeywords(areaId: string, cfg: OnKeywordInSubredditConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnKeywordInSubreddit] AREA ${areaId} not found`.red);
                return;
            }

            const redditAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'reddit');
            if (!redditAuth || !redditAuth.access_token) {
                console.error(`[OnKeywordInSubreddit] Reddit not connected for user ${area.user_id}`.red);
                return;
            }

            const accessToken = redditAuth.access_token;
            const apiService = this.redditModule.getApiService();

            console.log(`[OnKeywordInSubreddit] Checking for keywords in r/${cfg.subreddit}`.gray);

            // Get current posts
            const currentPosts = await apiService.getSubredditPosts(cfg.subreddit, accessToken, 'new', 25);
            const currentPostIds = new Set(currentPosts.map(post => post.id));
            const lastKnownIds = this.lastKnownPostIds.get(areaId) || new Set<string>();

            // Find new posts (in current but not in last known)
            const newPosts = currentPosts.filter(post => !lastKnownIds.has(post.id));

            // Check each new post for keywords
            for (const post of newPosts) {
                const matchResult = this.checkPostForKeywords(post, cfg.keywords, cfg.matchTitle !== false, cfg.matchBody !== false);
                
                if (matchResult.matched) {
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
                            fullname: `t3_${post.id}`,
                            matchedKeyword: matchResult.keyword,
                            matchedIn: matchResult.location
                        }
                    };

                    await this.emitTrigger(payload);
                    console.log(`[OnKeywordInSubreddit] Keyword "${matchResult.keyword}" found in r/${cfg.subreddit}: ${post.title}`.green);
                }
            }

            // Update last known post IDs
            this.lastKnownPostIds.set(areaId, currentPostIds);
        } catch (error) {
            console.error(`[OnKeywordInSubreddit] Error checking for keywords:`.red, error);
        }
    }

    /**
     * Check if a post contains any of the keywords
     * @returns Match result with keyword and location
     */
    private checkPostForKeywords(
        post: any, 
        keywords: string[], 
        matchTitle: boolean, 
        matchBody: boolean
    ): { matched: boolean; keyword?: string; location?: string } {
        const title = (post.title || '').toLowerCase();
        const body = (post.selftext || '').toLowerCase();

        for (const keyword of keywords) {
            const keywordLower = keyword.toLowerCase();
            const titleMatch = matchTitle && title.includes(keywordLower);
            const bodyMatch = matchBody && body.includes(keywordLower);

            if (titleMatch || bodyMatch) {
                let location = '';
                if (titleMatch && bodyMatch) {
                    location = 'title and body';
                } else if (titleMatch) {
                    location = 'title';
                } else {
                    location = 'body';
                }

                return { matched: true, keyword, location };
            }
        }

        return { matched: false };
    }
}
