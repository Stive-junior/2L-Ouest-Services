/**
 * @file errorMiddleware.js
 * @description Middleware pour gérer les erreurs globales dans L&L Ouest Services.
 * Formate les réponses d'erreur pour une cohérence API.
 * @module middleware/errorMiddleware
 */

const { AppError } = require('../utils/errorUtils');
const { logger, logError } = require('../services/loggerService');

/**
 * Middleware de gestion des erreurs.
 * @param {Error} err - Erreur capturée.
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 * @param {Function} next - Fonction pour passer au middleware suivant.
 * @returns {void}
 */
const errorMiddleware = (err, req, res, next) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : 'Erreur serveur interne';
  const details = err instanceof AppError && err.details ? err.details : null;

  logError('Erreur traitée par le middleware', {
    statusCode,
    message,
    details,
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({
    error: message,
    ...(details && { details }),
  });
};

module.exports = errorMiddleware;
