import { Router, Request, Response } from 'express';
import { requireAuth } from '../../core/middleware/auth';
import { githubModule } from './service';
import { UserAuthProvider } from '../../core/models/UserAuthProvider';

/**
 * Routes GitHub
 * Préfixe: /api/github
 */
const router = Router();

router.use(requireAuth);

/**
 * GET /api/github/debug
 * Debug endpoint to check GitHub connection status
 */
router.get('/debug', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const githubAuth = await UserAuthProvider.findByUserAndProvider(userId, 'github');

        if (!githubAuth) {
            return res.status(404).json({ 
                error: 'GitHub not connected',
                message: 'Please connect your GitHub account first' 
            });
        }

        if (!githubAuth.access_token) {
            return res.status(400).json({ 
                error: 'No access token found',
                message: 'GitHub connection is invalid' 
            });
        }

        // Vérifier le token
        const apiService = githubModule.getApiService();
        const isValid = await apiService.verifyToken(githubAuth.access_token);
        
        let userInfo = null;
        if (isValid) {
            try {
                userInfo = await apiService.getAuthenticatedUser(githubAuth.access_token);
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        }

        return res.json({
            success: true,
            connected: true,
            tokenValid: isValid,
            tokenPrefix: githubAuth.access_token.substring(0, 10) + '...',
            userInfo: userInfo ? {
                login: userInfo.login,
                id: userInfo.id,
                name: userInfo.name,
                email: userInfo.email,
                public_repos: userInfo.public_repos,
                total_private_repos: userInfo.total_private_repos,
                owned_private_repos: userInfo.owned_private_repos
            } : null
        });
    } catch (error: any) {
        console.error('[GitHub API Route] Error in debug:', error);
        return res.status(500).json({ 
            error: 'Debug failed',
            message: error.message 
        });
    }
});

/**
 * GET /api/github/organizations
 * Fetch all organizations the authenticated user belongs to
 */
router.get('/organizations', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Récupérer la connexion GitHub de l'utilisateur
        const githubAuth = await UserAuthProvider.findByUserAndProvider(userId, 'github');

        if (!githubAuth) {
            return res.status(404).json({ 
                error: 'GitHub not connected',
                message: 'Please connect your GitHub account first' 
            });
        }

        if (!githubAuth.access_token) {
            return res.status(400).json({ 
                error: 'No access token found',
                message: 'GitHub connection is invalid' 
            });
        }

        // Appeler l'API GitHub pour récupérer les organisations
        const apiService = githubModule.getApiService();
        const organizations = await apiService.getUserOrganizations(githubAuth.access_token);

        return res.json({
            success: true,
            count: organizations.length,
            organizations
        });
    } catch (error: any) {
        console.error('[GitHub API Route] Error fetching organizations:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch organizations',
            message: error.message 
        });
    }
});

/**
 * GET /api/github/repositories
 * Fetch all repositories accessible to the authenticated user
 * Query params:
 *  - affiliation: 'all' | 'owner' | 'member' (default: 'all')
 *  - sort: 'created' | 'updated' | 'pushed' | 'full_name' (default: 'updated')
 *  - per_page: number (default: 100)
 */
router.get('/repositories', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Récupérer les paramètres de requête
        const affiliation = (req.query.affiliation as 'all' | 'owner' | 'member') || 'all';
        const sort = (req.query.sort as 'created' | 'updated' | 'pushed' | 'full_name') || 'updated';
        const perPage = parseInt(req.query.per_page as string) || 100;

        // Récupérer la connexion GitHub de l'utilisateur
        const githubAuth = await UserAuthProvider.findByUserAndProvider(userId, 'github');

        if (!githubAuth) {
            return res.status(404).json({ 
                error: 'GitHub not connected',
                message: 'Please connect your GitHub account first' 
            });
        }

        if (!githubAuth.access_token) {
            return res.status(400).json({ 
                error: 'No access token found',
                message: 'GitHub connection is invalid' 
            });
        }

        // Appeler l'API GitHub pour récupérer les repositories
        const apiService = githubModule.getApiService();
        const repositories = await apiService.getAllRepositories(
            githubAuth.access_token,
            perPage,
            affiliation,
            sort
        );

        return res.json({
            success: true,
            count: repositories.length,
            repositories
        });
    } catch (error: any) {
        console.error('[GitHub API Route] Error fetching repositories:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch repositories',
            message: error.message 
        });
    }
});

/**
 * GET /api/github/repositories/:owner/:repo/branches
 * Fetch all branches from a specific repository
 * Path params:
 *  - owner: Repository owner (username or organization)
 *  - repo: Repository name
 * Query params:
 *  - per_page: number (default: 100)
 */
router.get('/repositories/:owner/:repo/branches', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { owner, repo } = req.params;
        const perPage = parseInt(req.query.per_page as string) || 100;

        if (!owner || !repo) {
            return res.status(400).json({ 
                error: 'Missing parameters',
                message: 'Owner and repo are required' 
            });
        }

        // Récupérer la connexion GitHub de l'utilisateur
        const githubAuth = await UserAuthProvider.findByUserAndProvider(userId, 'github');

        if (!githubAuth) {
            return res.status(404).json({ 
                error: 'GitHub not connected',
                message: 'Please connect your GitHub account first' 
            });
        }

        if (!githubAuth.access_token) {
            return res.status(400).json({ 
                error: 'No access token found',
                message: 'GitHub connection is invalid' 
            });
        }

        // Appeler l'API GitHub pour récupérer les branches
        const apiService = githubModule.getApiService();
        const branches = await apiService.getRepositoryBranches(
            owner,
            repo,
            githubAuth.access_token,
            perPage
        );

        return res.json({
            success: true,
            repository: `${owner}/${repo}`,
            count: branches.length,
            branches
        });
    } catch (error: any) {
        console.error('[GitHub API Route] Error fetching branches:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch branches',
            message: error.message 
        });
    }
});

export default router;
