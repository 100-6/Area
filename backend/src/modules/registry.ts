import { BaseModule } from './_base/BaseModule';
import { timerModule } from './timer/service';
import { consoleModule } from './console/service';
import 'colors';

/**
 * Registre central de tous les modules
 * C'est ici qu'on enregistre tous les services disponibles
 */
class ModuleRegistry {
    private static instance: ModuleRegistry;
    private modules: Map<string, BaseModule> = new Map();
    private initialized: boolean = false;

    private constructor() {}

    /**
     * Singleton
     */
    public static getInstance(): ModuleRegistry {
        if (!ModuleRegistry.instance)
            ModuleRegistry.instance = new ModuleRegistry();
        return ModuleRegistry.instance;
    }

    /**
     * Initialiser tous les modules
     * À appeler au démarrage du serveur
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            console.log('[Registry] Already initialized'.yellow);
            return;
        }
        console.log('[Registry] Initializing all modules...'.cyan.bold);
        try {
            // Add here new modules to register
            await this.registerModule(timerModule);
            await this.registerModule(consoleModule);
            this.initialized = true;
            console.log(`[Registry] Successfully initialized ${this.modules.size} module(s)`.green.bold);
        } catch (error) {
            console.error('[Registry] Failed to initialize modules:'.red, error);
            throw error;
        }
    }

    /**
     * Enregistrer un module
     */
    private async registerModule(module: BaseModule): Promise<void> {
        const name = module.getName();

        if (this.modules.has(name))
            console.warn(`[Registry] Module "${name}" already registered, overwriting`.yellow);
        await module.initialize();
        this.modules.set(name, module);
        console.log(`[Registry] Registered module: ${name}`.green);
    }

    /**
     * Récupérer un module par son nom
     */
    getModule(name: string): BaseModule | undefined {
        return this.modules.get(name);
    }

    /**
     * Lister tous les modules
     */
    getAllModules(): BaseModule[] {
        return Array.from(this.modules.values());
    }

    /**
     * Lister uniquement les modules actifs
     */
    getActiveModules(): BaseModule[] {
        return this.getAllModules().filter(module => module.isActive());
    }

    /**
     * Obtenir les infos pour /about.json
     */
    getAboutJson() {
        return {
            client: { host: '' },
            server: {
                current_time: Math.floor(Date.now() / 1000),
                services: this.getActiveModules().map(module => module.getModuleInfo())
            }
        };
    }

    /**
     * Nettoyer tous les modules
     * À appeler à l'arrêt du serveur
     */
    async cleanup(): Promise<void> {
        console.log('[Registry] Cleaning up all modules...'.yellow);
        for (const [name, module] of this.modules) {
            try {
                await module.cleanup();
            } catch (error) {
                console.error(`[Registry] Failed to cleanup module "${name}":`.red, error);
            }
        }
        this.modules.clear();
        this.initialized = false;
        console.log('[Registry] All modules cleaned up'.green);
    }

    /**
     * Vérifier si le registre est initialisé
     */
    isInitialized(): boolean {
        return this.initialized;
    }
}

export const moduleRegistry = ModuleRegistry.getInstance();
