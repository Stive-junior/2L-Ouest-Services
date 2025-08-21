import { getMessaging } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging.js';

/**
 * @file notifications.js
 * @description Module de gestion des notifications pour L&L Ouest Services.
 * Gère l'affichage des notifications.
 * @module notifications
 */

import api from '../api.js';
import { showNotification } from './utils.js';

const notifications = {
  init() {
    this.bindNotificationsList();
  },

  bindNotificationsList() {
    const listContainer = document.getElementById('notifications-list');
    if (listContainer) {
      api.notification.getNotifications().then((data) => {
        listContainer.innerHTML = data.notifications.map((notification) => `
          <div>${notification.message} - ${notification.createdAt}</div>
        `).join('');
      }).catch((error) => {
        showNotification(error.message, 'error');
      });
    }
  },
};

export default notifications;

