import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { DiscordBotClient } from '../DiscordBotClient';
import 'colors';

/**
 * Trigger: Nouveau membre rejoint le serveur Discord
 * Se déclenche quand un utilisateur rejoint un serveur spécifique
 */
export class OnMemberJoin extends BaseTrigger {
    private botClient: DiscordBotClient;
    private listeners: Map<string, (data: any) => void> = new Map();

    constructor() {
        super();
        this.botClient = DiscordBotClient.getInstance();
    }

    getName(): string {
        return 'on_member_join';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'webhook';
    }

    getDescription(): string {
        return 'Triggers when a new member joins a Discord server';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['guildId'],
            properties: {
                guildId: {
                    type: 'string',
                    title: 'Server ID',
                    description: 'The Discord server (guild) ID to monitor',
                    pattern: '^[0-9]{17,19}$'
                },
                ignoreBots: {
                    type: 'boolean',
                    title: 'Ignore bots',
                    description: 'Ignore when bots join the server',
                    default: true
                }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (!config.guildId)
            throw new Error('guildId is required');
        const guildIdPattern = /^[0-9]{17,19}$/;
        if (!guildIdPattern.test(config.guildId))
            throw new Error('Invalid Discord server ID format');
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnMemberJoin] Starting trigger for AREA ${areaId}`.cyan);
        this.validate(config);

        if (!this.botClient.isConnected())
            await this.botClient.connect();
        const listener = async (eventData: any) => {
            try {
                if (eventData.guildId !== config.guildId)
                    return;
                if (config.ignoreBots && eventData.isBot)
                    return;
                console.log(`[OnMemberJoin] Trigger fired for AREA ${areaId} - ${eventData.userTag} joined`.green);
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        member: {
                            id: eventData.userId,
                            tag: eventData.userTag,
                            username: eventData.username,
                            avatarUrl: eventData.avatarUrl,
                            joinedAt: eventData.joinedAt,
                            accountCreatedAt: eventData.accountCreatedAt,
                            isBot: eventData.isBot
                        },
                        guild: {
                            id: eventData.guildId,
                            name: eventData.guildName
                        }
                    }
                };
                await this.emitTrigger(payload);
            } catch (error) {
                console.error(`[OnMemberJoin] Error processing event:`.red, error);
            }
        };
        this.listeners.set(areaId, listener);
        await this.eventBus.on('discord.member.join', listener);
        this.botClient.registerTrigger(this.getName(), areaId);
        this.isRunning = true;
        console.log(`[OnMemberJoin] ✓ Trigger started for AREA ${areaId}`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnMemberJoin] Stopping trigger for AREA ${areaId}`.yellow);
        const listener = this.listeners.get(areaId);

        if (listener) {
            await this.eventBus.removeListener('discord.member.join', listener);
            this.listeners.delete(areaId);
        }
        this.botClient.unregisterTrigger(this.getName(), areaId);
        this.isRunning = false;
        console.log(`[OnMemberJoin] ✓ Trigger stopped for AREA ${areaId}`.yellow);
    }
}
