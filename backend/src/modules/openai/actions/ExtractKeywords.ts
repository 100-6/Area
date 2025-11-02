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
        if (!config.apiKey || !config.apiKey.startsWith('sk-') || config.apiKey.length < 20)
            throw new Error('apiKey is required and must start with "sk-"');
        if (!config.text || config.text.length < 50 || config.text.length > 5000)
            throw new Error('text must be between 50 and 5000 characters');
        if (config.maxKeywords && (config.maxKeywords < 1 || config.maxKeywords > 50))
            throw new Error('maxKeywords must be between 1 and 50');
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            console.log(`[ExtractKeywords] Executing for AREA ${context.areaId}`.cyan);
            const apiKey = config.apiKey;
            if (!apiKey)
                throw new Error('OpenAI API key is required in configuration');
            const text = this.replaceVariables(config.text, context);
            console.log(`[ExtractKeywords] Extracting keywords from ${text.length} characters...`.cyan);
            const result = await this.apiService.extractKeywords(apiKey, text, config.maxKeywords || 10);
            const executionTime = Date.now() - startTime;
            console.log(`[ExtractKeywords] ✓ Extracted ${result.keywordCount} keywords`.green);
            console.log(`[ExtractKeywords] Keywords: ${result.keywords.join(', ')}`.green);
            return {
                success: true,
                data: {
                    keywords: result.keywords,
                    topics: result.topics,
                    keywordCount: result.keywordCount
                },
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[ExtractKeywords] ❌ Failed:`.red, error);
            return {success: false, error: (error as Error).message, executionTime};
        }
    }
}
