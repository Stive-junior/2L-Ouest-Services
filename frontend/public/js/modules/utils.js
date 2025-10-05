/**
 * @file utils.js
 * @description Utilitaires pour le frontend de L&L Ouest Services.
 * Gestion robuste des erreurs réseau, récupération sécurisée des configurations Firebase via API,
 * et affichage de messages utilisateur adaptés selon les cas d'erreur.
 * Ce fichier met l'accent sur la sécurité, la gestion atomique des opérations (via des verrous simples pour éviter les concurrences),
 * et une documentation détaillée en français. Les fonctions sont conçues pour être thread-safe dans un contexte single-thread JS,
 * en utilisant des flags globaux pour les modals afin d'éviter les superpositions.
 */

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';


// Variables globales pour gestion atomique
let firebaseApp = null;
let auth = null;
let firebaseConfig = null;

// Cache pour les configurations Firebase
let firebaseConfigCache = null; // Note : Initialisé à null, mais pourrait être un objet en cas de besoin
const CONFIG_CACHE_KEY = 'firebaseConfigCache';
const CACHE_TTL = 24 * 60 * 60 * 1000;

export const API_BASE_URL = 'https://twol-ouest-services.onrender.com/api';
//export const  API_BASE_URL = 'http://localhost:8000/api';
export const USER_CACHE_KEY = 'userDataCache';

let isShowingErrorModal = false;
let accumulatedErrors = []; 

let networkStatusCache = null;
const NETWORK_CACHE_TTL = 5 * 60 * 1000;

// Chargement asynchrone de SweetAlert2
const swalScript = document.createElement('script');
swalScript.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js';
swalScript.async = true;
document.head.appendChild(swalScript);

let swalLoadedResolve;
const swalLoaded = new Promise((resolve) => (swalLoadedResolve = resolve));
swalScript.onload = () => swalLoadedResolve();

/**
 * Génère un SVG inline pour icônes (utilisé uniquement dans HTML).
 * @param {string} type - 'success', 'error', 'loading', 'warning'.
 * @returns {string} SVG HTML.
 */
function getIconSVG(type) {
  const icons = {
    success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-green-500"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
    error: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-red-500"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
    loading: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-blue-500 animate-spin"><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12s5.37 12 12 12v-8a8 8 0 00-8-8z"/></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-yellow-500"><path fill="currentColor" d="M12 2L1 21h22L12 2zm0 3.09L19.53 18H4.47L12 5.09zm-1 13v-2h2v2h-2zm0-4v-4h2v4h-2z"/></svg>'
  };
  return icons[type] || icons.warning;
}


/**
 * Journalise les erreurs de manière centralisée dans localStorage et console.
 * Permet un suivi des erreurs pour le support technique.
 * @param {Object} log - Détails de l'erreur.
 * @param {string} log.context - Contexte de l'erreur.
 * @param {string} log.errorId - Identifiant unique de l'erreur.
 * @param {string} log.message - Message de l'erreur.
 * @param {Object} log.details - Détails supplémentaires.
 */
function logError({ context, errorId, message, details }) {
  console.error(`[${context}] ${message} (ID: ${errorId})`, details);

  try {
    const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    logs.push({
      context,
      errorId,
      message,
      details,
      timestamp: new Date().toISOString()
    });
    // Limiter à 50 entrées pour éviter la saturation
    if (logs.length > 50) {
      logs.shift();
    }
    localStorage.setItem('errorLogs', JSON.stringify(logs));
  } catch (error) {
    console.warn('⚠️ Erreur lors de la journalisation:', error);
  }
}

/**
 * Récupère les journaux d'erreurs pour le support.
 * @returns {Array} Liste des erreurs journalisées.
 */
export function getErrorLogs() {
  try {
    return JSON.parse(localStorage.getItem('errorLogs') || '[]');
  } catch (error) {
    console.warn('⚠️ Erreur lors de la récupération des journaux:', error);
    return [];
  }
}

/**
 * Efface les journaux d'erreurs.
 */
export function clearErrorLogs() {
  try {
    localStorage.removeItem('errorLogs');
    console.log('✅ Journaux d\'erreurs supprimés');
  } catch (error) {
    console.warn('⚠️ Erreur lors de la suppression des journaux:', error);
  }
}


/**
 * Initialise Firebase de manière asynchrone avec les configurations récupérées via API.
 * @returns {Promise<void>} Une promesse qui se résout lorsque Firebase est initialisé.
 * @throws {Error} Si l'initialisation échoue.
 */
export async function initializeFirebase() {
  if (firebaseApp) {
    console.log("♻️ Instance Firebase déjà initialisée");
    return firebaseApp;
  }

  try {
    firebaseConfig = await getFirebaseConfig();

    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
      console.log('🔥 Nouvelle instance Firebase initialisée via API serveur');
    } else {
      firebaseApp = getApp();
      console.log('♻️ Instance Firebase existante réutilisée');
    }

    return firebaseApp;
  } catch (error) {
    console.error('❌ Échec initialisation Firebase:', error);
    throw new Error('Impossible de charger les configurations Firebase. Vérifiez votre connexion.');
  }
}


/**
 * Récupère les configurations Firebase via l'API backend avec cache intelligent.
 * Effectue jusqu'à 5 tentatives avec retries, et affiche un modal sur échecs persistants.
 * @returns {Promise<Object>} La configuration Firebase.
 * @throws {Error} Si la récupération échoue après retries.
 */
export async function getFirebaseConfig() {
  const cachedConfig = getCachedFirebaseConfig();
  if (cachedConfig) {
    console.log('📦 Configuration Firebase chargée depuis le cache');
    return cachedConfig;
  }

  const retries = 5; // Augmenté à 5 pour cold starts
  let lastError;
  const errorId = generateString(8);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const networkStatus = await checkNetwork({ context: 'Firebase Config' });
      if (!networkStatus.backendConnected) {
        throw new Error('Serveur indisponible');
      }

      console.log(`🔄 Récupération des configurations Firebase via API (tentative ${attempt}/${retries})...`);
      
      const response = await apiFetch('/config/firebase', 'GET', null, false, {
        retries: 0,
        timeout: 60000,
        retryOnColdStart: true,
        context: 'Firebase Config'
      });

      if (response.status !== "success" || !response.data) {
        throw new Error("Réponse serveur invalide lors de la récupération des configs Firebase");
      }

      const firebaseConfig = response.data;
      const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
      const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

      if (missingFields.length > 0) {
        throw new Error(`Configuration Firebase incomplète: ${missingFields.join(', ')} manquants`);
      }

      cacheFirebaseConfig(firebaseConfig);
      console.log('✅ Configuration Firebase récupérée et mise en cache');
   

      return {
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        databaseURL: firebaseConfig.databaseURL,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
        measurementId: firebaseConfig.measurementId,
      };
    } catch (error) {
      lastError = error;
      console.error(`❌ Erreur récupération config Firebase (tentative ${attempt}/${retries}):`, error);
      let customErrorMessage = error.message;
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        customErrorMessage = 'Le serveur ne répond pas - possiblement en maintenance ou non démarré.';
      }

      logError({
        context: 'Firebase Config',
        errorId,
        message: `Échec récupération config Firebase: ${customErrorMessage}`,
        details: { attempt, error }
      });

      if (attempt === retries) {
        await handleApiError(error, customErrorMessage, {
          context: 'Configuration Firebase',
          isCritical: true,
          sourceContext: 'configuration'
        });
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }

  await handleApiError(lastError, 'Échec de la récupération des configurations Firebase', {
    context: 'Configuration Firebase',
    isCritical: true,
    sourceContext: 'configuration'
  });
  throw lastError;
}



/**
 * Met en cache la configuration Firebase dans localStorage.
 * @param {Object} config - Configuration à cacher.
 */
function cacheFirebaseConfig(config) {
  try {
    const cacheObject = {
      data: config,
      timestamp: Date.now(),
      source: 'api'
    };
    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(cacheObject));
  } catch (error) {
    console.error('❌ Erreur mise en cache configuration Firebase:', error);
  }
}

/**
 * Récupère la configuration Firebase depuis le cache.
 * @param {boolean} [emergency=false] - Mode urgence (ignore TTL).
 * @returns {Object|null} Configuration cachée.
 */
function getCachedFirebaseConfig(emergency = false) {
  try {
    const cached = localStorage.getItem(CONFIG_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp, source } = JSON.parse(cached);
    
    // Vérifier TTL sauf en mode urgence
    if (!emergency && Date.now() - timestamp > CACHE_TTL) {
      console.log('📅 Cache Firebase expiré, suppression');
      localStorage.removeItem(CONFIG_CACHE_KEY);
      return null;
    }

    // Vérifier intégrité minimale
    if (!data.apiKey || !data.projectId) {
      localStorage.removeItem(CONFIG_CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Erreur lecture cache Firebase:', error);
    localStorage.removeItem(CONFIG_CACHE_KEY);
    return null;
  }
}

/**
 * Détermine si le thème est sombre.
 * @returns {boolean} True si mode sombre actif.
 */
export function isDarkMode() {
  return document.documentElement.classList.contains('dark');
}

/**
 * Efface le cache des données utilisateur.
 */
export function clearUserCache() {
  localStorage.removeItem(USER_CACHE_KEY);
}

/**
 * Récupère les données utilisateur du cache localStorage.
 * @returns {Object|null} Données utilisateur cachées ou null.
 */
export function getCachedUserData() {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
    clearUserCache();
    return null;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du cache utilisateur:', error);
    clearUserCache();
    return null;
  }
}

/**
 * Met en cache les données utilisateur dans localStorage.
 * @param {Object} userData - Données utilisateur à cacher.
 */
export function cacheUserData(userData) {
  try {
    const cacheObject = {
      data: userData,
      timestamp: Date.now()
    };
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cacheObject));
  } catch (error) {
    console.error('❌ Erreur lors de la mise en cache des données utilisateur:', error);
  }
}


/**
 * Vérifie la connectivité au backend via la route /check.
 * @param {Object} [options] - Options supplémentaires.
 * @param {string} [options.context='Network Check'] - Contexte de la vérification.
 * @returns {Promise<{backendConnected: boolean, details: Object}>} Résultat avec détails.
 */
