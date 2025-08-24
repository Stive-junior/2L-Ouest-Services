/**
 * @file utils.js
 * @description Utilitaires pour le frontend de L&L Ouest Services.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

// Configuration Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyBqYkFbXTlCoO7N0t0eWzrzeJklA29nwRc',
  authDomain: 'll-ouest-services.firebaseapp.com',
  databaseURL: 'https://ll-ouest-services-default-rtdb.firebaseio.com',
  projectId: 'll-ouest-services',
  storageBucket: 'll-ouest-services.firebasestorage.app',
  messagingSenderId: '1075873956073',
  appId: '1:1075873956073:web:e1d4e98a2a578d9782b078',
  measurementId: 'G-6HFZ04SGEZ',
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const API_BASE_URL = 'http://localhost:35473/api';

// Chargement de SweetAlert2 via CDN
const swalScript = document.createElement('script');
swalScript.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js';
swalScript.async = true;
document.head.appendChild(swalScript);

let swalLoadedResolve;
const swalLoaded = new Promise((resolve) => (swalLoadedResolve = resolve));
swalScript.onload = () => swalLoadedResolve();


export const getAuthErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Email ou mot de passe incorrect.';
    case 'auth/email-already-in-use':
      return 'Cette adresse email est déjà utilisée.';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 8 caractères.';
    case 'auth/invalid-email':
      return 'L\'adresse email n\'est pas valide.';
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé. Contactez le support.';
    case 'auth/operation-not-allowed':
      return 'Cette opération n\'est pas autorisée.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives de connexion. Veuillez réessayer plus tard.';
    case 'auth/network-request-failed':
      return 'Erreur réseau. Vérifiez votre connexion internet.';
    case 'auth/requires-recent-login':
      return 'Cette opération nécessite une connexion récente. Veuillez vous reconnecter.';
    case 'auth/popup-blocked':
      return 'La fenêtre pop-up a été bloquée par le navigateur.';
    case 'auth/popup-closed-by-user':
      return 'La fenêtre d\'authentification a été fermée.';
    case 'auth/unauthorized-domain':
      return 'Ce domaine n\'est pas autorisé pour les opérations d\'authentification.';
    case 'auth/expired-action-code':
      return 'Ce lien a expiré. Veuillez demander un nouveau lien.';
    case 'auth/invalid-action-code':
      return 'Ce lien n\'est plus valide. Il a peut-être déjà été utilisé.';
    default:
      return error.message || 'Une erreur est survenue lors de l\'authentification.';
  }
};


/**
 * Displays a notification with the specified message and type.
 * @param {string} message - The message to display.
 * @param {'success' | 'error' | 'info'} type - The type of notification.
 */
