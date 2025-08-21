/**
 * @file notificationValidation.js
 * @description Schémas de validation Joi pour les notifications dans L&L Ouest Services.
 * Définit les schémas pour valider les données utilisées dans notificationService.js.
 * @module utils/validation/notificationValidation
 */

const Joi = require('joi');

/**
 * Schéma pour valider les données de notification push.
 */
const pushNotificationSchema = Joi.object({
  title: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.base': 'Le titre doit être une chaîne de caractères.',
      'string.min': 'Le titre doit contenir au moins 2 caractères.',
      'string.max': 'Le titre ne peut pas dépasser 100 caractères.',
      'any.required': 'Le titre est requis.',
    }),
  body: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.base': 'Le corps de la notification doit être une chaîne de caractères.',
      'string.min': 'Le corps de la notification doit contenir au moins 10 caractères.',
      'string.max': 'Le corps de la notification ne peut pas dépasser 500 caractères.',
      'any.required': 'Le corps de la notification est requis.',
    }),
});

/**
 * Schéma pour valider un ID de message.
 */
const messageIdSchema = Joi.string()
  .uuid()
  .required()
  .messages({
    'string.base': 'L’ID du message doit être une chaîne de caractères.',
    'string.uuid': 'L’ID du message doit être un UUID valide.',
    'any.required': 'L’ID du message est requis.',
  });

/**
 * Schéma pour valider un ID de service.
 */
const serviceIdSchema = Joi.string()
  .uuid()
  .required()
  .messages({
    'string.base': 'L’ID du service doit être une chaîne de caractères.',
    'string.uuid': 'L’ID du service doit être un UUID valide.',
    'any.required': 'L’ID du service est requis.',
  });

/**
 * Schéma pour valider un ID d’avis.
 */
const reviewIdSchema = Joi.string()
  .uuid()
  .required()
  .messages({
    'string.base': 'L’ID de l’avis doit être une chaîne de caractères.',
    'string.uuid': 'L’ID de l’avis doit être un UUID valide.',
    'any.required': 'L’ID de l’avis est requis.',
  });

/**
 * Schéma pour valider un ID d’utilisateur.
 */
const userIdSchema = Joi.string()
  .uuid()
  .required()
  .messages({
    'string.base': 'L’ID de l’utilisateur doit être une chaîne de caractères.',
    'string.uuid': 'L’ID de l’utilisateur doit être un UUID valide.',
    'any.required': 'L’ID de l’utilisateur est requis.',
  });

/**
 * Schéma pour valider un ID de contact.
 */
const contactIdSchema = Joi.string()
  .uuid()
  .required()
  .messages({
    'string.base': 'L’ID du contact doit être une chaîne de caractères.',
    'string.uuid': 'L’ID du contact doit être un UUID valide.',
    'any.required': 'L’ID du contact est requis.',
  });

module.exports = {
  pushNotificationSchema,
  messageIdSchema,
  serviceIdSchema,
  reviewIdSchema,
  userIdSchema,
  contactIdSchema,
};
