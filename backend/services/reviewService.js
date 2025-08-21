/**
 * @file reviewService.js
 * @description Service pour gérer les avis sur les services dans L&L Ouest Services.
 * Intègre avec reviewRepo, serviceRepo, userRepo pour les opérations CRUD,
 * notificationService pour les notifications, et storageService pour la gestion des images.
 * @module services/reviewService
 */

const { reviewRepo, serviceRepo, userRepo } = require('../repositories');
const notificationService = require('./notificationService');
const socketService = require('./socketService');
const storageService = require('./storageService');
const { generateUUID } = require('../utils/helperUtils');
const { logger, logInfo, logError, logAudit } = require('./loggerService');
const { AppError } = require('../utils/errorUtils');
const { validate } = require('../utils/validationUtils');
const { createReviewSchema, updateReviewSchema } = require('../utils/validation/reviewValidation');

/**
 * @typedef {Object} Review
 * @property {string} id - Identifiant unique de l'avis (UUID).
 * @property {string} userId - ID de l'utilisateur ayant laissé l'avis.
 * @property {string} serviceId - ID du service concerné.
 * @property {number} rating - Note de l'avis (1 à 5).
 * @property {string} comment - Commentaire de l'avis.
 * @property {string[]} [images] - URLs des images jointes.
 * @property {string} [createdAt] - Date de création (ISO 8601).
 * @property {string} [updatedAt] - Date de mise à jour (ISO 8601).
 */

/**
 * @class ReviewService
 * @description Gère les opérations sur les avis pour L&L Ouest Services, y compris la gestion des images.
 */
