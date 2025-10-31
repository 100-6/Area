import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { SlackApiService } from '../service';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action pour ajouter une réaction emoji à un message Slack
 */
export class AddReactionAction extends BaseAction {
    getName(): string {
        return 'add_reaction';
    }

    getDescription(): string {
        return 'Add an emoji reaction to a Slack message';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['channelId', 'messageTs', 'emoji'],
            properties: {
                channelId: {
                    type: 'string',
                    minLength: 1
                },
                messageTs: {
                    type: 'string',
                    minLength: 1
                },
                emoji: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 100
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
                emoji: { type: 'string' },
                success: { type: 'boolean' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['reactions:write'];
    }

    validate(config: ActionConfig): boolean {
        if (!config.channelId || config.channelId.trim() === '')
            throw new Error('Channel ID is required');
        if (!config.messageTs || config.messageTs.trim() === '')
            throw new Error('Message timestamp is required');
        if (!config.emoji || config.emoji.trim() === '')
            throw new Error('Emoji is required');
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        try {
            console.log(`[AddReaction] Executing for AREA ${context.areaId}`.cyan);
            const processedConfig = this.replaceVariablesInConfig(config, context);
            const slackConnection = await UserAuthProvider.findByUserAndProvider(
                context.userId,
                'slack'
            );

            if (!slackConnection || !slackConnection.access_token)
                throw new Error('Slack not connected for this user');
            const accessToken = slackConnection.access_token;
            let emojiName = processedConfig.emoji.trim();
            if (emojiName.startsWith(':') && emojiName.endsWith(':'))
                emojiName = emojiName.slice(1, -1);
            const success = await SlackApiService.addReaction(
                accessToken,
                processedConfig.channelId,
                processedConfig.messageTs,
                emojiName
            );
            console.log(`[AddReaction] Reaction added successfully`.green);
            return {
                success: true,
                data: {
                    channelId: processedConfig.channelId,
                    messageTs: processedConfig.messageTs,
                    emoji: emojiName,
                    success
                }
            };
        } catch (error) {
            console.error(`[AddReaction] Error:`.red, error);
            throw error;
        }
    }
}
