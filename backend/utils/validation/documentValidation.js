/**
 * @file documentValidation.js
 * @description Schémas Joi pour valider les opérations sur les factures dans L&L Ouest Services.
 * Centralise les validations pour les requêtes de création, mise à jour, récupération et pagination.
 * Utilisé par documentService.js et documentRoutes.js pour garantir la cohérence des données.
 * @module utils/validation/documentValidation
 */

const Joi = require('joi');
const { invoiceSchema } = require('../validationUtils');

/**
 * Schéma de validation pour la création d’une facture.
 * @type {Joi.ObjectSchema}
 */
const createInvoiceSchema = Joi.object({
  amount: invoiceSchema.extract('amount').required(),
  items: invoiceSchema.extract('items').required(),
  dueDate: invoiceSchema.extract('dueDate').required().description('Date d\'échéance (ISO 8601)'),
  htmlTemplate: Joi.string().required().description('Template HTML pour la facture'),
}).label('CreateInvoiceSchema');

/**
 * Schéma de validation pour la mise à jour d’une facture.
 * @type {Joi.ObjectSchema}
 */
const updateInvoiceSchema = Joi.object({
  id: invoiceSchema.extract('id').required(),
  amount: invoiceSchema.extract('amount').optional(),
  items: invoiceSchema.extract('items').optional(),
  dueDate: invoiceSchema.extract('dueDate').optional(),
}).label('UpdateInvoiceSchema');

/**
 * Schéma de validation pour l’ID d’une facture.
 * @type {Joi.ObjectSchema}
 */
const idSchema = Joi.object({
  id: invoiceSchema.extract('id').required().description('Identifiant unique de la facture'),
}).label('IdSchema');

/**
 * Schéma de validation pour la pagination des factures.
 * @type {Joi.ObjectSchema}
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).description('Numéro de page'),
  limit: Joi.number().integer().min(1).max(100).default(10).description('Limite par page'),
}).label('PaginationSchema');

module.exports = {
  createInvoiceSchema,
  updateInvoiceSchema,
  idSchema,
  paginationSchema,
};