export function Notify(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform transition-transform duration-300 ${
    type === 'error' ? 'bg-red-500 text-white' :
    type === 'success' ? 'bg-green-500 text-white' :
    'bg-blue-500 text-white'
  }`;
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas ${
        type === 'error' ? 'fa-exclamation-circle' :
        type === 'success' ? 'fa-check-circle' :
        'fa-info-circle'
      } mr-2"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('translate-x-0'), 10);
  setTimeout(() => {
    notification.classList.remove('translate-x-0');
    notification.classList.add('translate-x-full');
    setTimeout(() => notification.parentNode?.removeChild(notification), 300);
  }, 5000);
}


/**
 * Validates a field based on its name and value.
 * @param {string} field - The field name.
 * @param {string} value - The field value.
 * @param {boolean} [signIn=false] - Whether to apply sign-in specific validation.
 * @returns {string|null} - Error message or null if valid.
 */
export function validateField(field, value, signIn = false) {
  switch (field) {
    case 'email':
    case 'currentEmail':
      if (!value) return 'L\'email est requis.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'L\'email n\'est pas valide.';
      return null;
    case 'newEmail':
      if (!value) return 'Le nouvel email est requis.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Le nouvel email n\'est pas valide.';
      return null;
    case 'password':
      if (!value) return 'Le mot de passe est requis.';
      if (signIn) return null;
      if (value.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
      if (!/[A-Z]/.test(value)) return 'Le mot de passe doit contenir au moins une majuscule.';
      if (!/[a-z]/.test(value)) return 'Le mot de passe doit contenir au moins une minuscule.';
      if (!/[0-9]/.test(value)) return 'Le mot de passe doit contenir au moins un chiffre.';
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Le mot de passe doit contenir au moins un caractère spécial.';
      return null;
    case 'name':
      if (!value) return 'Le nom est requis.';
      if (value.length < 2) return 'Le nom doit contenir au moins 2 caractères.';
      return null;
    case 'phone':
      if (!value) return 'Le numéro de téléphone est requis.';
      if (!/^[\d\s\-\(\)]{10,15}$/.test(value)) return 'Le numéro de téléphone n\'est pas valide.';
      return null;
    case 'postalCode':
      if (!value) return 'Le code postal est requis.';
      if (!/^\d{5}$/.test(value)) return 'Le code postal doit contenir 5 chiffres.';
      return null;
    case 'country':
    case 'city':
    case 'street':
      if (!value) return `Le ${field === 'country' ? 'pays' : field === 'city' ? 'ville' : 'rue'} est requis.`;
      return null;
    default:
      return null;
  }
}

/**
 * Checks the strength of a password.
 * @param {string} password - The password to check.
 * @returns {{ strength: number, message: string, color: string }} - Strength details.
 */
export function checkPasswordStrength(password) {
  let strength = 0;
  let message = '';
  let color = '';

  if (password.length === 0) return { strength, message, color };
  if (password.length > 7) strength++;
  if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) strength++;
  if (password.match(/([0-9])/)) strength++;
  if (password.match(/([!,@,#,$,%,^,&,*,?,_,~])/)) strength++;

  switch (strength) {
    case 0:
    case 1:
      message = 'Faible';
      color = 'text-red-500';
      break;
    case 2:
      message = 'Moyen';
      color = 'text-yellow-500';
      break;
    case 3:
      message = 'Fort';
      color = 'text-green-500';
      break;
    case 4:
      message = 'Très fort';
      color = 'text-green-600 font-bold';
      break;
  }

  return { strength, message, color };
}


/**
 * Affiche une notification avec SweetAlert2 (toast ou modal).
 * @param {string} message - Message à afficher.
 * @param {string} type - Type ('success', 'error', 'info', 'warning').
 * @param {boolean} [isToast=true] - Si true, affiche un toast; sinon, un modal avec bouton "Okay".
 * @param {Object} [options] - Options supplémentaires.
 */
export async function showNotification(message, type, isToast = true, options = {}) {
  await swalLoaded;
  const iconMap = { success: 'success', error: 'error', info: 'info', warning: 'warning' };
  const swalOptions = {
    icon: iconMap[type] || 'info',
    title: message,
    timer: isToast ? 5000 : undefined,
    timerProgressBar: isToast,
    showConfirmButton: !isToast,
    confirmButtonText: 'Okay',
    position: isToast ? 'top-end' : 'center',
    toast: isToast,
    didOpen: (popup) => {
    popup.style.fontSize = '14px';
  },
    ...options,
  };
  await Swal.fire(swalOptions);
}

/**
 * Formate une date ISO en format français.
 * @param {string} isoString - Date au format ISO.
 * @returns {string} Date formatée.
 */
export function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return isoString;
  }
}

/**
 * Génère une chaîne aléatoire sécurisée.
 * @param {number} length - Longueur de la chaîne.
 * @returns {string} Chaîne aléatoire.
 */
export function generateString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += characters.charAt(randomValues[i] % characters.length);
  }
  return result;
}

/**
 * Valide les données selon un schéma personnalisé.
 * @param {Object} data - Données à valider.
 * @param {Object} schema - Schéma de validation.
 * @returns {{ error: Object | null, value: Object }} Résultat de la validation.
 */
export function validateInput(data, schema) {
  const errors = [];
  const value = { ...data };

  for (const [key, rules] of Object.entries(schema)) {
    const input = data[key];
    if (rules.required && (input === undefined || input === null || input === '')) {
      errors.push(`Le champ ${key} est requis`);
      continue;
    }
    if (input !== undefined && input !== null) {
      if (rules.type === 'string' && typeof input !== 'string') {
        errors.push(`Le champ ${key} doit être une chaîne`);
      } else if (rules.type === 'number' && (isNaN(input) || typeof input !== 'number')) {
        errors.push(`Le champ ${key} doit être un nombre`);
      } else if (rules.type === 'object' && typeof input !== 'object') {
        errors.push(`Le champ ${key} doit être un objet`);
      }
      if (rules.minLength && typeof input === 'string' && input.length < rules.minLength) {
        errors.push(`Le champ ${key} doit avoir au moins ${rules.minLength} caractères`);
      }
      if (rules.maxLength && typeof input === 'string' && input.length > rules.maxLength) {
        errors.push(`Le champ ${key} ne doit pas dépasser ${rules.maxLength} caractères`);
      }
      if (rules.pattern && typeof input === 'string' && !rules.pattern.test(input)) {
        errors.push(`Le champ ${key} est invalide`);
      }
      if (rules.min !== undefined && typeof input === 'number' && input < rules.min) {
        errors.push(`Le champ ${key} doit être supérieur ou égal à ${rules.min}`);
      }
      if (rules.max !== undefined && typeof input === 'number' && input > rules.max) {
        errors.push(`Le champ ${key} doit être inférieur ou égal à ${rules.max}`);
      }
      if (rules.enum && !rules.enum.includes(input)) {
        errors.push(`Le champ ${key} doit être l'une des valeurs: ${rules.enum.join(', ')}`);
      }
    }
  }

  return errors.length > 0 ? { error: { details: errors.join(', ') }, value } : { error: null, value };
}

