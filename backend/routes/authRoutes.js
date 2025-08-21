
/**
 * @file authRoutes.js
 * @description Routes pour gérer les opérations d'authentification dans L&L Ouest Services.
 * Applique les middlewares pour la validation, la limitation de taux et l'authentification.
 * Utilise les schémas Joi centralisés dans authValidation.js pour valider les requêtes.
 * @module routes/authRoutes
 */

const express = require('express');
const router = express.Router();
const { authenticate, validationMiddleware, rateLimitMiddleware } = require('../middleware');
const {
  signUp,
  signIn,
  refreshToken,
  signOut,
  verifyToken,
  sendEmailVerification,
  sendPasswordReset,
  sendVerifyAndChangeEmail,
  sendSignInWithEmailLink,
} = require('../controllers/authController');
const {
  signUpSchema,
  signInSchema,
  tokenSchema,
  emailSchema,
  verifyAndChangeEmailSchema,
} = require('../utils/validation/authValidation');

/**
 * Routes publiques avec limitation de taux
 */
router.post('/signup', [rateLimitMiddleware, validationMiddleware(signUpSchema)], signUp);
router.post('/signin', [rateLimitMiddleware, validationMiddleware(signInSchema)], signIn);
router.post('/refresh', [rateLimitMiddleware, validationMiddleware(tokenSchema)], refreshToken);
router.post('/verify-email', [rateLimitMiddleware, validationMiddleware(emailSchema)], sendEmailVerification);
router.post('/password-reset', [rateLimitMiddleware, validationMiddleware(emailSchema)], sendPasswordReset);
router.post('/email-link-signin', [rateLimitMiddleware, validationMiddleware(emailSchema)], sendSignInWithEmailLink);

/**
 * Routes protégées par authentification
 */
router.post('/signout', [authenticate, validationMiddleware(tokenSchema)], signOut);
router.post('/verify-token', [authenticate, validationMiddleware(tokenSchema)], verifyToken);
router.post('/change-email', [authenticate, validationMiddleware(verifyAndChangeEmailSchema)], sendVerifyAndChangeEmail);

module.exports = router;
