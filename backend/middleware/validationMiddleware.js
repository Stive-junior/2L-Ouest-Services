/**
 * @file validationMiddleware.js
 * @description Middleware pour valider les données des requêtes avec Joi dans L&L Ouest Services.
 * Utilise les schémas définis dans validationUtils.js pour garantir la conformité des données.
 * @module middleware/validationMiddleware
 */

const { validate } = require('../utils/validationUtils');
const { AppError, createValidationError } = require('../utils/errorUtils');
const { logger, logError } = require('../services/loggerService');
const Joi = require('joi');

/**
 * Middleware de validation des données.
 * @param {Joi.ObjectSchema} schema - Schéma Joi pour valider les données.
 * @returns {Function} Middleware de validation.
 */
const validationMiddleware = (schema) => {
  return (req, res, next) => {
    try {
      const dataToValidate = {
        ...req.body,
        ...req.params,
        ...req.query
      };

      const { value, error } = validate(dataToValidate, schema);

      if (error) {
        logError('Erreur de validation des données', {
          details: error.details,
          path: req.path,
          method: req.method
        });
        
        const validationError = createValidationError(error);
        return next(validationError);
      }

      // Stockage des données validées
      req.validatedData = value;
      next();
    } catch (error) {
      logError('Erreur inattendue lors de la validation', {
        error: error.message,
        path: req.path,
        method: req.method
      });
      next(new AppError(500, 'Erreur serveur lors de la validation des données'));
    }
  };
};

module.exports = validationMiddleware;
