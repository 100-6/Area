import { User } from '../models/User';
import { PasswordManager } from '../../shared/auth/PasswordManager';
import 'colors';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  registrationMethod: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export class UserService {
  /**
   * Récupérer le profil utilisateur (public interne) par ID
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await User.findById(userId);
    if (!user || !user.is_active) {
      throw new Error('USER_NOT_FOUND_OR_INACTIVE');
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      avatarUrl: user.avatar_url || undefined,
      emailVerified: user.email_verified,
      registrationMethod: user.registration_method,
      lastLoginAt: user.last_login_at || undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      isActive: user.is_active
    };
  }

  /**
   * Changer le mot de passe de l'utilisateur
   * Requirements:
   *  - User must be authenticated (userId provided)
   *  - Current password must match existing hash
   *  - New password must satisfy PasswordManager rules
   *  - New password must be different from the old one
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user || !user.is_active) {
      throw new Error('USER_NOT_FOUND_OR_INACTIVE');
    }
    if (!user.password_hash) {
      // Compte créé via OAuth sans mot de passe local
      throw new Error('NO_LOCAL_PASSWORD');
    }
    const isCurrentValid = await PasswordManager.comparePassword(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      throw new Error('INVALID_CURRENT_PASSWORD');
    }
    if (currentPassword === newPassword) {
      throw new Error('PASSWORD_SAME_AS_OLD');
    }
    const validation = PasswordManager.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      const error: any = new Error('PASSWORD_VALIDATION_FAILED');
      error.validationErrors = validation.errors;
      throw error;
    }
    const newHash = await PasswordManager.hashPassword(newPassword);
    await User.update(userId, { password_hash: newHash });
  }
}

export default UserService;
