import { BaseTrigger, TriggerConfig, TriggerPayload } from '../../_base/BaseTrigger';
import { SlackApiService } from '../service';
import { Area } from '../../../core/models/Area';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Interface pour stocker l'état des réactions d'un message
 */
interface MessageReactionState {
    messageTs: string;
    reactions: Map<string, Set<string>>; // emoji -> Set of user IDs
}

/**
 * Trigger qui se déclenche quand une réaction est ajoutée à un message
 * Utilise le polling pour vérifier les nouvelles réactions
 */
export class OnReactionAddedTrigger extends BaseTrigger {
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
    private messageReactionsState: Map<string, Map<string, MessageReactionState>> = new Map(); // areaId -> messageTs -> state

    getName(): string {
        return 'on_reaction_added';
    }

    getType(): 'webhook' | 'polling' | 'schedule' {
        return 'polling';
    }

    getDescription(): string {
        return 'Triggers when a reaction emoji is added to a message';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['channelId'],
            properties: {
                channelId: { type: 'string', minLength: 1 },
                emoji: { type: 'string' },
                ignoreBots: { type: 'boolean', default: true },
                pollingInterval: { type: 'number', default: 30000 }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                messageId: { type: 'string' },
                messageText: { type: 'string' },
                channelId: { type: 'string' },
                userId: { type: 'string' },
                username: { type: 'string' },
                emoji: { type: 'string' },
                timestamp: { type: 'string' }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        if (!config.channelId || config.channelId.trim() === '')
            throw new Error('Channel ID is required');
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        console.log(`[OnReactionAdded] Starting trigger for AREA ${areaId}`.cyan);

        if (this.pollingIntervals.has(areaId)) {
            console.log(`[OnReactionAdded] Trigger already running for AREA ${areaId}`.yellow);
            return;
        }
        this.validate(config);
        this.isRunning = true;
        this.messageReactionsState.set(areaId, new Map());
        await this.initializeReactionStates(areaId, config);
        const pollingInterval = config.pollingInterval || 30000;
        const interval = setInterval(async () => {
            await this.checkForReactions(areaId, config);
        }, pollingInterval);
        this.pollingIntervals.set(areaId, interval);
        console.log(`[OnReactionAdded] Trigger started for AREA ${areaId}`.green);
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[OnReactionAdded] Stopping trigger for AREA ${areaId}`.cyan);
        const interval = this.pollingIntervals.get(areaId);

        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(areaId);
            this.messageReactionsState.delete(areaId);
        }
        this.isRunning = false;
        console.log(`[OnReactionAdded] Trigger stopped for AREA ${areaId}`.green);
    }

    /**
     * Initialiser l'état des réactions pour éviter de déclencher sur les réactions existantes
     */
    private async initializeReactionStates(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area)
                return;
            const slackConnection = await UserAuthProvider.findByUserAndProvider(area.user_id, 'slack');
            if (!slackConnection || !slackConnection.access_token)
                return;
            const accessToken = slackConnection.access_token;
            const messages = await SlackApiService.getChannelHistory(accessToken, config.channelId, 50);
            const areaState = this.messageReactionsState.get(areaId)!;
            for (const message of messages) {
                try {
                    const { reactions } = await SlackApiService.getMessageReactions(
                        accessToken,
                        config.channelId,
                        message.ts
                    );
                    const reactionsMap = new Map<string, Set<string>>();
                    for (const reaction of reactions)
                        reactionsMap.set(reaction.name, new Set(reaction.users));
                    areaState.set(message.ts, {
                        messageTs: message.ts,
                        reactions: reactionsMap
                    });
                } catch (error) {
                }
            }

            console.log(`[OnReactionAdded] Initialized with ${areaState.size} message(s) state`.gray);
        } catch (error) {
            console.error(`[OnReactionAdded] Error initializing:`.red, error);
        }
    }

    /**
     * Vérifier s'il y a de nouvelles réactions
     */
    private async checkForReactions(areaId: string, config: TriggerConfig): Promise<void> {
        try {
            const area = await Area.findById(areaId);

            if (!area)
                return;
            const slackConnection = await UserAuthProvider.findByUserAndProvider(area.user_id, 'slack');
            if (!slackConnection || !slackConnection.access_token)
                return;
            const accessToken = slackConnection.access_token;
            const areaState = this.messageReactionsState.get(areaId);
            if (!areaState)
                return;
            const messages = await SlackApiService.getChannelHistory(
                accessToken,
                config.channelId,
                50
            );
            console.log(`[OnReactionAdded] Checking ${messages.length} message(s) for new reactions`.gray);
            for (const message of messages) {
                try {
                    const { reactions, message: fullMessage } = await SlackApiService.getMessageReactions(
                        accessToken,
                        config.channelId,
                        message.ts
                    );
                    const previousState = areaState.get(message.ts);
                    const currentReactions = new Map<string, Set<string>>();
                    for (const reaction of reactions)
                        currentReactions.set(reaction.name, new Set(reaction.users));
                    for (const [emoji, users] of currentReactions) {
                        if (config.emoji && emoji !== config.emoji)
                            continue;
                        const previousUsers = previousState?.reactions.get(emoji) || new Set<string>();
                        for (const userId of users) {
                            if (!previousUsers.has(userId)) {
                                if (config.ignoreBots !== false) {
                                    if (fullMessage.bot_id || userId.startsWith('B'))
                                        continue;
                                }
                                console.log(`[OnReactionAdded] New reaction detected: :${emoji}: by ${userId} on message ${message.ts}`.green);
                                let username = userId;
                                try {
                                    const userInfo = await SlackApiService.getUserInfo(accessToken, userId);
                                    username = userInfo.real_name || userInfo.name || userId;
                                } catch (error) {
                                    console.error(`[OnReactionAdded] Error fetching user info:`.yellow, error);
                                }
                                const payload: TriggerPayload = {
                                    areaId: areaId,
                                    triggerName: this.getName(),
                                    triggerType: this.getType(),
                                    timestamp: new Date().toISOString(),
                                    data: {
                                        messageId: message.ts,
                                        messageText: fullMessage.text || '',
                                        channelId: config.channelId,
                                        userId: userId,
                                        username: username,
                                        emoji: emoji
                                    }
                                };
                                await this.emitTrigger(payload);
                            }
                        }
                    }
                    areaState.set(message.ts, {
                        messageTs: message.ts,
                        reactions: currentReactions
                    });
                } catch (error) {
                    console.error(`[OnReactionAdded] Error checking message ${message.ts}:`.yellow, error);
                }
            }
            if (areaState.size > 100) {
                const sortedMessages = Array.from(areaState.keys()).sort((a, b) => parseFloat(b) - parseFloat(a));
                const toDelete = sortedMessages.slice(100);
                for (const ts of toDelete)
                    areaState.delete(ts);
            }
        } catch (error) {
            console.error(`[OnReactionAdded] Error checking for reactions:`.red, error);
        }
    }
}