export async function checkNetwork(options = {}) {
  const { context = 'Network Check' } = options;
  const errorId = generateString(8);

  // Cache : Si backend OK récemment, retourne true sans fetch
  if (networkStatusCache?.backendConnected && Date.now() - networkStatusCache.timestamp < NETWORK_CACHE_TTL) {
    console.log(`✅ Cache réseau valide pour ${context} (TTL: ${Math.round((NETWORK_CACHE_TTL - (Date.now() - networkStatusCache.timestamp)) / 1000)}s)`);
    return networkStatusCache;
  }

  // Retry interne pour cold starts (3 tentatives avec backoff)
  const maxRetries = 3;
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const startTime = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(`${API_BASE_URL}/check`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });
      clearTimeout(timeoutId);

      const responseTime = performance.now() - startTime;

      if (!response.ok) {
        throw new Error(`Réponse non-OK: ${response.status}`);
      }

      const data = await response.json(); 
      if (data.status !== 'ok') {
        throw new Error('Statut serveur non OK');
      }

      const result = {
        backendConnected: true,
        details: {
          status: response.status,
          responseTime,
          endpoint: '/check',
          errorId,
          coldStartSuspected: false
        },
        timestamp: Date.now()
      };

      // Cache le succès (5min TTL)
      networkStatusCache = result;
      console.log(`✅ Serveur disponible pour ${context} (temps: ${Math.round(responseTime)}ms, tentative ${attempt})`);
      return result;
    } catch (error) {
      lastError = error;
      const coldStartSuspected = error.name === 'AbortError' || (error.message && error.message.includes('null') || error.message.includes('CORS'));
      console.error(`❌ Erreur vérification réseau pour ${context} (tentative ${attempt}/${maxRetries}):`, error, { coldStartSuspected });

      if (coldStartSuspected) {
        console.log('🔍 Cold start Render suspecté : retry dans ' + (2 ** (attempt - 1) * 2000) + 'ms');
      }

      logError({
        context,
        errorId,
        message: `Échec vérification réseau: ${error.message}`,
        details: { error, attempt, coldStartSuspected }
      });

      if (attempt < maxRetries && coldStartSuspected) {
        await new Promise(resolve => setTimeout(resolve, 2 ** (attempt - 1) * 2000));
      } else if (attempt === maxRetries) {
        networkStatusCache = {
          backendConnected: false,
          details: { reason: 'erreur_reseau', message: lastError.message || 'Serveur inaccessible', errorId, coldStartSuspected },
          timestamp: Date.now()
        };
      }
    }
  }

  const result = networkStatusCache || {
    backendConnected: false,
    details: { reason: 'erreur_reseau', message: lastError?.message || 'Serveur inaccessible', errorId }
  };
  return result;
}


  let isMonitoring = false;
  let monitoringInterval = null;
  
/**
 * Surveille le backend avec un polling discret (60s, limité à 10min).
 * Utilise des notifications pour informer l'utilisateur sans bloquer l'écran.
 * @param {Object} [options] - Options supplémentaires.
 * @param {string} [options.context='Serveur Monitoring'] - Contexte de l'appel.
 * @returns {Promise<void>}
 */
export async function monitorBackend(options = {}) {
  const { context = 'Serveur Monitoring' } = options;

  if (isMonitoring) {
    console.log(`🚫 Surveillance déjà en cours pour ${context}`);
    return;
  }
  isMonitoring = true;

  const MAX_POLLING_DURATION = 10 * 60 * 1000;
  const pollingStartTime = Date.now();
  let retryCount = 0;
  const POLLING_INTERVAL = 60000;

  const errorId = generateString(8);

  // Vérification initiale avec timeout long (60s)
  console.log(`🔍 Vérification initiale avec timeout 60s pour ${context}...`);
  let initialCheck = await checkNetwork({ context: `${context} (initial)` });
  if (initialCheck.backendConnected) {
    console.log('✅ Backend OK dès le départ');
    await showNotification('Connexion au serveur rétablie !', 'success');
    isMonitoring = false;
    return;
  }

  await showNotification(
    'Serveur temporairement indisponible (cold start Render ?). Nous réessayons toutes les 60s.',
    'warning'
  );
  await showNotification(
    'Solutions : Rafraîchissez (F5), vérifiez Wi-Fi, ou appelez 01 23 45 67 89.',
    'info'
  );

  logError({
    context,
    errorId,
    message: 'Surveillance backend déclenchée (cold start suspecté)',
    details: { timestamp: new Date().toISOString(), initialCheck }
  });

  console.log(`🚀 Lancement surveillance serveur pour ${context}...`);

  const check = async () => {
    if (Date.now() - pollingStartTime >= MAX_POLLING_DURATION) {
      console.log('⏱️ Durée maximale atteinte, arrêt du polling.');
      await showNotification(
        'Surveillance arrêtée. Réessayez ou contactez support@llouestservices.fr.',
        'error'
      );
      stopMonitoring();
      return;
    }

    try {
      const networkStatus = await checkNetwork({ context });
      if (networkStatus.backendConnected) {
        console.log('✅ Backend disponible après cold start');
        await showNotification('Connexion au serveur rétablie !', 'success');
        logError({
          context,
          errorId,
          message: 'Serveur reconnecté avec succès',
          details: { retryCount, duration: Date.now() - pollingStartTime }
        });
        stopMonitoring();
      } else {
        throw new Error('Serveur inaccessible');
      }
    } catch (error) {
      retryCount++;
      const coldStartSuspected = error.message.includes('cold start') || networkStatusCache?.details?.coldStartSuspected;
      console.log(`❌ Serveur inaccessible (tentative ${retryCount}, cold start ? ${coldStartSuspected})...`);
      logError({
        context,
        errorId,
        message: `Échec tentative ${retryCount}: ${error.message}`,
        details: { retryCount, pollingStartTime, coldStartSuspected }
      });

      // Notification périodique (toutes les 3 tentatives)
      if (retryCount % 3 === 0) {
        await showNotification(
          `Serveur toujours indisponible (tentative ${retryCount}). Nouvelle tentative dans 60s...`,
          'warning'
        );
      }
    }
  };

  // Polling toutes les 60s
  monitoringInterval = setInterval(async () => {
    await check();
  }, POLLING_INTERVAL);

  await check();
}

/**
 * Arrête la surveillance du backend.
 */
export function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  isMonitoring = false;
  networkStatusCache = null;
}

if (!AbortController.timeout) {
  AbortController.timeout = (ms) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  };
}



/**
 * Messages d'erreur d'authentification Firebase.
 * @param {Error} error - Erreur Firebase (doit contenir le champ 'code' pour la correspondance).
 * @returns {string} Message d'erreur adapté à l'utilisateur.
 */
export const getAuthErrorMessage = (error) => {
  
  const errorMap = {
    'auth/email-already-in-use': 'Cet email est déjà utilisé. Essayez de vous connecter ou réinitialisez votre mot de passe.',
    'auth/invalid-email': 'L\'adresse email n\'est pas valide. Vérifiez le format.',
    'auth/weak-password': 'Le mot de passe est trop faible. Il doit contenir au moins 8 caractères.',
    'auth/user-not-found': 'Aucun compte trouvé avec cet email. Vérifiez ou inscrivez-vous.',
    'auth/wrong-password': 'Mot de passe incorrect. Vérifiez ou réinitialisez-le.',
    'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
    'auth/invalid-credential': 'Identifiants invalides. Vérifiez votre email ou mot de passe.', // ✅ Message ciblé pour 400
    'auth/user-disabled': 'Ce compte a été désactivé. Contactez le support.',
    'auth/operation-not-allowed': 'Cette opération n\'est pas autorisée. Contactez le support.',
    'auth/requires-recent-login': 'Veuillez vous reconnecter pour effectuer cette action.',
    'auth/invalid-verification-code': 'Code de vérification invalide. Demandez un nouvel email.',
    'auth/invalid-action-code': 'Lien de vérification ou de réinitialisation invalide ou expiré.',
    'auth/expired-action-code': 'Lien de vérification ou de réinitialisation expiré.',
    'auth/network-request-failed': 'Problème de connexion réseau. Vérifiez votre connexion.',
    'auth/missing-email': 'Aucune adresse email fournie. Veuillez entrer un email.',
  };

  const errorCode = error.code;

  if (errorCode && errorMap[errorCode]) {
    return errorMap[errorCode];
  }

  // Si c'est une erreur Firebase mais le code n'est pas mappé
  if (error.message && error.message.includes('Firebase')) {
    console.warn('Erreur Firebase non mappée:', errorCode, error.message);
    // On peut extraire le message après 'Firebase: Error' si le code est manquant
    const match = error.message.match(/Firebase: Error \((.*)\)/);
    return (match && match[1]) || 'Une erreur de service d\'authentification est survenue. Veuillez réessayer ou contacter le support.';
  }

  return null;
};

  /**
   * Vérifie si l'utilisateur est connecté.
   * @async
   * @function isAuthenticated
   * @returns {Promise<boolean>} True si l'utilisateur est connecté, sinon false.
   */
  export async function isAuthenticated(auth) {
    try {
      const user = await waitForAuthState(auth);
      return !!user;
    } catch (error) {
      console.error('Erreur vérification authentification:', error);
      return false;
    }
  };

/**
 * Dialogue de chargement avec animation personnalisée et barre de va-et-vient multicolore.
 * Utilise un design moderne et des animations fluides.
 * @param {string} title - Titre du dialogue.
 * @param {string} [icon='loading'] - Icône Lottie à afficher (nom du fichier JSON sans extension).
 * @param {boolean} [showProgress=true] - Afficher la barre d'animation va-et-vient.
 */
export async function showLoadingDialog(title, icon = 'loading', showProgress = true) {
  const isDark = isDarkMode();

  const titleClass = isDark ? 'text-slate-100' : 'text-slate-900';
  const textClass = isDark ? 'text-slate-400' : 'text-slate-500';
  const progressBg = isDark ? 'bg-slate-700' : 'bg-slate-200';

  Swal.fire({
    title: `<span class="${titleClass} font-sans font-bold">${title || 'Chargement en cours...'}</span>`,
    html: `
      <div class="p-2">
        <div class="flex flex-col items-center">
          <lottie-player 
            src="/assets/json/icons/${icon}.json" 
            background="transparent" 
            speed="1" 
            style="width: 120px; height: 120px;" 
            loop 
            autoplay
            aria-label="Animation de chargement">
          </lottie-player>

          <p class="text-center text-sm ${textClass} mt-[-10px] mb-6 px-4">
            L'opération est en cours, veuillez patienter.
          </p>
          
          ${
            showProgress
              ? `
                <div class="w-full max-w-xs px-2">
                  <div class="w-full ${progressBg} rounded-full h-2 overflow-hidden shadow-inner">
                    <div class="h-2 bg-gradient-to-r from-ll-blue to-ll-green animate-shuttle rounded-full" style="width: 30%;"></div>
                  </div>
                </div>
                <style>
                  @keyframes shuttle {
                    0% { transform: translateX(0); }
                    50% { transform: translateX(233%); }
                    100% { transform: translateX(0); }
                  }
                  .animate-shuttle {
                    animation: shuttle 1.5s ease-in-out infinite;
                  }
                </style>
              `
              : ''
          }
        </div>
      </div>
    `,
    allowOutsideClick: false,
    showConfirmButton: false,
    allowEscapeKey: false,
    backdrop: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
    background: isDark ? '#1E293B' : '#FFFFFF',
    color: isDark ? '#E2E8F0' : '#1E293B', 
    customClass: {
      popup: 'swal-wide rounded-2xl shadow-2xl backdrop-blur-sm max-w-xl',
      title: 'text-xl font-bold font-sans text-slate-900 dark:text-slate-100'
    },
    didOpen: (popup) => {
      popup.style.opacity = '0';
      popup.style.transform = 'scale(0.9) translateY(-10px)';
      setTimeout(() => {
        popup.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        popup.style.opacity = '1';
        popup.style.transform = 'scale(1) translateY(0)';
      }, 50);
    }
  });
}


/**
 * Dialogue de succès pour l'inscription.
 * @param {string} Username - Nom d'utilisateur.
 * @returns {Promise<Object>} Résultat du dialogue.
 */
