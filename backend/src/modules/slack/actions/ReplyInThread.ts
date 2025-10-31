import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { SlackApiService } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action pour répondre dans un thread Slack
 */
export class ReplyInThreadAction extends BaseAction {
    getName(): string {
        return 'reply_in_thread';
    }

    getDescription(): string {
        return 'Reply to a message in a thread';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['channelId', 'threadTs', 'text'],
            properties: {
                channelId: {
                    type: 'string',
                    minLength: 1
                },
                threadTs: {
                    type: 'string',
                    minLength: 1
                },
                text: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 4000
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                messageId: { type: 'string' },
                channelId: { type: 'string' },
                threadTs: { type: 'string' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['chat:write'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.channelId || config.channelId.trim() === '')
            throw new Error('Channel ID is required');
        if (!config.threadTs || config.threadTs.trim() === '')
            throw new Error('Thread timestamp is required');
        if (!config.text || config.text.trim() === '')
            throw new Error('Reply text is required');
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[ReplyInThread] Executing for AREA ${context.areaId}`.cyan);
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
            console.log(`[ReplyInThread] Reply sent successfully`.green);
            return {
                success: true,
                data: {
                    messageId: result.ts,
                    channelId: result.channel,
                    threadTs: processedConfig.threadTs
                }
            };
        } catch (error) {
            console.error(`[ReplyInThread] Error:`.red, error);
            throw error;
        }
    }
}
