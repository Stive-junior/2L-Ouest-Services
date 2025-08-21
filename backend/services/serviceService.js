/**
 * @file serviceService.js
 * @description Service pour gérer les services dans L&L Ouest Services.
 * Intègre avec serviceRepo pour les opérations CRUD, notificationService pour les notifications,
 * et storageService pour la gestion des images.
 * @module services/serviceService
 */

const { serviceRepo, userRepo } = require('../repositories');
const notificationService = require('./notificationService');
const socketService = require('./socketService');
const storageService = require('./storageService');
const { logInfo, logError, logAudit } = require('./loggerService');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const { validate, serviceSchema } = require('../utils/validationUtils');
const { createServiceSchema, updateServiceSchema } = require('../utils/validation/serviceValidation');

/**
 * @class ServiceService
 * @description Gère les opérations sur les services pour L&L Ouest Services, y compris la gestion des images.
 */
class ServiceService {
  /**
   * Crée un nouveau service.
   * @async
   * @param {Object} serviceData - Données du service.
   * @param {string} serviceData.name - Nom du service.
   * @param {string} serviceData.description - Description du service.
   * @param {number} serviceData.price - Prix du service.
   * @param {string} serviceData.category - Catégorie du service.
   * @param {string} serviceData.providerId - ID du fournisseur.
   * @returns {Promise<Object>} Service créé.
   * @throws {AppError} Si la création échoue ou les données sont invalides.
   */
  async createService(serviceData) {
    const { error, value } = validate(serviceData, createServiceSchema);
    if (error) throw new AppError(400, 'Données du service invalides', error.details);

    try {
      await userRepo.getById(value.providerId);
      const service = {
        ...value,
        id: require('../utils/helperUtils').generateUUID(),
        images: [],
        createdAt: new Date().toISOString(),
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
      await userRepo.getById(service.providerId);
      const updatedServiceData = { ...service, ...value };
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
        for (const fileUrl of service.images) {
          await storageService.deleteServiceImage(serviceId, fileUrl);
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
   * Récupère tous les services avec pagination.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<{ services: Object[], total: number, page: number, totalPages: number }>} Liste des services paginée.
   * @throws {AppError} Si la récupération échoue.
   */
  async getAllServices(page = 1, limit = 10) {
    try {
      const result = await serviceRepo.getAll(page, limit);
      logInfo('Liste des services récupérée', { page, limit, total: result.total });
      return result;
    } catch (error) {
      logError('Erreur lors de la récupération des services', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des services', error.message);
    }
  }

  /**
   * Récupère les services par catégorie avec pagination.
   * @async
   * @param {string} category - Catégorie du service.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<{ services: Object[], total: number, page: number, totalPages: number }>} Liste des services paginée.
   * @throws {AppError} Si la récupération échoue.
   */
  async getServicesByCategory(category, page = 1, limit = 10) {
    try {
      const result = await serviceRepo.getByCategory(category, page, limit);
      logInfo('Services récupérés par catégorie', { category, page, limit, total: result.total });
      return result;
    } catch (error) {
      logError('Erreur lors de la récupération des services par catégorie', { error: error.message, category });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des services par catégorie', error.message);
    }
  }

  /**
   * Ajoute une image à un service.
   * @async
   * @param {string} serviceId - ID du service.
   * @param {Buffer} fileBuffer - Buffer de l’image.
   * @param {string} fileName - Nom original du fichier.
   * @returns {Promise<Object>} Service mis à jour avec la nouvelle image.
   * @throws {AppError} Si l’ajout de l’image échoue.
   */
  async uploadServiceImage(serviceId, fileBuffer, fileName) {
    try {
      const service = await serviceRepo.getById(serviceId);
      const imageUrl = await storageService.uploadServiceImage(serviceId, fileBuffer, fileName);
      const updatedImages = [...(service.images || []), imageUrl];
      const updatedServiceData = { ...service, images: updatedImages };
      const { error: validationError } = validate(updatedServiceData, serviceSchema);
      if (validationError) throw new AppError(400, 'Données du service invalides après ajout d’image', validationError.details);

      const updatedService = await serviceRepo.update(serviceId, updatedServiceData);
      await notificationService.sendPushNotification(service.providerId, {
        title: 'Nouvelle image ajoutée',
        body: `Une nouvelle image a été ajoutée à votre service "${service.name}".`,
        data: { type: 'serviceImageAdded', serviceId },
      });
      logAudit('Image ajoutée au service', { serviceId, fileName });
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
      await storageService.deleteServiceImage(serviceId, fileUrl);
      const updatedImages = (service.images || []).filter(url => url !== fileUrl);
      const updatedServiceData = { ...service, images: updatedImages };
      const { error: validationError } = validate(updatedServiceData, serviceSchema);
      if (validationError) throw new AppError(400, 'Données du service invalides après suppression d’image', validationError.details);

      await serviceRepo.update(serviceId, updatedServiceData);
      await notificationService.sendPushNotification(service.providerId, {
        title: 'Image supprimée',
        body: `Une image a été supprimée de votre service "${service.name}".`,
        data: { type: 'serviceImageDeleted', serviceId },
      });
      logAudit('Image supprimée du service', { serviceId, fileUrl });
    } catch (error) {
      logError('Erreur lors de la suppression de l’image du service', { error: error.message, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de l’image du service', error.message);
    }
  }
}

module.exports = new ServiceService();
