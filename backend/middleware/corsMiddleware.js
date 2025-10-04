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
let allowedOrigins = [
  // Gère array ou string pour config.frontendUrl
  ...(Array.isArray(config.frontendUrl) ? config.frontendUrl : [config.frontendUrl || '']),
  'https://ll-ouest-services.netlify.app',  // Frontend Netlify (prod)
  'http://ll-ouest-services.netlify.app',   // Variante sans HTTPS pour tests
  // Optionnel : Autoriser sous-domaines Netlify (ex. preview.*.netlify.app)
  'https://*.netlify.app',
  'http://localhost:3000', // Développement local
  'http://localhost:35909', // Port alternatif pour tests
].filter(Boolean); // Supprime les valeurs undefined/null/vides

// Supprime les doublons
allowedOrigins = [...new Set(allowedOrigins)];

// Pour debug : Log la liste au démarrage
logInfo('CORS: Origines autorisées initialisées', { allowedOrigins });

/**
 * Valide dynamiquement l'origine de la requête.
 * @param {string} origin - Origine de la requête.
 * @param {Function} callback - Callback pour accepter ou rejeter l'origine.
 */
const originValidator = (origin, callback) => {
  // Autoriser les requêtes sans origine (ex. : requêtes locales non-browser)
  if (!origin) {
    logInfo('CORS: Pas d\'origine (local/non-browser)', { origin });
    return callback(null, true);
  }

  // Log pour debug
  logInfo('CORS Validation', { origin, allowedOrigins });

  // Mode dev : Autoriser wildcard localement (à activer via config si besoin)
  if (config.nodeEnv === 'development' && origin === '*') {
    logInfo('CORS: Wildcard autorisé en dev', { origin });
    return callback(null, true);
  }

  const isAllowed = allowedOrigins.some(allowed => {
    if (allowed.includes('*')) {
      // Matching simple pour wildcard (ex. https://preview--*.netlify.app)
      return new RegExp(allowed.replace('*', '.*')).test(origin);
    }
    return allowed === origin;
  });

  if (isAllowed) {
    logInfo('CORS: Origine autorisée', { origin });
    return callback(null, origin);  // Retourne l'origine exacte pour credentials
  }

  // Journaliser et rejeter les origines non autorisées
  logger.warn(`CORS: Origine non autorisée: ${origin}`, { allowedOrigins });
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
  preflightContinue: false,  // Gérer OPTIONS explicitement
  optionsSuccessStatus: 204, // Statut pour OPTIONS sans body
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
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Log détaillé pour OPTIONS preflight et /api/check
  if (req.method === 'OPTIONS' || req.path === '/api/check' || req.path === '/api/health') {
    logInfo('CORS Preflight ou Health/Check traitée', {
      origin: origin || 'aucune origine',
      method: req.method,
      path: req.path,
      clientIp,
      userAgent: userAgent.substring(0, 100), // Limite pour logs
    });
  } else {
    logInfo('CORS Requête standard', {
      origin: origin || 'aucune origine',
      method: req.method,
      path: req.path,
      clientIp,
      userAgent: userAgent.substring(0, 100),
    });
  }

  // Appliquer le middleware CORS
  corsMiddleware(req, res, (err) => {
    if (err) {
      logger.error('Erreur CORS', {
        origin,
        error: err.message,
        method: req.method,
        path: req.path,
        clientIp,
        allowedOrigins,
      });
      // Toujours renvoyer headers CORS sur error (fix pour 502/missing)
      res.set('Access-Control-Allow-Origin', origin || '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.set('Access-Control-Allow-Credentials', 'true');
      res.set('Access-Control-Max-Age', '86400');

      // Pour OPTIONS, renvoyer 204 au lieu de 403 (meilleur pour preflights)
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
      return res.status(403).json({ error: 'Requête CORS non autorisée' });
    }
    next();
  });
};

module.exports = logCors;
