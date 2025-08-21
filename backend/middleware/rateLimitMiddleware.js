/**
 * @file rateLimitMiddleware.js
 * @description Middleware pour limiter le nombre de requêtes par IP dans L&L Ouest Services.
 * Protège contre les abus et les attaques par déni de service.
 * @module middleware/rateLimitMiddleware
 */

const rateLimit = require('express-rate-limit');
const { AppError } = require('../utils/errorUtils');
const { logger, logWarn } = require('../services/loggerService');
const config = require('../config/config');

/**
 * Middleware de limitation de taux.
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 * @param {Function} next - Fonction pour passer au middleware suivant.
 * @returns {void}
 */
const rateLimitMiddleware = rateLimit({
  windowMs: config.rateLimit.windowMs || 15 * 60 * 1000,
  max: config.rateLimit.max || 100, 
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    logWarn('Limite de requêtes atteinte', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: 'Trop de requêtes, veuillez réessayer plus tard.',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
    });
  },
});

module.exports = rateLimitMiddleware;
