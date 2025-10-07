import { Client, GatewayIntentBits, Events, Message, GuildMember, MessageReaction, User, PartialMessageReaction, PartialUser, Partials } from 'discord.js';
import { EventBus } from '../../shared/queue/EventBus';
import 'colors';

/**
 * Client Discord Bot - Singleton
 * Gère la connexion au bot Discord et écoute les événements
 */
export class DiscordBotClient {
    private static instance: DiscordBotClient;
    private client: Client;
    private eventBus: EventBus;
    private isReady: boolean = false;
    private registeredTriggers: Set<string> = new Set();

    private constructor() {
        this.eventBus = EventBus.getInstance();
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.DirectMessages,
            ],
            partials: [
                Partials.Message,
                Partials.Channel,
                Partials.Reaction
            ]
        });
        this.setupEventListeners();
    }

    /**
     * Singleton instance
     */
    public static getInstance(): DiscordBotClient {
        if (!DiscordBotClient.instance)
            DiscordBotClient.instance = new DiscordBotClient();
        return DiscordBotClient.instance;
    }

    /**
     * Configurer les écouteurs d'événements Discord
     */
    private setupEventListeners(): void {
        this.client.once(Events.ClientReady, (client) => {
            this.isReady = true;
            console.log(`[Discord Bot] ✓ Ready! Logged in as ${client.user.tag}`.green.bold);
            console.log(`[Discord Bot] Connected to ${client.guilds.cache.size} server(s)`.cyan);
        });
        this.client.on(Events.MessageCreate, async (message: Message) => {
            if (message.author.bot)
                return;
            await this.handleMessageCreate(message);
        });
        this.client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
            await this.handleMemberJoin(member);
        });
        this.client.on(Events.MessageReactionAdd, async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
            if (user.bot)
                return;
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                } catch (error) {
                    console.error('[Discord Bot] Failed to fetch reaction:'.red, error);
                    return;
                }
            }
            await this.handleReactionAdd(reaction as MessageReaction, user as User);
        });
        this.client.on('error', (error) => {
            console.error('[Discord Bot] Client error:'.red, error);
        });
        this.client.on('warn', (warning) => {
            console.warn('[Discord Bot] Warning:'.yellow, warning);
        });
    }

    /**
     * Handler: Nouveau message
     */
    private async handleMessageCreate(message: Message): Promise<void> {
        try {
            const eventData = {
                messageId: message.id,
                content: message.content,
                authorId: message.author.id,
                authorTag: message.author.tag,
                authorUsername: message.author.username,
                channelId: message.channelId,
                channelName: message.channel.type === 0 ? (message.channel as any).name : 'DM',
                guildId: message.guildId,
                guildName: message.guild?.name,
                timestamp: message.createdAt.toISOString(),
                hasAttachments: message.attachments.size > 0,
                attachments: Array.from(message.attachments.values()).map(a => ({
                    id: a.id,
                    url: a.url,
                    name: a.name,
                    contentType: a.contentType
                })),
                mentionsBot: message.mentions.has(this.client.user!.id),
                mentions: message.mentions.users.map(u => u.id)
            };
            console.log(`[Discord Bot] Message received: "${message.content.substring(0, 50)}..." from ${message.author.tag}`.gray);
            await this.eventBus.emit('discord.message.created', eventData);
        } catch (error) {
            console.error('[Discord Bot] Error handling message:'.red, error);
        }
    }

    /**
     * Handler: Membre rejoint
     */
    private async handleMemberJoin(member: GuildMember): Promise<void> {
        try {
            const eventData = {
                userId: member.id,
                userTag: member.user.tag,
                username: member.user.username,
                guildId: member.guild.id,
                guildName: member.guild.name,
                joinedAt: member.joinedAt?.toISOString(),
                accountCreatedAt: member.user.createdAt.toISOString(),
                isBot: member.user.bot,
                avatarUrl: member.user.displayAvatarURL()
            };
            console.log(`[Discord Bot] Member joined: ${member.user.tag} in ${member.guild.name}`.cyan);
            await this.eventBus.emit('discord.member.join', eventData);
        } catch (error) {
            console.error('[Discord Bot] Error handling member join:'.red, error);
        }
    }

    /**
     * Handler: Réaction ajoutée
     */
    private async handleReactionAdd(reaction: MessageReaction, user: User): Promise<void> {
        try {
            const eventData = {
                emoji: reaction.emoji.name,
                emojiId: reaction.emoji.id,
                emojiAnimated: reaction.emoji.animated,
                messageId: reaction.message.id,
                messageContent: reaction.message.content?.substring(0, 100),
                messageAuthorId: reaction.message.author?.id,
                channelId: reaction.message.channelId,
                guildId: reaction.message.guildId,
                userId: user.id,
                userTag: user.tag,
                username: user.username,
                timestamp: new Date().toISOString()
            };
            console.log(`[Discord Bot] Reaction added: ${reaction.emoji.name} by ${user.tag}`.magenta);
            await this.eventBus.emit('discord.reaction.added', eventData);
        } catch (error) {
            console.error('[Discord Bot] Error handling reaction:'.red, error);
        }
    }

    /**
     * Connecter le bot à Discord
     */
    async connect(): Promise<void> {
        const token = process.env.DISCORD_BOT_TOKEN;
        
        if (!token) {
            console.error('[Discord Bot] ❌ DISCORD_BOT_TOKEN not found in environment variables'.red.bold);
            throw new Error('DISCORD_BOT_TOKEN is required');
        }
        if (this.isReady) {
            console.log('[Discord Bot] Already connected'.yellow);
            return;
        }
        try {
            console.log('[Discord Bot] Connecting to Discord Gateway...'.cyan);
            await this.client.login(token);
        } catch (error) {
            console.error('[Discord Bot] ❌ Failed to connect:'.red, error);
            throw error;
        }
    }

    /**
     * Obtenir le client Discord
     */
    getClient(): Client {
        return this.client;
    }

    /**
     * Vérifier si le bot est connecté
     */
    isConnected(): boolean {
        return this.isReady;
    }

    /**
     * Déconnecter le bot
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.destroy();
            this.isReady = false;
            console.log('[Discord Bot] Disconnected'.yellow);
        }
    }

    /**
     * Enregistrer un trigger actif
     */
    registerTrigger(triggerName: string, areaId: string): void {
        const key = `${triggerName}:${areaId}`;
        this.registeredTriggers.add(key);
        console.log(`[Discord Bot] Trigger registered: ${key}`.green);
    }

    /**
     * Désenregistrer un trigger
     */
    unregisterTrigger(triggerName: string, areaId: string): void {
        const key = `${triggerName}:${areaId}`;
        this.registeredTriggers.delete(key);
        console.log(`[Discord Bot] Trigger unregistered: ${key}`.yellow);
    }

    /**
     * Vérifier si un trigger est enregistré
     */
    isTriggerRegistered(triggerName: string, areaId: string): boolean {
        const key = `${triggerName}:${areaId}`;
        return this.registeredTriggers.has(key);
    }
}

export default DiscordBotClient;
