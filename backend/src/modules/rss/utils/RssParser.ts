import Parser from 'rss-parser';

/**
 * RSS/Atom feed item structure
 */
export interface RssItem {
    title: string;
    link: string;
    description: string;
    pubDate: string;        // ISO 8601 format
    updated?: string;       // ISO 8601 format (Atom feeds)
    guid: string;
    mediaUrl?: string;      // From <media:content url>
    mediaWidth?: number;    // From <media:content width>
    mediaHeight?: number;   // From <media:content height>
}

/**
 * RSS/Atom feed parser wrapper
 * Handles both RSS 2.0 and Atom formats with media content support
 */
export class RssParser {
    private parser: Parser;

    constructor() {
        this.parser = new Parser({
            customFields: {
                item: [
                    ['updated', 'updated'],
                    ['media:content', 'media', { keepArray: true }]
                ]
            }
        });
    }

    /**
     * Parse RSS/Atom feed and extract items
     * @param url - RSS feed URL
     * @returns Array of normalized RSS items
     * @throws Error if feed is invalid or unreachable
     */
    async parseFeed(url: string): Promise<RssItem[]> {
        try {
            const feed = await this.parser.parseURL(url);
            
            return feed.items.map(item => {
                // Extract media content if present
                let mediaUrl: string | undefined;
                let mediaWidth: number | undefined;
                let mediaHeight: number | undefined;

                if (item.media && Array.isArray(item.media) && item.media.length > 0) {
                    const mediaContent = item.media[0];
                    if (mediaContent && typeof mediaContent === 'object' && '$' in mediaContent) {
                        const attrs = (mediaContent as any).$;
                        mediaUrl = attrs.url;
                        mediaWidth = attrs.width ? parseInt(attrs.width) : undefined;
                        mediaHeight = attrs.height ? parseInt(attrs.height) : undefined;
                    }
                }

                return {
                    title: item.title || '',
                    link: item.link || '',
                    description: item.contentSnippet || item.content || item.summary || '',
                    pubDate: this.normalizeDate(item.pubDate || item.isoDate),
                    updated: (item as any).updated ? this.normalizeDate((item as any).updated) : undefined,
                    guid: item.guid || item.id || item.link || '',
                    mediaUrl,
                    mediaWidth,
                    mediaHeight
                };
            });
        } catch (error: any) {
            throw new Error(`Failed to parse RSS feed: ${error.message}`);
        }
    }

    /**
     * Normalize date to ISO 8601 format
     * @param date - Date string in various formats
     * @returns ISO 8601 date string
     */
    private normalizeDate(date: string | undefined): string {
        if (!date) return new Date().toISOString();
        try {
            return new Date(date).toISOString();
        } catch {
            return new Date().toISOString();
        }
    }
}
