/**
 * @file loadData.js
 * @description Charge les données utilisateur avant le rendu de la page et met à jour le menu d'authentification selon l'état de connexion.
 */


import { getStoredToken, showNotification, setStoredToken, clearStoredToken } from './modules/utils.js';

import api from './api.js';
import auth from './modules/auth.js';


const USER_CACHE_KEY = 'userDataCache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes


/**
 * Charge les données utilisateur et met à jour l'interface
 * @returns {Promise<Object|null>} Données utilisateur ou null si non connecté
 */
export async function loadUserData() {
  try {
    const loadingSpinner = document.querySelector('#profile-loading');
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');

    let token = getStoredToken();
    if (!token) {
      console.log('Aucun token trouvé, utilisateur non connecté');
      clearUserCache();
      return null;
    }

    // Rafraîchir le token si nécessaire
    token = await refreshTokenIfNeeded(token);

    // Vérifier le cache localStorage
    const cachedData = getCachedUserData();
    if (cachedData) {
      console.log('Retour des données utilisateur du cache localStorage');
      return cachedData;
    }

    console.log('Chargement des données utilisateur depuis l\'API...');
    const userData = await api.auth.getCurrentUser();

    if (userData) {
      cacheUserData(userData);
      return userData;
    } else {
      throw new Error('Aucune donnée utilisateur reçue');
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données utilisateur:', error);
    if (error.message.includes('Token invalide') || error.message.includes('expiré') || error.message.includes('invalid algorithm')) {
      handleInvalidToken();
    } else if (error.message.includes('network')) {
      showNotification('Erreur réseau lors du chargement des données. Utilisation du mode hors ligne.', 'warning');

      const expiredCache = localStorage.getItem(USER_CACHE_KEY);
      if (expiredCache) {
        try {
          const { data } = JSON.parse(expiredCache);
          return data; // Use expired cache in offline mode
        } catch {
          return null;
        }
      }
    } else {
      showNotification('Erreur lors du chargement des données utilisateur.', 'error');
    }
    clearUserCache();
    return null;
  } finally {
    const loadingSpinner = document.querySelector('#profile-loading');
    if (loadingSpinner) loadingSpinner.classList.add('hidden');
  }
}

/**
 * Gère un token invalide : déconnexion et redirection
 */
function handleInvalidToken() {
  clearStoredToken();
  clearUserCache();
  showNotification('Session expirée ou token invalide. Veuillez vous reconnecter.', 'error');
  window.location.href = '/pages/auth/signin.html';
}

/**
 * Rafraîchit le token si nécessaire
 * @param {string} currentToken - Token actuel
 * @returns {Promise<string>} Nouveau token rafraîchi
 */
async function refreshTokenIfNeeded(currentToken) {
  try {
    const decoded = JSON.parse(atob(currentToken.split('.')[1]));
    const exp = decoded.exp * 1000;
    const now = Date.now();

    if (exp <= now) {
      throw new Error('Token expired');
    }

    if (exp - now < CACHE_TTL) {
      console.log('Token expire bientôt, rafraîchissement...');
      const refreshData = await api.auth.refreshToken();
      setStoredToken(refreshData.token, refreshData.role || 'client');
      return refreshData.token;
    }

    return currentToken;
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    if (error.message.includes('expired') || error.message.includes('invalid')) {
      handleInvalidToken();
    }
    throw new Error('Échec du rafraîchissement du token');
  }
}

/**
 * Récupère les données utilisateur du cache localStorage
 * @returns {Object|null} Données utilisateur cachées ou null
 */
function getCachedUserData() {
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
    console.error('Erreur lors de la récupération du cache utilisateur:', error);
    clearUserCache();
    return null;
  }
}

/**
 * Met en cache les données utilisateur dans localStorage
 * @param {Object} userData - Données utilisateur à cacher
 */
function cacheUserData(userData) {
  try {
    const cacheObject = {
      data: userData,
      timestamp: Date.now()
    };
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cacheObject));
  } catch (error) {
    console.error('Erreur lors de la mise en cache des données utilisateur:', error);
  }
}

