import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import { BitlyModule } from '../service';
import type { CreateBitlinkPayload } from '../BitlyApiService';
import 'colors';

interface CreateBitlinkConfig extends ActionConfig {
    longUrl: string;
    domain?: string;
    groupGuid?: string;
    title?: string;
    tags?: string[] | string;
}

/**
 * Action: Create a new Bitly short link
 */
export class CreateBitlinkAction extends BaseAction {
    private bitlyModule: BitlyModule;

    constructor(bitlyModule: BitlyModule) {
        super();
        this.bitlyModule = bitlyModule;
    }

    getName(): string {
        return 'create_bitlink';
    }

    getDescription(): string {
        return 'Create a new Bitly short link from a long URL';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['longUrl'],
            properties: {
                longUrl: {
                    type: 'string',
                    title: 'Long URL',
                    description: 'Destination URL to shorten (supports variables like {{trigger.data.longUrl}})',
                    example: 'https://example.com/article/{{trigger.data.slug}}'
                },
                domain: {
                    type: 'string',
                    title: 'Custom Domain (optional)',
                    description: 'Bitly domain to use (e.g., bit.ly, j.mp, custom domain)'
                },
                groupGuid: {
                    type: 'string',
                    title: 'Group GUID',
                    description: 'Bitly group identifier. Leave empty to use your default group.'
                },
                title: {
                    type: 'string',
                    title: 'Title',
                    description: 'Optional title for the bitlink'
                },
                tags: {
                    type: 'array',
                    title: 'Tags',
                    description: 'Tags to assign to the bitlink',
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
                longUrl: { type: 'string', description: 'Original destination URL' },
                title: { type: 'string', description: 'Bitlink title' },
                createdAt: { type: 'string', description: 'Creation timestamp' },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Assigned tags'
                },
                groupGuid: { type: 'string', description: 'Group GUID used for creation' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['bitlink_edit'];
    }

    validate(config: ActionConfig): boolean {
        const typed = config as CreateBitlinkConfig;
        if (!typed.longUrl || typeof typed.longUrl !== 'string' || typed.longUrl.trim() === '') {
            throw new Error('longUrl is required and must be a non-empty string');
        }

        // Validate URL format
        try {
            // Allow variable placeholders; skip validation if placeholders exist
            if (!this.hasVariables(typed.longUrl)) {
                new URL(typed.longUrl);
            }
        } catch {
            throw new Error('longUrl must be a valid URL');
        }

        if (typed.tags && !Array.isArray(typed.tags) && typeof typed.tags !== 'string') {
            throw new Error('tags must be an array of strings or a comma-separated string');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            const typedConfig = config as CreateBitlinkConfig;
            const bitlyAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'bitly');

            if (!bitlyAuth || !bitlyAuth.access_token) {
                throw new Error('Bitly not connected. Please authenticate with Bitly.');
            }

            const apiService = this.bitlyModule.getApiService();

            const longUrl = this.replaceVariables(typedConfig.longUrl, context);
            // Validate final URL
            new URL(longUrl);

            const domain = typedConfig.domain ? this.replaceVariables(typedConfig.domain, context) : undefined;
            let groupGuid = typedConfig.groupGuid ? this.replaceVariables(typedConfig.groupGuid, context) : undefined;
            const title = typedConfig.title ? this.replaceVariables(typedConfig.title, context) : undefined;

            let tags: string[] | undefined;
            if (Array.isArray(typedConfig.tags)) {
                tags = typedConfig.tags.map(tag => this.replaceVariables(tag, context)).filter(Boolean);
            } else if (typeof typedConfig.tags === 'string' && typedConfig.tags.trim().length > 0) {
                const resolved = this.replaceVariables(typedConfig.tags, context);
                tags = resolved.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            }

            if (!groupGuid) {
                groupGuid = await apiService.getDefaultGroupGuid(bitlyAuth.access_token) || undefined;
            }

            const payload: CreateBitlinkPayload = {
                long_url: longUrl,
                domain,
                group_guid: groupGuid,
                title,
                tags
            };

            const bitlink = await apiService.createBitlink(bitlyAuth.access_token, payload);
            const executionTime = Date.now() - startTime;

            console.log(`[CreateBitlink] Created bitlink ${bitlink.id} for AREA ${context.areaId}`.green);

            return {
                success: true,
                data: {
                    id: bitlink.id,
                    link: bitlink.link,
                    longUrl: bitlink.long_url,
                    title: bitlink.title || '',
                    createdAt: bitlink.created_at,
                    tags: bitlink.tags || [],
                    groupGuid: groupGuid || null
                },
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error('[CreateBitlink] Failed to create bitlink:'.red, error);
            return {
                success: false,
                error: (error as Error).message,
                executionTime
            };
        }
    }
}
