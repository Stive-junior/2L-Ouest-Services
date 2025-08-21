/**
 * @file contactModel.js
 * @description Modèle message de contact pour le projet L&L Ouest Services. Définit le schéma
 * de validation en important le schéma depuis validationUtils.js.
 * @module models/contactModel
 */

const { contactSchema, validate } = require('../utils/validationUtils');

/**
 * @typedef {Object} Contact
 * @property {string} id - Identifiant unique du message (UUID).
 * @property {string} name - Nom de la personne.
 * @property {string} email - Email de contact.
 * @property {string} message - Message envoyé.
 * @property {string} [subject] - Objet du message.
 * @property {string} [createdAt] - Date de création (ISO 8601).
 */

/**
 * Valide les données contact en utilisant le schéma centralisé.
 * @param {Object} data - Données contact à valider.
 * @returns {Object} Résultat de la validation { value, error }.
 */
const validateContact = (data) => validate(data, contactSchema);

module.exports = {
  contactSchema,
  validateContact,
};
