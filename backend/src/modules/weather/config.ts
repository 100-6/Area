export default {
    name: 'weather',
    displayName: 'Weather',
    description: 'Retrieve live weather information and forecasts from Open-Meteo',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/869/869869.png',
    color: '#4C9EDA',
    authType: 'none',
    isActive: true,

    actions: [],

    reactions: [
        {
            name: 'get_current_weather',
            displayName: 'Get Current Weather',
            description: 'Fetch current weather conditions and optional forecast data',
            configSchema: {
                type: 'object',
                required: ['latitude', 'longitude'],
                properties: {
                    latitude: {
                        type: 'number',
                        title: 'Latitude',
                        description: 'Latitude of the location',
                        minimum: -90,
                        maximum: 90,
                        example: 48.8566
                    },
                    longitude: {
                        type: 'number',
                        title: 'Longitude',
                        description: 'Longitude of the location',
                        minimum: -180,
                        maximum: 180,
                        example: 2.3522
                    },
                    timezone: {
                        type: 'string',
                        title: 'Timezone',
                        description: 'Timezone to use for formatted timestamps',
                        default: 'auto',
                        example: 'Europe/Paris'
                    },
                    hourlyMetrics: {
                        type: 'array',
                        title: 'Hourly metrics',
                        description: 'List of hourly metrics to include in the response',
                        items: { type: 'string' },
                        default: ['temperature_2m', 'relative_humidity_2m'],
                        example: ['temperature_2m', 'relative_humidity_2m']
                    },
                    dailyMetrics: {
                        type: 'array',
                        title: 'Daily metrics',
                        description: 'List of daily metrics to include in the response',
                        items: { type: 'string' },
                        default: ['temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max'],
                        example: ['temperature_2m_max', 'temperature_2m_min']
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    location: {
                        type: 'object',
                        properties: {
                            latitude: { type: 'number' },
                            longitude: { type: 'number' },
                            timezone: { type: 'string' },
                            elevation: {
                                anyOf: [
                                    { type: 'number' },
                                    { type: 'null' }
                                ]
                            }
                        }
                    },
                    current: {
                        anyOf: [
                            {
                                type: 'object',
                                properties: {
                                    time: {
                                        anyOf: [
                                            { type: 'string' },
                                            { type: 'null' }
                                        ]
                                    },
                                    temperature: {
                                        anyOf: [
                                            { type: 'number' },
                                            { type: 'null' }
                                        ]
                                    },
                                    temperatureUnit: {
                                        anyOf: [
                                            { type: 'string' },
                                            { type: 'null' }
                                        ]
                                    },
                                    windspeed: {
                                        anyOf: [
                                            { type: 'number' },
                                            { type: 'null' }
                                        ]
                                    },
                                    windspeedUnit: {
                                        anyOf: [
                                            { type: 'string' },
                                            { type: 'null' }
                                        ]
                                    },
                                    winddirection: {
                                        anyOf: [
                                            { type: 'number' },
                                            { type: 'null' }
                                        ]
                                    },
                                    winddirectionUnit: {
                                        anyOf: [
                                            { type: 'string' },
                                            { type: 'null' }
                                        ]
                                    },
                                    weathercode: {
                                        anyOf: [
                                            { type: 'number' },
                                            { type: 'null' }
                                        ]
                                    },
                                    weathercodeUnit: {
                                        anyOf: [
                                            { type: 'string' },
                                            { type: 'null' }
                                        ]
                                    }
                                }
                            },
                            { type: 'null' }
                        ]
                    },
                    hourly: {
                        anyOf: [
                            {
                                type: 'object',
                                properties: {
                                    entries: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                time: { type: 'string' },
                                                metrics: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            name: { type: 'string' },
                                                            value: {
                                                                anyOf: [
                                                                    { type: 'number' },
                                                                    { type: 'string' },
                                                                    { type: 'null' }
                                                                ]
                                                            },
                                                            unit: {
                                                                anyOf: [
                                                                    { type: 'string' },
                                                                    { type: 'null' }
                                                                ]
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            { type: 'null' }
                        ]
                    },
                    daily: {
                        anyOf: [
                            {
                                type: 'object',
                                properties: {
                                    entries: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                time: { type: 'string' },
                                                metrics: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            name: { type: 'string' },
                                                            value: {
                                                                anyOf: [
                                                                    { type: 'number' },
                                                                    { type: 'string' },
                                                                    { type: 'null' }
                                                                ]
                                                            },
                                                            unit: {
                                                                anyOf: [
                                                                    { type: 'string' },
                                                                    { type: 'null' }
                                                                ]
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            { type: 'null' }
                        ]
                    }
                }
            }
        }
    ]
};
