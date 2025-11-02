# Documentation Swagger avec JSDoc

Ce projet utilise **swagger-autogen** pour générer automatiquement la documentation API à partir des commentaires JSDoc dans le code.

## Installation

Les dépendances nécessaires sont déjà installées :
- `swagger-autogen` (dev dependency)
- `swagger-ui-express` (dependency)
- `@types/swagger-ui-express` (dev dependency)

## Génération de la documentation

Pour générer/régénérer la documentation Swagger :

```bash
npm run swagger
```

Cette commande :
1. Lit tous les commentaires JSDoc de vos routes
2. Génère le fichier `src/swagger-output.json`
3. Ce fichier est ensuite utilisé par Swagger UI

## Accès à la documentation

Une fois votre serveur démarré :

```bash
npm run dev
```

Accédez à la documentation interactive à l'adresse :
```
http://localhost:8080/api-docs
```

## Comment documenter vos routes avec JSDoc

### Exemple basique

```typescript
/**
 * POST /api/auth/login
 * @tags Authentication
 * @summary Login a user
 * @description Authenticate a user with email and password
 * @param {object} request.body.required - Login credentials
 * @param {string} request.body.email.required - User email - application/json
 * @param {string} request.body.password.required - User password - application/json
 * @returns {object} 200 - Successfully logged in
 * @returns {object} 401 - Invalid credentials
 * @example request - Example login request
 * {
 *   "email": "user@example.com",
 *   "password": "MySecureP@ssw0rd"
 * }
 * @example response - 200 - Success response
 * {
 *   "success": true,
 *   "data": {
 *     "user": { "id": 1, "email": "user@example.com" },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 */
router.post('/login', validateLogin(), authController.login);
```

### Tags JSDoc disponibles

- `@tags` - Groupe les endpoints (ex: Authentication, Users, Areas)
- `@summary` - Résumé court de l'endpoint
- `@description` - Description détaillée
- `@param` - Paramètres (body, query, path)
- `@returns` - Réponses possibles avec code HTTP
- `@security` - Sécurité requise (ex: bearerAuth)
- `@example` - Exemples de requête/réponse

### Routes avec authentification

Pour les routes protégées, ajoutez :

```typescript
/**
 * GET /api/users/me
 * @tags Users
 * @summary Get current user profile
 * @security bearerAuth
 * @returns {object} 200 - User profile
 * @returns {object} 401 - Unauthorized
 */
router.get('/me', requireAuth, userController.getMe);
```

### Paramètres de requête

```typescript
/**
 * GET /api/areas/:id
 * @tags Areas
 * @summary Get area by ID
 * @param {string} id.path.required - Area ID
 * @returns {object} 200 - Area details
 * @returns {object} 404 - Area not found
 */
```

### Body de requête

```typescript
/**
 * @param {object} request.body.required - User data
 * @param {string} request.body.email.required - Email - application/json
 * @param {string} request.body.username - Username (optional) - application/json
 */
```

## Configuration Swagger

La configuration se trouve dans [src/swagger.ts](src/swagger.ts) :
- Informations de l'API (titre, description, version)
- Tags disponibles
- Schémas de sécurité (JWT Bearer)
- Définitions de modèles réutilisables

## Workflow de développement

1. **Développer une nouvelle route** dans `src/core/routes/` ou `src/modules/`
2. **Ajouter les commentaires JSDoc** au-dessus de la route
3. **Regénérer la documentation** avec `npm run swagger`
4. **Vérifier dans Swagger UI** que tout est correct

## Exemples de routes documentées

Consultez ces fichiers pour des exemples complets :
- [src/core/routes/auth.ts](src/core/routes/auth.ts) - Routes d'authentification
- [src/core/routes/users.ts](src/core/routes/users.ts) - Routes utilisateur

## Troubleshooting

### La documentation n'apparaît pas
- Vérifiez que `src/swagger-output.json` existe
- Exécutez `npm run swagger` pour la générer
- Redémarrez le serveur

### Mes changements n'apparaissent pas
- Regénérez la documentation avec `npm run swagger`
- Rechargez la page `/api-docs`

### Erreur de syntaxe JSDoc
- Vérifiez que tous les `*` sont bien alignés
- Les exemples JSON doivent être valides
- Les paramètres doivent suivre le format `{type} name.location.required`
