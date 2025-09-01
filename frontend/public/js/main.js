/**
 * @file main.js
 * @description Initialisation globale de l'application L&L Ouest Services.
 * Configure Firebase, les APIs, les animations, et les gestionnaires d'événements pour les pages.
 * Optimisé pour un chargement rapide : imports dynamiques, cache des requêtes, exécution asynchrone.
 * @module main
 */

import { auth, showNotification, setStoredToken, clearStoredToken, getStoredToken } from './modules/utils.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import authApi from './api.js';
import './animations/animation.js';
import './animations/theme.js';
import './animations/sidebar.js';
import './animations/chat.js';

// Cache des requêtes API (objet global avec TTL de 5 minutes)
const apiCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Cache une réponse API.
 * @param {string} key - Clé du cache.
 * @param {*} data - Données à cacher.
 */
function cacheResponse(key, data) {
  apiCache[key] = { data, timestamp: Date.now() };
}

/**
 * Récupère une réponse du cache si valide.
 * @param {string} key - Clé du cache.
 * @returns {*} - Données cachées ou null.
 */
function getCachedResponse(key) {
  const cached = apiCache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  delete apiCache[key];
  return null;
}

/**
 * Détermine la page actuelle à partir de l'URL.
 * @returns {string} - Nom de la page ou du module principal.
 */
function getCurrentPage() {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean); // enlève les vides

  if (parts.length === 0) {
    return 'index'; // cas de "/"
  }

  const lastPart = parts[parts.length - 1];

  if (lastPart.endsWith('.html')) {
    const pageName = lastPart.replace('.html', '');
    return pageName === 'index' ? 'index' : pageName;
  }

  // Si l'URL se termine par un dossier (ex: /dossier/)
  return lastPart;
}

/**
 * Charge dynamiquement un module si nécessaire.
 * @param {string} modulePath - Chemin du module.
 * @returns {Promise<Object>} - Le module chargé.
 */
async function loadModule(modulePath) {
  try {
    const module = await import(modulePath);
    return module.default;
  } catch (error) {
    console.error(`Erreur lors du chargement du module ${modulePath}:`, error);
    showNotification('Erreur lors du chargement d\'un module.', 'error');
    return null;
  }
}

/**
 * Initialise les gestionnaires d'événements pour la page actuelle de manière asynchrone.
 * @param {string} page - Nom de la page.
 * @param {boolean} isAuthenticated - Indique si l'utilisateur est authentifié.
 */
async function initializePage(page, isAuthenticated) {
  console.log(`Initialisation de la page : ${page}, Auth : ${isAuthenticated}`);
  
  const moduleMap = {
    auth: { path: './modules/auth.js', pages: ['signin', 'signup', 'verify-email', 'password-reset', 'change-email'], authRequired: false },
    user: { path: './modules/user.js', pages: ['dashboard', 'user', 'admin'], authRequired: true },
    chat: { path: './modules/chat.js', pages: ['chat'], authRequired: true },
    contact: { path: './modules/contact.js', pages: ['contact'], authRequired: false },
    doc: { path: './modules/document.js', pages: ['doc'], authRequired: true },
    map: { path: './modules/map.js', pages: ['map'], authRequired: false },
    notifications: { path: './modules/notifications.js', pages: ['notifications'], authRequired: true },
    review: { path: './modules/review.js', pages: ['reviews', 'reviews-create', 'reviews-manage', 'reviews-user'], authRequired: false },
    service: { path: './modules/service.js', pages: ['services', 'admin'], authRequired: false },
  };

  const initPromises = [];
  
  Object.values(moduleMap).forEach((mod) => {
    if (mod.pages.includes(page) && (!mod.authRequired || isAuthenticated)) {
      initPromises.push(loadModule(mod.path).then((module) => {
        if (module && typeof module.init === 'function') {
          module.init();
        } else {
          console.warn(`Module ou méthode d'initialisation non trouvé pour la page : ${page}`);
        }
      }));
    }
  });

  await Promise.all(initPromises);
}

// Exécution principale asynchrone
(async () => {
  AOS.init();
  console.log('Script principal chargé');
  const page = getCurrentPage();

  onAuthStateChanged(auth, async (user) => {
    let isAuthenticated = !!user;

    if (user) {
      const cachedToken = getCachedResponse('jwt');
      
      if (cachedToken) {
        setStoredToken(cachedToken.token, cachedToken.role);
        isAuthenticated = true;
      } else {
        try {
          let storedToken = getStoredToken();
          let newToken = storedToken;

          if (storedToken) {
            try {
              const decodedToken = JSON.parse(atob(storedToken.split('.')[1]));
              const exp = decodedToken.exp * 1000;
              const now = Date.now();
              if (exp - now < 5 * 60 * 1000) { // Moins de 5 minutes avant expiration
                const refreshData = await authApi.auth.refreshToken();
                newToken = refreshData.token;
                cacheResponse('jwt', { token: newToken, role: refreshData.role || 'client' });
                setStoredToken(newToken, refreshData.role || 'client');
              } else {
                const verifyData = await authApi.auth.verifyToken();
                cacheResponse('jwt', { token: storedToken, role: verifyData.role || 'client' });
                setStoredToken(storedToken, verifyData.role || 'client');
              }
            } catch (decodeError) {
              console.error('Erreur lors du décodage du token:', decodeError);
              newToken = await user.getIdToken(true);
              const verifyData = await authApi.auth.verifyToken();
              cacheResponse('jwt', { token: newToken, role: verifyData.role || 'client' });
              setStoredToken(newToken, verifyData.role || 'client');
            }
          } else {
            newToken = await user.getIdToken(true);
            const verifyData = await authApi.auth.verifyToken();
            cacheResponse('jwt', { token: newToken, role: verifyData.role || 'client' });
            setStoredToken(newToken, verifyData.role || 'client');
          }

          isAuthenticated = true;
        } catch (error) {
          console.error('Erreur de vérification du token:', error);
          clearStoredToken();
          isAuthenticated = false;
          showNotification('Session expirée. Veuillez vous reconnecter.', 'error');
          window.location.href = '/pages/auth/signin.html';
        }
      }
    } else {
      clearStoredToken();
      isAuthenticated = false;
    }

    await initializePage(page, isAuthenticated);
  });
})();
