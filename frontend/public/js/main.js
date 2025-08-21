/**
 * @file main.js
 * @description Initialisation globale de l’application L&L Ouest Services.
 * Configure Firebase, les APIs, les animations, et les gestionnaires d’événements pour les pages.
 * @module main
 */

import { auth, showNotification, setStoredToken, clearStoredToken, getStoredToken } from './modules/utils.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import api from './api.js';
import authModule from './modules/auth.js';
import chatModule from './modules/chat.js';
import contactModule from './modules/contact.js';
import documentModule from './modules/document.js';
import mapModule from './modules/map.js';
import notificationsModule from './modules/notifications.js';
import reviewModule from './modules/review.js';
import serviceModule from './modules/service.js';
import userModule from './modules/user.js';
import './animations/animation.js';
import './animations/theme.js';
import './animations/sidebar.js';
import './animations/chat.js';

/**
 * Détermine la page actuelle à partir de l'URL
 * @returns {string} - Nom de la page ou du module principal
 */
function getCurrentPage() {
  const path = window.location.pathname;
  const parts = path.split('/').filter(part => part !== '');
  return parts[parts.length - 1].replace('.html', '');
}

/**
 * Initialise les gestionnaires d’événements pour la page actuelle.
 * @param {string} page - Nom de la page.
 * @param {boolean} isAuthenticated - Indique si l'utilisateur est authentifié.
 */
function initializePage(page, isAuthenticated) {
  console.log(`Initialisation de la page : ${page}, Authentifié : ${isAuthenticated}`);
  const moduleMap = {
    auth: ['signin', 'signup', 'verify-email', 'password-reset', 'change-email'],
    user: ['dashboard', 'user', 'admin'],
    chat: ['chat'],
    contact: ['contact'],
    doc: ['doc'],
    map: ['map'],
    notifications: ['notifications'],
    review: ['reviews', 'reviews-create', 'reviews-manage', 'reviews-user'],
    service: ['services', 'admin'],
  };

  const initModule = (module, pageList, authRequired = false) => {
    if (pageList.includes(page) && (!authRequired || isAuthenticated)) {
      if (module && typeof module.init === 'function') {
        module.init();
      } else {
        console.warn(`Module ou méthode d'initialisation non trouvé pour la page : ${page}`);
      }
    }
  };

  initModule(authModule, moduleMap.auth);
  initModule(userModule, moduleMap.user, true);
  initModule(chatModule, moduleMap.chat, true);
  initModule(contactModule, moduleMap.contact);
  initModule(documentModule, moduleMap.doc, true);
  initModule(mapModule, moduleMap.map);
  initModule(notificationsModule, moduleMap.notifications, true);
  initModule(reviewModule, moduleMap.review);
  initModule(serviceModule, moduleMap.service);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Main script loaded');
  const page = getCurrentPage();

  onAuthStateChanged(auth, async (user) => {
    let isAuthenticated = !!user;

    if (user) {
      try {
        const token = getStoredToken();
        const now = Date.now();
        
        // Vérifier si le token local existe et est sur le point d'expirer
        if (token) {
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          const exp = decodedToken.exp * 1000;
          if (exp - now < 5 * 60 * 1000) { // Moins de 5 minutes
            const newToken = await user.getIdToken(true);
            setStoredToken(newToken, localStorage.getItem('userRole') || 'client');
          }
        } else {
            // Le token n'existe pas, on le récupère
            const newToken = await user.getIdToken(true);
            setStoredToken(newToken, localStorage.getItem('userRole') || 'client');
        }

        // Vérifier la validité du token avec le backend après mise à jour locale
        const data = await api.auth.verifyToken();
        setStoredToken(data.token, data.role || 'client');
        isAuthenticated = true;
      } catch (error) {
        console.error('Erreur de vérification du token:', error);
        clearStoredToken();
        isAuthenticated = false;
      }
    } else {
      clearStoredToken();
      isAuthenticated = false;
    }

    const publicPages = [
      'signin', 'signup', 'verify-email', 'password-reset', 'change-email',
      'about', 'contact', 'mentions', 'realizations', 'services', 'reviews', 'reviews-user'
    ];

    if (!publicPages.includes(page) && !isAuthenticated) {
      await showNotification('Veuillez vous connecter pour accéder à cette page.', 'error', false);
      window.location.href = '/pages/auth/signin.html';
      return;
    }

    if (publicPages.includes(page) && isAuthenticated) {
      await showNotification('Vous êtes déjà connecté.', 'info', false);
      window.location.href = '/dashboard.html';
      return;
    }

    initializePage(page, isAuthenticated);
  });
});

// Gestion des erreurs globales
window.addEventListener('unhandledrejection', (event) => {
  console.error('Erreur non gérée:', event.reason);
  showNotification(
    `Erreur inattendue : ${event.reason.message || 'Une erreur est survenue'}`,
    'error',
    false,
  );
});
