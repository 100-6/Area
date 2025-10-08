export default {
    name: 'console',
    displayName: 'Console Logger',
    description: 'Service pour logger des messages dans la console du serveur (dev only)',
    iconUrl: '/icons/console.png',
    color: '#6C757D',
    authType: 'none',
    isActive: true,

    actions: [],

    reactions: [
        {
            name: 'log',
            displayName: 'Log dans la console',
            description: 'Affiche un message dans la console du serveur',
            configSchema: {
                type: 'object',
                required: ['message'],
                properties: {
                    message: {
                        type: 'string',
                        description: 'Le message à afficher (peut utiliser {{key}} pour accéder aux outputs précédents)',
                        example: 'Hello from AREA! Title: {{title}}'
                    },
                    level: {
                        type: 'string',
                        description: 'Niveau de log',
                        enum: ['info', 'warn', 'error', 'success'],
                        default: 'info'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    message: {
                        type: 'string',
                        description: 'Message affiché (après résolution des placeholders)'
                    },
                    level: {
                        type: 'string',
                        description: 'Niveau de log utilisé'
                    }
                }
            }
        }
    ]
};
