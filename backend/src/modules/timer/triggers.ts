import { BaseTrigger, TriggerConfig, TriggerPayload } from '../_base/BaseTrigger';
import 'colors';

interface EveryXMinutesConfig extends TriggerConfig {
    interval: number; // 1-1440 minutes
}

export class EveryXMinutesTrigger extends BaseTrigger {
    private intervalId?: NodeJS.Timeout;
    private activeAreas: Map<string, NodeJS.Timeout> = new Map();

    getName(): string {
        return 'every_x_minutes';
    }

    getType(): 'schedule' {
        return 'schedule';
    }

    getDescription(): string {
        return 'Se répète à interval régulier';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['interval'],
            properties: {
                interval: {
                    type: 'number',
                    description: 'Intervalle en minutes',
                    minimum: 1,
                    maximum: 1440,
                    example: 30
                }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const cfg = config as EveryXMinutesConfig;

        if (!cfg.interval || typeof cfg.interval !== 'number')
            throw new Error('interval is required and must be a number');
        if (cfg.interval < 1 || cfg.interval > 1440)
            throw new Error('interval must be between 1 and 1440 minutes');
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as EveryXMinutesConfig;
        this.validate(cfg);
        console.log(`[Timer] Starting every_x_minutes for AREA ${areaId}: every ${cfg.interval} min`.green);
        const intervalMs = cfg.interval * 60 * 1000;
        const intervalId = setInterval(async () => {
            const now = new Date();
            const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
            const dayOfWeek = now.getDay();
            
            const payload: TriggerPayload = {
                areaId,
                triggerName: this.getName(),
                triggerType: this.getType(),
                timestamp: new Date().toISOString(),
                data: {
                    interval: cfg.interval,
                    firedAt: new Date().toISOString(),
                    day: days[dayOfWeek] // ✨ Ajout du jour en français
                }
            };
            await this.emitTrigger(payload);
        }, intervalMs);
        this.activeAreas.set(areaId, intervalId);
        this.isRunning = true;
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[Timer] Stopping every_x_minutes for AREA ${areaId}`.yellow);
        const intervalId = this.activeAreas.get(areaId);
        if (intervalId) {
            clearInterval(intervalId);
            this.activeAreas.delete(areaId);
        }
        if (this.activeAreas.size === 0)
            this.isRunning = false;
    }
}

interface DailyAtTimeConfig extends TriggerConfig {
    time: string; // Format HH:mm (ex: "09:00")
    timezone?: string; // Default: 'Europe/Paris'
}

export class DailyAtTimeTrigger extends BaseTrigger {
    private activeAreas: Map<string, NodeJS.Timeout> = new Map();

    getName(): string {
        return 'daily_at_time';
    }

    getType(): 'schedule' {
        return 'schedule';
    }

    getDescription(): string {
        return 'Se déclenche tous les jours à une heure précise';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['time'],
            properties: {
                time: {
                    type: 'string',
                    format: 'time',
                    description: 'Heure de déclenchement (HH:mm)',
                    example: '09:00'
                },
                timezone: {
                    type: 'string',
                    description: 'Fuseau horaire',
                    default: 'Europe/Paris',
                    enum: ['Europe/Paris', 'America/New_York', 'Asia/Tokyo', 'UTC']
                }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const cfg = config as DailyAtTimeConfig;

        if (!cfg.time || typeof cfg.time !== 'string')
            throw new Error('time is required and must be a string');
        const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
        if (!timeRegex.test(cfg.time))
            throw new Error('time must be in HH:mm format (ex: 09:00)');
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as DailyAtTimeConfig;
        this.validate(cfg);
        console.log(`[Timer] Starting daily_at_time for AREA ${areaId}: every day at ${cfg.time}`.green);
        const scheduleNext = () => {
            const now = new Date();
            const [hours, minutes] = cfg.time.split(':').map(Number);
            const targetTime = new Date();

            targetTime.setHours(hours, minutes, 0, 0);
            if (targetTime <= now)
                targetTime.setDate(targetTime.getDate() + 1);
            const delay = targetTime.getTime() - now.getTime();
            console.log(`[Timer] Next trigger at ${targetTime.toISOString()} (in ${Math.round(delay / 1000 / 60)} minutes)`.cyan);
            const timeoutId = setTimeout(async () => {
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        time: cfg.time,
                        timezone: cfg.timezone || 'Europe/Paris',
                        firedAt: new Date().toISOString()
                    }
                };
                await this.emitTrigger(payload);
                scheduleNext();
            }, delay);
            this.activeAreas.set(areaId, timeoutId);
        };
        scheduleNext();
        this.isRunning = true;
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[Timer] Stopping daily_at_time for AREA ${areaId}`.yellow);
        const timeoutId = this.activeAreas.get(areaId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.activeAreas.delete(areaId);
        }
        if (this.activeAreas.size === 0)
            this.isRunning = false;
    }
}

