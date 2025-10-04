import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

/**
 * Middleware pour valider les paramètres d'URL
 * Vérifie que les IDs sont des UUIDs valides ou des entiers positifs
 */

/**
 * Validation pour les paramètres UUID
 */
export function validateUuidParam(paramName: string = 'id') {
    return (req: Request, res: Response, next: NextFunction): void => {
        const paramValue = req.params[paramName];

        if (!paramValue) {
            const error = new Error(`Parameter '${paramName}' is required`) as CustomError;
            error.statusCode = 400;
            error.code = 'MISSING_PARAMETER';
            return next(error);
        }

        // Regex pour UUID v4
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(paramValue)) {
            const error = new Error(`Parameter '${paramName}' must be a valid UUID`) as CustomError;
            error.statusCode = 400;
            error.code = 'INVALID_UUID_FORMAT';
            return next(error);
        }

        next();
    };
}

/**
 * Validation pour les paramètres entiers positifs
 */
export function validateIntegerParam(paramName: string = 'id') {
    return (req: Request, res: Response, next: NextFunction): void => {
        const paramValue = req.params[paramName];

        if (!paramValue) {
            const error = new Error(`Parameter '${paramName}' is required`) as CustomError;
            error.statusCode = 400;
            error.code = 'MISSING_PARAMETER';
            return next(error);
        }

        // Vérifier que c'est un nombre entier positif
        const parsedValue = parseInt(paramValue, 10);

        if (isNaN(parsedValue) || parsedValue <= 0 || !Number.isInteger(parsedValue)) {
            const error = new Error(`Parameter '${paramName}' must be a positive integer`) as CustomError;
            error.statusCode = 400;
            error.code = 'INVALID_INTEGER_FORMAT';
            return next(error);
        }

        // Ajouter la valeur parsée à la requête pour éviter de re-parser
        req.params[`${paramName}Parsed`] = parsedValue.toString();

        next();
    };
}

/**
 * Validation flexible qui accepte UUID ou entier positif
 */
export function validateIdParam(paramName: string = 'id') {
    return (req: Request, res: Response, next: NextFunction): void => {
        const paramValue = req.params[paramName];

        if (!paramValue) {
            const error = new Error(`Parameter '${paramName}' is required`) as CustomError;
            error.statusCode = 400;
            error.code = 'MISSING_PARAMETER';
            return next(error);
        }

        // Regex pour UUID v4
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        
        // Vérifier UUID
        if (uuidRegex.test(paramValue)) {
            req.params[`${paramName}Type`] = 'uuid';
            return next();
        }

        // Vérifier entier positif
        const parsedValue = parseInt(paramValue, 10);
        if (!isNaN(parsedValue) && parsedValue > 0 && Number.isInteger(parsedValue)) {
            req.params[`${paramName}Type`] = 'integer';
            req.params[`${paramName}Parsed`] = parsedValue.toString();
            return next();
        }

        // Si ni UUID ni entier valide
        const error = new Error(`Parameter '${paramName}' must be either a valid UUID or a positive integer`) as CustomError;
        error.statusCode = 400;
        error.code = 'INVALID_ID_FORMAT';
        next(error);
    };
}

/**
 * Validation pour paramètres personnalisés avec regex
 */
export function validateCustomParam(paramName: string, pattern: RegExp, errorMessage: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const paramValue = req.params[paramName];

        if (!paramValue) {
            const error = new Error(`Parameter '${paramName}' is required`) as CustomError;
            error.statusCode = 400;
            error.code = 'MISSING_PARAMETER';
            return next(error);
        }

        if (!pattern.test(paramValue)) {
            const error = new Error(errorMessage) as CustomError;
            error.statusCode = 400;
            error.code = 'INVALID_PARAMETER_FORMAT';
            return next(error);
        }

        next();
    };
}

/**
 * Validation pour paramètres de pagination
 */
export function validatePaginationParams() {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { page, limit } = req.query;

        // Validation du paramètre page
        if (page && (isNaN(Number(page)) || Number(page) < 1)) {
            const error = new Error('Page parameter must be a positive integer') as CustomError;
            error.statusCode = 400;
            error.code = 'INVALID_PAGE_PARAMETER';
            return next(error);
        }

        // Validation du paramètre limit
        if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
            const error = new Error('Limit parameter must be between 1 and 100') as CustomError;
            error.statusCode = 400;
            error.code = 'INVALID_LIMIT_PARAMETER';
            return next(error);
        }

        next();
    };
}

// Export par défaut pour la validation d'ID (le plus commun)
export default validateIdParam;
