/**
 * @file notificationService.js
 * @description Service pour gérer les notifications push et en temps réel pour toutes les actions du site.
 * Utilise Firebase Cloud Messaging (FCM) et socketService pour les notifications.
 * @module services/notificationService
 */

const { messaging } = require('../config/firebase');
const { userRepo, chatRepo, serviceRepo, reviewRepo, contactRepo } = require('../repositories');
const  socketService  = require('./socketService');
const { logger, logInfo, logError, logAudit } = require('./loggerService');
const { AppError } = require('../utils/errorUtils');
const { admin } = require('firebase-admin');




/**
 * @class NotificationService
 * @description Gère les notifications push et en temps réel pour L&L Ouest Services.
 */
class NotificationService {
  /**
   * Envoie une notification push à un utilisateur via FCM.
   * @param {string} userId - ID de l'utilisateur.
   * @param {admin.messaging.Notification} notification - Contenu de la notification.
   * @returns {Promise<void>}
   * @throws {AppError} Si l'envoi de la notification échoue.
   */
  async sendPushNotification(userId, notification) {
    try {
      const user = await userRepo.getById(userId);
      if (!user.preferences?.notifications || !user.preferences.fcmToken) {
        logInfo('Notifications désactivées ou FCM token manquant', { userId });
        return;
      }

      /**@type {admin.messaging.Message} */
      const message = {
        
        notification: {
          title: notification.title,
          body: notification.body,
        },
        token: user.preferences.fcmToken,
        data: {
          userId: user.id,
          timestamp: new Date().toISOString(),
        },

      };

      await messaging.send(message);
      socketService.emitToUser(userId, 'pushNotification', notification);
      logInfo('Notification push envoyée', { userId, title: notification.title });
    } catch (error) {
      logError('Erreur lors de l\'envoi de la notification push', { error: error.message, userId });
      throw new AppError(500, 'Erreur serveur lors de l\'envoi de la notification push', error.message);
    }
  }

  /**
   * Notifie un nouveau message reçu.
   * @param {string} messageId - ID du message.
   * @returns {Promise<void>}
   * @throws {AppError} Si la notification échoue.
   */
  async notifyNewMessage(messageId) {
    try {
      const message = await chatRepo.getById(messageId);
      const sender = await userRepo.getById(message.senderId);
      const notification = {
        title: `Nouveau message de ${sender.name}`,
        body: message.content,
      };

      await this.sendPushNotification(message.recipientId, notification);
      socketService.emitToUser(message.recipientId, 'newMessage', {
        messageId,
        sender: sender.name,
        content: message.content,
        timestamp: message.timestamp,
      });
      await chatRepo.updateStatus(messageId, 'delivered');
      logInfo('Notification de message envoyée', { messageId, recipientId: message.recipientId });
    } catch (error) {
      logError('Erreur lors de l\'envoi de la notification de message', { error: error.message, messageId });
      throw new AppError(500, 'Erreur serveur lors de l\'envoi de la notification de message', error.message);
    }
  }

  /**
   * Notifie qu'un message a été lu.
   * @param {string} messageId - ID du message.
   * @returns {Promise<void>}
   * @throws {AppError} Si la notification échoue.
   */
  async notifyMessageRead(messageId) {
    try {
      const message = await chatRepo.getById(messageId);
      await chatRepo.updateStatus(messageId, 'read');
      socketService.emitToUser(message.senderId, 'messageRead', { messageId, recipientId: message.recipientId });
      await this.sendPushNotification(message.senderId, {
        title: 'Message lu',
        body: `Votre message à ${message.recipientId} a été lu.`,
      });
      logInfo('Notification de message lu envoyée', { messageId });
    } catch (error) {
      logError('Erreur lors de l\'envoi de la notification de message lu', { error: error.message, messageId });
      throw new AppError(500, 'Erreur serveur lors de l\'envoi de la notification de message lu', error.message);
    }
  }

