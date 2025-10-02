import {
  initializeFirebase,
  showNotification,
  setStoredToken,
  clearStoredToken,
  getStoredToken,
  getCachedUserData,
  checkNetwork,
  isDarkMode,
  handleApiError,
  monitorBackend,
  stopMonitoring,
  waitForAuthState
} from './modules/utils.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import Api from './api.js';
import './animations/animation.js';
import './animations/theme.js';
import './animations/sidebar.js';
import './animations/chat.js';
import { loadUserData, updateUIWithUserData } from './loadData.js';

// Cache des requêtes API (TTL réduit à 2 minutes pour fraîcheur en production)
const apiCache = {};
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// État global
let appInitialized = false;
let firebaseInitialized = false;
let auth = null;
let currentPage = null;
let networkMonitoringInterval = null;
const NETWORK_CHECK_INTERVAL = 30000; // 30 secondes

/**
 * Écoute constante de l'état backend, toutes les 30 secondes.
 * Utilise des notifications polies pour informer sans bloquer.
 * **Vérifie UNIQUEMENT la disponibilité du backend.**
 */
function startNetworkMonitoring() {
  if (networkMonitoringInterval) return;
  
  networkMonitoringInterval = setInterval(async () => {
    const networkStatus = await checkNetwork({ context: 'Network Monitoring' }); 
    if (!networkStatus.backendConnected) {
      await showNotification(
        'Serveur temporairement indisponible. Nous réessayons automatiquement.',
        'warning'
      );
      await monitorBackend({ context: 'Network Monitoring' });
    } else {
      stopMonitoring();
    }
  }, NETWORK_CHECK_INTERVAL);
}

/**
 * Arrête l'écoute backend constante.
 */
function stopNetworkMonitoring() {
  if (networkMonitoringInterval) {
    clearInterval(networkMonitoringInterval);
    networkMonitoringInterval = null;
  }
}

/**
 * Met en cache une réponse API.
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
 * Wrapper pour appels asynchrones avec retries (backoff exponentiel, plus patient).
 * @param {Function} fn - Fonction async à appeler.
 * @param {number} maxRetries - Max tentatives.
 * @param {number} baseDelay - Délai base en ms.
 * @returns {Promise<*>} Résultat de fn.
 */
async function withRetries(fn, maxRetries = 5, baseDelay = 3000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError || new Error('Échec après retries');
}

/**
 * Détermine la page actuelle à partir de l'URL.
 * @returns {string} - Nom de la page.
 */
function getCurrentPage() {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0 || parts[0] === 'index.html' || path === '/') {
    return 'index';
  }
  const lastPart = parts[parts.length - 1];
  return lastPart.endsWith('.html') ? lastPart.replace('.html', '') : lastPart;
}

/**
 * Charge dynamiquement un module avec gestion d'erreurs.
 * @param {string} modulePath - Chemin du module.
 * @returns {Promise<Object|null>} - Module chargé ou null.
 */
async function loadModule(modulePath) {
  const cacheKey = `module_${modulePath.replace(/\//g, '_')}`;
  const cachedModule = getCachedResponse(cacheKey);
  if (cachedModule) {
    return cachedModule;
  }
  try {
    const module = await import(modulePath);
    const moduleObj = module.default || module;
    cacheResponse(cacheKey, moduleObj);
    return moduleObj;
  } catch (error) {
    await showNotification(`Erreur chargement module: ${modulePath}`, 'error');
    return null;
  }
}

/**
 * Initialise la page actuelle.
 * @param {string} page - Nom de la page.
 * @param {boolean} isAuthenticated - État d'authentification.
 * @param {Object} [userData] - Données utilisateur.
 * @returns {Promise<boolean>} Succès de l'initialisation.
 */
