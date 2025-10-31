import axios from 'axios';
import { BaseAction, ActionConfig, ActionContext, ActionResult } from '../../_base/BaseAction';

interface WeatherActionConfig extends ActionConfig {
    latitude: number | string;
    longitude: number | string;
    timezone?: string;
    hourlyMetrics?: string[];
    dailyMetrics?: string[];
}

interface TimelineMetric {
    name: string;
    value: number | string | null;
    unit: string | null;
}

interface TimelineEntry {
    time: string;
    metrics: TimelineMetric[];
}

export class GetCurrentWeather extends BaseAction {
    getName(): string {
        return 'get_current_weather';
    }

    getDescription(): string {
        return 'Fetch current weather conditions and optional forecast information from Open-Meteo.';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['latitude', 'longitude'],
            properties: {
                latitude: {
                    type: 'number',
                    title: 'Latitude',
                    description: 'Latitude of the location (-90 to 90)',
                    minimum: -90,
                    maximum: 90
                },
                longitude: {
                    type: 'number',
                    title: 'Longitude',
                    description: 'Longitude of the location (-180 to 180)',
                    minimum: -180,
                    maximum: 180
                },
                timezone: {
                    type: 'string',
                    title: 'Timezone',
                    description: 'Timezone identifier, or "auto" to infer from coordinates',
                    default: 'auto'
                },
                hourlyMetrics: {
                    type: 'array',
                    title: 'Hourly metrics',
                    description: 'List of hourly metrics to include (e.g., temperature_2m)',
                    items: { type: 'string' }
                },
                dailyMetrics: {
                    type: 'array',
                    title: 'Daily metrics',
                    description: 'List of daily metrics to include (e.g., temperature_2m_max)',
                    items: { type: 'string' }
                }
            }
        };
    }

    getOutputSchema(): any {
        return {
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
        };
    }

    getRequiredScopes(): string[] {
        return [];
    }

    validate(config: ActionConfig): boolean {
        const cfg = config as WeatherActionConfig;

        const latitude = Number(cfg.latitude);
        const longitude = Number(cfg.longitude);

        if (Number.isNaN(latitude) || latitude < -90 || latitude > 90)
            throw new Error('latitude is required and must be between -90 and 90');
        if (Number.isNaN(longitude) || longitude < -180 || longitude > 180)
            throw new Error('longitude is required and must be between -180 and 180');

        if (cfg.hourlyMetrics && !Array.isArray(cfg.hourlyMetrics))
            throw new Error('hourlyMetrics must be an array of strings');
        if (cfg.dailyMetrics && !Array.isArray(cfg.dailyMetrics))
            throw new Error('dailyMetrics must be an array of strings');

        return true;
    }

    private buildTimelineEntries(
        dataSegment: Record<string, any> | undefined,
        unitMap: Record<string, string> | undefined,
        timeKey: string = 'time'
    ): TimelineEntry[] {
        if (!dataSegment || !Array.isArray(dataSegment[timeKey]))
            return [];

        const timeValues: string[] = dataSegment[timeKey];

        return timeValues.map((timestamp, index) => {
            const metrics: TimelineMetric[] = Object.entries(dataSegment)
                .filter(([key, values]) => key !== timeKey && Array.isArray(values))
                .map(([key, values]) => {
                    const value = values[index];
                    const numericValue = typeof value === 'number' ? value : typeof value === 'string' ? value : null;
                    return {
                        name: key,
                        value: numericValue,
                        unit: unitMap?.[key] ?? null
                    };
                });

            return {
                time: timestamp,
                metrics
            };
        });
    }

    async execute(config: ActionConfig, context: ActionContext): Promise<ActionResult> {
        const resolvedConfig = this.replaceVariablesInConfig(config, context) as WeatherActionConfig;
        this.validate(resolvedConfig);

        const latitude = Number(resolvedConfig.latitude);
        const longitude = Number(resolvedConfig.longitude);
        const timezone = resolvedConfig.timezone || 'auto';
        const hourlyMetrics =
            Array.isArray(resolvedConfig.hourlyMetrics) && resolvedConfig.hourlyMetrics.length > 0
                ? resolvedConfig.hourlyMetrics
                : ['temperature_2m', 'relative_humidity_2m'];
        const dailyMetrics =
            Array.isArray(resolvedConfig.dailyMetrics) && resolvedConfig.dailyMetrics.length > 0
                ? resolvedConfig.dailyMetrics
                : ['temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max'];

        const params: Record<string, any> = {
            latitude,
            longitude,
            current_weather: true,
            timezone
        };

        if (hourlyMetrics.length > 0)
            params.hourly = hourlyMetrics.join(',');
        if (dailyMetrics.length > 0)
            params.daily = dailyMetrics.join(',');

        try {
            const response = await axios.get('https://api.open-meteo.com/v1/forecast', { params });
            const data = response.data;

            const currentWeather = data.current_weather
                ? {
                      time: data.current_weather.time ?? null,
                      temperature: data.current_weather.temperature ?? null,
                      temperatureUnit: data.current_weather_units?.temperature ?? null,
                      windspeed: data.current_weather.windspeed ?? null,
                      windspeedUnit: data.current_weather_units?.windspeed ?? null,
                      winddirection: data.current_weather.winddirection ?? null,
                      winddirectionUnit: data.current_weather_units?.winddirection ?? null,
                      weathercode: data.current_weather.weathercode ?? null,
                      weathercodeUnit: data.current_weather_units?.weathercode ?? null
                  }
                : null;

            const hourlyEntries = this.buildTimelineEntries(data.hourly, data.hourly_units);
            const dailyEntries = this.buildTimelineEntries(data.daily, data.daily_units);

            const resultPayload = {
                location: {
                    latitude: data.latitude ?? latitude,
                    longitude: data.longitude ?? longitude,
                    timezone: data.timezone ?? timezone,
                    elevation: data.elevation ?? null
                },
                current: currentWeather,
                hourly: { entries: hourlyEntries },
                daily: { entries: dailyEntries }
            };

            return {
                success: true,
                data: resultPayload
            };
        } catch (error: any) {
            const message = error?.response?.data?.reason || error?.message || 'Unable to fetch weather data';
            throw new Error(message);
        }
    }
}
