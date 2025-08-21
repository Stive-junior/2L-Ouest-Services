/**
 * @file chatController.js
 * @description Contrôleur pour gérer les messages dans L&L Ouest Services.
 * Fournit des endpoints pour envoyer, récupérer, mettre à jour, supprimer, marquer les messages et gérer les fichiers.
 * @module controllers/chatController
 */

const chatService  = require('../services/chatService');
const { logError } = require('../services/loggerService');
const { AppError } = require('../utils/errorUtils');

/**
 * @class ChatController
 * @description Gère les requêtes HTTP pour les messages.
 */
class ChatController {
  /**
   * Envoie un nouveau message.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec le message créé.
   */
  async sendMessage(req, res, next) {
    try {
      const messageData = { ...req.validatedData, senderId: req.user.id };
      const message = await chatService.sendMessage(messageData);
      res.status(201).json({
        status: 'success',
        data: { message },
      });
    } catch (error) {
      logError('Erreur lors de l\'envoi du message', { error: error.message, userId: req.user.id });
      next(error);
    }
  }

  /**
   * Récupère un message par son ID.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec le message.
   */
  async getMessage(req, res, next) {
    try {
      const { id } = req.validatedData;
      const message = await chatService.getMessage(id);
      if (message.senderId !== req.user.id && message.recipientId !== req.user.id) {
        throw new AppError(403, 'Accès interdit au message');
      }
      res.status(200).json({
        status: 'success',
        data: { message },
      });
    } catch (error) {
      logError('Erreur lors de la récupération du message', { error: error.message, messageId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Met à jour un message.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec le message mis à jour.
   */
  async updateMessage(req, res, next) {
    try {
      const { id, ...messageData } = req.validatedData;
      const message = await chatService.getMessage(id);
      if (message.senderId !== req.user.id) {
        throw new AppError(403, 'Seul l\'expéditeur peut modifier le message');
      }
      const updatedMessage = await chatService.updateMessage(id, messageData);
      res.status(200).json({
        status: 'success',
        data: { message: updatedMessage },
      });
    } catch (error) {
      logError('Erreur lors de la mise à jour du message', { error: error.message, messageId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Supprime un message.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant la suppression.
   */
  async deleteMessage(req, res, next) {
    try {
      const { id } = req.validatedData;
      const message = await chatService.getMessage(id);
      if (message.senderId !== req.user.id) {
        throw new AppError(403, 'Seul l\'expéditeur peut supprimer le message');
      }
      await chatService.deleteMessage(id);
      res.status(200).json({
        status: 'success',
        message: 'Message supprimé avec succès',
      });
    } catch (error) {
      logError('Erreur lors de la suppression du message', { error: error.message, messageId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Récupère une conversation entre deux utilisateurs.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec les messages de la conversation.
   */
  async getConversation(req, res, next) {
    try {
      const { recipientId, page, limit } = req.validatedData;
      const { messages, total, page: currentPage, limit: currentLimit } = await chatService.getConversation(req.user.id, recipientId, page, limit);
      res.status(200).json({
        status: 'success',
        data: { messages, total, page: currentPage, limit: currentLimit },
      });
    } catch (error) {
      logError('Erreur lors de la récupération de la conversation', { error: error.message, userId: req.user.id });
      next(error);
    }
  }

  /**
   * Marque un message comme lu.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec le message mis à jour.
   */
  async markMessageAsRead(req, res, next) {
    try {
      const { id } = req.validatedData;
      const message = await chatService.getMessage(id);
      if (message.recipientId !== req.user.id) {
        throw new AppError(403, 'Seul le destinataire peut marquer le message comme lu');
      }
      const updatedMessage = await chatService.markMessageAsRead(id);
      res.status(200).json({
        status: 'success',
        data: { message: updatedMessage },
      });
    } catch (error) {
      logError('Erreur lors du marquage du message comme lu', { error: error.message, messageId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Récupère tous les messages d'un utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec les messages de l'utilisateur.
   */
  async getUserMessages(req, res, next) {
    try {
      const { page, limit } = req.validatedData;
      const { messages, total, page: currentPage, limit: currentLimit } = await chatService.getAllMessages(page, limit);
      res.status(200).json({
        status: 'success',
        data: { messages, total, page: currentPage, limit: currentLimit },
      });
    } catch (error) {
      logError('Erreur lors de la récupération des messages de l\'utilisateur', { error: error.message, userId: req.user.id });
      next(error);
    }
  }

  /**
   * Ajoute un fichier à un message.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec le message mis à jour.
   */
  async uploadChatFile(req, res, next) {
    try {
      const { id } = req.validatedData;
      const file = req.files?.file;
      if (!file) throw new AppError(400, 'Aucun fichier fourni');
      const message = await chatService.getMessage(id);
      if (message.senderId !== req.user.id) {
        throw new AppError(403, 'Seul l\'expéditeur peut ajouter un fichier au message');
      }
      const updatedMessage = await chatService.uploadChatFile(id, file.data, file.name);
      res.status(200).json({
        status: 'success',
        data: { message: updatedMessage },
      });
    } catch (error) {
      logError('Erreur lors de l\'ajout du fichier au message', { error: error.message, messageId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Supprime un fichier d'un message.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant la suppression.
   */
  async deleteChatFile(req, res, next) {
    try {
      const { id, fileUrl } = req.validatedData;
      const message = await chatService.getMessage(id);
      if (message.senderId !== req.user.id) {
        throw new AppError(403, 'Seul l\'expéditeur peut supprimer un fichier du message');
      }
      await chatService.deleteChatFile(id, fileUrl);
      res.status(200).json({
        status: 'success',
        message: 'Fichier supprimé avec succès',
      });
    } catch (error) {
      logError('Erreur lors de la suppression du fichier du message', { error: error.message, messageId: req.validatedData.id });
      next(error);
    }
  }
}

const controller = new ChatController();
module.exports = {
  sendMessage: controller.sendMessage.bind(controller),
  getMessage: controller.getMessage.bind(controller),
  updateMessage: controller.updateMessage.bind(controller),
  deleteMessage: controller.deleteMessage.bind(controller),
  getConversation: controller.getConversation.bind(controller),
  markMessageAsRead: controller.markMessageAsRead.bind(controller),
  getUserMessages: controller.getUserMessages.bind(controller),
  uploadChatFile: controller.uploadChatFile.bind(controller),
  deleteChatFile: controller.deleteChatFile.bind(controller),
};
