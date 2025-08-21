//import io from 'https://cdn.socket.io/4.7.2/socket.io.esm.js';

/**
 * @file chat.js
 * @description Module de gestion du chat pour L&L Ouest Services.
 * Gère l'envoi et l'affichage des messages.
 * @module chat
 */

import api from '../api.js';
import { showNotification } from './utils.js';

const chat = {
  init() {
    this.bindChatForm();
    this.bindChatMessages();
  },

  bindChatForm() {
    const form = document.getElementById('chat-form');
    if (form) {
      const recipientId = new URLSearchParams(window.location.search).get('recipientId');
      if (recipientId) {
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const formData = new FormData(form);
          const messageData = {
            senderId: api.auth.getCurrentUser()?.uid,
            recipientId,
            content: formData.get('message'),
          };
          try {
            await api.chat.sendMessage(messageData);
            form.reset();
          } catch (error) {
            showNotification(error.message, 'error');
          }
        });
      }
    }
  },

  bindChatMessages() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      const recipientId = new URLSearchParams(window.location.search).get('recipientId');
      if (recipientId) {
        api.chat.initializeSocket({
          onNewMessage: (message) => {
            messagesContainer.innerHTML += `<div>${message.senderId}: ${message.content}</div>`;
          },
        });
        api.chat.joinChatRoom(api.auth.getCurrentUser()?.uid, recipientId);
      }
    }
  },
};

export default chat;

