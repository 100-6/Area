import { Request, Response } from 'express';
import { moduleRegistry } from '../../modules/registry';
import { WorkflowModel } from '../models/WorkflowModel';
import 'colors';

/**
 * ModuleController - Gestion des informations sur les modules
 * Permet de récupérer les schémas de variables retournées par les modules
 */
export class ModuleController {
    private workflowModel: WorkflowModel;

    constructor() {
        this.workflowModel = new WorkflowModel();
    }

    /**
     * GET /api/modules/:identifier
     * Récupère les variables retournées par un module (par nom) ou par un nœud (par ID)
     * 
     * Path params:
     * - identifier: string (module name like 'discord' OR node UUID)
     * 
     * Query params:
     * - type: 'trigger' | 'action' (optionnel, pour filtrer le type - seulement pour les modules)
     */
    async getModuleVariables(req: Request, res: Response): Promise<void> {
        try {
            const { identifier } = req.params;
            const { type } = req.query;

            // Validation: identifier requis
            if (!identifier) {
                res.status(400).json({
                    success: false,
                    error: 'Identifier (module name or node ID) is required'
                });
                return;
            }

            console.log(`[ModuleController] Getting variables for identifier: ${identifier}`.cyan);

            // Déterminer si c'est un UUID (node ID) ou un nom de module
            const isUUID = this.isUUID(identifier);

            if (isUUID) {
                // Cas 1: C'est un UUID de nœud
                await this.getVariablesByNodeId(identifier, res);
            } else {
                // Cas 2: C'est un nom de module
                await this.getVariablesByModuleName(identifier, type as string | undefined, res);
            }

        } catch (error) {
            console.error('[ModuleController] Error getting module variables:'.red, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                details: (error as Error).message
            });
        }
    }

    /**
     * Vérifier si une string est un UUID
     */
    private isUUID(str: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    }

    /**
     * Récupérer les variables par nom de module
     */
    private async getVariablesByModuleName(moduleName: string, type: string | undefined, res: Response): Promise<void> {
        console.log(`[ModuleController] Getting variables for module: ${moduleName}`.cyan);

        // Récupérer le module depuis le registry
        const module = moduleRegistry.getModule(moduleName);

        if (!module) {
            res.status(404).json({
                success: false,
                error: `Module "${moduleName}" not found`
            });
            return;
        }

        const result: any = {
            success: true,
            moduleName: moduleName,
            displayName: module.getDisplayName(),
            description: module.getDescription(),
            triggers: [],
            actions: []
        };

        // Récupérer les schémas des triggers
        if (!type || type === 'trigger') {
            const triggers = module.getAllTriggers();
            result.triggers = triggers.map(trigger => ({
                name: trigger.getName(),
                description: trigger.getDescription(),
                type: trigger.getType(),
                outputSchema: trigger.getOutputSchema(),
                configSchema: trigger.getConfigSchema()
            }));
        }

        // Récupérer les schémas des actions
        if (!type || type === 'action') {
            const actions = module.getAllActions();
            result.actions = actions.map(action => ({
                name: action.getName(),
                description: action.getDescription(),
                outputSchema: action.getOutputSchema(),
                configSchema: action.getConfigSchema(),
                requiredScopes: action.getRequiredScopes()
            }));
        }

        console.log(`[ModuleController] Found ${result.triggers.length} triggers and ${result.actions.length} actions`.green);

        res.status(200).json(result);
    }

    /**
     * Récupérer les variables par ID de nœud
     */
    private async getVariablesByNodeId(nodeId: string, res: Response): Promise<void> {
        console.log(`[ModuleController] Getting variables for node: ${nodeId}`.cyan);

        // Récupérer le nœud depuis la base de données
        const node = await this.workflowModel.getNodeById(nodeId);

        if (!node) {
            res.status(404).json({
                success: false,
                error: `Node "${nodeId}" not found`
            });
            return;
        }

        // Récupérer le nom du service/module
        if (!node.serviceId) {
            res.status(400).json({
                success: false,
                error: 'Node does not have an associated service'
            });
            return;
        }

        const serviceName = await this.workflowModel.getServiceNameById(node.serviceId);
        const module = moduleRegistry.getModule(serviceName);

        if (!module) {
            res.status(404).json({
                success: false,
                error: `Module "${serviceName}" not found in registry`
            });
            return;
        }

        let result: any = {
            success: true,
            nodeId: nodeId,
            nodeType: node.nodeType,
            moduleName: serviceName,
            displayName: module.getDisplayName(),
            label: node.label
        };

        // Récupérer les informations selon le type de nœud
        if (node.nodeType === 'trigger' && node.actionId) {
            const actionName = await this.workflowModel.getActionNameById(node.actionId);
            const trigger = module.getTrigger(actionName);

            if (!trigger) {
                res.status(404).json({
                    success: false,
                    error: `Trigger "${actionName}" not found in module "${serviceName}"`
                });
                return;
            }

            result = {
                ...result,
                triggerName: actionName,
                description: trigger.getDescription(),
                type: trigger.getType(),
                outputSchema: trigger.getOutputSchema(),
                configSchema: trigger.getConfigSchema(),
                currentConfig: node.config
            };

        } else if (node.nodeType === 'action' && node.reactionId) {
            const reactionName = await this.workflowModel.getReactionNameById(node.reactionId);
            const action = module.getAction(reactionName);

            if (!action) {
                res.status(404).json({
                    success: false,
                    error: `Action "${reactionName}" not found in module "${serviceName}"`
                });
                return;
            }

            result = {
                ...result,
                actionName: reactionName,
                description: action.getDescription(),
                outputSchema: action.getOutputSchema(),
                configSchema: action.getConfigSchema(),
                requiredScopes: action.getRequiredScopes(),
                currentConfig: node.config
            };
        } else {
            res.status(400).json({
                success: false,
                error: 'Node type is not supported or missing action/reaction reference'
            });
            return;
        }

        console.log(`[ModuleController] Found variables for node ${nodeId}`.green);

        res.status(200).json(result);
    }

    /**
     * GET /api/modules
     * Liste tous les modules disponibles avec leurs capacités
     */
    async listModules(req: Request, res: Response): Promise<void> {
        try {
            console.log('[ModuleController] Listing all modules'.cyan);

            const modules = moduleRegistry.getAllModules();
            const result = modules.map(module => ({
                name: module.getName(),
                displayName: module.getDisplayName(),
                description: module.getDescription(),
                authType: module.getAuthType(),
                isActive: module.isActive(),
                triggerCount: module.getAllTriggers().length,
                actionCount: module.getAllActions().length
            }));

            res.status(200).json({
                success: true,
                count: result.length,
                modules: result
            });

        } catch (error) {
            console.error('[ModuleController] Error listing modules:'.red, error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                details: (error as Error).message
            });
        }
    }
}
