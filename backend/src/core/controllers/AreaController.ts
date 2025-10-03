import { Request, Response, NextFunction } from 'express';
import AreaService from '../services/AreaService';
import { asyncHandler } from '../middleware/error';
import 'colors';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

export class AreaController {
    private areaService: AreaService;

    constructor() {
        this.areaService = new AreaService();
    }

    public createArea = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { name, description } = req.body;

        if (!name) {
            const error = new Error('MISSING_REQUIRED_FIELDS') as CustomError;
            error.statusCode = 400;
            return next(error);
        }
        try {
            const area = await this.areaService.createArea({user_id: req.user.id, name, description});
            res.status(201).json({
                success: true,
                message: 'AREA created successfully',
                area
            });
        } catch (error) {
            next(error);
        }
    });

    public getAreas = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const areas = await this.areaService.getUserAreas(req.user.id);
            res.json({
                success: true,
                count: areas.length,
                areas
            });
        } catch (error) {
            next(error);
        }
    });

    public getAreaById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;

        try {
            const area = await this.areaService.getAreaById(id, req.user.id);
            if (!area) {
                const error = new Error('AREA_NOT_FOUND') as CustomError;
                error.statusCode = 404;
                return next(error);
            }
            res.json({
                success: true,
                area
            });
        } catch (error) {
            next(error);
        }
    });

    public updateArea = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const updates = req.body;

        try {
            const area = await this.areaService.updateArea(id, req.user.id, updates);
            if (!area) {
                const error = new Error('AREA_NOT_FOUND') as CustomError;
                error.statusCode = 404;
                return next(error);
            }
            res.json({
                success: true,
                message: 'AREA updated successfully',
                area
            });
        } catch (error) {
            next(error);
        }
    });

    public toggleArea = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const { is_active } = req.body;

        if (typeof is_active !== 'boolean') {
            const error = new Error('INVALID_REQUEST') as CustomError;
            error.statusCode = 400;
            return next(error);
        }
        try {
            await this.areaService.toggleArea(id, req.user.id, is_active);
            res.json({
                success: true,
                message: `AREA ${is_active ? 'activated' : 'deactivated'} successfully`
            });
        } catch (error) {
            next(error);
        }
    });

    public deleteArea = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;

        try {
            const deleted = await this.areaService.deleteArea(id, req.user.id);
            if (!deleted) {
                const error = new Error('AREA_NOT_FOUND') as CustomError;
                error.statusCode = 404;
                return next(error);
            }
            res.json({
                success: true,
                message: 'AREA deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    });
}

export default AreaController;