export async function showSuccessSignUp(Username) {
  await swalLoaded;
  const isDark = isDarkMode();
  const bgClass = isDark ? 'bg-ll-black text-ll-white' : 'bg-ll-white text-ll-black';
  
  const message = `Bienvenue, <strong class="text-ll-blue dark:text-ll-light-blue">${Username}</strong> ! 
                   Nous sommes ravis de vous accueillir chez <strong class="font-cinzel">L&L Ouest Services</strong>.`;

  const result = await Swal.fire({
    title: 'Inscription réussie !',
    html: `
      <div class="${bgClass} p-6 rounded-xl shadow-2xl border border-ll-light-blue/20">
        <lottie-player 
          src="/assets/json/success-animation.json" 
          background="transparent" 
          speed="1" 
          style="width: 140px; height: 140px; margin: 0 auto 1.5rem;" 
          autoplay 
          loop>
        </lottie-player>
        <div class="text-center space-y-3">
          <p class="text-lg font-cinzel leading-relaxed">${message}</p>

        <h3 class="text-xl font-bold mb-3 mt-3 text-center text-green-600 dark:text-green-400 font-cinzel">Inscription réussie</h3>
        <p class="text-base text-gray-600 dark:text-gray-300 mb-4">Votre compte a été créé avec succès. Vérifiez votre boîte de réception pour confirmer votre email.</p>
        <div class="text-sm text-gray-600 dark:text-gray-300">Si vous ne recevez pas l'email, vérifiez vos spams ou contactez <a href="mailto:contact@llouestservices.fr" class="underline hover:no-underline text-ll-blue">contact@llouestservices.fr</a>.</div>
      
          <div class="flex justify-center space-x-4 text-sm">
            <span class="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 mr-1 text-green-500"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>Email envoyé</span>
            <span class="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 mr-1 text-blue-500"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>Notifications activées</span>
          </div>
        </div>
      </div>
    `,
    icon: 'success',
    showConfirmButton: true,
    confirmButtonText: 'Découvrir l\'app',
    confirmButtonColor: '#2563EB',
    allowOutsideClick: false,
    background: isDark ? '#1B1B18' : '#FDFDFC',
    color: isDark ? '#FDFDFC' : '#1B1B18',
    customClass: {
      popup: 'swal-wide',
      confirmButton: 'btn-primary font-semibold py-3 px-8 rounded-full text-lg'
    },
    didOpen: () => {
      // Animation de célébration
      const popup = Swal.getPopup();
      setTimeout(() => {
        popup.style.transform = 'scale(0.95)';
        setTimeout(() => {
          popup.style.transform = 'scale(1)';
        }, 150);
      }, 500);
    }
  });

  return result;
}

/**
 * Dialogue de succès pour la connexion.
 * Design moderne sans Lottie, avec SVG stylisé et barre de progression animée.
 * @param {Object} userData - Données utilisateur.
 */
export async function showSuccessDialog(userData) {
  // Assurez-vous que swalLoaded est une promesse résolue
  // await swalLoaded; 
  const isDark = isDarkMode();

  // Classes de thème
  const bgMain = isDark ? '#1E293B' : '#FFFFFF';
  const bgCard = isDark ? 'bg-slate-800' : 'bg-white';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';

  const firstName = (userData.name || userData.nom || 'Utilisateur').split(' ')[0];
  const isFirstLogin = !userData.lastLogin || new Date(userData.createdAt).getTime() === new Date(userData.lastLogin).getTime();
  const title = isFirstLogin ? 'Bienvenue à bord !' : 'Connexion réussie';
  const message = isFirstLogin 
    ? `Ravi de vous accueillir, <strong class="text-ll-blue dark:text-ll-light-blue font-bold">${firstName}</strong>.` 
    : `Ravi de vous revoir, <strong class="text-ll-blue dark:text-ll-light-blue font-bold">${firstName}</strong>. Votre espace vous attend.`;

  const successSvg = `
    <svg class="w-16 h-16 mx-auto text-green-500 dark:text-green-400 animate-scale-in" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" class="opacity-30"></circle>
      <path 
        d="M8.5 12.5L10.5 14.5L15.5 9.5" 
        stroke="currentColor" 
        stroke-width="2.5" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        class="animate-draw-check"
      />
    </svg>
  `;

  // Classes pour l'animation de la barre de progression (dégradé vert-bleu)
  const progressBarClass = `
    w-full h-1.5 rounded-full overflow-hidden shadow-inner 
    ${isDark ? 'bg-slate-700' : 'bg-slate-200'}
  `;
  const barGradientStyle = `
    background: linear-gradient(90deg, #10B981 0%, #3B82F6 100%); /* Green to Blue */
    width: 100%;
    animation: progress-slide 3.5s linear forwards; /* 3.5s correspond au timer */
  `;

  await Swal.fire({
    title: `<span class="${textPrimary} font-cinzel font-extrabold text-2xl">${title}</span>`,
    html: `
      <div class="${bgCard} p-6 rounded-xl shadow-2xl transition-all duration-500">
        ${successSvg}
        
        <p class="text-center text-lg ${textPrimary} font-semibold leading-relaxed mt-4 mb-3">${message}</p>
        
        <p class="text-center text-sm ${textSecondary} mb-5">
          Vous allez être redirigé(e) vers votre tableau de bord.
        </p>

        <div class="${progressBarClass}">
          <div class="h-full" style="${barGradientStyle}"></div>
        </div>
      </div>
    `,
    icon: undefined, // Supprime l'icône par défaut de Swal pour utiliser notre SVG
    showConfirmButton: false,
    allowOutsideClick: false,
    timer: 3500,
    timerProgressBar: false, // On utilise notre propre barre animée
    backdrop: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
    background: bgMain,
    color: textPrimary,
    customClass: {
      popup: 'swal-wide rounded-2xl shadow-2xl backdrop-blur-sm max-w-sm',
      title: 'p-0 pt-4 m-0',
      htmlContainer: 'p-0 m-0 pb-4'
    },
    didOpen: (popup) => {
      // Animation d'apparition du popup
      popup.style.opacity = '0';
      popup.style.transform = 'scale(0.95)';
      setTimeout(() => {
        popup.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        popup.style.opacity = '1';
        popup.style.transform = 'scale(1)';
      }, 50);
    }
  });
}

  /**
   * Invalide tous les caches d'email availability.
   * @function invalidateEmailCache
   */
export function invalidateEmailCache() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('email_availability_'));
    keys.forEach(key => {
      localStorage.removeItem(key);
      console.log('Cache email invalidé:', key);
    });
  }

/**
 * Validation robuste des champs de formulaire.
 * @param {string} field - Nom du champ.
 * @param {*} value - Valeur du champ.
 * @param {boolean} [signIn=false] - Mode connexion.
 * @param {boolean} [contact=false] - Mode contact.
 * @returns {string|null} Erreur ou null.
 */
export function validateField(field, value, signIn = false, contact = false) {
  // Vérifications de sécurité
  if (!field || typeof field !== 'string') {
    console.warn('validateField: nom de champ invalide');
    return 'Erreur de validation';
  }

  // Normalisation de la valeur
  let cleanedValue = value;
  if (typeof value === 'string') {
    cleanedValue = value.trim();
    // Éviter URIError en vérifiant si un décodage URI est nécessaire
    try {
      if (cleanedValue.includes('%') && field != 'password' && field != 'confirmPassword') {
        cleanedValue = decodeURIComponent(cleanedValue);
      }
    } catch (e) {
      console.warn(`❌ Erreur de décodage URI pour le champ ${field}:`, e);
      return 'Valeur du champ invalide (caractères non autorisés).';
    }
  } else if (value === undefined || value === null) {
    cleanedValue = '';
  }

  // Listes de validation
  const validTLDs = [
    '.com', '.org', '.net', '.edu', '.gov', '.mil', '.biz', '.info', '.co', '.io',
    '.me', '.fr', '.de', '.uk', '.ca', '.au', '.jp', '.es', '.it', '.nl', '.ru',
    '.cn', '.br', '.in', '.eu', '.ch', '.be', '.at', '.dk', '.se', '.no', '.fi',
    '.tech', '.dev', '.app', '.online', '.site', '.store', '.blog', '.shop'
  ];

  const validDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com',
    'protonmail.com', 'mail.com', 'gmx.com', 'zoho.com', 'wanadoo.fr', 'orange.fr',
    'free.fr', 'laposte.net', 'sfr.fr', 'hotmail.fr', 'yahoo.fr', 'proton.me',
    'live.com', 'msn.com', 'yandex.com', 'qq.com', '163.com', 'mail.ru'
  ];

  const validCountries = ['France', 'France (+33)'];

  switch (field.toLowerCase()) {
    // ===== EMAIL =====
    case 'email':
    case 'currentemail':
    case 'newemail':
      // 1. Vérification de la présence
      if (!cleanedValue) return "L'email est requis.";

      // 2. Vérification de la longueur totale
      if (cleanedValue.length > 254) {
        return "L'email est trop long (max 254 caractères).";
      }

      // 3. Vérification du format général avec regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanedValue)) {
        return "Format d'email invalide. Exemple : utilisateur@exemple.com";
      }

      // 4. Séparation de l'email en partie locale et domaine
      const emailParts = cleanedValue.split('@');
      if (emailParts.length !== 2) {
        return "L'email doit contenir exactement un @.";
      }

      const [localPart, domain] = emailParts;

      // 5. Vérification de la partie locale
      if (localPart.length < 1 || localPart.length > 64) {
        return "La partie locale de l'email doit contenir entre 1 et 64 caractères.";
      }

      const localPartRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
      if (!localPartRegex.test(localPart)) {
        return "La partie locale de l'email contient des caractères non autorisés.";
      }

      // 6. Vérification du domaine
      const domainLower = domain.toLowerCase();
      const domainParts = domainLower.split('.');

      if (domainParts.length < 2) {
        return "Le domaine doit contenir au moins un point et une extension (TLD).";
      }

      const tld = `.${domainParts[domainParts.length - 1]}`;

      // 6.1. Vérification des segments du domaine (hors TLD)
      for (let i = 0; i < domainParts.length - 1; i++) {
        const segment = domainParts[i];
        if (segment.length < 1 || segment.length > 63) {
          return "Un segment du domaine doit contenir entre 1 et 63 caractères.";
        }

        const segmentRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
        if (!segmentRegex.test(segment)) {
          return `Le segment de domaine "${segment}" est invalide.`;
        }
      }

      // 6.2. Vérification du TLD et des domaines connus
      if (!validTLDs.includes(tld) && !validDomains.includes(domainLower)) {
        return `Domaine non supporté. Utilisez un domaine connu (ex: gmail.com, outlook.com) ou un TLD valide (ex: ${validTLDs.slice(0, 5).join(', ')}...).`;
      }

      // ✅ Email valide
      return null;

    // ===== MOT DE PASSE =====
    case 'password':
    case 'confirmPassword':
      if (!cleanedValue) return field === 'password' ? 'Le mot de passe est requis.' : 'La confirmation du mot de passe est requise.';

      if (signIn) {
        return null;
      }

      // Validation stricte pour l'inscription ou réinitialisation
      const minLength = 8;
      if (cleanedValue.length < minLength) {
        return `Le mot de passe doit contenir au moins ${minLength} caractères.`;
      }
      if (cleanedValue.length > 128) {
        return 'Le mot de passe est trop long (max 128 caractères).';
      }

      // Vérifications de complexité
      const hasUpper = /[A-Z]/.test(cleanedValue);
      const hasLower = /[a-z]/.test(cleanedValue);
      const hasNumber = /\d/.test(cleanedValue);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(cleanedValue);

      const missing = [];
      if (!hasUpper) missing.push('une majuscule');
      if (!hasLower) missing.push('une minuscule');
      if (!hasNumber) missing.push('un chiffre');
      if (!hasSpecial) missing.push('un caractère spécial (!@#$%^&*)');

      if (missing.length > 0) {
        return `Le mot de passe doit contenir : ${missing.join(', ')}.`;
      }

      // Vérification des séquences interdites
      const forbiddenPatterns = [
        /^(.)\1{3,}$/, // Répétition excessive (ex: aaaa)
        /^\d+$/, // Uniquement chiffres (ex: 12345678)
        /^password$/i, // Mot de passe trop commun
        /^qwerty$/i, // Séquences de clavier
        /^abcde/i // Séquences simples
      ];
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(cleanedValue)) {
          return 'Le mot de passe est trop simple ou contient des séquences interdites.';
        }
      }

      return null;

    // ===== NOM =====
    case 'name':
    case 'nom':
      if (!cleanedValue) return 'Le nom complet est requis.';
      if (cleanedValue.length < 2) return 'Le nom complet doit contenir au moins 2 caractères.';
      if (cleanedValue.length > 50) return 'Le nom complet ne peut pas dépasser 50 caractères.';
      if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(cleanedValue)) {
        return 'Le nom complet ne peut contenir que des lettres, espaces, apostrophes et tirets.';
      }
      return null;

    // ===== TÉLÉPHONE =====
    case 'phone':
    case 'telephone':
      if (contact) {
        // Format international +33 (optionnel)
        if (!cleanedValue) return ''; // Optionnel en mode contact
        const intlPattern = /^\+33[\s\-]?[1-9](?:[\s\-]?\d{2}){4}$/;
        if (!intlPattern.test(cleanedValue.replace(/\s/g, ''))) {
          return 'Format : +33 6 12 34 56 78';
        }
      } else {
        
       if (!cleanedValue) return 'Le numéro de téléphone est requis.';
        // Format national français
        const nationalPattern = /^0[1-9](?:[\s\-]?\d{2}){4}$/;
        if (!nationalPattern.test(cleanedValue)) {
          return 'Format : 06 12 34 56 78 (10 chiffres)';
        }
      }
      return null;

    // ===== CODE DE VÉRIFICATION =====
    case 'code':
      if (!cleanedValue) return 'Le code de vérification est requis.';
      const codePattern = /^\d{6}$/;
      if (!codePattern.test(cleanedValue.replace(/\s/g, ''))) {
        return 'Le code doit contenir exactement 6 chiffres.';
      }
      return null;

    // ===== ADRESSE =====
    case 'postalcode':
    case 'codepostal':
      if (!cleanedValue) return 'Le code postal est requis.';
      if (!/^\d{5}$/.test(cleanedValue)) return '5 chiffres requis (ex: 49000).';
      return null;

    case 'country':
    case 'pays':
      if (!cleanedValue) return 'Le pays est requis.';
      if (!validCountries.includes(cleanedValue)) {
        return 'Pays non supporté. Sélectionnez "France" ou "France (+33)".';
      }
      return null;

    case 'city':
    case 'ville':
      if (!cleanedValue) return 'La ville est requise.';
      if (cleanedValue.length < 2 || cleanedValue.length > 50) {
        return 'La ville doit contenir entre 2 et 50 caractères.';
      }
      return null;

    case 'street':
    case 'rue':
    case 'address':
      if (!cleanedValue) return 'L\'adresse est requise.';
      if (cleanedValue.length < 5 || cleanedValue.length > 200) {
        return 'L\'adresse doit contenir entre 5 et 200 caractères.';
      }
      return null;

    // ===== MESSAGE =====
    case 'message':
      if (!cleanedValue) return 'Le message est requis.';
      if (cleanedValue.length < 10) return 'Le message doit contenir au moins 10 caractères.';
      if (cleanedValue.length > 1000) return 'Le message ne peut pas dépasser 1000 caractères.';
      return null;

    // ===== SUJETS =====
    case 'subjects':
    case 'sujet':
      if (!cleanedValue || (Array.isArray(cleanedValue) && cleanedValue.length === 0) ||
          (typeof cleanedValue === 'string' && cleanedValue.trim() === '')) {
        return 'Veuillez sélectionner au moins un sujet.';
      }
      return null;

    default:
      console.warn(`❌ Champ de validation inconnu: ${field}`);
      return null;
  }
}

