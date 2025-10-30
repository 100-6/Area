import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { BitlyModule } from '../service';
import 'colors';

interface UpdateBitlinkConfig extends ActionConfig {
    bitlink: string;
    newLongUrl: string;
    title?: string;
    tags?: string[] | string;
}

/**
 * Action: Update the destination URL or metadata of an existing Bitly link
 */
export class UpdateBitlinkDestinationAction extends BaseAction {
    private bitlyModule: BitlyModule;

    constructor(bitlyModule: BitlyModule) {
        super();
        this.bitlyModule = bitlyModule;
    }

    getName(): string {
        return 'update_bitlink_destination';
    }

    getDescription(): string {
        return 'Update the long URL, title, or tags of an existing Bitly link';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['bitlink', 'newLongUrl'],
            properties: {
                bitlink: {
                    type: 'string',
                    title: 'Bitlink',
                    description: 'Bitly link to update (format: bit.ly/abc123 or custom domain)'
                },
                newLongUrl: {
                    type: 'string',
                    title: 'New Long URL',
                    description: 'New destination URL (supports variables like {{trigger.data.longUrl}})'
                },
                title: {
                    type: 'string',
                    title: 'New Title',
                    description: 'Optional new title for the bitlink'
                },
                tags: {
                    type: 'array',
                    title: 'Tags',
                    description: 'Tags to set on the bitlink (replaces existing tags)',
                    items: { type: 'string' }
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Bitlink identifier (domain/hash)' },
                link: { type: 'string', description: 'Short link URL' },
                longUrl: { type: 'string', description: 'Updated destination URL' },
                title: { type: 'string', description: 'Updated title' },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Updated tags'
                },
                updatedAt: { type: 'string', description: 'Timestamp of the update' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['bitlink_edit'];
    }

    validate(config: ActionConfig): boolean {
        const typed = config as UpdateBitlinkConfig;
        if (!typed.bitlink || typeof typed.bitlink !== 'string' || typed.bitlink.trim() === '') {
            throw new Error('bitlink is required');
        }
        if (!typed.newLongUrl || typeof typed.newLongUrl !== 'string' || typed.newLongUrl.trim() === '') {
            throw new Error('newLongUrl is required');
        }

        try {
            if (!this.hasVariables(typed.newLongUrl)) {
                new URL(typed.newLongUrl);
            }
        } catch {
            throw new Error('newLongUrl must be a valid URL');
        }

        if (typed.tags && !Array.isArray(typed.tags) && typeof typed.tags !== 'string') {
            throw new Error('tags must be an array of strings or a comma-separated string');
        }

        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            const typed = config as UpdateBitlinkConfig;
            const bitlyAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'bitly');

            if (!bitlyAuth || !bitlyAuth.access_token) {
                throw new Error('Bitly not connected. Please authenticate with Bitly.');
            }

            const apiService = this.bitlyModule.getApiService();
            const bitlink = this.normalizeBitlink(this.replaceVariables(typed.bitlink, context));
            const longUrl = this.replaceVariables(typed.newLongUrl, context);
            new URL(longUrl);

            const updates: { long_url: string; title?: string; tags?: string[] } = {
                long_url: longUrl
            };

            if (typed.title) {
                updates.title = this.replaceVariables(typed.title, context);
            }

            if (Array.isArray(typed.tags)) {
                updates.tags = typed.tags.map(tag => this.replaceVariables(tag, context)).filter(Boolean);
            } else if (typeof typed.tags === 'string' && typed.tags.trim().length > 0) {
                const resolved = this.replaceVariables(typed.tags, context);
                updates.tags = resolved.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            }

            const updatedBitlink = await apiService.updateBitlink(bitlyAuth.access_token, bitlink, updates);
            const executionTime = Date.now() - startTime;

            console.log(`[UpdateBitlinkDestination] Updated bitlink ${updatedBitlink.id}`.green);

            return {
                success: true,
                data: {
                    id: updatedBitlink.id,
                    link: updatedBitlink.link,
                    longUrl: updatedBitlink.long_url,
                    title: updatedBitlink.title || '',
                    tags: updatedBitlink.tags || [],
                    updatedAt: new Date().toISOString()
                },
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error('[UpdateBitlinkDestination] Failed to update bitlink:'.red, error);
            return {
                success: false,
                error: (error as Error).message,
                executionTime
            };
        }
    }

    private normalizeBitlink(bitlink: string): string {
        const trimmed = bitlink.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            const url = new URL(trimmed);
            return `${url.host}${url.pathname}`;
        }
        if (trimmed.includes('/')) {
            return trimmed;
        }
        return `bit.ly/${trimmed}`;
    }
}
