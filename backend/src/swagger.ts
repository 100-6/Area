import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        title: 'AREA API Documentation',
        description: 'API documentation for AREA - Action-Reaction automation platform',
        version: '1.0.0'
    },
    host: process.env.API_HOST || 'localhost:8080',
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
        {
            name: 'Authentication',
            description: 'User authentication and authorization endpoints'
        },
        {
            name: 'Users',
            description: 'User management endpoints'
        },
        {
            name: 'Areas',
            description: 'AREA (Action-Reaction) management endpoints'
        },
        {
            name: 'Services',
            description: 'Service connection and management endpoints'
        },
        {
            name: 'Modules',
            description: 'Module information endpoints'
        },
        {
            name: 'Discord',
            description: 'Discord integration endpoints'
        },
        {
            name: 'Gmail',
            description: 'Gmail integration endpoints'
        },
        {
            name: 'OpenAI',
            description: 'OpenAI integration endpoints'
        },
        {
            name: 'About',
            description: 'Server information endpoints'
        }
    ],
    securityDefinitions: {
        bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT Authorization header using the Bearer scheme. Example: "Bearer {token}"'
        }
    },
    definitions: {
        User: {
            id: 1,
            email: 'user@example.com',
            username: 'johndoe',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
        },
        Area: {
            id: 1,
            name: 'My First Area',
            description: 'When I receive an email, send a Discord message',
            userId: 1,
            enabled: true,
            actionModuleName: 'gmail',
            actionName: 'on_new_email',
            actionConfig: {},
            reactionModuleName: 'discord',
            reactionName: 'send_message',
            reactionConfig: { channelId: '123456789' },
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
        },
        Service: {
            name: 'discord',
            displayName: 'Discord',
            description: 'Discord integration service',
            icon: 'discord-icon-url',
            authType: 'oauth2',
            actions: [],
            reactions: []
        },
        Error: {
            success: false,
            error: {
                message: 'Error description',
                code: 'ERROR_CODE'
            }
        },
        Success: {
            success: true,
            data: {}
        }
    }
};

const outputFile = './src/swagger-output.json';
const endpointsFiles = [
    './src/core/routes/_index.ts'
];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc);