/**
 * Validation robuste des champs de formulaire.
 * @param {string} field - Nom du champ.
 * @param {*} value - Valeur du champ.
 * @param {boolean} [signIn=false] - Mode connexion.
 * @param {boolean} [contact=false] - Mode contact.
 * @returns {string|null} Erreur ou null.
 */
export function validateFieldInitial(field, value, signIn = false, contact = false) {
  // Vérifications de sécurité
  if (!field || typeof field !== 'string') {
    console.warn('validateField: nom de champ invalide');
    return 'Erreur de validation';
  }

  // Normalisation de la valeur
  let cleanedValue = value;
  if (typeof value === 'string') {
    cleanedValue = value.trim();
    // Éviter URIError en vérifiant si un décodage URI est nécessaire
    try {
      if (cleanedValue.includes('%') && field != 'password' && field != 'confirmPassword') {
        cleanedValue = decodeURIComponent(cleanedValue);
      }
    } catch (e) {
      console.warn(`❌ Erreur de décodage URI pour le champ ${field}:`, e);
      return 'Valeur du champ invalide (caractères non autorisés).';
    }
  } else if (value === undefined || value === null) {
    cleanedValue = '';
  }

  // Listes de validation
  const validTLDs = [
    '.com', '.org', '.net', '.edu', '.gov', '.mil', '.biz', '.info', '.co', '.io',
    '.me', '.fr', '.de', '.uk', '.ca', '.au', '.jp', '.es', '.it', '.nl', '.ru',
    '.cn', '.br', '.in', '.eu', '.ch', '.be', '.at', '.dk', '.se', '.no', '.fi',
    '.tech', '.dev', '.app', '.online', '.site', '.store', '.blog', '.shop'
  ];

  const validDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com',
    'protonmail.com', 'mail.com', 'gmx.com', 'zoho.com', 'wanadoo.fr', 'orange.fr',
    'free.fr', 'laposte.net', 'sfr.fr', 'hotmail.fr', 'yahoo.fr', 'proton.me',
    'live.com', 'msn.com', 'yandex.com', 'qq.com', '163.com', 'mail.ru'
  ];

  const validCountries = ['France', 'France (+33)'];

  switch (field.toLowerCase()) {
    // ===== EMAIL =====
    case 'email':
    case 'currentemail':
    case 'newemail':
      // 1. Vérification de la présence
      if (!cleanedValue) return '';

      // 2. Vérification de la longueur totale
      if (cleanedValue.length > 254) {
        return "L'email est trop long (max 254 caractères).";
      }

      // 3. Vérification du format général avec regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanedValue)) {
        return "Format d'email invalide. Exemple : utilisateur@exemple.com";
      }

      // 4. Séparation de l'email en partie locale et domaine
      const emailParts = cleanedValue.split('@');
      if (emailParts.length !== 2) {
        return "L'email doit contenir exactement un @.";
      }

      const [localPart, domain] = emailParts;

      // 5. Vérification de la partie locale
      if (localPart.length < 1 || localPart.length > 64) {
        return "La partie locale de l'email doit contenir entre 1 et 64 caractères.";
      }

      const localPartRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
      if (!localPartRegex.test(localPart)) {
        return "La partie locale de l'email contient des caractères non autorisés.";
      }

      // 6. Vérification du domaine
      const domainLower = domain.toLowerCase();
      const domainParts = domainLower.split('.');

      if (domainParts.length < 2) {
        return "Le domaine doit contenir au moins un point et une extension (TLD).";
      }

      const tld = `.${domainParts[domainParts.length - 1]}`;

      // 6.1. Vérification des segments du domaine (hors TLD)
      for (let i = 0; i < domainParts.length - 1; i++) {
        const segment = domainParts[i];
        if (segment.length < 1 || segment.length > 63) {
          return "Un segment du domaine doit contenir entre 1 et 63 caractères.";
        }

        const segmentRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
        if (!segmentRegex.test(segment)) {
          return `Le segment de domaine "${segment}" est invalide.`;
        }
      }

      // 6.2. Vérification du TLD et des domaines connus
      if (!validTLDs.includes(tld) && !validDomains.includes(domainLower)) {
        return `Domaine non supporté. Utilisez un domaine connu (ex: gmail.com, outlook.com) ou un TLD valide (ex: ${validTLDs.slice(0, 5).join(', ')}...).`;
      }

      // ✅ Email valide
      return null;

    // ===== MOT DE PASSE =====
    case 'password':
    case 'confirmPassword':
      if (!cleanedValue) return '';

      if (signIn) {
        return null;
      }

      // Validation stricte pour l'inscription ou réinitialisation
      const minLength = 8;
      if (cleanedValue.length < minLength) {
        return `Le mot de passe doit contenir au moins ${minLength} caractères.`;
      }
      if (cleanedValue.length > 128) {
        return 'Le mot de passe est trop long (max 128 caractères).';
      }

      // Vérifications de complexité
      const hasUpper = /[A-Z]/.test(cleanedValue);
      const hasLower = /[a-z]/.test(cleanedValue);
      const hasNumber = /\d/.test(cleanedValue);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(cleanedValue);

      const missing = [];
      if (!hasUpper) missing.push('une majuscule');
      if (!hasLower) missing.push('une minuscule');
      if (!hasNumber) missing.push('un chiffre');
      if (!hasSpecial) missing.push('un caractère spécial (!@#$%^&*)');

      if (missing.length > 0) {
        return `Le mot de passe doit contenir : ${missing.join(', ')}.`;
      }

      // Vérification des séquences interdites
      const forbiddenPatterns = [
        /^(.)\1{3,}$/, // Répétition excessive (ex: aaaa)
        /^\d+$/, // Uniquement chiffres (ex: 12345678)
        /^password$/i, // Mot de passe trop commun
        /^qwerty$/i, // Séquences de clavier
        /^abcde/i // Séquences simples
      ];
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(cleanedValue)) {
          return 'Le mot de passe est trop simple ou contient des séquences interdites.';
        }
      }

      return null;

    // ===== NOM =====
    case 'name':
    case 'nom':
      if (!cleanedValue) return '';
      if (cleanedValue.length < 2) return 'Le nom complet doit contenir au moins 2 caractères.';
      if (cleanedValue.length > 50) return 'Le nom complet ne peut pas dépasser 50 caractères.';
      if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(cleanedValue)) {
        return 'Le nom complet ne peut contenir que des lettres, espaces, apostrophes et tirets.';
      }
      return null;

    // ===== TÉLÉPHONE =====
    case 'phone':
    case 'telephone':
      if (contact) {
        // Format international +33 (optionnel)
        if (!cleanedValue) return ''; // Optionnel en mode contact
        const intlPattern = /^\+33[\s\-]?[1-9](?:[\s\-]?\d{2}){4}$/;
        if (!intlPattern.test(cleanedValue.replace(/\s/g, ''))) {
          return 'Format : +33 6 12 34 56 78';
        }
      } else {
        
       if (!cleanedValue) return 'Le numéro de téléphone est requis.';
        // Format national français
        const nationalPattern = /^0[1-9](?:[\s\-]?\d{2}){4}$/;
        if (!nationalPattern.test(cleanedValue)) {
          return 'Format : 06 12 34 56 78 (10 chiffres)';
        }
      }
      return null;

    // ===== CODE DE VÉRIFICATION =====
    case 'code':
      if (!cleanedValue) return '';
      const codePattern = /^\d{6}$/;
      if (!codePattern.test(cleanedValue.replace(/\s/g, ''))) {
        return 'Le code doit contenir exactement 6 chiffres.';
      }
      return null;

    // ===== ADRESSE =====
    case 'postalcode':
    case 'codepostal':
      if (!cleanedValue) return '';
      if (!/^\d{5}$/.test(cleanedValue)) return '5 chiffres requis (ex: 49000).';
      return null;

    case 'country':
    case 'pays':
      if (!cleanedValue) return '';
      if (!validCountries.includes(cleanedValue)) {
        return 'Pays non supporté. Sélectionnez "France" ou "France (+33)".';
      }
      return null;

    case 'city':
    case 'ville':
      if (!cleanedValue) return '';
      if (cleanedValue.length < 2 || cleanedValue.length > 50) {
        return 'La ville doit contenir entre 2 et 50 caractères.';
      }
      return null;

    case 'street':
    case 'rue':
    case 'address':
      if (!cleanedValue) return '';
      if (cleanedValue.length < 5 || cleanedValue.length > 200) {
        return 'L\'adresse doit contenir entre 5 et 200 caractères.';
      }
      return null;

    // ===== MESSAGE =====
    case 'message':
      if (!cleanedValue) return '';
      if (cleanedValue.length < 10) return 'Le message doit contenir au moins 10 caractères.';
      if (cleanedValue.length > 1000) return 'Le message ne peut pas dépasser 1000 caractères.';
      return null;

    // ===== SUJETS =====
    case 'subjects':
    case 'sujet':
      if(!cleanedValue) return '';
      if ((Array.isArray(cleanedValue) && cleanedValue.length === 0) ||
          (typeof cleanedValue === 'string' && cleanedValue.trim() === '')) {
        return '';
      }
      return null;

    default:
      console.warn(`❌ Champ de validation inconnu: ${field}`);
      return null;
  }
}


