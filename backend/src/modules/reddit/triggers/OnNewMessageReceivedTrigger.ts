import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { RedditModule } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Trigger configuration for monitoring inbox messages
 */
interface OnNewMessageReceivedConfig extends TriggerConfig {
    filterByUser?: string;
    pollingInterval?: number;
}

/**
 * Trigger that fires when a new private message is received
 * Uses polling to check for new messages in the inbox
 */
export class OnNewMessageReceivedTrigger extends BaseTrigger {
    private redditModule: RedditModule;
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastKnownMessageIds: Map<string, Set<string>> = new Map();

    constructor(redditModule: RedditModule) {
        super();
        this.redditModule = redditModule;
    }

    getName(): string {
        return 'on_new_message_received';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a new private message is received in your inbox';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            properties: {
                filterByUser: {
                    type: 'string',
                    title: 'Filter by User',
                    description: 'Optional: Only trigger for messages from a specific user',
                    example: 'username'
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
                id: { type: 'string', description: 'Message ID' },
                sender: { type: 'string', description: 'Sender username' },
                subject: { type: 'string', description: 'Message subject' },
                body: { type: 'string', description: 'Message body' },
                timestamp: { type: 'string', description: 'Message timestamp (ISO 8601)' },
                context: { type: 'string', description: 'Context/permalink if applicable' },
                fullname: { type: 'string', description: 'Full Reddit ID (t4_xxx)' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const cfg = config as OnNewMessageReceivedConfig;
        if (cfg.pollingInterval && cfg.pollingInterval < 60000) {
            throw new Error('Polling interval must be at least 60 seconds (60000ms)');
        }
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as OnNewMessageReceivedConfig;
        console.log(`[OnNewMessageReceived] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnNewMessageReceived] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }

        this.validate(cfg);
        this.isRunning = true;

        // Initialize with current messages to avoid triggering on existing ones
        await this.initializeKnownMessages(areaId);

        const pollingInterval = cfg.pollingInterval || 120000;

        const interval = setInterval(async () => {
            await this.checkForNewMessages(areaId, cfg.filterByUser);
        }, pollingInterval);

        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnNewMessageReceived] Trigger started with polling interval ${pollingInterval}ms`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnNewMessageReceived] Stopping trigger for AREA ${areaId}`.cyan);

        const interval = this.pollingIntervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.lastKnownMessageIds.delete(areaId);
        }

        this.isRunning = false;
        console.log(`[OnNewMessageReceived] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialize the set of currently existing messages to avoid triggering on them
     */
    private async initializeKnownMessages(areaId: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) return;

            const redditAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'reddit');
            if (!redditAuth || !redditAuth.access_token) return;

            const accessToken = redditAuth.access_token;
            const apiService = this.redditModule.getApiService();

            // Get current messages
            const messages = await apiService.getInboxMessages(accessToken, 25);
            const messageIds = new Set(messages.map(msg => msg.id));

            this.lastKnownMessageIds.set(areaId, messageIds);
            console.log(`[OnNewMessageReceived] Initialized with ${messageIds.size} existing messages`.gray);
        } catch (error) {
            console.error(`[OnNewMessageReceived] Error initializing known messages:`.red, error);
        }
    }

    /**
     * Check for new messages in the inbox
     */
    private async checkForNewMessages(areaId: string, filterByUser?: string): Promise<void> {
        try {
            const area = await Area.findById(areaId);
            if (!area) {
                console.error(`[OnNewMessageReceived] AREA ${areaId} not found`.red);
                return;
            }

            const redditAuth = await UserAuthProvider.findByUserAndProvider(area.user_id, 'reddit');
            if (!redditAuth || !redditAuth.access_token) {
                console.error(`[OnNewMessageReceived] Reddit not connected for user ${area.user_id}`.red);
                return;
            }

            const accessToken = redditAuth.access_token;
            const apiService = this.redditModule.getApiService();

            console.log(`[OnNewMessageReceived] Checking for new messages`.gray);

            // Get current messages
            const currentMessages = await apiService.getInboxMessages(accessToken, 25);
            const currentMessageIds = new Set(currentMessages.map(msg => msg.id));
            const lastKnownIds = this.lastKnownMessageIds.get(areaId) || new Set<string>();

            // Find new messages (in current but not in last known)
            let newMessages = currentMessages.filter(msg => !lastKnownIds.has(msg.id));

            // Apply user filter if specified
            if (filterByUser) {
                newMessages = newMessages.filter(msg => 
                    msg.author && msg.author.toLowerCase() === filterByUser.toLowerCase()
                );
            }

            // Emit trigger for each new message
            for (const message of newMessages) {
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        id: message.id,
                        sender: message.author || 'unknown',
                        subject: message.subject || '',
                        body: message.body || '',
                        timestamp: new Date(message.created_utc * 1000).toISOString(),
                        context: message.context || '',
                        fullname: message.name || `t4_${message.id}`
                    }
                };

                await this.emitTrigger(payload);
                console.log(`[OnNewMessageReceived] New message from ${message.author}: ${message.subject}`.green);
            }

            // Update last known message IDs
            this.lastKnownMessageIds.set(areaId, currentMessageIds);
        } catch (error) {
            console.error(`[OnNewMessageReceived] Error checking for new messages:`.red, error);
        }
    }
}
