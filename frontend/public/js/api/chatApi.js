
/**
 * @file chatApi.js
 * @description Gestion des appels API pour les messages de chat dans L&L Ouest Services.
 * Intègre WebSocket pour les mises à jour en temps réel, validation des données, et guards de sécurité.
 * Initialise Firebase avec la configuration récupérée via l'API avant d'utiliser l'authentification.
 * Mise à jour pour intégrer le nouveau formatErrorMessage avec contexte dans tous les appels apiFetch.
 * @module api/chatApi
 * @version 1.1.0
 * @author L&L Ouest Services Team
 * @lastUpdated 2025-09-25
 * @license MIT
 * @dependencies showNotification, validateInput, getStoredToken, authGuard, handleApiError, apiFetch, getFirebaseConfig, firebase/app, firebase/auth, socket.io-client
 * @changelog
 * - v1.1.0: Ajout du paramètre context dans tous les appels apiFetch pour une gestion d'erreur contextualisée avec formatErrorMessage.
 * - v1.0.0: Version initiale avec WebSocket, Firebase, et gestion des messages/conversations.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { io } from 'https://cdn.jsdelivr.net/npm/socket.io-client@4.7.2/dist/socket.io.esm.min.js';

import { showNotification, validateInput, getStoredToken, authGuard, handleApiError, apiFetch, getFirebaseConfig } from '../modules/utils.js';

const API_BASE_URL = 'http://localhost:35473/api';
const SOCKET_URL = 'ws://localhost:3000';
let auth = null;
let socket = null;

/**
 * Initialise Firebase avec la configuration récupérée via l'API.
 * @async
 * @returns {Promise<void>}
 * @throws {Error} Si l'initialisation échoue.
 */
async function initializeFirebase() {
  try {
    console.log('🔧 Initialisation de Firebase...');
    const firebaseConfig = await getFirebaseConfig();
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('✅ Firebase initialisé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l’initialisation de Firebase:', error);
    const handledError = await handleApiError(error, 'Erreur lors de l’initialisation de Firebase', {
      context: 'Initialisation Firebase',
      sourceContext: 'initialize-firebase',
      isCritical: true,
      iconSvg: `
        <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `,
      actions: error.suggestion ? [{
        text: 'Suivre la suggestion',
        href: '#',
        class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
        svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
      }] : [],
    });
    throw handledError;
  }
}

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
 * @param {string} messageData.senderId - ID de l’expéditeur (UUID).
 * @param {string} messageData.recipientId - ID du destinataire (UUID).
 * @param {string|Object} messageData.content - Contenu du message (texte ou média).
 * @returns {boolean} - True si les données sont valides.
 * @throws {Error} Si les données sont invalides.
 */
