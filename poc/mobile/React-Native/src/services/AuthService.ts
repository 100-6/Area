import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse } from '../types';

class AuthServiceClass {
  async login(email: string, password: string): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (email === 'test@test.com' && password === 'password') {
      const user: User = {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
      };
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return { success: true, user, message: 'Connexion réussie' };
    }
    return { success: false, message: 'Email ou mot de passe incorrect' };
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('user');
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await AsyncStorage.getItem('user');
    return !!user;
  }

  async getUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }
}

export const AuthService = new AuthServiceClass();
