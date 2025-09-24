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
  }
}

export default UserService;
