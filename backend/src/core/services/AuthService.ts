import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User';
import 'colors';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface RegisterResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: Date;
  };
  token: string;
}

class AuthService {
  private userModel = new UserModel();

  /**
   * Enregistrer un nouvel utilisateur
   */
  async register(registerData: RegisterData): Promise<RegisterResult> {
    const { email, password, firstName, lastName } = registerData;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await this.userModel.findByEmail(email);
    if (userExists) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur
    const newUser = await this.userModel.create({
      email,
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      registration_method: 'email'
    });

    // Générer le token JWT
    const token = this.generateToken(newUser.id, newUser.email);

    console.log(`SUCCESS: New user registered: ${email} (ID: ${newUser.id})`.green);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        createdAt: newUser.created_at
      },
      token
    };
  }

  /**
   * Générer un token JWT
   */
  private generateToken(userId: string, email: string): string {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    const payload = { 
      userId, 
      email 
    };
    
    // @ts-ignore - Ignore type checking pour cette ligne spécifique
    return jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
  }
}

export default AuthService;