/**
 * Évaluation de la force du mot de passe.
 * @param {string} password - Mot de passe à évaluer.
 * @returns {Object} Force, message et couleur.
 */
export function checkPasswordStrength(password) {
  let strength = 0;
  let message = '';
  let color = '';

  if (!password || password.length === 0) {
    return { strength: 0, message: 'Aucun mot de passe', color: 'text-gray-400' };
  }

  // Critères de force
  if (password.length >= 8) strength++;
  if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) strength++;
  if (password.match(/([0-9])/)) strength++;
  if (password.match(/([!,@,#,$,%,^,&,*,?,_,~])/)) strength++;
  if (password.length >= 12) strength++;

  // Messages et couleurs
  switch (strength) {
    case 0:
    case 1:
      message = 'Très faible';
      color = 'text-red-500';
      break;
    case 2:
      message = 'Faible';
      color = 'text-orange-500';
      break;
    case 3:
      message = 'Moyen';
      color = 'text-yellow-500';
      break;
    case 4:
      message = 'Bon';
      color = 'text-blue-500';
      break;
    case 5:
      message = 'Excellent';
      color = 'text-green-600 font-bold';
      break;
  }

  return { strength, message, color };
}

/**
 * Notification universelle avec SweetAlert2.
 * @param {string} message - Message à afficher.
 * @param {string} type - Type (success, error, info, warning).
 * @param {boolean} [isToast=true] - Mode toast.
 * @param {Object} [options] - Options supplémentaires.
 * @returns {Promise<Object>} Résultat de la notification.
 */
export async function showNotification(message, type, isToast = true, options = {}) {
  await swalLoaded;
  
  const iconMap = { 
    success: 'success', 
    error: 'error', 
    info: 'info', 
    warning: 'warning',
    network: 'warning'
  };
  
  const defaultOptions = {
    icon: iconMap[type] || 'info',
    title: message,
    timer: isToast ? 5000 : undefined,
    timerProgressBar: isToast,
    showConfirmButton: !isToast,
    confirmButtonText: 'OK',
    position: isToast ? 'top-end' : 'center',
    toast: isToast,
    background: isDarkMode() ? '#1B1B18' : '#FDFDFC',
    color: isDarkMode() ? '#FDFDFC' : '#1B1B18',
    customClass: {
      popup: 'shadow-lg rounded-xl',
      title: 'font-medium',
      confirmButton: 'btn-primary'
    },
    didOpen: (popup) => {
      if (isToast) {
        popup.style.fontSize = '14px';
        popup.addEventListener('mouseenter', Swal.stopTimer);
        popup.addEventListener('mouseleave', Swal.resumeTimer);
      }
    },
    ...options
  };

  try {
    const result = await Swal.fire({ ...defaultOptions, ...options });
    return result;
  } catch (error) {
    console.error('❌ Erreur affichage notification:', error);
    // Fallback avec alert() si SweetAlert2 échoue
    if (!isToast) {
      alert(message);
    }
  }
}

/**
 * Formatage de dates en français.
 * @param {string} isoString - Date ISO.
 * @returns {string} Date formatée.
 */
export function formatDate(isoString) {
  try {
    if (!isoString) return 'Date non disponible';
    
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Date invalide';
    
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris'
    });
  } catch (error) {
    console.error('❌ Erreur formatage date:', error);
    return isoString || 'N/A';
  }
}

/**
 * Génération de chaînes aléatoires sécurisées.
 * @param {number} [length=16] - Longueur.
 * @returns {string} Chaîne aléatoire.
 */
export function generateString(length = 16) {
  if (length < 1 || length > 1000) {
    throw new Error('Longueur invalide pour generateString (1-1000)');
  }

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  
  if (!crypto || !crypto.getRandomValues) {
    console.warn('⚠️ crypto.getRandomValues non disponible, utilisation de Math.random()');
    return Math.random().toString(36).substring(2, length + 2);
  }
  
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += characters.charAt(randomValues[i] % characters.length);
  }
  return result;
}

/**
 * Validation de données avec schéma personnalisé.
 * @param {Object} data - Données à valider.
 * @param {Object} schema - Schéma de validation.
 * @returns {Object} {error, value}.
 */
export function validateInput(data, schema) {
  if (!data || typeof data !== 'object') {
    return { error: { details: 'Données invalides' }, value: {} };
  }

  if (!schema || typeof schema !== 'object') {
    return { error: { details: 'Schéma de validation manquant' }, value: data };
  }

  const errors = [];
  const value = { ...data };

  for (const [key, rules] of Object.entries(schema)) {
    const input = data[key];

    // Champ requis et vide
    if (rules.required && (input === undefined || input === null || input === '')) {
      errors.push(`Le champ "${key}" est requis`);
      continue;
    }

    // Ignorer les champs non requis et vides
    if (!rules.required && (input === undefined || input === null || input === '')) {
      continue;
    }

    // Validation type
    if (input !== undefined && input !== null) {
      if (rules.type === 'string' && typeof input !== 'string') {
        errors.push(`Le champ "${key}" doit être une chaîne de caractères`);
      } else if (rules.type === 'number' && (isNaN(input) || typeof input !== 'number')) {
        errors.push(`Le champ "${key}" doit être un nombre`);
      } else if (rules.type === 'object' && typeof input !== 'object') {
        errors.push(`Le champ "${key}" doit être un objet`);
      }

      // Validation string spécifique
      if (typeof input === 'string') {
        if (rules.minLength && input.length < rules.minLength) {
          errors.push(`Le champ "${key}" doit avoir au moins ${rules.minLength} caractères`);
        }
        if (rules.maxLength && input.length > rules.maxLength) {
          errors.push(`Le champ "${key}" ne doit pas dépasser ${rules.maxLength} caractères`);
        }
        if (rules.pattern && !rules.pattern.test(input)) {
          errors.push(`Le format du champ "${key}" est invalide`);
        }
      }

      // Validation number spécifique
      if (typeof input === 'number') {
        if (rules.min !== undefined && input < rules.min) {
          errors.push(`Le champ "${key}" doit être ≥ ${rules.min}`);
        }
        if (rules.max !== undefined && input > rules.max) {
          errors.push(`Le champ "${key}" doit être ≤ ${rules.max}`);
        }
      }

      // Validation enum
      if (rules.enum && !rules.enum.includes(input)) {
        errors.push(`Le champ "${key}" doit être: ${rules.enum.slice(0, 3).join(', ')}${rules.enum.length > 3 ? '...' : ''}`);
      }
    }
  }

  return errors.length > 0 
    ? { error: { details: errors.join('. ') }, value } 
    : { error: null, value };
}

/**
 * Gestion des tokens JWT.
 * @returns {string|null} Token stocké.
 */
export function getStoredToken() {
  try {
    const token = localStorage.getItem('jwt');
    if (!token) return null;
    
    // Vérification basique de validité
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) {
      console.warn('⚠️ Token expiré détecté, suppression');
      clearStoredToken();
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('❌ Erreur lecture token:', error);
    clearStoredToken();
    return null;
  }
}

/**
 * Stocke le token JWT.
 * @param {string} token - Token.
 * @param {string} role - Rôle.
 * @returns {boolean} Succès.
 */
export function setStoredToken(token, role) {
  if (typeof token !== 'string' || token.length < 10) {
    console.warn('⚠️ Tentative de stockage d\'un token invalide');
    return false;
  }

  try {
    localStorage.setItem('jwt', token);
    if (role && typeof role === 'string') {
      localStorage.setItem('userRole', role);
    }
    console.log('✅ Token JWT stocké avec succès');
    document.dispatchEvent(new CustomEvent('auth:updated')); // Dispatch pour détection rapide
    return true;
  } catch (error) {
    console.error('❌ Erreur stockage token:', error);
    return false;
  }
}

/**
 * Efface le token JWT.
 */
export function clearStoredToken() {
  try {
    localStorage.removeItem('jwt');
    localStorage.removeItem('userRole');
    console.log('✅ Token JWT supprimé');
    document.dispatchEvent(new CustomEvent('auth:updated')); // Dispatch pour détection rapide
  } catch (error) {
    console.error('❌ Erreur suppression token:', error);
  }
}

/**
 * Attend l'état d'authentification Firebase.
 * @async
 * @function waitForAuthState
 * @param auth Insatnce d'aplication Firebase
 * @returns {Promise<Object|null>} Utilisateur courant ou null si non authentifié.
 */
export async function waitForAuthState(auth) {
  return new Promise((resolve, reject) => {
    if (!auth) {
      reject(new Error('Firebase Auth non initialisé'));
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, (error) => {
      unsubscribe();
      reject(new Error(getAuthErrorMessage(error) || 'Erreur lors de la vérification de l\'état d\'authentification'));
    });
  });
}

/**
 * Garde d'authentification.
 * @returns {boolean} Authentifié.
 */
export function authGuard() {
  const hasUser = !!(auth && auth.currentUser);
  const hasToken = !!getStoredToken();
  return hasUser && hasToken;
}

/**
 * Garde de rôle.
 * @param {string[]} allowedRoles - Rôles autorisés.
 * @returns {boolean} Autorisé.
 */
export function roleGuard(allowedRoles) {
  if (!Array.isArray(allowedRoles)) {
    console.warn('⚠️ roleGuard: allowedRoles doit être un tableau');
    return false;
  }

  const userRole = localStorage.getItem('userRole') || 'client';
  const authorized = allowedRoles.includes(userRole);
  
  if (!authorized) {
    console.warn(`❌ Accès refusé: rôle "${userRole}" non autorisé pour [${allowedRoles.join(', ')}]`);
  }
  
  return authorized;
}


/**
 * Récupère le logo en base64 depuis une URL publique.
 * @returns {Promise<string>} - Chaîne base64 du logo.
 * @throws {Error} - Si le chargement échoue.
 */
export async function fetchLogoBase64() {
  try {
    const response = await fetch('/assets/images/logo.png');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erreur lors du chargement du logo', error);
    return '';
  }
}


