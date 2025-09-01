/**
 * @file serviceService.js
 * @description Service pour gérer les services de nettoyage dans L&L Ouest Services.
 * Intègre avec serviceRepo pour les opérations CRUD, notificationService pour les notifications,
 * et storageService pour la gestion des images avec types spécifiques.
 * @module services/serviceService
 */

const { serviceRepo } = require('../repositories');
const notificationService = require('./notificationService');
const socketService = require('./socketService');
const storageService = require('./storageService');
const { logInfo, logError, logAudit } = require('./loggerService');
const { AppError } = require('../utils/errorUtils');
const { validate, serviceSchema, createServiceSchema, updateServiceSchema, addImageSchema } = require('../utils/validation/serviceValidation');
const { generateUUID } = require('../utils/helperUtils');

/**
 * @class ServiceService
 * @description Gère les opérations sur les services de nettoyage, y compris la gestion des images.
 */
class ServiceService {
  /**
   * Crée un nouveau service.
   * @async
   * @param {Object} serviceData - Données du service.
   * @param {string} serviceData.name - Nom du service.
   * @param {string} serviceData.description - Description du service.
   * @param {number} serviceData.price - Prix du service.
   * @param {number} [serviceData.area] - Superficie en m².
   * @param {number} [serviceData.duration] - Durée estimée en heures.
   * @param {string} serviceData.category - Catégorie du service.
   * @param {Object} [serviceData.location] - Localisation du service.
   * @returns {Promise<Object>} Service créé.
   * @throws {AppError} Si la création échoue ou les données sont invalides.
   */
  async createService(serviceData) {
    const { error, value } = validate(serviceData, createServiceSchema);
    if (error) throw new AppError(400, 'Données du service invalides', error.details);

    try {
      const service = {
        ...value,
        id: generateUUID(),
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const { error: validationError } = validate(service, serviceSchema);
      if (validationError) throw new AppError(400, 'Données du service invalides pour Firestore', validationError.details);

      const createdService = await serviceRepo.create(service);
      await notificationService.notifyNewService(createdService.id);
      socketService.broadcast('newService', { serviceId: createdService.id, name: createdService.name });
      logAudit('Service créé', { serviceId: createdService.id, name: createdService.name });
      return createdService;
    } catch (error) {
      logError('Erreur lors de la création du service', { error: error.message, serviceData });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création du service', error.message);
    }
  }

  /**
   * Récupère un service par son ID.
   * @async
   * @param {string} serviceId - ID du service.
   * @returns {Promise<Object>} Service trouvé.
   * @throws {AppError} Si la récupération échoue.
   */
  async getService(serviceId) {
    try {
      const service = await serviceRepo.getById(serviceId);
      logInfo('Service récupéré', { serviceId });
      return service;
    } catch (error) {
      logError('Erreur lors de la récupération du service', { error: error.message, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération du service', error.message);
    }
  }

  /**
   * Met à jour un service.
   * @async
   * @param {string} serviceId - ID du service.
   * @param {Object} serviceData - Données à mettre à jour.
   * @returns {Promise<Object>} Service mis à jour.
   * @throws {AppError} Si la mise à jour échoue.
   */
  async updateService(serviceId, serviceData) {
    const { error, value } = validate({ id: serviceId, ...serviceData }, updateServiceSchema);
    if (error) throw new AppError(400, 'Données de mise à jour invalides', error.details);

    try {
      const service = await serviceRepo.getById(serviceId);
      const updatedServiceData = { ...service, ...value, updatedAt: new Date().toISOString() };
      const { error: validationError } = validate(updatedServiceData, serviceSchema);
      if (validationError) throw new AppError(400, 'Données du service invalides pour Firestore', validationError.details);

      const updatedService = await serviceRepo.update(serviceId, updatedServiceData);
      await notificationService.notifyServiceUpdate(serviceId);
      socketService.broadcast('serviceUpdated', { serviceId, name: updatedService.name });
      logAudit('Service mis à jour', { serviceId });
      return updatedService;
    } catch (error) {
      logError('Erreur lors de la mise à jour du service', { error: error.message, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour du service', error.message);
    }
  }

  /**
   * Supprime un service.
   * @async
   * @param {string} serviceId - ID du service.
   * @returns {Promise<void>}
   * @throws {AppError} Si la suppression échoue.
   */
  async deleteService(serviceId) {
    try {
      const service = await serviceRepo.getById(serviceId);
      if (service.images && service.images.length > 0) {
        for (const image of service.images) {
          await storageService.deleteServiceImage(serviceId, image.url);
        }
      }
      await serviceRepo.delete(serviceId);
      socketService.broadcast('serviceDeleted', { serviceId });
      logAudit('Service supprimé', { serviceId });
    } catch (error) {
      logError('Erreur lors de la suppression du service', { error: error.message, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression du service', error.message);
    }
  }

  /**
   * Récupère tous les services avec pagination et filtres.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @param {Object} [filters] - Filtres optionnels (ex: { area, duration }).
   * @returns {Promise<{ services: Object[], total: number, page: number, totalPages: number }>} Liste des services paginée.
   * @throws {AppError} Si la récupération échoue.
   */
  async getAllServices(page = 1, limit = 10, filters = {}) {
    try {
      const result = await serviceRepo.getAll(page, limit, filters);
      logInfo('Liste des services récupérée', { page, limit, total: result.total });
      return result;
    } catch (error) {
      logError('Erreur lors de la récupération des services', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des services', error.message);
    }
  }

  /**
   * Récupère les services par catégorie avec pagination et filtres.
   * @async
   * @param {string} category - Catégorie du service.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @param {Object} [filters] - Filtres optionnels (ex: { area, duration }).
   * @returns {Promise<{ services: Object[], total: number, page: number, totalPages: number }>} Liste des services paginée.
   * @throws {AppError} Si la récupération échoue.
   */
  async getServicesByCategory(category, page = 1, limit = 10, filters = {}) {
    try {
      const result = await serviceRepo.getByCategory(category, page, limit, filters);
      logInfo('Services récupérés par catégorie', { category, page, limit, total: result.total });
      return result;
    } catch (error) {
      logError('Erreur lors de la récupération des services par catégorie', { error: error.message, category });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des services par catégorie', error.message);
    }
  }

  /**
   * Récupère les services à proximité avec pagination et filtres.
   * @async
   * @param {number} lat - Latitude.
   * @param {number} lng - Longitude.
   * @param {number} radius - Rayon en mètres.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @param {Object} [filters] - Filtres optionnels (ex: { area, duration }).
   * @returns {Promise<{ services: Object[], total: number, page: number, totalPages: number }>} Liste des services paginée.
   * @throws {AppError} Si la récupération échoue.
   */
  async getNearbyServices(lat, lng, radius, page = 1, limit = 10, filters = {}) {
    try {
      const result = await serviceRepo.getNearby(lat, lng, radius, page, limit, filters);
      logInfo('Services à proximité récupérés', { lat, lng, radius, page, limit, total: result.total });
      return result;
    } catch (error) {
      logError('Erreur lors de la récupération des services à proximité', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des services à proximité', error.message);
    }
  }

  /**
   * Met à jour la localisation d’un service.
   * @async
   * @param {string} serviceId - ID du service.
   * @param {Object} locationData - Données de localisation.
   * @returns {Promise<Object>} Service mis à jour.
   * @throws {AppError} Si la mise à jour échoue.
   */
  async updateServiceLocation(serviceId, locationData) {
    try {
      const service = await serviceRepo.getById(serviceId);
      const updatedServiceData = { ...service, location: locationData, updatedAt: new Date().toISOString() };
      const { error: validationError } = validate(updatedServiceData, serviceSchema);
      if (validationError) throw new AppError(400, 'Données de localisation invalides', validationError.details);

      const updatedService = await serviceRepo.update(serviceId, updatedServiceData);
      await notificationService.notifyServiceUpdate(serviceId);
      socketService.broadcast('serviceUpdated', { serviceId, name: updatedService.name });
      logAudit('Localisation du service mise à jour', { serviceId });
      return updatedService;
    } catch (error) {
      logError('Erreur lors de la mise à jour de la localisation du service', { error: error.message, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour de la localisation', error.message);
    }
  }

  /**
   * Ajoute une image à un service.
   * @async
   * @param {string} serviceId - ID du service.
   * @param {Buffer} fileBuffer - Buffer de l’image.
   * @param {string} fileName - Nom original du fichier.
   * @param {string} type - Type d’image (before, after, showcase, equipment).
   * @param {string} [description] - Description de l’image.
   * @returns {Promise<Object>} Service mis à jour avec la nouvelle image.
   * @throws {AppError} Si l’ajout de l’image échoue.
   */
  async uploadServiceImage(serviceId, fileBuffer, fileName, type, description) {
    const { error, value } = validate({ id: serviceId, type, description }, addImageSchema);
    if (error) throw new AppError(400, 'Données de l’image invalides', error.details);

    try {
      const service = await serviceRepo.getById(serviceId);
      const imageUrl = await storageService.uploadServiceImage(serviceId, fileBuffer, fileName);
      const newImage = { url: imageUrl, type: value.type, description: value.description, createdAt: new Date().toISOString() };
      const updatedImages = [...(service.images || []), newImage];
      const updatedServiceData = { ...service, images: updatedImages, updatedAt: new Date().toISOString() };
      const { error: validationError } = validate(updatedServiceData, serviceSchema);
      if (validationError) throw new AppError(400, 'Données du service invalides après ajout d’image', validationError.details);

      const updatedService = await serviceRepo.update(serviceId, updatedServiceData);
      await notificationService.sendPushNotification(serviceId, {
        title: 'Nouvelle image ajoutée',
        body: `Une nouvelle image a été ajoutée à votre service "${service.name}".`,
        data: { type: 'serviceImageAdded', serviceId },
      });
      socketService.broadcast('serviceUpdated', { serviceId, images: updatedImages });
      logAudit('Image ajoutée au service', { serviceId, fileName, imageType: type });
      return updatedService;
    } catch (error) {
      logError('Erreur lors de l’ajout de l’image au service', { error: error.message, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l’ajout de l’image au service', error.message);
    }
  }

  /**
   * Supprime une image d’un service.
   * @async
   * @param {string} serviceId - ID du service.
   * @param {string} fileUrl - URL de l’image à supprimer.
   * @returns {Promise<void>}
   * @throws {AppError} Si la suppression échoue.
   */
  async deleteServiceImage(serviceId, fileUrl) {
    try {
      const service = await serviceRepo.getById(serviceId);
      const image = service.images.find(img => img.url === fileUrl);
      if (!image) throw new AppError(404, 'Image non trouvée dans le service');

      await storageService.deleteServiceImage(serviceId, fileUrl);
      const updatedImages = service.images.filter(img => img.url !== fileUrl);
      const updatedServiceData = { ...service, images: updatedImages, updatedAt: new Date().toISOString() };
      const { error: validationError } = validate(updatedServiceData, serviceSchema);
      if (validationError) throw new AppError(400, 'Données du service invalides après suppression d’image', validationError.details);

      await serviceRepo.update(serviceId, updatedServiceData);
      await notificationService.sendPushNotification(serviceId, {
        title: 'Image supprimée',
        body: `Une image a été supprimée de votre service "${service.name}".`,
        data: { type: 'serviceImageDeleted', serviceId },
      });
      socketService.broadcast('serviceUpdated', { serviceId, images: updatedImages });
      logAudit('Image supprimée du service', { serviceId, fileUrl });
    } catch (error) {
      logError('Erreur lors de la suppression de l’image du service', { error: error.message, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de l’image du service', error.message);
    }
  }
}

module.exports = new ServiceService();
