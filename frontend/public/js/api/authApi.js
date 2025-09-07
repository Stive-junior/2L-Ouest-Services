/**
 * @file authApi.js
 * @description Gestion des appels API pour l'authentification dans L&L Ouest Services avec Firebase Auth.
 * @module api/authApi
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  isSignInWithEmailLink,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateEmail,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import emailTemplates from '../templates/emailTemplates.js';
import { showNotification, validateInput, getStoredToken, setStoredToken, clearStoredToken, handleApiError, apiFetch, getAuthErrorMessage, clearUserCache } from '../modules/utils.js';

const API_BASE_URL = 'http://localhost:35473/api';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * Waits for Firebase auth state to be resolved.
 * @returns {Promise<Object|null>} Current user or null if not authenticated.
 */
function waitForAuthState() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe(); // Unsubscribe after first call
      resolve(user);
    }, (error) => {
      unsubscribe();
      reject(new Error(getAuthErrorMessage(error) || 'Erreur lors de la vérification de l\'état d\'authentification'));
    });
  });
}

/**
 * Valide les données pour l'inscription.
 * @param {Object} userData - Données de l'utilisateur.
 * @returns {boolean} Vrai si les données sont valides.
 * @throws {Error} Si les données sont invalides.
 */
function validateSignUpData(userData) {
  const schema = {
    email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { type: 'string', required: true, minLength: 8, maxLength: 50 },
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    phone: { type: 'string', required: true, pattern: /^\+\d{1,3}[\s\d\-]{4,20}$/ },
    street: { type: 'string', required: false, minLength: 3, maxLength: 255 },
    city: { type: 'string', required: false, minLength: 2, maxLength: 100 },
    postalCode: { type: 'string', required: false, pattern: /^\d{5}$/ },
    country: { type: 'string', required: false, minLength: 2, default: 'France' },
    fcmToken: { type: 'string', required: false },
    role: { type: 'string', required: false, enum: ['client', 'provider', 'admin'], default: 'client' },
  };
  const { error } = validateInput(userData, schema);
  if (error) {
    showNotification(`Données d'inscription invalides : ${error.details}`, 'error', false);
    throw new Error('Données d’inscription invalides');
  }
  return true;
}

/**
 * Valide les identifiants de connexion.
 * @param {Object} credentials - Données de connexion.
 * @returns {boolean} Vrai si les données sont valides.
 * @throws {Error} Si les données sont invalides.
 */
function validateSignInData(credentials) {
  const schema = {
    email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { type: 'string', required: true, minLength: 8, maxLength: 50 },
    fcmToken: { type: 'string', required: false },
  };
  const { error } = validateInput(credentials, schema);
  if (error) {
    showNotification(`Identifiants invalides : ${error.details}`, 'error', false);
    throw new Error('Identifiants invalides');
  }
  return true;
}

/**
 * Valide les données pour les emails de vérification ou réinitialisation.
 * @param {Object} data - Données de l'email.
 * @returns {boolean} Vrai si les données sont valides.
 * @throws {Error} Si les données sont invalides.
 */
function validateEmailData(data) {
  const schema = {
    email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
  };
  const { error } = validateInput(data, schema);
  if (error) {
    showNotification(`Données d'email invalides : ${error.details}`, 'error', false);
    throw new Error('Données d’email invalides');
  }
  return true;
}

/**
 * Valide les données pour le changement d'email.
 * @param {Object} data - Données du changement d'email.
 * @returns {boolean} Vrai si les données sont valides.
 * @throws {Error} Si les données sont invalides.
 */
function validateChangeEmailData(data) {
  const schema = {
    currentEmail: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    newEmail: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
  };
  const { error } = validateInput(data, schema);
  if (error) {
    showNotification(`Données de changement d'email invalides : ${error.details}`, 'error', false);
    throw new Error('Données de changement d’email invalides');
  }
  return true;
}

/**
 * Valide les données pour la connexion par lien email.
 * @param {Object} data - Données de connexion par lien.
 * @returns {boolean} Vrai si les données sont valides.
 * @throws {Error} Si les données sont invalides.
 */
function validateEmailLinkData(data) {
  const schema = {
    email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    link: { type: 'string', required: true, pattern: /^https?:\/\/.+/ },
  };
  const { error } = validateInput(data, schema);
  if (error) {
    showNotification(`Données de lien email invalides : ${error.details}`, 'error', false);
    throw new Error('Données de lien email invalides');
  }
  return true;
}

