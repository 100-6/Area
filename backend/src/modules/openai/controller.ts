import { Request, Response, NextFunction } from 'express';
import { OpenAIApiService } from './OpenAIApiService';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';
import { asyncHandler } from '../../core/middleware/error';
import 'colors';

/**
 * Controller OpenAI
 * Gère tous les endpoints liés à OpenAI
 */
export class OpenAIController {
    private apiService: OpenAIApiService;

    constructor() {
        this.apiService = OpenAIApiService.getInstance();
    }

    /**
     * GET /api/openai/status
     * Vérifie si l'utilisateur a configuré une clé API OpenAI
     */
    public getStatus = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const authProvider = await UserAuthProvider.findByUserAndProvider(userId, 'openai');

        if (!authProvider || !authProvider.provider_data?.apiKey) {
            res.json({
                connected: false,
                hasApiKey: false
            });
            return;
        }

        // Optionally validate the API key
        const isValid = await this.apiService.validateApiKey(authProvider.provider_data.apiKey);

        res.json({
            connected: true,
            hasApiKey: true,
            apiKeyValid: isValid
        });
    });

    /**
     * POST /api/openai/connect
     * Enregistre la clé API OpenAI de l'utilisateur
     */
    public connect = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userId = req.user?.id;
        const { apiKey } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!apiKey || !apiKey.startsWith('sk-')) {
            res.status(400).json({ error: 'Invalid API key format' });
            return;
        }

        try {
            // Validate API key
            const isValid = await this.apiService.validateApiKey(apiKey);

            if (!isValid) {
                res.status(400).json({ error: 'Invalid API key' });
                return;
            }

            // Store API key
            await UserAuthProvider.createOrUpdate({
                user_id: userId,
                provider: 'openai',
                provider_user_id: 'openai',
                provider_data: { apiKey }
            });

            console.log(`[OpenAI] User ${userId} connected successfully`.green);

            res.json({
                success: true,
                message: 'OpenAI API key saved successfully'
            });
        } catch (error) {
            console.error('[OpenAI] Error connecting user:'.red, error);
            next(error);
        }
    });

    /**
     * POST /api/openai/disconnect
     * Supprime la clé API OpenAI de l'utilisateur
     */
    public disconnect = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        try {
            const authProvider = await UserAuthProvider.findByUserAndProvider(userId, 'openai');

            if (authProvider) {
                // Update to clear the API key
                await UserAuthProvider.createOrUpdate({
                    user_id: userId,
                    provider: 'openai',
                    provider_user_id: 'openai',
                    provider_data: {}
                });
            }

            console.log(`[OpenAI] User ${userId} disconnected`.yellow);

            res.json({
                success: true,
                message: 'OpenAI API key removed successfully'
            });
        } catch (error) {
            console.error('[OpenAI] Error disconnecting user:'.red, error);
            next(error);
        }
    });

    /**
     * GET /api/openai/models
     * Retourne la liste des modèles disponibles
     */
    public getModels = asyncHandler(async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const models = [
            {
                id: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                description: 'Fast and efficient, best for most tasks',
                contextWindow: 16385,
                costPer1kTokens: { input: 0.0005, output: 0.0015 }
            },
            {
                id: 'gpt-4',
                name: 'GPT-4',
                description: 'Most capable model, best for complex tasks',
                contextWindow: 8192,
                costPer1kTokens: { input: 0.03, output: 0.06 }
            },
            {
                id: 'gpt-4-turbo',
                name: 'GPT-4 Turbo',
                description: 'Faster GPT-4 with larger context window',
                contextWindow: 128000,
                costPer1kTokens: { input: 0.01, output: 0.03 }
            }
        ];

        res.json({ models });
    });
}
