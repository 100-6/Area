export default {
    name: 'crypto',
    displayName: 'Cryptocurrency',
    description: 'Get real-time cryptocurrency prices and market data from CoinGecko API',
    iconUrl: 'https://static.coingecko.com/s/coingecko-logo-8903d34ce19ca4be1c81f0db30e924154750d208683fad7ae6f2ce06c76d0a56.png',
    color: '#8DC63F',
    authType: 'none',
    isActive: true,

    actions: [],

    reactions: [
        {
            name: 'get_price_snapshot',
            displayName: 'Get Crypto Price',
            description: 'Get current price and 24h change for a cryptocurrency',
            configSchema: {
                type: 'object',
                required: ['coinId', 'vsCurrency'],
                properties: {
                    coinId: {
                        type: 'string',
                        title: 'Cryptocurrency',
                        description: 'CoinGecko ID (e.g., bitcoin, ethereum, cardano)',
                        example: 'bitcoin'
                    },
                    vsCurrency: {
                        type: 'string',
                        title: 'Currency',
                        description: 'Target currency (e.g., usd, eur, btc)',
                        default: 'usd',
                        example: 'usd'
                    },
                    includeMarketCap: {
                        type: 'boolean',
                        title: 'Include Market Cap',
                        description: 'Include market capitalization data',
                        default: true
                    },
                    includeVolume: {
                        type: 'boolean',
                        title: 'Include 24h Volume',
                        description: 'Include 24-hour trading volume',
                        default: true
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    coinId: {
                        type: 'string',
                        description: 'Cryptocurrency ID (e.g., bitcoin)'
                    },
                    coinName: {
                        type: 'string',
                        description: 'Cryptocurrency name (e.g., Bitcoin)'
                    },
                    currency: {
                        type: 'string',
                        description: 'Target currency (e.g., USD)'
                    },
                    price: {
                        type: 'number',
                        description: 'Current price'
                    },
                    priceFormatted: {
                        type: 'string',
                        description: 'Formatted price (e.g., "$50,000.00")'
                    },
                    change24h: {
                        type: 'number',
                        description: '24-hour price change percentage'
                    },
                    change24hFormatted: {
                        type: 'string',
                        description: 'Formatted 24h change (e.g., "+5.2%" or "-3.1%")'
                    },
                    marketCap: {
                        type: 'number',
                        description: 'Market capitalization'
                    },
                    marketCapFormatted: {
                        type: 'string',
                        description: 'Formatted market cap (e.g., "$1.2T" or "$50.5B")'
                    },
                    volume24h: {
                        type: 'number',
                        description: '24-hour trading volume'
                    },
                    volume24hFormatted: {
                        type: 'string',
                        description: 'Formatted 24h volume (e.g., "$25.3B")'
                    },
                    lastUpdatedAt: {
                        type: 'string',
                        description: 'Last update timestamp (ISO 8601)'
                    }
                }
            }
        }
    ]
};
