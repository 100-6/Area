import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { TwitchApiService } from '../TwitchApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action to update stream title
 */
export class UpdateStreamTitleAction extends BaseAction {
    private apiService: TwitchApiService;

    constructor(apiService: TwitchApiService) {
        super();
        this.apiService = apiService;
    }

    getName(): string {
        return 'update_stream_title';
    }

    getDescription(): string {
        return 'Update your stream title';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['title'],
            properties: {
                title: {
                    type: 'string',
                    title: 'Stream Title',
                    description: 'New stream title (supports variables)',
                    maxLength: 140,
                    example: 'Playing {{game_name}} - Welcome!'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether title was updated successfully' },
                title: { type: 'string', description: 'Updated title' },
                updated_at: { type: 'string', format: 'date-time', description: 'Update timestamp' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['channel:manage:broadcast'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.title || typeof config.title !== 'string') {
            throw new Error('Title is required');
        }
        if (config.title.length > 140) {
            throw new Error('Title must be 140 characters or less');
        }
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[UpdateStreamTitle] Executing action for user ${context.userId}`.cyan);

            this.validate(config);

            const twitchAuth = await UserAuthProvider.findByUserAndProvider(context.userId, 'twitch');
            if (!twitchAuth || !twitchAuth.access_token) {
                throw new Error('Twitch account not connected');
            }

            const userData = twitchAuth.provider_data as any;
            const broadcasterId = userData.id;

            // Replace variables in title
            let title = this.replaceVariables(config.title, context.triggerData);

            // Update the title
            await this.apiService.updateChannelInfo(
                twitchAuth.access_token,
                broadcasterId,
                { title }
            );

            console.log(`[UpdateStreamTitle] Title updated successfully: ${title}`.green);

            return {
                success: true,
                data: {
                    success: true,
                    title: title,
                    updated_at: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error(`[UpdateStreamTitle] Error updating title:`.red, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update stream title'
            };
        }
    }

    protected replaceVariables(text: string, triggerData: any): string {
        if (!triggerData) return text;

        let result = text;
        const variableRegex = /\{\{([^}]+)\}\}/g;
        const matches = text.matchAll(variableRegex);

        for (const match of matches) {
            const variableName = match[1].trim();
            const value = this.getNestedValue(triggerData, variableName);
            if (value !== undefined) {
                result = result.replace(match[0], String(value));
            }
        }

        return result;
    }

    protected getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
}
