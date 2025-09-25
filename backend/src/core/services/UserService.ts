import { User } from '../models/User';
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
  };

  /**
   * Mettre à jour le profil utilisateur (public interne) par ID
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const user = await User.findById(userId);
    if (!user || !user.is_active) {
      throw new Error('USER_NOT_FOUND_OR_INACTIVE');
    }

    // Validations
    if (updates.firstName !== undefined && updates.firstName.trim() === '') {
      throw new Error('INVALID_INPUT');
    }
    if (updates.lastName !== undefined && updates.lastName.trim() === '') {
      throw new Error('INVALID_INPUT');
    }
    if (updates.avatarUrl !== undefined && updates.avatarUrl.trim() === '') {
      throw new Error('INVALID_INPUT');
    }

    const allowedFields = ['firstName', 'lastName', 'avatarUrl'];
    const updateFields = Object.keys(updates);
    const unallowedFields = updateFields.filter(field => !allowedFields.includes(field));
    if (unallowedFields.length > 0) {
      throw new Error('UNALLOWED_UPDATE_FIELDS');
    }

    // Build update payload for DB
    const updatePayload: any = {};
    if (updates.firstName !== undefined) updatePayload.first_name = updates.firstName;
    if (updates.lastName !== undefined) updatePayload.last_name = updates.lastName;
    if (updates.avatarUrl !== undefined) updatePayload.avatar_url = updates.avatarUrl;

    if (Object.keys(updatePayload).length === 0) {
      return this.getUserProfile(userId);
    }

    await User.update(userId, updatePayload);
    return this.getUserProfile(userId);
  };

  /**
   * Supprimer (désactiver) le compte utilisateur par ID
   */
  async deleteUserAccount(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user || !user.is_active) {
      throw new Error('USER_NOT_FOUND_OR_INACTIVE');
    }
    await User.hardDelete(userId);
  };
}

export default UserService;
