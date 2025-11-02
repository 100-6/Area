import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { TelegramBotClient } from '../TelegramBotClient';
import 'colors';

/**
 * Action: Envoyer un message sur Telegram
 * Envoie un message texte dans un chat spécifique
 */
export class SendMessage extends BaseAction {
    private botClient: TelegramBotClient;

    constructor() {
        super();
        this.botClient = TelegramBotClient.getInstance();
    }

    getName(): string {
        return 'send_message';
    }

    getDescription(): string {
        return 'Send a text message to a Telegram chat';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['chatId', 'text'],
            properties: {
                chatId: {
                    type: 'string',
                    title: 'Chat ID',
                    description: 'The Telegram chat ID where to send the message. To get your chat ID, send /myid to @autoepitechbot on Telegram',
                    pattern: '^(-?[0-9]+|\\{\\{.+\\}\\})$'
                },
                text: {
                    type: 'string',
                    title: 'Message Text',
                    description: 'The text message to send (supports variables)',
                    minLength: 1,
                    maxLength: 4096
                },
                parseMode: {
                    type: 'string',
                    title: 'Parse Mode (optional)',
                    description: 'Text formatting mode',
                    enum: ['None', 'Markdown', 'HTML'],
                    default: 'None'
                },
                replyToMessageId: {
                    type: 'string',
                    title: 'Reply to Message ID (optional)',
                    description: 'Reply to a specific message',
                    pattern: '^([0-9]+|\\{\\{.+\\}\\})$'
                },
                disableWebPagePreview: {
                    type: 'boolean',
                    title: 'Disable Web Page Preview',
                    description: 'Disable link previews for URLs',
                    default: false
                },
                disableNotification: {
                    type: 'boolean',
                    title: 'Silent Message',
                    description: 'Send message silently',
                    default: false
                }
            }
        };
    }

    /**
     * Schéma de sortie de l'action
     * Définit les données retournées après l'exécution
     */
    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                sentMessage: {
                    type: 'object',
                    properties: {
                        id: { type: 'number', description: 'ID of the sent message' },
                        date: { type: 'string', format: 'date-time', description: 'When message was sent' },
                        chatId: { type: 'number', description: 'Chat ID where message was sent' }
                    }
                },
                success: { type: 'boolean', description: 'Whether the message was sent successfully' }
            }
        };
    }

    getRequiredScopes(): string[] {
        return ['bot']; // Nécessite le bot Telegram
    }

    /**
     * Valider la configuration de l'action
     */
    validate(config: ActionConfig): boolean {
        if (!config.chatId) {
            throw new Error('chatId is required');
        }

        if (!config.text) {
            throw new Error('text is required');
        }

        // Vérifier la longueur du texte (max 4096 pour Telegram)
        if (config.text.length < 1 || config.text.length > 4096) {
            throw new Error('Message text must be between 1 and 4096 characters');
        }

        // Valider le parseMode si présent
        if (config.parseMode) {
            const validModes = ['None', 'Markdown', 'HTML'];
            if (!validModes.includes(config.parseMode)) {
                throw new Error(`Invalid parse mode. Must be one of: ${validModes.join(', ')}`);
            }
        }

        return true;
    }

    /**
     * Exécuter l'action
     * @param config - Configuration de l'action
     * @param context - Contexte d'exécution (trigger data, previous outputs)
     * @returns Résultat de l'action
     */
    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            console.log(`[SendMessage] Executing for AREA ${context.areaId}`.cyan);

            // Vérifier que le bot est connecté
            if (!this.botClient.isConnected()) {
                throw new Error('Telegram bot is not connected');
            }

            // Récupérer le service API
            const apiService = this.botClient.getApiService();

            // Remplacer les variables dans chatId et text en utilisant le système centralisé
            const chatId = this.replaceVariables(config.chatId, context, false);
            const text = this.replaceVariables(config.text, context, false);

            // Valider le chatId après remplacement
            const chatIdPattern = /^-?[0-9]+$/;
            if (!chatIdPattern.test(chatId)) {
                throw new Error(`Invalid chat ID after variable replacement: ${chatId}`);
            }

            // Préparer les options
            const options: any = {
                parseMode: config.parseMode || 'None',
                disableWebPagePreview: config.disableWebPagePreview || false,
                disableNotification: config.disableNotification || false
            };

            // Ajouter replyToMessageId si présent
            if (config.replyToMessageId) {
                const replyToId = this.replaceVariables(config.replyToMessageId, context, false);
                const messageIdPattern = /^[0-9]+$/;
                if (!messageIdPattern.test(replyToId)) {
                    throw new Error(`Invalid message ID after variable replacement: ${replyToId}`);
                }
                options.replyToMessageId = parseInt(replyToId, 10);
            }

            // Envoyer le message
            console.log(`[SendMessage] Sending to chat ${chatId}`.gray);
            const sentMessage = await apiService.sendMessage(chatId, text, options);

            const executionTime = Date.now() - startTime;
            console.log(`[SendMessage] ✓ Message sent to chat ${chatId}`.green);

            return {
                success: true,
                data: {
                    sentMessage: {
                        id: sentMessage.message_id,
                        date: new Date(sentMessage.date * 1000).toISOString(),
                        chatId: sentMessage.chat.id
                    },
                    success: true
                },
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[SendMessage] ❌ Failed to send message:`.red, error);

            return {
                success: false,
                error: (error as Error).message,
                executionTime
            };
        }
    }
}
