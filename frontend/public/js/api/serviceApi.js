/**
 * @file serviceApi.js
 * @description Gestion des appels API pour les services dans L&L Ouest Services.
 * Intègre des guards pour l'authentification, des validations côté client avec UUID,
 * et la gestion automatique du rafraîchissement des tokens.
 * Communique avec les endpoints de serviceRoutes.js pour les opérations CRUD et gestion des images.
 * Mise à jour pour intégrer le nouveau formatErrorMessage avec contexte.
 * @module api/serviceApi
 * @version 1.1.0
 * @author L&L Ouest Services Team
 * @lastUpdated 2025-09-25
 * @license MIT
 * @dependencies showNotification, validateInput, getStoredToken, apiFetch, roleGuard, authGuard, handleApiError, checkNetwork
 * @changelog
 * - v1.1.0: Ajout du paramètre context dans tous les appels apiFetch pour une gestion d'erreur contextualisée avec formatErrorMessage.
 * - v1.0.0: Version initiale avec validation des données et gestion des services.
 */

import { showNotification, validateInput, getStoredToken, apiFetch, roleGuard, authGuard, handleApiError, checkNetwork } from '../modules/utils.js';

/**
 * Valide les données d’un service pour la création.
 * @param {Object} serviceData - Données du service.
 * @param {string} serviceData.name - Nom du service (3-100 caractères).
 * @param {string} serviceData.description - Description du service (10-1000 caractères).
 * @param {number} serviceData.price - Prix du service (minimum 0).
 * @param {number} [serviceData.area] - Superficie en m² (optionnel, minimum 0).
 * @param {number} [serviceData.duration] - Durée en minutes (optionnel, minimum 0).
 * @param {string} serviceData.category - Catégorie du service.
 * @param {Object} [serviceData.location] - Localisation du service (optionnel).
 * @returns {boolean} - True si les données sont valides.
 * @throws {Error} - Si les données sont invalides.
 */
function validateCreateServiceData(serviceData) {
  const schema = {
    name: { type: 'string', required: true, minLength: 3, maxLength: 100 },
    description: { type: 'string', required: true, minLength: 10, maxLength: 1000 },
    price: { type: 'number', required: true, min: 0 },
    area: { type: 'number', required: false, min: 0 },
    duration: { type: 'number', required: false, min: 0 },
    category: { type: 'string', required: true, enum: ['bureaux', 'piscine', 'régulier', 'ponctuel', 'salles de réunion', 'sas d\'entrée', 'réfectoire', 'sanitaires', 'escaliers', 'vitrines'] },
    location: {
      type: 'object',
      required: false,
      properties: {
        address: { type: 'string', minLength: 3, maxLength: 255 },
        coordinates: {
          type: 'object',
          properties: {
            lat: { type: 'number', min: -90, max: 90 },
            lng: { type: 'number', min: -180, max: 180 },
          },
        },
      },
    },
  };
  const { error } = validateInput(serviceData, schema);
  if (error) {
    showNotification(`Données du service invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Données du service invalides');
  }
  return true;
}

/**
 * Valide les données d’un service pour la mise à jour.
 * @param {Object} serviceData - Données du service.
 * @param {string} serviceData.id - ID du service (UUID).
 * @param {string} [serviceData.name] - Nom du service (3-100 caractères, optionnel).
 * @param {string} [serviceData.description] - Description du service (10-1000 caractères, optionnel).
 * @param {number} [serviceData.price] - Prix du service (minimum 0, optionnel).
 * @param {number} [serviceData.area] - Superficie en m² (optionnel, minimum 0).
 * @param {number} [serviceData.duration] - Durée en minutes (optionnel, minimum 0).
 * @param {string} [serviceData.category] - Catégorie du service (optionnel).
 * @param {Object} [serviceData.availability] - Disponibilité du service (optionnel).
 * @param {Object} [serviceData.location] - Localisation du service (optionnel).
 * @returns {boolean} - True si les données sont valides.
 * @throws {Error} - Si les données sont invalides.
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
    availability: {
      type: 'object',
      required: false,
      properties: {
        isAvailable: { type: 'boolean' },
        schedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'string', enum: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] },
              hours: { type: 'array', items: { type: 'string', pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ } },
            },
          },
        },
      },
    },
    location: {
      type: 'object',
      required: false,
      properties: {
        address: { type: 'string', minLength: 3, maxLength: 255 },
        coordinates: {
          type: 'object',
          properties: {
            lat: { type: 'number', min: -90, max: 90 },
            lng: { type: 'number', min: -180, max: 180 },
          },
        },
      },
    },
  };
  const { error } = validateInput(serviceData, schema);
  if (error) {
    showNotification(`Données de mise à jour invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Données de mise à jour invalides');
  }
  return true;
}

/**
 * Valide un ID de service.
 * @param {string} id - ID du service (UUID).
 * @returns {boolean} - True si l'ID est valide.
 * @throws {Error} - Si l'ID est invalide.
 */
function validateServiceId(id) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
  };
  const { error } = validateInput({ id }, schema);
  if (error) {
    showNotification(`ID de service invalide : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('ID de service invalide');
  }
  return true;
}

/**
 * Valide les paramètres de pagination.
 * @param {Object} params - Paramètres de pagination.
 * @param {number} params.page - Numéro de page (minimum 1).
 * @param {number} params.limit - Limite par page (1 à 100).
 * @returns {boolean} - True si les paramètres sont valides.
 * @throws {Error} - Si les paramètres sont invalides.
 */
function validatePaginationParams(params) {
  const schema = {
    page: { type: 'number', required: true, min: 1 },
    limit: { type: 'number', required: true, min: 1, max: 100 },
  };
  const { error } = validateInput(params, schema);
  if (error) {
    showNotification(`Paramètres de pagination invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Paramètres de pagination invalides');
  }
  return true;
}

