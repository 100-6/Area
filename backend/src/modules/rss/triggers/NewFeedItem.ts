import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { RssParser, RssItem } from '../utils/RssParser';
import 'colors';

interface NewFeedItemConfig extends TriggerConfig {
    feedUrl: string;
    pollInterval?: number;
    matchTitle?: string;
    matchDescription?: string;
    matchKeywords?: string[];
}

/**
 * Monitors RSS/Atom feeds for new items with optional pattern matching
 * 
 * Polls feed at configured interval and triggers workflow when:
 * - New item appears (not seen before based on GUID)
 * - Item matches all configured filters (title, description, keywords)
 * 
 * Output variables available for use in actions:
 * - {{title}} - Item title
 * - {{link}} - Item URL
 * - {{description}} - Item description/summary
 * - {{pubDate}} - Publication date (ISO 8601)
 * - {{guid}} - Unique identifier
 * - {{mediaUrl}} - Attached media URL (if present)
 * 
 * @example
 * // Match articles containing "politique" OR "économie" in title/description
 * {
 *   feedUrl: "https://www.lemonde.fr/rss/une.xml",
 *   matchKeywords: ["politique", "économie"]
 * }
 * 
 * @fires trigger.fired when new matching RSS item is published
 */
export class NewFeedItem extends BaseTrigger {
    private parser: RssParser;
    private intervals: Map<string, NodeJS.Timeout> = new Map();
    private seenGuids: Map<string, Set<string>> = new Map();

    constructor() {
        super();
        this.parser = new RssParser();
    }

    getName(): string {
        return 'new_feed_item';
    }

    getType(): 'polling' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a new item is published to an RSS/Atom feed';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['feedUrl'],
            properties: {
                feedUrl: {
                    type: 'string',
                    title: 'Feed URL',
                    description: 'RSS or Atom feed URL to monitor',
                    format: 'uri',
                    example: 'https://www.lemonde.fr/rss/une.xml'
                },
                pollInterval: {
                    type: 'number',
                    title: 'Poll Interval (ms)',
                    description: 'How often to check for new items (in milliseconds)',
                    default: 300000,
                    minimum: 60000,
                    example: 300000
                },
                matchTitle: {
                    type: 'string',
                    title: 'Match Title (optional)',
                    description: 'Regular expression to filter items by title (case-insensitive)',
                    example: 'politique|économie'
                },
                matchDescription: {
                    type: 'string',
                    title: 'Match Description (optional)',
                    description: 'Regular expression to filter items by description (case-insensitive)',
                    example: 'France|Europe'
                },
                matchKeywords: {
                    type: 'array',
                    title: 'Match Keywords (optional)',
                    description: 'List of keywords to search in title or description (case-insensitive, ANY match)',
                    items: {
                        type: 'string'
                    },
                    example: ['politique', 'économie', 'finance']
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    description: 'Item title'
                },
                link: {
                    type: 'string',
                    description: 'Item URL'
                },
                description: {
                    type: 'string',
                    description: 'Item description/summary'
                },
                pubDate: {
                    type: 'string',
                    description: 'Publication date (ISO 8601)'
                },
                updated: {
                    type: 'string',
                    description: 'Last updated date (ISO 8601, Atom feeds only)'
                },
                guid: {
                    type: 'string',
                    description: 'Unique item identifier'
                },
                mediaUrl: {
                    type: 'string',
                    description: 'Attached media URL (if present)'
                },
                mediaWidth: {
                    type: 'number',
                    description: 'Attached media width in pixels (if present)'
                },
                mediaHeight: {
                    type: 'number',
                    description: 'Attached media height in pixels (if present)'
                }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const cfg = config as NewFeedItemConfig;

        if (!cfg.feedUrl || typeof cfg.feedUrl !== 'string') {
            throw new Error('feedUrl is required and must be a string');
        }

        // Basic URL validation
        try {
            new URL(cfg.feedUrl);
        } catch {
            throw new Error('feedUrl must be a valid URL');
        }

        if (cfg.pollInterval !== undefined) {
            if (typeof cfg.pollInterval !== 'number' || cfg.pollInterval < 60000) {
                throw new Error('pollInterval must be a number >= 60000 (1 minute)');
            }
        }

        if (cfg.matchTitle !== undefined && typeof cfg.matchTitle !== 'string') {
            throw new Error('matchTitle must be a string');
        }

        if (cfg.matchDescription !== undefined && typeof cfg.matchDescription !== 'string') {
            throw new Error('matchDescription must be a string');
        }

        if (cfg.matchKeywords !== undefined && !Array.isArray(cfg.matchKeywords)) {
            throw new Error('matchKeywords must be an array of strings');
        }

        return true;
    }

    /**
     * Start monitoring RSS feed
     */
    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as NewFeedItemConfig;
        this.validate(cfg);

        const pollInterval = cfg.pollInterval || 300000; // Default 5 minutes

