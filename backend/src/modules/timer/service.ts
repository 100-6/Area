import { BaseModule } from '../_base/BaseModule';
import { EveryXMinutesTrigger, DailyAtTimeTrigger, EveryWeekdayTrigger } from './triggers';
import timerConfig from './config';
import 'colors';

/**
 * Module Timer
 * Gère tous les triggers basés sur le temps
 */
export class TimerModule extends BaseModule {
    constructor() {
        super({
            name: timerConfig.name,
            displayName: timerConfig.displayName,
            description: timerConfig.description,
            iconUrl: timerConfig.iconUrl,
            color: timerConfig.color,
            authType: timerConfig.authType as 'none',
            isActive: timerConfig.isActive
        });
    }

    /**
     * Nom du module
     */
    getName(): string {
        return 'timer';
    }

    /**
     * Initialiser le module Timer
     * Enregistre tous les triggers disponibles
     */
    async initialize(): Promise<void> {
        console.log('[Timer] Initializing Timer module...'.cyan);
        try {
            this.registerTrigger(new EveryXMinutesTrigger());
            this.registerTrigger(new DailyAtTimeTrigger());
            this.registerTrigger(new EveryWeekdayTrigger());
            console.log(`[Timer] Module initialized successfully with ${this.triggers.size} triggers`.green);
        } catch (error) {
            console.error('[Timer] Failed to initialize module:'.red, error);
            throw error;
        }
    }

    /**
     * Le module Timer ne nécessite pas d'authentification
     */
    protected async checkUserAccess(userId: string): Promise<boolean> {
        return true;
    }

    /**
     * Démarrer un timer pour une AREA
     */
    async startTimer(areaId: string, triggerName: string, config: any): Promise<void> {
        const trigger = this.getTrigger(triggerName);

        if (!trigger)
            throw new Error(`Trigger "${triggerName}" not found in Timer module`);
        console.log(`[Timer] Starting timer "${triggerName}" for AREA ${areaId}`.cyan);
        await trigger.start(areaId, config);
    }

    /**
     * Arrêter un timer pour une AREA
     */
    async stopTimer(areaId: string, triggerName: string): Promise<void> {
        const trigger = this.getTrigger(triggerName);

        if (!trigger)
            throw new Error(`Trigger "${triggerName}" not found in Timer module`);
        console.log(`[Timer] Stopping timer "${triggerName}" for AREA ${areaId}`.yellow);
        await trigger.stop(areaId);
    }

    /**
     * Nettoyer le module Timer
     */
    async cleanup(): Promise<void> {
        console.log('[Timer] Cleaning up Timer module...'.yellow);
        for (const [name, trigger] of this.triggers)
            if (trigger.isActive())
                console.log(`[Timer] Stopping active trigger: ${name}`.yellow);
        await super.cleanup();
    }
}

export const timerModule = new TimerModule();
