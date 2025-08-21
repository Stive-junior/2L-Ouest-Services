/**
 * @file mapService.js
 * @description Service pour gérer les fonctionnalités de localisation avec Google Maps API.
 * Intègre avec userRepo et serviceRepo pour géolocaliser les utilisateurs et services avec suivi en temps réel.
 * @module services/mapService
 */

const { Client } = require('@googlemaps/google-maps-services-js');
const config = require('../config/config');
const { userRepo, serviceRepo } = require('../repositories');
const { socketService } = require('./socketService');
const { logger, logInfo, logError } = require('./loggerService');
const { AppError } = require('../utils/errorUtils');

/**
 * @typedef {Object} Location
 * @property {number} lat - Latitude.
 * @property {number} lng - Longitude.
 * @property {string} formattedAddress - Adresse formatée.
 * @property {string} placeId - ID du lieu Google Maps.
 * @property {string[]} types - Types de lieu.
 */

/**
 * @typedef {Object} Distance
 * @property {string} text - Distance en texte (ex. "5 km").
 * @property {number} value - Distance en kilomètres.
 * @property {string} duration - Durée en texte (ex. "10 min").
 * @property {number} durationValue - Durée en minutes.
 */

/**
 * @class MapService
 * @description Gère les fonctionnalités de localisation pour L&L Ouest Services.
 */
class MapService {
  constructor() {
    this.client = new Client({});
    this.locationSubscriptions = new Map();
  }

  /**
   * Géolocalise une adresse avec Google Maps API.
   * @param {string} address - Adresse à géolocaliser.
   * @returns {Promise<Location>} Objet contenant latitude, longitude, adresse formatée, ID de lieu et types.
   * @throws {AppError} Si la géolocalisation échoue.
   */
  async geocodeAddress(address) {
    try {
      const response = await this.client.geocode({
        params: {
          address,
          key: config.googleMaps.apiKey,
        },
      });

      const result = response.data.results[0];
      if (!result) {
        throw new AppError(404, 'Adresse non géolocalisée');
      }

      const location = {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        types: result.types,
      };

      logInfo('Adresse géolocalisée', { address, ...location });
      return location;
    } catch (error) {
      logError('Erreur lors de la géolocalisation de l\'adresse', { error: error.message, address });
      throw new AppError(500, 'Erreur serveur lors de la géolocalisation de l\'adresse', error.message);
    }
  }

  /**
   * Calcule la distance et la durée entre deux points avec Google Maps Distance Matrix.
   * @param {Location} origin - Coordonnées de l'origine.
   * @param {Location} destination - Coordonnées de la destination.
   * @returns {Promise<Distance>} Objet contenant la distance (km) et la durée (minutes).
   * @throws {AppError} Si le calcul de la distance échoue.
   */
  async calculateDistance(origin, destination) {
    try {
      const response = await this.client.distancematrix({
        params: {
          origins: [{ lat: origin.lat, lng: origin.lng }],
          destinations: [{ lat: destination.lat, lng: destination.lng }],
          key: config.googleMaps.apiKey,
          mode: 'driving',
          units: 'metric',
        },
      });

      const element = response.data.rows[0]?.elements[0];
      if (!element || element.status !== 'OK') {
        throw new AppError(404, 'Impossible de calculer la distance');
      }

      const distance = {
        text: element.distance.text,
        value: element.distance.value / 1000,
        duration: element.duration.text,
        durationValue: element.duration.value / 60,
      };

      logInfo('Distance calculée', { origin, destination, distance });
      return distance;
    } catch (error) {
      logError('Erreur lors du calcul de la distance', { error: error.message, origin, destination });
      throw new AppError(500, 'Erreur serveur lors du calcul de la distance', error.message);
    }
  }

  /**
   * Met à jour la localisation d'un utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @param {string} address - Adresse à géolocaliser.
   * @returns {Promise<User>} Utilisateur mis à jour avec la nouvelle localisation.
   * @throws {AppError} Si la mise à jour de la localisation échoue.
   */
  async updateUserLocation(userId, address) {
    try {
      const user = await userRepo.getById(userId);
      const location = await this.geocodeAddress(address);
      const updatedUser = await userRepo.update(userId, { ...user, location });
      socketService.emitToUser(userId, 'locationUpdated', { userId, location });
      logInfo('Localisation de l\'utilisateur mise à jour', { userId, location });
      return updatedUser;
    } catch (error) {
      logError('Erreur lors de la mise à jour de la localisation de l\'utilisateur', { error: error.message, userId });
      throw new AppError(500, 'Erreur serveur lors de la mise à jour de la localisation de l\'utilisateur', error.message);
    }
  }