/**
 * Requête API simplifiée sans checks réseau avancés ni retries.
 * Effectue un fetch unitaire avec gestion basique d'auth, timeout, et erreurs.
 * Utilise les options pour configurer, mais sans relance automatique en cas d'erreur réseau.
 * Ne déclenche pas handleApiError directement pour éviter les doubles notifications.
* @function apiFetch
 * @param {string} endpoint - Endpoint API (ex. : '/contact').
 * @param {string} [method='GET'] - Méthode HTTP (GET, POST, PUT, DELETE).
 * @param {Object|null} [body=null] - Corps de la requête (JSON pour POST/PUT/PATCH).
 * @param {boolean} [requireAuth=true] - Si true, ajoute le token Bearer (sinon skip).
 * @param {Object} [options={}] - Options supplémentaires.
 * @param {number} [options.timeout=120000] - Timeout en ms (défaut : 120s pour cold starts).
 * @param {string} [options.context='Général'] - Contexte pour formatErrorMessage.
 * @param {boolean} [options.retryOnColdStart=false] - Auto-retry 2x sur status null (cold start).
 * @returns {Promise<Object|undefined>} - Réponse JSON/text ou undefined en cas d'erreur non critique.
 * @throws {Error} - En cas d'erreur critique (ex. : missing token, timeout, fetch fail).
 */
export async function apiFetch(endpoint, method = 'GET', body = null, requireAuth = true, options = {}) {
  const { 
    timeout = 120000, // 2 minutes par défaut
    context = 'Général',
    retryOnColdStart = false // Nouveau : auto-retry sur cold start
  } = options;

  const headers = new Headers({ 'Content-Type': 'application/json' });

  if (requireAuth) {
    const token = getStoredToken();
    if (!token) {
      const error = new Error('Token d\'authentification manquant');
      error.reason = 'missing_token';
      error.isCritical = true;
      error.context = context;
      throw error;
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Fonction retry pour cold start
  const performFetch = async (retryCount = 0) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestConfig = {
      method,
      headers,
      signal: controller.signal,
      cache: 'no-cache',
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      requestConfig.body = body instanceof FormData ? body : JSON.stringify(body);
      if (body instanceof FormData) {
        headers.delete('Content-Type');
      }
    }

    console.log(`🚀 API ${method} ${endpoint} (tentative ${retryCount + 1})`);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, requestConfig);
      clearTimeout(timeoutId);

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const { message, reason, suggestion, isCritical } = formatErrorMessage(
          response.status,
          data?.message || data || response.statusText,
          context
        );
        const error = new Error(message);
        error.status = response.status;
        error.reason = reason;
        error.suggestion = suggestion;
        error.isCritical = isCritical;
        error.context = context;
        error.backendMessage = data?.message || data || null;
        throw error;
      }

      console.log(`✅ API ${method} ${endpoint} OK`);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Le serveur est injoignable. Vérifiez votre connexion internet ou réessayez plus tard.');
        timeoutError.reason = 'timeout';
        timeoutError.isCritical = true;
        timeoutError.context = context;
        throw timeoutError;
      }

      if (
        error.message?.includes('NetworkError') ||
        error.message?.includes('Failed to fetch') ||
        error.name === 'TypeError'
      ) {
        error.message = 'Le serveur est indisponible ou en maintenance pour le moment. Veuillez réessayer plus tard.';
        error.reason = 'network';
        error.isCritical = true;
        error.context = context;
      }

      const isColdStart = retryOnColdStart && (error.message.includes('null') || error.message.includes('CORS') || retryCount < 2);
      if (isColdStart && retryCount < 2) {
        console.log(`🔍 Cold start suspecté pour ${endpoint} : retry dans 5s (tentative ${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return performFetch(retryCount + 1);
      }

      error.context = context;
      console.error(`❌ Erreur API ${method} ${endpoint}:`, error);
      throw error;
    }
  };

  return await performFetch();
}


/**
 * Formatage intelligent des messages d'erreur API.
 * @param {number} status - Code de statut HTTP.
 * @param {string} [serverMessage] - Message renvoyé par le serveur (optionnel).
 * @param {string} [context='Général'] - Contexte de l'erreur (par exemple, 'Inscription', 'Connexion').
 * @returns {Object} Objet contenant le message formaté, la raison, et une suggestion d'action.
 */
function formatErrorMessage(status, serverMessage = '', context = 'Général') {
  // Messages par défaut pour chaque code de statut HTTP
  const statusMessages = {
    // 1xx - Réponses informatives
    100: {
      message: 'Requête en cours de traitement.',
      reason: 'continue',
      suggestion: 'Veuillez patienter pendant que le serveur traite votre requête.',
    },
    101: {
      message: 'Changement de protocole demandé.',
      reason: 'switching_protocols',
      suggestion: 'Le serveur change de protocole. Contactez le support si cela persiste.',
    },
    102: {
      message: 'Traitement en cours.',
      reason: 'processing',
      suggestion: 'Le serveur traite votre demande. Veuillez patienter.',
    },

    // 2xx - Succès
    200: {
      message: 'Requête réussie.',
      reason: 'success',
      suggestion: 'Aucune action nécessaire.',
    },
    201: {
      message: 'Ressource créée avec succès.',
      reason: 'created',
      suggestion: 'Vérifiez la ressource créée dans votre tableau de bord.',
    },
    202: {
      message: 'Requête acceptée, en cours de traitement.',
      reason: 'accepted',
      suggestion: 'Votre demande est en cours. Vous recevrez une notification une fois terminée.',
    },
    204: {
      message: 'Requête traitée, aucune donnée renvoyée.',
      reason: 'no_content',
      suggestion: 'L\'action a été effectuée avec succès.',
    },

    // 3xx - Redirections
    301: {
      message: 'Ressource déplacée de manière permanente.',
      reason: 'moved_permanently',
      suggestion: 'Mettez à jour vos favoris ou contactez le support pour la nouvelle URL.',
    },
    302: {
      message: 'Ressource temporairement déplacée.',
      reason: 'found',
      suggestion: 'Suivez la redirection ou réessayez plus tard.',
    },
    304: {
      message: 'Aucune modification depuis la dernière requête.',
      reason: 'not_modified',
      suggestion: 'Votre cache est à jour. Aucune action nécessaire.',
    },
    307: {
      message: 'Redirection temporaire.',
      reason: 'temporary_redirect',
      suggestion: 'Suivez la redirection ou réessayez plus tard.',
    },
    308: {
      message: 'Redirection permanente.',
      reason: 'permanent_redirect',
      suggestion: 'Mettez à jour vos liens pour utiliser la nouvelle adresse.',
    },

    // 4xx - Erreurs client
    400: {
      message: 'Requête invalide. Vérifiez vos données.',
      reason: 'bad_request',
      suggestion: 'Corrigez les informations saisies et réessayez.',
    },
    401: {
      message: 'Session expirée ou accès non autorisé.',
      reason: 'unauthorized',
      suggestion: 'Veuillez vous reconnecter ou vérifier vos identifiants.',
    },
    403: {
      message: 'Accès refusé. Permissions insuffisantes.',
      reason: 'forbidden',
      suggestion: 'Contactez l\'administrateur pour vérifier vos autorisations.',
    },
    404: {
      message: 'Ressource introuvable.',
      reason: 'not_found',
      suggestion: 'Vérifiez l\'URL ou contactez le support si vous pensez que c\'est une erreur.',
    },
    405: {
      message: 'Méthode non autorisée.',
      reason: 'method_not_allowed',
      suggestion: 'Vérifiez la méthode de requête utilisée (GET, POST, etc.).',
    },
    406: {
      message: 'Format de réponse non acceptable.',
      reason: 'not_acceptable',
      suggestion: 'Vérifiez les en-têtes de votre requête ou contactez le support.',
    },
    408: {
      message: 'Délai de requête dépassé.',
      reason: 'request_timeout',
      suggestion: 'Réessayez dans quelques instants ou vérifiez votre connexion.',
    },
    409: {
      message: 'Conflit de ressource.',
      reason: 'conflict',
      suggestion: 'Vérifiez si la ressource existe déjà ou contactez le support.',
    },
    410: {
      message: 'Ressource supprimée définitivement.',
      reason: 'gone',
      suggestion: 'Cette ressource n\'est plus disponible. Contactez le support pour plus d\'informations.',
    },
    413: {
      message: 'Données envoyées trop volumineuses.',
      reason: 'payload_too_large',
      suggestion: 'Réduisez la taille des données envoyées et réessayez.',
    },
    414: {
      message: 'URL trop longue.',
      reason: 'uri_too_long',
      suggestion: 'Simplifiez l\'URL ou contactez le support.',
    },
    415: {
      message: 'Type de média non supporté.',
      reason: 'unsupported_media_type',
      suggestion: 'Vérifiez le format des données envoyées (ex. JSON, XML).',
    },
    422: {
      message: 'Données invalides pour le traitement.',
      reason: 'unprocessable_entity',
      suggestion: 'Vérifiez les champs requis ou le format des données.',
    },
    429: {
      message: 'Trop de requêtes. Réessayez dans 30 secondes.',
      reason: 'too_many_requests',
      suggestion: 'Attendez quelques instants avant de réessayer.',
    },

    // 5xx - Erreurs serveur
    500: {
      message: 'Erreur interne du serveur.',
      reason: 'internal_server_error',
      suggestion: 'L\'équipe technique a été notifiée. Réessayez plus tard.',
    },
    501: {
      message: 'Fonctionnalité non implémentée.',
      reason: 'not_implemented',
      suggestion: 'Cette fonctionnalité n\'est pas encore disponible. Contactez le support.',
    },
    502: {
      message: 'Mauvaise passerelle. Service indisponible.',
      reason: 'bad_gateway',
      suggestion: 'Le serveur est temporairement indisponible. Réessayez plus tard.',
    },
    503: {
      message: 'Service surchargé.',
      reason: 'service_unavailable',
      suggestion: 'Le serveur est surchargé. Réessayez dans quelques minutes.',
    },
    504: {
      message: 'Délai de passerelle dépassé.',
      reason: 'gateway_timeout',
      suggestion: 'Le serveur est lent. Réessayez plus tard.',
    },
    505: {
      message: 'Version HTTP non supportée.',
      reason: 'http_version_not_supported',
      suggestion: 'Vérifiez la version HTTP utilisée ou contactez le support.',
    },
    507: {
      message: 'Espace de stockage insuffisant.',
      reason: 'insufficient_storage',
      suggestion: 'Le serveur manque d\'espace. Contactez le support.',
    },
    508: {
      message: 'Boucle de requête détectée.',
      reason: 'loop_detected',
      suggestion: 'Une erreur de configuration a été détectée. Contactez le support.',
    },
  };

  // Récupérer les informations pour le code de statut
  const errorInfo = statusMessages[status] || {
    message: `Erreur HTTP ${status}`,
    reason: 'unknown',
    suggestion: 'Une erreur inconnue est survenue. Contactez le support à contact@llouestservices.fr.',
  };

  let formattedMessage = errorInfo.message;

  // Ajouter des détails du serveur si disponibles et pertinents
  if (serverMessage && serverMessage !== 'undefined') {
    let serverDetails = serverMessage;
    if (typeof serverMessage === 'object') {
      try {
        serverDetails = JSON.stringify(serverMessage);
      } catch {
        serverDetails = '[objet non sérialisable]';
      }
    }
    if (status >= 400 && status < 500) {
      // Pour les erreurs client, inclure les détails du serveur
      formattedMessage += ` Détails: ${serverDetails}`;
    } else if (status >= 500) {
      // Pour les erreurs serveur, indiquer que l'équipe est notifiée
      formattedMessage += ' (Erreur technique notifiée)';
    }
  }

  // Personnalisation par contexte
  switch (context.toLowerCase()) {
    case 'inscription':
      if (status === 400) {
        errorInfo.suggestion = 'Vérifiez votre email, mot de passe ou autres champs saisis.';
      } else if (status === 401 || status === 403) {
        errorInfo.suggestion = 'Vérifiez vos identifiants ou essayez de réinitialiser votre mot de passe.';
      }
      break;
    case 'connexion':
      if (status === 401) {
        errorInfo.suggestion = 'Identifiants incorrects. Essayez de réinitialiser votre mot de passe.';
      } else if (status === 403) {
        errorInfo.suggestion = 'Votre compte peut être restreint. Contactez le support.';
      }
      break;
    case 'paiement':
      if (status === 400) {
        errorInfo.suggestion = 'Vérifiez les informations de paiement saisies.';
      } else if (status === 402) {
        errorInfo.message = 'Paiement requis.';
        errorInfo.reason = 'payment_required';
        errorInfo.suggestion = 'Veuillez compléter le paiement pour continuer.';
      }
      break;
    case 'profil':
      if (status === 403) {
        errorInfo.suggestion = 'Vous n\'avez pas les autorisations pour modifier ce profil.';
      } else if (status === 404) {
        errorInfo.suggestion = 'Le profil demandé n\'existe pas. Vérifiez votre identifiant.';
      }
      break;
  }

  return {
    message: formattedMessage,
    reason: errorInfo.reason,
    suggestion: errorInfo.suggestion,
    isCritical: status >= 500 || [401, 403].includes(status),
  };
}


/**
 * Gestionnaire d'erreurs API simplifié pour la production.
 * Traite l'erreur, affiche un modal ou toast concis, et retourne une erreur enrichie.
 * Affiche le message de formatErrorMessage et le message brut du backend.
 * @param {Error} error - Erreur principale.
 * @param {string} [defaultMessage='Une erreur est survenue'] - Message par défaut.
 * @param {Object} [options] - Options supplémentaires.
 * @param {string} [options.context='API générale'] - Contexte de l'erreur.
 * @param {boolean} [options.isCritical=false] - Indique si l'erreur est critique.
 * @param {boolean} [options.interrupt=true] - Throw l'erreur après gestion.
 * @param {string} [options.sourceContext='Général'] - Contexte source pour personnalisation du modal.
 * @param {boolean} [options.isToast=false] - Affiche en mode toast au lieu de modal.
 * @param {string} [options.iconSvg] - Code SVG de l'icône à afficher (optionnel).
 * @param {Array} [options.actions=[]] - Actions personnalisées à afficher dans le modal.
 * @returns {Promise<Error>} Erreur enrichie (ne throw pas sauf si interrupt=true).
 */
export async function handleApiError(error, defaultMessage = 'Une erreur est survenue', options = {}) {
  const {
    context = 'Général',
    sourceContext = 'général',
    isCritical = false,
    iconSvg = `<svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    actions = [],
    interrupt = true,
    isToast = false,
  } = options;

  let errorMessage = defaultMessage;
  let msg = error.message;
  let reason = error.reason || 'inconnu';
  let backendMessage = error.backendMessage || null;
  const errorId = generateString(8);

  // Prioriser le message du backend si disponible
  if (backendMessage) {
    errorMessage = backendMessage;
  } else if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    reason = 'erreur_reseau';
    errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion ou réessayez plus tard.';
  } else if (errorMessage.includes('Timeout')) {
    reason = 'timeout';
    errorMessage = 'La requête a pris trop de temps. Réessayez plus tard.';
  } else if (errorMessage.includes('offline')) {
    reason = 'navigateur_hors_ligne';
    errorMessage = 'Vous êtes hors ligne. Vérifiez votre connexion internet.';
  }

  // Logger l'erreur sans diagnostics
  logError({
    context,
    errorId,
    message: errorMessage,
    details: { error, sourceContext, reason, backendMessage },
  });

  // Afficher le modal ou toast avec actions intégrées
  if (!isShowingErrorModal) {
    await showApiErrorDialog(errorMessage,msg, context, isCritical, reason, { sourceContext, isToast, iconSvg, actions }, defaultMessage);
  }

  // Créer une erreur enrichie
  const enhancedError = new Error(errorMessage);
  enhancedError.context = context;
  enhancedError.isCritical = isCritical;
  enhancedError.errorId = errorId;
  enhancedError.reason = reason;
  enhancedError.backendMessage = backendMessage;

  if (interrupt) throw enhancedError;
  return enhancedError;
}

