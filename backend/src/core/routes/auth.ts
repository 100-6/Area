import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateRegister, validateLogin } from '../middleware/validation';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/auth/register
 * @tags Authentication
 * @summary Register a new user
 * @description Create a new user account with email and password
 * @param {object} request.body.required - User registration info
 * @param {string} request.body.email.required - User email - application/json
 * @param {string} request.body.password.required - User password (min 8 characters) - application/json
 * @param {string} request.body.username.required - Username - application/json
 * @returns {object} 201 - User successfully registered
 * @returns {object} 400 - Invalid input or user already exists
 * @example request - Example registration request
 * {
 *   "email": "user@example.com",
 *   "password": "MySecureP@ssw0rd",
 *   "username": "johndoe"
 * }
 * @example response - 201 - Success response
 * {
 *   "success": true,
 *   "data": {
 *     "user": {
 *       "id": 1,
 *       "email": "user@example.com",
 *       "username": "johndoe"
 *     },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 */
router.post('/register', validateRegister(), authController.register);

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
 *     "user": {
 *       "id": 1,
 *       "email": "user@example.com",
 *       "username": "johndoe"
 *     },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 */
router.post('/login', validateLogin(), authController.login);

/**
 * POST /api/auth/logout
 * @tags Authentication
 * @summary Logout a user
 * @description Invalidate the current user session
 * @returns {object} 200 - Successfully logged out
 * @example response - 200 - Success response
 * {
 *   "success": true,
 *   "message": "Successfully logged out"
 * }
 */
router.post('/logout', authController.logout);

/**
 * POST /api/auth/refresh
 * @tags Authentication
 * @summary Refresh authentication token
 * @description Get a new JWT token using a refresh token
 * @returns {object} 200 - Token successfully refreshed
 * @returns {object} 401 - Invalid or expired refresh token
 * @example response - 200 - Success response
 * {
 *   "success": true,
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 */
router.post('/refresh', authController.refresh);

/**
 * GET /api/auth/verify
 * @tags Authentication
 * @summary Verify JWT token
 * @description Check if the current JWT token is valid
 * @security bearerAuth
 * @returns {object} 200 - Token is valid
 * @returns {object} 401 - Invalid or expired token
 * @example response - 200 - Success response
 * {
 *   "success": true,
 *   "data": {
 *     "valid": true
 *   }
 * }
 */
router.get('/verify', authController.verifyToken);

/**
 * GET /api/auth/google
 * @tags Authentication - OAuth
 * @summary Initiate Google OAuth login
 * @description Redirects to Google OAuth consent screen
 * @returns {void} 302 - Redirect to Google OAuth
 */
router.get('/google', authController.googleLogin);

/**
 * GET /api/auth/google/callback
 * @tags Authentication - OAuth
 * @summary Google OAuth callback
 * @description Handles the callback from Google OAuth
 * @param {string} request.query.code - Authorization code from Google
 * @returns {object} 200 - Successfully authenticated with Google
 */
router.get('/google/callback', authController.googleCallback);

/**
 * GET /api/auth/discord
 * @tags Authentication - OAuth
 * @summary Initiate Discord OAuth login
 * @description Redirects to Discord OAuth consent screen
 * @returns {void} 302 - Redirect to Discord OAuth
 */
router.get('/discord', authController.discordLogin);

/**
 * GET /api/auth/discord/callback
 * @tags Authentication - OAuth
 * @summary Discord OAuth callback
 * @description Handles the callback from Discord OAuth
 * @param {string} request.query.code - Authorization code from Discord
 * @returns {object} 200 - Successfully authenticated with Discord
 */
router.get('/discord/callback', authController.discordCallback);

/**
 * GET /api/auth/github
 * @tags Authentication - OAuth
 * @summary Initiate GitHub OAuth login
 * @description Redirects to GitHub OAuth consent screen
 * @returns {void} 302 - Redirect to GitHub OAuth
 */
router.get('/github', authController.gitHubLogin);

/**
 * GET /api/auth/github/callback
 * @tags Authentication - OAuth
 * @summary GitHub OAuth callback
 * @description Handles the callback from GitHub OAuth
 * @param {string} request.query.code - Authorization code from GitHub
 * @returns {object} 200 - Successfully authenticated with GitHub
 */
router.get('/github/callback', authController.gitHubCallback);

/**
 * GET /api/auth/gitlab
 * @tags Authentication - OAuth
 * @summary Initiate GitLab OAuth login
 * @description Redirects to GitLab OAuth consent screen
 * @returns {void} 302 - Redirect to GitLab OAuth
 */
router.get('/gitlab', authController.gitLabLogin);

/**
 * GET /api/auth/gitlab/callback
 * @tags Authentication - OAuth
 * @summary GitLab OAuth callback
 * @description Handles the callback from GitLab OAuth
 * @param {string} request.query.code - Authorization code from GitLab
 * @returns {object} 200 - Successfully authenticated with GitLab
 */
router.get('/gitlab/callback', authController.gitLabCallback);

/**
 * GET /api/auth/dropbox
 * @tags Authentication - OAuth
 * @summary Initiate Dropbox OAuth login
 * @description Redirects to Dropbox OAuth consent screen
 * @returns {void} 302 - Redirect to Dropbox OAuth
 */
router.get('/dropbox', authController.dropboxLogin);

/**
 * GET /api/auth/dropbox/callback
 * @tags Authentication - OAuth
 * @summary Dropbox OAuth callback
 * @description Handles the callback from Dropbox OAuth
 * @param {string} request.query.code - Authorization code from Dropbox
 * @returns {object} 200 - Successfully authenticated with Dropbox
 */
router.get('/dropbox/callback', authController.dropboxCallback);

export default router;
