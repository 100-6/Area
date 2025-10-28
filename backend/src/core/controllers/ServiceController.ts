import { Request, Response, NextFunction } from 'express';
import { UserAuthProvider } from '../models/UserAuthProvider';
import { ServiceService } from '../services/ServiceService';
import { asyncHandler } from '../middleware/error';
import 'colors';

interface CustomError extends Error {
    statusCode?: number;
    validationErrors?: Array<{ field: string; message: string }>;
    code?: string;
}

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
    };
}

export class ConnectedServicesController {
    private serviceService: ServiceService;

    constructor() {
        this.serviceService = new ServiceService();
    }

    /**
     * Get all active services
     * GET /api/services
     */
    public getAllServices = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const services = await this.serviceService.getAllServices();

            res.json({success: true, data: services});
        } catch (error) {
            next(error);
        }
    });

    /**
     * Get service by ID
     * GET /api/services/:id
     */
    public getServiceById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const service = await this.serviceService.getServiceById(id);

            res.json({success: true, data: service});
        } catch (error: any) {
            if (error.message === 'SERVICE_NOT_FOUND' || error.message === 'SERVICE_INACTIVE') {
                const customError = new Error(error.message) as CustomError;
                customError.statusCode = 404;
                customError.code = error.message;
                return next(customError);
            }
            next(error);
        }
    });

    /**
     * Get service by name
     * GET /api/services/name/:name
     */
    public getServiceByName = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { name } = req.params;
            const service = await this.serviceService.getServiceByName(name);

            res.json({success: true, data: service});
        } catch (error: any) {
            if (error.message === 'SERVICE_NOT_FOUND' || error.message === 'SERVICE_INACTIVE') {
                const customError = new Error(error.message) as CustomError;
                customError.statusCode = 404;
                customError.code = error.message;
                return next(customError);
            }
            next(error);
        }
    });

    /**
     * Get status of a specific service connection
     * GET /api/services/:serviceName/status
     */
    public getServiceStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { serviceName } = req.params;
            const userId = req.user.id;
            const authProvider = await UserAuthProvider.findByUserAndProvider(userId, serviceName);

            if (authProvider)
                res.json({connected: true, service: serviceName, connectedAt: authProvider.created_at});
            else
                res.json({connected: false, service: serviceName, connectedAt: null});
        } catch (error) {
            next(error);
        }
    });

    /**
     * Get all connected services for the authenticated user
     * GET /api/services/connected
     * Note: All services now use the standard /api/auth/{service} pattern
     */
    public getConnectedServices = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user.id;
            const allServices = await this.serviceService.getAllServices();
            const services = await Promise.all(
                allServices.map(async (service) => {
                    const authProvider = await UserAuthProvider.findByUserAndProvider(userId, service.name);
                    return {
                        id: service.id,
                        name: service.name,
                        displayName: service.displayName,
                        description: service.description,
                        iconUrl: service.iconUrl,
                        authType: service.authType,
                        connected: !!authProvider,
                        connectedAt: authProvider?.created_at || null
                    };
                })
            );
            res.json({ success: true, data: services });
        } catch (error) {
            next(error);
        }
    });
}
