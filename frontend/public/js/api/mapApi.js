/**
 * @file mapApi.js
 * @description Gestion des appels API pour les fonctionnalités de géolocalisation dans L&L Ouest Services.
 * Intègre la validation des données, les guards de sécurité, et la gestion des tokens.
 * @module api/mapApi
 */

import { showNotification, validateInput, getStoredToken,apiFetch, authGuard, roleGuard, handleApiError } from '../modules/utils.js';


/**
 * Valide les données pour le géocodage d’une adresse.
 * @param {Object} data - Données de l’adresse.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validateGeocodeData(data) {
  const schema = { address: { type: 'string', required: true, minLength: 3, maxLength: 255 } };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`Adresse invalide : ${error.details}`);
  return true;
}

/**
 * Valide les données pour le calcul de distance.
 * @param {Object} data - Données des coordonnées.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validateDistanceData(data) {
  const schema = {
    origin: {
      type: 'object',
      required: true,
      properties: {
        lat: { type: 'number', required: true },
        lng: { type: 'number', required: true },
      },
    },
    destination: {
      type: 'object',
      required: true,
      properties: {
        lat: { type: 'number', required: true },
        lng: { type: 'number', required: true },
      },
    },
  };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`Coordonnées invalides : ${error.details}`);
  return true;
}

/**
 * Valide les données pour la mise à jour de la localisation d’un service.
 * @param {Object} data - Données de localisation du service.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validateServiceLocationData(data) {
  const schema = {
    serviceId: { type: 'string', required: true },
    address: { type: 'string', required: true, minLength: 3, maxLength: 255 },
  };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`Données de localisation du service invalides : ${error.details}`);
  return true;
}

/**
 * Valide le rayon de recherche.
 * @param {Object} data - Données du rayon.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validateRadius(data) {
  const schema = { radius: { type: 'number', required: true, min: 1000, max: 50000 } };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`Rayon invalide : ${error.details}`);
  return true;
}

/**
 * Valide l’intervalle de mise à jour de localisation.
 * @param {Object} data - Données de l’intervalle.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validateLocationUpdateInterval(data) {
  const schema = { interval: { type: 'number', required: true, min: 30000, max: 300000 } };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`Intervalle de mise à jour invalide : ${error.details}`);
  return true;
}

const mapApi = {
  /**
   * Géolocalise une adresse.
   * @async
   * @param {string} address - Adresse à géolocaliser.
   * @returns {Promise<Object>} Localisation (lat, lng, formattedAddress, placeId, types).
   */
  async geocodeAddress(address) {
    try {
      authGuard();
      validateGeocodeData({ address });
      const response = await apiFetch('/map/geocode', 'POST', { address });
      return response.data.location;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la géolocalisation de l’adresse');
    }
  },

  /**
   * Calcule la distance entre deux points.
   * @async
   * @param {Object} origin - Coordonnées de l'origine (lat, lng).
   * @param {Object} destination - Coordonnées de la destination (lat, lng).
   * @returns {Promise<Object>} Distance et durée.
   */
  async calculateDistance(origin, destination) {
    try {
      authGuard();
      validateDistanceData({ origin, destination });
      const response = await apiFetch('/map/distance', 'POST', { origin, destination });
      return response.data.distance;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors du calcul de la distance');
    }
  },

  /**
   * Met à jour la localisation de l'utilisateur.
   * @async
   * @param {string} address - Adresse à géolocaliser.
   * @returns {Promise<Object>} Utilisateur mis à jour.
   */
  async updateUserLocation(address) {
    try {
      authGuard();
      validateGeocodeData({ address });
      const response = await apiFetch('/map/user/location', 'PUT', { address });
      showNotification('Localisation mise à jour avec succès.', 'success');
      return response.data.user;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la mise à jour de la localisation');
    }
  },

  /**
   * Met à jour la localisation d'un service.
   * @async
   * @param {string} serviceId - ID du service.
   * @param {string} address - Adresse à géolocaliser.
   * @returns {Promise<Object>} Service mis à jour.
   */
  async updateServiceLocation(serviceId, address) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateServiceLocationData({ serviceId, address });
      const response = await apiFetch('/map/service/location', 'PUT', { serviceId, address });
      showNotification('Localisation du service mise à jour avec succès.', 'success');
      return response.data.service;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la mise à jour de la localisation du service');
    }
  },

  /**
   * Recherche les services à proximité.
   * @async
   * @param {number} radius - Rayon de recherche en mètres.
   * @returns {Promise<Array>} Liste des services à proximité.
   */
  async findNearbyServices(radius = 10000) {
    try {
      authGuard();
      validateRadius({ radius });
      const response = await apiFetch(`/map/nearby?radius=${radius}`, 'GET');
      return response.data.services;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la recherche de services à proximité');
    }
  },

  /**
   * Abonne l'utilisateur aux mises à jour de localisation.
   * @async
   * @param {number} interval - Intervalle de mise à jour en ms.
   * @returns {Promise<void>}
   */
  async subscribeToLocationUpdates(interval = 60000) {
    try {
      authGuard();
      validateLocationUpdateInterval({ interval });
      await apiFetch('/map/subscribe', 'POST', { interval });
      showNotification('Abonnement aux mises à jour de localisation démarré.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de l’abonnement aux mises à jour de localisation');
    }
  },

  /**
   * Désabonne l'utilisateur des mises à jour de localisation.
   * @async
   * @returns {Promise<void>}
   */
  async unsubscribeFromLocationUpdates() {
    try {
      authGuard();
      await apiFetch('/map/subscribe', 'DELETE');
      showNotification('Abonnement aux mises à jour de localisation arrêté.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors du désabonnement des mises à jour de localisation');
    }
  },
};

export default mapApi;
