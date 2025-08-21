/**
 * @file chatMessageModel.js
 * @description Modèle message de chat pour le projet L&L Ouest Services. Définit le schéma
 * de validation en important le schéma depuis validationUtils.js. Supporte des contenus
 * textuels et multimédias.
 * @module models/chatMessageModel
 */

const { chatMessageSchema, validate } = require('../utils/validationUtils');

/**
 * @typedef {Object} ChatMessage
 * @property {string} id - Identifiant unique du message (UUID).
 * @property {string} senderId - ID de l'expéditeur.
 * @property {string} recipientId - ID du destinataire.
 * @property {string|Object} content - Contenu du message (texte ou multimédia).
 * @property {string} [timestamp] - Date d'envoi (ISO 8601).
 * @property {string} status - Statut du message ('sent', 'delivered', 'read').
 */

/**
 * Valide les données message de chat en utilisant le schéma centralisé.
 * @param {Object} data - Données message à valider.
 * @returns {Object} Résultat de la validation { value, error }.
 */
const validateChatMessage = (data) => validate(data, chatMessageSchema);

module.exports = {
  chatMessageSchema,
  validateChatMessage,
};
