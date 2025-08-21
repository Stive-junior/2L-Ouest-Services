/**
 * @file mapRoutes.js
 * @description Routes pour gérer les fonctionnalités de géolocalisation dans L&L Ouest Services.
 * Applique les middlewares pour l'authentification, la validation et la limitation de taux.
 * @module routes/mapRoutes
 */

const express = require('express');
const router = express.Router();
const { authenticate, restrictTo, validationMiddleware, rateLimitMiddleware } = require('../middleware');
const { geocodeAddress, calculateDistance, updateUserLocation, updateServiceLocation, findNearbyServices, subscribeToLocationUpdates, unsubscribeFromLocationUpdates } = require('../controllers/mapController');
const { addressSchema, distanceSchema, serviceLocationSchema, nearbySchema, subscriptionSchema } = require('../utils/validation/mapValidation');

// Routes protégées par authentification
router.use(authenticate);

router.post('/geocode', [rateLimitMiddleware, validationMiddleware(addressSchema)], geocodeAddress);
router.post('/distance', [validationMiddleware(distanceSchema)], calculateDistance);
router.put('/user/location', [validationMiddleware(addressSchema)], updateUserLocation);
router.put('/service/location', [restrictTo(['admin']), validationMiddleware(serviceLocationSchema)], updateServiceLocation);
router.get('/nearby', [validationMiddleware(nearbySchema)], findNearbyServices);
router.post('/subscribe', [validationMiddleware(subscriptionSchema)], subscribeToLocationUpdates);
router.delete('/subscribe', unsubscribeFromLocationUpdates);

module.exports = router;
