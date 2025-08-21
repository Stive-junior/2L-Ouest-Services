/**
 * @file notificationRoutes.js
 * @description Routes pour gérer les notifications dans L&L Ouest Services.
 * Applique des middlewares pour l'authentification, la restriction aux admins et la validation.
 * @module routes/notificationRoutes
 */

const express = require('express');
const router = express.Router();
const { authenticate, restrictTo, validationMiddleware } = require('../middleware');
const { sendPushNotification, notifyNewMessage, notifyMessageRead, notifyNewService, notifyServiceUpdate, notifyNewReview, notifyUserCreated, notifyNewContact } = require('../controllers/notificationController');
const { pushNotificationSchema, messageIdSchema, serviceIdSchema, reviewIdSchema, userIdSchema, contactIdSchema } = require('../utils/validation/notificationValidation');

// Routes protégées par authentification
router.use(authenticate);

router.post('/push', [restrictTo(['admin']), validationMiddleware(pushNotificationSchema)], sendPushNotification);
router.post('/message', [restrictTo(['admin']), validationMiddleware(messageIdSchema)], notifyNewMessage);
router.post('/message/read', [validationMiddleware(messageIdSchema)], notifyMessageRead);
router.post('/service', [restrictTo(['admin']), validationMiddleware(serviceIdSchema)], notifyNewService);
router.post('/service/update', [restrictTo(['admin']), validationMiddleware(serviceIdSchema)], notifyServiceUpdate);
router.post('/review', [restrictTo(['admin']), validationMiddleware(reviewIdSchema)], notifyNewReview);
router.post('/user', [restrictTo(['admin']), validationMiddleware(userIdSchema)], notifyUserCreated);
router.post('/contact', [restrictTo(['admin']), validationMiddleware(contactIdSchema)], notifyNewContact);

module.exports = router;