import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { SlackApiService } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action pour épingler un message dans un canal Slack
 */
export class PinMessageAction extends BaseAction {
    getName(): string {
        return 'pin_message';
    }

    getDescription(): string {
        return 'Pin a message in a Slack channel';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['channelId', 'messageTs'],
            properties: {
                channelId: {
                    type: 'string',
                    minLength: 1
                },
                messageTs: {
                    type: 'string',
                    minLength: 1
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                channelId: { type: 'string' },
                messageTs: { type: 'string' },
                success: { type: 'boolean' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['pins:write'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.channelId || config.channelId.trim() === '')
            throw new Error('Channel ID is required');
        if (!config.messageTs || config.messageTs.trim() === '')
            throw new Error('Message timestamp is required');
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[PinMessage] Executing for AREA ${context.areaId}`.cyan);
            const processedConfig = this.replaceVariablesInConfig(config, context);
            const slackConnection = await UserAuthProvider.findByUserAndProvider(
                context.userId,
                'slack'
            );

            if (!slackConnection || !slackConnection.access_token)
                throw new Error('Slack not connected for this user');
            const accessToken = slackConnection.access_token;
            const success = await SlackApiService.pinMessage(
                accessToken,
                processedConfig.channelId,
                processedConfig.messageTs
            );
            console.log(`[PinMessage] Message pinned successfully`.green);
            return {
                success: true,
                data: {
                    channelId: processedConfig.channelId,
                    messageTs: processedConfig.messageTs,
                    success
                }
            };
        } catch (error) {
            console.error(`[PinMessage] Error:`.red, error);
            throw error;
        }
    }
}
