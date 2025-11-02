import { Router } from 'express';
import { requireAuth } from '../../core/middleware/auth';
import { requireNotionAuth } from './middlewareNotion';
import { NotionController } from './controller';
import { NotionOAuthController } from './NotionOAuthController';

/**
 * Routes Notion
 * Prefix: /api/notion
 */
const router = Router();
const controller = new NotionController();
const oauthController = new NotionOAuthController();

/**
 * PUBLIC OAuth routes (no auth required)
 */

/**
 * GET /api/notion/connect
 * Initiate Notion OAuth flow
 * Query params: userId (required)
 */
router.get('/connect', oauthController.authorize);

/**
 * GET /api/notion/callback
 * Handle Notion OAuth callback
 */
router.get('/callback', oauthController.callback);

/**
 * Protected routes (require auth + Notion connection)
 */
router.use(requireAuth);
router.use(requireNotionAuth);

/**
 * GET /api/notion/databases
 * Search for all databases in the user's workspace
 */
router.get('/databases', controller.getDatabases);

/**
 * GET /api/notion/database/:databaseId
 * Get details of a specific database
 */
router.get('/database/:databaseId', controller.getDatabase);

/**
 * GET /api/notion/pages
 * Query pages from a specific database
 * Query params:
 *  - databaseId: ID of the database to query
 *  - pageSize: Number of results (default: 10, max: 100)
 */
router.get('/pages', controller.getPages);

export default router;
