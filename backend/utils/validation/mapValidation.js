/**
 * @file mapValidation.js
 * @description Schémas Joi pour valider les opérations de géolocalisation dans L&L Ouest Services.
 * Centralise les validations pour les requêtes de géocodage, calcul de distance, et gestion des localisations.
 * Utilisé par mapService.js et mapRoutes.js pour garantir la cohérence des données.
 * @module utils/validation/mapValidation
 */

const Joi = require('joi');
const { serviceSchema } = require('../validationUtils');

/**
 * Schéma de validation pour le géocodage d’une adresse.
 * @type {Joi.ObjectSchema}
 */
const addressSchema = Joi.object({
  address: Joi.string().min(3).max(255).required().description('Adresse à géolocaliser'),
}).label('AddressSchema');

/**
 * Schéma de validation pour le calcul de distance.
 * @type {Joi.ObjectSchema}
 */
const distanceSchema = Joi.object({
  origin: Joi.object({
    lat: Joi.number().required().description('Latitude de l\'origine'),
    lng: Joi.number().required().description('Longitude de l\'origine'),
  }).required(),
  destination: Joi.object({
    lat: Joi.number().required().description('Latitude de la destination'),
    lng: Joi.number().required().description('Longitude de la destination'),
  }).required(),
}).label('DistanceSchema');

/**
 * Schéma de validation pour la mise à jour de la localisation d’un service.
 * @type {Joi.ObjectSchema}
 */
const serviceLocationSchema = Joi.object({
  serviceId: serviceSchema.extract('id').required().description('ID du service'),
  address: Joi.string().min(3).max(255).required().description('Adresse à géolocaliser'),
}).label('ServiceLocationSchema');

/**
 * Schéma de validation pour la recherche de services à proximité.
 * @type {Joi.ObjectSchema}
 */
const nearbySchema = Joi.object({
  radius: Joi.number().integer().min(1000).max(50000).default(10000).description('Rayon de recherche en mètres'),
}).label('NearbySchema');

/**
 * Schéma de validation pour l’abonnement aux mises à jour de localisation.
 * @type {Joi.ObjectSchema}
 */
const subscriptionSchema = Joi.object({
  interval: Joi.number().integer().min(30000).max(300000).default(60000).description('Intervalle de mise à jour en ms'),
}).label('SubscriptionSchema');

module.exports = {
  addressSchema,
  distanceSchema,
  serviceLocationSchema,
  nearbySchema,
  subscriptionSchema,
};
