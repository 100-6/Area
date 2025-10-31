export default {
    name: 'currency',
    displayName: 'Currency Exchange',
    description: 'Convert amounts and fetch exchange rates using Frankfurter API (free, no API key)',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/743/743131.png',
    color: '#198754',
    authType: 'none',
    isActive: true,

    actions: [],

    reactions: [
        {
            name: 'convert_amount',
            displayName: 'Convert Amount',
            description: 'Convert an amount between two currencies using live or historical FX rates (Frankfurter API)',
            configSchema: {
                type: 'object',
                required: ['amount', 'fromCurrency', 'toCurrency'],
                properties: {
                    amount: {
                        type: 'number',
                        title: 'Amount',
                        description: 'Amount to convert',
                        example: 100.5
                    },
                    fromCurrency: {
                        type: 'string',
                        title: 'From currency',
                        description: 'Source currency (ISO 4217 code)',
                        example: 'USD'
                    },
                    toCurrency: {
                        type: 'string',
                        title: 'To currency',
                        description: 'Target currency (ISO 4217 code)',
                        example: 'EUR'
                    },
                    date: {
                        type: 'string',
                        title: 'Historical date',
                        description: 'Optional historical date (YYYY-MM-DD)',
                        pattern: '^\\d{4}-\\d{2}-\\d{2}$'
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    amount: { type: 'number' },
                    fromCurrency: { type: 'string' },
                    toCurrency: { type: 'string' },
                    convertedAmount: {
                        anyOf: [
                            { type: 'number' },
                            { type: 'null' }
                        ]
                    },
                    rate: {
                        anyOf: [
                            { type: 'number' },
                            { type: 'null' }
                        ]
                    },
                    date: {
                        anyOf: [
                            { type: 'string' },
                            { type: 'null' }
                        ]
                    }
                }
            }
        }
    ]
};
