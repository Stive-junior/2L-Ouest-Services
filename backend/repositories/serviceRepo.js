/**
 * @file serviceRepo.js
 * @description Repository pour gérer les services dans Firestore pour L&L Ouest Services.
 * Fournit des opérations CRUD et gestion des images.
 * @module repositories/serviceRepo
 */

const admin = require('firebase-admin');
const { AppError } = require('../utils/errorUtils');
const { validate, serviceSchema } = require('../utils/validationUtils');
const { paginateResults } = require('../utils/helperUtils');
const { logInfo, logError, logAudit } = require('../services/loggerService');

/**
 * @class ServiceRepository
 * @description Gère les opérations CRUD pour les services dans Firestore.
 */
class ServiceRepository {
  /**
   * @constructor
   * @param {admin.firestore.CollectionReference} collection - Référence à la collection Firestore.
   */
  constructor(collection = admin.firestore().collection('services')) {
    this.collection = collection;
  }

  /**
   * Convertit un document Firestore en format API service.
   * @param {Object} doc - Document Firestore avec ID.
   * @returns {Object} Service formaté.
   */
  fromFirestore(doc) {
    return {
      id: doc.id,
      name: doc.name,
      description: doc.description,
      price: doc.price,
      category: doc.category,
      providerId: doc.providerId,
      images: doc.images || [],
      availability: doc.availability || { isAvailable: true, schedule: [] },
      createdAt: doc.createdAt || null,
    };
  }

  /**
   * Convertit un service API en format Firestore.
   * @param {Object} service - Service API.
   * @returns {Object} Données Firestore.
   */
  toFirestore(service) {
    return {
      name: service.name,
      description: service.description,
      price: service.price,
      category: service.category,
      providerId: service.providerId,
      images: service.images || [],
      availability: service.availability || { isAvailable: true, schedule: [] },
      createdAt: service.createdAt || new Date().toISOString(),
    };
  }

  /**
   * Crée un nouveau service dans Firestore.
   * @async
   * @param {Object} serviceData - Données du service.
   * @returns {Promise<Object>} Service créé.
   * @throws {AppError} Si la création échoue.
   */
  async create(serviceData) {
    try {
      const { error, value } = validate(serviceData, serviceSchema);
      if (error) {
        logError('Erreur de validation lors de la création du service', { error: error.message });
        throw error;
      }

      const docRef = this.collection.doc(value.id);
      await docRef.set(this.toFirestore(value));
      logAudit('Service créé', { serviceId: value.id, name: value.name });
      return this.fromFirestore({ id: value.id, ...value });
    } catch (error) {
      logError('Erreur lors de la création du service', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création du service', error.message);
    }
  }

  /**
   * Récupère un service par son ID.
   * @async
   * @param {string} id - ID du service.
   * @returns {Promise<Object>} Service trouvé.
   * @throws {AppError} Si la récupération échoue.
   */
  async getById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        logError('Service non trouvé', { id });
        throw new AppError(404, 'Service non trouvé');
      }
      const service = this.fromFirestore({ id: doc.id, ...doc.data() });
      logInfo('Service récupéré', { id });
      return service;
    } catch (error) {
      logError('Erreur lors de la récupération du service', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération du service', error.message);
    }
  }

  /**
   * Met à jour un service dans Firestore.
   * @async
   * @param {string} id - ID du service.
   * @param {Object} serviceData - Données à mettre à jour.
   * @returns {Promise<Object>} Service mis à jour.
   * @throws {AppError} Si la mise à jour échoue.
   */
  async update(id, serviceData) {
    try {
      const { error, value } = validate({ id, ...serviceData }, serviceSchema);
      if (error) {
        logError('Erreur de validation lors de la mise à jour du service', { error: error.message });
        throw error;
      }

      const docRef = this.collection.doc(id);
      await docRef.update(this.toFirestore(value));
      logAudit('Service mis à jour', { serviceId: id, name: value.name });
      return this.fromFirestore({ id, ...value });
    } catch (error) {
      logError('Erreur lors de la mise à jour du service', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour du service', error.message);
    }
  }

  /**
   * Supprime un service de Firestore.
   * @async
   * @param {string} id - ID du service.
   * @returns {Promise<void>}
   * @throws {AppError} Si la suppression échoue.
   */
  async delete(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        logError('Service non trouvé pour suppression', { id });
        throw new AppError(404, 'Service non trouvé');
      }
      await this.collection.doc(id).delete();
      logAudit('Service supprimé', { id });
    } catch (error) {
      logError('Erreur lors de la suppression du service', { error: error.message, id });
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
  async getAll(page = 1, limit = 10) {
    try {
      const query = this.collection.orderBy('createdAt', 'desc');
      const { results, total, totalPages } = await paginateResults(query, page, limit);
      const services = results.map(doc => this.fromFirestore(doc));
      logInfo('Liste des services récupérée', { page, limit, total });
      return { services, total, page, totalPages };
    } catch (error) {
      logError('Erreur lors de la récupération des services', { error: error.message });
      throw new AppError(500, 'Erreur serveur lors de la récupération des services', error.message);
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
  async getByCategory(category, page = 1, limit = 10) {
    try {
      const query = this.collection.where('category', '==', category).orderBy('createdAt', 'desc');
      const { results, total, totalPages } = await paginateResults(query, page, limit);
      const services = results.map(doc => this.fromFirestore(doc));
      logInfo('Services récupérés par catégorie', { category, page, limit, total });
      return { services, total, page, totalPages };
    } catch (error) {
      logError('Erreur lors de la récupération des services par catégorie', { error: error.message, category });
      throw new AppError(500, 'Erreur serveur lors de la récupération des services par catégorie', error.message);
    }
  }
}

module.exports = ServiceRepository;
