/**
 * @file serviceRepo.js
 * @description Repository pour gérer les services de nettoyage dans Firestore pour L&L Ouest Services.
 * Fournit des opérations CRUD et gestion des images avec une structure enrichie.
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
      area: doc.area,
      duration: doc.duration,
      category: doc.category,
      images: doc.images || [],
      availability: doc.availability || { isAvailable: true, schedule: [] },
      location: doc.location || {},
      createdAt: doc.createdAt || null,
      updatedAt: doc.updatedAt || null,
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
      area: service.area || null,
      duration: service.duration || null,
      category: service.category,
      images: service.images || [],
      availability: service.availability || { isAvailable: true, schedule: [] },
      location: service.location || {},
      createdAt: service.createdAt || new Date().toISOString(),
      updatedAt: service.updatedAt || new Date().toISOString(),
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
   * Récupère tous les services avec pagination et filtres optionnels.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @param {Object} [filters] - Filtres optionnels (ex: { area, duration }).
   * @returns {Promise<{ services: Object[], total: number, page: number, totalPages: number }>} Liste des services paginée.
   * @throws {AppError} Si la récupération échoue.
   */
  async getAll(page = 1, limit = 10, filters = {}) {
    try {
      let query = this.collection.orderBy('createdAt', 'desc');
      if (filters.area) {
        query = query.where('area', '>=', filters.area.min).where('area', '<=', filters.area.max);
      }
      if (filters.duration) {
        query = query.where('duration', '>=', filters.duration.min).where('duration', '<=', filters.duration.max);
      }
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
   * Récupère les services par catégorie avec pagination et filtres optionnels.
   * @async
   * @param {string} category - Catégorie du service.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @param {Object} [filters] - Filtres optionnels (ex: { area, duration }).
   * @returns {Promise<{ services: Object[], total: number, page: number, totalPages: number }>} Liste des services paginée.
   * @throws {AppError} Si la récupération échoue.
   */
  async getByCategory(category, page = 1, limit = 10, filters = {}) {
    try {
      let query = this.collection.where('category', '==', category).orderBy('createdAt', 'desc');
      if (filters.area) {
        query = query.where('area', '>=', filters.area.min).where('area', '<=', filters.area.max);
      }
      if (filters.duration) {
        query = query.where('duration', '>=', filters.duration.min).where('duration', '<=', filters.duration.max);
      }
      const { results, total, totalPages } = await paginateResults(query, page, limit);
      const services = results.map(doc => this.fromFirestore(doc));
      logInfo('Services récupérés par catégorie', { category, page, limit, total });
      return { services, total, page, totalPages };
    } catch (error) {
      logError('Erreur lors de la récupération des services par catégorie', { error: error.message, category });
      throw new AppError(500, 'Erreur serveur lors de la récupération des services par catégorie', error.message);
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
  async getNearby(lat, lng, radius, page = 1, limit = 10, filters = {}) {
    try {
      const querySnapshot = await this.collection.get();
      const services = [];
      querySnapshot.forEach(doc => {
        const service = this.fromFirestore(doc);
        if (service.location.coordinates) {
          const distance = this.calculateDistance(lat, lng, service.location.coordinates.lat, service.location.coordinates.lng);
          if (distance <= radius / 1000) { // Convertir mètres en km
            if (filters.area && (service.area < filters.area.min || service.area > filters.area.max)) return;
            if (filters.duration && (service.duration < filters.duration.min || service.duration > filters.duration.max)) return;
            services.push(service);
          }
        }
      });
      const { results, total, totalPages } = paginateResults(services, page, limit);
      logInfo('Services à proximité récupérés', { lat, lng, radius, page, limit, total });
      return { services: results, total, page, totalPages };
    } catch (error) {
      logError('Erreur lors de la récupération des services à proximité', { error: error.message });
      throw new AppError(500, 'Erreur serveur lors de la récupération des services à proximité', error.message);
    }
  }

  /**
   * Calcule la distance entre deux points géographiques (en km).
   * @param {number} lat1 - Latitude du point 1.
   * @param {number} lng1 - Longitude du point 1.
   * @param {number} lat2 - Latitude du point 2.
   * @param {number} lng2 - Longitude du point 2.
   * @returns {number} Distance en kilomètres.
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Rayon de la Terre en km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

module.exports = ServiceRepository;