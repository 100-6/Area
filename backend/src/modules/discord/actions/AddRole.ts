import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { DiscordBotClient } from '../DiscordBotClient';
import 'colors';

/**
 * Action: Ajouter un rôle à un membre Discord
 * Ajoute un rôle spécifique à un utilisateur sur un serveur
 */
export class AddRole extends BaseAction {
    private botClient: DiscordBotClient;

    constructor() {
        super();
        this.botClient = DiscordBotClient.getInstance();
    }

    getName(): string {
        return 'add_role';
    }

    getDescription(): string {
        return 'Add a role to a Discord server member';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['guildId', 'roleId', 'userId'],
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
                    description: 'The user ID to add the role to',
                    pattern: '^[0-9]{17,19}$'
                },
                roleId: {
                    type: 'string',
                    title: 'Role ID',
                    description: 'The role ID to add to the member',
                    pattern: '^[0-9]{17,19}$'
                },
                reason: {
                    type: 'string',
                    title: 'Reason (optional)',
                    description: 'The reason for adding the role',
                    maxLength: 512
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                userId: { type: 'string', description: 'User ID who received the role' },
                userTag: { type: 'string', description: 'User Discord tag' },
                roleId: { type: 'string', description: 'Role ID that was added' },
                roleName: { type: 'string', description: 'Role name' },
                guildId: { type: 'string', description: 'Server (guild) ID' },
                guildName: { type: 'string', description: 'Server (guild) name' },
                alreadyHad: { type: 'boolean', description: 'Whether user already had the role' },
                message: { type: 'string', description: 'Status message' }
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
        if (!config.roleId || !idPattern.test(config.roleId))
            throw new Error('Invalid role ID');
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
            console.log(`[AddRole] Executing for AREA ${context.areaId}`.cyan);
            if (!this.botClient.isConnected())
                throw new Error('Discord bot is not connected');
            const client = this.botClient.getClient();
            const guildId = this.replaceVariables(config.guildId, context);
            const userId = this.replaceVariables(config.userId, context);
            const roleId = this.replaceVariables(config.roleId, context);
            const guild = await client.guilds.fetch(guildId);
            if (!guild)
                throw new Error(`Guild ${guildId} not found`);
            const member = await guild.members.fetch(userId);
            if (!member)
                throw new Error(`Member ${userId} not found in guild ${guildId}`);
            const role = await guild.roles.fetch(roleId);
            if (!role)
                throw new Error(`Role ${roleId} not found in guild ${guildId}`);
            if (member.roles.cache.has(roleId)) {
                console.log(`[AddRole] Member already has role ${role.name}`.yellow);
                return {
                    success: true,
                    data: {
                        message: 'Member already has this role',
                        alreadyHad: true,
                        userId: member.id,
                        roleId: role.id,
                        roleName: role.name
                    },
                    executionTime: Date.now() - startTime
                };
            }
            await member.roles.add(role, config.reason || 'Added by AREA automation');
            const executionTime = Date.now() - startTime;
            console.log(`[AddRole] ✓ Role ${role.name} added to ${member.user.tag}`.green);
            return {
                success: true,
                data: {
                    userId: member.id,
                    userTag: member.user.tag,
                    roleId: role.id,
                    roleName: role.name,
                    guildId: guild.id,
                    guildName: guild.name
                },
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[AddRole] ❌ Failed to add role:`.red, error);
            return {
                success: false,
                error: (error as Error).message,
                executionTime
            };
        }
    }
}
