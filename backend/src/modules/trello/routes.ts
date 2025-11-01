import { Router, Request, Response } from 'express';
import { requireAuth } from '../../core/middleware/auth';
import { trelloModule } from './service';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';

const router = Router();

router.use(requireAuth);

router.get('/boards', async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    
    try {
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const trelloAuth = await UserAuthProvider.findByUserAndProvider(userId, 'trello');
        if (!trelloAuth || !trelloAuth.access_token) {
            res.status(400).json({ error: 'Trello not connected' });
            return;
        }

        const apiKey = process.env.TRELLO_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: 'TRELLO_API_KEY not configured' });
            return;
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
        res.status(500).json({ 
            error: 'Failed to fetch boards',
            message: error.message 
        });
    }
});

router.get('/boards/:boardId', async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { boardId } = req.params;
    
    try {
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const trelloAuth = await UserAuthProvider.findByUserAndProvider(userId, 'trello');
        if (!trelloAuth || !trelloAuth.access_token) {
            res.status(400).json({ error: 'Trello not connected' });
            return;
        }

        const apiKey = process.env.TRELLO_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: 'TRELLO_API_KEY not configured' });
            return;
        }

        const apiService = trelloModule.getApiService();
        const board = await apiService.getBoard(boardId, apiKey, trelloAuth.access_token);

        res.json({
            success: true,
            board
        });
    } catch (error: any) {
        console.error('[Trello] Error fetching board:', error);
        res.status(500).json({ 
            error: 'Failed to fetch board',
            message: error.message 
        });
    }
});

router.get('/connection', async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    
    try {
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const trelloAuth = await UserAuthProvider.findByUserAndProvider(userId, 'trello');
        if (!trelloAuth || !trelloAuth.access_token) {
            res.json({ 
                connected: false,
                message: 'Trello not connected' 
            });
            return;
        }

        const apiKey = process.env.TRELLO_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: 'TRELLO_API_KEY not configured' });
            return;
        }

        const apiService = trelloModule.getApiService();
        const isValid = await apiService.verifyConnection(apiKey, trelloAuth.access_token);

        res.json({
            connected: isValid,
            message: isValid ? 'Trello connected' : 'Trello connection invalid'
        });
    } catch (error: any) {
        console.error('[Trello] Error verifying connection:', error);
        res.status(500).json({ 
            error: 'Failed to verify connection',
            message: error.message 
        });
    }
});

export default router;
