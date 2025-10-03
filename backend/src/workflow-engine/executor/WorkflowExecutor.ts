import { EventBus } from '../../shared/queue/EventBus';
import { WorkflowModel } from '../../core/models/WorkflowModel';
import { moduleRegistry } from '../../modules/registry';
import 'colors';

/**
 * WorkflowExecutor - Moteur d'exécution des workflows AREA
 * Écoute les événements trigger.fired et exécute les réactions
 */
export class WorkflowExecutor {
    private eventBus: EventBus;
    private workflowModel: WorkflowModel;
    private isInitialized: boolean = false;

    constructor() {
        this.eventBus = EventBus.getInstance();
        this.workflowModel = new WorkflowModel();
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('[WorkflowExecutor] Already initialized'.yellow);
            return;
        }

        console.log('[WorkflowExecutor] Initializing...'.cyan);
        
        // Écouter trigger.fired
        await this.eventBus.on('trigger.fired', async (data: any) => {
            await this.handleTriggerFired(data);
        });
        
        this.isInitialized = true;
        console.log('[WorkflowExecutor] Ready'.green);
    }

    private async handleTriggerFired(triggerData: any): Promise<void> {
        const { areaId } = triggerData;
        
        console.log(`[WorkflowExecutor] Executing workflow for AREA ${areaId}`.cyan);
        
        try {
            const nodes = await this.workflowModel.getNodesByArea(areaId);
            const triggerNode = nodes.find(n => n.nodeType === 'trigger');
            
            if (!triggerNode) return;
            
            const connections = await this.workflowModel.getConnectionsByArea(areaId);
            
            // Exécuter toutes les actions connectées au trigger
            await this.executeConnectedActions(triggerNode.id, nodes, connections, triggerData);
            
        } catch (error) {
            console.error('[WorkflowExecutor] Error:'.red, error);
        }
    }

    /**
     * Exécute récursivement toutes les actions connectées à un nœud
     */
    private async executeConnectedActions(
        sourceNodeId: string,
        nodes: any[],
        connections: any[],
        triggerData: any,
        executedNodes: Set<string> = new Set()
    ): Promise<void> {
        // Éviter les boucles infinies
        if (executedNodes.has(sourceNodeId)) {
            console.log(`[WorkflowExecutor] Node ${sourceNodeId} already executed, skipping to prevent loop`.yellow);
            return;
        }
        
        executedNodes.add(sourceNodeId);
        
        // Trouver tous les nœuds connectés à ce nœud source
        const connectedNodeIds = connections
            .filter(c => c.sourceNodeId === sourceNodeId)
            .map(c => c.targetNodeId);
        
        console.log(`[WorkflowExecutor] Found ${connectedNodeIds.length} connected nodes from ${sourceNodeId}`.blue);
        
        // Exécuter chaque action connectée
        for (const nodeId of connectedNodeIds) {
            const actionNode = nodes.find(n => n.id === nodeId);
            
            if (!actionNode) {
                console.log(`[WorkflowExecutor] Node ${nodeId} not found`.yellow);
                continue;
            }
            
            if (actionNode.nodeType === 'action') {
                console.log(`[WorkflowExecutor] Executing action node ${nodeId}`.cyan);
                await this.executeAction(actionNode, triggerData);
                
                // Continuer l'exécution avec les actions connectées à celle-ci
                await this.executeConnectedActions(nodeId, nodes, connections, triggerData, executedNodes);
            }
        }
    }

    private async executeAction(actionNode: any, triggerData: any): Promise<void> {
        try {
            const serviceName = await this.workflowModel.getServiceNameById(actionNode.serviceId);
            const reactionName = await this.workflowModel.getReactionNameById(actionNode.reactionId);
            const module = moduleRegistry.getModule(serviceName);

            if (!module)
                return;
            const action = module.getAction(reactionName);
            if (!action)
                return;
            const context = {
                areaId: actionNode.areaId,
                triggerData: triggerData.data,
                timestamp: triggerData.timestamp,
                userId: actionNode.userId || triggerData.userId,
                executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            await action.execute(actionNode.config, context);
        } catch (error) {
            console.error('[WorkflowExecutor] Action failed:'.red, error);
        }
    }
}
