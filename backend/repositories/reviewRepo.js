/**
 * @file reviewRepo.js
 * @description Repository pour gérer les avis dans Firestore pour L&L Ouest Services.
 * Fournit des opérations CRUD pour les avis et gestion des images avec validation.
 * @module repositories/reviewRepo
 */

const { AppError } = require('../utils/errorUtils');
const { validate } = require('../utils/validationUtils');
const { reviewSchema } = require('../utils/validation/reviewValidation');
const { generateUUID, formatDate, paginateResults } = require('../utils/helperUtils');
const { logger, logInfo, logError, logAudit } = require('../services/loggerService');
const admin = require('firebase-admin');

/**
 * @class ReviewRepository
 * @description Gère les opérations CRUD pour les avis dans Firestore.
 */
class ReviewRepository {
  /**
   * @constructor
   * @param {admin.firestore.CollectionReference} collection - Référence à la collection Firestore.
   */
  constructor(collection = admin.firestore().collection('reviews')) {
    this.collection = collection;
  }

  /**
   * Convertit un document Firestore en format API avis.
   * @param {Object} doc - Document Firestore avec ID.
   * @returns {Object} Avis formaté.
   */
  fromFirestore(doc) {
    return {
      id: doc.id,
      userId: doc.data().userId,
      serviceId: doc.data().serviceId,
      rating: doc.data().rating,
      comment: doc.data().comment,
      images: doc.data().images || [],
      createdAt: doc.data().createdAt || null,
      updatedAt: doc.data().updatedAt || null,
    };
  }

  /**
   * Convertit un avis API en format Firestore.
   * @param {Object} review - Avis API.
   * @returns {Object} Données Firestore.
   */
  toFirestore(review) {
    return {
      userId: review.userId,
      serviceId: review.serviceId,
      rating: review.rating,
      comment: review.comment,
      images: review.images || [],
      createdAt: review.createdAt || formatDate(new Date()),
      updatedAt: review.updatedAt || null,
    };
  }

  /**
   * Crée un nouvel avis dans Firestore.
   * @async
   * @param {Object} reviewData - Données de l'avis.
   * @returns {Promise<Object>} Avis créé.
   */
  async create(reviewData) {
    try {
      const { value, error } = validate(reviewData, reviewSchema);
      if (error) {
        logError('Erreur de validation lors de la création de l\'avis', { error: error.details });
        throw new AppError(400, 'Données de l\'avis invalides', error.details);
      }

      const docRef = this.collection.doc(value.id);
      await docRef.set(this.toFirestore(value));
      logInfo('Avis créé', { reviewId: value.id });
      return this.fromFirestore({ id: value.id, data: () => value });
    } catch (error) {
      logError('Erreur lors de la création de l\'avis', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création de l\'avis', error.message);
    }
  }

  /**
   * Récupère un avis par son ID.
   * @async
   * @param {string} id - ID de l'avis.
   * @returns {Promise<Object>} Avis trouvé.
   */
  async getById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        logError('Avis non trouvé', { id });
        throw new AppError(404, 'Avis non trouvé');
      }
      logInfo('Avis récupéré', { id });
      return this.fromFirestore({ id: doc.id, data: () => doc.data() });
    } catch (error) {
      logError('Erreur lors de la récupération de l\'avis', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de l\'avis', error.message);
    }
  }

  /**
   * Met à jour un avis dans Firestore.
   * @async
   * @param {string} id - ID de l'avis.
   * @param {Object} reviewData - Données à mettre à jour.
   * @returns {Promise<Object>} Avis mis à jour.
   */
  async update(id, reviewData) {
    try {
      const { value, error } = validate(reviewData, reviewSchema);
      if (error) {
        logError('Erreur de validation lors de la mise à jour de l\'avis', { error: error.details });
        throw new AppError(400, 'Données de l\'avis invalides', error.details);
      }

      const docRef = this.collection.doc(id);
      await docRef.update(this.toFirestore(value));
      logAudit('Avis mis à jour', { reviewId: id });
      return this.fromFirestore({ id, data: () => value });
    } catch (error) {
      logError('Erreur lors de la mise à jour de l\'avis', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour de l\'avis', error.message);
    }
  }

  /**
   * Supprime un avis de Firestore.
   * @async
   * @param {string} id - ID de l'avis.
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        logError('Avis non trouvé pour suppression', { id });
        throw new AppError(404, 'Avis non trouvé');
      }
      await this.collection.doc(id).delete();
      logAudit('Avis supprimé', { id });
    } catch (error) {
      logError('Erreur lors de la suppression de l\'avis', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de l\'avis', error.message);
    }
  }

  /**
   * Récupère tous les avis avec pagination.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<{ reviews: Object[], total: number, page: number, totalPages: number }>}
   */
  async getAll(page = 1, limit = 10) {
    try {
      const query = this.collection.orderBy('createdAt', 'desc');
      const { results, total, totalPages } = await paginateResults(query, page, limit);
      const reviews = results.map(doc => this.fromFirestore({ id: doc.id, data: () => doc.data() }));
      logInfo('Tous les avis récupérés', { page, limit, total });
      return { reviews, total, page, totalPages };
    } catch (error) {
      logError('Erreur lors de la récupération de tous les avis', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de tous les avis', error.message);
    }
  }

  /**
   * Récupère les avis pour un service donné avec pagination.
   * @async
   * @param {string} serviceId - ID du service.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<{ reviews: Object[], total: number, page: number, totalPages: number }>}
   */
  async getByService(serviceId, page = 1, limit = 10) {
    try {
      const query = this.collection.where('serviceId', '==', serviceId).orderBy('createdAt', 'desc');
      const { results, total, totalPages } = await paginateResults(query, page, limit);
      const reviews = results.map(doc => this.fromFirestore({ id: doc.id, data: () => doc.data() }));
      logInfo('Avis récupérés par service', { serviceId, page, limit, total });
      return { reviews, total, page, totalPages };
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
   * @returns {Promise<{ reviews: Object[], total: number, page: number, totalPages: number }>}
   */
  async getByUser(userId, page = 1, limit = 10) {
    try {
      const query = this.collection.where('userId', '==', userId).orderBy('createdAt', 'desc');
      const { results, total, totalPages } = await paginateResults(query, page, limit);
      const reviews = results.map(doc => this.fromFirestore({ id: doc.id, data: () => doc.data() }));
      logInfo('Avis récupérés par utilisateur', { userId, page, limit, total });
      return { reviews, total, page, totalPages };
    } catch (error) {
      logError('Erreur lors de la récupération des avis par utilisateur', { error: error.message, userId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des avis par utilisateur', error.message);
    }
  }
}

module.exports = ReviewRepository;
