/**
 * @file reviewRoutes.js
 * @description Routes pour gérer les avis dans L&L Ouest Services.
 * Applique les middlewares pour l'authentification et la validation.
 * @module routes/reviewRoutes
 */

const express = require('express');
const router = express.Router();
const { authenticate, restrictTo, validationMiddleware } = require('../middleware');
const { createReview, getReview, updateReview, deleteReview, getReviewsByService, getUserReviews, uploadReviewImage, deleteReviewImage } = require('../controllers/reviewController');
const { createReviewSchema, updateReviewSchema, idSchema, serviceReviewsSchema, userReviewsSchema, imageSchema, deleteImageSchema } = require('../utils/validation/reviewValidation');

// Routes protégées par authentification
router.use(authenticate);

router.post('/', [validationMiddleware(createReviewSchema)], createReview);
router.get('/:id', [validationMiddleware(idSchema)], getReview);
router.put('/:id', [restrictTo(['client', 'admin']), validationMiddleware(updateReviewSchema)], updateReview);
router.delete('/:id', [restrictTo(['client', 'admin']), validationMiddleware(idSchema)], deleteReview);
router.get('/service/:serviceId', [validationMiddleware(serviceReviewsSchema)], getReviewsByService);
router.get('/user', [validationMiddleware(userReviewsSchema)], getUserReviews);
router.post('/:id/image', [restrictTo(['client', 'admin']), validationMiddleware(imageSchema)], uploadReviewImage);
router.delete('/:id/image', [restrictTo(['client', 'admin']), validationMiddleware(deleteImageSchema)], deleteReviewImage);

module.exports = router;