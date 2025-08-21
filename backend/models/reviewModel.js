/**
 * @file reviewModel.js
 * @description Modèle avis pour le projet L&L Ouest Services. Définit le schéma
 * de validation en important le schéma depuis validationUtils.js.
 * @module models/reviewModel
 */

const { reviewSchema, validate } = require('../utils/validationUtils');

/**
 * @typedef {Object} Review
 * @property {string} id - Identifiant unique de l'avis (UUID).
 * @property {string} userId - ID de l'utilisateur ayant laissé l'avis.
 * @property {string} serviceId - ID du service concerné.
 * @property {number} rating - Note de l'avis (1 à 5).
 * @property {string} comment - Commentaire de l'avis.
 * @property {string[]} [images] - URLs des images jointes.
 * @property {string} [createdAt] - Date de création (ISO 8601).
 * @property {string} [updatedAt] - Date de mise à jour (ISO 8601).
 */

/**
 * Valide les données avis en utilisant le schéma centralisé.
 * @param {Object} data - Données avis à valider.
 * @returns {Object} Résultat de la validation { value, error }.
 */
const validateReview = (data) => validate(data, reviewSchema);

module.exports = {
  reviewSchema,
  validateReview,
};

