/**
 * @file notificationController.js
 * @description Contrôleur pour gérer les notifications dans L&L Ouest Services.
 * Fournit des endpoints pour envoyer des notifications push et gérer les notifications en temps réel.
 * @module controllers/notificationController
 */

const notificationService = require('../services/notificationService');
const { logger, logError } = require('../services/loggerService');

/**
 * @class NotificationController
 * @description Gère les requêtes HTTP pour les notifications.
 */
class NotificationController {
  /**
   * Envoie une notification push personnalisée à un utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant l'envoi.
   */
  async sendPushNotification(req, res, next) {
    try {
      const { userId, title, body } = req.validatedData;
      await notificationService.sendPushNotification(userId, { title, body });
      res.status(200).json({
        status: 'success',
        message: 'Notification push envoyée avec succès',
      });
    } catch (error) {
      logError('Erreur lors de l\'envoi de la notification push', { error: error.message, userId: req.validatedData.userId });
      next(error);
    }
  }

  /**
   * Notifie un nouveau message reçu.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant l'envoi.
   */
  async notifyNewMessage(req, res, next) {
    try {
      const { messageId } = req.validatedData;
      await notificationService.notifyNewMessage(messageId);
      res.status(200).json({
        status: 'success',
        message: 'Notification de nouveau message envoyée',
      });
    } catch (error) {
      logError('Erreur lors de la notification de nouveau message', { error: error.message, messageId: req.validatedData.messageId });
      next(error);
    }
  }

  /**
   * Notifie qu'un message a été lu.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant l'envoi.
   */
  async notifyMessageRead(req, res, next) {
    try {
      const { messageId } = req.validatedData;
      await notificationService.notifyMessageRead(messageId);
      res.status(200).json({
        status: 'success',
        message: 'Notification de message lu envoyée',
      });
    } catch (error) {
      logError('Erreur lors de la notification de message lu', { error: error.message, messageId: req.validatedData.messageId });
      next(error);
    }
  }

  /**
   * Notifie la création d'un nouveau service.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant l'envoi.
   */
  async notifyNewService(req, res, next) {
    try {
      const { serviceId } = req.validatedData;
      await notificationService.notifyNewService(serviceId);
      res.status(200).json({
        status: 'success',
        message: 'Notification de nouveau service envoyée',
      });
    } catch (error) {
      logError('Erreur lors de la notification de nouveau service', { error: error.message, serviceId: req.validatedData.serviceId });
      next(error);
    }
  }

  /**
   * Notifie la mise à jour d'un service.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant l'envoi.
   */
  async notifyServiceUpdate(req, res, next) {
    try {
      const { serviceId } = req.validatedData;
      await notificationService.notifyServiceUpdate(serviceId);
      res.status(200).json({
        status: 'success',
        message: 'Notification de mise à jour de service envoyée',
      });
    } catch (error) {
      logError('Erreur lors de la notification de mise à jour de service', { error: error.message, serviceId: req.validatedData.serviceId });
      next(error);
    }
  }

  /**
   * Notifie la création d'un nouvel avis.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant l'envoi.
   */
  async notifyNewReview(req, res, next) {
    try {
      const { reviewId } = req.validatedData;
      await notificationService.notifyNewReview(reviewId);
      res.status(200).json({
        status: 'success',
        message: 'Notification de nouvel avis envoyée',
      });
    } catch (error) {
      logError('Erreur lors de la notification de nouvel avis', { error: error.message, reviewId: req.validatedData.reviewId });
      next(error);
    }
  }

  /**
   * Notifie la création d'un nouvel utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant l'envoi.
   */
  async notifyUserCreated(req, res, next) {
    try {
      const { userId } = req.validatedData;
      await notificationService.notifyUserCreated(userId);
      res.status(200).json({
        status: 'success',
        message: 'Notification de nouvel utilisateur envoyée',
      });
    } catch (error) {
      logError('Erreur lors de la notification de nouvel utilisateur', { error: error.message, userId: req.validatedData.userId });
      next(error);
    }
  }

  /**
   * Notifie la réception d'un nouveau message de contact.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant l'envoi.
   */
  async notifyNewContact(req, res, next) {
    try {
      const { contactId } = req.validatedData;
      await notificationService.notifyNewContact(contactId);
      res.status(200).json({
        status: 'success',
        message: 'Notification de nouveau message de contact envoyée',
      });
    } catch (error) {
      logError('Erreur lors de la notification de nouveau contact', { error: error.message, contactId: req.validatedData.contactId });
      next(error);
    }
  }
}

const controller = new NotificationController();
module.exports = {
  sendPushNotification: controller.sendPushNotification.bind(controller),
  notifyNewMessage: controller.notifyNewMessage.bind(controller),
  notifyMessageRead: controller.notifyMessageRead.bind(controller),
  notifyNewService: controller.notifyNewService.bind(controller),
  notifyServiceUpdate: controller.notifyServiceUpdate.bind(controller),
  notifyNewReview: controller.notifyNewReview.bind(controller),
  notifyUserCreated: controller.notifyUserCreated.bind(controller),
  notifyNewContact: controller.notifyNewContact.bind(controller),
};
