/**
 * @file serviceApi.js
 * @description Gestion des appels API pour les services dans L&L Ouest Services.
 * Intègre des guards pour l'authentification, des validations côté client avec UUID,
 * et la gestion automatique du rafraîchissement des tokens.
 * Communique avec les endpoints de serviceRoutes.js pour les opérations CRUD et gestion des images.
 * @module api/serviceApi
 */

import { showNotification, validateInput, getStoredToken, apiFetch, roleGuard, authGuard, handleApiError } from '../modules/utils.js';

/**
 * Valide les données d’un service pour la création.
 * @param {Object} serviceData - Données du service.
 * @returns {boolean} Vrai si les données sont valides.
 * @throws {Error} Si les données sont invalides.
 */
function validateCreateServiceData(serviceData) {
  const schema = {
    name: { type: 'string', required: true, minLength: 3, maxLength: 100 },
    description: { type: 'string', required: true, minLength: 10, maxLength: 1000 },
    price: { type: 'number', required: true, min: 0 },
    area: { type: 'number', required: false, min: 0 },
    duration: { type: 'number', required: false, min: 0 },
    category: { type: 'string', required: true, enum: ['bureaux', 'piscine', 'régulier', 'ponctuel', 'salles de réunion', 'sas d\'entrée', 'réfectoire', 'sanitaires', 'escaliers', 'vitrines'] },
    location: { type: 'object', required: false, properties: {
      address: { type: 'string', minLength: 3, maxLength: 255 },
      coordinates: { type: 'object', properties: {
        lat: { type: 'number', min: -90, max: 90 },
        lng: { type: 'number', min: -180, max: 180 },
      }},
    }},
  };
  const { error } = validateInput(serviceData, schema);
  if (error) {
    showNotification(`Données du service invalides : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
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
    name: { type: 'string', required: false, minLength: 3, maxLength: 100 },
    description: { type: 'string', required: false, minLength: 10, maxLength: 1000 },
    price: { type: 'number', required: false, min: 0 },
    area: { type: 'number', required: false, min: 0 },
    duration: { type: 'number', required: false, min: 0 },
    category: { type: 'string', required: false, enum: ['bureaux', 'piscine', 'régulier', 'ponctuel', 'salles de réunion', 'sas d\'entrée', 'réfectoire', 'sanitaires', 'escaliers', 'vitrines'] },
    availability: { type: 'object', required: false, properties: {
      isAvailable: { type: 'boolean' },
      schedule: { type: 'array', items: {
        type: 'object', properties: {
          day: { type: 'string', enum: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] },
          hours: { type: 'array', items: { type: 'string', pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ } },
        },
      }},
    }},
    location: { type: 'object', required: false, properties: {
      address: { type: 'string', minLength: 3, maxLength: 255 },
      coordinates: { type: 'object', properties: {
        lat: { type: 'number', min: -90, max: 90 },
        lng: { type: 'number', min: -180, max: 180 },
      }},
    }},
  };
  const { error } = validateInput(serviceData, schema);
  if (error) {
    showNotification(`Données de mise à jour invalides : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
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
    showNotification(`ID de service invalide : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('ID de service invalide');
  }
  return true;
}

/**
 * Valide les paramètres de pagination.
 * @param {Object} params - Paramètres de pagination.
 * @returns {boolean} Vrai si les paramètres sont valides.
 * @throws {Error} Si les paramètres sont invalides.
 */
function validatePaginationParams(params) {
  const schema = {
    page: { type: 'number', required: true, min: 1 },
    limit: { type: 'number', required: true, min: 1, max: 100 },
  };
  const { error } = validateInput(params, schema);
  if (error) {
    showNotification(`Paramètres de pagination invalides : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Paramètres de pagination invalides');
  }
  return true;
}

/**
 * Valide les paramètres de recherche par catégorie.
 * @param {Object} params - Paramètres de recherche.
 * @returns {boolean} Vrai si les paramètres sont valides.
 * @throws {Error} Si les paramètres sont invalides.
 */
function validateCategoryParams(params) {
  const schema = {
    category: { type: 'string', required: true, enum: ['bureaux', 'piscine', 'régulier', 'ponctuel', 'salles de réunion', 'sas d\'entrée', 'réfectoire', 'sanitaires', 'escaliers', 'vitrines'] },
    page: { type: 'number', required: true, min: 1 },
    limit: { type: 'number', required: true, min: 1, max: 100 },
  };
  const { error } = validateInput(params, schema);
  if (error) {
    showNotification(`Paramètres de catégorie invalides : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Paramètres de catégorie invalides');
  }
  return true;
}

/**
 * Valide les paramètres de recherche à proximité.
 * @param {Object} params - Paramètres de recherche.
 * @returns {boolean} Vrai si les paramètres sont valides.
 * @throws {Error} Si les paramètres sont invalides.
 */
function validateNearbyParams(params) {
  const schema = {
    lat: { type: 'number', required: true, min: -90, max: 90 },
    lng: { type: 'number', required: true, min: -180, max: 180 },
    radius: { type: 'number', required: true, min: 1000, max: 50000 },
    area: { type: 'number', required: false, min: 0 },
    duration: { type: 'number', required: false, min: 0 },
  };
  const { error } = validateInput(params, schema);
  if (error) {
    showNotification(`Paramètres de recherche à proximité invalides : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Paramètres de recherche à proximité invalides');
  }
  return true;
}

/**
 * Valide les données de localisation.
 * @param {Object} locationData - Données de localisation.
 * @returns {boolean} Vrai si les données sont valides.
 * @throws {Error} Si les données sont invalides.
 */
function validateLocationData(locationData) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    address: { type: 'string', required: true, minLength: 3, maxLength: 255 },
    coordinates: { type: 'object', required: true, properties: {
      lat: { type: 'number', min: -90, max: 90 },
      lng: { type: 'number', min: -180, max: 180 },
    }},
  };
  const { error } = validateInput(locationData, schema);
  if (error) {
    showNotification(`Données de localisation invalides : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Données de localisation invalides');
  }
  return true;
}

/**
 * Valide les données pour l’ajout d’une image.
 * @param {Object} imageData - Données de l’image.
 * @returns {boolean} Vrai si les données sont valides.
 * @throws {Error} Si les données sont invalides.
 */
function validateAddImageData(imageData) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    type: { type: 'string', required: true, enum: ['before', 'after', 'showcase', 'equipment'] },
    description: { type: 'string', required: false, maxLength: 255 },
  };
  const { error } = validateInput(imageData, schema);
  if (error) {
    showNotification(`Données de l’image invalides : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Données de l’image invalides');
  }
  return true;
}

/**
 * Valide les données pour la suppression d’une image.
 * @param {Object} imageData - Données de l’image.
 * @returns {boolean} Vrai si les données sont valides.
 * @throws {Error} Si les données sont invalides.
 */
function validateDeleteImageData(imageData) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    fileUrl: { type: 'string', required: true, pattern: /^https?:\/\/.+/ },
  };
  const { error } = validateInput(imageData, schema);
  if (error) {
    showNotification(`Données de suppression d’image invalides : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Données de suppression d’image invalides');
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
      roleGuard(['admin']);
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
      roleGuard(['admin']);
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
      roleGuard(['admin']);
      validateServiceId(id);
      await apiFetch(`/services/${id}`, 'DELETE', { id }, true);
      showNotification('Service supprimé avec succès.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la suppression du service');
    }
  },

  /**
   * Récupère tous les services avec pagination et filtres.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @param {Object} [filters] - Filtres optionnels (ex: { area, duration }).
   * @returns {Promise<Object>} Liste des services paginée.
   * @throws {Error} En cas d'erreur de récupération.
   */
  async getAllServices(page = 1, limit = 10, filters = {}) {
    try {
      authGuard();
      validatePaginationParams({ page, limit });
      const query = new URLSearchParams({ page, limit });
      if (filters.area) query.append('areaMin', filters.area.min).append('areaMax', filters.area.max);
      if (filters.duration) query.append('durationMin', filters.duration.min).append('durationMax', filters.duration.max);
      const response = await apiFetch(`/services?${query.toString()}`, 'GET');
      return response.data;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération des services');
    }
  },

  /**
   * Récupère les services par catégorie avec pagination et filtres.
   * @async
   * @param {string} category - Catégorie du service.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @param {Object} [filters] - Filtres optionnels (ex: { area, duration }).
   * @returns {Promise<Object>} Liste des services paginée.
   * @throws {Error} En cas d'erreur de récupération.
   */
  async getServicesByCategory(category, page = 1, limit = 10, filters = {}) {
    try {
      authGuard();
      validateCategoryParams({ category, page, limit });
      const query = new URLSearchParams({ page, limit });
      if (filters.area) query.append('areaMin', filters.area.min).append('areaMax', filters.area.max);
      if (filters.duration) query.append('durationMin', filters.duration.min).append('durationMax', filters.duration.max);
      const response = await apiFetch(`/services/category/${category}?${query.toString()}`, 'GET');
      return response.data;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération des services par catégorie');
    }
  },

  /**
   * Récupère les services à proximité.
   * @async
   * @param {number} lat - Latitude.
   * @param {number} lng - Longitude.
   * @param {number} radius - Rayon de recherche en mètres.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @param {Object} [filters] - Filtres optionnels (ex: { area, duration }).
   * @returns {Promise<Object>} Liste des services à proximité.
   * @throws {Error} En cas d'erreur de récupération.
   */
  async getNearbyServices(lat, lng, radius = 10000, page = 1, limit = 10, filters = {}) {
    try {
      authGuard();
      validateNearbyParams({ lat, lng, radius, ...filters });
      const query = new URLSearchParams({ lat, lng, radius, page, limit });
      if (filters.area) query.append('areaMin', filters.area.min).append('areaMax', filters.area.max);
      if (filters.duration) query.append('durationMin', filters.duration.min).append('durationMax', filters.duration.max);
      const response = await apiFetch(`/services/nearby?${query.toString()}`, 'GET');
      return response.data;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération des services à proximité');
    }
  },

  /**
   * Met à jour la localisation d’un service.
   * @async
   * @param {string} id - ID du service.
   * @param {Object} locationData - Données de localisation.
   * @returns {Promise<Object>} Service mis à jour.
   * @throws {Error} En cas d'erreur de mise à jour.
   */
  async updateServiceLocation(id, locationData) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateLocationData({ id, ...locationData });
      const response = await apiFetch(`/services/${id}/location`, 'PATCH', { id, ...locationData }, true);
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
   * @param {string} type - Type d’image (before, after, showcase, equipment).
   * @param {string} [description] - Description de l’image.
   * @returns {Promise<Object>} Service mis à jour.
   * @throws {Error} En cas d’erreur d’upload.
   */
  async uploadServiceImage(id, file, type, description) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateAddImageData({ id, type, description });
      if (!(file instanceof File)) {
        showNotification('Fichier image invalide.', 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
        throw new Error('Fichier image invalide');
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (description) formData.append('description', description);
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
   * @throws {Error} En cas d’erreur de suppression.
   */
  async deleteServiceImage(id, fileUrl) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateDeleteImageData({ id, fileUrl });
      await apiFetch(`/services/${id}/image`, 'DELETE', { id, fileUrl }, true);
      showNotification('Image supprimée avec succès.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la suppression de l’image');
    }
  },
};

export default serviceApi;
