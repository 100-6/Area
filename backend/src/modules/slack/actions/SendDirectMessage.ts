import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { SlackApiService } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action pour envoyer un message privé (DM) à un utilisateur Slack
 */
export class SendDirectMessageAction extends BaseAction {
    getName(): string {
        return 'send_direct_message';
    }

    getDescription(): string {
        return 'Send a direct message to a Slack user';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['userId', 'text'],
            properties: {
                userId: {
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
                userId: { type: 'string' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['chat:write', 'im:write'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.userId || config.userId.trim() === '')
            throw new Error('User ID is required');
        if (!config.text || config.text.trim() === '')
            throw new Error('Message text is required');
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[SendDirectMessage] Executing for AREA ${context.areaId}`.cyan);
            const processedConfig = this.replaceVariablesInConfig(config, context);
            const slackConnection = await UserAuthProvider.findByUserAndProvider(
                context.userId,
                'slack'
            );

            if (!slackConnection || !slackConnection.access_token)
                throw new Error('Slack not connected for this user');
            const accessToken = slackConnection.access_token;
            const result = await SlackApiService.sendDirectMessage(
                accessToken,
                processedConfig.userId,
                processedConfig.text
            );
            console.log(`[SendDirectMessage] DM sent successfully`.green);
            return {
                success: true,
                data: {
                    messageId: result.ts,
                    channelId: result.channel,
                    userId: processedConfig.userId
                }
            };
        } catch (error) {
            console.error(`[SendDirectMessage] Error:`.red, error);
            throw error;
        }
    }
}
