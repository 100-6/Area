import { WorkflowModel } from '../models/WorkflowModel';
import { Area } from '../models/Area';
import 'colors';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

export type NodeType = 'trigger' | 'action' | 'condition' | 'delay' | 'filter';

export interface WorkflowNode {
    id: string;
    areaId: string;
    nodeType: NodeType;
    serviceId?: string;
    actionId?: string;
    reactionId?: string;
    connectionId?: string;
    config: Record<string, any>;
    positionX: number;
    positionY: number;
    label?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface WorkflowConnection {
    id: string;
    areaId: string;
    sourceNodeId: string;
    targetNodeId: string;
    condition?: Record<string, any>;
    createdAt: Date;
}

export interface CreateWorkflowNodeDto {
    nodeType: NodeType;
    serviceId?: string;
    actionId?: string;
    reactionId?: string;
    connectionId?: string;
    config: Record<string, any>;
    positionX: number;
    positionY: number;
    label?: string;
}

export interface UpdateWorkflowNodeDto {
    serviceId?: string;
    actionId?: string;
    reactionId?: string;
    connectionId?: string;
    config?: Record<string, any>;
    positionX?: number;
    positionY?: number;
    label?: string;
}

export interface CreateConnectionDto {
    sourceNodeId: string;
    targetNodeId: string;
    condition?: Record<string, any>;
}

export interface WorkflowResponse {
    area: {
        id: string;
        name: string;
        userId: string;
        enabled: boolean;
    };
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
}

export class WorkflowService {
    private workflowModel: WorkflowModel;

    constructor() {
        this.workflowModel = new WorkflowModel();
    }

    async getCompleteWorkflow(areaId: string, userId: string): Promise<WorkflowResponse> {
        console.log(`[WorkflowService] Getting workflow for area ${areaId}`.blue);
        const area = await Area.findById(areaId);
        
        if (!area) {
            const error = new Error('AREA_NOT_FOUND') as CustomError;
            error.statusCode = 404;
            error.code = 'AREA_NOT_FOUND';
            throw error;
        }
        if (area.user_id !== userId) {
            const error = new Error('UNAUTHORIZED') as CustomError;
            error.statusCode = 403;
            error.code = 'UNAUTHORIZED';
            throw error;
        }
        const [nodes, connections] = await Promise.all([
            this.workflowModel.getNodesByArea(areaId),
            this.workflowModel.getConnectionsByArea(areaId)
        ]);
        console.log(`[WorkflowService] Retrieved ${nodes.length} nodes, ${connections.length} connections`.green);
        return {
            area: {
                id: area.id,
                name: area.name,
                userId: area.user_id,
                enabled: area.is_active
            },
            nodes,
            connections,
        };
    }

    async createNode(areaId: string, data: CreateWorkflowNodeDto): Promise<WorkflowNode> {
        console.log(`[WorkflowService] Creating node of type ${data.nodeType} for area ${areaId}`.blue);
        this.validateNodeData(data);
        const serviceId = data.serviceId ? await this.workflowModel.resolveServiceId(data.serviceId) : undefined;
        const actionId = data.actionId && serviceId ? await this.workflowModel.resolveActionId(serviceId, data.actionId) : undefined;
        const reactionId = data.reactionId && serviceId ? await this.workflowModel.resolveReactionId(serviceId, data.reactionId) : undefined;
        const node = await this.workflowModel.createNode(areaId, {...data, serviceId, actionId, reactionId});

        console.log(`[WorkflowService] Node created: ${node.id}`.green);
        return node;
    }

    async updateNode(nodeId: string, data: UpdateWorkflowNodeDto): Promise<WorkflowNode> {
        console.log(`[WorkflowService] Updating node ${nodeId}`.blue);
        const existingNode = await this.workflowModel.getNodeById(nodeId);

        if (!existingNode) {
            const error = new Error('NODE_NOT_FOUND') as CustomError;
            error.statusCode = 404;
            error.code = 'NODE_NOT_FOUND';
            throw error;
        }
        const node = await this.workflowModel.updateNode(nodeId, data);
        console.log(`[WorkflowService] Node updated: ${nodeId}`.green);
        return node;
    }