async function initializePage(page, isAuthenticated, userData = null) {
  const moduleMap = {
    index: { path: null, pages: ['index'], modules: ['contact', 'service', 'review', 'about'], authRequired: false, title: 'Accueil' },
    auth: { path: './modules/auth.js', pages: ['signin', 'signup', 'verify-email', 'password-reset', 'reset-password', 'change-email', 'code-check'], modules: [], authRequired: false, title: 'Authentification' },
    user: { path: './modules/user.js', pages: ['dashboard', 'profile', 'admin'], modules: ['notifications'], authRequired: true, title: 'Espace utilisateur' },
    chat: { path: './modules/chat.js', pages: ['chat'], modules: [], authRequired: true, title: 'Chat' },
    contact: { path: './modules/contact.js', pages: ['contact', 'messages'], modules: [], authRequired: false, title: 'Contact' },
    doc: { path: './modules/document.js', pages: ['doc'], modules: [], authRequired: true, title: 'Documents' },
    map: { path: './modules/map.js', pages: ['map'], modules: [], authRequired: false, title: 'Localisation' },
    notifications: { path: './modules/notifications.js', pages: ['notifications'], modules: [], authRequired: true, title: 'Notifications' },
    review: { path: './modules/review.js', pages: ['reviews', 'create', 'manage', 'user'], modules: [], authRequired: false, title: 'Avis' },
    service: { path: './modules/service.js', pages: ['services', 'admin'], modules: [], authRequired: false, title: 'Services' },
    mentions: { path: './modules/mentions.js', pages: ['mentions'], modules: [], authRequired: false, title: 'Mentions légales' },
    realizations: { path: './modules/realizations.js', pages: ['realizations'], modules: [], authRequired: false, title: 'Réalisations' }
  };

  const authRequiredPages = Object.values(moduleMap)
    .filter(mod => mod.authRequired)
    .flatMap(mod => mod.pages);

  if (authRequiredPages.includes(page) && !isAuthenticated) {
    await showNotification('Veuillez vous connecter.', 'warning');
    setTimeout(() => window.location.href = '/pages/auth/signin.html', 1500);
    return false;
  }

  const pageConfig = Object.values(moduleMap).find(config => config.pages.includes(page));
  if (pageConfig?.title) {
    document.title = `${pageConfig.title} - L&L Ouest Services`;
  }

  const initPromises = [];
  const mainModule = Object.entries(moduleMap).find(([_, mod]) => mod.pages.includes(page));

  if (mainModule) {
    const [moduleName, mod] = mainModule;
    if (mod.path && (!mod.authRequired || isAuthenticated)) {
      initPromises.push(
        loadModule(mod.path).then(async module => {
          if (module?.init) {
            await module.init({ isAuthenticated, userData, pageContext: page });
          }
        })
      );
    }
    if (mod.modules?.length) {
      for (const additionalModuleName of mod.modules) {
        const additionalMod = moduleMap[additionalModuleName];
        if (additionalMod?.path && (!additionalMod.authRequired || isAuthenticated)) {
          initPromises.push(
            loadModule(additionalMod.path).then(async module => {
              if (module?.init) {
                await module.init({ isAuthenticated, userData, pageContext: page });
              }
            })
          );
        }
      }
    }
  }

  try {
    await Promise.all(initPromises);
    if (typeof AOS !== 'undefined') AOS.refresh();
    return true;
  } catch (error) {
    await showNotification(`Erreur chargement page: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Vérifie l'état d'authentification.
 * @param {Object|null} user - Utilisateur Firebase.
 * @returns {Promise<{isAuthenticated: boolean, userData: Object|null}>}
 */
async function verifyAuthState(user) {
  let isAuthenticated = !!user;
  let userData = null;

  if (user) {
    try {
      const firebaseToken = await user.getIdToken(true);
      const cachedAuth = getCachedResponse('auth_state');
      if (cachedAuth && Date.now() - cachedAuth.timestamp < 2 * 60 * 1000) {
        if (getStoredToken() === cachedAuth.token) {
          return { isAuthenticated: true, userData: cachedAuth.userInfo };
        }
      }

      let storedToken = getStoredToken();
      let newToken = storedToken;

      if (storedToken) {
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          if (payload.exp * 1000 <= Date.now()) {
            throw new Error('Token expired');
          }
          if (payload.exp * 1000 - Date.now() < 5 * 60 * 1000) {
            const refreshData = await withRetries(() => Api.auth.refreshToken());
            newToken = refreshData.token;
            userData = refreshData.user;
          } else {
            const verifyData = await withRetries(() => Api.auth.verifyToken());
            newToken = verifyData.token;
            userData = verifyData.user;
          }
        } catch (error) {
          try {
            const refreshData = await withRetries(() => Api.auth.refreshToken());
            newToken = refreshData.token;
            userData = refreshData.user;
          } catch (refreshError) {
            throw refreshError;
          }
        }
      } else {
        const verifyData = await withRetries(() => Api.auth.verifyToken());
        newToken = verifyData.token;
        userData = verifyData.user;
      }

      // S'assurer que le rôle est défini
      if (!userData?.role) {
        userData = { ...userData, role: 'client' };
      }

      setStoredToken(newToken, userData.role);
      cacheResponse('auth_state', { token: newToken, userInfo: userData, timestamp: Date.now() });
    } catch (error) {
      const networkStatus = await checkNetwork();
      if (!networkStatus.backendConnected) {
        const cachedUser = getCachedUserData();
        if (cachedUser) {
          isAuthenticated = true;
          userData = cachedUser;
          await showNotification('Mode dégradé activé (Backend indisponible).', 'warning');
        } else {
          isAuthenticated = false;
          userData = null;
          await showNotification('Backend indisponible. Aucune donnée en cache. Veuillez réessayer.', 'error');
        }
      } else if (error.message?.includes('invalid algorithm') || error.message?.includes('Token invalide') || error.message?.includes('expiré') || error.message?.includes('401')) {
        clearStoredToken();
        await Api.auth.signOut();
        await showNotification('Session expirée. Veuillez vous reconnecter.', 'error');
      } else {
        await handleApiError(error, 'Erreur inattendue d\'authentification.', {
          context: 'Authentification',
          sourceContext: 'authentification',
          isCritical: false,
          iconSvg: `<svg class="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
          actions: [
            { text: 'Réessayer', href: window.location.href, class: 'bg-ll-blue hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium', svg: `<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>` },
            { text: 'Contacter le support', href: 'mailto:contact@llouestservices.fr', class: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-md text-sm font-medium', svg: `<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>` },
          ],
          errorId: generateString(8),
        });
        isAuthenticated = false;
        userData = null;
      }
    }
  } else {
    clearStoredToken();
    await Api.auth.signOut();
  }

  return { isAuthenticated, userData };
}

