import { RedisManager } from '../queue/RedisManager';
import { EventBus } from '../queue/EventBus';
import { AreaService } from '../../core/services/AreaService';
import { moduleRegistry } from '../../modules/registry';
import { ModuleSync } from './ModuleSync';
import { WorkflowExecutor } from '../../workflow-engine/executor/WorkflowExecutor';
import Database from '../database/connection';
import 'colors';

/**
 * Service de bootstrap de l'application
 * Gère l'initialisation et l'arrêt propre de tous les services
 */
export class ApplicationBootstrap {
    private static instance: ApplicationBootstrap;
    private isInitialized: boolean = false;
    private isShuttingDown: boolean = false;

    private redis?: RedisManager;
    private eventBus?: EventBus;
    private database?: Database;
    private workflowExecutor?: WorkflowExecutor;

    private constructor() {}

    /**
     * Singleton
     */
    public static getInstance(): ApplicationBootstrap {
        if (!ApplicationBootstrap.instance)
            ApplicationBootstrap.instance = new ApplicationBootstrap();
        return ApplicationBootstrap.instance;
    }

    /**
     * Initialiser tous les services de l'application
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('[Bootstrap] Application already initialized'.yellow);
            return;
        }
        console.log('\n========================================'.cyan);
        console.log('  Starting AREA Backend'.cyan.bold);
        console.log('========================================\n'.cyan);
        try {
            // Here to initialize all services
            await this.initializeDatabase();
            await this.initializeRedis();
            await this.initializeEventBus();
            await this.initializeModules();
            await this.initializeActiveAreas();
            await this.initializeWorkflowExecutor();
            this.isInitialized = true;
            console.log('\n========================================'.green);
            console.log('  AREA Backend Ready'.green.bold);
            console.log('========================================\n'.green);
            this.setupGracefulShutdown();
        } catch (error) {
            console.error('\n========================================'.red);
            console.error('  Failed to start AREA Backend'.red.bold);
            console.error('========================================\n'.red);
            console.error(error);
            throw error;
        }
    }

    /**
     * Initialiser PostgreSQL
     */
    private async initializeDatabase(): Promise<void> {
        console.log('   Connecting to PostgreSQL...'.cyan);

        try {
            this.database = Database.getInstance();
            const isHealthy = await this.database.testConnection();
            if (!isHealthy)
                throw new Error('Database connection test failed');
            console.log('✓ PostgreSQL connected'.green);
        } catch (error) {
            console.error('✗ PostgreSQL connection failed:'.red, error);
            throw error;
        }
    }

    /**
     * Initialiser Redis
     */
    private async initializeRedis(): Promise<void> {
        console.log('  Connecting to Redis...'.cyan);

        try {
            this.redis = RedisManager.getInstance();
            await this.redis.connect();
            const isHealthy = await this.redis.ping();
            if (!isHealthy)
                throw new Error('Redis ping failed');
            console.log('✓ Redis connected'.green);
        } catch (error) {
            console.error('✗ Redis connection failed:'.red, error);
            throw error;
        }
    }

    /**
     * Initialiser EventBus
     */
    private async initializeEventBus(): Promise<void> {
        console.log('  Initializing EventBus...'.cyan);

        try {
            this.eventBus = EventBus.getInstance();
            await this.eventBus.init();
            console.log('✓ EventBus initialized'.green);
        } catch (error) {
            console.error('✗ EventBus initialization failed:'.red, error);
            throw error;
        }
    }

    /**
     * Initialiser tous les modules (Timer, GitHub, Gmail, etc.)
     */
    private async initializeModules(): Promise<void> {
        console.log('📦 Loading modules...'.cyan);
        try {
            await moduleRegistry.initialize();
            const moduleSync = new ModuleSync();
            await moduleSync.syncModulesToDatabase();
            const modules = moduleRegistry.getAllModules();
            console.log(`✓ ${modules.length} module(s) loaded:`.green);
            modules.forEach(module => {
                const triggers = module.getAllTriggers().length;
                const actions = module.getAllActions().length;
                console.log(`  • ${module.getDisplayName()}: ${triggers} triggers, ${actions} actions`.gray);
            });
        } catch (error) {
            console.error('✗ Module loading failed:'.red, error);
            throw error;
        }
    }

