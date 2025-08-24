/**
 * @file chatApi.js
 * @description Gestion des appels API pour les messages de chat dans L&L Ouest Services.
 * Intègre WebSocket pour les mises à jour en temps réel, validation des données, et guards de sécurité.
 * @module api/chatApi
 */

import { getAuth } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { io } from "https://cdn.jsdelivr.net/npm/socket.io-client@4.7.2/dist/socket.io.esm.min.js";

import { showNotification, validateInput, getStoredToken, authGuard, handleApiError, apiFetch } from '../modules/utils.js';

const API_BASE_URL = 'http://localhost:35473/api';
const SOCKET_URL = 'ws://localhost:3000';
const auth = getAuth();
let socket = null;



/**
 * Initialise la connexion WebSocket.
 * @param {string} token - Token JWT.
 * @returns {Socket} Instance WebSocket.
 */
function initSocket(token) {
  if (socket) return socket;
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });
  socket.on('connect', () => showNotification('WebSocket connecté.', 'success'));
  socket.on('disconnect', () => showNotification('WebSocket déconnecté.', 'warning'));
  return socket;
}

/**
 * Valide les données pour envoyer un message.
 * @param {Object} messageData - Données du message.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validateSendMessageData(messageData) {
  const schema = {
    senderId: { type: 'string', required: true },
    recipientId: { type: 'string', required: true },
    content: {
      type: 'alternatives',
      required: true,
      alternatives: [
        { type: 'string', minLength: 1, maxLength: 1000 },
        {
          type: 'object',
          properties: {
            type: { type: 'string', required: true, enum: ['image', 'file', 'audio', 'video'] },
            url: { type: 'string', required: true, pattern: /^https?:\/\/.+/ },
            metadata: {
              type: 'object',
              required: false,
              properties: {
                fileName: { type: 'string', maxLength: 255 },
                fileSize: { type: 'number', min: 0 },
                mimeType: { type: 'string', pattern: /^[\w-]+\/[\w-]+$/ },
                duration: { type: 'number', min: 0 },
              },
            },
          },
        },
      ],
    },
  };
  const { error } = validateInput(messageData, schema);
  if (error) throw new Error(`Données du message invalides : ${error.details}`);
  return true;
}

/**
 * Valide les données pour mettre à jour un message.
 * @param {Object} messageData - Données du message.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validateUpdateMessageData(messageData) {
  const schema = {
    id: { type: 'string', required: true },
    content: {
      type: 'alternatives',
      required: false,
      alternatives: [
        { type: 'string', minLength: 1, maxLength: 1000 },
        {
          type: 'object',
          properties: {
            type: { type: 'string', required: true, enum: ['image', 'file', 'audio', 'video'] },
            url: { type: 'string', required: true, pattern: /^https?:\/\/.+/ },
            metadata: {
              type: 'object',
              required: false,
              properties: {
                fileName: { type: 'string', maxLength: 255 },
                fileSize: { type: 'number', min: 0 },
                mimeType: { type: 'string', pattern: /^[\w-]+\/[\w-]+$/ },
                duration: { type: 'number', min: 0 },
              },
            },
          },
        },
      ],
    },
    status: { type: 'string', required: false, enum: ['sent', 'delivered', 'read'] },
  };
  const { error } = validateInput(messageData, schema);
  if (error) throw new Error(`Données de mise à jour invalides : ${error.details}`);
  return true;
}

/**
 * Valide les paramètres de la salle de chat.
 * @param {Object} data - Données de la salle.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validateChatRoomData(data) {
  const schema = {
    senderId: { type: 'string', required: true },
    recipientId: { type: 'string', required: true },
  };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`Données de la salle de chat invalides : ${error.details}`);
  return true;
}

/**
 * Valide l'ID du message.
 * @param {Object} data - Données contenant l'ID.
 * @returns {boolean}
 * @throws {Error} Si l'ID est invalide.
 */
function validateMessageId(data) {
  const schema = { id: { type: 'string', required: true } };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`ID de message invalide : ${error.details}`);
  return true;
}