  /**
   * Met à jour la localisation d'un service.
   * @param {string} serviceId - ID du service.
   * @param {string} address - Adresse à géolocaliser.
   * @returns {Promise<Service>} Service mis à jour avec la nouvelle localisation.
   * @throws {AppError} Si la mise à jour de la localisation échoue.
   */
  async updateServiceLocation(serviceId, address) {
    try {
      const service = await serviceRepo.getById(serviceId);
      const location = await this.geocodeAddress(address);
      const updatedService = await serviceRepo.update(serviceId, { ...service, location });
      socketService.broadcast('serviceLocationUpdated', { serviceId, location });
      logInfo('Localisation du service mise à jour', { serviceId, location });
      return updatedService;
    } catch (error) {
      logError('Erreur lors de la mise à jour de la localisation du service', { error: error.message, serviceId });
      throw new AppError(500, 'Erreur serveur lors de la mise à jour de la localisation du service', error.message);
    }
  }

  /**
   * Recherche les services à proximité d'un utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @param {number} radius - Rayon de recherche en mètres.
   * @returns {Promise<Array<import('../models/serviceModel').Service & { distance: Distance }>>} Liste des services à proximité avec leurs distances.
   * @throws {AppError} Si la recherche échoue ou si l'utilisateur n'a pas de localisation.
   */
  async findNearbyServices(userId, radius = 10000) {
    try {
      const user = await userRepo.getById(userId);
      if (!user.location) {
        throw new AppError(400, 'L\'utilisateur n\'a pas de localisation définie');
      }

      const services = await serviceRepo.getAll(1, 100);
      const nearbyServices = [];
      for (const service of services.services) {
        if (!service.location) continue;
        const distance = await this.calculateDistance(user.location, service.location);
        if (distance.value <= radius / 1000) {
          nearbyServices.push({ ...service, distance });
        }
      }

      socketService.emitToUser(userId, 'nearbyServices', { services: nearbyServices });
      logInfo('Services à proximité trouvés', { userId, count: nearbyServices.length });
      return nearbyServices;
    } catch (error) {
      logError('Erreur lors de la recherche de services à proximité', { error: error.message, userId });
      throw new AppError(500, 'Erreur serveur lors de la recherche de services à proximité', error.message);
    }
  }

  /**
   * Abonne un utilisateur aux mises à jour de localisation en temps réel.
   * @param {string} userId - ID de l'utilisateur.
   * @param {number} interval - Intervalle de mise à jour en ms.
   * @returns {Promise<void>}
   * @throws {AppError} Si l'abonnement échoue.
   */
  async subscribeToLocationUpdates(userId, interval = 60000) {
    try {
      if (this.locationSubscriptions.has(userId)) {
        logInfo('Abonnement de localisation déjà existant', { userId });
        return;
      }

      const updateLocation = async () => {
        try {
          const user = await userRepo.getById(userId);
          if (!user.location) return;

          socketService.emitToUser(userId, 'locationUpdate', { userId, location: user.location });
          logInfo('Mise à jour de localisation envoyée', { userId, location: user.location });
        } catch (error) {
          logError('Erreur lors de la mise à jour de localisation', { error: error.message, userId });
        }
      };

      const intervalId = setInterval(updateLocation, interval);
      this.locationSubscriptions.set(userId, intervalId);
      logInfo('Abonnement à la localisation démarré', { userId, interval });
    } catch (error) {
      logError('Erreur lors de l\'abonnement à la localisation', { error: error.message, userId });
      throw new AppError(500, 'Erreur serveur lors de l\'abonnement à la localisation', error.message);
    }
  }

  /**
   * Désabonne un utilisateur des mises à jour de localisation.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<void>}
   * @throws {AppError} Si le désabonnement échoue.
   */
  async unsubscribeFromLocationUpdates(userId) {
    try {
      const intervalId = this.locationSubscriptions.get(userId);
      if (!intervalId) {
        logInfo('Aucun abonnement de localisation trouvé', { userId });
        return;
      }

      clearInterval(intervalId);
      this.locationSubscriptions.delete(userId);
      socketService.emitToUser(userId, 'locationSubscriptionEnded', { userId });
      logInfo('Abonnement à la localisation arrêté', { userId });
    } catch (error) {
      logError('Erreur lors de l\'arrêt de l\'abonnement à la localisation', { error: error.message, userId });
      throw new AppError(500, 'Erreur serveur lors de l\'arrêt de l\'abonnement à la localisation', error.message);
    }
  }
}

module.exports = new MapService();
