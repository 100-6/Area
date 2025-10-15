import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';
import { OpenAIApiService } from '../OpenAIApiService';
import { UserAuthProvider } from '../../../core/models/UserAuthProvider';
import 'colors';

/**
 * Action: Générer du texte avec OpenAI GPT
 */
export class GenerateText extends BaseAction {
    private apiService: OpenAIApiService;

    constructor() {
        super();
        this.apiService = OpenAIApiService.getInstance();
    }

    getName(): string {
        return 'generate_text';
    }

    getDescription(): string {
        return 'Generate text content using GPT models based on a prompt';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['prompt'],
            properties: {
                prompt: {
                    type: 'string',
                    title: 'Prompt',
                    description: 'The prompt to generate text from',
                    minLength: 1,
                    maxLength: 4000
                },
                model: {
                    type: 'string',
                    title: 'Model',
                    description: 'GPT model to use',
                    enum: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
                    default: 'gpt-3.5-turbo'
                },
                maxTokens: {
                    type: 'number',
                    title: 'Max Tokens',
                    description: 'Maximum tokens in the response',
                    default: 500,
                    minimum: 1,
                    maximum: 4000
                },
                temperature: {
                    type: 'number',
                    title: 'Temperature',
                    description: 'Creativity level (0-2)',
                    default: 0.7,
                    minimum: 0,
                    maximum: 2
                },
                systemMessage: {
                    type: 'string',
                    title: 'System Message (optional)',
                    description: 'System message to set context',
                    maxLength: 1000
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
            type: 'object',
            properties: {
                generatedText: {
                    type: 'string',
                    description: 'The generated text content'
                },
                tokensUsed: {
                    type: 'number',
                    description: 'Number of tokens used'
                },
                model: {
                    type: 'string',
                    description: 'Model used for generation'
                },
                finishReason: {
                    type: 'string',
                    description: 'Why generation stopped (stop, length, etc.)'
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
        if (!config.prompt || config.prompt.length < 1 || config.prompt.length > 4000)
            throw new Error('prompt must be between 1 and 4000 characters');
        if (config.maxTokens && (config.maxTokens < 1 || config.maxTokens > 4000))
            throw new Error('maxTokens must be between 1 and 4000');
        if (config.temperature && (config.temperature < 0 || config.temperature > 2))
            throw new Error('temperature must be between 0 and 2');
        return true;
    }


    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            console.log(`[GenerateText] Executing for AREA ${context.areaId}`.cyan);
            const apiKey = config.apiKey;
            if (!apiKey)
                throw new Error('OpenAI API key is required in configuration');
            const prompt = this.replaceVariables(config.prompt, context);
            const systemMessage = config.systemMessage ? this.replaceVariables(config.systemMessage, context) : undefined;
            console.log(`[GenerateText] Generating text with prompt: "${prompt.substring(0, 50)}..."`.cyan);
            const result = await this.apiService.generateText(
                apiKey,
                prompt,
                {model: config.model || 'gpt-3.5-turbo', maxTokens: config.maxTokens || 500, temperature: config.temperature || 0.7, systemMessage}
            );
            const executionTime = Date.now() - startTime;
            console.log(`[GenerateText] ✓ Text generated successfully (${result.tokensUsed} tokens)`.green);
            console.log(`[GenerateText] Model: ${result.model}, Finish Reason: ${result.finishReason}`.green);
            console.log(`[GenerateText] Response: "${result.text.substring(0, 100)}..."`.green);
            return {
                success: true,
                data: {
                    generatedText: result.text,
                    tokensUsed: result.tokensUsed,
                    model: result.model,
                    finishReason: result.finishReason
                },
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`[GenerateText] ❌ Failed to generate text:`.red, error);
            return {success: false, error: (error as Error).message, executionTime};
        }
    }
}