/**
 * Affiche un modal d'erreur concis et professionnel pour la production avec un design amélioré.
 * Affiche le message d'erreur (backend ou formatErrorMessage) avec suggestions et contexte.
 * Supporte le mode toast pour erreurs mineures et intègre des actions personnalisées.
 * Améliorations : design moderne, animations fluides, typographie élégante, accessibilité, responsive.
 * @param {string|Object} errorMessage - Message principal de l'erreur (chaîne ou objet JSON).
 * @param {string} context - Contexte global.
 * @param {boolean} isCritical - Indique si l'erreur est critique.
 * @param {string} reason - Raison principale.
 * @param {Object} details - Détails supplémentaires.
 * @param {string} [details.sourceContext='Général'] - Contexte source pour personnalisation.
 * @param {boolean} [details.isToast=false] - Affiche en mode toast.
 * @param {string} [details.iconSvg] - Code SVG de l'icône à afficher.
 * @param {Array} [details.actions=[]] - Tableau d'actions {text, href, class, svg}.
 * @param {string} details.errorId - ID unique de l'erreur pour le support.
 * @param {string} defaultMessage - Message par défaut.
 * 
 * @returns {Promise<void>}
 */
export async function showApiErrorDialog(errorMessage,msg, context, isCritical, reason, { sourceContext = 'Général', isToast = false, iconSvg, actions = [], errorId }, defaultMessage) {
  if (!Swal) {
    console.error('SweetAlert2 n\'est pas chargé.');
    return;
  }

  if (isShowingErrorModal) return;
  isShowingErrorModal = true;

  const isDark = isDarkMode();
  const primaryColor = 'text-ll-blue'; 

  const severityClass = isCritical
    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
  const severityColor = isCritical
    ? 'text-red-600 dark:text-red-400'
    : 'text-white-600 dark:text-white-400';
  const confirmButtonBaseClass = 'px-4 py-2 rounded-md shadow-md font-Cinzel text-sm flex items-center justify-center transition-all duration-300 hover:scale-[1.03]';
  const confirmButtonClass = isCritical
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-ll-blue hover:bg-blue-600 text-white';

  let title = isCritical ? 'Erreur Critique' : 'Problème Technique';
  let suggestions = `<p class="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">Pour une assistance, contactez : <a href="mailto:contact@llouestservices.fr" class="underline hover:no-underline ${primaryColor} font-medium">contact@llouestservices.fr</a></p>`;

  // Formatage du message affiché
  let displayErrorMessage = defaultMessage;
  if (typeof errorMessage === 'string') {
    displayErrorMessage = errorMessage || defaultMessage;
  } else if (typeof errorMessage === 'object' && errorMessage !== null) {
    displayErrorMessage = errorMessage.error || JSON.stringify(errorMessage, null, 2);
  }

  // Suggestions personnalisées basées sur le contexte
  switch (sourceContext.toLowerCase()) {
    case 'connexion':
      title = 'Erreur de Connexion';
      if (displayErrorMessage.includes('Identifiants invalides') || displayErrorMessage.includes('Mot de passe incorrect')) {
        suggestions = `<p class="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">Vérifiez votre email et mot de passe ou <a href="/pages/auth/password-reset.html" class="${primaryColor} underline hover:no-underline">réinitialisez votre mot de passe</a>.</p>`;
      }
      break;
    case 'inscription':
      title = 'Échec de l\'Inscription';
      if (displayErrorMessage.includes('Cet email est déjà utilisé')) {
        suggestions = `<p class="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">Cet email est déjà associé à un compte. <a href="/pages/auth/signin.html" class="${primaryColor} underline hover:no-underline">Connectez-vous</a> ou utilisez un autre email.</p>`;
      }
      break;
    case 'api':
    case 'erreur_reseau':
    case 'navigateur_hors_ligne':
      title = 'Erreur de Réseau';
      suggestions = `<p class="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">Vérifiez votre connexion Internet ou réessayez plus tard.</p>`;
      break;
    default:
      suggestions += `<p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Contexte technique : ${context}</p>`;
  }


// Génération des boutons d'actions en colonne simple
let actionsHtml = '';
if (actions.length > 0) {
    
    const wrapperClass = 'grid grid-cols-1 gap-3';
    
    // Contenu de la grille
    let gridContent = '';
    actions.forEach((action) => {
        // Chaque action prend la pleine largeur de la colonne unique
        gridContent += `
            <a href="${action.href}" 
               class="${action.class} px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-300 hover:scale-[1.01] w-full" 
               role="button" 
               aria-label="${action.text}">
                ${action.svg ? `<span class="mr-2">${action.svg}</span>` : ''}
                ${action.text}
            </a>
        `;
    });
    
    // Ajout de la structure finale
    actionsHtml = `
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="${wrapperClass}">
                ${gridContent}
            </div>
        </div>
    `;

}

  // Configuration du toast ou du modal
  if (isToast) {
    await showNotification(displayErrorMessage, 'error', true, {
      title,
      timer: 3000,
      position: 'top-end',
      showConfirmButton: false,
    });
  } else {
    await Swal.fire({
      title: `<span class="${severityColor} font-cinzel text-lg sm:text-xl">${title}</span>`,
      html: `
        <div class="${isDark ? 'text-ll-white' : 'text-ll-black'} p-2 sm:p-4 font-Cinzel">
          <div class="flex flex-col items-center">
            <div class="flex justify-center mb-3 sm:mb-4">${iconSvg || ''}</div>
            <p id="swal-content" class="text-sm sm:text-base text-center text-gray-800 dark:text-gray-100 mb-3 sm:mb-4 font-medium" style="white-space: pre-wrap; word-break: break-word;">
              ${displayErrorMessage}
            </p>

            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">${msg}</p>
            <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center">${suggestions}</div>
            ${actionsHtml}
            <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 w-full"></div>
          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: isCritical ? 'Contacter le support' : 'Réessayer',
      showCancelButton: !isCritical,
      cancelButtonText: 'Fermer',
      background: isDark ? '#1B1B18' : '#FDFDFC',
      color: isDark ? '#FDFDFC' : '#1B1B18',
      customClass: {
      popup: 'swal-wide rounded-2xl shadow-2xl backdrop-blur-sm max-w-xs lg:max-w-lg',
      title: 'text-xl font-bold font-sans text-slate-900 dark:text-slate-100',

        htmlContainer: 'p-0 m-0',
        confirmButton: `${confirmButtonBaseClass} ${confirmButtonClass}`,
        cancelButton: `${confirmButtonBaseClass} bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200`,
      },
      allowOutsideClick: !isCritical,
      allowEscapeKey: !isCritical,
      focusConfirm: true,
      didOpen: (popup) => {
        popup.style.opacity = '0';
        popup.style.transform = 'scale(0.9) translateY(-10px)';
        setTimeout(() => {
          popup.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
          popup.style.opacity = '1';
          popup.style.transform = 'scale(1) translateY(0)';
        }, 50);

       
      },
      willClose: () => {
        isShowingErrorModal = false;
      },
    });
  }

  isShowingErrorModal = false;
}

/**
 * Vérification et redirection d'authentification.
 * @param {boolean} shouldBeAuthenticated - Doit être authentifié.
 * @param {string} redirectAuthenticatedTo - Redirection si authentifié.
 * @param {string} redirectUnauthenticatedTo - Redirection si non authentifié.
 * @returns {Promise<boolean>} Succès.
 */
export async function checkAndRedirect(shouldBeAuthenticated, redirectAuthenticatedTo, redirectUnauthenticatedTo) {
  if (!auth) {
    await showNotification('Service d\'authentification non disponible', 'error', false);
    return false;
  }

  const isAuthenticated = authGuard();

  if (shouldBeAuthenticated && !isAuthenticated) {
    await showNotification('Veuillez vous connecter pour accéder à cette page', 'warning', false);
    setTimeout(() => {
      window.location.href = redirectUnauthenticatedTo || '/auth/signin';
    }, 1500);
    return false;
  }

  if (!shouldBeAuthenticated && isAuthenticated) {
    await showNotification('Vous êtes déjà connecté ! Redirection...', 'info', false);
    setTimeout(() => {
      window.location.href = redirectAuthenticatedTo || '/dashboard';
    }, 1000);
    return false;
  }

  return true;
}

/**
 * Lightbox pour images - VERSION FIXEE: Évite les erreurs Alpine en parsant data attr au lieu d'injecter JSON direct dans x-data
 * @param {string[]} images - Images.
 * @param {number} [initialIndex=0] - Index initial.
 * @param {string|string[]} [captions=''] - Légende(s) (chaîne ou tableau pour dynamique).
 */
export function openLightbox(images, initialIndex = 0, captions = '') {
  if (!Array.isArray(images) || images.length === 0) {
    console.warn('⚠️ openLightbox: images doit être un tableau non vide');
    return;
  }

  // Compatibilité : si captions est une chaîne, la convertir en tableau singleton
  if (!Array.isArray(captions)) {
    captions = [captions];
  }

  let lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    lightbox.remove(); // Nettoyage si existant
  }

  lightbox = document.createElement('div');
  lightbox.className = 'lightbox fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4 transition-opacity duration-300 opacity-0';
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('tabindex', '-1');

  const dataObj = {
    currentIndex: initialIndex,
    images: images,
    captions: captions
  };

  const lightboxContent = document.createElement('div');
  lightboxContent.className = 'lightbox-content relative max-w-[95vw] max-h-[95vh]';
  lightboxContent.dataset.lightboxData = JSON.stringify(dataObj); // Safe pour dataset

  // x-data simple: parse dataset en init
  lightboxContent.setAttribute('x-data', '{ currentIndex: 0, images: [], captions: [], init() { const data = JSON.parse(this.$el.dataset.lightboxData || "{}"); Object.assign(this, data); this.$watch("currentIndex", () => this.loadImage()); this.loadImage(); }, nextImage() { this.currentIndex = (this.currentIndex + 1) % this.images.length; }, prevImage() { this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length; }, closeLightbox() { const lightbox = this.$el.closest(".lightbox"); if (lightbox) { document.body.style.overflow = "auto"; lightbox.classList.remove("opacity-100"); lightbox.classList.add("opacity-0"); setTimeout(() => { lightbox.remove(); }, 300); } } , loadImage() { const img = this.$el.querySelector("img"); if (img) { img.src = ""; img.src = this.images[this.currentIndex]; img.alt = this.captions[this.currentIndex] || ""; } } }');
  lightboxContent.setAttribute('x-on:keydown.escape.window', 'closeLightbox');
  lightboxContent.setAttribute('x-on:keydown.arrow-right.window', 'nextImage');
  lightboxContent.setAttribute('x-on:keydown.arrow-left.window', 'prevImage');
  lightboxContent.setAttribute('x-init', '$el.focus()');

  // Contenu HTML (sans ${} dynamiques)
  lightboxContent.innerHTML = `
    <!-- Bouton fermer -->
    <button class="lightbox-close !absolute -top-12 right-0 text-white text-2xl cursor-pointer hover:text-ll-blue transition-all duration-200 z-10" 
            aria-label="Fermer la lightbox" 
            x-on:click="closeLightbox">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6">
        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
    </button>
    
    <!-- Contenu principal -->
    <div class="relative w-full h-full flex items-center justify-center">
      <!-- Précédent -->
      <button class="absolute left-4 z-10 text-white text-3xl cursor-pointer hover:text-ll-blue transition-all duration-200 opacity-75 hover:opacity-100" 
              aria-label="Image précédente" 
              x-on:click="prevImage" 
              x-show="images.length > 1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-8 h-8">
          <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12"/>
        </svg>
      </button>
      
      <!-- Image principale -->
      <div class="relative flex items-center justify-center w-full h-full">
        <img x-ref="mainImage"
             src="" 
             alt=""
             class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl transition-all duration-300 cursor-zoom-in hover:cursor-zoom-out"
             loading="lazy"
             onerror="this.src='/assets/images/logo.png'; this.alt='Image indisponible';">
        
        <!-- Overlay de chargement (caché par défaut) -->
        <div x-show="false" 
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:leave="transition ease-in duration-200"
             class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <lottie-player src="/assets/json/animation.json" 
                        background="transparent" 
                        speed="1" 
                        style="width: 60px; height: 60px;" 
                        loop autoplay>
          </lottie-player>
        </div>
      </div>
      
      <!-- Suivant -->
      <button class="absolute right-4 z-10 text-white text-3xl cursor-pointer hover:text-ll-blue transition-all duration-200 opacity-75 hover:opacity-100" 
              aria-label="Image suivante" 
              x-on:click="nextImage" 
              x-show="images.length > 1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-8 h-8">
          <path fill="currentColor" d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12"/>
        </svg>
      </button>
    </div>
    
    <!-- Légende -->
    <div class="lightbox-caption absolute -bottom-12 left-0 right-0 text-center text-white text-sm font-medium leading-tight px-4 z-10"
         x-text="captions[currentIndex] || 'Image ' + (currentIndex + 1) + ' sur ' + images.length"
         x-show="captions[currentIndex] || images.length > 1">
    </div>
    
    <!-- Compteur -->
    <div class="absolute -top-12 left-0 text-white text-sm font-medium z-10" 
         x-show="images.length > 1">
      <span x-text="currentIndex + 1"></span> / <span x-text="images.length"></span>
    </div>
  `;

  lightbox.appendChild(lightboxContent);
  document.body.appendChild(lightbox);

  // Animation d'apparition
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    lightbox.classList.remove('opacity-0');
    lightbox.classList.add('opacity-100');
  });

  // Gestion clic extérieur
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      const closeBtn = lightboxContent.querySelector('.lightbox-close');
      if (closeBtn) closeBtn.click();
    }
  }, { once: false }); // Re-attach if needed

  // Focus management pour accessibilité
  const focusableElements = lightboxContent.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  lightboxContent.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    }
  });

  firstFocusable?.focus();

  // Refresh AOS si disponible
  if (typeof AOS !== 'undefined') {
    setTimeout(() => AOS.refresh(), 100);
  }

  // Cleanup on remove
  const observer = new MutationObserver(() => {
    if (!document.body.contains(lightbox)) {
      document.body.style.overflow = 'auto';
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true });
}



/**
 * Validation d'étape de formulaire.
 * @param {HTMLElement} stepElement - Élément étape.
 * @returns {boolean} Valide.
 */
export function validateFormStep(stepElement) {
  if (!stepElement || !(stepElement instanceof HTMLElement)) {
    console.warn('⚠️ validateFormStep: stepElement invalide');
    return false;
  }

  const inputs = stepElement.querySelectorAll('input[required]:not([type="hidden"]), select[required]:not(.hidden), textarea[required]');
  let isValid = true;
  const errors = [];

  inputs.forEach(input => {
    if (!input.name) {
      console.warn('⚠️ Input sans attribut name trouvé:', input);
      return;
    }

    const field = input.name.toLowerCase();
    const value = input.type === 'checkbox' 
      ? input.checked 
      : (input.value || '').trim();
    
    const error = validateField(field, value);
    
    if (error) {
      isValid = false;
      errors.push({ field, error, element: input });
      showFieldError(`[name="${input.name}"]`, error);
    } else {
      showFieldError(`[name="${input.name}"]`, null);
    }
  });

  // Affichage récapitulatif des erreurs si multiple
  if (errors.length > 1) {
    const errorList = errors.map(e => e.error).join('<br>');
     showNotification(`Veuillez corriger ${errors.length} erreur(s):<br>${errorList}`, 'error', false);
  }

  return isValid;
}

/**
 * Affichage d'erreurs de champ avec feedback visuel.
 * @param {string} fieldSelector - Sélecteur du champ.
 * @param {string|null} message - Message d'erreur.
 */
export function showFieldError(fieldSelector, message) {
  // Support pour différents sélecteurs
  let input;
  if (fieldSelector === 'subjects') {
    input = document.querySelector('#subject-display') || document.querySelector('[name="subjects"]');
  } else {
    input = document.querySelector(fieldSelector);
  }

  if (!input) {
    console.warn(`⚠️ showFieldError: champ non trouvé - ${fieldSelector}`);
    return;
  }

  // Créer ou récupérer l'élément d'erreur
  let errorElement = input.parentElement.querySelector('.error-message');
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.className = 'error-message text-xs mt-1 transition-all duration-200';
    input.parentElement.appendChild(errorElement);
  }

  // Reset des styles
  input.classList.remove(
    'border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50',
    'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50',
    'border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50',
    'border-gray-300', 'dark:border-gray-600', 'border-ll-blue'
  );

  errorElement.innerHTML = '';
  errorElement.classList.add('hidden');

  if (message) {
    // Déterminer le type de message
    const isSuccess = message.includes('fa-check-circle') || message.includes('valide');
    const iconSVG = isSuccess 
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 mr-1 text-green-500"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>` 
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-4 h-4 mr-1 text-red-500"><path fill="currentColor" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>`;
    const textClass = isSuccess ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    
    errorElement.innerHTML = `${iconSVG}<span class="${textClass}">${message}</span>`;
    errorElement.classList.remove('hidden');
    
    // Appliquer les styles au champ
    if (isSuccess) {
      input.classList.add('border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
    } else {
      input.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } else {
    // Reset vers état normal
    const isDark = isDarkMode();
    input.classList.add(
      isDark ? 'border-gray-600 focus:border-ll-blue focus:ring-ll-blue/50' : 
      'border-gray-300 focus:border-ll-blue focus:ring-ll-blue/50'
    );
  }

  // Animation
  errorElement.style.opacity = '0';
  errorElement.style.transform = 'translateY(-2px)';
  if (message) {
    errorElement.classList.remove('hidden');
    setTimeout(() => {
      errorElement.style.transition = 'all 0.2s ease';
      errorElement.style.opacity = '1';
      errorElement.style.transform = 'translateY(0)';
    }, 10);
  }
}

// Export de l'instance auth (disponible après initializeFirebase)
export { auth };

// Export par défaut avec toutes les fonctions sauf handleApiError qui est exporté séparément
export default {
  initializeFirebase,
  validateFormStep,
  apiFetch,
  showNotification,
  formatDate,
  generateString,
  validateInput,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  authGuard,
  roleGuard,
  checkAndRedirect,
  getAuthErrorMessage,
  checkPasswordStrength,
  validateField,
  openLightbox,
  showLoadingDialog,
  showSuccessDialog,
  showFieldError,
  isDarkMode,
  getCachedUserData,
  checkNetwork,
  getFirebaseConfig,
  handleApiError,
  isAuthenticated
};
