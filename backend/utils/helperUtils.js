/**
 * @file helperUtils.js
 * @description Module contenant des fonctions utilitaires génériques pour le projet.
 * Inclut des outils pour la génération d'identifiants, le formatage des données,
 * et la manipulation des chaînes.
 * @module helperUtils
 */

const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

/**
 * @function generateUUID
 * @description Génère un identifiant unique (UUID v4).
 * @returns {string} UUID généré.
 */
const generateUUID = () => {
  return uuidv4();
};

/**
 * @function formatDate
 * @description Formate une date selon un format spécifié (par défaut ISO 8601).
 * @param {Date|string} date - Date à formater.
 * @param {string} [format='YYYY-MM-DD HH:mm:ss'] - Format de sortie (Moment.js).
 * @returns {string} Date formatée.
 */
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(date).format(format);
};

/**
 * @function sanitizeString
 * @description Nettoie une chaîne en supprimant les caractères non désirés et en normalisant.
 * @param {string} input - Chaîne à nettoyer.
 * @returns {string} Chaîne nettoyée.
 */
const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Supprime les balises HTML
    .replace(/[\r\n]+/g, ' ') // Remplace les sauts de ligne par des espaces
    .substring(0, 1000); // Limite la longueur
};

/**
 * @function paginateResults
 * @description Pagine les résultats d'une requête Firestore.
 * @param {Object} query - Requête Firestore.
 * @param {number} page - Numéro de page (commence à 1).
 * @param {number} limit - Nombre d'éléments par page.
 * @returns {Promise<{ results: Object[], total: number, page: number, totalPages: number }>} Résultats paginés.
 */
const paginateResults = async (query, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const snapshot = await query.limit(limit).offset(offset).get();
  const totalSnapshot = await query.count().get();
  const total = totalSnapshot.data().count;

  return {
    results: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * @function generateRandomString
 * @description Génère une chaîne aléatoire pour des tokens temporaires ou des clés.
 * @param {number} length - Longueur de la chaîne.
 * @returns {string} Chaîne aléatoire.
 */
const generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

module.exports = {
  generateUUID,
  formatDate,
  sanitizeString,
  paginateResults,
  generateRandomString,
};