/**
 * Valide les paramètres de pagination.
 * @param {Object} data - Données de pagination.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validatePagination(data) {
  const schema = {
    page: { type: 'number', min: 1, default: 1 },
    limit: { type: 'number', min: 1, max: 100, default: 10 },
  };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`Paramètres de pagination invalides : ${error.details}`);
  return true;
}

/**
 * Valide les données pour l'upload ou la suppression de fichier.
 * @param {Object} data - Données du fichier.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validateFileData(data) {
  const schema = {
    id: { type: 'string', required: true },
    fileUrl: { type: 'string', required: true, pattern: /^https?:\/\/.+/ },
  };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`Données de fichier invalides : ${error.details}`);
  return true;
}

const chatApi = {
  /**
   * Initialise la connexion WebSocket pour les mises à jour en temps réel.
   * @param {Object} callbacks - Fonctions de rappel pour les événements WebSocket.
   * @returns {Promise<void>}
   */
  async initializeSocket(callbacks) {
    try {
      authGuard();
      const token = getStoredToken();
      if (!token) throw new Error('Token JWT manquant pour la connexion WebSocket');
      socket = initSocket(token);
      socket.on('newMessage', callbacks.onNewMessage || (() => {}));
      socket.on('messageUpdated', callbacks.onMessageUpdated || (() => {}));
      socket.on('messageDeleted', callbacks.onMessageDeleted || (() => {}));
      socket.on('messageRead', callbacks.onMessageRead || (() => {}));
    } catch (error) {
      if (error.message.includes('Token JWT manquant')) {
        console.error('Erreur de connexion WebSocket:', error.message);
        throw error;
      }
      throw await handleApiError(error, 'Erreur lors de l’initialisation WebSocket');
    }
  },

  /**
   * Ferme la connexion WebSocket.
   * @returns {void}
   */
  disconnectSocket() {
    if (socket) {
      socket.disconnect();
      socket = null;
      showNotification('Connexion WebSocket fermée.', 'info');
    }
  },

  /**
   * Rejoint une salle de chat.
   * @param {string} senderId - ID de l'expéditeur.
   * @param {string} recipientId - ID du destinataire.
   * @returns {Promise<void>}
   */
  async joinChatRoom(senderId, recipientId) {
    try {
      authGuard();
      validateChatRoomData({ senderId, recipientId });
      const room = `chat:${[senderId, recipientId].sort().join(':')}`;
      socket.emit('joinRoom', room);
      showNotification('Salle de chat rejointe.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de l’accès à la salle de chat');
    }
  },

  /**
   * Envoie un nouveau message.
   * @async
   * @param {Object} messageData - Données du message (senderId, recipientId, content).
   * @returns {Promise<Object>} Message créé.
   */
  async sendMessage(messageData) {
    try {
      authGuard();
      validateSendMessageData(messageData);
      const response = await apiFetch('/chat/messages', 'POST', messageData);
      showNotification('Message envoyé avec succès.', 'success');
      return response.data.message;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de l’envoi du message');
    }
  },

  /**
   * Récupère un message par son ID.
   * @async
   * @param {string} id - ID du message.
   * @returns {Promise<Object>} Message récupéré.
   */
  async getMessage(id) {
    try {
      authGuard();
      validateMessageId({ id });
      const response = await apiFetch(`/chat/messages/${id}`, 'GET');
      return response.data.message;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération du message');
    }
  },

  /**
   * Met à jour un message.
   * @async
   * @param {string} id - ID du message.
   * @param {Object} messageData - Données à mettre à jour.
   * @returns {Promise<Object>} Message mis à jour.
   */
  async updateMessage(id, messageData) {
    try {
      authGuard();
      validateUpdateMessageData({ id, ...messageData });
      const response = await apiFetch(`/chat/messages/${id}`, 'PUT', messageData);
      showNotification('Message mis à jour avec succès.', 'success');
      return response.data.message;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la mise à jour du message');
    }
  },

  /**
   * Supprime un message.
   * @async
   * @param {string} id - ID du message.
   * @returns {Promise<void>}
   */
  async deleteMessage(id) {
    try {
      authGuard();
      validateMessageId({ id });
      await apiFetch(`/chat/messages/${id}`, 'DELETE');
      showNotification('Message supprimé avec succès.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la suppression du message');
    }
  },

  /**
   * Récupère une conversation avec pagination.
   * @async
   * @param {string} recipientId - ID du destinataire.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<Object>} Messages de la conversation.
   */
  async getConversation(recipientId, page = 1, limit = 10) {
    try {
      authGuard();
      validatePagination({ page, limit });
      const schema = { recipientId: { type: 'string', required: true } };
      validateInput({ recipientId }, schema);
      const response = await apiFetch(`/chat/${recipientId}?page=${page}&limit=${limit}`, 'GET');
      return response.data;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération de la conversation');
    }
  },

  /**
   * Marque un message comme lu.
   * @async
   * @param {string} id - ID du message.
   * @returns {Promise<Object>} Message mis à jour.
   */
  async markMessageAsRead(id) {
    try {
      authGuard();
      validateMessageId({ id });
      const response = await apiFetch(`/chat/messages/${id}/read`, 'PATCH');
      showNotification('Message marqué comme lu.', 'success');
      return response.data.message;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors du marquage du message comme lu');
    }
  },

  /**
   * Récupère tous les messages de l'utilisateur avec pagination.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<Object>} Messages paginés.
   */
  async getUserMessages(page = 1, limit = 10) {
    try {
      authGuard();
      validatePagination({ page, limit });
      const response = await apiFetch(`/chat?page=${page}&limit=${limit}`, 'GET');
      return response.data;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération des messages');
    }
  },

  /**
   * Ajoute un fichier à un message.
   * @async
   * @param {string} id - ID du message.
   * @param {File} file - Fichier à uploader.
   * @returns {Promise<Object>} Message mis à jour.
   */
  async uploadChatFile(id, file) {
    try {
      authGuard();
      validateMessageId({ id });
      if (!(file instanceof File)) throw new Error('Fichier invalide');
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiFetch(`/chat/messages/${id}/file`, 'POST', formData, true);
      showNotification('Fichier ajouté avec succès.', 'success');
      return response.data.message;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de l’ajout du fichier');
    }
  },

  /**
   * Supprime un fichier d'un message.
   * @async
   * @param {string} id - ID du message.
   * @param {string} fileUrl - URL du fichier à supprimer.
   * @returns {Promise<void>}
   */
  async deleteChatFile(id, fileUrl) {
    try {
      authGuard();
      validateFileData({ id, fileUrl });
      await apiFetch(`/chat/messages/${id}/file`, 'DELETE', { fileUrl });
      showNotification('Fichier supprimé avec succès.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la suppression du fichier');
    }
  },
};

export default chatApi;
