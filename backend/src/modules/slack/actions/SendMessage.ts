import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { SlackApiService } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action pour envoyer un message dans un canal Slack
 */
export class SendMessageAction extends BaseAction {
    getName(): string {
        return 'send_message';
    }

    getDescription(): string {
        return 'Send a text message to a Slack channel';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['channelId', 'text'],
            properties: {
                channelId: {
                    type: 'string',
                    minLength: 1
                },
                text: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 4000
                },
                threadTs: {
                    type: 'string'
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                messageId: { type: 'string', description: 'Sent message timestamp ID' },
                channelId: { type: 'string', description: 'Channel ID' },
                text: { type: 'string', description: 'Message text' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['chat:write'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.channelId || config.channelId.trim() === '')
            throw new Error('Channel ID is required');
        if (!config.text || config.text.trim() === '')
            throw new Error('Message text is required');
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[SendMessage] Executing for AREA ${context.areaId}`.cyan);
            const processedConfig = this.replaceVariablesInConfig(config, context);
            const slackConnection = await UserAuthProvider.findByUserAndProvider(
                context.userId,
                'slack'
            );

            if (!slackConnection || !slackConnection.access_token)
                throw new Error('Slack not connected for this user');
            const accessToken = slackConnection.access_token;
            const result = await SlackApiService.postMessage(
                accessToken,
                processedConfig.channelId,
                processedConfig.text,
                processedConfig.threadTs
            );
            console.log(`[SendMessage] Message sent successfully: ${result.ts}`.green);
            return {
                success: true,
                data: {
                    messageId: result.ts,
                    channelId: result.channel,
                    text: processedConfig.text
                }
            };
        } catch (error) {
            console.error(`[SendMessage] Error:`.red, error);
            throw error;
        }
    }
}
