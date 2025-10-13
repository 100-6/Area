import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { OpenAIApiService } from '../OpenAIApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

export class ExtractKeywords extends BaseAction {
    private apiService: OpenAIApiService;

    constructor() {
        super();
        this.apiService = OpenAIApiService.getInstance();
    }

    getName(): string {
        return 'extract_keywords';
    }

    getDescription(): string {
        return 'Extract key topics and keywords from text';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['text'],
            properties: {
                text: {
                    type: 'string',
                    title: 'Text',
                    description: 'Text to analyze',
                    minLength: 50,
                    maxLength: 5000
                },
                maxKeywords: {
                    type: 'number',
                    title: 'Max Keywords',
                    description: 'Maximum number of keywords to extract',
                    default: 10,
                    minimum: 1,
                    maximum: 50
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                keywords: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Extracted keywords'
                },
                topics: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Main topics identified'
                },
                keywordCount: {
                    type: 'number',
                    description: 'Number of keywords extracted'
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

        if (!config.text || config.text.length < 50 || config.text.length > 5000) {
            throw new Error('text must be between 50 and 5000 characters');
        }
        if (config.maxKeywords && (config.maxKeywords < 1 || config.maxKeywords > 50)) {
            throw new Error('maxKeywords must be between 1 and 50');
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
            console.log(`[ExtractKeywords] Executing for AREA ${context.areaId}`.cyan);

            // Get API key from config
            const apiKey = config.apiKey;
            if (!apiKey) {
                throw new Error('OpenAI API key is required in configuration');
            }

            const text = this.replaceVariables(config.text, context);

            console.log(`[ExtractKeywords] Extracting keywords from ${text.length} characters...`.cyan);

            const result = await this.apiService.extractKeywords(
                apiKey,
                text,
                config.maxKeywords || 10
            );

            const executionTime = Date.now() - startTime;
            console.log(`[ExtractKeywords] ✓ Extracted ${result.keywordCount} keywords`.green);

            return {
                success: true,
                data: result,
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[ExtractKeywords] ❌ Failed:`.red, error);
            return {
                success: false,
                error: (error as Error).message,
                executionTime
            };
        }
    }
}
