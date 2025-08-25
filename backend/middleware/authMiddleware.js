/**
 * @file authMiddleware.js
 * @description Middleware pour vérifier l'authentification des requêtes via JWT pour L&L Ouest Services.
 * Vérifie les tokens et les rôles des utilisateurs pour sécuriser l'accès aux routes.
 * @module middleware/authMiddleware
 */

const { AppError, UnauthorizedError } = require('../utils/errorUtils');
const { logger, logError, logInfo } = require('../services/loggerService');
const  authService  = require('../services/authService');



/**
 * Middleware permissif d'authentification.
 * - Si le token est valide → req.user est défini
 * - Si pas de token ou token invalide → req.user est undefined
 * @async
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 * @param {Function} next - Middleware suivant.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    logInfo('Token reçu dans middleware', { tokenSnippet: token.substring(0, 20) + '...' });

    const decoded = await authService.verifyJwt(token);
    req.user = decoded;
    logInfo('Utilisateur authentifié', { userId: decoded.userId });
  } catch (error) {
    logError('Token invalide ou expiré', { error: error.message });
    
  }

  return next();
}


/**
 * Middleware pour restreindre l'accès aux utilisateurs avec un rôle spécifique.
 * @param {string[]} roles - Rôles autorisés (ex. ['admin', 'client']).
 * @returns {Function} Middleware de restriction de rôle.
 */
const restrictTo = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new AppError(403, 'Accès non autorisé pour ce rôle');
      logError('Accès non autorisé', { userId: req.user?.id, role: req.user?.role, requiredRoles: roles });
      return next(error);
    }
    logInfo('Vérification de rôle réussie', { userId: req.user.id, role: req.user.role });
    next();
  };
};

module.exports = {
  authenticate,
  restrictTo,
};