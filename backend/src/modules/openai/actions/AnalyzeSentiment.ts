import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { OpenAIApiService } from '../OpenAIApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

export class AnalyzeSentiment extends BaseAction {
    private apiService: OpenAIApiService;

    constructor() {
        super();
        this.apiService = OpenAIApiService.getInstance();
    }

    getName(): string {
        return 'analyze_sentiment';
    }

    getDescription(): string {
        return 'Analyze the sentiment of a text (positive, negative, neutral)';
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
                    minLength: 1,
                    maxLength: 2000
                },
                includeExplanation: {
                    type: 'boolean',
                    title: 'Include Explanation',
                    description: 'Include explanation of the sentiment',
                    default: true
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                sentiment: {
                    type: 'string',
                    enum: ['positive', 'negative', 'neutral'],
                    description: 'Detected sentiment'
                },
                score: {
                    type: 'number',
                    description: 'Confidence score (0-1)',
                    minimum: 0,
                    maximum: 1
                },
                explanation: {
                    type: 'string',
                    description: 'Brief explanation of the sentiment'
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
        if (!config.text || config.text.length < 1 || config.text.length > 2000)
            throw new Error('text must be between 1 and 2000 characters');
        return true;
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            console.log(`[AnalyzeSentiment] Executing for AREA ${context.areaId}`.cyan);
            const apiKey = config.apiKey;
            if (!apiKey)
                throw new Error('OpenAI API key is required in configuration');
            const text = this.replaceVariables(config.text, context);
            console.log(`[AnalyzeSentiment] Analyzing sentiment for: "${text.substring(0, 50)}..."`.cyan);
            const result = await this.apiService.analyzeSentiment(apiKey, text, config.includeExplanation !== false);
            const executionTime = Date.now() - startTime;
            console.log(`[AnalyzeSentiment] ✓ Sentiment: ${result.sentiment} (${result.score})`.green);
            if (result.explanation) {
                console.log(`[AnalyzeSentiment] Explanation: ${result.explanation}`.green);
            }
            return {
                success: true,
                data: {
                    sentiment: result.sentiment,
                    score: result.score,
                    explanation: result.explanation
                },
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[AnalyzeSentiment] ❌ Failed:`.red, error);
            return {success: false, error: (error as Error).message, executionTime};
        }
    }
}