/**
 * Efface le cache des données utilisateur
 */
function clearUserCache() {
  localStorage.removeItem(USER_CACHE_KEY);
}

/**
 * Met à jour le menu d'authentification selon l'état de connexion
 * @param {Object|null} userData - Données utilisateur ou null si non connecté
 */
/**
 * Met à jour le menu d'authentification selon l'état de connexion
 * @param {Object|null} userData - Données utilisateur ou null si non connecté
 */
function updateAuthMenu(userData) {
  const authContainer = document.querySelector('#auth.chat-toggle-button');
  if (!authContainer) {
    console.error('Authentication container not found');
    return;
  }

  const isAuthenticated = !!userData;
  let initials = '';
  let displayName = '';

  if (isAuthenticated) {
    displayName = userData.name || userData.nom || 'Utilisateur';
    const nameParts = displayName.trim().split(' ');
    
    if (nameParts.length >= 2) {
      initials = nameParts[0][0] + nameParts[1][0];
      initials = initials.toUpperCase();
    } else {
      initials = nameParts[0].slice(0, 2);
      initials = initials.charAt(0).toUpperCase() + initials.slice(1).toLowerCase();
    }
  }

  authContainer.innerHTML = `
    <div x-data="{ open: false }" @click.away="open = false" class="relative z-50">
      <div x-data="{ open: false }" @click.away="open = false" class="relative z-40">
        <button type="button" id="auth" class="auth-combined-button bg-dark focus:outline-none focus:ring-2 focus:ring-ll-blue/50 auth-dropdown-toggle" title="Authentification" @click="open = !open" :aria-expanded="open.toString()" aria-haspopup="true">
          ${
            isAuthenticated ?
             (userData.photoURL
                ? `<img src="${userData.photoURL}" alt="Photo de profil" class="w-8 h-8 rounded-full mr-2  object-cover">`
                : `<div class="w-8 h-8 rounded-full overflow-hidden bg-ll-blue text-white flex items-center justify-center text-sm font-semibold mr-2">
                    ${initials}
                  </div>`):
                  `<div class="w-8 h-8 rounded-full bg-ll-blue text-white flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                </div>`
          }
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>


        <div 
            x-show="open" 
            x-transition:enter="transition ease-out duration-300 transform" 
            x-transition:enter-start="opacity-0 scale-95 translate-y-2" 
            x-transition:enter-end="opacity-100 scale-100 translate-y-0" 
            x-transition:leave="transition ease-in duration-200 transform" 
            x-transition:leave-start="opacity-100 scale-100 translate-y-0" 
            x-transition:leave-end="opacity-0 scale-95 translate-y-2" 
            class="absolute right-0 mt-3 w-72 bg-ll-white dark:bg-ll-black rounded-xl shadow-lg-dark-custom p-4 border border-ll-light-gray/20 dark:border-ll-dark-blue/30 auth-menu-backdrop"
        >
            <div class="flex flex-col gap-2">
                <div class="flex items-center gap-3 pb-3 border-b border-ll-light-gray/30 dark:border-ll-dark-blue/50">
                    <img src="/assets/images/logo.png" alt="Company Logo" class="w-12 h-12 rounded-md">
                    <div>
                        <span class="text-lg font-cinzel font-semibold text-ll-black dark:text-ll-white">${isAuthenticated ? displayName : 'Bienvenue'}</span>
                        <p class="text-xs text-ll-text-gray font-roboto">${isAuthenticated ? userData.role : 'Invité'}</p>
                        <p class="text-xs text-ll-text-gray font-roboto">${isAuthenticated ? userData.email : Date.now().toString()}</p>
                    </div>
                </div>
                ${
                    isAuthenticated
                        ? `
                        <a href="/pages/user/profile.html" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ll-blue/10 dark:hover:bg-ll-dark-blue/20 transition-all duration-150 auth-menu-item">
                            <i class="fas fa-user w-5 h-5 text-ll-blue"></i>
                            <span class="text-sm font-roboto text-ll-black dark:text-ll-white">Mon Profil</span>
                        </a>
                        <a href="/pages/user/dashboard.html" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ll-blue/10 dark:hover:bg-ll-dark-blue/20 transition-all duration-150 auth-menu-item">
                            <i class="fas fa-tachometer-alt w-5 h-5 text-ll-blue"></i>
                            <span class="text-sm font-roboto text-ll-black dark:text-ll-white">Tableau de bord</span>
                        </a>
                        <a href="/pages/user/settings.html" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ll-blue/10 dark:hover:bg-ll-dark-blue/20 transition-all duration-150 auth-menu-item">
                            <i class="fas fa-cog w-5 h-5 text-ll-blue"></i>
                            <span class="text-sm font-roboto text-ll-black dark:text-ll-white">Paramètres</span>
                        </a>
                        <a href="/pages/user/notifications.html" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ll-blue/10 dark:hover:bg-ll-dark-blue/20 transition-all duration-150 auth-menu-item">
                            <i class="fas fa-bell w-5 h-5 text-ll-blue"></i>
                            <span class="text-sm font-roboto text-ll-black dark:text-ll-white">Notifications</span>
                        </a>
                        <hr class="border-ll-light-gray/30 dark:border-ll-dark-blue/50 my-2">
                       
                        <button type="submit" class="signout-button flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300 group sidebar-item shadow-md focus:outline-none focus:ring-2 focus:ring-red-500/50" title="Se déconnecter de votre compte">
                                <svg class="w-6 h-6 sidebar-icon text-red-600 dark:text-red-400 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                                </svg>
                                <span class="text-red-600 dark:text-red-400 font-semibold tracking-wide">Se déconnecter</span>
                                <span class="tooltip absolute left-1/2 transform -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">Se déconnecter</span>
                            </button>

                        `
                        : `
                        <a href="/pages/auth/signin.html" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ll-blue/10 dark:hover:bg-ll-dark-blue/20 transition-all duration-150 auth-menu-item">
                            <i class="fas fa-sign-in-alt w-5 h-5 text-ll-blue"></i>
                            <span class="text-sm font-roboto text-ll-black dark:text-ll-white">Se connecter</span>
                        </a>
                        <a href="/pages/auth/signup.html" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ll-blue/10 dark:hover:bg-ll-dark-blue/20 transition-all duration-150 auth-menu-item">
                            <i class="fas fa-user-plus w-5 h-5 text-ll-blue"></i>
                            <span class="text-sm font-roboto text-ll-black dark:text-ll-white">S'inscrire</span>
                        </a>
                        <a href="/pages/auth/reset-password.html" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ll-blue/10 dark:hover:bg-ll-dark-blue/20 transition-all duration-150 auth-menu-item">
                            <i class="fas fa-key w-5 h-5 text-ll-blue"></i>
                            <span class="text-sm font-roboto text-ll-black dark:text-ll-white">Réinitialiser le mot de passe</span>
                        </a>
                        `
                }
            </div>
        </div>
    </div>
  `;

//  auth.bindSignOutButton();

  /* Attach sign-out event listener if authenticated
  if (isAuthenticated) {
    const signOutButton = authContainer.querySelector('.signout-button');
    if (signOutButton) {
      signOutButton.addEventListener('click', async () => {
        try {
          await api.auth.signOut();
          clearStoredToken();
          clearUserCache();
          showNotification('Déconnexion réussie.', 'success');
          window.location.href = '/pages/auth/signin.html';
        } catch (error) {
          console.error('Erreur lors de la déconnexion:', error);
          showNotification('Erreur lors de la déconnexion.', 'error');
        }
      });
    }
  }*/
 
}



/**
 * Met à jour l'interface avec les données utilisateur
 * @param {Object|null} userData - Données utilisateur ou null si non connecté
 */
export function updateUIWithUserData(userData) {
  // Mettre à jour le menu d'authentification global
  updateAuthMenu(userData);

  const authElements = document.querySelectorAll('[data-auth]');
  const welcome = document.getElementById('welcome');

  if (!userData) {
    console.log("Utilisateur non connecté → affichage invité");

    // Afficher seulement l'état "unauthenticated"
    authElements.forEach(element => {
      const shouldShow = element.getAttribute('data-auth') === 'unauthenticated';
      element.classList.toggle('hidden', !shouldShow);
      element.classList.toggle('block', shouldShow);
    });

    // Message de bienvenue invité
    if (welcome) {
      welcome.textContent = "Bienvenue Utilisateur";
      welcome.classList.remove('hidden');
    }

    // Nettoyer le profil sidebar
    const userNameElement = document.getElementById('user-name');
    const userEmailElement = document.getElementById('user-email');
    const userInitialElement = document.getElementById('user-initial');
    const userPhotoElement = document.getElementById('user-photo');
    const countryElement = document.getElementById('user-country');
    const roleElement = document.getElementById('user-role');
    const dropdownButton = document.querySelector('[data-level-id="profile"]');
    const dropdownMenu = document.getElementById('level-dropdown-profile');

    if (userNameElement) userNameElement.textContent = "Utilisateur";
    if (userEmailElement) userEmailElement.textContent = "";
    if (userInitialElement) userInitialElement.textContent = "U";
    if (userPhotoElement) {
      userPhotoElement.src = "";
      userPhotoElement.classList.add("hidden");
    }
    if (countryElement) countryElement.textContent = "";
    if (roleElement) roleElement.textContent = "Invité";

    // Désactiver le dropdown
    if (dropdownButton) dropdownButton.classList.add("hidden");
    if (dropdownMenu) dropdownMenu.classList.add("hidden");

    return;
  }

  console.log('Mise à jour interface avec données utilisateur:', userData);

  // État connecté
  authElements.forEach(element => {
    const shouldShow = element.getAttribute('data-auth') === 'authenticated';
    element.classList.toggle('hidden', !shouldShow);
    element.classList.toggle('block', shouldShow);
  });

  // Message de bienvenue personnalisé
  if (welcome) {
    const firstName = (userData.name || userData.nom || 'Utilisateur').split(' ')[0];
    welcome.textContent = `Bienvenue Mr ${firstName}`;
    welcome.classList.remove('hidden');
  }

  // Profil Sidebar
  const userNameElement = document.getElementById('user-name');
  const userEmailElement = document.getElementById('user-email');
  const userPhoneElement = document.getElementById('user-phone');
  const userInitialElement = document.getElementById('user-initial');
  const userPhotoElement = document.getElementById('user-photo');
  const countryElement = document.getElementById('user-country');
  const roleElement = document.getElementById('user-role');
  const dropdownButton = document.querySelector('[data-level-id="profile"]');
  const dropdownMenu = document.getElementById('level-dropdown-profile');

  if (userNameElement) userNameElement.textContent = userData.name || userData.nom || 'Utilisateur';
  if (userEmailElement) userEmailElement.textContent = userData.email || '';
  if (userPhoneElement) userPhoneElement.textContent = userData.phone || '';
  if (userInitialElement) {
    const initial = (userData.name || userData.nom || 'U').charAt(0).toUpperCase();
    userInitialElement.textContent = initial;
  }
  if (userPhotoElement && userData.photoURL) {
    userPhotoElement.src = userData.photoURL;
    userPhotoElement.classList.remove('hidden');
    if (userInitialElement) userInitialElement.classList.add('hidden');
  }
  if (countryElement) countryElement.textContent = userData.address?.country || 'Pays inconnu';
  if (roleElement) roleElement.textContent = userData.role || 'Client';

  // Activer le dropdown
  if (dropdownButton) dropdownButton.classList.remove("hidden");
  if (dropdownMenu) dropdownMenu.classList.add("hidden"); // fermé par défaut

  // Appeler le dashboard
  updateDashboardWithUserData(userData);
}






/**
 * Met à jour le dashboard avec les données utilisateur
 * @param {Object} userData - Données utilisateur
 */
function updateDashboardWithUserData(userData) {
  console.log('Mise à jour du dashboard avec:', userData);
}

// Exécution au chargement
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Chargement des données utilisateur...');
  const userData = await loadUserData();
  updateUIWithUserData(userData);
});