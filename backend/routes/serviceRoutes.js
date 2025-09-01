/**
 * @file serviceRoutes.js
 * @description Routes pour gérer les services de nettoyage dans L&L Ouest Services.
 * Applique les middlewares pour l’authentification, la validation et la limitation de taux.
 * Utilise les schémas Joi centralisés dans serviceValidation.js pour valider les requêtes.
 * @module routes/serviceRoutes
 */

const express = require('express');
const router = express.Router();
const { authenticate, restrictTo, validationMiddleware } = require('../middleware');
const {
  createService,
  getServiceById,
  updateService,
  deleteService,
  getAllServices,
  getServicesByCategory,
  getNearbyServices,
  updateServiceLocation,
  uploadServiceImage,
  deleteServiceImage,
} = require('../controllers/serviceController');
const {
  createServiceSchema,
  updateServiceSchema,
  idSchema,
  paginationSchema,
  categorySchema,
  nearbySchema,
  locationSchema,
  addImageSchema,
  deleteImageSchema,
} = require('../utils/validation/serviceValidation');

/**
 * Routes protégées par authentification
 */
router.use(authenticate);

router.post('/', [restrictTo(['admin']), validationMiddleware(createServiceSchema)], createService);
router.get('/:id', [validationMiddleware(idSchema)], getServiceById);
router.put('/:id', [restrictTo(['admin']), validationMiddleware(updateServiceSchema)], updateService);
router.delete('/:id', [restrictTo(['admin']), validationMiddleware(idSchema)], deleteService);
router.get('/', [validationMiddleware(paginationSchema)], getAllServices);
router.get('/category/:category', [validationMiddleware(categorySchema)], getServicesByCategory);
router.get('/nearby', [validationMiddleware(nearbySchema)], getNearbyServices);
router.patch('/:id/location', [restrictTo(['admin']), validationMiddleware(locationSchema)], updateServiceLocation);
router.post('/:id/image', [restrictTo(['admin']), validationMiddleware(addImageSchema)], uploadServiceImage);
router.delete('/:id/image', [restrictTo(['admin']), validationMiddleware(deleteImageSchema)], deleteServiceImage);

module.exports = router;
