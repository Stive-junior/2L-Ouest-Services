/**
 * @file serviceController.js
 * @description Contrôleur pour gérer les opérations sur les services dans L&L Ouest Services.
 * Fournit des endpoints pour les opérations CRUD, la recherche par catégorie, par localisation et la gestion des images.
 * @module controllers/serviceController
 */

const  serviceService  = require('../services/serviceService');
const  mapService  = require('../services/mapService');
const { logError, logAudit } = require('../services/loggerService');
const { AppError } = require('../utils/errorUtils');

/**
 * @class ServiceController
 * @description Gère les requêtes HTTP pour les services.
 * 
 */
class ServiceController {
  /**
   * Crée un nouveau service.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.validatedData - Données validées du service.
   * @param {Object} req.user - Utilisateur authentifié.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON avec le service créé.
   * @throws {AppError} Si la création échoue.
   */
  async createService(req, res, next) {
    try {
      const serviceData = { ...req.validatedData, providerId: req.user.id };
      const service = await serviceService.createService(serviceData);
      logAudit('Service créé via contrôleur', { serviceId: service.id, userId: req.user.id });
      res.status(201).json({
        status: 'success',
        data: { service },
      });
    } catch (error) {
      logError('Erreur lors de la création du service', { error: error.message, userId: req.user.id });
      next(error);
    }
  }

