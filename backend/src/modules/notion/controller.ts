import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../core/middleware/error';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';
import { NotionApiService } from './NotionApiService';
import 'colors';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Controller Notion
 * Gère tous les endpoints liés à Notion
 */
export class NotionController {
    constructor() {}

    /**
     * GET /api/notion/databases
     * Récupère la liste des databases Notion de l'utilisateur
     */
    public getDatabases = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                const error = new Error('User not authenticated') as CustomError;
                error.statusCode = 401;
                return next(error);
            }
            console.log('[Notion Controller] Fetching databases for user:', userId);
            const notionAuth = await UserAuthProvider.findByUserAndProvider(userId, 'notion');
            if (!notionAuth || !notionAuth.access_token) {
                const error = new Error('Notion not connected') as CustomError;
                error.statusCode = 404;
                return next(error);
            }
            const notionApi = new NotionApiService(notionAuth.access_token);
            const searchResult = await notionApi.search(undefined, { property: 'object', value: 'database' });
            console.log('[Notion Controller] Found', searchResult.results.length, 'databases');
            const databases = searchResult.results.map((db: any) => ({
                id: db.id,
                title: db.title.map((t: any) => t.plain_text).join('') || 'Untitled',
                url: db.url,
                created_time: db.created_time,
                last_edited_time: db.last_edited_time,
                icon: db.icon,
                cover: db.cover,
                properties: db.properties
            }));
            res.json({
                success: true,
                count: databases.length,
                databases
            });
        } catch (error: any) {
            console.error('[Notion Controller] Error fetching databases:', error.message);
            if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
                const customError = new Error('Invalid token. Please reconnect your Notion account.') as CustomError;
                customError.statusCode = 401;
                return next(customError);
            }
            next(error);
        }
    });

    /**
     * GET /api/notion/database/:databaseId
     * Récupère les détails d'une database spécifique
     */
    public getDatabase = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            const { databaseId } = req.params;

            if (!userId) {
                const error = new Error('User not authenticated') as CustomError;
                error.statusCode = 401;
                return next(error);
            }
            const notionAuth = await UserAuthProvider.findByUserAndProvider(userId, 'notion');
            if (!notionAuth || !notionAuth.access_token) {
                const error = new Error('Notion not connected') as CustomError;
                error.statusCode = 404;
                return next(error);
            }
            const notionApi = new NotionApiService(notionAuth.access_token);
            const database = await notionApi.getDatabase(databaseId);
            res.json({
                success: true,
                database: {
                    id: database.id,
                    title: database.title.map((t: any) => t.plain_text).join('') || 'Untitled',
                    properties: database.properties
                }
            });
        } catch (error: any) {
            console.error('[Notion Controller] Error fetching database:', error.message);
            if (error.message?.includes('Could not find database')) {
                const customError = new Error('The database does not exist or you don\'t have access to it') as CustomError;
                customError.statusCode = 404;
                return next(customError);
            }
            next(error);
        }
    });

    /**
     * GET /api/notion/pages
     * Récupère les pages d'une database spécifique
     * Query params:
     *  - databaseId: ID of the database to query
     *  - pageSize: Number of results (default: 10, max: 100)
     */
    public getPages = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            const databaseId = req.query.databaseId as string;
            const pageSize = Math.min(parseInt(req.query.pageSize as string) || 10, 100);

            if (!userId) {
                const error = new Error('User not authenticated') as CustomError;
                error.statusCode = 401;
                return next(error);
            }
            if (!databaseId) {
                const error = new Error('Missing databaseId query parameter') as CustomError;
                error.statusCode = 400;
                return next(error);
            }
            const notionAuth = await UserAuthProvider.findByUserAndProvider(userId, 'notion');
            if (!notionAuth || !notionAuth.access_token) {
                const error = new Error('Notion not connected') as CustomError;
                error.statusCode = 404;
                return next(error);
            }
            const notionApi = new NotionApiService(notionAuth.access_token);
            const response = await notionApi.queryDatabase(databaseId, undefined, undefined, pageSize);
            const pages = response.results.map((page: any) => ({
                id: page.id,
                title: NotionApiService.extractTitle(page.properties),
                url: page.url,
                created_time: page.created_time,
                last_edited_time: page.last_edited_time,
                properties: page.properties
            }));
            res.json({
                success: true,
                count: pages.length,
                has_more: response.has_more,
                pages
            });
        } catch (error: any) {
            console.error('[Notion Controller] Error querying pages:', error.message);
            next(error);
        }
    });
}

export default NotionController;
