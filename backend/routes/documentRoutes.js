/**
 * @file documentRoutes.js
 * @description Routes pour gérer les factures dans L&L Ouest Services.
 * Applique les middlewares pour l'authentification et la validation.
 * @module routes/documentRoutes
 */

const express = require('express');
const router = express.Router();
const { authenticate, restrictTo, validationMiddleware } = require('../middleware');
const { generateInvoice, getInvoice, updateInvoice, deleteInvoice, getUserInvoices } = require('../controllers/documentController');
const { createInvoiceSchema, updateInvoiceSchema, idSchema, paginationSchema } = require('../utils/validation/documentValidation');

// Routes protégées par authentification
router.use(authenticate);

router.post('/', [restrictTo(['admin']), validationMiddleware(createInvoiceSchema)], generateInvoice);
router.get('/:id', [validationMiddleware(idSchema)], getInvoice);
router.put('/:id', [restrictTo(['client', 'admin']), validationMiddleware(updateInvoiceSchema)], updateInvoice);
router.delete('/:id', [restrictTo(['client', 'admin']), validationMiddleware(idSchema)], deleteInvoice);
router.get('/', [validationMiddleware(paginationSchema)], getUserInvoices);

module.exports = router;