  /**
   * Récupère un service par son ID.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.validatedData - Données validées (ID).
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON avec le service.
   * @throws {AppError} Si la récupération échoue.
   */
  async getServiceById(req, res, next) {
    try {
      const { id } = req.validatedData;
      const service = await serviceService.getService(id);
      res.status(200).json({
        status: 'success',
        data: { service },
      });
    } catch (error) {
      logError('Erreur lors de la récupération du service', { error: error.message, serviceId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Met à jour un service.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.validatedData - Données validées du service.
   * @param {Object} req.user - Utilisateur authentifié.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON avec le service mis à jour.
   * @throws {AppError} Si la mise à jour échoue.
   */
  async updateService(req, res, next) {
    try {
      const { id, ...serviceData } = req.validatedData;
      const updatedService = await serviceService.updateService(id, serviceData);
      logAudit('Service mis à jour via contrôleur', { serviceId: id, userId: req.user.id });
      res.status(200).json({
        status: 'success',
        data: { service: updatedService },
      });
    } catch (error) {
      logError('Erreur lors de la mise à jour du service', { error: error.message, serviceId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Supprime un service.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.validatedData - Données validées (ID).
   * @param {Object} req.user - Utilisateur authentifié.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON confirmant la suppression.
   * @throws {AppError} Si la suppression échoue.
   */
  async deleteService(req, res, next) {
    try {
      const { id } = req.validatedData;
      await serviceService.deleteService(id);
      logAudit('Service supprimé via contrôleur', { serviceId: id, userId: req.user.id });
      res.status(200).json({
        status: 'success',
        message: 'Service supprimé avec succès',
      });
    } catch (error) {
      logError('Erreur lors de la suppression du service', { error: error.message, serviceId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Récupère tous les services avec pagination.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.validatedData - Données validées (page, limit).
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON avec la liste des services.
   * @throws {AppError} Si la récupération échoue.
   */
  async getAllServices(req, res, next) {
    try {
      const { page, limit } = req.validatedData;
      const { services, total, page: currentPage, totalPages } = await serviceService.getAllServices(page, limit);
      res.status(200).json({
        status: 'success',
        data: { services, total, page: currentPage, totalPages },
      });
    } catch (error) {
      logError('Erreur lors de la récupération des services', { error: error.message });
      next(error);
    }
  }

  /**
   * Récupère les services par catégorie avec pagination.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.validatedData - Données validées (category, page, limit).
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON avec la liste des services.
   * @throws {AppError} Si la récupération échoue.
   */
  async getServicesByCategory(req, res, next) {
    try {
      const { category, page, limit } = req.validatedData;
      const { services, total, page: currentPage, totalPages } = await serviceService.getServicesByCategory(category, page, limit);
      res.status(200).json({
        status: 'success',
        data: { services, total, page: currentPage, totalPages },
      });
    } catch (error) {
      logError('Erreur lors de la récupération des services par catégorie', { error: error.message, category: req.validatedData.category });
      next(error);
    }
  }

  /**
   * Récupère les services à proximité de l’utilisateur authentifié.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.validatedData - Données validées (radius).
   * @param {Object} req.user - Utilisateur authentifié.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON avec la liste des services à proximité.
   * @throws {AppError} Si la récupération échoue.
   */
  async getNearbyServices(req, res, next) {
    try {
      const { radius } = req.validatedData;
      const services = await mapService.findNearbyServices(req.user.id, radius);
      res.status(200).json({
        status: 'success',
        data: { services },
      });
    } catch (error) {
      logError('Erreur lors de la récupération des services à proximité', { error: error.message, userId: req.user.id });
      next(error);
    }
  }

  /**
   * Met à jour la localisation d’un service.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.validatedData - Données validées (id, address).
   * @param {Object} req.user - Utilisateur authentifié.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON avec le service mis à jour.
   * @throws {AppError} Si la mise à jour échoue.
   */
  async updateServiceLocation(req, res, next) {
    try {
      const { id, address } = req.validatedData;
      const updatedService = await mapService.updateServiceLocation(id, address);
      logAudit('Localisation du service mise à jour via contrôleur', { serviceId: id, userId: req.user.id });
      res.status(200).json({
        status: 'success',
        data: { service: updatedService },
      });
    } catch (error) {
      logError('Erreur lors de la mise à jour de la localisation du service', { error: error.message, serviceId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Ajoute une image à un service.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.validatedData - Données validées (id).
   * @param {Object} req.files - Fichiers uploadés.
   * @param {Object} req.user - Utilisateur authentifié.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON avec le service mis à jour.
   * @throws {AppError} Si l’ajout de l’image échoue.
   */
  async uploadServiceImage(req, res, next) {
    try {
      const { id } = req.validatedData;
      const file = req.files?.file;
      if (!file) throw new AppError(400, 'Aucun fichier fourni');
      const updatedService = await serviceService.uploadServiceImage(id, file.data, file.name);
      logAudit('Image ajoutée au service via contrôleur', { serviceId: id, userId: req.user.id });
      res.status(200).json({
        status: 'success',
        data: { service: updatedService },
      });
    } catch (error) {
      logError('Erreur lors de l’ajout de l’image au service', { error: error.message, serviceId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Supprime une image d’un service.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.validatedData - Données validées (id, fileUrl).
   * @param {Object} req.user - Utilisateur authentifié.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON confirmant la suppression.
   * @throws {AppError} Si la suppression échoue.
   */
  async deleteServiceImage(req, res, next) {
    try {
      const { id, fileUrl } = req.validatedData;
      await serviceService.deleteServiceImage(id, fileUrl);
      logAudit('Image supprimée du service via contrôleur', { serviceId: id, userId: req.user.id });
      res.status(200).json({
        status: 'success',
        message: 'Image supprimée avec succès',
      });
    } catch (error) {
      logError('Erreur lors de la suppression de l’image du service', { error: error.message, serviceId: req.validatedData.id });
      next(error);
    }
  }
}

const controller = new ServiceController();
module.exports = {
  createService: controller.createService.bind(controller),
  getServiceById: controller.getServiceById.bind(controller),
  updateService: controller.updateService.bind(controller),
  deleteService: controller.deleteService.bind(controller),
  getAllServices: controller.getAllServices.bind(controller),
  getServicesByCategory: controller.getServicesByCategory.bind(controller),
  getNearbyServices: controller.getNearbyServices.bind(controller),
  updateServiceLocation: controller.updateServiceLocation.bind(controller),
  uploadServiceImage: controller.uploadServiceImage.bind(controller),
  deleteServiceImage: controller.deleteServiceImage.bind(controller),
};
