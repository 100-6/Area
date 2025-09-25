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
   * PATCH /api/users/me
   */
  public updateMe = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const updatedProfile = await this.userService.updateUserProfile(req.user.id, req.body);
      res.json({ success: true, user: updatedProfile });
    } catch (error) {
      console.error('Update me error:'.red, error);
      let status = 500;
      let message = 'Failed to update profile';
      if (error instanceof Error) {
        if (error.message === 'USER_NOT_FOUND_OR_INACTIVE') {
          status = 404;
          message = 'User not found or inactive';
        } else if (error.message === 'INVALID_INPUT') {
          status = 400;
          message = 'Invalid input data';
        } else if (error.message === 'UNALLOWED_UPDATE_FIELDS') {
          status = 400;
          message = 'Unallowed update fields';
        }
      }
      res.status(status).json({ success: false, error: message });
    }
  };

  /**
   * DELETE /api/users/me
   */
  public deleteMe = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      await this.userService.deleteUserAccount(req.user.id);
      res.json({ success: true, message: 'User account deleted' });
    } catch (error) {
      console.error('Delete me error:'.red, error);
      let status = 500;
      let message = 'Failed to deactivate account';
      if (error instanceof Error) {
        if (error.message === 'USER_NOT_FOUND_OR_INACTIVE') {
          status = 404;
          message = 'User not found or already inactive';
        }
      }
      res.status(status).json({ success: false, error: message });
    }
  }
}

export default UserController;