class ReviewService {
  /**
   * Crée un nouvel avis.
   * @async
   * @param {Object} reviewData - Données de l'avis.
   * @returns {Promise<Review>} Avis créé.
   */
  async createReview(reviewData) {
    const { error, value } = validate(reviewData, createReviewSchema);
    if (error) throw new AppError(400, 'Données de l\'avis invalides', error.details);

    try {
      await userRepo.getById(value.userId);
      const service = await serviceRepo.getById(value.serviceId);
      const review = {
        id: generateUUID(),
        ...value,
        images: [],
        createdAt: new Date().toISOString(),
      };
      const createdReview = await reviewRepo.create(review);
      await notificationService.notifyNewReview(createdReview.id);
      socketService.emitToRoom(`review:${review.serviceId}`, 'newReview', { reviewId: createdReview.id, serviceId: review.serviceId });
      await notificationService.sendPushNotification(service.providerId, {
        title: 'Nouvel avis reçu',
        body: `Un nouvel avis a été ajouté à votre service "${service.name}".`,
        data: { type: 'newReview', reviewId: createdReview.id, serviceId: review.serviceId },
      });
      logAudit('Avis créé', { reviewId: createdReview.id, serviceId: review.serviceId });
      return createdReview;
    } catch (error) {
      logError('Erreur lors de la création de l\'avis', { error: error.message, reviewData });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création de l\'avis', error.message);
    }
  }

  /**
   * Récupère un avis par son ID.
   * @async
   * @param {string} reviewId - ID de l'avis.
   * @returns {Promise<Review>} Avis trouvé.
   */
  async getReview(reviewId) {
    try {
      const review = await reviewRepo.getById(reviewId);
      logInfo('Avis récupéré', { reviewId });
      return review;
    } catch (error) {
      logError('Erreur lors de la récupération de l\'avis', { error: error.message, reviewId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de l\'avis', error.message);
    }
  }

  /**
   * Met à jour un avis.
   * @async
   * @param {string} reviewId - ID de l'avis.
   * @param {Partial<Review>} reviewData - Données à mettre à jour.
   * @returns {Promise<Review>} Avis mis à jour.
   */
  async updateReview(reviewId, reviewData) {
    const { error, value } = validate({ id: reviewId, ...reviewData }, updateReviewSchema);
    if (error) throw new AppError(400, 'Données de mise à jour invalides', error.details);

    try {
      const existingReview = await reviewRepo.getById(reviewId);
      const updatedReview = await reviewRepo.update(reviewId, {
        ...existingReview,
        ...value,
        updatedAt: new Date().toISOString(),
      });
      const service = await serviceRepo.getById(updatedReview.serviceId);
      socketService.emitToRoom(`review:${updatedReview.serviceId}`, 'reviewUpdated', {
        reviewId,
        serviceId: updatedReview.serviceId,
      });
      await notificationService.sendPushNotification(service.providerId, {
        title: 'Avis mis à jour',
        body: `Un avis pour votre service "${service.name}" a été mis à jour.`,
        data: { type: 'reviewUpdated', reviewId, serviceId: updatedReview.serviceId },
      });
      logAudit('Avis mis à jour', { reviewId });
      return updatedReview;
    } catch (error) {
      logError('Erreur lors de la mise à jour de l\'avis', { error: error.message, reviewId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour de l\'avis', error.message);
    }
  }

  /**
   * Supprime un avis.
   * @async
   * @param {string} reviewId - ID de l'avis.
   * @returns {Promise<void>}
   */
  async deleteReview(reviewId) {
    try {
      const review = await reviewRepo.getById(reviewId);
      if (review.images && review.images.length > 0) {
        for (const fileUrl of review.images) {
          await storageService.deleteReviewImage(reviewId, fileUrl);
        }
      }
      await reviewRepo.delete(reviewId);
      socketService.emitToRoom(`review:${review.serviceId}`, 'reviewDeleted', { reviewId, serviceId: review.serviceId });
      const service = await serviceRepo.getById(review.serviceId);
      await notificationService.sendPushNotification(service.providerId, {
        title: 'Avis supprimé',
        body: `Un avis pour votre service "${service.name}" a été supprimé.`,
        data: { type: 'reviewDeleted', reviewId, serviceId: review.serviceId },
      });
      logAudit('Avis supprimé', { reviewId });
    } catch (error) {
      logError('Erreur lors de la suppression de l\'avis', { error: error.message, reviewId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de l\'avis', error.message);
    }
  }

  /**
   * Récupère les avis pour un service donné avec pagination.
   * @async
   * @param {string} serviceId - ID du service.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<{ reviews: Review[], total: number, page: number, totalPages: number }>}
   */
  async getReviewsByService(serviceId, page = 1, limit = 10) {
    try {
      await serviceRepo.getById(serviceId);
      const result = await reviewRepo.getByService(serviceId, page, limit);
      logInfo('Avis récupérés pour le service', { serviceId, page, limit, total: result.total });
      return result;
    } catch (error) {
      logError('Erreur lors de la récupération des avis par service', { error: error.message, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des avis par service', error.message);
    }
  }

  /**
   * Récupère les avis d'un utilisateur avec pagination.
   * @async
   * @param {string} userId - ID de l'utilisateur.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<{ reviews: Review[], total: number, page: number, totalPages: number }>}
   */
  async getReviewsByUser(userId, page = 1, limit = 10) {
    try {
      await userRepo.getById(userId);
      const result = await reviewRepo.getByUser(userId, page, limit);
      logInfo('Avis récupérés pour l\'utilisateur', { userId, page, limit, total: result.total });
      return result;
    } catch (error) {
      logError('Erreur lors de la récupération des avis par utilisateur', { error: error.message, userId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des avis par utilisateur', error.message);
    }
  }

  /**
   * Ajoute une image à un avis.
   * @async
   * @param {string} reviewId - ID de l'avis.
   * @param {Buffer} fileBuffer - Buffer de l'image.
   * @param {string} fileName - Nom du fichier.
   * @returns {Promise<Review>} Avis mis à jour.
   */
  async uploadReviewImage(reviewId, fileBuffer, fileName) {
    try {
      const review = await reviewRepo.getById(reviewId);
      const imageUrl = await storageService.uploadReviewImage(reviewId, fileBuffer, fileName);
      const updatedImages = [...(review.images || []), imageUrl];
      const updatedReview = await reviewRepo.update(reviewId, { ...review, images: updatedImages });
      const service = await serviceRepo.getById(updatedReview.serviceId);
      socketService.emitToRoom(`review:${updatedReview.serviceId}`, 'reviewImageAdded', {
        reviewId,
        serviceId: updatedReview.serviceId,
      });
      await notificationService.sendPushNotification(service.providerId, {
        title: 'Nouvelle image ajoutée à un avis',
        body: `Une nouvelle image a été ajoutée à un avis pour votre service "${service.name}".`,
        data: { type: 'reviewImageAdded', reviewId, serviceId: updatedReview.serviceId },
      });
      logAudit('Image ajoutée à l\'avis', { reviewId });
      return updatedReview;
    } catch (error) {
      logError('Erreur lors de l\'ajout de l\'image à l\'avis', { error: error.message, reviewId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'ajout de l\'image à l\'avis', error.message);
    }
  }

  /**
   * Supprime une image d'un avis.
   * @async
   * @param {string} reviewId - ID de l'avis.
   * @param {string} fileUrl - URL de l'image à supprimer.
   * @returns {Promise<void>}
   */
  async deleteReviewImage(reviewId, fileUrl) {
    try {
      const review = await reviewRepo.getById(reviewId);
      await storageService.deleteReviewImage(reviewId, fileUrl);
      const updatedImages = review.images.filter(url => url !== fileUrl);
      await reviewRepo.update(reviewId, { ...review, images: updatedImages });
      const service = await serviceRepo.getById(review.serviceId);
      socketService.emitToRoom(`review:${review.serviceId}`, 'reviewImageDeleted', {
        reviewId,
        serviceId: review.serviceId,
      });
      await notificationService.sendPushNotification(service.providerId, {
        title: 'Image supprimée d\'un avis',
        body: `Une image a été supprimée d\'un avis pour votre service "${service.name}".`,
        data: { type: 'reviewImageDeleted', reviewId, serviceId: review.serviceId },
      });
      logAudit('Image supprimée de l\'avis', { reviewId });
    } catch (error) {
      logError('Erreur lors de la suppression de l\'image de l\'avis', { error: error.message, reviewId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de l\'image de l\'avis', error.message);
    }
  }
}

module.exports = new ReviewService();
