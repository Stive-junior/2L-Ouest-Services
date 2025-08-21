/**
 * @file notificationApi.js
 * @description Gestion des appels API pour les notifications dans L&L Ouest Services.
 * Intègre la validation des données, les guards de sécurité, et la gestion des tokens.
 * @module api/notificationApi
 */

import { showNotification, validateInput, getStoredToken,apiFetch, authGuard, roleGuard, handleApiError } from '../modules/utils.js';

/**
 * Valide les données pour une notification push.
 * @param {Object} data - Données de la notification.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validatePushNotificationData(data) {
  const schema = {
    userId: { type: 'string', required: true },
    title: { type: 'string', required: true, minLength: 3, maxLength: 100 },
    body: { type: 'string', required: true, minLength: 3, maxLength: 500 },
  };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`Données de notification invalides : ${error.details}`);
  return true;
}

/**
 * Valide l’ID d’un message.
 * @param {Object} data - Données contenant l’ID du message.
 * @returns {boolean}
 * @throws {Error} Si l’ID est invalide.
 */
function validateMessageIdData(data) {
  const schema = { messageId: { type: 'string', required: true } };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`ID de message invalide : ${error.details}`);
  return true;
}

/**
 * Valide l’ID d’un service.
 * @param {Object} data - Données contenant l’ID du service.
 * @returns {boolean}
 * @throws {Error} Si l’ID est invalide.
 */
function validateServiceIdData(data) {
  const schema = { serviceId: { type: 'string', required: true } };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`ID de service invalide : ${error.details}`);
  return true;
}

/**
 * Valide l’ID d’un avis.
 * @param {Object} data - Données contenant l’ID de l’avis.
 * @returns {boolean}
 * @throws {Error} Si l’ID est invalide.
 */
function validateReviewIdData(data) {
  const schema = { reviewId: { type: 'string', required: true } };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`ID d’avis invalide : ${error.details}`);
  return true;
}

/**
 * Valide l’ID d’un utilisateur.
 * @param {Object} data - Données contenant l’ID de l’utilisateur.
 * @returns {boolean}
 * @throws {Error} Si l’ID est invalide.
 */
function validateUserIdData(data) {
  const schema = { userId: { type: 'string', required: true } };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`ID d’utilisateur invalide : ${error.details}`);
  return true;
}

/**
 * Valide l’ID d’un message de contact.
 * @param {Object} data - Données contenant l’ID du message de contact.
 * @returns {boolean}
 * @throws {Error} Si l’ID est invalide.
 */
function validateContactIdData(data) {
  const schema = { contactId: { type: 'string', required: true } };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`ID de contact invalide : ${error.details}`);
  return true;
}

const notificationApi = {
  /**
   * Envoie une notification push personnalisée.
   * @async
   * @param {string} userId - ID de l’utilisateur.
   * @param {string} title - Titre de la notification.
   * @param {string} body - Corps de la notification.
   * @returns {Promise<void>}
   */
  async sendPushNotification(userId, title, body) {
    try {
      authGuard();
      roleGuard(['admin']);
      validatePushNotificationData({ userId, title, body });
      await apiFetch('/notifications/push', 'POST', { userId, title, body });
      showNotification('Notification push envoyée avec succès.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de l’envoi de la notification push');
    }
  },

  /**
   * Notifie un nouveau message.
   * @async
   * @param {string} messageId - ID du message.
   * @returns {Promise<void>}
   */
  async notifyNewMessage(messageId) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateMessageIdData({ messageId });
      await apiFetch('/notifications/message', 'POST', { messageId });
      showNotification('Notification de nouveau message envoyée.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la notification de nouveau message');
    }
  },

  /**
   * Notifie qu’un message a été lu.
   * @async
   * @param {string} messageId - ID du message.
   * @returns {Promise<void>}
   */
  async notifyMessageRead(messageId) {
    try {
      authGuard();
      validateMessageIdData({ messageId });
      await apiFetch('/notifications/message/read', 'POST', { messageId });
      showNotification('Notification de message lu envoyée.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la notification de message lu');
    }
  },

  /**
   * Notifie la création d’un nouveau service.
   * @async
   * @param {string} serviceId - ID du service.
   * @returns {Promise<void>}
   */
  async notifyNewService(serviceId) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateServiceIdData({ serviceId });
      await apiFetch('/notifications/service', 'POST', { serviceId });
      showNotification('Notification de nouveau service envoyée.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la notification de nouveau service');
    }
  },

  /**
   * Notifie la mise à jour d’un service.
   * @async
   * @param {string} serviceId - ID du service.
   * @returns {Promise<void>}
   */
  async notifyServiceUpdate(serviceId) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateServiceIdData({ serviceId });
      await apiFetch('/notifications/service/update', 'POST', { serviceId });
      showNotification('Notification de mise à jour de service envoyée.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la notification de mise à jour de service');
    }
  },

  /**
   * Notifie la création d’un nouvel avis.
   * @async
   * @param {string} reviewId - ID de l’avis.
   * @returns {Promise<void>}
   */
  async notifyNewReview(reviewId) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateReviewIdData({ reviewId });
      await apiFetch('/notifications/review', 'POST', { reviewId });
      showNotification('Notification de nouvel avis envoyée.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la notification de nouvel avis');
    }
  },

  /**
   * Notifie la création d’un nouvel utilisateur.
   * @async
   * @param {string} userId - ID de l’utilisateur.
   * @returns {Promise<void>}
   */
  async notifyUserCreated(userId) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateUserIdData({ userId });
      await apiFetch('/notifications/user', 'POST', { userId });
      showNotification('Notification de nouvel utilisateur envoyée.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la notification de nouvel utilisateur');
    }
  },

  /**
   * Notifie la réception d’un nouveau message de contact.
   * @async
   * @param {string} contactId - ID du message de contact.
   * @returns {Promise<void>}
   */
  async notifyNewContact(contactId) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateContactIdData({ contactId });
      await apiFetch('/notifications/contact', 'POST', { contactId });
      showNotification('Notification de nouveau message de contact envoyée.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la notification de nouveau contact');
    }
  },
};

export default notificationApi;
