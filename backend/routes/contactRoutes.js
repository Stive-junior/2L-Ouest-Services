/**
 * @file contactRoutes.js
 * @description Routes pour gérer les messages de contact dans L&L Ouest Services.
 * Applique des middlewares pour l'authentification, la validation et la limitation de taux.
 * @module routes/contactRoutes
 */

const express = require('express');
const router = express.Router();
const { authenticate, restrictTo, validationMiddleware, rateLimitMiddleware } = require('../middleware');
const {
  createContact,
  getContact,
  updateContact,
  deleteContact,
  getAllContacts,
} = require('../controllers/contactController');
const { contactSchema, idSchema, paginationSchema } = require('../utils/validation/contactValidation');

// Routes publiques
router.post('/', [rateLimitMiddleware, validationMiddleware(contactSchema)], createContact);

// Routes protégées par authentification
router.use(authenticate);

router.get('/:id', [validationMiddleware(idSchema)], getContact);
router.put('/:id', [restrictTo(['client', 'admin']), validationMiddleware(contactSchema)], updateContact);
router.delete('/:id', [restrictTo(['client', 'admin']), validationMiddleware(idSchema)], deleteContact);
router.get('/', [restrictTo(['admin']), validationMiddleware(paginationSchema)], getAllContacts);

module.exports = router;
