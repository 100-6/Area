import { Request, Response, NextFunction } from 'express';
import UserService from '../services/UserService';
import { asyncHandler } from '../middleware/error';
import 'colors';

interface CustomError extends Error {
    statusCode?: number;
    validationErrors?: Array<{ field: string; message: string }>;
    code?: string;
}

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    /**
     * GET /api/users/me
     */
    public getMe = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            const error = new Error('UNAUTHORIZED') as CustomError;
            error.statusCode = 401;
            error.code = 'UNAUTHORIZED';
            return next(error);
        }
        try {
            const profile = await this.userService.getUserProfile(req.user.id);
            res.json({ success: true, user: profile });
        } catch (error) {
            next(error);
        }
    });

    /**
     * POST /api/users/changePassword
     */
    public changePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            const error = new Error('UNAUTHORIZED') as CustomError;
            error.statusCode = 401;
            error.code = 'UNAUTHORIZED';
            return next(error);
        }
        const { currentPassword, newPassword } = req.body || {};
        if (!currentPassword || !newPassword) {
            const error = new Error('MISSING_REQUIRED_FIELDS') as CustomError;
            error.statusCode = 400;
            error.code = 'MISSING_REQUIRED_FIELDS';
            return next(error);
        }
        try {
            await this.userService.changePassword(req.user.id, currentPassword, newPassword);
            res.json({ success: true, message: 'Password changed successfully' });
        } catch (error) {
            next(error);
        }
    });

    /**
     * PATCH /api/users/me
     */
    public updateMe = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            const error = new Error('UNAUTHORIZED') as CustomError;
            error.statusCode = 401;
            error.code = 'UNAUTHORIZED';
            return next(error);
        }
        try {
            const updatedProfile = await this.userService.updateUserProfile(req.user.id, req.body);
            res.json({ success: true, user: updatedProfile });
        } catch (error) {
            next(error);
        }
    });

    /**
     * DELETE /api/users/me
     */
    public deleteMe = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            const error = new Error('UNAUTHORIZED') as CustomError;
            error.statusCode = 401;
            error.code = 'UNAUTHORIZED';
            return next(error);
        }
        try {
            await this.userService.deleteUserAccount(req.user.id);
            res.json({ success: true, message: 'User account deleted' });
        } catch (error) {
            next(error);
        }
    });
}

export default UserController;