function validateSendMessageData(messageData) {
  const schema = {
    senderId: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    recipientId: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
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
  if (error) {
    showNotification(`Données du message invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Données du message invalides');
  }
  return true;
}

/**
 * Valide les données pour mettre à jour un message.
 * @param {Object} messageData - Données du message.
 * @param {string} messageData.id - ID du message (UUID).
 * @param {string|Object} [messageData.content] - Contenu du message (optionnel).
 * @param {string} [messageData.status] - Statut du message (optionnel).
 * @returns {boolean} - True si les données sont valides.
 * @throws {Error} Si les données sont invalides.
 */
function validateUpdateMessageData(messageData) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
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
  if (error) {
    showNotification(`Données de mise à jour invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Données de mise à jour invalides');
  }
  return true;
}

/**
 * Valide les données pour la salle de chat.
 * @param {Object} data - Données de la salle.
 * @param {string} data.senderId - ID de l’expéditeur (UUID).
 * @param {string} data.recipientId - ID du destinataire (UUID).
 * @returns {boolean} - True si les données sont valides.
 * @throws {Error} Si les données sont invalides.
 */
function validateChatRoomData(data) {
  const schema = {
    senderId: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    recipientId: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
  };
  const { error } = validateInput(data, schema);
  if (error) {
    showNotification(`Données de la salle de chat invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Données de la salle de chat invalides');
  }
  return true;
}

/**
 * Valide l'ID du message.
 * @param {Object} data - Données contenant l'ID.
 * @param {string} data.id - ID du message (UUID).
 * @returns {boolean} - True si l'ID est valide.
 * @throws {Error} Si l'ID est invalide.
 */
function validateMessageId(data) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
  };
  const { error } = validateInput(data, schema);
  if (error) {
    showNotification(`ID de message invalide : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('ID de message invalide');
  }
  return true;
}

/**
 * Valide les paramètres de pagination.
 * @param {Object} data - Données de pagination.
 * @param {number} data.page - Numéro de page (minimum 1).
 * @param {number} data.limit - Limite par page (1 à 100).
 * @returns {boolean} - True si les paramètres sont valides.
 * @throws {Error} Si les paramètres sont invalides.
 */
function validatePagination(data) {
  const schema = {
    page: { type: 'number', required: true, min: 1, default: 1 },
    limit: { type: 'number', required: true, min: 1, max: 100, default: 10 },
  };
  const { error } = validateInput(data, schema);
  if (error) {
    showNotification(`Paramètres de pagination invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Paramètres de pagination invalides');
  }
  return true;
}

/**
 * Valide les données pour l'upload ou la suppression de fichier.
 * @param {Object} data - Données du fichier.
 * @param {string} data.id - ID du message (UUID).
 * @param {string} data.fileUrl - URL du fichier.
 * @returns {boolean} - True si les données sont valides.
 * @throws {Error} Si les données sont invalides.
 */
function validateFileData(data) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    fileUrl: { type: 'string', required: true, pattern: /^https?:\/\/.+/ },
  };
  const { error } = validateInput(data, schema);
  if (error) {
    showNotification(`Données de fichier invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
    throw new Error('Données de fichier invalides');
  }
  return true;
}

/**
 * API pour gérer les fonctionnalités de chat dans L&L Ouest Services.
 * @namespace chatApi
 */
const chatApi = {
  /**
   * Initialise Firebase et la connexion WebSocket pour les mises à jour en temps réel.
   * @async
   * @param {Object} callbacks - Fonctions de rappel pour les événements WebSocket.
   * @param {Function} [callbacks.onNewMessage] - Callback pour les nouveaux messages.
   * @param {Function} [callbacks.onMessageUpdated] - Callback pour les messages mis à jour.
   * @param {Function} [callbacks.onMessageDeleted] - Callback pour les messages supprimés.
   * @param {Function} [callbacks.onMessageRead] - Callback pour les messages lus.
   * @returns {Promise<void>}
   * @throws {Error} En cas d'erreur d'initialisation.
   */
  async initializeSocket(callbacks) {
    try {
      if (!auth) {
        await initializeFirebase();
      }
      authGuard();
      const token = getStoredToken();
      if (!token) {
        showNotification('Token JWT manquant pour la connexion WebSocket.', 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
        throw new Error('Token JWT manquant');
      }
      socket = initSocket(token);
      socket.on('newMessage', callbacks.onNewMessage || (() => {}));
      socket.on('messageUpdated', callbacks.onMessageUpdated || (() => {}));
      socket.on('messageDeleted', callbacks.onMessageDeleted || (() => {}));
      socket.on('messageRead', callbacks.onMessageRead || (() => {}));
      showNotification('Initialisation WebSocket réussie.', 'success');
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de l’initialisation WebSocket', {
        context: 'Initialisation WebSocket',
        sourceContext: 'initialize-socket',
        isCritical: true,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
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
   * @async
   * @param {string} senderId - ID de l’expéditeur (UUID).
   * @param {string} recipientId - ID du destinataire (UUID).
   * @returns {Promise<void>}
   * @throws {Error} En cas d'erreur d’accès à la salle.
   */
  async joinChatRoom(senderId, recipientId) {
    try {
      if (!auth) {
        await initializeFirebase();
      }
      authGuard();
      validateChatRoomData({ senderId, recipientId });
      const room = `chat:${[senderId, recipientId].sort().join(':')}`;
      socket.emit('joinRoom', room);
      showNotification('Salle de chat rejointe.', 'success');
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de l’accès à la salle de chat', {
        context: 'Rejoindre Salle de Chat',
        sourceContext: 'join-chat-room',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Envoie un nouveau message.
   * @async
   * @param {Object} messageData - Données du message (senderId, recipientId, content).
   * @returns {Promise<Object>} - Message créé.
   * @throws {Error} En cas d'erreur d’envoi.
   */
  async sendMessage(messageData) {
    try {
      if (!auth) {
        await initializeFirebase();
      }
      authGuard();
      validateSendMessageData(messageData);
      const response = await apiFetch('/chat/messages', 'POST', messageData, true, { context: 'Envoi Message' });
      showNotification('Message envoyé avec succès.', 'success');
      return response.data.message;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de l’envoi du message', {
        context: 'Envoi Message',
        sourceContext: 'send-message',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Récupère un message par son ID.
   * @async
   * @param {string} id - ID du message (UUID).
   * @returns {Promise<Object>} - Message récupéré.
   * @throws {Error} En cas d'erreur de récupération.
   */
  async getMessage(id) {
    try {
      if (!auth) {
        await initializeFirebase();
      }
      authGuard();
      validateMessageId({ id });
      const response = await apiFetch(`/chat/messages/${id}`, 'GET', null, true, { context: 'Récupération Message par ID' });
      return response.data.message;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la récupération du message', {
        context: 'Récupération Message par ID',
        sourceContext: 'get-message',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Met à jour un message.
   * @async
   * @param {string} id - ID du message (UUID).
   * @param {Object} messageData - Données à mettre à jour.
   * @returns {Promise<Object>} - Message mis à jour.
   * @throws {Error} En cas d'erreur de mise à jour.
   */
  async updateMessage(id, messageData) {
    try {
      if (!auth) {
        await initializeFirebase();
      }
      authGuard();
      validateUpdateMessageData({ id, ...messageData });
      const response = await apiFetch(`/chat/messages/${id}`, 'PUT', messageData, true, { context: 'Mise à Jour Message' });
      showNotification('Message mis à jour avec succès.', 'success');
      return response.data.message;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la mise à jour du message', {
        context: 'Mise à Jour Message',
        sourceContext: 'update-message',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Supprime un message.
   * @async
   * @param {string} id - ID du message (UUID).
   * @returns {Promise<void>}
   * @throws {Error} En cas d'erreur de suppression.
   */
  async deleteMessage(id) {
    try {
      if (!auth) {
        await initializeFirebase();
      }
      authGuard();
      validateMessageId({ id });
      await apiFetch(`/chat/messages/${id}`, 'DELETE', null, true, { context: 'Suppression Message' });
      showNotification('Message supprimé avec succès.', 'success');
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la suppression du message', {
        context: 'Suppression Message',
        sourceContext: 'delete-message',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Récupère une conversation avec pagination.
   * @async
   * @param {string} recipientId - ID du destinataire (UUID).
   * @param {number} [page=1] - Numéro de page.
   * @param {number} [limit=10] - Limite par page.
   * @returns {Promise<Object>} - Messages de la conversation.
   * @throws {Error} En cas d'erreur de récupération.
   */
  async getConversation(recipientId, page = 1, limit = 10) {
    try {
      if (!auth) {
        await initializeFirebase();
      }
      authGuard();
      validatePagination({ page, limit });
      const schema = { recipientId: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ } };
      const { error } = validateInput({ recipientId }, schema);
      if (error) {
        showNotification(`ID du destinataire invalide : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
        throw new Error('ID du destinataire invalide');
      }
      const response = await apiFetch(`/chat/${recipientId}?page=${page}&limit=${limit}`, 'GET', null, true, { context: 'Récupération Conversation' });
      return response.data;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la récupération de la conversation', {
        context: 'Récupération Conversation',
        sourceContext: 'get-conversation',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Marque un message comme lu.
   * @async
   * @param {string} id - ID du message (UUID).
   * @returns {Promise<Object>} - Message mis à jour.
   * @throws {Error} En cas d'erreur de marquage.
   */
  async markMessageAsRead(id) {
    try {
      if (!auth) {
        await initializeFirebase();
      }
      authGuard();
      validateMessageId({ id });
      const response = await apiFetch(`/chat/messages/${id}/read`, 'PATCH', null, true, { context: 'Marquage Message Lu' });
      showNotification('Message marqué comme lu.', 'success');
      return response.data.message;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors du marquage du message comme lu', {
        context: 'Marquage Message Lu',
        sourceContext: 'mark-message-as-read',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Récupère tous les messages de l’utilisateur avec pagination.
   * @async
   * @param {number} [page=1] - Numéro de page.
   * @param {number} [limit=10] - Limite par page.
   * @returns {Promise<Object>} - Messages paginés.
   * @throws {Error} En cas d'erreur de récupération.
   */
  async getUserMessages(page = 1, limit = 10) {
    try {
      if (!auth) {
        await initializeFirebase();
      }
      authGuard();
      validatePagination({ page, limit });
      const response = await apiFetch(`/chat?page=${page}&limit=${limit}`, 'GET', null, true, { context: 'Récupération Messages Utilisateur' });
      return response.data;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la récupération des messages', {
        context: 'Récupération Messages Utilisateur',
        sourceContext: 'get-user-messages',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Ajoute un fichier à un message.
   * @async
   * @param {string} id - ID du message (UUID).
   * @param {File} file - Fichier à uploader.
   * @returns {Promise<Object>} - Message mis à jour.
   * @throws {Error} En cas d'erreur d’ajout.
   */
  async uploadChatFile(id, file) {
    try {
      if (!auth) {
        await initializeFirebase();
      }
      authGuard();
      validateMessageId({ id });
      if (!(file instanceof File)) {
        showNotification('Fichier invalide.', 'error', false, { showConfirmButton: true, confirmButtonText: 'OK' });
        throw new Error('Fichier invalide');
      }
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiFetch(`/chat/messages/${id}/file`, 'POST', formData, true, { 
        context: 'Ajout Fichier Message',
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showNotification('Fichier ajouté avec succès.', 'success');
      return response.data.message;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de l’ajout du fichier', {
        context: 'Ajout Fichier Message',
        sourceContext: 'upload-chat-file',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Supprime un fichier d’un message.
   * @async
   * @param {string} id - ID du message (UUID).
   * @param {string} fileUrl - URL du fichier à supprimer.
   * @returns {Promise<void>}
   * @throws {Error} En cas d'erreur de suppression.
   */
  async deleteChatFile(id, fileUrl) {
    try {
      if (!auth) {
        await initializeFirebase();
      }
      authGuard();
      validateFileData({ id, fileUrl });
      await apiFetch(`/chat/messages/${id}/file`, 'DELETE', { fileUrl }, true, { context: 'Suppression Fichier Message' });
      showNotification('Fichier supprimé avec succès.', 'success');
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la suppression du fichier', {
        context: 'Suppression Fichier Message',
        sourceContext: 'delete-chat-file',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },
};

export default chatApi;
