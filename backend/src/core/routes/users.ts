import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { requireAuth } from '../middleware/auth';

const router = Router();
const userController = new UserController();

/**
 * GET /api/users/me
 * @tags Users
 * @summary Get current user profile
 * @description Retrieve the authenticated user's profile information
 * @security bearerAuth
 * @returns {object} 200 - User profile retrieved successfully
 * @returns {object} 401 - Unauthorized
 * @example response - 200 - Success response
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "email": "user@example.com",
 *     "username": "johndoe",
 *     "createdAt": "2024-01-01T00:00:00.000Z",
 *     "updatedAt": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 */
/**
 * PATCH /api/users/me
 * @tags Users
 * @summary Update current user profile
 * @description Update the authenticated user's profile information
 * @security bearerAuth
 * @param {object} request.body - User profile updates
 * @param {string} request.body.username - New username - application/json
 * @param {string} request.body.email - New email - application/json
 * @returns {object} 200 - User profile updated successfully
 * @returns {object} 401 - Unauthorized
 * @example request - Example update request
 * {
 *   "username": "newusername",
 *   "email": "newemail@example.com"
 * }
 * @example response - 200 - Success response
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "email": "newemail@example.com",
 *     "username": "newusername",
 *     "updatedAt": "2024-01-02T00:00:00.000Z"
 *   }
 * }
 */
/**
 * DELETE /api/users/me
 * @tags Users
 * @summary Delete current user account
 * @description Permanently delete the authenticated user's account
 * @security bearerAuth
 * @returns {object} 200 - User account deleted successfully
 * @returns {object} 401 - Unauthorized
 * @example response - 200 - Success response
 * {
 *   "success": true,
 *   "message": "Account deleted successfully"
 * }
 */
router
    .route('/me')
    .get(requireAuth, userController.getMe)
    .patch(requireAuth, userController.updateMe)
    .delete(requireAuth, userController.deleteMe);

/**
 * POST /api/users/changePassword
 * @tags Users
 * @summary Change user password
 * @description Change the authenticated user's password
 * @security bearerAuth
 * @param {object} request.body.required - Password change info
 * @param {string} request.body.currentPassword.required - Current password - application/json
 * @param {string} request.body.newPassword.required - New password (min 8 characters) - application/json
 * @returns {object} 200 - Password changed successfully
 * @returns {object} 401 - Unauthorized or incorrect current password
 * @example request - Example password change request
 * {
 *   "currentPassword": "OldP@ssw0rd",
 *   "newPassword": "NewSecureP@ssw0rd"
 * }
 * @example response - 200 - Success response
 * {
 *   "success": true,
 *   "message": "Password changed successfully"
 * }
 */
router.post('/changePassword', requireAuth, userController.changePassword);

export default router;