/**
 * Récupère le token JWT stocké.
 * @returns {string | null} Token JWT ou null.
 */
export function getStoredToken() {
  return localStorage.getItem('jwt');
}

/**
 * Stocke le token JWT et le rôle de l'utilisateur.
 * @param {string} token - Token JWT.
 * @param {string} role - Rôle de l'utilisateur.
 */
export function setStoredToken(token, role) {
  if (typeof token === 'string' && token.length > 0) {
    localStorage.setItem('jwt', token);
    localStorage.setItem('userRole', role || 'client');
  } else {
    console.warn('Tentative de stockage d’un token invalide.');
  }
}

/**
 * Supprime le token JWT et le rôle stockés.
 */
export function clearStoredToken() {
  localStorage.removeItem('jwt');
  localStorage.removeItem('userRole');
}

/**
 * Vérifie si l'utilisateur est authentifié.
 * @returns {boolean} Vrai si authentifié.
 */
export function authGuard() {
  return !!(auth.currentUser && getStoredToken());
}


/**
 * Vérifie si le rôle de l'utilisateur est autorisé.
 * @param {string[]} allowedRoles - Rôles autorisés.
 * @returns {boolean} Vrai si le rôle est autorisé.
 */
export function roleGuard(allowedRoles) {
  const userRole = localStorage.getItem('userRole') || 'client';
  return allowedRoles.includes(userRole);
}


/**
 * Effectue une requête API avec gestion des erreurs, formatage des statuts, et messages adaptés pour une app en production.
 * @async
 * @param {string} endpoint - Endpoint de l'API.
 * @param {string} method - Méthode HTTP (GET, POST, PUT, DELETE, etc.).
 * @param {Object} [body] - Corps de la requête.
 * @param {boolean} [requireAuth=true] - Si true, inclut le token JWT.
 * @returns {Promise<Object>} Réponse de l'API.
 * @throws {Error} En cas d'erreur réseau, de réponse non OK, ou d'authentification.
 */
