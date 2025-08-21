/**
 * @file index.js
 * @description Exporte toutes les routes pour une utilisation centralisée dans L&L Ouest Services.
 * @module routes
 */

const authRoutes = require('./authRoutes');
const chatRoutes = require('./chatRoutes');
const contactRoutes = require('./contactRoutes');
const documentRoutes = require('./documentRoutes');
const mapRoutes = require('./mapRoutes');
const notificationRoutes = require('./notificationRoutes');
const reviewRoutes = require('./reviewRoutes');
const serviceRoutes = require('./serviceRoutes');
const userRoutes = require('./userRoutes');

module.exports = {
  authRoutes,
  chatRoutes,
  contactRoutes,
  documentRoutes,
  mapRoutes,
  notificationRoutes,
  reviewRoutes,
  serviceRoutes,
  userRoutes,
};
