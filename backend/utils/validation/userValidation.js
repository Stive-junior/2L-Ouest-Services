/**
 * @file userValidation.js
 * @description Schémas Joi pour valider les opérations sur les utilisateurs dans L&L Ouest Services.
 * @module utils/validation/userValidation
 */

const Joi = require('joi');

/**
 * Schéma pour créer un utilisateur.
 * @type {Joi.ObjectSchema}
 */
const createUserSchema = Joi.object({
  email: Joi.string().email().required().max(255).description('Adresse email de l\'utilisateur'),
  password: Joi.string().min(8).max(50).required().description('Mot de passe de l\'utilisateur'),
  name: Joi.string().min(2).max(100).required().description('Nom complet ou raison sociale'),
  role: Joi.string().valid('client', 'admin').default('client').description('Rôle de l\'utilisateur'),
  phone: Joi.string().pattern(/^\+\d{1,3}[\s\d\-\(\)]{4,20}$/).required().description('Numéro de téléphone international'),
  address: Joi.object({
    street: Joi.string().min(3).max(255).optional().description('Rue ou adresse des locaux'),
    city: Joi.string().min(2).max(100).optional().description('Ville'),
    postalCode: Joi.string().pattern(/^\d{5}$/).optional().description('Code postal (format France)'),
    country: Joi.string().default('France').description('Pays'),
  }).optional().allow(null).description('Adresse des locaux professionnels'),
  company: Joi.string().min(2).max(100).optional().allow(null).description('Nom de l\'entreprise (optionnel)'),
}).label('CreateUserSchema');

/**
 * Schéma pour mettre à jour un utilisateur.
 * @type {Joi.ObjectSchema}
 */
const updateUserSchema = Joi.object({
  id: Joi.string().required().description('Identifiant unique de l\'utilisateur'),
  email: Joi.string().email().required().max(255).description('Adresse email de l\'utilisateur'),
  name: Joi.string().min(2).max(100).required().description('Nom complet ou raison sociale'),
  role: Joi.string().valid('client', 'admin').default('client').description('Rôle de l\'utilisateur'),
  phone: Joi.string().pattern(/^\+\d{1,3}[\s\d\-\(\)]{4,20}$/).required().description('Numéro de téléphone international'),
  address: Joi.object({
    street: Joi.string().min(3).max(255).optional().description('Rue ou adresse des locaux'),
    city: Joi.string().min(2).max(100).optional().description('Ville'),
    postalCode: Joi.string().pattern(/^\d{5}$/).optional().description('Code postal (format France)'),
    country: Joi.string().default('France').description('Pays'),
  }).optional().allow(null).description('Adresse des locaux professionnels'),
  company: Joi.string().min(2).max(100).optional().allow(null).description('Nom de l\'entreprise (optionnel)'),
  invoices: Joi.array().items(
    Joi.object({
      id: Joi.string().required().description('Identifiant de la facture'),
      url: Joi.string().uri().optional().description('URL du document de facture'),
      date: Joi.string().isoDate().required().description('Date de la facture'),
      amount: Joi.number().positive().required().description('Montant de la facture'),
    })
  ).optional().default([]).description('Liste des factures/documents'),
  preferences: Joi.object({
    notifications: Joi.boolean().default(true).description('Préférence pour les notifications'),
    language: Joi.string().valid('fr', 'en').default('fr').description('Langue préférée'),
    fcmToken: Joi.string().optional().allow(null).description('Token FCM pour notifications'),
  }).optional().default({ notifications: true, language: 'fr', fcmToken: null }).description('Préférences utilisateur'),
  location: Joi.object({
    lat: Joi.number().optional().description('Latitude'),
    lng: Joi.number().optional().description('Longitude'),
    formattedAddress: Joi.string().max(255).optional().description('Adresse formatée'),
    placeId: Joi.string().max(255).optional().description('ID du lieu Google Maps'),
    types: Joi.array().items(Joi.string()).optional().description('Types de lieu'),
  }).optional().allow(null).description('Localisation de l\'utilisateur'),
  createdAt: Joi.string().isoDate().default(() => new Date().toISOString()).description('Date de création'),
  lastLogin: Joi.string().isoDate().optional().allow(null).description('Date de dernière connexion'),
  emailVerified: Joi.boolean().default(false).description('Statut de vérification de l\'email'),
}).label('UpdateUserSchema');

/**
 * Schéma pour l'ID d'utilisateur.
 * @type {Joi.ObjectSchema}
 */
const idSchema = Joi.object({
  id: Joi.string().required().description('Identifiant unique de l\'utilisateur'),
}).label('IdSchema');

/**
 * Schéma pour l'email d'utilisateur.
 * @type {Joi.ObjectSchema}
 */
const emailSchema = Joi.object({
  email: Joi.string().email().required().description('Adresse email de l\'utilisateur'),
}).label('EmailSchema');

/**
 * Schéma pour la pagination.
 * @type {Joi.ObjectSchema}
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).description('Numéro de page'),
  limit: Joi.number().integer().min(1).max(100).default(10).description('Limite par page'),
}).label('PaginationSchema');

/**
 * Schéma pour les utilisateurs par rôle.
 * @type {Joi.ObjectSchema}
 */
const roleSchema = Joi.object({
  role: Joi.string().valid('client', 'admin').required().description('Rôle de l\'utilisateur'),
  page: Joi.number().integer().min(1).default(1).description('Numéro de page'),
  limit: Joi.number().integer().min(1).max(100).default(10).description('Limite par page'),
}).label('RoleSchema');

/**
 * Schéma pour les préférences utilisateur.
 * @type {Joi.ObjectSchema}
 */
const preferencesSchema = Joi.object({
  preferences: Joi.object({
    notifications: Joi.boolean().default(true).description('Préférence pour les notifications'),
    language: Joi.string().valid('fr', 'en').default('fr').description('Langue préférée'),
    fcmToken: Joi.string().optional().allow(null).description('Token FCM pour notifications'),
  }).required().description('Préférences utilisateur'),
}).label('PreferencesSchema');

/**
 * Schéma pour ajouter une facture.
 * @type {Joi.ObjectSchema}
 */
const invoiceSchema = Joi.object({
  invoice: Joi.object({
    id: Joi.string().required().description('Identifiant unique de la facture'),
    userId: Joi.string().required().description('ID de l\'utilisateur'),
    amount: Joi.number().positive().required().description('Montant total de la facture'),
    items: Joi.array().items(
      Joi.object({
        description: Joi.string().min(1).max(500).required().description('Description de l\'élément'),
        quantity: Joi.number().integer().min(1).required().description('Quantité'),
        unitPrice: Joi.number().positive().required().description('Prix unitaire'),
      })
    ).required().description('Liste des éléments de la facture'),
    date: Joi.string().isoDate().default(() => new Date().toISOString()).description('Date de création'),
    dueDate: Joi.string().isoDate().required().description('Date d\'échéance'),
    url: Joi.string().uri().optional().description('URL du fichier PDF'),
  }).required().description('Détails de la facture'),
}).label('InvoiceSchema');

module.exports = {
  createUserSchema,
  updateUserSchema,
  idSchema,
  emailSchema,
  paginationSchema,
  roleSchema,
  preferencesSchema,
  invoiceSchema,
};
