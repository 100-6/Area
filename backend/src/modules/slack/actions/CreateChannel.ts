import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { SlackApiService } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action pour créer un nouveau canal Slack
 */
export class CreateChannelAction extends BaseAction {
    getName(): string {
        return 'create_channel';
    }

    getDescription(): string {
        return 'Create a new Slack channel';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['name'],
            properties: {
                name: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 80,
                    pattern: '^[a-z0-9-_]+$'
                },
                isPrivate: {
                    type: 'boolean',
                    default: false
                },
                description: {
                    type: 'string',
                    maxLength: 250
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                channelId: { type: 'string' },
                channelName: { type: 'string' },
                isPrivate: { type: 'boolean' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['channels:manage', 'groups:write'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.name || config.name.trim() === '')
            throw new Error('Channel name is required');
        if (!/^[a-z0-9-_]+$/.test(config.name))
            throw new Error('Channel name must be lowercase with no spaces (only letters, numbers, hyphens, and underscores)');
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[CreateChannel] Executing for AREA ${context.areaId}`.cyan);
            const processedConfig = this.replaceVariablesInConfig(config, context);
            const slackConnection = await UserAuthProvider.findByUserAndProvider(
                context.userId,
                'slack'
            );

            if (!slackConnection || !slackConnection.access_token)
                throw new Error('Slack not connected for this user');
            const accessToken = slackConnection.access_token;
            const channel = await SlackApiService.createChannel(
                accessToken,
                processedConfig.name.toLowerCase(),
                processedConfig.isPrivate || false
            );
            console.log(`[CreateChannel] Channel created: ${channel.id}`.green);
            return {
                success: true,
                data: {
                    channelId: channel.id,
                    channelName: channel.name,
                    isPrivate: channel.is_private
                }
            };
        } catch (error) {
            console.error(`[CreateChannel] Error:`.red, error);
            throw error;
        }
    }
}
