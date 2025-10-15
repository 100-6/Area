/**
 * Configuration du module OpenAI
 * Fournit des actions et triggers pour l'intelligence artificielle
 */
export default {
    name: 'openai',
    displayName: 'OpenAI',
    description: 'AI-powered text generation, analysis, and transformation using GPT models',
    iconUrl: 'https://cdn.worldvectorlogo.com/logos/openai-2.svg',
    color: '#10A37F',
    authType: 'none',
    isActive: true,

    actions: [],

    reactions: [
        {
            name: 'generate_text',
            displayName: 'Generate Text',
            description: 'Generate text content using GPT models based on a prompt',
            
            configSchema: {
                type: 'object',
                required: ['apiKey', 'prompt'],
                properties: {
                    apiKey: {
                        type: 'string',
                        title: 'OpenAI API Key',
                        description: 'Your OpenAI API key (starts with sk-)',
                        minLength: 20,
                        pattern: '^sk-',
                        example: 'sk-...'
                    },
                    prompt: {
                        type: 'string',
                        title: 'Prompt',
                        description: 'The prompt to generate text from',
                        minLength: 1,
                        maxLength: 4000,
                        example: 'Write a creative story about space exploration'
                    },
                    model: {
                        type: 'string',
                        title: 'Model',
                        description: 'GPT model to use',
                        enum: [
                            'gpt-5-pro',
                            'gpt-5',
                            'gpt-5-mini',
                            'gpt-5-nano',
                            'gpt-4.1',
                            'gpt-4.1-mini',
                            'gpt-4.1-nano',
                            'gpt-4o',
                            'gpt-4o-mini',
                            'gpt-4-turbo',
                            'gpt-4',
                            'o4-mini',
                            'o1-preview',
                            'o1-mini'
                        ],
                        default: 'gpt-4o-mini'
                    },
                    maxTokens: {
                        type: 'number',
                        title: 'Max Tokens',
                        description: 'Maximum tokens in the response (uses max_completion_tokens for GPT-5 and o-series)',
                        default: 500,
                        minimum: 1,
                        maximum: 16000
                    },
                    temperature: {
                        type: 'number',
                        title: 'Temperature',
                        description: 'Creativity level (0-2). Not supported by GPT-5 and o-series models - will be ignored.',
                        default: 0.7,
                        minimum: 0,
                        maximum: 2
                    },
                    systemMessage: {
                        type: 'string',
                        title: 'System Message (optional)',
                        description: 'System message to set context (not applicable for o-series reasoning models)',
                        maxLength: 1000,
                        example: 'You are a helpful assistant'
                    }
                }
            },
            
            outputSchema: {
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
            }
        },

        {
            name: 'analyze_sentiment',
            displayName: 'Analyze Sentiment',
            description: 'Analyze the sentiment of a text (positive, negative, neutral)',
            
            configSchema: {
                type: 'object',
                required: ['apiKey', 'text'],
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
                        description: 'Text to analyze',
                        minLength: 1,
                        maxLength: 2000,
                        example: 'I love this product! It works perfectly.'
                    },
                    includeExplanation: {
                        type: 'boolean',
                        title: 'Include Explanation',
                        description: 'Include explanation of the sentiment',
                        default: true
                    }
                }
            },
            
            outputSchema: {
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
            }
        },

        {
            name: 'summarize_text',
            displayName: 'Summarize Text',
            description: 'Create a concise summary of a longer text',
            
            configSchema: {
                type: 'object',
                required: ['apiKey', 'text'],
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
                        description: 'Text to summarize',
                        minLength: 100,
                        maxLength: 10000,
                        example: 'Long article text here...'
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
            },
            
            outputSchema: {
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
            }
        },

        {
            name: 'translate_text',
            displayName: 'Translate Text',
            description: 'Translate text between languages using AI',
            
            configSchema: {
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
                        maxLength: 3000,
                        example: 'Hello, how are you?'
                    },
                    targetLanguage: {
                        type: 'string',
                        title: 'Target Language',
                        description: 'Target language for translation',
                        enum: ['english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'chinese', 'japanese', 'korean', 'russian'],
                        example: 'french'
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
            },
            
            outputSchema: {
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
            }
        },

        {
            name: 'extract_keywords',
            displayName: 'Extract Keywords',
            description: 'Extract key topics and keywords from text',
            
            configSchema: {
                type: 'object',
                required: ['apiKey', 'text'],
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
                        description: 'Text to analyze',
                        minLength: 50,
                        maxLength: 5000,
                        example: 'Article or document text...'
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
            },
            
            outputSchema: {
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
            }
        }
    ]
};
