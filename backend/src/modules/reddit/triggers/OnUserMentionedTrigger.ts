import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { RedditModule } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger configuration for monitoring user mentions
 */
interface OnUserMentionedConfig extends TriggerConfig {
    pollingInterval?: number;
}

/**
 * Trigger that fires when the user is mentioned (u/username) in a comment or post
 * Uses polling to check for new mentions
 */
export class OnUserMentionedTrigger extends BaseTrigger {
    private redditModule: RedditModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownMentionIds: Map<string, Set<string>> = new Map();

    constructor(redditModule: RedditModule) {
        super();
        this.redditModule = redditModule;
    }

    getName(): string {
        return 'on_user_mentioned';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when you are mentioned in a comment or post (u/username)';
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
                id: { type: 'string', description: 'Mention ID' },
                author: { type: 'string', description: 'Author who mentioned you' },
                subreddit: { type: 'string', description: 'Subreddit where mention occurred' },
                body: { type: 'string', description: 'Comment/post body containing mention' },
                context: { type: 'string', description: 'Context/permalink to the mention' },
                postTitle: { type: 'string', description: 'Title of the post (if available)' },
                timestamp: { type: 'string', description: 'Mention timestamp (ISO 8601)' },
                fullname: { type: 'string', description: 'Full Reddit ID' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const cfg = config as OnUserMentionedConfig;
        if (cfg.pollingInterval && cfg.pollingInterval < 60000) {
            throw new Error('Polling interval must be at least 60 seconds (60000ms)');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as OnUserMentionedConfig;
        console.log(`[OnUserMentioned] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnUserMentioned] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(cfg);
        this.isRunning = true;

        // Initialize with current mentions to avoid triggering on existing ones
        await this.initializeKnownMentions(areaId);

        const pollingInterval = cfg.pollingInterval || 120000;

        const interval = setInterval(async () => {
            await this.checkForMentions(areaId);
        }, pollingInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnUserMentioned] Trigger started with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnUserMentioned] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownMentionIds.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnUserMentioned] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialize the set of currently existing mentions to avoid triggering on them
     */
    private async initializeKnownMentions(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const redditAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'reddit');
            if (!redditAuth || !redditAuth.access_token) return;

            const accessToken = redditAuth.access_token;
            const apiService = this.redditModule.getApiService();

            // Get current mentions
            const mentions = await apiService.getMentions(accessToken, 25);
            const mentionIds = new Set(mentions.map(mention => mention.id));

            this.lastKnownMentionIds.set(areaId, mentionIds);
            console.log(`[OnUserMentioned] Initialized with ${mentionIds.size} existing mentions`.gray);
        } catch (error) {
            console.error(`[OnUserMentioned] Error initializing known mentions:`.red, error);
        }
    }

    /**
     * Check for new user mentions
     */
    private async checkForMentions(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnUserMentioned] AREA ${areaId} not found`.red);
                return;
            }

            const redditAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'reddit');
            if (!redditAuth || !redditAuth.access_token) {
                console.error(`[OnUserMentioned] Reddit not connected for user ${area.user_id}`.red);
                return;
            }

            const accessToken = redditAuth.access_token;
            const apiService = this.redditModule.getApiService();

            console.log(`[OnUserMentioned] Checking for new mentions`.gray);

            // Get current mentions
            const currentMentions = await apiService.getMentions(accessToken, 25);
            const currentMentionIds = new Set(currentMentions.map(mention => mention.id));
            const lastKnownIds = this.lastKnownMentionIds.get(areaId) || new Set<string>();

            // Find new mentions (in current but not in last known)
            const newMentions = currentMentions.filter(mention => !lastKnownIds.has(mention.id));

            // Emit trigger for each new mention
            for (const mention of newMentions) {
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        id: mention.id,
                        author: mention.author || 'unknown',
                        subreddit: mention.subreddit || '',
                        body: mention.body || '',
                        context: mention.context || '',
                        postTitle: mention.link_title || '',
                        timestamp: new Date(mention.created_utc * 1000).toISOString(),
                        fullname: mention.name || `t1_${mention.id}`
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnUserMentioned] New mention from u/${mention.author} in r/${mention.subreddit}`.green);
            }

            // Update last known mention IDs
            this.lastKnownMentionIds.set(areaId, currentMentionIds);
        } catch (error) {
            console.error(`[OnUserMentioned] Error checking for mentions:`.red, error);
        }
    }
}
