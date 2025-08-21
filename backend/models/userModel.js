/**
 * @file userModel.js
 * @description Modèle utilisateur pour le projet L&L Ouest Services. Définit le schéma
 * de validation en important le schéma depuis validationUtils.js.
 * @module models/userModel
 */

const { userSchema, validate } = require('../utils/validationUtils');


/**
 * @typedef {Object} User
 * @property {string} id - ID de l'utilisateur.
 * @property {string} email - Email de l'utilisateur.
 * @property {string} name - Nom de l'utilisateur.
 * @property {string} phone - Numéro de téléphone.
 * @property {string} address - Adresse de l'utilisateur.
 * @property {string} role - Rôle de l'utilisateur (client, provider, admin).
 * @property {string|null} company - Nom de l'entreprise (optionnel).
 * @property {Array<Object>} invoices - Liste des factures.
 * @property {Object} preferences - Préférences de l'utilisateur.
 * @property {boolean} preferences.notifications - Préférence de notification.
 * @property {string} preferences.language - Langue préférée.
 * @property {string} preferences.fcmToken - Token FCM pour notifications.
 * @property {string} createdAt - Date de création.
 * @property {string} lastLogin - Date de dernière connexion.
 * @property {Object|null} location - Localisation (lat, lng).
 */


/**
 * Valide les données utilisateur en utilisant le schéma centralisé.
 * @param {User|Object} data - Données utilisateur à valider.
 * @returns {Object} Résultat de la validation { value, error }.
 */
const validateUser = (data) => validate(data, userSchema);

module.exports = {
  userSchema,
  validateUser,
};

