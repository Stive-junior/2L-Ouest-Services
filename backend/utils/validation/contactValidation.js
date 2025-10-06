/**
 * @file contactValidation.js
 * @description Schémas Joi pour valider les opérations sur les messages de contact et les réservations dans L&L Ouest Services.
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
  phone: Joi.string().pattern(/^\+33[\s\-]?[1-9](?:[\s\-]?\d{2}){4}$/).allow(null, '').optional().description('Numéro de téléphone international'),
  message: Joi.string().min(10).max(1000).required().description('Message envoyé'),
  subjects: Joi.string().min(3).max(100).optional().description('Objet du message'),
  createdAt: Joi.string().isoDate().default(() => new Date().toISOString()).description('Date de création'),
}).label('ContactSchema');

/**
 * Schéma pour l'ID de contact ou de réservation.
 * @type {Joi.ObjectSchema}
 */
const idSchema = Joi.object({
  id: Joi.string().required().description('Identifiant unique du message de contact ou de la réservation'),
}).label('IdSchema');

/**
 * Schéma pour la pagination.
 * @type {Joi.ObjectSchema}
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).description('Numéro de page'),
  limit: Joi.number().integer().min(1).max(100).default(10).description('Limite par page'),
}).label('PaginationSchema');

/**
 * Schéma pour la réponse à un message de contact ou une réservation.
 * @type {Joi.ObjectSchema}
 */
const replySchema = Joi.object({
  reply: Joi.string().min(1).max(2000).required().description('Contenu de la réponse'),
  repliedBy: Joi.string().min(2).max(100).required().description('Nom de l\'administrateur qui répond'),
}).label('ReplySchema');

/**
 * Schéma pour les réservations.
 * @type {Joi.ObjectSchema}
 */
const reservationSchema = Joi.object({
  id: Joi.string().required().description('Identifiant unique de la réservation'),
  serviceId: Joi.string().required().description('ID du service réservé'),
  serviceName: Joi.string().min(2).max(100).required().description('Nom du service réservé'),
  serviceCategory: Joi.string().min(2).max(50).required().description('Catégorie du service réservé'),
  userId: Joi.string().optional().allow(null).description('ID de l\'utilisateur (optionnel)'),
  name: Joi.string().min(2).max(100).required().description('Nom du client'),
  email: Joi.string().email().required().max(255).description('Email du client'),
  phone: Joi.string().pattern(/^\+33[\s\-]?[1-9](?:[\s\-]?\d{2}){4}$/).allow(null, '').optional().description('Numéro de téléphone international'),
  date: Joi.string().isoDate().required().description('Date souhaitée de l\'intervention (format YYYY-MM-DD)'),
  frequency: Joi.string().valid('ponctuelle', 'hebdomadaire', 'bi-mensuelle', 'mensuelle').required().description('Fréquence de la réservation'),
  address: Joi.string().min(5).max(200).required().description('Adresse d\'intervention'),
  options: Joi.string().min(3).max(500).optional().allow('').description('Options supplémentaires, séparées par des tirets'),
  message: Joi.string().min(10).max(1000).required().description('Instructions ou message spécial'),
  consentement: Joi.boolean().truthy('on', 'yes', 1).falsy('off', 'no', 0).required().description('Acceptation des conditions et politique de confidentialité'),
  createdAt: Joi.string().isoDate().default(() => new Date().toISOString()).description('Date de création'),
}).label('ReservationSchema');

module.exports = {
  contactSchema,
  idSchema,
  paginationSchema,
  replySchema,
  reservationSchema,
};