/**
 * Masque l'overlay de chargement.
 */
function hideLoadingOverlay() {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.opacity = '0';
    setTimeout(() => {
      loadingOverlay.style.display = 'none';
      document.body.classList.remove('loading');
    }, 500);
  }
}

/**
 * Initialise l'application.
 * @returns {Promise<boolean>} Succès de l'initialisation.
 */
async function initializeApp() {
  if (appInitialized) return true;

  try {
    window.__APP_START_TIME__ = Date.now();

    const networkStatus = await checkNetwork();
    
    if (!networkStatus.backendConnected) {
      await monitorBackend({ context: 'App Initialization' });
    }

    try {
      const app = await initializeFirebase();
      firebaseInitialized = true;
      auth = getAuth(app);
    } catch (error) {
      firebaseInitialized = false;
      await handleApiError(error, 'Échec de l\'initialisation de l\'application', {
        context: 'App Initialization',
        isCritical: true,
        sourceContext: 'initialization'
      });
      return false;
    }

    if (typeof AOS !== 'undefined') {
      AOS.init();
    }

    for (const module of Object.values(Api).filter(m => m.init)) {
      await module.init();
    }

    appInitialized = true;
    currentPage = getCurrentPage();

    startNetworkMonitoring();

    return true;
  } catch (error) {
    await showNotification(`Erreur démarrage: ${error.message}`, 'error');
    return false;
  }
}

// Initialisation principale
(async () => {
  if (!await initializeApp()) return;

  if (firebaseInitialized && auth) {
    try {
      const user = await waitForAuthState(auth); 
      const { isAuthenticated, userData } = await verifyAuthState(user);
      
      updateUIWithUserData(userData);
      const pageInitSuccess = await initializePage(currentPage || getCurrentPage(), isAuthenticated, userData);
      
      if (pageInitSuccess) {
        hideLoadingOverlay();
        document.dispatchEvent(new CustomEvent('app:pageReady', {
          detail: { page: currentPage, isAuthenticated, userData, timestamp: Date.now() }
        }));
      }
    } catch (error) {
      const pageInitSuccess = await initializePage(currentPage || getCurrentPage(), false, null);
      if (pageInitSuccess) {
        hideLoadingOverlay();
        document.dispatchEvent(new CustomEvent('app:pageReady', {
          detail: { page: currentPage, isAuthenticated: false, userData: null, timestamp: Date.now(), mode: 'degraded' }
        }));
      }
    }
    
    document.addEventListener('auth:updated', async () => {
      const userData = await loadUserData();
      updateUIWithUserData(userData);
    });

  } else {
    const pageInitSuccess = await initializePage(currentPage || getCurrentPage(), false, null);
    if (pageInitSuccess) {
      hideLoadingOverlay();
      document.dispatchEvent(new CustomEvent('app:pageReady', {
        detail: { page: currentPage, isAuthenticated: false, userData: null, timestamp: Date.now(), mode: 'degraded' }
      }));
    }
  }

  document.dispatchEvent(new CustomEvent('app:initialized', {
    detail: { timestamp: Date.now(), firebaseReady: firebaseInitialized, page: currentPage }
  }));

  window.addEventListener('beforeunload', () => {
    stopNetworkMonitoring();
  });

  window.addEventListener('popstate', async event => {
    if (event.state?.page) {
      currentPage = event.state.page;
      const isAuthenticated = !!getStoredToken();
      const userData = getCachedUserData();
      const pageInitSuccess = await initializePage(currentPage, isAuthenticated, userData);
      if (pageInitSuccess) {
        hideLoadingOverlay();
      }
    }
  });
})();