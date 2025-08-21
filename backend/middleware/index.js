/**
 * @file index.js
 * @description Exporte tous les middlewares pour une utilisation centralisée dans L&L Ouest Services.
 * @module middleware
 */

const authMiddleware = require('./authMiddleware');
const corsMiddleware = require('./corsMiddleware');
const errorMiddleware = require('./errorMiddleware');
const rateLimitMiddleware = require('./rateLimitMiddleware');
const validationMiddleware = require('./validationMiddleware');
const loggingMiddleware = require('./loggingMiddleware');

module.exports = {
  ...authMiddleware,
  corsMiddleware,
  errorMiddleware,
  rateLimitMiddleware,
  validationMiddleware,
  loggingMiddleware
};
