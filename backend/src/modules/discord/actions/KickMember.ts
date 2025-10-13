import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { DiscordBotClient } from '../DiscordBotClient';
import 'colors';

/**
 * Action: Expulser un membre d'un serveur Discord
 * Kick un utilisateur d'un serveur (modération)
 */
export class KickMember extends BaseAction {
    private botClient: DiscordBotClient;

    constructor() {
        super();
        this.botClient = DiscordBotClient.getInstance();
    }

    getName(): string {
        return 'kick_member';
    }

    getDescription(): string {
        return 'Kick a member from a Discord server';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['guildId', 'userId'],
            properties: {
                guildId: {
                    type: 'string',
                    title: 'Server ID',
                    description: 'The Discord server (guild) ID',
                    pattern: '^[0-9]{17,19}$'
                },
                userId: {
                    type: 'string',
                    title: 'User ID',
                    description: 'The user ID to kick from the server',
                    pattern: '^[0-9]{17,19}$'
                },
                reason: {
                    type: 'string',
                    title: 'Reason (optional)',
                    description: 'The reason for kicking the member',
                    maxLength: 512
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                userId: { type: 'string', description: 'ID of kicked user' },
                userTag: { type: 'string', description: 'Discord tag of kicked user' },
                username: { type: 'string', description: 'Username of kicked user' },
                guildId: { type: 'string', description: 'Server (guild) ID' },
                guildName: { type: 'string', description: 'Server (guild) name' },
                reason: { type: 'string', description: 'Reason for kick' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['bot'];
    }

    validate(config: ActionConfig): boolean {
        const idPattern = /^[0-9]{17,19}$/;

        if (!config.guildId || !idPattern.test(config.guildId))
            throw new Error('Invalid guild ID');
        if (!config.userId || !idPattern.test(config.userId))
            throw new Error('Invalid user ID');
        if (config.reason && config.reason.length > 512)
            throw new Error('Reason must be 512 characters or less');
        return true;
    }

    /**
     * Remplacer les variables dans les IDs
     */
    private replaceVariables(value: string, context: ActionContext): string {
        let result = value;

        if (context.triggerData) {
            if (context.triggerData.member)
                result = result.replace(/\{\{member\.id\}\}/g, context.triggerData.member.id || '');
            if (context.triggerData.author)
                result = result.replace(/\{\{author\.id\}\}/g, context.triggerData.author.id || '');
            if (context.triggerData.user)
                result = result.replace(/\{\{user\.id\}\}/g, context.triggerData.user.id || '');
        }

        return result;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            console.log(`[KickMember] Executing for AREA ${context.areaId}`.cyan);
            if (!this.botClient.isConnected())
                throw new Error('Discord bot is not connected');
            const client = this.botClient.getClient();
            const guildId = this.replaceVariables(config.guildId, context);
            const userId = this.replaceVariables(config.userId, context);
            const guild = await client.guilds.fetch(guildId);
            if (!guild)
                throw new Error(`Guild ${guildId} not found`);
            const member = await guild.members.fetch(userId);
            if (!member)
                throw new Error(`Member ${userId} not found in guild ${guildId}`);
            const botMember = await guild.members.fetchMe();
            if (!botMember.permissions.has('KickMembers'))
                throw new Error('Bot does not have permission to kick members');
            if (member.roles.highest.position >= botMember.roles.highest.position)
                throw new Error('Cannot kick this member: member has equal or higher role');
            if (member.id === guild.ownerId)
                throw new Error('Cannot kick the server owner');
            const userTag = member.user.tag;
            const userUsername = member.user.username;
            await member.kick(config.reason || 'Kicked by AREA automation');
            const executionTime = Date.now() - startTime;
            console.log(`[KickMember] ✓ Member ${userTag} kicked from ${guild.name}`.green);
            return {
                success: true,
                data: {
                    userId: userId,
                    userTag: userTag,
                    username: userUsername,
                    guildId: guild.id,
                    guildName: guild.name,
                    reason: config.reason || 'Kicked by AREA automation'
                },
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[KickMember] ❌ Failed to kick member:`.red, error);
            return {
                success: false,
                error: (error as Error).message,
                executionTime
            };
        }
    }
}