    async deleteNode(nodeId: string): Promise<void> {
        console.log(`[WorkflowService] Deleting node ${nodeId}`.blue);
        const existingNode = await this.workflowModel.getNodeById(nodeId);

        if (!existingNode) {
            const error = new Error('NODE_NOT_FOUND') as CustomError;
            error.statusCode = 404;
            error.code = 'NODE_NOT_FOUND';
            throw error;
        }
        await this.workflowModel.deleteNode(nodeId);
        console.log(`[WorkflowService] Node deleted: ${nodeId}`.green);
    }

    async createConnection(areaId: string, data: CreateConnectionDto): Promise<WorkflowConnection> {
        console.log(`[WorkflowService] Creating connection in area ${areaId}`.blue);
        const [sourceNode, targetNode] = await Promise.all([
            this.workflowModel.getNodeById(data.sourceNodeId),
            this.workflowModel.getNodeById(data.targetNodeId)
        ]);

        if (!sourceNode || !targetNode) {
            const error = new Error('NODE_NOT_FOUND') as CustomError;
            error.statusCode = 404;
            error.code = 'NODE_NOT_FOUND';
            throw error;
        }
        if (sourceNode.areaId !== areaId || targetNode.areaId !== areaId) {
            const error = new Error('NODES_NOT_IN_SAME_AREA') as CustomError;
            error.statusCode = 400;
            error.code = 'NODES_NOT_IN_SAME_AREA';
            throw error;
        }
        const validation = this.validateNodeConnection(sourceNode, targetNode);
        if (!validation.valid) {
            const error = new Error(validation.error || 'INVALID_CONNECTION') as CustomError;
            error.statusCode = 400;
            error.code = 'INVALID_CONNECTION';
            throw error;
        }
        const connection = await this.workflowModel.createConnection(areaId, data);
        console.log(`[WorkflowService] Connection created: ${connection.id}`.green);
        return connection;
    }

    async deleteConnection(connectionId: string): Promise<void> {
        console.log(`[WorkflowService] Deleting connection ${connectionId}`.blue);
        const existingConnection = await this.workflowModel.getConnectionById(connectionId);

        if (!existingConnection) {
            const error = new Error('CONNECTION_NOT_FOUND') as CustomError;
            error.statusCode = 404;
            error.code = 'CONNECTION_NOT_FOUND';
            throw error;
        }
        await this.workflowModel.deleteConnection(connectionId);
        console.log(`[WorkflowService] Connection deleted: ${connectionId}`.green);
    }

    private validateNodeData(data: CreateWorkflowNodeDto): void {
        if (!data.nodeType) {
            const error = new Error('MISSING_NODE_TYPE') as CustomError;
            error.statusCode = 400;
            error.code = 'MISSING_NODE_TYPE';
            throw error;
        }
        const validTypes: NodeType[] = ['trigger', 'action', 'condition', 'delay', 'filter'];
        if (!validTypes.includes(data.nodeType)) {
            const error = new Error('INVALID_NODE_TYPE') as CustomError;
            error.statusCode = 400;
            error.code = 'INVALID_NODE_TYPE';
            throw error;
        }
        if (data.nodeType === 'trigger') {
            if (!data.serviceId || !data.actionId) {
                const error = new Error('MISSING_SERVICE_OR_ACTION_FOR_TRIGGER') as CustomError;
                error.statusCode = 400;
                error.code = 'MISSING_SERVICE_OR_ACTION';
                throw error;
            }
        }
        if (data.nodeType === 'action') {
            if (!data.serviceId || !data.reactionId) {
                const error = new Error('MISSING_SERVICE_OR_REACTION_FOR_ACTION') as CustomError;
                error.statusCode = 400;
                error.code = 'MISSING_SERVICE_OR_REACTION';
                throw error;
            }
        }
    }

    private validateNodeConnection(sourceNode: WorkflowNode, targetNode: WorkflowNode): { valid: boolean; error?: string } {
        if (targetNode.nodeType === 'trigger')
            return { valid: false, error: 'A trigger cannot be a target' };
        if (sourceNode.id === targetNode.id)
            return { valid: false, error: 'A node cannot connect to itself' };
        return { valid: true };
    }

    private isUUID(str: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    }
}

export default WorkflowService;
