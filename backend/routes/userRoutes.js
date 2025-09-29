/**
 * @file userRoutes.js
 * @description Routes pour gérer les utilisateurs dans L&L Ouest Services.
 * Applique les middlewares pour l'authentification, la validation et la limitation de taux.
 * @module routes/userRoutes
 */

const express = require('express');
const router = express.Router();
const { authenticate, restrictTo, validationMiddleware, rateLimitMiddleware } = require('../middleware');
const { createUser, getProfile, getUserById, getUserByEmail, updateProfile, updateUser, deleteUser, getAllUsers, getUsersByRole, updatePreferences, addInvoice, removeInvoice, checkEmailAvailability } = require('../controllers/userController');
const { createUserSchema, updateUserSchema, idSchema, emailSchema, paginationSchema, roleSchema, preferencesSchema, invoiceSchema } = require('../utils/validation/userValidation');

// Routes publiques
router.post('/', [rateLimitMiddleware, validationMiddleware(createUserSchema)], createUser);
router.get('/check-email/:email', [rateLimitMiddleware, validationMiddleware(emailSchema)], checkEmailAvailability);

// Routes protégées par authentification
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', [validationMiddleware(updateUserSchema)], updateProfile);
router.patch('/preferences', [validationMiddleware(preferencesSchema)], updatePreferences);
router.post('/invoices', [validationMiddleware(invoiceSchema)], addInvoice);
router.delete('/invoices/:invoiceId', [validationMiddleware(idSchema)], removeInvoice);

// Routes réservées aux administrateurs
router.get('/:id', [restrictTo(['admin']), validationMiddleware(idSchema)], getUserById);
router.get('/email/:email', [restrictTo(['admin']), validationMiddleware(emailSchema)], getUserByEmail);
router.put('/:id', [restrictTo(['admin']), validationMiddleware(updateUserSchema)], updateUser);
router.delete('/:id', [restrictTo(['admin']), validationMiddleware(idSchema)], deleteUser);
router.get('/', [restrictTo(['admin']), validationMiddleware(paginationSchema)], getAllUsers);
router.get('/role/:role', [restrictTo(['admin']), validationMiddleware(roleSchema)], getUsersByRole);

module.exports = router;