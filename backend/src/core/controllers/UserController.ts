import { Request, Response } from 'express';
import UserService from '../services/UserService';
import 'colors';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * GET /api/users/me
   */
  public getMe = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const profile = await this.userService.getUserProfile(req.user.id);
      res.json({ success: true, user: profile });
    } catch (error) {
      console.error('Get me error:'.red, error);
      let status = 500;
      let message = 'Failed to fetch profile';
      if (error instanceof Error) {
        if (error.message === 'USER_NOT_FOUND_OR_INACTIVE') {
          status = 404;
          message = 'User not found or inactive';
        }
      }
      res.status(status).json({ success: false, error: message });
    }
  };

  /**
   * POST /api/users/changePassword
   */
  public changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Both currentPassword and newPassword are required' });
        return;
      }
      await this.userService.changePassword(req.user.id, currentPassword, newPassword);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:'.red, error);
      if (error instanceof Error) {
        switch (error.message) {
          case 'USER_NOT_FOUND_OR_INACTIVE':
            res.status(404).json({ success: false, error: 'User not found or inactive' });
            return;
          case 'NO_LOCAL_PASSWORD':
            res.status(400).json({ success: false, error: 'Account has no local password (OAuth account)' });
            return;
          case 'INVALID_CURRENT_PASSWORD':
            res.status(401).json({ success: false, error: 'Current password is incorrect' });
            return;
          case 'PASSWORD_SAME_AS_OLD':
            res.status(400).json({ success: false, error: 'New password must be different from current password' });
            return;
          case 'PASSWORD_VALIDATION_FAILED':
            res.status(400).json({ success: false, error: 'Password validation failed', details: (error as any).validationErrors || [] });
            return;
        }
      }
      res.status(500).json({ success: false, error: 'Failed to change password' });
    }
  };
}

export default UserController;
