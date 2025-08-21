/**
 * @file mapController.js
 * @description Contrôleur pour gérer les fonctionnalités de géolocalisation dans L&L Ouest Services.
 * Fournit des endpoints pour géocoder des adresses, calculer des distances, et gérer les localisations.
 * @module controllers/mapController
 */

const  mapService  = require('../services/mapService');
const {  logError } = require('../services/loggerService');

/**
 * @class MapController
 * @description Gère les requêtes HTTP pour les fonctionnalités de géolocalisation.
 */
class MapController {
  /**
   * Géolocalise une adresse.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec la localisation.
   */
  async geocodeAddress(req, res, next) {
    try {
      const { address } = req.validatedData;
      const location = await mapService.geocodeAddress(address);
      res.status(200).json({
        status: 'success',
        data: { location },
      });
    } catch (error) {
      logError('Erreur lors de la géolocalisation de l\'adresse', { error: error.message, address: req.validatedData.address });
      next(error);
    }
  }

  /**
   * Calcule la distance entre deux points.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec la distance.
   */
  async calculateDistance(req, res, next) {
    try {
      const { origin, destination } = req.validatedData;
      const distance = await mapService.calculateDistance(origin, destination);
      res.status(200).json({
        status: 'success',
        data: { distance },
      });
    } catch (error) {
      logError('Erreur lors du calcul de la distance', { error: error.message });
      next(error);
    }
  }

  /**
   * Met à jour la localisation d'un utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec l'utilisateur mis à jour.
   */
  async updateUserLocation(req, res, next) {
    try {
      const { address } = req.validatedData;
      const user = await mapService.updateUserLocation(req.user.id, address);
      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      logError('Erreur lors de la mise à jour de la localisation de l\'utilisateur', { error: error.message, userId: req.user.id });
      next(error);
    }
  }

  /**
   * Met à jour la localisation d'un service.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec le service mis à jour.
   */
  async updateServiceLocation(req, res, next) {
    try {
      const { serviceId, address } = req.validatedData;
      const service = await mapService.updateServiceLocation(serviceId, address);
      res.status(200).json({
        status: 'success',
        data: { service },
      });
    } catch (error) {
      logError('Erreur lors de la mise à jour de la localisation du service', { error: error.message, serviceId: req.validatedData.serviceId });
      next(error);
    }
  }

  /**
   * Recherche les services à proximité d'un utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec les services à proximité.
   */
  async findNearbyServices(req, res, next) {
    try {
      const { radius } = req.validatedData;
      const services = await mapService.findNearbyServices(req.user.id, radius);
      res.status(200).json({
        status: 'success',
        data: { services },
      });
    } catch (error) {
      logError('Erreur lors de la recherche de services à proximité', { error: error.message, userId: req.user.id });
      next(error);
    }
  }

  /**
   * Abonne un utilisateur aux mises à jour de localisation.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant l'abonnement.
   */
  async subscribeToLocationUpdates(req, res, next) {
    try {
      const { interval } = req.validatedData;
      await mapService.subscribeToLocationUpdates(req.user.id, interval);
      res.status(200).json({
        status: 'success',
        message: 'Abonnement aux mises à jour de localisation démarré',
      });
    } catch (error) {
      logError('Erreur lors de l\'abonnement aux mises à jour de localisation', { error: error.message, userId: req.user.id });
      next(error);
    }
  }

  /**
   * Désabonne un utilisateur des mises à jour de localisation.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant le désabonnement.
   */
  async unsubscribeFromLocationUpdates(req, res, next) {
    try {
      await mapService.unsubscribeFromLocationUpdates(req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Abonnement aux mises à jour de localisation arrêté',
      });
    } catch (error) {
      logError('Erreur lors du désabonnement des mises à jour de localisation', { error: error.message, userId: req.user.id });
      next(error);
    }
  }
}

const controller = new MapController();
module.exports = {
  geocodeAddress: controller.geocodeAddress.bind(controller),
  calculateDistance: controller.calculateDistance.bind(controller),
  updateUserLocation: controller.updateUserLocation.bind(controller),
  updateServiceLocation: controller.updateServiceLocation.bind(controller),
  findNearbyServices: controller.findNearbyServices.bind(controller),
  subscribeToLocationUpdates: controller.subscribeToLocationUpdates.bind(controller),
  unsubscribeFromLocationUpdates: controller.unsubscribeFromLocationUpdates.bind(controller),
};
