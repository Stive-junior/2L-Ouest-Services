/**
 * @file serviceModel.js
 * @description Modèle service pour le projet L&L Ouest Services. Définit le schéma
 * de validation en important le schéma depuis validationUtils.js.
 * @module models/serviceModel
 */

const { serviceSchema, validate } = require('../utils/validationUtils');

/**
 * @typedef {Object} Service
 * @property {string} id - Identifiant unique du service (UUID).
 * @property {string} name - Nom du service.
 * @property {string} description - Description détaillée du service.
 * @property {number} price - Prix du service.
 * @property {string} category - Catégorie du service.
 * @property {string[]} [images] - URLs des images associées.
 * @property {Object} [availability] - Informations de disponibilité.
 * @property {string} [createdAt] - Date de création (ISO 8601).
 */

/**
 * Valide les données service en utilisant le schéma centralisé.
 * @param {Object} data - Données service à valider.
 * @returns {Object} Résultat de la validation { value, error }.
 */
const validateService = (data) => validate(data, serviceSchema);

module.exports = {
  serviceSchema,
  validateService,
};
