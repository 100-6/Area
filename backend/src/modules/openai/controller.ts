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
                id: 'gpt-5-pro',
                name: 'GPT-5 Pro',
                description: 'The smartest and most precise model',
                contextWindow: 128000,
                costPer1kTokens: { input: 15.00, output: 120.00 },
                category: 'flagship'
            },
            {
                id: 'gpt-5',
                name: 'GPT-5',
                description: 'Best model for coding and agentic tasks across industries',
                contextWindow: 128000,
                costPer1kTokens: { input: 1.25, output: 10.00 },
                category: 'flagship'
            },
            {
                id: 'gpt-5-mini',
                name: 'GPT-5 Mini',
                description: 'Faster, cheaper version of GPT-5 for well-defined tasks',
                contextWindow: 128000,
                costPer1kTokens: { input: 0.25, output: 2.00 },
                category: 'flagship'
            },
            {
                id: 'gpt-5-nano',
                name: 'GPT-5 Nano',
                description: 'Fastest, cheapest version of GPT-5—great for summarization and classification',
                contextWindow: 128000,
                costPer1kTokens: { input: 0.05, output: 0.40 },
                category: 'flagship'
            },
            {
                id: 'gpt-4.1',
                name: 'GPT-4.1',
                description: 'Advanced GPT-4.1 model with fine-tuning support',
                contextWindow: 128000,
                costPer1kTokens: { input: 3.00, output: 12.00 },
                category: 'advanced'
            },
            {
                id: 'gpt-4.1-mini',
                name: 'GPT-4.1 Mini',
                description: 'Smaller, faster GPT-4.1 variant',
                contextWindow: 128000,
                costPer1kTokens: { input: 0.80, output: 3.20 },
                category: 'advanced'
            },
            {
                id: 'gpt-4.1-nano',
                name: 'GPT-4.1 Nano',
                description: 'Most efficient GPT-4.1 variant',
                contextWindow: 128000,
                costPer1kTokens: { input: 0.20, output: 0.80 },
                category: 'advanced'
            },
            {
                id: 'gpt-4o',
                name: 'GPT-4o',
                description: 'GPT-4 Omni - multimodal flagship model',
                contextWindow: 128000,
                costPer1kTokens: { input: 2.50, output: 10.00 },
                category: 'standard'
            },
            {
                id: 'gpt-4o-mini',
                name: 'GPT-4o Mini',
                description: 'Affordable and intelligent small model for fast, lightweight tasks',
                contextWindow: 128000,
                costPer1kTokens: { input: 0.15, output: 0.60 },
                category: 'standard'
            },
            {
                id: 'gpt-4-turbo',
                name: 'GPT-4 Turbo',
                description: 'Faster GPT-4 with larger context window',
                contextWindow: 128000,
                costPer1kTokens: { input: 10.00, output: 30.00 },
                category: 'legacy'
            },
            {
                id: 'gpt-4',
                name: 'GPT-4',
                description: 'Most capable GPT-4 model',
                contextWindow: 8192,
                costPer1kTokens: { input: 30.00, output: 60.00 },
                category: 'legacy'
            },
            {
                id: 'o4-mini',
                name: 'o4 Mini',
                description: 'Reasoning model for complex, multi-step problems (no temperature/system message)',
                contextWindow: 128000,
                costPer1kTokens: { input: 4.00, output: 16.00 },
                category: 'reasoning',
                notes: 'Does not support temperature or system messages. Uses max_completion_tokens.'
            },
            {
                id: 'o1-preview',
                name: 'o1 Preview',
                description: 'Advanced reasoning model for complex tasks (no temperature/system message)',
                contextWindow: 128000,
                costPer1kTokens: { input: 15.00, output: 60.00 },
                category: 'reasoning',
                notes: 'Does not support temperature or system messages. Uses max_completion_tokens.'
            },
            {
                id: 'o1-mini',
                name: 'o1 Mini',
                description: 'Faster reasoning model for STEM tasks (no temperature/system message)',
                contextWindow: 128000,
                costPer1kTokens: { input: 3.00, output: 12.00 },
                category: 'reasoning',
                notes: 'Does not support temperature or system messages. Uses max_completion_tokens.'
            }
        ];

        res.json({ models });
    });
}
