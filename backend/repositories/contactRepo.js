/**
 * @file contactRepo.js
 * @description Repository pour gérer les messages de contact dans Firestore pour L&L Ouest Services.
 * Fournit des opérations CRUD pour les messages de contact avec validation et pagination.
 * @module repositories/contactRepo
 */

const { AppError } = require('../utils/errorUtils');
const { validate } = require('../utils/validationUtils');
const { contactSchema } = require('../utils/validation/contactValidation');
const { generateUUID, formatDate, paginateResults } = require('../utils/helperUtils');
const { logger, logInfo, logError, logAudit } = require('../services/loggerService');

/**
 * @class ContactRepository
 * @description Gère les opérations CRUD pour les messages de contact dans Firestore.
 */
class ContactRepository {
  /**
   * @param {admin.firestore.CollectionReference} collection - Référence à la collection Firestore.
   */
  constructor(collection) {
    this.collection = collection;
  }

  /**
   * Convertit un document Firestore en format API contact.
   * @param {Object} doc - Document Firestore avec ID.
   * @returns {Object} Contact formaté.
   */
  fromFirestore(doc) {
    return {
      id: doc.id,
      userId: doc.data().userId || null,
      name: doc.data().name,
      email: doc.data().email,
      phone: doc.data().phone || null,
      subjects: doc.data().subjects || null,
      message: doc.data().message,
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
   * Convertit un contact API en format Firestore.
   * @param {Object} contact - Contact API.
   * @returns {Object} Données Firestore.
   */
  toFirestore(contact) {
    return {
      userId: contact.userId || null,
      name: contact.name,
      email: contact.email,
      phone: contact.phone || null,
      subjects: contact.subjects || null,
      message: contact.message,
      createdAt: contact.createdAt || formatDate(new Date()),
      reply: contact.reply || null,
      repliedAt: contact.repliedAt || null,
      status: contact.status || 'pending',
      updatedAt: contact.updatedAt || null,
      updatedBy: contact.updatedBy || null,
      deletedAt: contact.deletedAt || null,
      deletedBy: contact.deletedBy || null,
      emailStatus: contact.emailStatus || null,
      errorMessage: contact.errorMessage || null,
    };
  }

  /**
   * Crée un nouveau message de contact dans Firestore.
   * @async
   * @param {Object} contactData - Données du contact.
   * @returns {Promise<Object>} Contact créé.
   */
  async create(contactData) {
    try {
      const { value, error } = validate({ ...contactData, id: contactData.id || generateUUID() }, contactSchema);
      if (error) {
        logError('Erreur de validation lors de la création du message de contact', { error: error.details });
        throw new AppError(400, 'Données de contact invalides', error.details);
      }

      const docRef = this.collection.doc(value.id);
      await docRef.set(this.toFirestore(value));
      logInfo('Message de contact créé', { contactId: value.id, email: value.email });
      return this.fromFirestore({ id: value.id, data: () => value });
    } catch (error) {
      logError('Erreur lors de la création du message de contact', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création du message de contact', error.message);
    }
  }

  /**
   * Récupère un message de contact par son ID.
   * @async
   * @param {string} id - ID du contact.
   * @returns {Promise<Object>} Contact trouvé.
   */
  async getById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        logError('Message de contact non trouvé', { id });
        throw new AppError(404, 'Message de contact non trouvé');
      }
      logInfo('Message de contact récupéré', { id });
      return this.fromFirestore({ id: doc.id, data: () => doc.data() });
    } catch (error) {
      logError('Erreur lors de la récupération du message de contact', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération du message de contact', error.message);
    }
  }

  /**
   * Met à jour un message de contact dans Firestore.
   * @async
   * @param {string} id - ID du contact.
   * @param {Object} contactData - Données à mettre à jour.
   * @returns {Promise<Object>} Contact mis à jour.
   */
  async update(id, contactData) {
    try {
      const existingContact = await this.getById(id);
      const { value, error } = validate({ ...existingContact, ...contactData, id }, contactSchema);
      if (error) {
        logError('Erreur de validation lors de la mise à jour du message de contact', { error: error.details });
        throw new AppError(400, 'Données de contact invalides', error.details);
      }

      const docRef = this.collection.doc(id);
      await docRef.update(this.toFirestore({ ...value, updatedAt: formatDate(new Date()) }));
      logAudit('Message de contact mis à jour', { contactId: id, updatedFields: Object.keys(contactData) });
      return this.fromFirestore({ id, data: () => value });
    } catch (error) {
      logError('Erreur lors de la mise à jour du message de contact', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour du message de contact', error.message);
    }
  }

  /**
   * Supprime un message de contact de Firestore (soft delete).
   * @async
   * @param {string} id - ID du contact.
   * @returns {Promise<Object>} Résultat de la suppression.
   */
  async delete(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        logError('Message de contact non trouvé pour suppression', { id });
        throw new AppError(404, 'Message de contact non trouvé');
      }
      const deletedAt = formatDate(new Date());
      await this.collection.doc(id).update({
        status: 'deleted',
        deletedAt,
      });
      logAudit('Message de contact supprimé (soft delete)', { id, deletedAt });
      return { id, deletedAt, message: 'Contact supprimé avec succès' };
    } catch (error) {
      logError('Erreur lors de la suppression du message de contact', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression du message de contact', error.message);
    }
  }

  /**
   * Récupère tous les messages de contact avec pagination et filtres.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @param {Object} filters - Filtres pour la requête.
   * @param {string} sortBy - Champ de tri.
   * @param {string} sortOrder - Ordre de tri ('asc' ou 'desc').
   * @returns {Promise<{ contacts: Object[], total: number, page: number, totalPages: number }>}
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
      if (filters.subjects) {
        query = query.where('subjects', '>=', filters.subjects).where('subjects', '<=', filters.subjects + '\uf8ff');
      }
      if (filters.dateFrom) {
        query = query.where('createdAt', '>=', formatDate(new Date(filters.dateFrom)));
      }
      if (filters.dateTo) {
        query = query.where('createdAt', '<=', formatDate(new Date(filters.dateTo)));
      }
      if (filters.withReply) {
        query = query.where('reply', '!=', null);
      }
      if (filters.repliedOnly) {
        query = query.where('status', '==', 'replied');
      }
      if (filters.hasSubjects) {
        query = query.where('subjects', '!=', null);
      }

      query = query.orderBy(sortBy, sortOrder);
      const { results, total, totalPages } = await paginateResults(query, page, limit);
      const contacts = results.map(doc => this.fromFirestore({ id: doc.id, data: () => doc.data() }));
      logInfo('Messages de contact récupérés', { page, limit, total, filtersApplied: Object.keys(filters).length });
      return { contacts, total, page, totalPages };
    } catch (error) {
      logError('Erreur lors de la récupération des messages de contact', { error: error.message, page, limit, filters });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des messages de contact', error.message);
    }
  }

  /**
   * Récupère les statistiques des messages de contact.
   * @async
   * @param {Object} filters - Filtres pour les statistiques.
   * @returns {Promise<Object>} Statistiques des contacts.
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
      const contacts = snapshot.docs.map(doc => this.fromFirestore({ id: doc.id, data: () => doc.data() }));

      const stats = {
        total: contacts.length,
        pending: contacts.filter(c => c.status === 'pending').length,
        replied: contacts.filter(c => c.status === 'replied').length,
        archived: contacts.filter(c => c.status === 'archived').length,
        deleted: contacts.filter(c => c.status === 'deleted').length,
        withSubjects: contacts.filter(c => c.subjects).length,
        averageMessageLength: contacts.length > 0 ? contacts.reduce((sum, c) => sum + (c.message?.length || 0), 0) / contacts.length : 0,
        contactsByStatus: {
          pending: contacts.filter(c => c.status === 'pending').length,
          replied: contacts.filter(c => c.status === 'replied').length,
          archived: contacts.filter(c => c.status === 'archived').length,
          deleted: contacts.filter(c => c.status === 'deleted').length,
        },
        contactsByDate: contacts.reduce((acc, c) => {
          const date = c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : 'unknown';
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {}),
        topSubjects: contacts
          .filter(c => c.subjects)
          .reduce((acc, c) => {
            const subjects = c.subjects.split('-').map(s => s.trim());
            subjects.forEach(s => {
              acc[s] = (acc[s] || 0) + 1;
            });
            return acc;
          }, {})
        ,
        responseTime: contacts
          .filter(c => c.repliedAt && c.createdAt)
          .reduce((acc, c) => {
            const diff = (new Date(c.repliedAt) - new Date(c.createdAt)) / (1000 * 60 * 60 * 24);
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

      logInfo('Statistiques des contacts récupérées', { total: stats.total, filtersApplied: Object.keys(filters).length });
      return stats;
    } catch (error) {
      logError('Erreur lors de la récupération des statistiques', { error: error.message, filters });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des statistiques', error.message);
    }
  }
}

module.exports = ContactRepository;
