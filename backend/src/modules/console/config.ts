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
                        description: 'Le message à afficher',
                        example: 'Hello from AREA!'
                    },
                    level: {
                        type: 'string',
                        description: 'Niveau de log',
                        enum: ['info', 'warn', 'error', 'success'],
                        default: 'info'
                    }
                }
            }
        }
    ]
};
