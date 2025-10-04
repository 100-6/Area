import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
}

interface ValidationRule {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
}

interface ValidationSchema {
    [key: string]: ValidationRule;
}

/**
 * Validation d'email (RFC 5322 simplifié)
 */
const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validation de mot de passe fort
 * - Au moins 8 caractères
 * - Au moins 1 minuscule
 * - Au moins 1 majuscule  
 * - Au moins 1 chiffre
 * - Au moins 1 caractère spécial
 */
const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Validation de nom d'utilisateur
 * - 3 à 30 caractères
 * - Lettres, chiffres, tirets, underscores
 */
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,30}$/;

/**
 * Validation de nom/prénom
 * - 2 à 50 caractères
 * - Lettres, espaces, tirets, apostrophes
 */
const NAME_PATTERN = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;

/**
 * Détection de contenu malveillant
 */
function containsMaliciousContent(value: string): boolean {
    const maliciousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Scripts
        /javascript:/gi, // JavaScript URLs
        /on\w+\s*=/gi, // Event handlers
        /('|(\\')|(;)|(--)|(\|)|(%7C))/gi, // SQL injection
        /data:(?!image\/)/gi, // Data URLs (sauf images)
        /vbscript:/gi, // VBScript
        /<iframe|<object|<embed/gi // Éléments dangereux
    ];
    
    return maliciousPatterns.some(pattern => pattern.test(value));
}

/**
 * Valide une valeur selon une règle
 */
