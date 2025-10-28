import { Router, Request, Response } from 'express';
import { requireAuth } from '../../core/middleware/auth';
import { dropboxModule } from './service';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';

/**
 * Routes Dropbox
 * Préfixe: /api/dropbox
 */
const router = Router();

router.use(requireAuth);

/**
 * GET /api/dropbox/files
 * Liste tous les fichiers et dossiers dans un chemin Dropbox
 * Query params:
 *  - path: chemin du dossier (default: '' pour la racine)
 *  - recursive: boolean (default: false) - liste récursive
 */
router.get('/files', async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const path = (req.query.path as string) || '';
    const recursive = req.query.recursive === 'true';
    
    try {
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        console.log('[Dropbox Route] Fetching files for user:', userId);
        console.log('[Dropbox Route] Path:', path, 'Recursive:', recursive);

        // Récupérer la connexion Dropbox de l'utilisateur
        const dropboxAuth = await UserAuthProvider.findByUserAndProvider(userId, 'dropbox');

        if (!dropboxAuth) {
            console.log('[Dropbox Route] No Dropbox auth found for user:', userId);
            return res.status(404).json({ 
                error: 'Dropbox not connected',
                message: 'Please connect your Dropbox account first' 
            });
        }

        if (!dropboxAuth.access_token) {
            console.log('[Dropbox Route] No access token found');
            return res.status(400).json({ 
                error: 'No access token found',
                message: 'Dropbox connection is invalid' 
            });
        }

        console.log('[Dropbox Route] Token found:', dropboxAuth.access_token.substring(0, 20) + '...');

        // Appeler l'API Dropbox pour récupérer les fichiers
        const apiService = dropboxModule.getApiService();
        console.log('[Dropbox Route] Calling listFolder with path:', path);
        
        const entries = await apiService.listFolder(path, dropboxAuth.access_token, recursive);
        
        console.log('[Dropbox Route] Received', entries.length, 'entries');
        console.log('[Dropbox Route] First entry:', entries.length > 0 ? entries[0] : 'none');

        // Séparer les fichiers et les dossiers pour faciliter l'utilisation frontend
        const files = entries.filter(entry => entry['.tag'] === 'file');
        const folders = entries.filter(entry => entry['.tag'] === 'folder');

        return res.json({
            success: true,
            path: path || '/',
            total: entries.length,
            filesCount: files.length,
            foldersCount: folders.length,
            files,
            folders,
            entries // Tous les éléments mélangés (pour compatibilité)
        });
    } catch (error: any) {
        console.error('[Dropbox API Route] Error fetching files:', error);
        
        // Gestion spécifique de l'erreur "path not found"
        if (error.message?.includes('path/not_found') || error.message?.includes('409')) {
            return res.status(404).json({ 
                error: 'Path not found',
                message: `Le dossier "${path}" n'existe pas dans votre Dropbox`,
                path: path
            });
        }
        
        // Gestion de l'erreur d'authentification
        if (error.message?.includes('401') || error.message?.includes('invalid_access_token')) {
            return res.status(401).json({ 
                error: 'Invalid token',
                message: 'Votre token Dropbox est invalide. Veuillez vous reconnecter.'
            });
        }
        
        return res.status(500).json({ 
            error: 'Failed to fetch files',
            message: error.message 
        });
    }
});

/**
 * GET /api/dropbox/folders
 * Liste uniquement les dossiers dans un chemin Dropbox
 * Query params:
 *  - path: chemin du dossier (default: '' pour la racine)
 */
router.get('/folders', async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const path = (req.query.path as string) || '';
    
    try {
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const dropboxAuth = await UserAuthProvider.findByUserAndProvider(userId, 'dropbox');

        if (!dropboxAuth) {
            return res.status(404).json({ 
                error: 'Dropbox not connected',
                message: 'Please connect your Dropbox account first' 
            });
        }

        if (!dropboxAuth.access_token) {
            return res.status(400).json({ 
                error: 'No access token found',
                message: 'Dropbox connection is invalid' 
            });
        }

        const apiService = dropboxModule.getApiService();
        const entries = await apiService.listFolder(path, dropboxAuth.access_token, false);

        // Filtrer uniquement les dossiers
        const folders = entries.filter(entry => entry['.tag'] === 'folder');

        return res.json({
            success: true,
            path: path || '/',
            count: folders.length,
            folders
        });
    } catch (error: any) {
        console.error('[Dropbox API Route] Error fetching folders:', error);
        
        // Gestion spécifique de l'erreur "path not found"
        if (error.message?.includes('path/not_found') || error.message?.includes('409')) {
            return res.status(404).json({ 
                error: 'Path not found',
                message: `Le dossier "${path}" n'existe pas dans votre Dropbox`,
                path: path
            });
        }
        
        // Gestion de l'erreur d'authentification
        if (error.message?.includes('401') || error.message?.includes('invalid_access_token')) {
            return res.status(401).json({ 
                error: 'Invalid token',
                message: 'Votre token Dropbox est invalide. Veuillez vous reconnecter.'
            });
        }
        
        return res.status(500).json({ 
            error: 'Failed to fetch folders',
            message: error.message 
        });
    }
});

/**
 * GET /api/dropbox/debug
 * Debug endpoint pour vérifier la connexion Dropbox
 */
router.get('/debug', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const dropboxAuth = await UserAuthProvider.findByUserAndProvider(userId, 'dropbox');

        if (!dropboxAuth) {
            return res.status(404).json({ 
                error: 'Dropbox not connected',
                message: 'Please connect your Dropbox account first' 
            });
        }

        if (!dropboxAuth.access_token) {
            return res.status(400).json({ 
                error: 'No access token found',
                message: 'Dropbox connection is invalid' 
            });
        }

        // Vérifier le token
        const apiService = dropboxModule.getApiService();
        const isValid = await apiService.verifyToken(dropboxAuth.access_token);

        return res.json({
            success: true,
            connected: true,
            tokenValid: isValid,
            tokenPrefix: dropboxAuth.access_token.substring(0, 10) + '...'
        });
    } catch (error: any) {
        console.error('[Dropbox API Route] Error in debug:', error);
        return res.status(500).json({ 
            error: 'Debug failed',
            message: error.message 
        });
    }
});

export default router;
