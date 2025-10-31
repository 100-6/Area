import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { SlackApiService } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action pour inviter un utilisateur dans un canal Slack
 */
export class InviteUserToChannelAction extends BaseAction {
    getName(): string {
        return 'invite_user_to_channel';
    }

    getDescription(): string {
        return 'Invite a user to a Slack channel';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['channelId', 'userId'],
            properties: {
                channelId: {
                    type: 'string',
                    minLength: 1
                },
                userId: {
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
                userId: { type: 'string' },
                success: { type: 'boolean' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['channels:write.invites'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.channelId || config.channelId.trim() === '')
            throw new Error('Channel ID is required');
        if (!config.userId || config.userId.trim() === '')
            throw new Error('User ID is required');
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[InviteUserToChannel] Executing for AREA ${context.areaId}`.cyan);
            const processedConfig = this.replaceVariablesInConfig(config, context);
            const slackConnection = await UserAuthProvider.findByUserAndProvider(
                context.userId,
                'slack'
            );

            if (!slackConnection || !slackConnection.access_token)
                throw new Error('Slack not connected for this user');
            const accessToken = slackConnection.access_token;
            const success = await SlackApiService.inviteUserToChannel(
                accessToken,
                processedConfig.channelId,
                processedConfig.userId
            );
            console.log(`[InviteUserToChannel] User invited successfully`.green);
            return {
                success: true,
                data: {
                    channelId: processedConfig.channelId,
                    userId: processedConfig.userId,
                    success
                }
            };
        } catch (error) {
            console.error(`[InviteUserToChannel] Error:`.red, error);
            throw error;
        }
    }
}
