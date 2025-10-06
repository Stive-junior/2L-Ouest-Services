/**
 * @file reservationRepo.js
 * @description Repository pour gérer les réservations dans Firestore pour L&L Ouest Services.
 * Fournit des opérations CRUD pour les réservations avec validation et pagination.
 * @module repositories/reservationRepo
 */

const { AppError } = require('../utils/errorUtils');
const { validate } = require('../utils/validationUtils');
const { reservationSchema } = require('../utils/validation/contactValidation');
const { generateUUID, formatDate, paginateResults } = require('../utils/helperUtils');
const { logger, logInfo, logError, logAudit } = require('../services/loggerService');

/**
 * @class ReservationRepository
 * @description Gère les opérations CRUD pour les réservations dans Firestore.
 */
class ReservationRepository {
  /**
   * @param {admin.firestore.CollectionReference} collection - Référence à la collection Firestore.
   */
  constructor(collection) {
    this.collection = collection;
  }

  /**
   * Convertit un document Firestore en format API réservation.
   * @param {Object} doc - Document Firestore avec ID.
   * @returns {Object} Réservation formatée.
   */
  fromFirestore(doc) {
    return {
      id: doc.id,
      serviceId: doc.data().serviceId,
      serviceName: doc.data().serviceName,
      serviceCategory: doc.data().serviceCategory,
      userId: doc.data().userId || null,
      name: doc.data().name,
      email: doc.data().email,
      phone: doc.data().phone || null,
      date: doc.data().date,
      frequency: doc.data().frequency,
      address: doc.data().address,
      options: doc.data().options || null,
      message: doc.data().message,
      consentement: doc.data().consentement,
      createdAt: doc.data().createdAt || null,
      reply: doc.data().reply || null,
      repliedAt: doc.data().repliedAt || null,
      status: doc.data().status || 'pending',
      updatedAt: doc.data().updatedAt || null,
      updatedBy: doc.data().updatedBy || null,
      deletedAt: doc.data().deletedAt || null,
      deletedBy: doc.data().deletedBy || null,
      emailStatus: doc.data().emailStatus || null,
      errorMessage: doc.data().errorMessage || null,
    };
  }

  /**
   * Convertit une réservation API en format Firestore.
   * @param {Object} reservation - Réservation API.
   * @returns {Object} Données Firestore.
   */
  toFirestore(reservation) {
    return {
      serviceId: reservation.serviceId,
      serviceName: reservation.serviceName,
      serviceCategory: reservation.serviceCategory,
      userId: reservation.userId || null,
      name: reservation.name,
      email: reservation.email,
      phone: reservation.phone || null,
      date: reservation.date,
      frequency: reservation.frequency,
      address: reservation.address,
      options: reservation.options || null,
      message: reservation.message,
      consentement: reservation.consentement,
      createdAt: reservation.createdAt || formatDate(new Date()),
      reply: reservation.reply || null,
      repliedAt: reservation.repliedAt || null,
      status: reservation.status || 'pending',
      updatedAt: reservation.updatedAt || null,
      updatedBy: reservation.updatedBy || null,
      deletedAt: reservation.deletedAt || null,
      deletedBy: reservation.deletedBy || null,
      emailStatus: reservation.emailStatus || null,
      errorMessage: reservation.errorMessage || null,
    };
  }

