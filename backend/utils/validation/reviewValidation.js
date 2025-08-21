/**
 * @file reviewValidation.js
 * @description Schémas Joi pour valider les opérations sur les avis dans L&L Ouest Services.
 * Centralise les validations pour les requêtes de création, mise à jour, récupération et gestion des images.
 * Utilisé par reviewService.js et reviewRoutes.js pour garantir la cohérence des données.
 * @module utils/validation/reviewValidation
 */

const Joi = require('joi');
const { reviewSchema, serviceSchema } = require('../validationUtils');

/**
 * Schéma de validation pour la création d’un avis.
 * @type {Joi.ObjectSchema}
 */
const createReviewSchema = Joi.object({
  userId: reviewSchema.extract('userId').required(),
  serviceId: reviewSchema.extract('serviceId').required(),
  rating: reviewSchema.extract('rating').required(),
  comment: reviewSchema.extract('comment').required(),
}).label('CreateReviewSchema');

/**
 * Schéma de validation pour la mise à jour d’un avis.
 * @type {Joi.ObjectSchema}
 */
const updateReviewSchema = Joi.object({
  id: reviewSchema.extract('id').required(),
  rating: reviewSchema.extract('rating').optional(),
  comment: reviewSchema.extract('comment').optional(),
  updatedAt: reviewSchema.extract('updatedAt').optional(),
}).label('UpdateReviewSchema');

/**
 * Schéma de validation pour l’ID d’un avis.
 * @type {Joi.ObjectSchema}
 */
const idSchema = Joi.object({
  id: reviewSchema.extract('id').required().description('Identifiant unique de l\'avis'),
}).label('IdSchema');

/**
 * Schéma de validation pour les avis par service.
 * @type {Joi.ObjectSchema}
 */
const serviceReviewsSchema = Joi.object({
  serviceId: serviceSchema.extract('id').required().description('Identifiant unique du service'),
  page: Joi.number().integer().min(1).default(1).description('Numéro de page'),
  limit: Joi.number().integer().min(1).max(100).default(10).description('Limite par page'),
}).label('ServiceReviewsSchema');

/**
 * Schéma de validation pour les avis de l’utilisateur.
 * @type {Joi.ObjectSchema}
 */
const userReviewsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).description('Numéro de page'),
  limit: Joi.number().integer().min(1).max(100).default(10).description('Limite par page'),
}).label('UserReviewsSchema');

/**
 * Schéma de validation pour l’ajout d’une image à un avis.
 * @type {Joi.ObjectSchema}
 */
const imageSchema = Joi.object({
  id: reviewSchema.extract('id').required().description('Identifiant unique de l\'avis'),
}).label('ImageSchema');

/**
 * Schéma de validation pour la suppression d’une image d’un avis.
 * @type {Joi.ObjectSchema}
 */
const deleteImageSchema = Joi.object({
  id: reviewSchema.extract('id').required().description('Identifiant unique de l\'avis'),
  fileUrl: Joi.string().uri().required().description('URL de l\'image à supprimer'),
}).label('DeleteImageSchema');

module.exports = {
  createReviewSchema,
  updateReviewSchema,
  idSchema,
  serviceReviewsSchema,
  userReviewsSchema,
  imageSchema,
  deleteImageSchema,
};
