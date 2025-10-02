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
            const connectedNodeIds = connections
                .filter(c => c.sourceNodeId === triggerNode.id)
                .map(c => c.targetNodeId);
            
            for (const nodeId of connectedNodeIds) {
                const actionNode = nodes.find(n => n.id === nodeId);
                if (actionNode?.nodeType === 'action') {
                    await this.executeAction(actionNode, triggerData);
                }
            }
            
        } catch (error) {
            console.error('[WorkflowExecutor] Error:'.red, error);
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
