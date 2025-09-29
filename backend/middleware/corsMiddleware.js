/**
 * @file corsMiddleware.js
 * @description Middleware pour gérer les politiques CORS ultra-sécurisées pour L&L Ouest Services.
 * Valide dynamiquement les origines contre une liste blanche stricte et journalise les requêtes CORS.
 * @module middleware/corsMiddleware
 */

const cors = require('cors');
const config = require('../config/config');
const { logger, logInfo } = require('../services/loggerService');

// Liste des origines autorisées, incluant les environnements de production et de développement
const allowedOrigins = [
  config.frontendUrl, // URL du frontend depuis la configuration
  'http://localhost:3000', // Développement local
  'http://localhost:35909', // Port alternatif pour tests
].filter(Boolean); // Supprime les valeurs undefined/null

/**
 * Valide dynamiquement l'origine de la requête.
 * @param {string} origin - Origine de la requête.
 * @param {Function} callback - Callback pour accepter ou rejeter l'origine.
 */
const originValidator = (origin, callback) => {
  // Autoriser les requêtes sans origine (ex. : requêtes locales non-browser)
  if (!origin) {
    return callback(null, true);
  }

  // Vérifier si l'origine est dans la liste blanche
  if (allowedOrigins.includes(origin)) {
    return callback(null, origin);
  }

  // Journaliser et rejeter les origines non autorisées
  logger.warn(`CORS: Origine non autorisée: ${origin}`);
  callback(new Error('Origine non autorisée par la politique CORS'));
};

/**
 * Configuration CORS sécurisée
 * @type {import('cors').CorsOptions}
 */
const corsOptions = {
  origin: originValidator,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'Content-Range'], // En-têtes exposés au client
  credentials: true, // Autoriser les cookies et en-têtes d'authentification
  maxAge: 86400, // Cache des pré-vérifications CORS pendant 24h
};

/**
 * Middleware CORS pour sécuriser les requêtes cross-origin.
 */
const corsMiddleware = cors(corsOptions);

/**
 * Middleware pour journaliser et appliquer la politique CORS.
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 * @param {Function} next - Fonction pour passer au middleware suivant.
 * @returns {void}
 */
const logCors = (req, res, next) => {
  const origin = req.headers.origin;

  // Journaliser les requêtes CORS
  logInfo('Requête CORS traitée', {
    origin: origin || 'aucune origine',
    method: req.method,
    path: req.path,
  });

  // Appliquer le middleware CORS
  corsMiddleware(req, res, (err) => {
    if (err) {
      logger.error('Erreur CORS', {
        origin,
        error: err.message,
        method: req.method,
        path: req.path,
      });
      return res.status(403).json({ error: 'Requête CORS non autorisée' });
    }
    next();
  });
};

module.exports = logCors;