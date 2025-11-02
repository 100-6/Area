import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { OpenAIApiService } from '../OpenAIApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

export class SummarizeText extends BaseAction {
    private apiService: OpenAIApiService;

    constructor() {
        super();
        this.apiService = OpenAIApiService.getInstance();
    }

    getName(): string {
        return 'summarize_text';
    }

    getDescription(): string {
        return 'Create a concise summary of a longer text';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['apiKey', 'text'],
            properties: {
                apiKey: {
                    type: 'string',
                    title: 'OpenAI API Key',
                    description: 'Your OpenAI API key (starts with sk-)',
                    pattern: '^sk-',
                    minLength: 20
                },
                text: {
                    type: 'string',
                    title: 'Text',
                    description: 'Text to summarize',
                    minLength: 100,
                    maxLength: 10000
                },
                length: {
                    type: 'string',
                    title: 'Summary Length',
                    description: 'Desired summary length',
                    enum: ['short', 'medium', 'long'],
                    default: 'medium'
                },
                bulletPoints: {
                    type: 'boolean',
                    title: 'Bullet Points',
                    description: 'Format as bullet points',
                    default: false
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                summary: {
                    type: 'string',
                    description: 'The generated summary'
                },
                originalLength: {
                    type: 'number',
                    description: 'Length of original text'
                },
                summaryLength: {
                    type: 'number',
                    description: 'Length of summary'
                },
                compressionRatio: {
                    type: 'number',
                    description: 'Compression ratio (0-1)'
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
        if (!config.text || config.text.length < 100 || config.text.length > 10000)
            throw new Error('text must be between 100 and 10000 characters');
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            console.log(`[SummarizeText] Executing for AREA ${context.areaId}`.cyan);
            const apiKey = config.apiKey;
            if (!apiKey)
                throw new Error('OpenAI API key is required in configuration');
            const text = this.replaceVariables(config.text, context);
            console.log(`[SummarizeText] Summarizing ${text.length} characters...`.cyan);
            const result = await this.apiService.summarizeText(apiKey, text, config.length || 'medium', config.bulletPoints || false);
            const executionTime = Date.now() - startTime;
            console.log(`[SummarizeText] ✓ Summary created (${(result.compressionRatio * 100).toFixed(1)}% compression)`.green);
            console.log(`[SummarizeText] Original: ${result.originalLength} chars → Summary: ${result.summaryLength} chars`.green);
            return {
                success: true,
                data: {
                    summary: result.summary,
                    originalLength: result.originalLength,
                    summaryLength: result.summaryLength,
                    compressionRatio: result.compressionRatio
                },
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[SummarizeText] ❌ Failed:`.red, error);
            return {success: false, error: (error as Error).message, executionTime};
        }
    }
}
