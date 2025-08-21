/**
 * @file serviceValidation.js
 * @description Schémas Joi pour valider les opérations sur les services dans L&L Ouest Services.
 * Centralise les validations pour les requêtes de création, mise à jour, récupération et gestion des images.
 * Utilisé par serviceService.js et serviceRoutes.js pour garantir la cohérence des données.
 * @module utils/validation/serviceValidation
 */

const Joi = require('joi');
const { serviceSchema, userSchema } = require('../validationUtils');

/**
 * Schéma de validation pour la création d’un service.
 * @type {Joi.ObjectSchema}
 */
const createServiceSchema = Joi.object({
  name: serviceSchema.extract('name').required(),
  description: serviceSchema.extract('description').required(),
  price: serviceSchema.extract('price').required(),
  category: serviceSchema.extract('category').required(),
  providerId: userSchema.extract('id').required().description('ID du fournisseur'),
}).label('CreateServiceSchema');

/**
 * Schéma de validation pour la mise à jour d’un service.
 * @type {Joi.ObjectSchema}
 */
const updateServiceSchema = Joi.object({
  id: serviceSchema.extract('id').required(),
  name: serviceSchema.extract('name').optional(),
  description: serviceSchema.extract('description').optional(),
  price: serviceSchema.extract('price').optional(),
  category: serviceSchema.extract('category').optional(),
  availability: serviceSchema.extract('availability').optional(),
}).label('UpdateServiceSchema');

/**
 * Schéma de validation pour l’ID d’un service.
 * @type {Joi.ObjectSchema}
 */
const idSchema = Joi.object({
  id: serviceSchema.extract('id').required().description('Identifiant unique du service'),
}).label('IdSchema');

/**
 * Schéma de validation pour la pagination.
 * @type {Joi.ObjectSchema}
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).description('Numéro de page'),
  limit: Joi.number().integer().min(1).max(100).default(10).description('Limite par page'),
}).label('PaginationSchema');

/**
 * Schéma de validation pour la récupération par catégorie.
 * @type {Joi.ObjectSchema}
 */
const categorySchema = Joi.object({
  category: serviceSchema.extract('category').required().description('Catégorie du service'),
  page: Joi.number().integer().min(1).default(1).description('Numéro de page'),
  limit: Joi.number().integer().min(1).max(100).default(10).description('Limite par page'),
}).label('CategorySchema');

/**
 * Schéma de validation pour la recherche de services à proximité.
 * @type {Joi.ObjectSchema}
 */
const nearbySchema = Joi.object({
  radius: Joi.number().integer().min(1000).max(50000).default(10000).description('Rayon de recherche en mètres'),
}).label('NearbySchema');

/**
 * Schéma de validation pour la mise à jour de la localisation d’un service.
 * @type {Joi.ObjectSchema}
 */
const locationSchema = Joi.object({
  id: serviceSchema.extract('id').required().description('Identifiant unique du service'),
  address: Joi.string().min(3).max(255).required().description('Adresse à géolocaliser'),
}).label('LocationSchema');

/**
 * Schéma de validation pour l’ajout d’une image à un service.
 * @type {Joi.ObjectSchema}
 */
const imageSchema = Joi.object({
  id: serviceSchema.extract('id').required().description('Identifiant unique du service'),
}).label('ImageSchema');

/**
 * Schéma de validation pour la suppression d’une image d’un service.
 * @type {Joi.ObjectSchema}
 */
const deleteImageSchema = Joi.object({
  id: serviceSchema.extract('id').required().description('Identifiant unique du service'),
  fileUrl: Joi.string().uri().required().description('URL de l’image à supprimer'),
}).label('DeleteImageSchema');

module.exports = {
  createServiceSchema,
  updateServiceSchema,
  idSchema,
  paginationSchema,
  categorySchema,
  nearbySchema,
  locationSchema,
  imageSchema,
  deleteImageSchema,
};
