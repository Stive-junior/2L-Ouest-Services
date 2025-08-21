/**
 * @file chatService.js
 * @description Service pour gérer les messages de chat et les conversations dans L&L Ouest Services.
 * Utilise chatRepo pour les opérations CRUD, notificationService pour les notifications,
 * et storageService pour la gestion des fichiers.
 * @module services/chatService
 */

const { chatRepo, userRepo } = require('../repositories');
const notificationService = require('./notificationService');
const socketService = require('./socketService');
const storageService = require('./storageService');
const { generateUUID } = require('../utils/helperUtils');
const { logger, logInfo, logError, logAudit } = require('./loggerService');
const { AppError } = require('../utils/errorUtils');
const { validate } = require('../utils/validationUtils');
const { sendMessageSchema, updateMessageSchema } = require('../utils/validation/chatValidation');

/**
 * @typedef {Object} ChatMessage
 * @property {string} id - ID du message.
 * @property {string} senderId - ID de l'expéditeur.
 * @property {string} recipientId - ID du destinataire.
 * @property {string|Object} content - Contenu du message (texte ou multimédia).
 * @property {string[]} [files] - URLs des fichiers joints.
 * @property {string} timestamp - Date d'envoi (ISO).
 * @property {string} status - Statut du message (sent, delivered, read).
 */

/**
 * @class ChatService
 * @description Gère les messages et conversations, y compris la gestion des fichiers.
 */
class ChatService {
  /**
   * Envoie un nouveau message.
   * @async
   * @param {Object} messageData - Données du message.
   * @returns {Promise<ChatMessage>} Message créé.
   */
  async sendMessage(messageData) {
    const { error, value } = validate(messageData, sendMessageSchema);
    if (error) throw new AppError(400, 'Données du message invalides', error.details);

    try {
      await userRepo.getById(value.senderId);
      await userRepo.getById(value.recipientId);
      const message = {
        id: generateUUID(),
        ...value,
        files: [],
        timestamp: new Date().toISOString(),
        status: 'sent',
      };

      const createdMessage = await chatRepo.create(message);
      await notificationService.notifyNewMessage(createdMessage.id);
      const room = `chat:${[message.senderId, message.recipientId].sort().join(':')}`;
      socketService.emitToRoom(room, 'newMessage', createdMessage);
      logInfo('Message envoyé', { messageId: createdMessage.id });
      return createdMessage;
    } catch (error) {
      logError('Erreur lors de l\'envoi du message', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'envoi du message', error.message);
    }
  }

