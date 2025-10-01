import { EventBus } from '../../shared/queue/EventBus';
import 'colors';

/**
 * Interface de configuration d'un trigger
 */
export interface TriggerConfig {
    [key: string]: any;
}

/**
 * Données émises quand un trigger se déclenche
 */
export interface TriggerPayload {
    areaId: string;
    triggerName: string;
    triggerType: 'webhook' | 'polling' | 'schedule';
    timestamp: string;
    data: any;
}

/**
 * Classe abstraite de base pour tous les triggers
 * Chaque service doit étendre cette classe pour ses triggers
 */
export abstract class BaseTrigger {
    protected eventBus: EventBus;
    protected isRunning: boolean = false;

    constructor() {
        this.eventBus = EventBus.getInstance();
    }

    /**
     * Nom unique du trigger (ex: 'daily_at_time', 'new_email')
     */
    abstract getName(): string;

    /**
     * Type de trigger
     */
    abstract getType(): 'webhook' | 'polling' | 'schedule';

    /**
     * Description du trigger
     */
    abstract getDescription(): string;

    /**
     * Schéma de configuration attendu (JSON Schema)
     */
    abstract getConfigSchema(): any;

    /**
     * Valider la configuration fournie par l'utilisateur
     * @throws Error si la config est invalide
     */
    abstract validate(config: TriggerConfig): boolean;

    /**
     * Démarrer le trigger pour une AREA spécifique
     * @param areaId - ID de l'AREA
     * @param config - Configuration du trigger
     */
    abstract start(areaId: string, config: TriggerConfig): Promise<void>;

    /**
     * Arrêter le trigger
     * @param areaId - ID de l'AREA
     */
    abstract stop(areaId: string): Promise<void>;

    /**
     * Émettre un événement de trigger
     * À appeler quand le trigger se déclenche
     */
    protected async emitTrigger(payload: TriggerPayload): Promise<void> {
        try {
            console.log(`[${this.getName()}] Trigger fired for AREA ${payload.areaId}`.cyan);
            await this.eventBus.emit('trigger.fired', payload);
            console.log(`[${this.getName()}] Event emitted successfully`.green);
        } catch (error) {
            console.error(`[${this.getName()}] Failed to emit trigger:`.red, error);
            throw error;
        }
    }

    /**
     * Vérifier si le trigger est en cours d'exécution
     */
    public isActive(): boolean {
        return this.isRunning;
    }

    /**
     * Hook appelé avant le démarrage
     */
    protected async onBeforeStart(areaId: string, config: TriggerConfig): Promise<void> {
    }

    /**
     * Hook appelé après le démarrage
     */
    protected async onAfterStart(areaId: string, config: TriggerConfig): Promise<void> {
    }

    /**
     * Hook appelé avant l'arrêt
     */
    protected async onBeforeStop(areaId: string): Promise<void> {
    }

    /**
     * Hook appelé après l'arrêt
     */
    protected async onAfterStop(areaId: string): Promise<void> {
    }
}