export async function apiFetch(endpoint, method, body = null, requireAuth = true) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (requireAuth) {
      const token = getStoredToken();
      if (!token) {
        throw new Error('Token JWT manquant');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMessage = formatErrorMessage(response.status, data.message);
      throw new Error(errorMessage);
    }
    return data;
  } catch (error) {
    // Propager directement les erreurs d'authentification pour gestion par l'appelant
    if (error.message === 'Token JWT manquant' || error.message.includes('401')) {
      throw error;
    }
    // Afficher un toast pour les autres erreurs et propager
    const formattedError = await handleApiError(error, `Erreur lors de l'appel API à ${endpoint}`);
    throw formattedError;
  }
}

/**
 * Formate les messages d'erreur en fonction du code de statut HTTP.
 * @param {number} status - Code de statut HTTP.
 * @param {string} [serverMessage] - Message renvoyé par le serveur.
 * @returns {string} Message d'erreur formaté pour l'utilisateur.
 */
function formatErrorMessage(status, serverMessage) {
  const defaultMessages = {
    400: 'Requête invalide. Veuillez vérifier vos données.',
    401: 'Session expirée. Veuillez vous reconnecter.',
    403: 'Accès non autorisé. Vous n\'avez pas les permissions nécessaires.',
    404: 'Ressource non trouvée. Vérifiez l\'URL ou les paramètres.',
    429: 'Trop de requêtes. Veuillez réessayer dans quelques instants.',
    500: 'Erreur serveur. Veuillez réessayer plus tard.',
    503: 'Service temporairement indisponible. Veuillez réessayer plus tard.',
  };

  return serverMessage || defaultMessages[status] || `Erreur inattendue: ${status}`;
}


/**
 * Gère les erreurs API et affiche une notification toast avec animation.
 * @param {Error} error - Erreur à gérer.
 * @param {string} defaultMessage - Message par défaut.
 * @param {boolean} [showToast=true] - Si false, ne montre pas de toast.
 */
export async function handleApiError(error, defaultMessage, showToast = true) {
  if (showToast) {
    await swalLoaded;
    const message = error.message || defaultMessage;

    await Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: message,
      timer: 5000,
      timerProgressBar: true,
      showConfirmButton: false,
      showCloseButton: true,
      customClass: {
        popup: 'custom-toast'
      },
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    });
  }
  
  throw new Error(error.message || defaultMessage);
}

/**
 * Vérifie si l'utilisateur est authentifié et redirige si nécessaire.
 * @param {boolean} shouldBeAuthenticated - True si la page requiert authentification, false si elle est publique.
 * @param {string} redirectAuthenticatedTo - Redirection si authentifié sur une page publique.
 * @param {string} redirectUnauthenticatedTo - Redirection si non authentifié sur une page protégée.
 */
export async function checkAndRedirect(shouldBeAuthenticated, redirectAuthenticatedTo, redirectUnauthenticatedTo) {
  const isAuthenticated = !!(auth.currentUser && getStoredToken());

  if (shouldBeAuthenticated && !isAuthenticated) {
    await showNotification('Session expirée ou non connecté. Redirection...', 'warning', false);
    setTimeout(() => window.location.href = redirectUnauthenticatedTo, 100);
    return;
  }

  if (!shouldBeAuthenticated && isAuthenticated) {
    await showNotification('Vous êtes déjà connecté. Redirection vers dashboard.', 'info', false);
    setTimeout(() => window.location.href = redirectAuthenticatedTo, 100);
    return;
  }

  return true;
}

export default {
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
  handleApiError,
  checkAndRedirect,
  getAuthErrorMessage,
  checkPasswordStrength,
  validateField,
};