  /**
   * Récupère un message par son ID.
   * @async
   * @param {string} messageId - ID du message.
   * @returns {Promise<ChatMessage>} Message récupéré.
   */
  async getMessage(messageId) {
    try {
      const message = await chatRepo.getById(messageId);
      logInfo('Message récupéré', { messageId });
      return message;
    } catch (error) {
      logError('Erreur lors de la récupération du message', { error: error.message, messageId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération du message', error.message);
    }
  }

  /**
   * Met à jour un message.
   * @async
   * @param {string} messageId - ID du message.
   * @param {Object} messageData - Données mises à jour.
   * @returns {Promise<ChatMessage>} Message mis à jour.
   */
  async updateMessage(messageId, messageData) {
    const { error, value } = validate({ id: messageId, ...messageData }, updateMessageSchema);
    if (error) throw new AppError(400, 'Données de mise à jour invalides', error.details);

    try {
      const message = await chatRepo.getById(messageId);
      const updatedMessage = await chatRepo.update(messageId, { ...message, ...value });
      const room = `chat:${[message.senderId, message.recipientId].sort().join(':')}`;
      socketService.emitToRoom(room, 'messageUpdated', updatedMessage);
      logAudit('Message mis à jour', { messageId });
      return updatedMessage;
    } catch (error) {
      logError('Erreur lors de la mise à jour du message', { error: error.message, messageId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour du message', error.message);
    }
  }

  /**
   * Supprime un message.
   * @async
   * @param {string} messageId - ID du message.
   * @returns {Promise<void>}
   */
  async deleteMessage(messageId) {
    try {
      const message = await chatRepo.getById(messageId);
      if (message.files?.length > 0) {
        for (const fileUrl of message.files) {
          await storageService.deleteChatFile(messageId, fileUrl);
        }
      }
      await chatRepo.delete(messageId);
      const room = `chat:${[message.senderId, message.recipientId].sort().join(':')}`;
      socketService.emitToRoom(room, 'messageDeleted', { messageId });
      await notificationService.sendPushNotification(message.recipientId, {
        title: 'Message supprimé',
        body: 'Un message a été supprimé de votre conversation.',
        data: { type: 'messageDeleted', messageId },
      });
      logAudit('Message supprimé', { messageId });
    } catch (error) {
      logError('Erreur lors de la suppression du message', { error: error.message, messageId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression du message', error.message);
    }
  }

  /**
   * Récupère une conversation entre deux utilisateurs.
   * @async
   * @param {string} senderId - ID de l'expéditeur.
   * @param {string} recipientId - ID du destinataire.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Nombre de messages par page.
   * @returns {Promise<{ messages: ChatMessage[], total: number, page: number, limit: number }>}
   */
  async getConversation(senderId, recipientId, page = 1, limit = 10) {
    try {
      await userRepo.getById(senderId);
      await userRepo.getById(recipientId);
      const result = await chatRepo.getByConversation(senderId, recipientId, page, limit);
      logInfo('Conversation récupérée', { senderId, recipientId, page, limit });
      return result;
    } catch (error) {
      logError('Erreur lors de la récupération de la conversation', { error: error.message, senderId, recipientId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de la conversation', error.message);
    }
  }

  /**
   * Marque un message comme lu.
   * @async
   * @param {string} messageId - ID du message.
   * @returns {Promise<ChatMessage>} Message mis à jour.
   */
  async markMessageAsRead(messageId) {
    try {
      const message = await chatRepo.updateStatus(messageId, 'read');
      const room = `chat:${[message.senderId, message.recipientId].sort().join(':')}`;
      socketService.emitToRoom(room, 'messageRead', { messageId });
      await notificationService.notifyMessageRead(messageId);
      logInfo('Message marqué comme lu', { messageId });
      return message;
    } catch (error) {
      logError('Erreur lors du marquage du message comme lu', { error: error.message, messageId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors du marquage du message comme lu', error.message);
    }
  }

  /**
   * Récupère tous les messages avec pagination.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Nombre de messages par page.
   * @returns {Promise<{ messages: ChatMessage[], total: number, page: number, limit: number }>}
   */
  async getAllMessages(page = 1, limit = 10) {
    try {
      const result = await chatRepo.getAll(page, limit);
      logInfo('Tous les messages récupérés', { page, limit });
      return result;
    } catch (error) {
      logError('Erreur lors de la récupération de tous les messages', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de tous les messages', error.message);
    }
  }

  /**
   * Ajoute un fichier à un message.
   * @async
   * @param {string} messageId - ID du message.
   * @param {Buffer} fileBuffer - Buffer du fichier.
   * @param {string} fileName - Nom du fichier.
   * @returns {Promise<ChatMessage>} Message mis à jour.
   */
  async uploadChatFile(messageId, fileBuffer, fileName) {
    try {
      const message = await chatRepo.getById(messageId);
      const fileUrl = await storageService.uploadChatFile(messageId, fileBuffer, fileName);
      const updatedMessage = await chatRepo.update(messageId, {
        ...message,
        files: [...(message.files || []), fileUrl],
      });
      await notificationService.sendPushNotification(updatedMessage.recipientId, {
        title: 'Nouveau fichier reçu',
        body: 'Un nouveau fichier a été ajouté à votre conversation.',
        data: { type: 'chatFileAdded', messageId },
      });
      return updatedMessage;
    } catch (error) {
      logError('Erreur lors de l\'ajout du fichier au message', { error: error.message, messageId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'ajout du fichier au message', error.message);
    }
  }

  /**
   * Supprime un fichier d'un message.
   * @async
   * @param {string} messageId - ID du message.
   * @param {string} fileUrl - URL du fichier à supprimer.
   * @returns {Promise<void>}
   */
  async deleteChatFile(messageId, fileUrl) {
    try {
      const message = await chatRepo.getById(messageId);
      await storageService.deleteChatFile(messageId, fileUrl);
      const updatedFiles = (message.files || []).filter(url => url !== fileUrl);
      await chatRepo.update(messageId, { ...message, files: updatedFiles });
      await notificationService.sendPushNotification(message.recipientId, {
        title: 'Fichier supprimé',
        body: 'Un fichier a été supprimé de votre conversation.',
        data: { type: 'chatFileDeleted', messageId },
      });
    } catch (error) {
      logError('Erreur lors de la suppression du fichier du message', { error: error.message, messageId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression du fichier du message', error.message);
    }
  }
}

module.exports = new ChatService();
