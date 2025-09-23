import { Router } from 'express';
import AuthController from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

// Route d'enregistrement uniquement
router.post('/register', authController.register);

export default router;
