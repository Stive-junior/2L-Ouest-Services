/**
 * @file authRoutes.js
 * @description Routes pour gérer les opérations d'authentification dans L&L Ouest Services.
 * Applique les middlewares pour la validation, la limitation de taux et l'authentification.
 * Utilise les schémas Joi centralisés dans authValidation.js pour valider les requêtes.
 * Intègre des redirections vers les pages frontend pour guider l'utilisateur.
 * @module routes/authRoutes
 * @version 1.4.0
 * @lastUpdated 2025-09-26
 * @changelog
 * - v1.4.0: Ajout de routes pour la réinitialisation de mot de passe et le changement d'email avec étapes séquentielles.
 * - v1.3.1: Ajout de champs de redirection dans les réponses JSON pour guider le frontend.
 * - v1.3.0: Version initiale fournie.
 */

const express = require('express');
const router = express.Router();
const { authenticate, validationMiddleware, rateLimitMiddleware } = require('../middleware');
const {
  signUp,
  getUserByEmail,
  signIn,
  refreshToken,
  signOut,
  verifyToken,
  sendEmailVerification,
  sendPasswordReset,
  sendSignInWithEmailLink,
  verifyEmailCode,
  verifyPasswordResetCode,
  verifyChangeEmailCode,
  updatePassword,
  requestNewEmail,
  confirmNewEmail,
} = require('../controllers/authController');
const {
  signUpSchema,
  signInSchema,
  tokenSchema,
  emailSchema,
  codeSchema,
  passwordSchema,
  newEmailSchema,
} = require('../utils/validation/authValidation');

/**
 * Routes publiques avec limitation de taux
 */
router.post('/signup', [rateLimitMiddleware, validationMiddleware(signUpSchema)], signUp);
router.post('/email', [rateLimitMiddleware, validationMiddleware(emailSchema)], getUserByEmail);
router.post('/signin', [rateLimitMiddleware, validationMiddleware(signInSchema)], signIn);
router.post('/refresh', [rateLimitMiddleware, validationMiddleware(tokenSchema)], refreshToken);
router.post('/verify-email', [rateLimitMiddleware, validationMiddleware(emailSchema)], sendEmailVerification);
router.post('/password-reset', [rateLimitMiddleware, validationMiddleware(emailSchema)], sendPasswordReset);
router.post('/email-link-signin', [rateLimitMiddleware, validationMiddleware(emailSchema)], sendSignInWithEmailLink);
router.post('/verify-email-code', [rateLimitMiddleware, validationMiddleware(codeSchema)], verifyEmailCode);
router.post('/verify-password-reset-code', [rateLimitMiddleware, validationMiddleware(codeSchema)], verifyPasswordResetCode);
router.post('/verify-change-email-code', [rateLimitMiddleware, validationMiddleware(codeSchema)], verifyChangeEmailCode);
router.post('/update-password', validationMiddleware(passwordSchema), updatePassword);
/**
 * Routes protégées par authentification
 */
router.post('/signout', [authenticate, validationMiddleware(tokenSchema)], signOut);
router.post('/verify-token', [authenticate, validationMiddleware(tokenSchema)], verifyToken);
router.post('/request-new-email', [authenticate, validationMiddleware(emailSchema)], requestNewEmail);
router.post('/confirm-new-email', [authenticate, validationMiddleware(newEmailSchema)], confirmNewEmail);

module.exports = router;