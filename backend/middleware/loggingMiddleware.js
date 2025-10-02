/**
 * @file loggingMiddleware.js
 * @description Middleware pour journaliser les requêtes HTTP dans L&L Ouest Services.
 * Utilise authService pour identifier l'utilisateur à partir du token Firebase.
 * @module middleware/loggingMiddleware
 */

const logger = require('../services/loggerService');
const authService = require('../services/authService');

/**
 * Middleware pour journaliser les requêtes HTTP avec l'ID utilisateur.
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 * @param {Function} next - Fonction pour passer au middleware suivant.
 * @returns {void}
 */
const logRequest = async (req, res, next) => {
  const start = Date.now();

  // Attache un listener à la fin de la réponse
  res.on('finish', async () => {
    const duration = Date.now() - start;
    let userId = 'non authentifié';

    try {
      // Utiliser req.user si déjà défini par authMiddleware
      if (req.user?.userId) {
        userId = req.user.userId;
      } else if (req.headers.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split('Bearer ')[1];
        const { user } = await authService.verifyToken(token);
        userId = user.id || 'firebase-uid inconnu';
      }
    } catch (err) {
      // Journalisation minimale pour éviter d'exposer des données sensibles
      logger.logWarn('Erreur lors de la vérification du token', {
        path: req.path,
        method: req.method,
        errorCode: err.code || 'unknown'
      });
    }

    // Journalisation de la requête
    logger.logAudit('Requête traitée', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || 'inconnu',
      userId,
    });
  });

  next();
};

module.exports = logRequest;