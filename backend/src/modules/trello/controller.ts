import { Request, Response, NextFunction } from 'express';
import { trelloModule } from './service';
import { asyncHandler } from '../../core/middleware/error';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';
import 'colors';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Controller Trello
 * Gère tous les endpoints liés à Trello
 */
export class TrelloController {
    constructor() {}

    /**
     * GET /api/trello/boards
     * Récupère la liste des boards Trello de l'utilisateur
     */
    public getBoards = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                const error = new Error('User not authenticated') as CustomError;
                error.statusCode = 401;
                return next(error);
            }
            const trelloAuth = await UserAuthProvider.findByUserAndProvider(userId, 'trello');
            if (!trelloAuth || !trelloAuth.access_token) {
                const error = new Error('Trello not connected') as CustomError;
                error.statusCode = 400;
                return next(error);
            }
            const apiKey = process.env.TRELLO_API_KEY;
            if (!apiKey) {
                const error = new Error('TRELLO_API_KEY not configured') as CustomError;
                error.statusCode = 500;
                return next(error);
            }
            const apiService = trelloModule.getApiService();
            const boards = await apiService.getBoards(apiKey, trelloAuth.access_token);
            res.json({
                success: true,
                count: boards.length,
                boards
            });
        } catch (error: any) {
            console.error('[Trello] Error fetching boards:', error);
            next(error);
        }
    });

    /**
     * GET /api/trello/boards/:boardId
     * Récupère un board spécifique
     */
    public getBoard = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            const { boardId } = req.params;

            if (!userId) {
                const error = new Error('User not authenticated') as CustomError;
                error.statusCode = 401;
                return next(error);
            }
            const trelloAuth = await UserAuthProvider.findByUserAndProvider(userId, 'trello');
            if (!trelloAuth || !trelloAuth.access_token) {
                const error = new Error('Trello not connected') as CustomError;
                error.statusCode = 400;
                return next(error);
            }
            const apiKey = process.env.TRELLO_API_KEY;
            if (!apiKey) {
                const error = new Error('TRELLO_API_KEY not configured') as CustomError;
                error.statusCode = 500;
                return next(error);
            }
            const apiService = trelloModule.getApiService();
            const board = await apiService.getBoard(boardId, apiKey, trelloAuth.access_token);
            res.json({
                success: true,
                board
            });
        } catch (error: any) {
            console.error('[Trello] Error fetching board:', error);
            next(error);
        }
    });

}

export default TrelloController;
