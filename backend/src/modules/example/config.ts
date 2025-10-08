/**
 * Module exemple qui montre comment utiliser le système d'outputs
 * 
 * Un module peut retourner des valeurs qui seront disponibles
 * dans les actions suivantes via context.previousOutputs
 */
export default {
    name: 'news',
    displayName: 'News Fetcher',
    description: 'Récupère des articles de news depuis différentes sources',
    iconUrl: '/icons/news.png',
    color: '#4CAF50',
    authType: 'none',
    isActive: true,

    actions: [],

    reactions: [
        {
            name: 'fetch_article',
            displayName: 'Récupérer un article',
            description: 'Récupère un article de news et expose ses données (titre, body, auteur, etc.)',
            
            configSchema: {
                type: 'object',
                required: ['source', 'category'],
                properties: {
                    source: {
                        type: 'string',
                        description: 'Source de l\'article',
                        enum: ['tech', 'sports', 'politics', 'entertainment'],
                        example: 'tech'
                    },
                    category: {
                        type: 'string',
                        description: 'Catégorie spécifique',
                        example: 'ai'
                    }
                }
            },
            
            // ✨ Nouveau : outputSchema définit les valeurs retournées
            // Ces valeurs seront disponibles dans context.previousOutputs pour les actions suivantes
            outputSchema: {
                type: 'object',
                properties: {
                    title: {
                        type: 'string',
                        description: 'Titre de l\'article'
                    },
                    body: {
                        type: 'string',
                        description: 'Contenu de l\'article'
                    },
                    author: {
                        type: 'string',
                        description: 'Auteur de l\'article'
                    },
                    publishedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Date de publication'
                    },
                    url: {
                        type: 'string',
                        format: 'uri',
                        description: 'URL de l\'article'
                    },
                    imageUrl: {
                        type: 'string',
                        format: 'uri',
                        description: 'URL de l\'image de l\'article'
                    },
                    tags: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Tags associés à l\'article'
                    }
                }
            }
        },
        
        {
            name: 'format_article',
            displayName: 'Formater un article',
            description: 'Formate un article récupéré dans un template personnalisé',
            
            configSchema: {
                type: 'object',
                required: ['template'],
                properties: {
                    template: {
                        type: 'string',
                        description: 'Template de formatage (utilise {{title}}, {{body}}, {{author}}, etc.)',
                        example: '📰 {{title}}\n\nPar {{author}}\n\n{{body}}\n\n🔗 {{url}}'
                    },
                    // ✨ Les actions peuvent accéder aux outputs des actions précédentes
                    // via context.previousOutputs[nodeId]
                    includeImage: {
                        type: 'boolean',
                        description: 'Inclure l\'image dans le formatage',
                        default: false
                    }
                }
            },
            
            // Cette action peut aussi retourner des valeurs
            outputSchema: {
                type: 'object',
                properties: {
                    formattedText: {
                        type: 'string',
                        description: 'Texte formaté'
                    },
                    length: {
                        type: 'number',
                        description: 'Longueur du texte formaté'
                    }
                }
            }
        },
        
        {
            name: 'send_notification',
            displayName: 'Envoyer une notification',
            description: 'Envoie une notification avec le contenu d\'un article',
            
            configSchema: {
                type: 'object',
                required: ['message'],
                properties: {
                    message: {
                        type: 'string',
                        description: 'Message de la notification (peut utiliser {{title}}, {{formattedText}}, etc.)',
                        example: 'Nouvel article: {{title}}'
                    },
                    // Exemple d'utilisation conditionnelle basée sur les outputs précédents
                    minLength: {
                        type: 'number',
                        description: 'Longueur minimale du texte formaté pour envoyer',
                        default: 0
                    }
                }
            }
        }
    ]
};
