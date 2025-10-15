import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { OpenAIApiService } from '../OpenAIApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

export class TranslateText extends BaseAction {
    private apiService: OpenAIApiService;

    constructor() {
        super();
        this.apiService = OpenAIApiService.getInstance();
    }

    getName(): string {
        return 'translate_text';
    }

    getDescription(): string {
        return 'Translate text between languages using AI';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['text', 'targetLanguage'],
            properties: {
                text: {
                    type: 'string',
                    title: 'Text',
                    description: 'Text to translate',
                    minLength: 1,
                    maxLength: 3000
                },
                targetLanguage: {
                    type: 'string',
                    title: 'Target Language',
                    description: 'Target language for translation',
                    enum: ['english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'chinese', 'japanese', 'korean', 'russian']
                },
                sourceLanguage: {
                    type: 'string',
                    title: 'Source Language (optional)',
                    description: 'Source language (auto-detect if not specified)',
                    enum: ['auto', 'english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'chinese', 'japanese', 'korean', 'russian'],
                    default: 'auto'
                },
                formalTone: {
                    type: 'boolean',
                    title: 'Formal Tone',
                    description: 'Use formal tone in translation',
                    default: false
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                translatedText: {
                    type: 'string',
                    description: 'The translated text'
                },
                detectedLanguage: {
                    type: 'string',
                    description: 'Detected source language'
                },
                targetLanguage: {
                    type: 'string',
                    description: 'Target language used'
                }
            }
        };
    }

    getRequiredScopes(): string[] {
        return [];
    }

    validate(config: ActionConfig): boolean {
        if (!config.apiKey || !config.apiKey.startsWith('sk-') || config.apiKey.length < 20)
            throw new Error('apiKey is required and must start with "sk-"');
        if (!config.text || config.text.length < 1 || config.text.length > 3000)
            throw new Error('text must be between 1 and 3000 characters');
        if (!config.targetLanguage)
            throw new Error('targetLanguage is required');
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            console.log(`[TranslateText] Executing for AREA ${context.areaId}`.cyan);
            const apiKey = config.apiKey;
            if (!apiKey)
                throw new Error('OpenAI API key is required in configuration');
            const text = this.replaceVariables(config.text, context);
            console.log(`[TranslateText] Translating to ${config.targetLanguage}...`.cyan);
            const result = await this.apiService.translateText(apiKey, text, config.targetLanguage, config.sourceLanguage || 'auto', config.formalTone || false);
            const executionTime = Date.now() - startTime;
            console.log(`[TranslateText] ✓ Translated from ${result.detectedLanguage} to ${result.targetLanguage}`.green);
            return {success: true, data: result, executionTime};
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[TranslateText] ❌ Failed:`.red, error);
            return {success: false, error: (error as Error).message, executionTime};
        }
    }
}
