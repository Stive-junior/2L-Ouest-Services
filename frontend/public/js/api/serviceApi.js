/**
 * @file serviceApi.js
 * @description Gestion des appels API pour les services dans L&L Ouest Services.
 * Intègre des guards pour l'authentification, des validations côté client avec UUID,
 * et la gestion automatique du rafraîchissement des tokens.
 * Communique avec les endpoints de serviceRoutes.js pour les opérations CRUD et gestion des images.
 * @module api/serviceApi
 */

import { showNotification, validateInput, getStoredToken,apiFetch, roleGuard, authGuard, handleApiError } from '../modules/utils.js';

/**
 * Valide les données d’un service pour la création.
 * @param {Object} serviceData - Données du service.
 * @returns {boolean} Vrai si les données sont valides.
 * @throws {Error} Si les données sont invalides.
 */
function validateCreateServiceData(serviceData) {
  const schema = {
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    description: { type: 'string', required: true, minLength: 10, maxLength: 500 },
    price: { type: 'number', required: true, min: 0 },
    category: { type: 'string', required: true, minLength: 2, maxLength: 50 },
  };
  const { error } = validateInput(serviceData, schema);
  if (error) {
    showNotification(`Données du service invalides : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error('Données du service invalides');
  }
  return true;
}

/**
 * Valide les données d’un service pour la mise à jour.
 * @param {Object} serviceData - Données du service.
 * @returns {boolean} Vrai si les données sont valides.
 * @throws {Error} Si les données sont invalides.
 */
function validateUpdateServiceData(serviceData) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    name: { type: 'string', required: false, minLength: 2, maxLength: 100 },
    description: { type: 'string', required: false, minLength: 10, maxLength: 500 },
    price: { type: 'number', required: false, min: 0 },
    category: { type: 'string', required: false, minLength: 2, maxLength: 50 },
    availability: { type: 'object', required: false },
  };
  const { error } = validateInput(serviceData, schema);
  if (error) {
    showNotification(`Données de mise à jour invalides : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error('Données de mise à jour invalides');
  }
  return true;
}

/**
 * Valide un ID de service.
 * @param {string} id - ID du service.
 * @returns {boolean} Vrai si l'ID est valide.
 * @throws {Error} Si l'ID est invalide.
 */
function validateServiceId(id) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
  };
  const { error } = validateInput({ id }, schema);
  if (error) {
    showNotification(`ID de service invalide : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error('ID de service invalide');
  }
  return true;
}

const serviceApi = {
  /**
   * Crée un nouveau service.
   * @async
   * @param {Object} serviceData - Données du service.
   * @returns {Promise<Object>} Service créé.
   * @throws {Error} En cas d'erreur de création.
   */
  async createService(serviceData) {
    try {
      authGuard();
      roleGuard(['provider', 'admin']);
      validateCreateServiceData(serviceData);
      const response = await apiFetch('/services', 'POST', serviceData, true);
      showNotification('Service créé avec succès.', 'success');
      return response.data.service;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la création du service');
    }
  },

  /**
   * Récupère un service par son ID.
   * @async
   * @param {string} id - ID du service.
   * @returns {Promise<Object>} Service trouvé.
   * @throws {Error} En cas d'erreur de récupération.
   */
  async getServiceById(id) {
    try {
      authGuard();
      validateServiceId(id);
      const response = await apiFetch(`/services/${id}`, 'GET');
      return response.data.service;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération du service');
    }
  },

  /**
   * Met à jour un service.
   * @async
   * @param {string} id - ID du service.
   * @param {Object} serviceData - Données à mettre à jour.
   * @returns {Promise<Object>} Service mis à jour.
   * @throws {Error} En cas d'erreur de mise à jour.
   */
  async updateService(id, serviceData) {
    try {
      authGuard();
      roleGuard(['provider', 'admin']);
      validateUpdateServiceData({ id, ...serviceData });
      const response = await apiFetch(`/services/${id}`, 'PUT', { id, ...serviceData }, true);
      showNotification('Service mis à jour avec succès.', 'success');
      return response.data.service;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la mise à jour du service');
    }
  },

  /**
   * Supprime un service.
   * @async
   * @param {string} id - ID du service.
   * @returns {Promise<void>}
   * @throws {Error} En cas d'erreur de suppression.
   */
  async deleteService(id) {
    try {
      authGuard();
      roleGuard(['provider', 'admin']);
      validateServiceId(id);
      await apiFetch(`/services/${id}`, 'DELETE', { id }, true);
      showNotification('Service supprimé avec succès.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la suppression du service');
    }
  },

  /**
   * Récupère tous les services avec pagination.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<Object>} Liste des services paginée.
   * @throws {Error} En cas d'erreur de récupération.
   */
  async getAllServices(page = 1, limit = 10) {
    try {
      authGuard();
      const schema = {
        page: { type: 'number', required: true, min: 1 },
        limit: { type: 'number', required: true, min: 1, max: 100 },
      };
      validateInput({ page, limit }, schema);
      const response = await apiFetch(`/services?page=${page}&limit=${limit}`, 'GET');
      return response.data;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération des services');
    }
  },

  /**
   * Récupère les services par catégorie avec pagination.
   * @async
   * @param {string} category - Catégorie du service.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<Object>} Liste des services paginée.
   * @throws {Error} En cas d'erreur de récupération.
   */
  async getServicesByCategory(category, page = 1, limit = 10) {
    try {
      authGuard();
      const schema = {
        category: { type: 'string', required: true, minLength: 2, maxLength: 50 },
        page: { type: 'number', required: true, min: 1 },
        limit: { type: 'number', required: true, min: 1, max: 100 },
      };
      validateInput({ category, page, limit }, schema);
      const response = await apiFetch(`/services/category/${category}?page=${page}&limit=${limit}`, 'GET');
      return response.data;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération des services par catégorie');
    }
  },

  /**
   * Récupère les services à proximité.
   * @async
   * @param {number} radius - Rayon de recherche en mètres.
   * @returns {Promise<Object>} Liste des services à proximité.
   * @throws {Error} En cas d'erreur de récupération.
   */
  async getNearbyServices(radius = 10000) {
    try {
      authGuard();
      const schema = { radius: { type: 'number', required: true, min: 1000, max: 50000 } };
      validateInput({ radius }, schema);
      const response = await apiFetch(`/services/nearby?radius=${radius}`, 'GET');
      return response.data.services;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération des services à proximité');
    }
  },

  /**
   * Met à jour la localisation d’un service.
   * @async
   * @param {string} id - ID du service.
   * @param {string} address - Adresse à géolocaliser.
   * @returns {Promise<Object>} Service mis à jour.
   * @throws {Error} En cas d'erreur de mise à jour.
   */
  async updateServiceLocation(id, address) {
    try {
      authGuard();
      roleGuard(['provider', 'admin']);
      const schema = {
        id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
        address: { type: 'string', required: true, minLength: 3, maxLength: 255 },
      };
      validateInput({ id, address }, schema);
      const response = await apiFetch(`/services/${id}/location`, 'PATCH', { id, address }, true);
      showNotification('Localisation mise à jour avec succès.', 'success');
      return response.data.service;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la mise à jour de la localisation');
    }
  },

  /**
   * Ajoute une image à un service.
   * @async
   * @param {string} id - ID du service.
   * @param {File} file - Fichier image.
   * @returns {Promise<Object>} Service mis à jour.
   * @throws {Error} En cas d'erreur d’upload.
   */
  async uploadServiceImage(id, file) {
    try {
      authGuard();
      roleGuard(['provider', 'admin']);
      validateServiceId(id);
      if (!(file instanceof File)) {
        showNotification('Fichier image invalide.', 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
        throw new Error('Fichier image invalide');
      }
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiFetch(`/services/${id}/image`, 'POST', formData, true);
      showNotification('Image ajoutée avec succès.', 'success');
      return response.data.service;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de l’ajout de l’image');
    }
  },

  /**
   * Supprime une image d’un service.
   * @async
   * @param {string} id - ID du service.
   * @param {string} fileUrl - URL de l’image à supprimer.
   * @returns {Promise<void>}
   * @throws {Error} En cas d'erreur de suppression.
   */
  async deleteServiceImage(id, fileUrl) {
    try {
      authGuard();
      roleGuard(['provider', 'admin']);
      const schema = {
        id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
        fileUrl: { type: 'string', required: true, pattern: /^https?:\/\/.+/ },
      };
      validateInput({ id, fileUrl }, schema);
      await apiFetch(`/services/${id}/image`, 'DELETE', { id, fileUrl }, true);
      showNotification('Image supprimée avec succès.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la suppression de l’image');
    }
  },
};

export default serviceApi;
