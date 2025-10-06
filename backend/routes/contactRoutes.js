/**
 * @file contactRoutes.js
 * @description Routes pour gérer les messages de contact et les réservations dans L&L Ouest Services.
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
  replyToContact,
  createReservation,
  getReservation,
  updateReservation,
  deleteReservation,
  getAllReservations,
  replyToReservation,
} = require('../controllers/contactController');
const { 
  contactSchema, 
  idSchema, 
  paginationSchema, 
  replySchema,
  reservationSchema 
} = require('../utils/validation/contactValidation');

router.post('/', [rateLimitMiddleware, validationMiddleware(contactSchema)], createContact);
router.post('/reservations', [rateLimitMiddleware, validationMiddleware(reservationSchema)], createReservation);

router.use(authenticate);
router.get('/:id', [validationMiddleware(idSchema)], getContact);
router.put('/:id', [restrictTo(['client', 'admin']), validationMiddleware(contactSchema)], updateContact);
router.delete('/:id', [restrictTo(['client', 'admin']), validationMiddleware(idSchema)], deleteContact);
router.get('/', [restrictTo(['admin']), validationMiddleware(paginationSchema)], getAllContacts);
router.post('/:id/reply', [restrictTo(['admin']), validationMiddleware(replySchema)], replyToContact);

// Routes pour les réservations
router.get('/reservations/:id', [validationMiddleware(idSchema)], getReservation);
router.put('/reservations/:id', [restrictTo(['client', 'admin']), validationMiddleware(reservationSchema)], updateReservation);
router.delete('/reservations/:id', [restrictTo(['client', 'admin']), validationMiddleware(idSchema)], deleteReservation);
router.get('/reservations', [restrictTo(['admin']), validationMiddleware(paginationSchema)], getAllReservations);
router.post('/reservations/:id/reply', [restrictTo(['admin']), validationMiddleware(replySchema)], replyToReservation);

module.exports = router;