interface EveryWeekdayConfig extends TriggerConfig {
    time: string; // Format HH:mm
    timezone?: string;
}

export class EveryWeekdayTrigger extends BaseTrigger {
    private activeAreas: Map<string, NodeJS.Timeout> = new Map();

    getName(): string {
        return 'every_weekday';
    }

    getType(): 'schedule' {
        return 'schedule';
    }

    getDescription(): string {
        return 'Lundi à vendredi à une heure donnée';
    }

    getConfigSchema(): any {
        return {
            type: 'object',
            required: ['time'],
            properties: {
                time: {
                    type: 'string',
                    format: 'time',
                    description: 'Heure de déclenchement (HH:mm)',
                    example: '09:00'
                },
                timezone: {
                    type: 'string',
                    description: 'Fuseau horaire',
                    default: 'Europe/Paris'
                }
            }
        };
    }

    validate(config: TriggerConfig): boolean {
        const cfg = config as EveryWeekdayConfig;

        if (!cfg.time || typeof cfg.time !== 'string')
            throw new Error('time is required and must be a string');
        const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
        if (!timeRegex.test(cfg.time))
            throw new Error('time must be in HH:mm format');
        return true;
    }

    async start(areaId: string, config: TriggerConfig): Promise<void> {
        const cfg = config as EveryWeekdayConfig;
        this.validate(cfg);
        console.log(`[Timer] Starting every_weekday for AREA ${areaId}: weekdays at ${cfg.time}`.green);
        const scheduleNext = () => {
            const now = new Date();
            const [hours, minutes] = cfg.time.split(':').map(Number);
            const targetTime = new Date();
            targetTime.setHours(hours, minutes, 0, 0);
            while (targetTime <= now || targetTime.getDay() === 0 || targetTime.getDay() === 6) {
                targetTime.setDate(targetTime.getDate() + 1);
                targetTime.setHours(hours, minutes, 0, 0);
            }
            const delay = targetTime.getTime() - now.getTime();
            console.log(`[Timer] Next weekday trigger at ${targetTime.toISOString()}`.cyan);
            const timeoutId = setTimeout(async () => {
                const payload: TriggerPayload = {
                    areaId,
                    triggerName: this.getName(),
                    triggerType: this.getType(),
                    timestamp: new Date().toISOString(),
                    data: {
                        time: cfg.time,
                        timezone: cfg.timezone || 'Europe/Paris',
                        dayOfWeek: new Date().getDay(),
                        firedAt: new Date().toISOString()
                    }
                };
                await this.emitTrigger(payload);
                scheduleNext();
            }, delay);
            this.activeAreas.set(areaId, timeoutId);
        };
        scheduleNext();
        this.isRunning = true;
    }

    async stop(areaId: string): Promise<void> {
        console.log(`[Timer] Stopping every_weekday for AREA ${areaId}`.yellow);
        const timeoutId = this.activeAreas.get(areaId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.activeAreas.delete(areaId);
        }
        if (this.activeAreas.size === 0)
            this.isRunning = false;
    }
}