function validateField(value: any, rule: ValidationRule, fieldName: string): string[] {
    const errors: string[] = [];
    
    // Vérifier si requis
    if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${fieldName} is required`);
        return errors;
    }
    
    // Si pas requis et vide, passer
    if (!rule.required && (value === undefined || value === null || value === '')) {
        return errors;
    }
    
    // Vérifier le type
    if (rule.type && typeof value !== rule.type) {
        errors.push(`${fieldName} must be a ${rule.type}`);
        return errors;
    }
    
    // Validations pour les chaînes
    if (typeof value === 'string') {
        // Longueur minimale
        if (rule.minLength && value.length < rule.minLength) {
            errors.push(`${fieldName} must be at least ${rule.minLength} characters long`);
        }
        
        // Longueur maximale
        if (rule.maxLength && value.length > rule.maxLength) {
            errors.push(`${fieldName} must be at most ${rule.maxLength} characters long`);
        }
        
        // Pattern regex
        if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(`${fieldName} format is invalid`);
        }
        
        // Contenu malveillant
        if (containsMaliciousContent(value)) {
            errors.push(`${fieldName} contains potentially dangerous content`);
        }
    }
    
    // Validation personnalisée
    if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
            errors.push(typeof customResult === 'string' ? customResult : `${fieldName} failed custom validation`);
        }
    }
    
    return errors;
}

/**
 * Valide un objet selon un schema
 */
function validateObject(data: any, schema: ValidationSchema): string[] {
    const errors: string[] = [];
    
    if (!data || typeof data !== 'object') {
        errors.push('Request body must be a valid JSON object');
        return errors;
    }
    
    // Valider chaque champ du schema
    for (const [key, rule] of Object.entries(schema)) {
        const value = data[key];
        errors.push(...validateField(value, rule, key));
    }
    
    return errors;
}

// ========================================
// SCHEMAS DE VALIDATION AUTHENTIFICATION
// ========================================

/**
 * Schema pour l'inscription (register)
 */
export const REGISTER_SCHEMA: ValidationSchema = {
    email: {
        required: true,
        type: 'string',
        maxLength: 254,
        pattern: EMAIL_PATTERN,
        custom: (email: string) => {
            // Vérifier domaines suspicieux
            const suspiciousDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
            const domain = email.split('@')[1]?.toLowerCase();
            if (suspiciousDomains.includes(domain)) {
                return 'Temporary email addresses are not allowed';
            }
            return true;
        }
    },
    password: {
        required: true,
        type: 'string',
        minLength: 8,
        maxLength: 128,
        pattern: STRONG_PASSWORD_PATTERN,
        custom: (password: string) => {
            // Vérifier mots de passe communs
            const commonPasswords = ['password', '123456789', 'qwerty123', 'admin123'];
            if (commonPasswords.includes(password.toLowerCase())) {
                return 'Password is too common';
            }
            return true;
        }
    },
    firstName: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 50,
        pattern: NAME_PATTERN
    },
    lastName: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 50,
        pattern: NAME_PATTERN
    },
    username: {
        required: false,
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: USERNAME_PATTERN
    }
};

/**
 * Schema pour la connexion (login)
 */
export const LOGIN_SCHEMA: ValidationSchema = {
    email: {
        required: true,
        type: 'string',
        pattern: EMAIL_PATTERN,
        maxLength: 254
    },
    password: {
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 128
    },
    rememberMe: {
        required: false,
        type: 'boolean'
    }
};

/**
 * Schema pour la récupération de mot de passe
 */
export const FORGOT_PASSWORD_SCHEMA: ValidationSchema = {
    email: {
        required: true,
        type: 'string',
        pattern: EMAIL_PATTERN,
        maxLength: 254
    }
};

/**
 * Schema pour la réinitialisation de mot de passe
 */
export const RESET_PASSWORD_SCHEMA: ValidationSchema = {
    token: {
        required: true,
        type: 'string',
        minLength: 32,
        maxLength: 512
    },
    newPassword: {
        required: true,
        type: 'string',
        minLength: 8,
        maxLength: 128,
        pattern: STRONG_PASSWORD_PATTERN
    },
    confirmNewPassword: {
        required: true,
        type: 'string'
    }
};

/**
 * Schema pour le changement de mot de passe
 */
export const CHANGE_PASSWORD_SCHEMA: ValidationSchema = {
    currentPassword: {
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 128
    },
    newPassword: {
        required: true,
        type: 'string',
        minLength: 8,
        maxLength: 128,
        pattern: STRONG_PASSWORD_PATTERN
    },
    confirmNewPassword: {
        required: true,
        type: 'string'
    }
};

/**
 * Schema pour la mise à jour du profil
 */
export const UPDATE_PROFILE_SCHEMA: ValidationSchema = {
    firstName: {
        required: false,
        type: 'string',
        minLength: 2,
        maxLength: 50,
        pattern: NAME_PATTERN
    },
    lastName: {
        required: false,
        type: 'string',
        minLength: 2,
        maxLength: 50,
        pattern: NAME_PATTERN
    },
    username: {
        required: false,
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: USERNAME_PATTERN
    }
};

// ========================================
// MIDDLEWARES DE VALIDATION
// ========================================

/**
 * Middleware de validation pour l'inscription
 */
export function validateRegister() {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors = validateObject(req.body, REGISTER_SCHEMA);
        
        if (errors.length > 0) {
            const error = new Error('Registration validation failed') as CustomError;
            error.statusCode = 400;
            error.code = 'REGISTRATION_VALIDATION_FAILED';
            error.details = { errors };
            return next(error);
        }
        
        next();
    };
}

/**
 * Middleware de validation pour la connexion
 */
export function validateLogin() {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors = validateObject(req.body, LOGIN_SCHEMA);
        
        if (errors.length > 0) {
            const error = new Error('Login validation failed') as CustomError;
            error.statusCode = 400;
            error.code = 'LOGIN_VALIDATION_FAILED';
            error.details = { errors };
            return next(error);
        }
        
        next();
    };
}

/**
 * Middleware de validation pour mot de passe oublié
 */
export function validateForgotPassword() {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors = validateObject(req.body, FORGOT_PASSWORD_SCHEMA);
        
        if (errors.length > 0) {
            const error = new Error('Forgot password validation failed') as CustomError;
            error.statusCode = 400;
            error.code = 'FORGOT_PASSWORD_VALIDATION_FAILED';
            error.details = { errors };
            return next(error);
        }
        
        next();
    };
}

/**
 * Middleware de validation pour réinitialisation de mot de passe
 */
export function validateResetPassword() {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors = validateObject(req.body, RESET_PASSWORD_SCHEMA);
        
        // Validation spéciale: newPassword === confirmNewPassword
        if (req.body.newPassword && req.body.confirmNewPassword) {
            if (req.body.newPassword !== req.body.confirmNewPassword) {
                errors.push('New passwords do not match');
            }
        }
        
        if (errors.length > 0) {
            const error = new Error('Reset password validation failed') as CustomError;
            error.statusCode = 400;
            error.code = 'RESET_PASSWORD_VALIDATION_FAILED';
            error.details = { errors };
            return next(error);
        }
        
        next();
    };
}

/**
 * Middleware de validation pour changement de mot de passe
 */
export function validateChangePassword() {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors = validateObject(req.body, CHANGE_PASSWORD_SCHEMA);
        
        // Validation spéciale: newPassword === confirmNewPassword
        if (req.body.newPassword && req.body.confirmNewPassword) {
            if (req.body.newPassword !== req.body.confirmNewPassword) {
                errors.push('New passwords do not match');
            }
        }
        
        // Vérifier que nouveau mot de passe != ancien
        if (req.body.currentPassword && req.body.newPassword) {
            if (req.body.currentPassword === req.body.newPassword) {
                errors.push('New password must be different from current password');
            }
        }
        
        if (errors.length > 0) {
            const error = new Error('Change password validation failed') as CustomError;
            error.statusCode = 400;
            error.code = 'CHANGE_PASSWORD_VALIDATION_FAILED';
            error.details = { errors };
            return next(error);
        }
        
        next();
    };
}

/**
 * Middleware de validation pour mise à jour du profil
 */
export function validateUpdateProfile() {
    return (req: Request, res: Response, next: NextFunction): void => {
        // Vérifier qu'au moins un champ est fourni
        if (!req.body || Object.keys(req.body).length === 0) {
            const error = new Error('At least one field must be provided') as CustomError;
            error.statusCode = 400;
            error.code = 'EMPTY_UPDATE_BODY';
            return next(error);
        }
        
        const errors = validateObject(req.body, UPDATE_PROFILE_SCHEMA);
        
        if (errors.length > 0) {
            const error = new Error('Profile update validation failed') as CustomError;
            error.statusCode = 400;
            error.code = 'PROFILE_UPDATE_VALIDATION_FAILED';
            error.details = { errors };
            return next(error);
        }
        
        next();
    };
}