/**
 * Valide les paramètres de recherche par catégorie.
 * @param {Object} params - Paramètres de recherche.
 * @param {string} params.category - Catégorie du service.
 * @param {number} params.page - Numéro de page (minimum 1).
 * @param {number} params.limit - Limite par page (1 à 100).
 * @returns {boolean} - True si les paramètres sont valides.
 * @throws {Error} - Si les paramètres sont invalides.
 */
function validateCategoryParams(params) {
  const schema = {
    category: { type: 'string', required: true, enum: ['bureaux', 'piscine', 'régulier', 'ponctuel', 'salles de réunion', 'sas d\'entrée', 'réfectoire', 'sanitaires', 'escaliers', 'vitrines'] },
    page: { type: 'number', required: true, min: 1 },
    limit: { type: 'number', required: true, min: 1, max: 100 },
  };
  const { error } = validateInput(params, schema);
  if (error) {
   showNotification(`Paramètres de catégorie invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Paramètres de catégorie invalides');
  }
  return true;
}

/**
 * Valide les paramètres de recherche à proximité.
 * @param {Object} params - Paramètres de recherche.
 * @param {number} params.lat - Latitude (-90 à 90).
 * @param {number} params.lng - Longitude (-180 à 180).
 * @param {number} params.radius - Rayon de recherche en mètres (1000 à 50000).
 * @param {number} [params.area] - Superficie en m² (optionnel, minimum 0).
 * @param {number} [params.duration] - Durée en minutes (optionnel, minimum 0).
 * @returns {boolean} - True si les paramètres sont valides.
 * @throws {Error} - Si les paramètres sont invalides.
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
    showNotification(`Paramètres de recherche à proximité invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Paramètres de recherche à proximité invalides');
  }
  return true;
}

/**
 * Valide les données de localisation.
 * @param {Object} locationData - Données de localisation.
 * @param {string} locationData.id - ID du service (UUID).
 * @param {string} locationData.address - Adresse (3-255 caractères).
 * @param {Object} locationData.coordinates - Coordonnées (latitude et longitude).
 * @returns {boolean} - True si les données sont valides.
 * @throws {Error} - Si les données sont invalides.
 */
function validateLocationData(locationData) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    address: { type: 'string', required: true, minLength: 3, maxLength: 255 },
    coordinates: {
      type: 'object',
      required: true,
      properties: {
        lat: { type: 'number', min: -90, max: 90 },
        lng: { type: 'number', min: -180, max: 180 },
      },
    },
  };
  const { error } = validateInput(locationData, schema);
  if (error) {
    showNotification(`Données de localisation invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Données de localisation invalides');
  }
  return true;
}

/**
 * Valide les données pour l’ajout d’une image.
 * @param {Object} imageData - Données de l’image.
 * @param {string} imageData.id - ID du service (UUID).
 * @param {string} imageData.type - Type d’image (before, after, showcase, equipment).
 * @param {string} [imageData.description] - Description de l’image (optionnel, max 255 caractères).
 * @returns {boolean} - True si les données sont valides.
 * @throws {Error} - Si les données sont invalides.
 */
function validateAddImageData(imageData) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    type: { type: 'string', required: true, enum: ['before', 'after', 'showcase', 'equipment'] },
    description: { type: 'string', required: false, maxLength: 255 },
  };
  const { error } = validateInput(imageData, schema);
  if (error) {
    showNotification(`Données de l’image invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Données de l’image invalides');
  }
  return true;
}

