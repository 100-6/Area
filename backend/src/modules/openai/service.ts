import { BaseModule } from '../_base/BaseModule';
import openaiConfig from './config';
import 'colors';

import {
    GenerateText,
    AnalyzeSentiment,
    SummarizeText,
    TranslateText,
    ExtractKeywords
} from './actions/_index';

/**
 * Module OpenAI principal
 * Gère l'intégration avec l'API OpenAI pour génération de texte, analyse, etc.
 */
export class OpenAIModule extends BaseModule {
    constructor() {
        super({
            name: openaiConfig.name,
            displayName: openaiConfig.displayName,
            description: openaiConfig.description,
            iconUrl: openaiConfig.iconUrl,
            color: openaiConfig.color,
            authType: openaiConfig.authType as 'api_key',
            isActive: openaiConfig.isActive
        });
    }

    getName(): string {
        return 'openai';
    }

    /**
     * Initialiser le module OpenAI
     * - Enregistrer les actions
     */
    async initialize(): Promise<void> {
        console.log('[OpenAI] Initializing OpenAI module...'.cyan);

        try {
            // Register all actions
            this.registerAction(new GenerateText());
            this.registerAction(new AnalyzeSentiment());
            this.registerAction(new SummarizeText());
            this.registerAction(new TranslateText());
            this.registerAction(new ExtractKeywords());

            console.log('[OpenAI] ✓ Module initialized successfully'.green.bold);
        } catch (error) {
            console.error('[OpenAI] ❌ Failed to initialize module:'.red, error);
            throw error;
        }
    }

    /**
     * Nettoyer les ressources du module OpenAI
     */
    async cleanup(): Promise<void> {
        console.log('[OpenAI] Cleaning up OpenAI module...'.yellow);

        try {
            console.log('[OpenAI] ✓ Module cleaned up successfully'.green);
        } catch (error) {
            console.error('[OpenAI] ❌ Error during cleanup:'.red, error);
        }
    }
}

/**
 * Export de l'instance du module OpenAI
 */
export const openaiModule = new OpenAIModule();
