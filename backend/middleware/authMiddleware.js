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
 * Middleware d'authentification pour vérifier le token JWT.
 * @param {Object} req - Requête HTTP.
 * @param {Object} res - Réponse HTTP.
 * @param {Function} next - Fonction pour passer au middleware suivant.
 * @returns {Promise<void>}
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token manquant ou mal formaté');
    }

    const token = authHeader.split(' ')[1];
    const decoded = await authService.verifyToken(token);
    req.user = decoded; // Attache les informations de l'utilisateur à la requête
    logInfo('Utilisateur authentifié', { userId: decoded.id, email: decoded.email });
    next();
  } catch (error) {
    logError('Erreur d\'authentification', { error: error.message, path: req.path });
    next(error instanceof AppError ? error : new UnauthorizedError('Authentification échouée'));
  }
};

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