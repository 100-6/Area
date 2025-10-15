import { Request, Response, NextFunction } from 'express';
import { TelegramBotClient } from './TelegramBotClient';
import { telegramModule } from './service';
import { asyncHandler } from '../../core/middleware/error';
import 'colors';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Controller Telegram
 * Gère tous les endpoints liés à Telegram
 */
export class TelegramController {
    private botClient: TelegramBotClient;

    constructor() {
        this.botClient = TelegramBotClient.getInstance();
    }

    /**
     * GET /api/telegram/bot/status
     * Retourne le statut du bot
     */
    public getBotStatus = asyncHandler(async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const isConnected = this.botClient.isConnected();

        if (isConnected) {
            const botInfo = this.botClient.getBotInfo();
            res.json({
                connected: true,
                username: botInfo.username,
                firstName: botInfo.first_name,
                id: botInfo.id,
                canJoinGroups: botInfo.can_join_groups,
                canReadAllGroupMessages: botInfo.can_read_all_group_messages,
                supportsInlineQueries: botInfo.supports_inline_queries
            });
        } else {
            res.json({ connected: false });
        }
    });

    /**
     * GET /api/telegram/bot/info
     * Retourne les informations complètes du bot et les instructions pour obtenir son chat ID
     */
    public getBotInfo = asyncHandler(async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const botInfo = await telegramModule.getBotInfo();
            res.json({
                bot: {
                    id: botInfo.id,
                    username: botInfo.username,
                    first_name: botInfo.first_name,
                    can_join_groups: botInfo.can_join_groups,
                    can_read_all_group_messages: botInfo.can_read_all_group_messages
                },
                how_to_get_chat_id: {
                    step1: `Open Telegram and search for @${botInfo.username}`,
                    step2: "Send the command: /start",
                    step3: "Send the command: /myid",
                    step4: "The bot will reply with your chat ID",
                    note: "For groups: Add the bot to your group and send /myid in the group"
                }
            });
        } catch (error) {
            const err = error as Error;
            if (err.message === 'TELEGRAM_BOT_NOT_CONNECTED') {
                const customError = new Error('Telegram bot is not connected') as CustomError;
                customError.statusCode = 503;
                return next(customError);
            }
            next(error);
        }
    });

    /**
     * POST /api/telegram/test-message
     * Envoie un message de test
     */
    public sendTestMessage = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { chatId, text } = req.body;

            if (!chatId) {
                const error = new Error('chatId is required') as CustomError;
                error.statusCode = 400;
                return next(error);
            }

            if (!text) {
                const error = new Error('text is required') as CustomError;
                error.statusCode = 400;
                return next(error);
            }

            const sentMessage = await telegramModule.sendTestMessage(chatId, text);
            res.json({
                success: true,
                message: sentMessage
            });
        } catch (error) {
            const err = error as Error;
            if (err.message === 'TELEGRAM_BOT_NOT_CONNECTED') {
                const customError = new Error('Telegram bot is not connected') as CustomError;
                customError.statusCode = 503;
                return next(customError);
            }
            next(error);
        }
    });

    /**
     * POST /api/telegram/validate-token
     * Valide un token de bot Telegram
     */
    public validateBotToken = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { botToken } = req.body;

            if (!botToken) {
                const error = new Error('botToken is required') as CustomError;
                error.statusCode = 400;
                return next(error);
            }

            const isValid = await telegramModule.validateBotToken(botToken);
            res.json({
                valid: isValid
            });
        } catch (error) {
            next(error);
        }
    });
}

export default TelegramController;
