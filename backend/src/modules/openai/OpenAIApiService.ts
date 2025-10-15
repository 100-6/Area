import axios, { AxiosInstance } from 'axios';
import 'colors';

/**
 * Service pour interagir avec l'API OpenAI
 * Gère les appels à l'API GPT, modération, embeddings, etc.
 */
export class OpenAIApiService {
    private static instance: OpenAIApiService;
    private apiClient: AxiosInstance;

    private constructor() {
        this.apiClient = axios.create({
            baseURL: 'https://api.openai.com/v1',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 60000 // 60 seconds timeout
        });
    }

    /**
     * Obtenir l'instance singleton
     */
    public static getInstance(): OpenAIApiService {
        if (!OpenAIApiService.instance) {
            OpenAIApiService.instance = new OpenAIApiService();
        }
        return OpenAIApiService.instance;
    }

    /**
     * Configurer l'API key pour les requêtes
     */
    private getAuthHeaders(apiKey: string): Record<string, string> {
        return {
            'Authorization': `Bearer ${apiKey}`
        };
    }

    /**
     * Check if model is a reasoning model (o-series)
     * Reasoning models have different parameter requirements
     */
    private isReasoningModel(model: string): boolean {
        return model.startsWith('o1-') || model.startsWith('o3-') || model.startsWith('o4-');
    }

    /**
     * Check if model supports system messages
     * Some models like reasoning models don't support system messages
     */
    private supportsSystemMessage(model: string): boolean {
        return !this.isReasoningModel(model);
    }

    /**
     * Check if model uses max_completion_tokens instead of max_tokens
     * GPT-5 and o-series use max_completion_tokens
     */
    private usesCompletionTokens(model: string): boolean {
        return model.startsWith('gpt-5') || this.isReasoningModel(model);
    }

    /**
     * Check if model supports temperature parameter
     * GPT-5 and reasoning models (o-series) don't support custom temperature
     */
    private supportsTemperature(model: string): boolean {
        return !this.isReasoningModel(model) && !model.startsWith('gpt-5');
    }

