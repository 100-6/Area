import { Request, Response, NextFunction } from 'express';
import 'colors';

interface CustomError extends Error {
    statusCode?: number;
    validationErrors?: Array<{ field: string; message: string }>;
    code?: string;
}

export const errorHandler = (error: CustomError, req: Request, res: Response, next: NextFunction): void => {
    console.error('ERROR:'.red, error.message);
    console.error('Stack:'.yellow, error.stack);
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';
    let errorCode = error.code || 'INTERNAL_ERROR';

    switch (error.message) {
        case 'USER_ALREADY_EXISTS':
            statusCode = 409;
            message = 'Un compte existe déjà avec cet email';
            errorCode = 'USER_ALREADY_EXISTS';
            break;
        case 'INVALID_CREDENTIALS':
            statusCode = 401;
            message = 'Email ou mot de passe incorrect';
            errorCode = 'INVALID_CREDENTIALS';
            break;
        case 'ACCOUNT_INACTIVE':
            statusCode = 403;
            message = 'Ce compte est inactif';
            errorCode = 'ACCOUNT_INACTIVE';
            break;
        case 'VALIDATION_FAILED':
            statusCode = 400;
            message = 'Données invalides';
            errorCode = 'VALIDATION_FAILED';
            break;
        case 'Token expired':
        case 'Invalid token':
        case 'TOKEN_EXPIRED':
        case 'INVALID_TOKEN':
            statusCode = 401;
            message = 'Token invalide ou expiré';
            errorCode = 'UNAUTHORIZED';
            break;
        case 'USER_NOT_FOUND_OR_INACTIVE':
            statusCode = 404;
            message = 'Utilisateur introuvable ou inactif';
            errorCode = 'USER_NOT_FOUND';
            break;
        case 'NO_TOKEN_PROVIDED':
            statusCode = 401;
            message = 'Token d\'authentification requis';
            errorCode = 'NO_TOKEN';
            break;
        case 'NO_REFRESH_TOKEN':
            statusCode = 400;
            message = 'Token de rafraîchissement requis';
            errorCode = 'NO_REFRESH_TOKEN';
            break;
        case 'AUTHORIZATION_HEADER_MISSING':
            statusCode = 401;
            message = 'En-tête d\'autorisation manquant ou mal formé';
            errorCode = 'AUTHORIZATION_HEADER_MISSING';
            break;
        case 'TOKEN_ERROR':
            statusCode = 401;
            message = 'Erreur de token';
            errorCode = 'TOKEN_ERROR';
            break;
        case 'AUTHENTICATION_FAILED':
            statusCode = 401;
            message = 'Échec de l\'authentification';
            errorCode = 'AUTHENTICATION_FAILED';
            break;
        case 'GOOGLE_OAUTH_NOT_CONFIGURED':
        case 'DISCORD_OAUTH_NOT_CONFIGURED':
        case 'GITHUB_OAUTH_NOT_CONFIGURED':
            statusCode = 500;
            message = 'Service OAuth non configuré';
            errorCode = 'OAUTH_NOT_CONFIGURED';
            break;
        case 'OAUTH_CALLBACK_FAILED':
            statusCode = 400;
            message = 'Échec de l\'authentification OAuth';
            errorCode = 'OAUTH_CALLBACK_FAILED';
            break;
        case 'MISSING_REQUIRED_FIELDS':
            statusCode = 400;
            message = 'Champs requis manquants';
            errorCode = 'MISSING_REQUIRED_FIELDS';
            break;
        case 'NO_LOCAL_PASSWORD':
            statusCode = 400;
            message = 'Ce compte n\'a pas de mot de passe local (compte OAuth)';
            errorCode = 'NO_LOCAL_PASSWORD';
            break;
        case 'INVALID_CURRENT_PASSWORD':
            statusCode = 401;
            message = 'Mot de passe actuel incorrect';
            errorCode = 'INVALID_CURRENT_PASSWORD';
            break;
        case 'PASSWORD_SAME_AS_OLD':
            statusCode = 400;
            message = 'Le nouveau mot de passe doit être différent de l\'ancien';
            errorCode = 'PASSWORD_SAME_AS_OLD';
            break;
        case 'PASSWORD_VALIDATION_FAILED':
            statusCode = 400;
            message = 'Le mot de passe ne respecte pas les critères de sécurité';
            errorCode = 'PASSWORD_VALIDATION_FAILED';
            break;
        case 'INVALID_INPUT':
            statusCode = 400;
            message = 'Données d\'entrée invalides';
            errorCode = 'INVALID_INPUT';
            break;
        case 'UNALLOWED_UPDATE_FIELDS':
            statusCode = 400;
            message = 'Certains champs ne peuvent pas être modifiés';
            errorCode = 'UNALLOWED_UPDATE_FIELDS';
            break;
        case 'AREA_NOT_FOUND':
            statusCode = 404;
            message = 'AREA introuvable ou accès refusé';
            errorCode = 'AREA_NOT_FOUND';
            break;
        case 'NODE_NOT_FOUND':
            statusCode = 404;
            message = 'Nœud introuvable';
            errorCode = 'NODE_NOT_FOUND';
            break;
        case 'CONNECTION_NOT_FOUND':
            statusCode = 404;
            message = 'Connexion introuvable';
            errorCode = 'CONNECTION_NOT_FOUND';
            break;
        case 'MISSING_NODE_TYPE':
            statusCode = 400;
            message = 'Le type de nœud est requis';
            errorCode = 'MISSING_NODE_TYPE';
            break;
        case 'INVALID_NODE_TYPE':
            statusCode = 400;
            message = 'Type de nœud invalide. Types valides: trigger, action, condition, delay, filter';
            errorCode = 'INVALID_NODE_TYPE';
            break;
        case 'MISSING_SERVICE_OR_ACTION':
            statusCode = 400;
            message = 'serviceId et actionId sont requis pour les nœuds trigger et action';
            errorCode = 'MISSING_SERVICE_OR_ACTION';
            break;
        case 'NODES_NOT_IN_SAME_AREA':
            statusCode = 400;
            message = 'Les nœuds doivent appartenir à la même AREA';
            errorCode = 'NODES_NOT_IN_SAME_AREA';
            break;
        case 'INVALID_CONNECTION':
            statusCode = 400;
            message = 'Connexion invalide entre les nœuds';
            errorCode = 'INVALID_CONNECTION';
            break;
        case 'CONNECTION_NOT_FOUND':
            statusCode = 404;
            message = 'Connexion introuvable';
            errorCode = 'CONNECTION_NOT_FOUND';
            break;
        case 'MISSING_NODE_TYPE':
            statusCode = 400;
            message = 'Le type de nœud est requis';
            errorCode = 'MISSING_NODE_TYPE';
            break;
        case 'INVALID_NODE_TYPE':
            statusCode = 400;
            message = 'Type de nœud invalide';
            errorCode = 'INVALID_NODE_TYPE';
            break;
        case 'MISSING_SERVICE_OR_ACTION':
            statusCode = 400;
            message = 'serviceId et actionId requis pour trigger/action';
            errorCode = 'MISSING_SERVICE_OR_ACTION';
            break;
        case 'NODES_NOT_IN_SAME_AREA':
            statusCode = 400;
            message = 'Les nœuds doivent appartenir à la même AREA';
            errorCode = 'NODES_NOT_IN_SAME_AREA';
            break;
        case 'INVALID_CONNECTION':
            statusCode = 400;
            message = 'Connexion invalide entre les nœuds';
            errorCode = 'INVALID_CONNECTION';
            break;
        case 'TRIGGER_ALREADY_EXISTS':
            statusCode = 400;
            message = 'Un nœud de type trigger existe déjà dans cette AREA';
            errorCode = 'TRIGGER_ALREADY_EXISTS';
            break;
        case 'USER_NOT_AUTHENTICATED':
            statusCode = 401;
            message = 'Utilisateur non authentifié';
            errorCode = 'USER_NOT_AUTHENTICATED';
            break;
        case 'DISCORD_NOT_CONNECTED':
            statusCode = 403;
            message = 'Vous devez vous connecter à Discord via OAuth pour accéder à cette ressource';
            errorCode = 'DISCORD_NOT_CONNECTED';
            break;
        case 'DISCORD_TOKEN_EXPIRED':
            statusCode = 403;
            message = 'Votre authentification Discord a expiré. Veuillez vous reconnecter';
            errorCode = 'DISCORD_TOKEN_EXPIRED';
            break;
        case 'DISCORD_AUTH_CHECK_FAILED':
            statusCode = 500;
            message = 'Erreur lors de la vérification de l\'authentification Discord';
            errorCode = 'DISCORD_AUTH_CHECK_FAILED';
            break;
        case 'DISCORD_TOKEN_INVALID':
            statusCode = 403;
            message = 'Votre token Discord est invalide ou expiré. Veuillez vous reconnecter';
            errorCode = 'DISCORD_TOKEN_INVALID';
            break;
        case 'DISCORD_RATE_LIMITED':
            statusCode = 429;
            message = 'Trop de requêtes vers l\'API Discord. Veuillez réessayer plus tard';
            errorCode = 'DISCORD_RATE_LIMITED';
            break;
        case 'DISCORD_API_ERROR':
            statusCode = 500;
            message = 'Erreur lors de la communication avec l\'API Discord';
            errorCode = 'DISCORD_API_ERROR';
            break;
        case 'ACCESS_DENIED':
            statusCode = 403;
            message = 'Accès refusé. Vous n\'avez pas les permissions nécessaires';
            errorCode = 'ACCESS_DENIED';
            break;
        case 'GUILD_NOT_FOUND':
            statusCode = 404;
            message = 'Serveur Discord introuvable';
            errorCode = 'GUILD_NOT_FOUND';
            break;
        case 'MEMBER_NOT_FOUND':
            statusCode = 404;
            message = 'Membre Discord introuvable';
            errorCode = 'MEMBER_NOT_FOUND';
            break;
        case 'DISCORD_BOT_NOT_CONNECTED':
            statusCode = 503;
            message = 'Le bot Discord n\'est pas connecté. Veuillez réessayer dans quelques instants';
            errorCode = 'DISCORD_BOT_NOT_CONNECTED';
            break;
    }
    console.error('Error details:'.cyan,
        { url: req.url, method: req.method, ip: req.ip, userAgent: req.get('User-Agent'), statusCode, errorCode, timestamp: new Date().toISOString() });
    const errorResponse: any = { success: false, error: errorCode, message, timestamp: new Date().toISOString() };
    if (error.validationErrors)
        errorResponse.details = error.validationErrors;
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
        errorResponse.originalMessage = error.message;
    }
    res.status(statusCode).json(errorResponse);
};

export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
    const acceptHeader = req.headers.accept || '';
    const userAgent = req.headers['user-agent'] || '';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const isApiRoute = req.originalUrl.startsWith('/api/');
    const isFromBrowser =
        acceptHeader.includes('text/html') &&
        !acceptHeader.includes('application/json') &&
        !userAgent.includes('Postman') &&
        !userAgent.includes('curl') &&
        !userAgent.includes('axios') &&
        !userAgent.includes('fetch');

    if (req.method === 'GET' && isFromBrowser && !isApiRoute) {
        console.log('404 - Redirecting browser to frontend:'.yellow, req.originalUrl.cyan);
        res.redirect(`${frontendUrl}/404`);
        return;
    }
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`) as CustomError;
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    next(error);
};
