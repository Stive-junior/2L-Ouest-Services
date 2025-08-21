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
      subject: doc.data().subject || null,
      message: doc.data().message,
      createdAt: doc.data().createdAt || null,
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
      subject: contact.subject || null,
      message: contact.message,
      createdAt: contact.createdAt || formatDate(new Date()),
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
      await docRef.update(this.toFirestore(value));
      logAudit('Message de contact mis à jour', { contactId: id });
      return this.fromFirestore({ id, data: () => value });
    } catch (error) {
      logError('Erreur lors de la mise à jour du message de contact', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour du message de contact', error.message);
    }
  }

  /**
   * Supprime un message de contact de Firestore.
   * @async
   * @param {string} id - ID du contact.
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        logError('Message de contact non trouvé pour suppression', { id });
        throw new AppError(404, 'Message de contact non trouvé');
      }
      await this.collection.doc(id).delete();
      logAudit('Message de contact supprimé', { id });
    } catch (error) {
      logError('Erreur lors de la suppression du message de contact', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression du message de contact', error.message);
    }
  }

  /**
   * Récupère tous les messages de contact avec pagination.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<{ contacts: Object[], total: number, page: number, totalPages: number }>}
   */
  async getAll(page = 1, limit = 10) {
    try {
      const query = this.collection.orderBy('createdAt', 'desc');
      const { results, total, totalPages } = await paginateResults(query, page, limit);
      const contacts = results.map(doc => this.fromFirestore({ id: doc.id, data: () => doc.data() }));
      logInfo('Messages de contact récupérés', { page, limit, total });
      return { contacts, total, page, totalPages };
    } catch (error) {
      logError('Erreur lors de la récupération des messages de contact', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des messages de contact', error.message);
    }
  }
}

module.exports = ContactRepository;