    /**
     * Générer du texte avec GPT
     */
    async generateText(
        apiKey: string,
        prompt: string,
        options: {
            model?: string;
            maxTokens?: number;
            temperature?: number;
            systemMessage?: string;
        } = {}
    ): Promise<{
        text: string;
        tokensUsed: number;
        model: string;
        finishReason: string;
    }> {
        try {
            const model = options.model || 'gpt-4o-mini';
            const messages: any[] = [];

            // System messages are not supported for reasoning models
            if (options.systemMessage && this.supportsSystemMessage(model)) {
                messages.push({
                    role: 'system',
                    content: options.systemMessage
                });
            }

            messages.push({
                role: 'user',
                content: prompt
            });

            // Build request body based on model capabilities
            const requestBody: any = {
                model,
                messages
            };

            // Handle token limits based on model
            if (this.usesCompletionTokens(model)) {
                // GPT-5 and o-series use max_completion_tokens
                if (options.maxTokens) {
                    requestBody.max_completion_tokens = options.maxTokens;
                }
            } else {
                // Standard models use max_tokens
                requestBody.max_tokens = options.maxTokens || 500;
            }

            // Temperature only for non-reasoning models and non-GPT-5 models
            if (this.supportsTemperature(model) && options.temperature !== undefined) {
                requestBody.temperature = options.temperature;
            }

            const response = await this.apiClient.post(
                '/chat/completions',
                requestBody,
                {
                    headers: this.getAuthHeaders(apiKey)
                }
            );

            const choice = response.data.choices[0];

            return {
                text: choice.message.content,
                tokensUsed: response.data.usage.total_tokens,
                model: response.data.model,
                finishReason: choice.finish_reason
            };
        } catch (error: any) {
            console.error('[OpenAI] Error generating text:'.red, error.response?.data || error.message);
            throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    /**
     * Analyser le sentiment d'un texte
     */
    async analyzeSentiment(
        apiKey: string,
        text: string,
        includeExplanation: boolean = true
    ): Promise<{
        sentiment: 'positive' | 'negative' | 'neutral';
        score: number;
        explanation?: string;
    }> {
        try {
            const prompt = includeExplanation
                ? `Analyze the sentiment of the following text and provide: 1) sentiment (positive/negative/neutral), 2) confidence score (0-1), 3) brief explanation.

Text: "${text}"

Respond in JSON format: {"sentiment": "...", "score": 0.0, "explanation": "..."}`
                : `Analyze the sentiment of the following text. Respond with only: {"sentiment": "positive/negative/neutral", "score": 0.0}

Text: "${text}"`;

            const response = await this.generateText(apiKey, prompt, {
                model: 'gpt-4o-mini',  // Use gpt-4o-mini as it supports temperature
                maxTokens: 150,
                temperature: 0.3,
                systemMessage: 'You are a sentiment analysis expert. Always respond with valid JSON.'
            });

            // Parse the JSON response
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid response format from OpenAI');
            }

            const result = JSON.parse(jsonMatch[0]);

            return {
                sentiment: result.sentiment.toLowerCase(),
                score: parseFloat(result.score),
                explanation: includeExplanation ? result.explanation : undefined
            };
        } catch (error: any) {
            console.error('[OpenAI] Error analyzing sentiment:'.red, error.message);
            throw new Error(`Sentiment analysis failed: ${error.message}`);
        }
    }

    /**
     * Résumer un texte
     */
    async summarizeText(
        apiKey: string,
        text: string,
        length: 'short' | 'medium' | 'long' = 'medium',
        bulletPoints: boolean = false
    ): Promise<{
        summary: string;
        originalLength: number;
        summaryLength: number;
        compressionRatio: number;
    }> {
        try {
            const lengthInstructions = {
                short: 'in 2-3 sentences',
                medium: 'in 1 paragraph (4-6 sentences)',
                long: 'in 2-3 paragraphs'
            };

            const format = bulletPoints ? 'as bullet points' : 'as a paragraph';
            const prompt = `Summarize the following text ${lengthInstructions[length]} ${format}:

${text}`;

            const response = await this.generateText(apiKey, prompt, {
                model: 'gpt-4o-mini',  // Use gpt-4o-mini as it supports temperature
                maxTokens: length === 'short' ? 100 : length === 'medium' ? 200 : 400,
                temperature: 0.5
            });

            const summary = response.text.trim();
            const originalLength = text.length;
            const summaryLength = summary.length;
            const compressionRatio = summaryLength / originalLength;

            return {
                summary,
                originalLength,
                summaryLength,
                compressionRatio: parseFloat(compressionRatio.toFixed(2))
            };
        } catch (error: any) {
            console.error('[OpenAI] Error summarizing text:'.red, error.message);
            throw new Error(`Text summarization failed: ${error.message}`);
        }
    }

    /**
     * Traduire un texte
     */
    async translateText(
        apiKey: string,
        text: string,
        targetLanguage: string,
        sourceLanguage: string = 'auto',
        formalTone: boolean = false
    ): Promise<{
        translatedText: string;
        detectedLanguage: string;
        targetLanguage: string;
    }> {
        try {
            const toneInstruction = formalTone ? 'Use formal tone.' : 'Use natural, conversational tone.';
            const sourceInstruction = sourceLanguage === 'auto'
                ? 'Detect the source language and'
                : `From ${sourceLanguage},`;

            const prompt = `${sourceInstruction} translate the following text to ${targetLanguage}. ${toneInstruction}

Text: "${text}"

Respond in JSON format: {"translatedText": "...", "detectedLanguage": "..."}`;

            const response = await this.generateText(apiKey, prompt, {
                model: 'gpt-4o-mini',  // Use gpt-4o-mini as it supports temperature
                maxTokens: Math.min(text.length * 2, 2000),
                temperature: 0.3,
                systemMessage: 'You are a professional translator. Always respond with valid JSON.'
            });

            // Parse the JSON response
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid response format from OpenAI');
            }

            const result = JSON.parse(jsonMatch[0]);

            return {
                translatedText: result.translatedText,
                detectedLanguage: result.detectedLanguage || sourceLanguage,
                targetLanguage
            };
        } catch (error: any) {
            console.error('[OpenAI] Error translating text:'.red, error.message);
            throw new Error(`Translation failed: ${error.message}`);
        }
    }

    /**
     * Extraire les mots-clés d'un texte
     */
    async extractKeywords(
        apiKey: string,
        text: string,
        maxKeywords: number = 10
    ): Promise<{
        keywords: string[];
        topics: string[];
        keywordCount: number;
    }> {
        try {
            const prompt = `Extract the top ${maxKeywords} keywords and main topics from the following text. Respond in JSON format:

Text: "${text}"

Format: {"keywords": ["keyword1", "keyword2", ...], "topics": ["topic1", "topic2", ...]}`;

            const response = await this.generateText(apiKey, prompt, {
                model: 'gpt-4o-mini',  // Use gpt-4o-mini as it supports temperature
                maxTokens: 300,
                temperature: 0.3,
                systemMessage: 'You are a text analysis expert. Always respond with valid JSON.'
            });

            // Parse the JSON response
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid response format from OpenAI');
            }

            const result = JSON.parse(jsonMatch[0]);

            return {
                keywords: result.keywords.slice(0, maxKeywords),
                topics: result.topics || [],
                keywordCount: result.keywords.length
            };
        } catch (error: any) {
            console.error('[OpenAI] Error extracting keywords:'.red, error.message);
            throw new Error(`Keyword extraction failed: ${error.message}`);
        }
    }

    /**
     * Vérifier si l'API key est valide
     */
    async validateApiKey(apiKey: string): Promise<boolean> {
        try {
            await this.apiClient.get('/models', {
                headers: this.getAuthHeaders(apiKey)
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}
