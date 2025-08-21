/**
 * @file reviewApi.js
 * @description Gestion des appels API pour les avis dans L&L Ouest Services.
 * Intègre la validation des données, les guards de sécurité, et la gestion des tokens.
 * @module api/reviewApi
 */

import { showNotification, validateInput, getStoredToken,apiFetch, authGuard, roleGuard, handleApiError } from '../modules/utils.js';


/**
 * Valide les données pour créer un avis.
 * @param {Object} reviewData - Données de l'avis.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validateCreateReviewData(reviewData) {
  const schema = {
    userId: { type: 'string', required: true },
    serviceId: { type: 'string', required: true },
    rating: { type: 'number', required: true, min: 1, max: 5 },
    comment: { type: 'string', required: true, minLength: 10, maxLength: 500 },
  };
  const { error } = validateInput(reviewData, schema);
  if (error) throw new Error(`Données de l’avis invalides : ${error.details}`);
  return true;
}

/**
 * Valide les données pour mettre à jour un avis.
 * @param {Object} reviewData - Données de l'avis.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validateUpdateReviewData(reviewData) {
  const schema = {
    id: { type: 'string', required: true },
    rating: { type: 'number', required: false, min: 1, max: 5 },
    comment: { type: 'string', required: false, minLength: 10, maxLength: 500 },
  };
  const { error } = validateInput(reviewData, schema);
  if (error) throw new Error(`Données de mise à jour de l’avis invalides : ${error.details}`);
  return true;
}

/**
 * Valide l'ID de l’avis.
 * @param {Object} data - Données contenant l’ID.
 * @returns {boolean}
 * @throws {Error} Si l’ID est invalide.
 */
function validateId(data) {
  const schema = { id: { type: 'string', required: true } };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`ID de l’avis invalide : ${error.details}`);
  return true;
}

/**
 * Valide les paramètres de pagination.
 * @param {Object} data - Données de pagination.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validatePagination(data) {
  const schema = {
    page: { type: 'number', min: 1, default: 1 },
    limit: { type: 'number', min: 1, max: 100, default: 10 },
  };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`Paramètres de pagination invalides : ${error.details}`);
  return true;
}

const reviewApi = {
  /**
   * Crée un nouvel avis.
   * @async
   * @param {Object} reviewData - Données de l’avis (userId, serviceId, rating, comment).
   * @returns {Promise<Object>} Avis créé.
   */
  async createReview(reviewData) {
    try {
      authGuard();
      validateCreateReviewData(reviewData);
      const response = await apiFetch('/reviews', 'POST', reviewData);
      showNotification('Avis créé avec succès.', 'success');
      return response.data.review;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la création de l’avis');
    }
  },

  /**
   * Récupère un avis par son ID.
   * @async
   * @param {string} id - ID de l’avis.
   * @returns {Promise<Object>} Avis trouvé.
   */
  async getReview(id) {
    try {
      authGuard();
      validateId({ id });
      const response = await apiFetch(`/reviews/${id}`, 'GET');
      return response.data.review;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération de l’avis');
    }
  },

  /**
   * Met à jour un avis.
   * @async
   * @param {string} id - ID de l’avis.
   * @param {Object} reviewData - Données à mettre à jour (rating, comment).
   * @returns {Promise<Object>} Avis mis à jour.
   */
  async updateReview(id, reviewData) {
    try {
      authGuard();
      roleGuard(['client', 'admin']);
      validateUpdateReviewData({ id, ...reviewData });
      const response = await apiFetch(`/reviews/${id}`, 'PUT', reviewData);
      showNotification('Avis mis à jour avec succès.', 'success');
      return response.data.review;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la mise à jour de l’avis');
    }
  },

  /**
   * Supprime un avis.
   * @async
   * @param {string} id - ID de l’avis.
   * @returns {Promise<void>}
   */
  async deleteReview(id) {
    try {
      authGuard();
      roleGuard(['client', 'admin']);
      validateId({ id });
      await apiFetch(`/reviews/${id}`, 'DELETE');
      showNotification('Avis supprimé avec succès.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la suppression de l’avis');
    }
  },

  /**
   * Récupère tous les avis pour un service avec pagination.
   * @async
   * @param {string} serviceId - ID du service.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<Object>} Liste des avis.
   */
  async getServiceReviews(serviceId, page = 1, limit = 10) {
    try {
      authGuard();
      validateId({ id: serviceId });
      validatePagination({ page, limit });
      const response = await apiFetch(`/reviews/service/${serviceId}?page=${page}&limit=${limit}`, 'GET');
      return response.data;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération des avis du service');
    }
  },

  /**
   * Récupère tous les avis d’un utilisateur avec pagination.
   * @async
   * @param {string} userId - ID de l’utilisateur.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<Object>} Liste des avis.
   */
  async getUserReviews(userId, page = 1, limit = 10) {
    try {
      authGuard();
      validateId({ id: userId });
      validatePagination({ page, limit });
      const response = await apiFetch(`/reviews/user/${userId}?page=${page}&limit=${limit}`, 'GET');
      return response.data;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération des avis de l’utilisateur');
    }
  },
};

export default reviewApi;
