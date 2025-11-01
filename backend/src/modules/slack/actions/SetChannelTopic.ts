import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { SlackApiService } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action pour définir le sujet d'un canal Slack
 */
export class SetChannelTopicAction extends BaseAction {
    getName(): string {
        return 'set_channel_topic';
    }

    getDescription(): string {
        return 'Set or update the topic of a Slack channel';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['channelId', 'topic'],
            properties: {
                channelId: {
                    type: 'string',
                    minLength: 1
                },
                topic: {
                    type: 'string',
                    minLength: 0,
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
                topic: { type: 'string' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['channels:write.topic'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.channelId || config.channelId.trim() === '')
            throw new Error('Channel ID is required');
        if (config.topic === undefined || config.topic === null)
            throw new Error('Topic is required (can be empty string)');
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[SetChannelTopic] Executing for AREA ${context.areaId}`.cyan);
            const processedConfig = this.replaceVariablesInConfig(config, context);
            const slackConnection = await UserAuthProvider.findByUserAndProvider(
                context.userId,
                'slack'
            );

            if (!slackConnection || !slackConnection.access_token)
                throw new Error('Slack not connected for this user');
            const accessToken = slackConnection.access_token;
            const topic = await SlackApiService.setChannelTopic(
                accessToken,
                processedConfig.channelId,
                processedConfig.topic
            );
            console.log(`[SetChannelTopic] Topic updated successfully`.green);
            return {
                success: true,
                data: {
                    channelId: processedConfig.channelId,
                    topic
                }
            };
        } catch (error) {
            console.error(`[SetChannelTopic] Error:`.red, error);
            throw error;
        }
    }
}
