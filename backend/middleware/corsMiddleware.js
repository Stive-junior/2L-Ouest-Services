/**
 * @file corsMiddleware.js
 * @description Middleware pour gérer les politiques CORS pour L&L Ouest Services.
 * Configure les origines autorisées, les méthodes, et les en-têtes.
 * @module middleware/corsMiddleware
 */

const cors = require('cors');
const config = require('../config/config');
const { logger, logInfo } = require('../services/loggerService');

// Liste des origines autorisées, y compris localhost pour le développement
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:3000',
  'http://localhost:35909',
];

/**
 * Middleware CORS pour sécuriser les requêtes cross-origin.
 * La configuration accepte directement le tableau d'origines autorisées.
 * @returns {void}
 */
const corsMiddleware = cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

/**
 * Middleware pour logger la requête CORS et appliquer le middleware cors.
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 * @param {Function} next - Fonction pour passer au middleware suivant.
 * @returns {void}
 */
const logCors = (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    logger.warn(`Origin not allowed by CORS: ${origin}`);
    return corsMiddleware(req, res, next);
  }
  logInfo('Requête CORS traitée', { origin, method: req.method });
  corsMiddleware(req, res, next);
};

module.exports = logCors;
