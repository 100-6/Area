/**
 * Webhook Module Configuration
 * 
 * Defines the module structure with triggers (actions) for receiving webhooks.
 * Similar to ntfy module - simple name-based webhook endpoints.
 */
export default {
    name: 'webhook',
    displayName: 'Webhook',
    description: 'Receive HTTP POST webhooks and trigger workflows',
    iconUrl: 'https://cdn.iconscout.com/icon/free/png-256/free-webhooks-icon-svg-download-png-282425.png',
    color: '#c4c4c4',
    authType: 'none',
    isActive: true,

    /**
     * Triggers (called "actions" in the config structure)
     * These define when a workflow should start
     */
    actions: [
        {
            name: 'webhook_received',
            displayName: 'Webhook Received',
            description: 'Se déclenche quand des données sont reçues sur /api/webhook/{nom-choisi}. Créez votre endpoint personnalisé.',
            triggerType: 'webhook',
            configSchema: {
                type: 'object',
                required: ['webhookName'],
                properties: {
                    webhookName: {
                        type: 'string',
                        title: 'Webhook Name',
                        description: 'Nom unique pour votre endpoint. Sera accessible via POST /api/webhook/{ce-nom} (minuscules, chiffres, tirets et underscores uniquement)',
                        pattern: '^[a-z0-9-_]+$',
                        minLength: 3,
                        maxLength: 50,
                        examples: ['my-sensor', 'temperature_data', 'doorbell-events']
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    receivedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'ISO 8601 timestamp when the webhook was received',
                        examples: ['2025-10-17T14:30:00.000Z']
                    },
                    webhookName: {
                        type: 'string',
                        description: 'Name of the webhook endpoint that received the data',
                        examples: ['temperature-sensor', 'doorbell']
                    },
                    contentType: {
                        type: 'string',
                        description: 'Content-Type header value from the HTTP request',
                        examples: ['application/json', 'application/x-www-form-urlencoded']
                    },
                    body: {
                        type: 'object',
                        description: 'Parsed POST body data (JSON, form-data, or {text: string} for plain text)',
                        additionalProperties: true,
                        examples: [
                            { temperature: 22.5, humidity: 60 },
                            { event: 'button_pressed', device: 'doorbell' },
                            { text: 'Plain text content sent as text/plain or text/html' }
                        ]
                    },
                    text: {
                        type: 'string',
                        description: 'Raw text content (for text/plain or text/html requests). Use {{text}} for direct access to plain text.',
                        examples: ['Hello World', 'Je parles via un webhook listener']
                    },
                    headers: {
                        type: 'object',
                        description: 'Selected HTTP headers from the request',
                        properties: {
                            'user-agent': {
                                type: 'string',
                                description: 'Client user agent string'
                            },
                            'referer': {
                                type: 'string',
                                description: 'HTTP referer header'
                            },
                            'x-forwarded-for': {
                                type: 'string',
                                description: 'Client IP address (when behind proxy)'
                            }
                        }
                    }
                }
            }
        }
    ],

    /**
     * No reactions (actions) needed for webhook module
     * This module only triggers workflows, it doesn't execute actions
     */
    reactions: []
};
