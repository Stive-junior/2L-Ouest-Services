/**
 * @file reviewController.js
 * @description Contrôleur pour gérer les avis dans L&L Ouest Services.
 * Fournit des endpoints pour créer, récupérer, mettre à jour, supprimer, lister les avis et gérer les images.
 * @module controllers/reviewController
 */

const { reviewService } = require('../services/reviewService');
const { logError } = require('../services/loggerService');
const { AppError } = require('../utils/errorUtils');

/**
 * @class ReviewController
 * @description Gère les requêtes HTTP pour les avis.
 */
class ReviewController {
  /**
   * Crée un nouvel avis.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec l'avis créé.
   */
  async createReview(req, res, next) {
    try {
      const reviewData = { ...req.validatedData, userId: req.user.id };
      const review = await reviewService.createReview(reviewData);
      res.status(201).json({
        status: 'success',
        data: { review },
      });
    } catch (error) {
      logError('Erreur lors de la création de l\'avis', { error: error.message, userId: req.user.id });
      next(error);
    }
  }

  /**
   * Récupère un avis par son ID.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec l'avis.
   */
  async getReview(req, res, next) {
    try {
      const { id } = req.validatedData;
      const review = await reviewService.getReview(id);
      res.status(200).json({
        status: 'success',
        data: { review },
      });
    } catch (error) {
      logError('Erreur lors de la récupération de l\'avis ', { error: error.message, reviewId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Met à jour un avis.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec l'avis mis à jour.
   */
  async updateReview(req, res, next) {
    try {
      const { id, ...reviewData } = req.validatedData;
      const review = await reviewService.getReview(id);
      if (review.userId !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'Seul l\'auteur ou un admin peut modifier l\'avis');
      }
      const updatedReview = await reviewService.updateReview(id, reviewData);
      res.status(200).json({
        status: 'success',
        data: { review: updatedReview },
      });
    } catch (error) {
      logError('Erreur lors de la mise à jour de l\'avis', { error: error.message, reviewId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Supprime un avis.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant la suppression.
   */
  async deleteReview(req, res, next) {
    try {
      const { id } = req.validatedData;
      const review = await reviewService.getReview(id);
      if (review.userId !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'Seul l\'auteur ou un admin peut supprimer l\'avis');
      }
      await reviewService.deleteReview(id);
      res.status(200).json({
        status: 'success',
        message: 'Avis supprimé avec succès',
      });
    } catch (error) {
      logError('Erreur lors de la suppression de l\'avis', { error: error.message, reviewId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Récupère les avis pour un service donné avec pagination.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec la liste des avis.
   */
  async getReviewsByService(req, res, next) {
    try {
      const { serviceId, page, limit } = req.validatedData;
      const { reviews, total, totalPages } = await reviewService.getReviewsByService(serviceId, page, limit);
      res.status(200).json({
        status: 'success',
        data: { reviews, total, page, totalPages },
      });
    } catch (error) {
      logError('Erreur lors de la récupération des avis par service', { error: error.message, serviceId: req.validatedData.serviceId });
      next(error);
    }
  }

  /**
   * Récupère les avis de l'utilisateur authentifié avec pagination.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec la liste des avis.
   */
  async getUserReviews(req, res, next) {
    try {
      const { page, limit } = req.validatedData;
      const { reviews, total, totalPages } = await reviewService.getReviewsByUser(req.user.id, page, limit);
      res.status(200).json({
        status: 'success',
        data: { reviews, total, page, totalPages },
      });
    } catch (error) {
      logError('Erreur lors de la récupération des avis de l\'utilisateur', { error: error.message, userId: req.user.id });
      next(error);
    }
  }

  /**
   * Ajoute une image à un avis.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec l'avis mis à jour.
   */
  async uploadReviewImage(req, res, next) {
    try {
      const { id } = req.validatedData;
      const file = req.files?.file;
      if (!file) throw new AppError(400, 'Aucun fichier fourni');
      const review = await reviewService.getReview(id);
      if (review.userId !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'Seul l\'auteur ou un admin peut ajouter une image à l\'avis');
      }
      const updatedReview = await reviewService.uploadReviewImage(id, file.data, file.name);
      res.status(200).json({
        status: 'success',
        data: { review: updatedReview },
      });
    } catch (error) {
      logError('Erreur lors de l\'ajout de l\'image à l\'avis', { error: error.message, reviewId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Supprime une image d'un avis.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant la suppression.
   */
  async deleteReviewImage(req, res, next) {
    try {
      const { id, fileUrl } = req.validatedData;
      const review = await reviewService.getReview(id);
      if (review.userId !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'Seul l\'auteur ou un admin peut supprimer une image de l\'avis');
      }
      await reviewService.deleteReviewImage(id, fileUrl);
      res.status(200).json({
        status: 'success',
        message: 'Image supprimée avec succès',
      });
    } catch (error) {
      logError('Erreur lors de la suppression de l\'image de l\'avis', { error: error.message, reviewId: req.validatedData.id });
      next(error);
    }
  }
}

const controller = new ReviewController();
module.exports = {
  createReview: controller.createReview.bind(controller),
  getReview: controller.getReview.bind(controller),
  updateReview: controller.updateReview.bind(controller),
  deleteReview: controller.deleteReview.bind(controller),
  getReviewsByService: controller.getReviewsByService.bind(controller),
  getUserReviews: controller.getUserReviews.bind(controller),
  uploadReviewImage: controller.uploadReviewImage.bind(controller),
  deleteReviewImage: controller.deleteReviewImage.bind(controller),
};
