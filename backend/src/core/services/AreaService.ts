import { Area, AreaData, CreateAreaData } from '../models/Area';
import { WorkflowModel } from '../models/WorkflowModel';
import { moduleRegistry } from '../../modules/registry';
import { EventBus } from '../../shared/queue/EventBus';
import 'colors';

export class AreaService {
    private eventBus: EventBus;
    private workflowModel: WorkflowModel;

    constructor() {
        this.eventBus = EventBus.getInstance();
        this.workflowModel = new WorkflowModel();
    }

    async createArea(data: CreateAreaData): Promise<AreaData> {
        try {
            console.log(`[AreaService] Creating AREA "${data.name}" for user ${data.user_id}`.cyan);
            const area = await Area.create({ user_id: data.user_id, name: data.name, description: data.description });

            console.log(`[AreaService] AREA ${area.id} created`.green);
            return area;
        } catch (error) {
            console.error('[AreaService] Failed to create AREA:'.red, error);
            throw error;
        }
    }

    async getUserAreas(userId: string): Promise<AreaData[]> {
        try {
            return await Area.findByUserId(userId);
        } catch (error) {
            console.error('[AreaService] Failed to get user areas:'.red, error);
            throw error;
        }
    }

    async getAreaById(id: string, userId: string): Promise<AreaData | null> {
        try {
            const area = await Area.findById(id);
            
            if (!area)
                return null;
            if (area.user_id !== userId)
                throw new Error('UNAUTHORIZED');
            return area;
        } catch (error) {
            console.error('[AreaService] Failed to get area by ID:'.red, error);
            throw error;
        }
    }

    async updateArea(id: string, userId: string, updates: Partial<CreateAreaData>): Promise<AreaData | null> {
        try {
            const area = await this.getAreaById(id, userId);

            if (!area)
                throw new Error('AREA_NOT_FOUND');
            return await Area.update(id, updates);
        } catch (error) {
            console.error('[AreaService] Failed to update AREA:'.red, error);
            throw error;
        }
    }

    async toggleArea(id: string, userId: string, isActive: boolean): Promise<boolean> {
        try {
            const area = await this.getAreaById(id, userId);

            if (!area)
                throw new Error('AREA_NOT_FOUND');
            if (isActive && !area.is_active) {
                const nodes = await this.workflowModel.getNodesByArea(id);
                const triggerNode = nodes.find(n => n.nodeType === 'trigger');
                if (triggerNode)
                    await this.startAreaTrigger(id, triggerNode);
            }
            if (!isActive && area.is_active)
                await this.stopAreaTrigger(id);
            await Area.setActive(id, isActive);
            return true;
        } catch (error) {
            console.error('[AreaService] Failed to toggle AREA:'.red, error);
            throw error;
        }
    }

    async deleteArea(id: string, userId: string): Promise<boolean> {
        try {
            const area = await this.getAreaById(id, userId);

            if (!area)
                throw new Error('AREA_NOT_FOUND');
            await this.stopAreaTrigger(id);
            return await Area.delete(id);
        } catch (error) {
            console.error('[AreaService] Failed to delete AREA:'.red, error);
            throw error;
        }
    }

    async initializeActiveAreas(): Promise<void> {
        try {
            console.log('[AreaService] Initializing active AREAs...'.cyan);
            const activeAreas = await Area.findAllActive();

            console.log(`[AreaService] Found ${activeAreas.length} active AREA(s)`.cyan);
            for (const area of activeAreas) {
                try {
                    const nodes = await this.workflowModel.getNodesByArea(area.id);
                    const triggerNode = nodes.find(n => n.nodeType === 'trigger');
                    if (!triggerNode) {
                        console.warn(`[AreaService] No trigger node for AREA ${area.id}`.yellow);
                        continue;
                    }
                    await this.startAreaTrigger(area.id, triggerNode);
                    console.log(`[AreaService] Started AREA "${area.name}"`.green);
                } catch (error) {
                    console.error(`[AreaService] Failed to start AREA ${area.id}:`.red, error);
                }
            }
            console.log('[AreaService] Active AREAs initialized'.green);
        } catch (error) {
            console.error('[AreaService] Failed to initialize active AREAs:'.red, error);
            throw error;
        }
    }

    /**
     * Démarrer le trigger d'une AREA (méthode publique)
     */
    async startTriggerForArea(areaId: string): Promise<void> {
        const nodes = await this.workflowModel.getNodesByArea(areaId);
        const triggerNode = nodes.find(n => n.nodeType === 'trigger');
        
        if (!triggerNode) {
            throw new Error(`No trigger node found for AREA ${areaId}`);
        }
        
        await this.startAreaTrigger(areaId, triggerNode);
    }

    private async startAreaTrigger(areaId: string, triggerNode: any): Promise<void> {
        try {
            const serviceName = await this.workflowModel.getServiceNameById(triggerNode.serviceId);
            const triggerModule = moduleRegistry.getModule(serviceName);

            if (!triggerModule)
                throw new Error(`Module "${serviceName}" not found in registry`);
            const actionName = await this.workflowModel.getActionNameById(triggerNode.actionId);
            const trigger = triggerModule.getTrigger(actionName);
            if (!trigger)
                throw new Error(`Trigger "${actionName}" not found in module "${serviceName}"`);
            await trigger.start(areaId, triggerNode.config);
            console.log(`[AreaService] Started trigger "${actionName}" for AREA ${areaId}`.green);
        } catch (error) {
            console.error(`[AreaService] Failed to start trigger:`.red, error);
            throw error;
        }
    }

    private async stopAreaTrigger(areaId: string): Promise<void> {
        try {
            const nodes = await this.workflowModel.getNodesByArea(areaId);
            const triggerNode = nodes.find(n => n.nodeType === 'trigger');

            if (!triggerNode) {
                console.warn(`[AreaService] No trigger node for AREA ${areaId}`.yellow);
                return;
            }
            const serviceName = await this.workflowModel.getServiceNameById(triggerNode.serviceId!);
            const actionName = await this.workflowModel.getActionNameById(triggerNode.actionId!);
            const triggerModule = moduleRegistry.getModule(serviceName);
            if (!triggerModule) {
                console.warn(`[AreaService] Module "${serviceName}" not found`.yellow);
                return;
            }
            const trigger = triggerModule.getTrigger(actionName);
            if (!trigger) {
                console.warn(`[AreaService] Trigger "${actionName}" not found`.yellow);
                return;
            }
            await trigger.stop(areaId);
            console.log(`[AreaService] Stopped trigger "${actionName}" for AREA ${areaId}`.yellow);
        } catch (error) {
            console.error(`[AreaService] Failed to stop trigger:`.red, error);
            throw error;
        }
    }
}

export default AreaService;