        console.log(`[RSS] Starting NewFeedItem trigger for AREA ${areaId}`.green);
        console.log(`[RSS] Monitoring feed: ${cfg.feedUrl}`.cyan);
        console.log(`[RSS] Poll interval: ${pollInterval}ms`.cyan);

        // Initialize seen GUIDs set for this area
        if (!this.seenGuids.has(areaId)) {
            this.seenGuids.set(areaId, new Set());
        }

        // Fetch initial items to populate seen cache
        try {
            const items = await this.parser.parseFeed(cfg.feedUrl);
            const seenSet = this.seenGuids.get(areaId)!;
            
            items.forEach(item => {
                seenSet.add(item.guid);
            });

            console.log(`[RSS] Initialized with ${items.length} existing items for AREA ${areaId}`.green);
        } catch (error: any) {
            console.error(`[RSS] Failed to fetch initial feed for AREA ${areaId}:`.red, error.message);
            throw error;
        }

        // Start polling
        const interval = setInterval(async () => {
            await this.checkFeed(areaId, cfg);
        }, pollInterval);

        this.intervals.set(areaId, interval);
        this.isRunning = true;

        console.log(`[RSS] ✓ Started monitoring feed for AREA ${areaId}`.green);
    }

    /**
     * Stop monitoring RSS feed
     */
    async stop(areaId: string): Promise<void> {
        console.log(`[RSS] Stopping NewFeedItem trigger for AREA ${areaId}`.yellow);

        const interval = this.intervals.get(areaId);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(areaId);
            console.log(`[RSS] Cleared polling interval for AREA ${areaId}`.green);
        }

        // Clean up seen GUIDs
        this.seenGuids.delete(areaId);

        if (this.intervals.size === 0) {
            this.isRunning = false;
        }

        console.log(`[RSS] ✓ Stopped monitoring feed for AREA ${areaId}`.green);
    }

    /**
     * Check feed for new items
     */
    private async checkFeed(areaId: string, config: NewFeedItemConfig): Promise<void> {
        try {
            const items = await this.parser.parseFeed(config.feedUrl);
            const seenSet = this.seenGuids.get(areaId);

            if (!seenSet) {
                console.error(`[RSS] No seen GUIDs set for AREA ${areaId}`.red);
                return;
            }

            // Filter for new items only
            const newItems = items.filter(item => !seenSet.has(item.guid));

            if (newItems.length === 0) {
                console.log(`[RSS] No new items for AREA ${areaId}`.gray);
                return;
            }

            console.log(`[RSS] Found ${newItems.length} new item(s) for AREA ${areaId}`.cyan);

            // Process each new item
            for (const item of newItems) {
                // Apply pattern matching filters
                if (this.matchesFilters(item, config)) {
                    console.log(`[RSS] ✓ Item matches filters: "${item.title}"`.green);

                    const payload: TriggerPayload = {
                        areaId,
                        triggerName: this.getName(),
                        triggerType: this.getType(),
                        timestamp: new Date().toISOString(),
                        data: {
                            title: item.title,
                            link: item.link,
                            description: item.description,
                            pubDate: item.pubDate,
                            updated: item.updated,
                            guid: item.guid,
                            mediaUrl: item.mediaUrl,
                            mediaWidth: item.mediaWidth,
                            mediaHeight: item.mediaHeight
                        }
                    };

                    await this.emitTrigger(payload);
                } else {
                    console.log(`[RSS] ✗ Item filtered out: "${item.title}"`.gray);
                }

                // Mark as seen regardless of filter match
                seenSet.add(item.guid);
            }
        } catch (error: any) {
            console.error(`[RSS] Error checking feed for AREA ${areaId}:`.red, error.message);
        }
    }

    /**
     * Check if RSS item matches configured filters
     * @param item - RSS feed item
     * @param config - Trigger configuration with optional match patterns
     * @returns true if item matches ALL configured filters (AND logic)
     */
    private matchesFilters(item: RssItem, config: NewFeedItemConfig): boolean {
        // Match title regex (case-insensitive)
        if (config.matchTitle) {
            try {
                const regex = new RegExp(config.matchTitle, 'i');
                if (!regex.test(item.title)) {
                    return false;
                }
            } catch (error) {
                console.error(`[RSS] Invalid matchTitle regex: ${config.matchTitle}`.red);
                return false;
            }
        }

        // Match description regex (case-insensitive)
        if (config.matchDescription) {
            try {
                const regex = new RegExp(config.matchDescription, 'i');
                if (!regex.test(item.description || '')) {
                    return false;
                }
            } catch (error) {
                console.error(`[RSS] Invalid matchDescription regex: ${config.matchDescription}`.red);
                return false;
            }
        }

        // Match keywords (case-insensitive, ANY match in title OR description)
        if (config.matchKeywords && config.matchKeywords.length > 0) {
            const searchText = `${item.title} ${item.description}`.toLowerCase();
            const hasMatch = config.matchKeywords.some((kw: string) =>
                searchText.includes(kw.toLowerCase())
            );
            if (!hasMatch) {
                return false;
            }
        }

        return true; // All filters passed
    }
}