  /**
   * Notifie la création d'un nouveau service.
   * @param {string} serviceId - ID du service.
   * @returns {Promise<void>}
   * @throws {AppError} Si la notification échoue.
   */
  async notifyNewService(serviceId) {
    try {
      const service = await serviceRepo.getById(serviceId);
      const users = await userRepo.getAll(1, 100);
      for (const user of users.users) {
        await this.sendPushNotification(user.id, {
          title: 'Nouveau service disponible',
          body: `Découvrez notre nouveau service : ${service.name}`,
        });
      }
      socketService.broadcast('newService', { serviceId, title: service.name });
      logInfo('Notification de nouveau service envoyée', { serviceId });
    } catch (error) {
      logError('Erreur lors de l\'envoi de la notification de service', { error: error.message, serviceId });
      throw new AppError(500, 'Erreur serveur lors de l\'envoi de la notification de service', error.message);
    }
  }

  /**
   * Notifie la mise à jour d'un service.
   * @param {string} serviceId - ID du service.
   * @returns {Promise<void>}
   * @throws {AppError} Si la notification échoue.
   */
  async notifyServiceUpdate(serviceId) {
    try {
      const service = await serviceRepo.getById(serviceId);
      const users = await userRepo.getAll(1, 100);
      for (const user of users.users) {
        await this.sendPushNotification(user.id, {
          title: 'Service mis à jour',
          body: `Le service ${service.name} a été mis à jour.`,
        });
      }
      socketService.broadcast('serviceUpdated', { serviceId, title: service.name });
      logInfo('Notification de mise à jour de service envoyée', { serviceId });
    } catch (error) {
      logError('Erreur lors de l\'envoi de la notification de mise à jour de service', { error: error.message, serviceId });
      throw new AppError(500, 'Erreur serveur lors de l\'envoi de la notification de mise à jour de service', error.message);
    }
  }

  /**
   * Notifie la création d'un nouvel avis.
   * @param {string} reviewId - ID de l'avis.
   * @returns {Promise<void>}
   * @throws {AppError} Si la notification échoue.
   */
  async notifyNewReview(reviewId) {
    try {
      const review = await reviewRepo.getById(reviewId);
      const service = await serviceRepo.getById(review.serviceId);
      await this.sendPushNotification(service.providerId, {
        title: 'Nouvel avis reçu',
        body: `Un nouvel avis a été ajouté à votre service ${service.name}.`,
      });
      socketService.emitToUser(service.providerId, 'newReview', { reviewId, serviceId: review.serviceId });
      logInfo('Notification de nouvel avis envoyée', { reviewId });
    } catch (error) {
      logError('Erreur lors de l\'envoi de la notification d\'avis', { error: error.message, reviewId });
      throw new AppError(500, 'Erreur serveur lors de l\'envoi de la notification d\'avis', error.message);
    }
  }

  /**
   * Notifie la création d'un nouvel utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<void>}
   * @throws {AppError} Si la notification échoue.
   */
  async notifyUserCreated(userId){
    try {
      const user = await userRepo.getById(userId);
      const admins = await userRepo.getByRole('admin', 1, 100);
      for (const admin of admins.users) {
        await this.sendPushNotification(admin.id, {
          title: 'Nouvel utilisateur créé',
          body: `Un nouvel utilisateur a été créé : ${user.name}`,
        });
        socketService.emitToUser(admin.id, 'newUser', { userId, name: user.name });
      }
      logInfo('Notification de nouvel utilisateur envoyée', { userId });
    } catch (error) {
      logError('Erreur lors de l\'envoi de la notification de nouvel utilisateur', { error: error.message, userId });
      throw new AppError(500, 'Erreur serveur lors de l\'envoi de la notification de nouvel utilisateur', error.message);
    }

  }


  /**
   * Notifie la réception d'un nouveau message de contact.
   * @param {string} contactId - ID du message de contact.
   * @returns {Promise<void>}
   * @throws {AppError} Si la notification échoue.
   */
  async notifyNewContact(contactId) {
    try {
      const contact = await contactRepo.getById(contactId);
      const admins = await userRepo.getByRole('admin', 1, 100);
      for (const admin of admins.users) {
        await this.sendPushNotification(admin.id, {
          title: 'Nouveau message de contact',
          body: `Nouveau message de ${contact.name}: ${contact.subject}`,
        });
        socketService.emitToUser(admin.id, 'newContact', { contactId, subject: contact.subject });
      }
      logInfo('Notification de nouveau contact envoyée', { contactId });
    } catch (error) {
      logError('Erreur lors de l\'envoi de la notification de contact', { error: error.message, contactId });
      throw new AppError(500, 'Erreur serveur lors de l\'envoi de la notification de contact', error.message);
    }
  }
}

module.exports = new NotificationService();
