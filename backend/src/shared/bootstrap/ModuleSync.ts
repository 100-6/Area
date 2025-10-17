import Database from '../database/connection';
import { moduleRegistry } from '../../modules/registry';
import 'colors';

/**
 * Service de synchronisation des modules avec la base de données
 * Synchronise automatiquement les services, actions et réactions au démarrage
 */
export class ModuleSync {
    private db = Database.getInstance();

    /**
     * Synchroniser tous les modules avec la base de données
     */
    async syncModulesToDatabase(): Promise<void> {
        console.log('[ModuleSync] Synchronizing modules to database...'.cyan);
        
        try {
            const modules = moduleRegistry.getAllModules();
            
            for (const module of modules) {
                await this.syncModule(module);
            }
            
            console.log(`[ModuleSync] Successfully synced ${modules.length} module(s)`.green);
        } catch (error) {
            console.error('[ModuleSync] Failed to sync modules:'.red, error);
            throw error;
        }
    }

    /**
     * Synchroniser un module spécifique
     */
    private async syncModule(module: any): Promise<void> {
        const moduleName = module.getName();
        console.log(`[ModuleSync] Syncing module: ${moduleName}`.gray);

        // 1. Insérer ou mettre à jour le service
        const serviceId = await this.upsertService(module);

        // 2. Synchroniser les actions (triggers)
        await this.syncActions(serviceId, module);

        // 3. Synchroniser les réactions (actions)
        await this.syncReactions(serviceId, module);

        console.log(`[ModuleSync] ✓ ${moduleName} synced`.green);
    }

    /**
     * Insérer ou mettre à jour un service
     */
    private async upsertService(module: any): Promise<string> {
        const query = `
            INSERT INTO services (name, display_name, description, auth_type, is_active)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (name) DO UPDATE SET
                display_name = EXCLUDED.display_name,
                description = EXCLUDED.description,
                auth_type = EXCLUDED.auth_type,
                is_active = EXCLUDED.is_active,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
        `;

        const values = [
            module.getName(),
            module.getDisplayName(),
            module.getDescription(),
            module.getAuthType(),
            module.isActive()
        ];

        const result = await this.db.query(query, values);
        return result.rows[0].id;
    }

    /**
     * Synchroniser les actions (triggers) d'un service
     */
    private async syncActions(serviceId: string, module: any): Promise<void> {
        const triggers = module.getAllTriggers();

        for (const trigger of triggers) {
            // Récupérer l'output schema du trigger s'il existe
            const outputSchema = trigger.getOutputSchema ? trigger.getOutputSchema() : null;
            
            const query = `
                INSERT INTO service_actions (
                    service_id, name, display_name, description, 
                    trigger_type, config_schema, output_schema, is_active
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (service_id, name) DO UPDATE SET
                    display_name = EXCLUDED.display_name,
                    description = EXCLUDED.description,
                    trigger_type = EXCLUDED.trigger_type,
                    config_schema = EXCLUDED.config_schema,
                    output_schema = EXCLUDED.output_schema,
                    is_active = EXCLUDED.is_active,
                    updated_at = CURRENT_TIMESTAMP
            `;

            const values = [
                serviceId,
                trigger.getName(),
                trigger.getName().replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                trigger.getDescription(),
                trigger.getType(),
                JSON.stringify(trigger.getConfigSchema ? trigger.getConfigSchema() : {}),
                outputSchema ? JSON.stringify(outputSchema) : null,
                true
            ];

            await this.db.query(query, values);
        }
    }

    /**
     * Synchroniser les réactions (actions) d'un service
     */
    private async syncReactions(serviceId: string, module: any): Promise<void> {
        const actions = module.getAllActions();

        for (const action of actions) {
            // Récupérer l'output schema de l'action s'il existe
            const outputSchema = action.getOutputSchema ? action.getOutputSchema() : null;
            
            const query = `
                INSERT INTO service_reactions (
                    service_id, name, display_name, description, 
                    config_schema, output_schema, is_active
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (service_id, name) DO UPDATE SET
                    display_name = EXCLUDED.display_name,
                    description = EXCLUDED.description,
                    config_schema = EXCLUDED.config_schema,
                    output_schema = EXCLUDED.output_schema,
                    is_active = EXCLUDED.is_active,
                    updated_at = CURRENT_TIMESTAMP
            `;

            const values = [
                serviceId,
                action.getName(),
                action.getName().replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                action.getDescription(),
                JSON.stringify(action.getConfigSchema ? action.getConfigSchema() : {}),
                outputSchema ? JSON.stringify(outputSchema) : null,
                true
            ];

            await this.db.query(query, values);
        }
    }
}
