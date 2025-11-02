import { Router, Request, Response } from 'express';
import { requireAuth } from '../../core/middleware/auth';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';
import { NotionApiService } from './NotionApiService';
import { NotionOAuthController } from './NotionOAuthController';

/**
 * Routes Notion
 * Prefix: /api/notion
 */
const router = Router();
const oauthController = new NotionOAuthController();

/**
 * PUBLIC OAuth routes (no auth required)
 */

/**
 * GET /api/notion/authorize
 * Initiate Notion OAuth flow
 * Query params: userId (required)
 */
router.get('/authorize', oauthController.authorize);

/**
 * GET /api/notion/callback
 * Handle Notion OAuth callback
 */
router.get('/callback', oauthController.callback);

/**
 * Protected routes (require auth)
 */
router.use(requireAuth);

/**
 * GET /api/notion/databases
 * Search for all databases in the user's workspace
 */
router.get('/databases', async (req: Request, res: Response) => {
    const userId = req.user?.id;
    
    try {
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        console.log('[Notion Route] Fetching databases for user:', userId);

        // Get user's Notion auth
        const notionAuth = await UserAuthProvider.findByUserAndProvider(userId, 'notion');

        if (!notionAuth) {
            console.log('[Notion Route] No Notion auth found for user:', userId);
            return res.status(404).json({ 
                error: 'Notion not connected',
                message: 'Please connect your Notion account first' 
            });
        }

        if (!notionAuth.access_token) {
            console.log('[Notion Route] No access token found');
            return res.status(400).json({ 
                error: 'No access token found',
                message: 'Notion connection is invalid' 
            });
        }

        // Call Notion API to search for databases
        const notionApi = new NotionApiService(notionAuth.access_token);
        const searchResult = await notionApi.search(undefined, { property: 'object', value: 'database' });

        console.log('[Notion Route] Found', searchResult.results.length, 'databases');

        // Format the results for frontend
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

        return res.json({
            success: true,
            count: databases.length,
            databases
        });
    } catch (error: any) {
        console.error('[Notion API Route] Error fetching databases:', error.message);
        
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            return res.status(401).json({ 
                error: 'Invalid token',
                message: 'Your Notion token is invalid. Please reconnect.'
            });
        }
        
        return res.status(500).json({ 
            error: 'Failed to fetch databases',
            message: error.message 
        });
    }
});

/**
 * GET /api/notion/database/:databaseId
 * Get details of a specific database
 */
router.get('/database/:databaseId', async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { databaseId } = req.params;
    
    try {
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const notionAuth = await UserAuthProvider.findByUserAndProvider(userId, 'notion');

        if (!notionAuth || !notionAuth.access_token) {
            return res.status(404).json({ 
                error: 'Notion not connected',
                message: 'Please connect your Notion account first' 
            });
        }

        const notionApi = new NotionApiService(notionAuth.access_token);
        const database = await notionApi.getDatabase(databaseId);

        return res.json({
            success: true,
            database: {
                id: database.id,
                title: database.title.map(t => t.plain_text).join('') || 'Untitled',
                properties: database.properties
            }
        });
    } catch (error: any) {
        console.error('[Notion API Route] Error fetching database:', error.message);
        
        if (error.message?.includes('Could not find database')) {
            return res.status(404).json({ 
                error: 'Database not found',
                message: 'The database does not exist or you don\'t have access to it'
            });
        }
        
        return res.status(500).json({ 
            error: 'Failed to fetch database',
            message: error.message 
        });
    }
});

/**
 * GET /api/notion/pages
 * Query pages from a specific database
 * Query params:
 *  - databaseId: ID of the database to query
 *  - pageSize: Number of results (default: 10, max: 100)
 */
router.get('/pages', async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const databaseId = req.query.databaseId as string;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 10, 100);
    
    try {
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!databaseId) {
            return res.status(400).json({ 
                error: 'Missing databaseId',
                message: 'Please provide a databaseId query parameter'
            });
        }

        const notionAuth = await UserAuthProvider.findByUserAndProvider(userId, 'notion');

        if (!notionAuth || !notionAuth.access_token) {
            return res.status(404).json({ 
                error: 'Notion not connected',
                message: 'Please connect your Notion account first' 
            });
        }

        const notionApi = new NotionApiService(notionAuth.access_token);
        const response = await notionApi.queryDatabase(databaseId, undefined, undefined, pageSize);

        // Format pages for frontend
        const pages = response.results.map((page: any) => ({
            id: page.id,
            title: NotionApiService.extractTitle(page.properties),
            url: page.url,
            created_time: page.created_time,
            last_edited_time: page.last_edited_time,
            properties: page.properties
        }));

        return res.json({
            success: true,
            count: pages.length,
            has_more: response.has_more,
            pages
        });
    } catch (error: any) {
        console.error('[Notion API Route] Error querying pages:', error.message);
        
        return res.status(500).json({ 
            error: 'Failed to query pages',
            message: error.message 
        });
    }
});

/**
 * GET /api/notion/debug
 * Debug endpoint to verify Notion connection
 */
router.get('/debug', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const notionAuth = await UserAuthProvider.findByUserAndProvider(userId, 'notion');

        if (!notionAuth) {
            return res.status(404).json({ 
                error: 'Notion not connected',
                message: 'Please connect your Notion account first' 
            });
        }

        if (!notionAuth.access_token) {
            return res.status(400).json({ 
                error: 'No access token found',
                message: 'Notion connection is invalid' 
            });
        }

        // Verify token by getting current user
        const notionApi = new NotionApiService(notionAuth.access_token);
        const user = await notionApi.getCurrentUser();

        return res.json({
            success: true,
            connected: true,
            user: {
                id: user.id,
                name: user.name || 'Unknown',
                avatar_url: user.avatar_url
            },
            tokenPrefix: notionAuth.access_token.substring(0, 15) + '...'
        });
    } catch (error: any) {
        console.error('[Notion API Route] Error in debug:', error.message);
        return res.status(500).json({ 
            error: 'Debug failed',
            message: error.message 
        });
    }
});

export default router;