/**
 * Valide les données pour la suppression d’une image.
 * @param {Object} imageData - Données de l’image.
 * @param {string} imageData.id - ID du service (UUID).
 * @param {string} imageData.fileUrl - URL de l’image à supprimer.
 * @returns {boolean} - True si les données sont valides.
 * @throws {Error} - Si les données sont invalides.
 */
function validateDeleteImageData(imageData) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    fileUrl: { type: 'string', required: true, pattern: /^https?:\/\/.+/ },
  };
  const { error } = validateInput(imageData, schema);
  if (error) {
    showNotification(`Données de suppression d’image invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Données de suppression d’image invalides');
  }
  return true;
}

/**
 * API pour gérer les services dans L&L Ouest Services.
 * @namespace serviceApi
 */
const serviceApi = {
  /**
   * Crée un nouveau service.
   * @async
   * @param {Object} serviceData - Données du service.
   * @returns {Promise<Object>} - Service créé.
   * @throws {Error} - En cas d'erreur de création.
   */
  async createService(serviceData) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateCreateServiceData(serviceData);
      const response = await apiFetch('/services', 'POST', serviceData, true, { context: 'Création Service' });
      showNotification('Service créé avec succès.', 'success');
      return response.data.service;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la création du service', {
        context: 'Création Service',
        sourceContext: 'create-service',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Récupère un service par son ID.
   * @async
   * @param {string} id - ID du service (UUID).
   * @returns {Promise<Object>} - Service trouvé.
   * @throws {Error} - En cas d'erreur de récupération.
   */
  async getServiceById(id) {
    try {
      authGuard();
      validateServiceId(id);
      const response = await apiFetch(`/services/${id}`, 'GET', null, true, { context: 'Récupération Service par ID' });
      return response.data.service;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la récupération du service', {
        context: 'Récupération Service par ID',
        sourceContext: 'get-service-by-id',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Met à jour un service.
   * @async
   * @param {string} id - ID du service (UUID).
   * @param {Object} serviceData - Données à mettre à jour.
   * @returns {Promise<Object>} - Service mis à jour.
   * @throws {Error} - En cas d'erreur de mise à jour.
   */
  async updateService(id, serviceData) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateUpdateServiceData({ id, ...serviceData });
      const response = await apiFetch(`/services/${id}`, 'PUT', { id, ...serviceData }, true, { context: 'Mise à Jour Service' });
      showNotification('Service mis à jour avec succès.', 'success');
      return response.data.service;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la mise à jour du service', {
        context: 'Mise à Jour Service',
        sourceContext: 'update-service',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Supprime un service.
   * @async
   * @param {string} id - ID du service (UUID).
   * @returns {Promise<void>}
   * @throws {Error} - En cas d'erreur de suppression.
   */
  async deleteService(id) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateServiceId(id);
      await apiFetch(`/services/${id}`, 'DELETE', { id }, true, { context: 'Suppression Service' });
      showNotification('Service supprimé avec succès.', 'success');
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la suppression du service', {
        context: 'Suppression Service',
        sourceContext: 'delete-service',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Récupère tous les services avec pagination et filtres.
   * @async
   * @param {number} [page=1] - Numéro de page.
   * @param {number} [limit=10] - Limite par page.
   * @param {Object} [filters={}] - Filtres optionnels (ex: { area, duration }).
   * @returns {Promise<Object>} - Liste des services paginée.
   * @throws {Error} - En cas d'erreur de récupération.
   */
  async getAllServices(page = 1, limit = 10, filters = {}) {
    try {
      validatePaginationParams({ page, limit });
      const query = new URLSearchParams({ page, limit });
      if (filters.area) query.append('areaMin', filters.area.min).append('areaMax', filters.area.max);
      if (filters.duration) query.append('durationMin', filters.duration.min).append('durationMax', filters.duration.max);

      const cacheKey = `services_${page}_${limit}_${JSON.stringify(filters)}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          console.log('📦 Utilisation des services en cache');
          return data;
        }
      }

      const response = await apiFetch(`/services?${query.toString()}`, 'GET', null, false, { context: 'Récupération Tous les Services' });
      localStorage.setItem(cacheKey, JSON.stringify({ data: response.data, timestamp: Date.now() }));
      return response.data;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la récupération des services', {
        context: 'Récupération Tous les Services',
        sourceContext: 'get-all-services',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Récupère les services par catégorie.
   * @async
   * @param {string} category - Catégorie du service.
   * @param {number} [page=1] - Numéro de page.
   * @param {number} [limit=10] - Limite par page.
   * @returns {Promise<Object>} - Liste des services paginée.
   * @throws {Error} - En cas d'erreur de récupération.
   */
  async getServicesByCategory(category, page = 1, limit = 10) {
    try {
      validateCategoryParams({ category, page, limit });
      const response = await apiFetch(`/services/category/${category}?page=${page}&limit=${limit}`, 'GET', null, false, { context: 'Récupération Services par Catégorie' });
      return response.data;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la récupération des services par catégorie', {
        context: 'Récupération Services par Catégorie',
        sourceContext: 'get-services-by-category',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Récupère les services à proximité.
   * @async
   * @param {number} lat - Latitude.
   * @param {number} lng - Longitude.
   * @param {number} radius - Rayon de recherche en mètres.
   * @param {Object} [filters={}] - Filtres optionnels (ex: { area, duration }).
   * @returns {Promise<Object>} - Liste des services à proximité.
   * @throws {Error} - En cas d'erreur de récupération.
   */
  async getServicesNearby(lat, lng, radius, filters = {}) {
    try {
      validateNearbyParams({ lat, lng, radius, ...filters });
      const query = new URLSearchParams({ lat, lng, radius });
      if (filters.area) query.append('area', filters.area);
      if (filters.duration) query.append('duration', filters.duration);
      const response = await apiFetch(`/services/nearby?${query.toString()}`, 'GET', null, false, { context: 'Récupération Services à Proximité' });
      return response.data;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la récupération des services à proximité', {
        context: 'Récupération Services à Proximité',
        sourceContext: 'get-services-nearby',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Met à jour la localisation d’un service.
   * @async
   * @param {string} id - ID du service (UUID).
   * @param {Object} locationData - Données de localisation.
   * @returns {Promise<Object>} - Service mis à jour.
   * @throws {Error} - En cas d'erreur de mise à jour.
   */
  async updateServiceLocation(id, locationData) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateLocationData({ id, ...locationData });
      const response = await apiFetch(`/services/${id}/location`, 'PUT', locationData, true, { context: 'Mise à Jour Localisation Service' });
      showNotification('Localisation du service mise à jour avec succès.', 'success');
      return response.data.service;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la mise à jour de la localisation du service', {
        context: 'Mise à Jour Localisation Service',
        sourceContext: 'update-service-location',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Ajoute une image à un service.
   * @async
   * @param {string} id - ID du service (UUID).
   * @param {Object} imageData - Données de l’image.
   * @param {File} imageData.file - Fichier image.
   * @param {string} imageData.type - Type d’image (before, after, showcase, equipment).
   * @param {string} [imageData.description] - Description de l’image (optionnel).
   * @returns {Promise<Object>} - Service mis à jour.
   * @throws {Error} - En cas d'erreur d’ajout.
   */
  async addServiceImage(id, imageData) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateAddImageData({ id, ...imageData });
      const formData = new FormData();
      formData.append('file', imageData.file);
      formData.append('type', imageData.type);
      if (imageData.description) formData.append('description', imageData.description);

      const response = await apiFetch(`/services/${id}/images`, 'POST', formData, true, { context: 'Ajout Image Service', headers: { 'Content-Type': 'multipart/form-data' } });
      showNotification('Image ajoutée avec succès.', 'success');
      return response.data.service;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de l’ajout de l’image', {
        context: 'Ajout Image Service',
        sourceContext: 'add-service-image',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Supprime une image d’un service.
   * @async
   * @param {string} id - ID du service (UUID).
   * @param {string} fileUrl - URL de l’image à supprimer.
   * @returns {Promise<Object>} - Service mis à jour.
   * @throws {Error} - En cas d'erreur de suppression.
   */
  async deleteServiceImage(id, fileUrl) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateDeleteImageData({ id, fileUrl });
      const response = await apiFetch(`/services/${id}/images`, 'DELETE', { fileUrl }, true, { context: 'Suppression Image Service' });
      showNotification('Image supprimée avec succès.', 'success');
      return response.data.service;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la suppression de l’image', {
        context: 'Suppression Image Service',
        sourceContext: 'delete-service-image',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },
};

export default serviceApi;
