/**
 * @file contactValidation.js
 * @description Schémas Joi pour valider les opérations sur les messages de contact dans L&L Ouest Services.
 * @module utils/validation/contactValidation
 */

const Joi = require('joi');

/**
 * Schéma pour les messages de contact.
 * @type {Joi.ObjectSchema}
 */
const contactSchema = Joi.object({
  id: Joi.string().required().description('Identifiant unique du message'),
  userId: Joi.string().optional().allow(null).description('ID de l\'utilisateur (optionnel)'),
  name: Joi.string().min(2).max(100).required().description('Nom de la personne'),
  email: Joi.string().email().required().max(255).description('Email de contact'),
  message: Joi.string().min(10).max(1000).required().description('Message envoyé'),
  subject: Joi.string().min(3).max(100).optional().description('Objet du message'),
  createdAt: Joi.string().isoDate().default(() => new Date().toISOString()).description('Date de création'),
}).label('ContactSchema');

/**
 * Schéma pour l'ID de contact.
 * @type {Joi.ObjectSchema}
 */
const idSchema = Joi.object({
  id: Joi.string().required().description('Identifiant unique du message de contact'),
}).label('IdSchema');

/**
 * Schéma pour la pagination.
 * @type {Joi.ObjectSchema}
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).description('Numéro de page'),
  limit: Joi.number().integer().min(1).max(100).default(10).description('Limite par page'),
}).label('PaginationSchema');

module.exports = {
  contactSchema,
  idSchema,
  paginationSchema,
};
