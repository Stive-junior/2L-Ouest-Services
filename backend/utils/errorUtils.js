/**
 * @file errorUtils.js
 * @description Module de gestion centralisée des erreurs pour l'application.
 * Fournit une classe AppError pour standardiser les erreurs, avec des codes HTTP,
 * des messages utilisateur et des détails pour le debugging.
 * @module errorUtils
 */

/**
 * @class AppError
 * @extends Error
 * @description Classe personnalisée pour gérer les erreurs de l'application.
 * @property {number} statusCode - Code de statut HTTP (ex: 400, 500).
 * @property {string} message - Message d'erreur destiné à l'utilisateur.
 * @property {string} details - Détails techniques pour le debugging (non exposés en production).
 * @property {boolean} isOperational - Indique si l'erreur est opérationnelle (non critique).
 */
class AppError extends Error {
  constructor(statusCode, message, details = '', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}


class NotFoundError extends AppError {
  constructor(message) {
    super(404, message, 'NOT_FOUND');
  }
}


class UnauthorizedError extends AppError {
  constructor(message) {
    super(401, message, 'UNAUTHORIZED');
  }
}

/**
 * @function handleError
 * @description Formate et renvoie une réponse d'erreur standardisée pour les API.
 * @param {AppError|Error} error - L'erreur à formater.
 * @param {Object} res - Objet de réponse Express.
 * @returns {void}
 */
const handleError = (error, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = error.statusCode || 500;
  const response = {
    status: 'error',
    message: error.message || 'Une erreur inattendue est survenue',
    ...(isProduction ? {} : { details: error.details || error.stack }),
  };

  res.status(statusCode).json(response);
};

/**
 * @function createValidationError
 * @description Crée une erreur de validation avec des messages personnalisés en français
 * @param {Object} error - Erreur Joi contenant les détails de validation
 * @returns {AppError} Erreur formatée pour la validation
 */
const createValidationError = (error) => {
  const formatMessage = (detail) => {
    const field = detail.path.join('.');
    switch (detail.type) {
      case 'string.empty':
        return `Le champ '${field}' ne peut pas être vide`;
      case 'any.required':
        return `Le champ '${field}' est obligatoire`;
      case 'string.min':
        return `Le champ '${field}' doit contenir au moins ${detail.context.limit} caractères`;
      case 'string.max':
        return `Le champ '${field}' ne peut pas dépasser ${detail.context.limit} caractères`;
      case 'string.email':
        return `Le champ '${field}' doit être une adresse email valide`;
      case 'number.base':
        return `Le champ '${field}' doit être un nombre`;
      case 'date.base':
        return `Le champ '${field}' doit être une date valide`;
      case 'array.base':
        return `Le champ '${field}' doit être un tableau`;
      case 'object.base':
        return `Le champ '${field}' doit être un objet`;
      default:
        return detail.message;
    }
  };

  const details = error.details.map(detail => formatMessage(detail)).join('; ');
  return new AppError(400, 'Données invalides', details);
};

/**
 * @function wrapAsync
 * @description Enveloppe une fonction async pour capturer les erreurs et les passer au middleware d'erreur Express.
 * @param {Function} fn - Fonction async à envelopper.
 * @returns {Function} Fonction enveloppée compatible avec Express.
 */
const wrapAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  NotFoundError,
  UnauthorizedError,
  handleError,
  createValidationError,
  wrapAsync,
};