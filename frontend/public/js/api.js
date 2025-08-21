/**
 * @file api.js
 * @description Centralisation des modules API pour L&L Ouest Services.
 * Fournit une interface unifiée pour accéder aux différentes APIs.
 * @module api
 */

import authApi from './api/authApi.js';
import chatApi from './api/chatApi.js';
import contactApi from './api/contactApi.js';
import documentApi from './api/documentApi.js';
import mapApi from './api/mapApi.js';
import notificationApi from './api/notificationApi.js';
import reviewApi from './api/reviewApi.js';
import serviceApi from './api/serviceApi.js';
import userApi from './api/userApi.js';

const api = {
  auth: authApi,
  chat: chatApi,
  contact: contactApi,
  document: documentApi,
  map: mapApi,
  notification: notificationApi,
  review: reviewApi,
  service: serviceApi,
  user: userApi,
};

export default api;