  /**
   * Crée une nouvelle réservation dans Firestore.
   * @async
   * @param {Object} reservationData - Données de la réservation.
   * @returns {Promise<Object>} Réservation créée.
   */
  async create(reservationData) {
    try {
      const { value, error } = validate({ ...reservationData, id: reservationData.id || generateUUID() }, reservationSchema);
      if (error) {
        logError('Erreur de validation lors de la création de la réservation', { error: error.details });
        throw new AppError(400, 'Données de réservation invalides', error.details);
      }

      const docRef = this.collection.doc(value.id);
      await docRef.set(this.toFirestore(value));
      logInfo('Réservation créée', { reservationId: value.id, email: value.email });
      return this.fromFirestore({ id: value.id, data: () => value });
    } catch (error) {
      logError('Erreur lors de la création de la réservation', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création de la réservation', error.message);
    }
  }

  /**
   * Récupère une réservation par son ID.
   * @async
   * @param {string} id - ID de la réservation.
   * @returns {Promise<Object>} Réservation trouvée.
   */
  async getById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        logError('Réservation non trouvée', { id });
        throw new AppError(404, 'Réservation non trouvée');
      }
      logInfo('Réservation récupérée', { id });
      return this.fromFirestore({ id: doc.id, data: () => doc.data() });
    } catch (error) {
      logError('Erreur lors de la récupération de la réservation', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de la réservation', error.message);
    }
  }

  /**
   * Met à jour une réservation dans Firestore.
   * @async
   * @param {string} id - ID de la réservation.
   * @param {Object} reservationData - Données à mettre à jour.
   * @returns {Promise<Object>} Réservation mise à jour.
   */
  async update(id, reservationData) {
    try {
      const existingReservation = await this.getById(id);
      const { value, error } = validate({ ...existingReservation, ...reservationData, id }, reservationSchema);
      if (error) {
        logError('Erreur de validation lors de la mise à jour de la réservation', { error: error.details });
        throw new AppError(400, 'Données de réservation invalides', error.details);
      }

      const docRef = this.collection.doc(id);
      await docRef.update(this.toFirestore({ ...value, updatedAt: formatDate(new Date()) }));
      logAudit('Réservation mise à jour', { reservationId: id, updatedFields: Object.keys(reservationData) });
      return this.fromFirestore({ id, data: () => value });
    } catch (error) {
      logError('Erreur lors de la mise à jour de la réservation', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour de la réservation', error.message);
    }
  }

  /**
   * Supprime une réservation de Firestore (soft delete).
   * @async
   * @param {string} id - ID de la réservation.
   * @returns {Promise<Object>} Résultat de la suppression.
   */
  async delete(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        logError('Réservation non trouvée pour suppression', { id });
        throw new AppError(404, 'Réservation non trouvée');
      }
      const deletedAt = formatDate(new Date());
      await this.collection.doc(id).update({
        status: 'deleted',
        deletedAt,
      });
      logAudit('Réservation supprimée (soft delete)', { id, deletedAt });
      return { id, deletedAt, message: 'Réservation supprimée avec succès' };
    } catch (error) {
      logError('Erreur lors de la suppression de la réservation', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de la réservation', error.message);
    }
  }

  /**
   * Récupère toutes les réservations avec pagination et filtres.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @param {Object} filters - Filtres pour la requête.
   * @param {string} sortBy - Champ de tri.
   * @param {string} sortOrder - Ordre de tri ('asc' ou 'desc').
   * @returns {Promise<{ reservations: Object[], total: number, page: number, totalPages: number }>}
   */
  async getAll(page = 1, limit = 10, filters = {}, sortBy = 'createdAt', sortOrder = 'desc') {
    try {
      let query = this.collection;
      
      if (filters.name) {
        query = query.where('name', '>=', filters.name).where('name', '<=', filters.name + '\uf8ff');
      }
      if (filters.email) {
        query = query.where('email', '==', filters.email);
      }
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      if (filters.serviceId) {
        query = query.where('serviceId', '==', filters.serviceId);
      }
      if (filters.serviceName) {
        query = query.where('serviceName', '>=', filters.serviceName).where('serviceName', '<=', filters.serviceName + '\uf8ff');
      }
      if (filters.serviceCategory) {
        query = query.where('serviceCategory', '==', filters.serviceCategory);
      }
      if (filters.frequency) {
        query = query.where('frequency', '==', filters.frequency);
      }
      if (filters.dateFrom) {
        query = query.where('date', '>=', formatDate(new Date(filters.dateFrom)));
      }
      if (filters.dateTo) {
        query = query.where('date', '<=', formatDate(new Date(filters.dateTo)));
      }
      if (filters.withReply) {
        query = query.where('reply', '!=', null);
      }
      if (filters.repliedOnly) {
        query = query.where('status', '==', 'replied');
      }
      if (filters.hasOptions) {
        query = query.where('options', '!=', null);
      }

      query = query.orderBy(sortBy, sortOrder);
      const { results, total, totalPages } = await paginateResults(query, page, limit);
      const reservations = results.map(doc => this.fromFirestore({ id: doc.id, data: () => doc.data() }));
      logInfo('Réservations récupérées', { page, limit, total, filtersApplied: Object.keys(filters).length });
      return { reservations, total, page, totalPages };
    } catch (error) {
      logError('Erreur lors de la récupération des réservations', { error: error.message, page, limit, filters });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des réservations', error.message);
    }
  }

  /**
   * Récupère les statistiques des réservations.
   * @async
   * @param {Object} filters - Filtres pour les statistiques.
   * @returns {Promise<Object>} Statistiques des réservations.
   */
  async getStats(filters = {}) {
    try {
      let query = this.collection;

      if (filters.dateFrom) {
        query = query.where('createdAt', '>=', formatDate(new Date(filters.dateFrom)));
      }
      if (filters.dateTo) {
        query = query.where('createdAt', '<=', formatDate(new Date(filters.dateTo)));
      }

      const snapshot = await query.get();
      const reservations = snapshot.docs.map(doc => this.fromFirestore({ id: doc.id, data: () => doc.data() }));

      const stats = {
        total: reservations.length,
        pending: reservations.filter(r => r.status === 'pending').length,
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        completed: reservations.filter(r => r.status === 'completed').length,
        cancelled: reservations.filter(r => r.status === 'cancelled').length,
        deleted: reservations.filter(r => r.status === 'deleted').length,
        withOptions: reservations.filter(r => r.options).length,
        averageMessageLength: reservations.length > 0 ? reservations.reduce((sum, r) => sum + (r.message?.length || 0), 0) / reservations.length : 0,
        reservationsByStatus: {
          pending: reservations.filter(r => r.status === 'pending').length,
          confirmed: reservations.filter(r => r.status === 'confirmed').length,
          completed: reservations.filter(r => r.status === 'completed').length,
          cancelled: reservations.filter(r => r.status === 'cancelled').length,
          deleted: reservations.filter(r => r.status === 'deleted').length,
        },
        reservationsByDate: reservations.reduce((acc, r) => {
          const date = r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : 'unknown';
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {}),
        topServices: reservations
          .reduce((acc, r) => {
            acc[r.serviceName] = (acc[r.serviceName] || 0) + 1;
            return acc;
          }, {}),
        topFrequencies: reservations
          .reduce((acc, r) => {
            acc[r.frequency] = (acc[r.frequency] || 0) + 1;
            return acc;
          }, {}),
        responseTime: reservations
          .filter(r => r.repliedAt && r.createdAt)
          .reduce((acc, r) => {
            const diff = (new Date(r.repliedAt) - new Date(r.createdAt)) / (1000 * 60 * 60 * 24);
            acc.total += diff;
            acc.count += 1;
            acc.min = Math.min(acc.min || diff, diff);
            acc.max = Math.max(acc.max || diff, diff);
            return acc;
          }, { total: 0, count: 0, min: null, max: null }),
      };

      stats.averageDaysToReply = stats.responseTime.count > 0 ? stats.responseTime.total / stats.responseTime.count : 0;
      stats.fastestReply = stats.responseTime.min;
      stats.slowestReply = stats.responseTime.max;

      logInfo('Statistiques des réservations récupérées', { total: stats.total, filtersApplied: Object.keys(filters).length });
      return stats;
    } catch (error) {
      logError('Erreur lors de la récupération des statistiques des réservations', { error: error.message, filters });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des statistiques des réservations', error.message);
    }
  }
}

module.exports = ReservationRepository;
