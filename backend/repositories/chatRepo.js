/**
 * @file chatRepo.js
 * @description Repository pour gérer les messages de chat dans Firestore pour L&L Ouest Services.
 * Fournit des opérations CRUD et gestion des conversations, utilisant chatValidation.js.
 * @module repositories/chatRepo
 */

const { AppError } = require('../utils/errorUtils');
const { validate , chatMessageSchema } = require('../utils/validationUtils');
const { generateUUID, formatDate, paginateResults } = require('../utils/helperUtils');
const { logger, logInfo, logError, logAudit } = require('../services/loggerService');

/**
 * @class ChatRepository
 * @description Gère les opérations CRUD pour les messages de chat dans Firestore.
 */
class ChatRepository {
  constructor(collection) {
    this.collection = collection;
  }

  /**
   * Convertit un document Firestore en format API message de chat.
   * @param {Object} doc - Document Firestore avec ID.
   * @returns {Object} Message formaté.
   */
  fromFirestore(doc) {
    return {
      id: doc.id,
      senderId: doc.data().senderId,
      recipientId: doc.data().recipientId,
      content: doc.data().content,
      files: doc.data().files || [],
      timestamp: doc.data().timestamp || null,
      status: doc.data().status || 'sent',
    };
  }

  /**
   * Convertit un message de chat API en format Firestore.
   * @param {Object} message - Message API.
   * @returns {Object} Données Firestore.
   */
  toFirestore(message) {
    return {
      senderId: message.senderId,
      recipientId: message.recipientId,
      content: message.content,
      files: message.files || [],
      timestamp: message.timestamp || formatDate(new Date()),
      status: message.status || 'sent',
    };
  }

  /**
   * Crée un nouveau message de chat dans Firestore.
   * @async
   * @param {Object} messageData - Données du message.
   * @returns {Promise<Object>} Message créé.
   */
  async create(messageData) {
    try {
      const { value, error } = validate({ ...messageData, id: generateUUID() }, chatMessageSchema);
      if (error) {
        logError('Erreur de validation lors de la création du message de chat', { error: error.message });
        throw error;
      }

      const docRef = this.collection.doc(value.id);
      await docRef.set(this.toFirestore(value));
      logInfo('Message de chat créé', { messageId: value.id, senderId: value.senderId });
      return this.fromFirestore({ id: value.id, data: () => value });
    } catch (error) {
      logError('Erreur lors de la création du message de chat', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création du message de chat', error.message);
    }
  }

  /**
   * Récupère un message de chat par son ID.
   * @async
   * @param {string} id - ID du message.
   * @returns {Promise<Object>} Message trouvé.
   */
  async getById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        logError('Message de chat non trouvé', { id });
        throw new AppError(404, 'Message de chat non trouvé');
      }
      logInfo('Message de chat récupéré', { id });
      return this.fromFirestore({ id: doc.id, data: () => doc.data() });
    } catch (error) {
      logError('Erreur lors de la récupération du message de chat', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération du message de chat', error.message);
    }
  }

  /**
   * Met à jour un message de chat dans Firestore.
   * @async
   * @param {string} id - ID du message.
   * @param {Object} messageData - Données à mettre à jour.
   * @returns {Promise<Object>} Message mis à jour.
   */
  async update(id, messageData) {
    try {
      const { value, error } = validate({ id, ...messageData }, chatMessageSchema);
      if (error) {
        logError('Erreur de validation lors de la mise à jour du message de chat', { error: error.message });
        throw error;
      }

      const docRef = this.collection.doc(id);
      await docRef.update(this.toFirestore(value));
      logAudit('Message de chat mis à jour', { messageId: id, senderId: value.senderId });
      return this.fromFirestore({ id, data: () => value });
    } catch (error) {
      logError('Erreur lors de la mise à jour du message de chat', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour du message de chat', error.message);
    }
  }

  /**
   * Supprime un message de chat de Firestore.
   * @async
   * @param {string} id - ID du message.
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        logError('Message de chat non trouvé pour suppression', { id });
        throw new AppError(404, 'Message de chat non trouvé');
      }
      await this.collection.doc(id).delete();
      logAudit('Message de chat supprimé', { id });
    } catch (error) {
      logError('Erreur lors de la suppression du message de chat', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression du message de chat', error.message);
    }
  }

  /**
   * Récupère tous les messages de chat avec pagination.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<{ messages: Object[], total: number, page: number, totalPages: number }>}
   */
  async getAll(page = 1, limit = 10) {
    try {
      const query = this.collection.orderBy('timestamp', 'desc');
      const { results, total, totalPages } = await paginateResults(query, page, limit);
      const messages = results.map(doc => this.fromFirestore({ id: doc.id, data: () => doc.data() }));
      logInfo('Liste des messages de chat récupérée', { page, limit, total });
      return { messages, total, page, totalPages };
    } catch (error) {
      logError('Erreur lors de la récupération des messages de chat', { error: error.message });
      throw new AppError(500, 'Erreur serveur lors de la récupération des messages de chat', error.message);
    }
  }

  /**
   * Récupère les messages d'une conversation entre deux utilisateurs.
   * @async
   * @param {string} senderId - ID de l'expéditeur.
   * @param {string} recipientId - ID du destinataire.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<{ messages: Object[], total: number, page: number, totalPages: number }>}
   */
  async getByConversation(senderId, recipientId, page = 1, limit = 10) {
    try {
      const query = this.collection
        .where('senderId', 'in', [senderId, recipientId])
        .where('recipientId', 'in', [senderId, recipientId])
        .orderBy('timestamp', 'desc');
      const { results, total, totalPages } = await paginateResults(query, page, limit);
      const messages = results.map(doc => this.fromFirestore({ id: doc.id, data: () => doc.data() }));
      logInfo('Messages de conversation récupérés', { senderId, recipientId, page, limit, total });
      return { messages, total, page, totalPages };
    } catch (error) {
      logError('Erreur lors de la récupération des messages de conversation', { error: error.message, senderId, recipientId });
      throw new AppError(500, 'Erreur serveur lors de la récupération des messages de conversation', error.message);
    }
  }

  /**
   * Met à jour le statut d'un message de chat.
   * @async
   * @param {string} id - ID du message.
   * @param {string} status - Nouveau statut.
   * @returns {Promise<Object>} Message mis à jour.
   */
  async updateStatus(id, status) {
    try {
      const message = await this.getById(id);
      const { value, error } = validate({ ...message, status }, chatMessageSchema);
      if (error) {
        logError('Erreur de validation lors de la mise à jour du statut du message', { error: error.message });
        throw error;
      }

      const docRef = this.collection.doc(id);
      await docRef.update({ status });
      logAudit('Statut du message de chat mis à jour', { messageId: id, status });
      return this.fromFirestore({ id, data: () => value });
    } catch (error) {
      logError('Erreur lors de la mise à jour du statut du message de chat', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour du statut du message', error.message);
    }
  }
}

module.exports = ChatRepository;
