import { Request, Response, NextFunction } from 'express';
import { WorkflowService } from '../services/WorkflowService';
import { asyncHandler } from '../middleware/error';
import 'colors';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Controller pour gérer les routes /api/workflows
 */
export class WorkflowController {
    private workflowService: WorkflowService;

    constructor() {
        this.workflowService = new WorkflowService();
    }

    /**
     * GET /api/workflows/:areaId
     * Récupère l'intégralité du workflow (nodes, connections, UI prefs)
     */
    public getWorkflow = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            const error = new Error('UNAUTHORIZED') as CustomError;
            error.statusCode = 401;
            error.code = 'UNAUTHORIZED';
            return next(error);
        }
        const { areaId } = req.params;

        try {
            const workflow = await this.workflowService.getCompleteWorkflow(areaId, req.user.id);
            res.json({
                success: true,
                workflow
            });
        } catch (error) {
            next(error);
        }
    });

    /**
     * POST /api/workflows/:areaId/nodes
     * Créer un nouveau nœud
     */
    public createNode = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            const error = new Error('UNAUTHORIZED') as CustomError;
            error.statusCode = 401;
            error.code = 'UNAUTHORIZED';
            return next(error);
        }
        const { areaId } = req.params;
        const { nodeType, serviceId, actionId, reactionId, connectionId, config, positionX, positionY, label } = req.body;

        if (!nodeType || positionX === undefined || positionY === undefined) {
            const error = new Error('MISSING_REQUIRED_FIELDS') as CustomError;
            error.statusCode = 400;
            error.code = 'MISSING_REQUIRED_FIELDS';
            return next(error);
        }
        try {
            const node = await this.workflowService.createNode(areaId, {nodeType, serviceId, actionId, reactionId, connectionId, config: config || {}, positionX, positionY, label});
            res.status(201).json({
                success: true,
                message: 'Node created successfully',
                node
            });
        } catch (error) {
            next(error);
        }
    });

    /**
     * PATCH /api/workflows/nodes/:nodeId
     * Mettre à jour un nœud
     */
    public updateNode = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            const error = new Error('UNAUTHORIZED') as CustomError;
            error.statusCode = 401;
            error.code = 'UNAUTHORIZED';
            return next(error);
        }
        const { nodeId } = req.params;

        try {
            const node = await this.workflowService.updateNode(nodeId, req.body);
            res.json({
                success: true,
                message: 'Node updated successfully',
                node
            });
        } catch (error) {
            next(error);
        }
    });

    /**
     * DELETE /api/workflows/nodes/:nodeId
     * Supprimer un nœud
     */
    public deleteNode = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            const error = new Error('UNAUTHORIZED') as CustomError;
            error.statusCode = 401;
            error.code = 'UNAUTHORIZED';
            return next(error);
        }
        const { nodeId } = req.params;

        try {
            await this.workflowService.deleteNode(nodeId);
            res.json({
                success: true,
                message: 'Node deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    });

    /**
     * POST /api/workflows/:areaId/connections
     * Créer une connexion entre deux nœuds
     */
    public createConnection = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            const error = new Error('UNAUTHORIZED') as CustomError;
            error.statusCode = 401;
            error.code = 'UNAUTHORIZED';
            return next(error);
        }
        const { areaId } = req.params;
        const { sourceNodeId, targetNodeId, condition } = req.body;

        if (!sourceNodeId || !targetNodeId) {
            const error = new Error('MISSING_REQUIRED_FIELDS') as CustomError;
            error.statusCode = 400;
            error.code = 'MISSING_REQUIRED_FIELDS';
            return next(error);
        }
        try {
            // Vérifier si on doit éviter de redémarrer les triggers (lors de la modification d'un workflow)

            const connection = await this.workflowService.createConnection(areaId, {
                sourceNodeId,
                targetNodeId,
                condition
            });

            res.status(201).json({
                success: true,
                message: 'Connection created successfully',
                connection
            });
        } catch (error) {
            next(error);
        }
    });

    /**
     * DELETE /api/workflows/connections/:connectionId
     * Supprimer une connexion
     */
    public deleteConnection = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            const error = new Error('UNAUTHORIZED') as CustomError;
            error.statusCode = 401;
            error.code = 'UNAUTHORIZED';
            return next(error);
        }
        const { connectionId } = req.params;

        try {
            await this.workflowService.deleteConnection(connectionId);
            res.json({
                success: true,
                message: 'Connection deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    });
}

export default WorkflowController;