const authApi = {
  /**
   * Inscrit un nouvel utilisateur avec Firebase et enregistre dans le backend.
   * @async
   * @param {Object} userData - Données de l'utilisateur (email, password, name, phone, address, fcmToken, role).
   * @returns {Promise<Object>} Données de l'utilisateur créé et token JWT.
   * @throws {Error} En cas d'erreur d'inscription.
   */
  async signUp(userData) {
    try {
      validateSignUpData(userData);
      const { email, password, name, phone, street, city, postalCode, country, fcmToken, role } = userData;

      // Vérifier si l'email existe déjà dans le backend
      try {
        const response = await apiFetch('/auth/users/email', 'POST', { email }, false);
        if (response.data.exists) {
          showNotification('Cet email est déjà utilisé.', 'error', false);
          throw new Error('Cet email est déjà utilisé');
        }
      } catch (error) {
        if (!error.message.includes('Utilisateur non trouvé')) {
          throw await handleApiError(error, 'Erreur lors de la vérification de l\'email');
        }
      }

      // Création de l'utilisateur dans Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      let firebaseToken;

      try {
        firebaseToken = await user.getIdToken();
      } catch (error) {
        // Supprimer l'utilisateur Firebase en cas d'échec
        await user.delete();
        throw await handleApiError(error, 'Erreur lors de la récupération du token Firebase');
      }

      try {
        // Enregistrement dans le backend
        const address = { street, city, postalCode, country: country || 'France' };
        const response = await apiFetch('/auth/signup', 'POST', {
          email,
          name,
          phone,
          address,
          firebaseToken,
          fcmToken,
          role: role || 'client',
        }, false);

        // Stockage du token
        setStoredToken(response.data.token, response.data.user.role || 'client');
        showNotification('Inscription réussie ! Vérifiez votre email pour confirmer.', 'success');
        return response.data;
      } catch (backendError) {
        // Nettoyage si le backend échoue
        try {
          await user.delete();
          console.log('Utilisateur Firebase supprimé après échec backend');
        } catch (deleteError) {
          console.error('Échec de la suppression de l\'utilisateur Firebase:', deleteError);
        }
        clearStoredToken();
        throw await handleApiError(backendError, 'Erreur lors de l’enregistrement dans le backend');
      }
    } catch (error) {
      throw await handleApiError(error, getAuthErrorMessage(error) || 'Erreur lors de l’inscription');
    }
  },

  /**
   * Connecte un utilisateur avec email et mot de passe.
   * @async
   * @param {Object} credentials - Identifiants (email, password, fcmToken).
   * @returns {Promise<Object>} Données de l'utilisateur et token JWT.
   * @throws {Error} En cas d'erreur de connexion.
   */
  async signIn(credentials) {
    try {
      validateSignInData(credentials);
      const { email, password, fcmToken = '' } = credentials;

      // Connexion à Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      let firebaseToken;

      try {
        firebaseToken = await user.getIdToken();
      } catch (error) {
        await signOut(auth);
        throw await handleApiError(error, 'Erreur lors de la récupération du token Firebase');
      }

      try {
        // Connexion au backend
        const response = await apiFetch('/auth/signin', 'POST', { email, firebaseToken, fcmToken }, false);
        setStoredToken(response.data.token, response.data.user.role || 'client');
        return response.data;
      } catch (backendError) {
        await signOut(auth);
        clearStoredToken();
        throw await handleApiError(backendError, 'Erreur lors de la connexion au backend');
      }
    } catch (error) {
      throw await handleApiError(error, getAuthErrorMessage(error) || 'Erreur lors de la connexion');
    }
  },

  /**
   * Rafraîchit le token JWT.
   * @async
   * @returns {Promise<Object>} Nouveau token JWT et rôle.
   * @throws {Error} En cas d'erreur de rafraîchissement.
   */
  async refreshToken() {
    try {
      const user = await waitForAuthState();
      if (!user) {
        clearStoredToken();
        throw new Error('Aucun utilisateur connecté');
      }
      const firebaseToken = await user.getIdToken(true);
      const response = await apiFetch('/auth/refresh', 'POST', { firebaseToken }, false);
      setStoredToken(response.data.token, response.data.role || 'client');
      showNotification('Token rafraîchi avec succès.', 'success');
      return response.data;
    } catch (error) {
      clearStoredToken();
      await signOut(auth);
      throw await handleApiError(error, 'Erreur lors du rafraîchissement du token');
    }
  },

  /**
   * Déconnecte l'utilisateur.
   * @async
   * @returns {Promise<void>}
   * @throws {Error} En cas d'erreur de déconnexion.
   */
  async signOut() {
    try {
      const user = await waitForAuthState();
      if (user) {
        const firebaseToken = await user.getIdToken();
        await apiFetch('/auth/signout', 'POST', { firebaseToken }, true);
      }
      await signOut(auth);
      clearUserCache();
      clearStoredToken();
      showNotification('Déconnexion réussie.', 'success');
      
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la déconnexion');
    }
  },

  /**
   * Vérifie la validité du token Firebase.
   * @async
   * @returns {Promise<Object>} Données de vérification du token.
   * @throws {Error} En cas d'erreur de vérification.
   */
  async verifyToken() {
    try {
      const user = await waitForAuthState();
      if (!user) {
        throw new Error('Aucun utilisateur connecté');
      }
      const firebaseToken = await user.getIdToken();
      const response = await apiFetch('/auth/verify-token', 'POST', { firebaseToken }, false);
      return response.data;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la vérification du token');
    }
  },

  /**
   * Envoie un email de vérification via Firebase.
   * @async
   * @param {string} email - Adresse email.
   * @param {string} name - Nom de l'utilisateur.
   * @returns {Promise<void>}
   * @throws {Error} En cas d'erreur d'envoi.
   */
  async sendEmailVerification(email, name) {
    try {
      validateEmailData({ email, name });
      const user = await waitForAuthState();
      if (!user) {
        throw new Error('Aucun utilisateur connecté');
      }
      await sendEmailVerification(user, {
        url: `${window.location.origin}/pages/auth/verify-email.html`,
        handleCodeInApp: true,
      });
      await apiFetch('/auth/verify-email', 'POST', {
        email,
        name,
        htmlTemplate: emailTemplates.verification({ name, link: '{{link}}' }),
      }, false);
      showNotification('Email de vérification envoyé.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de l’envoi de l’email de vérification');
    }
  },

  /**
   * Envoie un email de réinitialisation de mot de passe via Firebase.
   * @async
   * @param {string} email - Adresse email.
   * @param {string} name - Nom de l'utilisateur.
   * @returns {Promise<void>}
   * @throws {Error} En cas d'erreur d'envoi.
   */
  async sendPasswordReset(email, name) {
    try {
      validateEmailData({ email, name });
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/pages/auth/password-reset.html`,
        handleCodeInApp: true,
      });
      await apiFetch('/auth/password-reset', 'POST', {
        email,
        name,
        htmlTemplate: emailTemplates.passwordReset({ name, link: '{{link}}' }),
      }, false);
      showNotification('Email de réinitialisation envoyé.', 'success');
    } catch (error) {
      const errorMessage = error.code === 'auth/user-not-found'
        ? 'Aucun utilisateur trouvé avec cet email.'
        : 'Erreur lors de l’envoi de l’email de réinitialisation';
      throw await handleApiError(error, errorMessage);
    }
  },

  /**
   * Envoie un email pour changer l'adresse email.
   * @async
   * @param {string} currentEmail - Email actuel.
   * @param {string} newEmail - Nouvel email.
   * @param {string} name - Nom de l'utilisateur.
   * @returns {Promise<void>}
   * @throws {Error} En cas d'erreur d'envoi.
   */
  async sendVerifyAndChangeEmail(currentEmail, newEmail, name) {
    try {
      validateChangeEmailData({ currentEmail, newEmail, name });
      const user = await waitForAuthState();
      if (!user) {
        throw new Error('Aucun utilisateur connecté');
      }
      await updateEmail(user, newEmail);
      await sendEmailVerification(user, {
        url: `${window.location.origin}/pages/auth/verify-email.html`,
        handleCodeInApp: true,
      });
      await apiFetch('/auth/change-email', 'POST', {
        currentEmail,
        newEmail,
        name,
        htmlTemplate: emailTemplates.changeEmail({ name, newEmail, link: '{{link}}' }),
      }, true);
      showNotification('Email de changement envoyé.', 'success');
    } catch (error) {
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'Le nouvel email est déjà utilisé.'
        : 'Erreur lors de l’envoi de l’email de changement';
      throw await handleApiError(error, errorMessage);
    }
  },

  /**
   * Gère la connexion via un lien email.
   * @async
   * @param {string} email - Adresse email.
   * @param {string} link - Lien de connexion.
   * @returns {Promise<Object>} Données de l'utilisateur et token JWT.
   * @throws {Error} En cas d'erreur de connexion.
   */
  async handleSignInWithEmailLink(email, link) {
    try {
      validateEmailLinkData({ email, link });
      if (!isSignInWithEmailLink(auth, link)) {
        showNotification('Lien de connexion invalide.', 'error', false);
        throw new Error('Lien de connexion invalide');
      }
      const userCredential = await signInWithEmailLink(auth, email, link);
      const user = userCredential.user;
      const firebaseToken = await user.getIdToken();

      try {
        const response = await apiFetch('/auth/signin', 'POST', { email, firebaseToken }, false);
        setStoredToken(response.data.token, response.data.user.role || 'client');
        showNotification('Connexion par lien réussie !', 'success');
        return response.data;
      } catch (backendError) {
        await signOut(auth);
        clearStoredToken();
        throw await handleApiError(backendError, 'Erreur lors de la connexion au backend');
      }
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la connexion avec lien');
    }
  },

  /**
   * Récupère les données de l'utilisateur courant.
   * @async
   * @returns {Promise<Object>} Données de l'utilisateur.
   * @throws {Error} En cas d'erreur.
   */
  async getCurrentUser() {
    try {
      const token = getStoredToken();
      if (!token) {
        throw new Error('Utilisateur non authentifié');
      }
      const user = await waitForAuthState();
      if (!user) {
        clearStoredToken();
        throw new Error('Aucun utilisateur connecté');
      }
      const response = await apiFetch('/user/profile', 'GET', null, true);
      return response.data.user;
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('Token')) {
        clearStoredToken();
        await signOut(auth);
        window.location.href = '/pages/auth/signin.html';
      }
      throw await handleApiError(error, 'Erreur lors de la récupération des données utilisateur');
    }
  },
};

export default authApi;

