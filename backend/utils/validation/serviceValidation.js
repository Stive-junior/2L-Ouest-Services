/**
 * @file serviceValidation.js
 * @description Schémas Joi pour valider les opérations sur les services de nettoyage dans L&L Ouest Services.
 * Centralise les validations pour les requêtes de création, mise à jour, récupération et gestion des images.
 * Inclut des paramètres spécifiques comme la superficie et la durée pour les services de nettoyage.
 * @module utils/validation/serviceValidation
 */

const Joi = require('joi');
const { serviceSchema } = require('../validationUtils');

/**
 * Schéma de validation pour les images d'un service.
 * @type {Joi.ObjectSchema}
 */
const imageSchema = Joi.object({
  url: Joi.string().uri().required().description('URL de l\'image'),
  type: Joi.string().valid('before', 'after', 'showcase', 'equipment').required().description('Type d\'image (avant, après, vitrine, équipement)'),
  description: Joi.string().max(255).optional().description('Description de l\'image'),
  createdAt: Joi.string().isoDate().default(() => new Date().toISOString()).description('Date de création de l\'image'),
}).label('ImageSchema');

/**
 * Schéma de validation pour la création d’un service.
 * @type {Joi.ObjectSchema}
 */
const createServiceSchema = Joi.object({
  name: serviceSchema.extract('name').required(),
  description: serviceSchema.extract('description').required(),
  price: serviceSchema.extract('price').required(),
  area: serviceSchema.extract('area').optional(),
  duration: serviceSchema.extract('duration').optional(),
  category: serviceSchema.extract('category').required(),
  location: serviceSchema.extract('location').optional(),
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
  area: serviceSchema.extract('area').optional(),
  duration: serviceSchema.extract('duration').optional(),
  category: serviceSchema.extract('category').optional(),
  availability: serviceSchema.extract('availability').optional(),
  location: serviceSchema.extract('location').optional(),
}).label('UpdateServiceSchema');

/**
 * Schéma de validation pour l’ID d’un service.
 * @type {Joi.ObjectSchema}
 */
const idSchema = Joi.object({
  id: serviceSchema.extract('id').required(),
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
  category: serviceSchema.extract('category').required(),
  page: Joi.number().integer().min(1).default(1).description('Numéro de page'),
  limit: Joi.number().integer().min(1).max(100).default(10).description('Limite par page'),
}).label('CategorySchema');

/**
 * Schéma de validation pour la recherche de services à proximité.
 * @type {Joi.ObjectSchema}
 */
const nearbySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required().description('Latitude'),
  lng: Joi.number().min(-180).max(180).required().description('Longitude'),
  radius: Joi.number().integer().min(1000).max(50000).default(10000).description('Rayon de recherche en mètres'),
  area: Joi.number().positive().optional().description('Filtre par superficie en m²'),
  duration: Joi.number().positive().optional().description('Filtre par durée en heures'),
}).label('NearbySchema');

/**
 * Schéma de validation pour la mise à jour de la localisation d’un service.
 * @type {Joi.ObjectSchema}
 */
const locationSchema = Joi.object({
  id: serviceSchema.extract('id').required(),
  address: Joi.string().min(3).max(255).required().description('Adresse à géolocaliser'),
  coordinates: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  }).required().description('Coordonnées géographiques'),
}).label('LocationSchema');

/**
 * Schéma de validation pour l’ajout d’une image à un service.
 * @type {Joi.ObjectSchema}
 */
const addImageSchema = Joi.object({
  id: serviceSchema.extract('id').required(),
  type: imageSchema.extract('type').required(),
  description: imageSchema.extract('description').optional(),
}).label('AddImageSchema');

/**
 * Schéma de validation pour la suppression d’une image d’un service.
 * @type {Joi.ObjectSchema}
 */
const deleteImageSchema = Joi.object({
  id: serviceSchema.extract('id').required(),
  fileUrl: Joi.string().uri().required().description('URL de l’image à supprimer'),
}).label('DeleteImageSchema');

module.exports = {
  serviceSchema,
  createServiceSchema,
  updateServiceSchema,
  idSchema,
  paginationSchema,
  categorySchema,
  nearbySchema,
  locationSchema,
  addImageSchema,
  deleteImageSchema,
};
