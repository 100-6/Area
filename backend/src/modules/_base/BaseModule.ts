import { BaseTrigger } from './BaseTrigger';
import { BaseAction } from './BaseAction';
import 'colors';

/**
 * Configuration d'un module/service
 */
export interface ModuleConfig {
    name: string;
    displayName: string;
    description: string;
    iconUrl?: string;
    color?: string;
    authType: 'none' | 'oauth2' | 'api_key' | 'basic';
    isActive: boolean;
    
    oauthClientId?: string;
    oauthClientSecret?: string;
    oauthScopes?: string[];
    oauthAuthUrl?: string;
    oauthTokenUrl?: string;
}

/**
 * Informations sur un module pour l'API /about.json
 */
export interface ModuleInfo {
    name: string;
    actions: Array<{
        name: string;
        description: string;
    }>;
    reactions: Array<{
        name: string;
        description: string;
    }>;
}

/**
 * Classe abstraite de base pour tous les modules (Timer, GitHub, Gmail, etc.)
 * Chaque service doit étendre cette classe
 */
export abstract class BaseModule {
    protected triggers: Map<string, BaseTrigger> = new Map();
    protected actions: Map<string, BaseAction> = new Map();
    protected config: ModuleConfig;

    constructor(config: ModuleConfig) {
        this.config = config;
    }

    /**
     * Nom du module (ex: 'timer', 'github', 'gmail')
     */
    abstract getName(): string;

    /**
     * Nom d'affichage (ex: 'Timer / Scheduler', 'GitHub', 'Gmail')
     */
    getDisplayName(): string {
        return this.config.displayName;
    }

    /**
     * Description du module
     */
    getDescription(): string {
        return this.config.description;
    }

    /**
     * Type d'authentification requis
     */
    getAuthType(): 'none' | 'oauth2' | 'api_key' | 'basic' {
        return this.config.authType;
    }

    /**
     * Initialiser le module
     * À appeler au démarrage du serveur
     */
    abstract initialize(): Promise<void>;

    /**
     * Enregistrer un trigger dans le module
     */
    protected registerTrigger(trigger: BaseTrigger): void {
        const name = trigger.getName();
        
        if (this.triggers.has(name))
            console.warn(`[${this.getName()}] Trigger "${name}" already registered, overwriting`.yellow);
        this.triggers.set(name, trigger);
        console.log(`[${this.getName()}] Registered trigger: ${name}`.green);
    }

    /**
     * Enregistrer une action dans le module
     */
    protected registerAction(action: BaseAction): void {
        const name = action.getName();
        
        if (this.actions.has(name))
            console.warn(`[${this.getName()}] Action "${name}" already registered, overwriting`.yellow);
        this.actions.set(name, action);
        console.log(`[${this.getName()}] Registered action: ${name}`.green);
    }

    /**
     * Récupérer un trigger par son nom
     */
    getTrigger(name: string): BaseTrigger | undefined {
        return this.triggers.get(name);
    }

    /**
     * Récupérer une action par son nom
     */
    getAction(name: string): BaseAction | undefined {
        return this.actions.get(name);
    }

    /**
     * Lister tous les triggers du module
     */
    getAllTriggers(): BaseTrigger[] {
        return Array.from(this.triggers.values());
    }

    /**
     * Lister toutes les actions du module
     */
    getAllActions(): BaseAction[] {
        return Array.from(this.actions.values());
    }

    /**
     * Vérifier si le module est actif
     */
    isActive(): boolean {
        return this.config.isActive;
    }

    /**
     * Obtenir les informations du module pour /about.json
     */
    getModuleInfo(): ModuleInfo {
        return {
            name: this.config.name,
            actions: this.getAllTriggers().map(trigger => ({
                name: trigger.getName(),
                description: trigger.getDescription(),
            })),
            reactions: this.getAllActions().map(action => ({
                name: action.getName(),
                description: action.getDescription(),
            }))
        };
    }

    /**
     * Vérifier si l'utilisateur peut utiliser ce module
     * (OAuth2, API key, etc.)
     */
    async canUserAccessModule(userId: string): Promise<boolean> {
        if (this.config.authType === 'none')
            return true;
        return this.checkUserAccess(userId);
    }

    /**
     * Méthode à surcharger pour vérifier l'accès utilisateur
     */
    protected async checkUserAccess(userId: string): Promise<boolean> {
        return true;
    }

    /**
     * Hook appelé quand un utilisateur se connecte au service
     * (OAuth2 callback, API key setup, etc.)
     */
    async onUserConnect(userId: string, credentials: any): Promise<void> {
    }

    /**
     * Hook appelé quand un utilisateur se déconnecte du service
     */
    async onUserDisconnect(userId: string): Promise<void> {
    }

    /**
     * Nettoyer les ressources du module
     * À appeler à l'arrêt du serveur
     */
    async cleanup(): Promise<void> {
        console.log(`[${this.getName()}] Cleaning up module...`.yellow);
        for (const trigger of this.getAllTriggers()) {
            if (trigger.isActive())
                console.log(`[${this.getName()}] Stopping trigger: ${trigger.getName()}`.yellow);
        }
        console.log(`[${this.getName()}] Cleanup completed`.green);
    }
}
