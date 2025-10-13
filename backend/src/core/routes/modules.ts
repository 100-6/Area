import { Router } from 'express';
import { ModuleController } from '../controllers/ModuleController';
import { requireAuth } from '../middleware/auth';

const router = Router();
const moduleController = new ModuleController();

// Appliquer l'authentification sur toutes les routes
router.use(requireAuth);

/**
 * GET /api/modules
 * Liste tous les modules disponibles
 * Note: Doit être avant /:identifier pour éviter les conflits
 */
router.get('/', (req, res) => {
    moduleController.listModules(req, res);
});

/**
 * GET /api/modules/:identifier
 * Récupère les variables retournées par un module ou un nœud
 * 
 * Path params:
 * - identifier: string (module name like 'discord' OR node UUID)
 * 
 * Query params:
 * - type: 'trigger' | 'action' (optionnel, seulement pour les noms de modules)
 */
router.get('/:identifier', (req, res) => {
    moduleController.getModuleVariables(req, res);
});

export default router;
