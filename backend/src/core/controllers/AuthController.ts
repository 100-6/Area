import { Request, Response } from 'express';
import Joi from 'joi';
import AuthService from '../services/AuthService';
import 'colors';

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

class AuthController {
  private authService = new AuthService();

  // Schéma de validation pour l'enregistrement
  private registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required()
  });

  /**
   * Enregistrement d'un nouvel utilisateur
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validation des données
      const { error, value } = this.registerSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const registerData: RegisterRequest = value;

      // Appeler le service d'authentification
      const result = await this.authService.register(registerData);

      res.status(201).json({
        message: 'Registration successful',
        user: result.user,
        token: result.token
      });

    } catch (error) {
      console.error('ERROR: Registration failed:'.red, error);

      // Gestion des erreurs métier
      if (error instanceof Error) {
        switch (error.message) {
          case 'USER_ALREADY_EXISTS':
            res.status(409).json({
              error: 'User already exists',
              message: 'Un compte existe déjà avec cet email'
            });
            return;
        }
      }

      // Erreur générique
      res.status(500).json({
        error: 'Internal server error',
        message: 'Une erreur est survenue lors de l\'enregistrement'
      });
    }
  };
}

export default AuthController;
