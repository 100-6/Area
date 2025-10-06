export default {
    name: 'timer',
    displayName: 'Timer / Scheduler',
    description: 'Déclenche des actions selon un horaire',
    iconUrl: '/icons/timer.png',
    color: '#FF6B6B',
    authType: 'none',
    isActive: true,

    // Les timers sont des triggers, pas des actions
    actions: [
        {
            name: 'daily_at_time',
            displayName: 'Tous les jours à X heures',
            description: 'Se déclenche tous les jours à une heure précise',
            triggerType: 'schedule',
            configSchema: {
                type: 'object',
                required: ['time'],
                properties: {
                    time: {
                        type: 'string',
                        format: 'time',
                        description: 'Heure de déclenchement (format HH:mm)',
                        example: '09:00'
                    },
                    timezone: {
                        type: 'string',
                        description: 'Fuseau horaire',
                        default: 'Europe/Paris',
                        enum: ['Europe/Paris', 'America/New_York', 'Asia/Tokyo', 'UTC']
                    }
                }
            }
        },
        {
            name: 'every_weekday',
            displayName: 'Tous les jours de la semaine',
            description: 'Lundi à vendredi à une heure donnée',
            triggerType: 'schedule',
            configSchema: {
                type: 'object',
                required: ['time'],
                properties: {
                    time: {
                        type: 'string',
                        format: 'time',
                        description: 'Heure de déclenchement (format HH:mm)',
                        example: '09:00'
                    },
                    timezone: {
                        type: 'string',
                        description: 'Fuseau horaire',
                        default: 'Europe/Paris'
                    }
                }
            }
        },
        {
            name: 'every_x_minutes',
            displayName: 'Toutes les X minutes',
            description: 'Se répète à interval régulier',
            triggerType: 'schedule',
            configSchema: {
                type: 'object',
                required: ['interval'],
                properties: {
                    interval: {
                        type: 'number',
                        description: 'Intervalle en minutes',
                        minimum: 1,
                        maximum: 1440, // Max 24h
                        example: 30
                    }
                }
            },
            outputSchema: {
                type: 'object',
                properties: {
                    day: {
                        type: 'string',
                        description: 'Jour de la semaine (lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche)',
                        example: 'lundi'
                    }
                }
            }
        },
        {
            name: 'specific_date',
            displayName: 'À une date précise',
            description: 'Se déclenche une seule fois à une date et heure précises',
            triggerType: 'schedule',
            configSchema: {
                type: 'object',
                required: ['datetime'],
                properties: {
                    datetime: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Date et heure de déclenchement (ISO 8601)',
                        example: '2025-12-31T23:59:00Z'
                    }
                }
            }
        },
        {
            name: 'custom_cron',
            displayName: 'Expression cron personnalisée',
            description: 'Pour les utilisateurs avancés : définir une expression cron',
            triggerType: 'schedule',
            configSchema: {
                type: 'object',
                required: ['cronExpression'],
                properties: {
                    cronExpression: {
                        type: 'string',
                        description: 'Expression cron (format: minute hour day month weekday)',
                        example: '0 9 * * 1-5',
                        pattern: '^(\\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\\*/[0-9]+)\\s+(\\*|([0-9]|1[0-9]|2[0-3])|\\*/[0-9]+)\\s+(\\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\\*/[0-9]+)\\s+(\\*|([1-9]|1[0-2])|\\*/[0-9]+)\\s+(\\*|([0-6])|\\*/[0-9]+)$'
                    }
                }
            }
        }
    ],

    reactions: []
}
