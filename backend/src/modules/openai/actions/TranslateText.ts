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
            required: ['apiKey', 'text', 'targetLanguage'],
            properties: {
                apiKey: {
                    type: 'string',
                    title: 'OpenAI API Key',
                    description: 'Your OpenAI API key (starts with sk-)',
                    minLength: 20,
                    pattern: '^sk-',
                    example: 'sk-...'
                },
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
        if (!config.apiKey || !config.apiKey.startsWith('sk-') || config.apiKey.length < 20) {
            throw new Error('apiKey is required and must start with "sk-"');
        }

        if (!config.text || config.text.length < 1 || config.text.length > 3000) {
            throw new Error('text must be between 1 and 3000 characters');
        }
        if (!config.targetLanguage) {
            throw new Error('targetLanguage is required');
        }
        return true;
    }

    private replaceVariables(text: string, context: ActionContext): string {
        let result = text;
        if (context.triggerData) {
            const flatData = this.flattenObject(context.triggerData);
            for (const [key, value] of Object.entries(flatData)) {
                if (value !== null && value !== undefined) {
                    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
                }
            }
        }
        if (context.previousOutputs) {
            for (const [nodeId, output] of Object.entries(context.previousOutputs)) {
                const flatOutput = this.flattenObject(output, nodeId);
                for (const [key, value] of Object.entries(flatOutput)) {
                    if (value !== null && value !== undefined) {
                        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
                    }
                }
            }
        }
        return result;
    }

    private flattenObject(obj: any, prefix = ''): Record<string, any> {
        let flattened: Record<string, any> = {};
        for (const key in obj) {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(flattened, this.flattenObject(value, newKey));
            } else {
                flattened[newKey] = value;
            }
        }
        return flattened;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            console.log(`[TranslateText] Executing for AREA ${context.areaId}`.cyan);

            // Get API key from config
            const apiKey = config.apiKey;
            if (!apiKey) {
                throw new Error('OpenAI API key is required in configuration');
            }

            const text = this.replaceVariables(config.text, context);

            console.log(`[TranslateText] Translating to ${config.targetLanguage}...`.cyan);

            const result = await this.apiService.translateText(
                apiKey,
                text,
                config.targetLanguage,
                config.sourceLanguage || 'auto',
                config.formalTone || false
            );

            const executionTime = Date.now() - startTime;
            console.log(`[TranslateText] ✓ Translated from ${result.detectedLanguage} to ${result.targetLanguage}`.green);

            return {
                success: true,
                data: result,
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[TranslateText] ❌ Failed:`.red, error);
            return {
                success: false,
                error: (error as Error).message,
                executionTime
            };
        }
    }
}
