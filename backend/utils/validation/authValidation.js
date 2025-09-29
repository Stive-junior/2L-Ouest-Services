/**
 * @file authValidation.js
 * @description Schémas Joi pour valider les opérations d'authentification dans L&L Ouest Services.
 * Centralise les validations pour les requêtes d'inscription, connexion, gestion de tokens, envoi d'emails, et mise à jour de mot de passe/email.
 * Utilisé par authService.js et authRoutes.js pour garantir la cohérence des données.
 * @module utils/validation/authValidation
 * @version 1.4.0
 * @author L&L Ouest Services Team
 * @lastUpdated 2025-09-26
 * @license MIT
 * @dependencies joi
 * @changelog
 * - v1.4.0: Ajout de schémas pour la mise à jour du mot de passe et la confirmation du nouvel email.
 * - v1.3.0: Version initiale fournie.
 */

const Joi = require('joi');

/**
 * Schéma de validation pour l'inscription (signup).
 * @type {Joi.ObjectSchema}
 */
const signUpSchema = Joi.object({
  email: Joi.string().email().required().max(255).lowercase().trim().description('Adresse email de l\'utilisateur'),
  name: Joi.string().min(2).max(100).required().trim().description('Nom complet ou raison sociale'),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required().description('Numéro de téléphone international'),
  address: Joi.object({
    street: Joi.string().min(3).max(255).optional().trim().description('Rue ou adresse des locaux'),
    city: Joi.string().min(2).max(100).optional().trim().description('Ville'),
    postalCode: Joi.string().pattern(/^\d{5}$/).optional().description('Code postal (format France)'),
    country: Joi.string().default('France').trim().description('Pays'),
  }).optional().allow(null).description('Adresse des locaux professionnels'),
  firebaseToken: Joi.string().required().description('Token Firebase pour l\'authentification'),
  fcmToken: Joi.string().min(100).optional().allow(null).description('Token FCM pour notifications push'),
  role: Joi.string().valid('client', 'provider', 'admin').default('client').description('Rôle de l\'utilisateur'),
}).label('SignUpSchema');

/**
 * Schéma de validation pour la connexion (signin).
 * @type {Joi.ObjectSchema}
 */
const signInSchema = Joi.object({
  email: Joi.string().email().required().max(255).lowercase().trim().description('Adresse email de l\'utilisateur'),
  firebaseToken: Joi.string().required().description('Token Firebase pour l\'authentification'),
  fcmToken: Joi.string().min(100).optional().allow(null).description('Token FCM pour notifications push'),
}).label('SignInSchema');

/**
 * Schéma de validation pour les opérations sur les tokens (refresh, signout, verify).
 * @type {Joi.ObjectSchema}
 */
const tokenSchema = Joi.object({
  firebaseToken: Joi.string().required().description('Token Firebase pour l\'authentification'),
}).label('TokenSchema');

/**
 * Schéma de validation pour les emails d'action (vérification, réinitialisation, connexion sans mot de passe).
 * @type {Joi.ObjectSchema}
 */
const emailSchema = Joi.object({
  email: Joi.string().email().required().max(255).lowercase().trim().description('Adresse email de l\'utilisateur'),
  name: Joi.string().min(2).max(100).optional().trim().description('Nom complet ou raison sociale'),
  htmlTemplate: Joi.string().optional().description('Template HTML pour l\'email'),
  logoBase64: Joi.string().optional().description('Logo en base64 pour l\'email'),
  retry: Joi.boolean().optional().default(false).description('Indique si c\'est un renvoi de code'),
}).label('EmailSchema');


/**
 * Schéma de validation pour les codes de vérification.
 * @type {Joi.ObjectSchema}
 */
const codeSchema = Joi.object({
  email: Joi.string().email().required().max(255).lowercase().trim().description('Adresse email de l\'utilisateur'),
  code: Joi.string().length(6).pattern(/^\d{6}$/).required().description('Code de vérification à 6 chiffres'),
}).label('CodeSchema');

/**
 * Schéma de validation pour la mise à jour du mot de passe.
 * @type {Joi.ObjectSchema}
 */
const passwordSchema = Joi.object({
  email: Joi.string().email().required().max(255).lowercase().trim().description('Adresse email de l\'utilisateur'),
  newPassword: Joi.string().min(8).max(100).required().description('Nouveau mot de passe'),
}).label('PasswordSchema');

/**
 * Schéma de validation pour la confirmation du nouvel email.
 * @type {Joi.ObjectSchema}
 */
const newEmailSchema = Joi.object({
  newEmail: Joi.string().email().required().max(255).lowercase().trim().description('Nouvelle adresse email'),
  name: Joi.string().min(2).max(100).optional().trim().description('Nom complet ou raison sociale'),
  htmlTemplate: Joi.string().optional().description('Template HTML pour l\'email'),
  logoBase64: Joi.string().optional().description('Logo en base64 pour l\'email'),
  retry: Joi.boolean().optional().default(false).description('Indique si c\'est un renvoi de code'),
}).label('NewEmailSchema');

module.exports = {
  signUpSchema,
  signInSchema,
  tokenSchema,
  emailSchema,
  codeSchema,
  passwordSchema,
  newEmailSchema,
};
