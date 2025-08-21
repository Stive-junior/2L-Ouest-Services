
/**
 * @file authValidation.js
 * @description Schémas Joi pour valider les opérations d'authentification dans L&L Ouest Services.
 * Centralise les validations pour les requêtes d'inscription, connexion, gestion de tokens et envoi d'emails.
 * Utilisé par authService.js et authRoutes.js pour garantir la cohérence des données.
 * @module utils/validation/authValidation
 */

const Joi = require('joi');

/**
 * Schéma de validation pour l'inscription (signup).
 * @type {Joi.ObjectSchema}
 */
const signUpSchema = Joi.object({
  email: Joi.string().email().required().max(255).description('Adresse email de l\'utilisateur'),
  name: Joi.string().min(2).max(100).required().description('Nom complet ou raison sociale'),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required().description('Numéro de téléphone international'),
  address: Joi.object({
    street: Joi.string().min(3).max(255).optional().description('Rue ou adresse des locaux'),
    city: Joi.string().min(2).max(100).optional().description('Ville'),
    postalCode: Joi.string().pattern(/^\d{5}$/).optional().description('Code postal (format France)'),
    country: Joi.string().default('France').description('Pays'),
  }).optional().allow(null).description('Adresse des locaux professionnels'),
  firebaseToken: Joi.string().required().description('Token Firebase pour l\'authentification'),
  fcmToken: Joi.string().optional().allow(null).description('Token FCM pour notifications push'),
}).label('SignUpSchema');

/**
 * Schéma de validation pour la connexion (signin).
 * @type {Joi.ObjectSchema}
 */
const signInSchema = Joi.object({
  email: Joi.string().email().required().max(255).description('Adresse email de l\'utilisateur'),
  firebaseToken: Joi.string().required().description('Token Firebase pour l\'authentification'),
  fcmToken: Joi.string().optional().allow(null).description('Token FCM pour notifications push'),
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
  email: Joi.string().email().required().max(255).description('Adresse email de l\'utilisateur'),
  name: Joi.string().min(2).max(100).required().description('Nom complet ou raison sociale'),
  htmlTemplate: Joi.string().required().description('Template HTML pour l\'email'),
}).label('EmailSchema');

/**
 * Schéma de validation pour le changement d'email.
 * @type {Joi.ObjectSchema}
 */
const verifyAndChangeEmailSchema = Joi.object({
  currentEmail: Joi.string().email().required().max(255).description('Adresse email actuelle'),
  newEmail: Joi.string().email().required().max(255).description('Nouvelle adresse email'),
  name: Joi.string().min(2).max(100).required().description('Nom complet ou raison sociale'),
  htmlTemplate: Joi.string().required().description('Template HTML pour l\'email'),
}).label('VerifyAndChangeEmailSchema');

module.exports = {
  signUpSchema,
  signInSchema,
  tokenSchema,
  emailSchema,
  verifyAndChangeEmailSchema,
};