    /**
     * Initialiser les AREAs actives au démarrage
     * Redémarre tous les triggers des AREAs actives en BDD
     */
    private async initializeActiveAreas(): Promise<void> {
        console.log('  Loading active AREAs...'.cyan);
        try {
            const areaService = new AreaService();
            await areaService.initializeActiveAreas();
            console.log('✓ Active AREAs initialized'.green);
        } catch (error) {
            console.error('✗ Failed to initialize active AREAs:'.red, error);
        }
    }

    private async initializeWorkflowExecutor(): Promise<void> {
        console.log('   Initializing Workflow Executor...'.cyan);
        try {
            this.workflowExecutor = new WorkflowExecutor();
            await this.workflowExecutor.initialize();
            console.log('✓ Workflow Executor ready'.green);
        } catch (error) {
            console.error('✗ Workflow Executor failed:'.red, error);
            throw error;
        }
    }

    /**
     * Arrêt propre de l'application
     */
    async shutdown(): Promise<void> {
        if (this.isShuttingDown) {
            console.log('[Bootstrap] Shutdown already in progress'.yellow);
            return;
        }
        this.isShuttingDown = true;
        console.log('\n========================================'.yellow);
        console.log('  Shutting down AREA Backend'.yellow.bold);
        console.log('========================================\n'.yellow);
        try {
            console.log('📦 Cleaning up modules...'.yellow);
            await moduleRegistry.cleanup();
            console.log('✓ Modules cleaned up'.green);
            if (this.eventBus) {
                console.log('  Closing EventBus (includes Redis)...'.yellow);
                await this.eventBus.close();
                console.log('✓ EventBus & Redis closed'.green);
            }
            if (this.database) {
                console.log('🗄️  Closing database connections...'.yellow);
                await this.database.close();
                console.log('✓ Database closed'.green);
            }
            console.log('\n========================================'.green);
            console.log('  Shutdown completed'.green.bold);
            console.log('========================================\n'.green);
            this.isInitialized = false;
            this.isShuttingDown = false;
        } catch (error) {
            console.error('\n   Shutdown encountered errors:'.red, error);
        }
    }

    /**
     * Gérer les signaux d'arrêt (SIGTERM, SIGINT)
     */
    private setupGracefulShutdown(): void {
        const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

        signals.forEach(signal => {
            process.on(signal, async () => {
                console.log(`\n[Bootstrap] Received ${signal} signal`.yellow);
                await this.shutdown();
                process.exit(0);
            });
        });
        process.on('uncaughtException', async (error) => {
            console.error('[Bootstrap] Uncaught Exception:'.red, error);
            await this.shutdown();
            process.exit(1);
        });
        process.on('unhandledRejection', async (reason, promise) => {
            console.error('[Bootstrap] Unhandled Rejection at:'.red, promise, 'reason:', reason);
            await this.shutdown();
            process.exit(1);
        });
    }

    /**
     * Vérifier si l'application est initialisée
     */
    public isReady(): boolean {
        return this.isInitialized && !this.isShuttingDown;
    }

    /**
     * Obtenir l'état de santé de tous les services
     */
    public getHealthStatus() {
        return {
            initialized: this.isInitialized,
            services: {
                database: this.database?.isConnectionHealthy() ?? false,
                redis: this.redis?.isHealthy() ?? false,
                eventBus: this.eventBus?.isReady() ?? false,
                modules: moduleRegistry.isInitialized()
            },
            timestamp: new Date().toISOString()
        };
    }
}

export const appBootstrap = ApplicationBootstrap.getInstance();
