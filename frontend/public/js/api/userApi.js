/**
 * @file userApi.js
 * @description Gestion des appels API pour les utilisateurs dans L&L Ouest Services.
 * Intègre des guards pour l'authentification, des validations côté client avec UUID,
 * et la gestion des tokens. Mise à jour pour intégrer le nouveau formatErrorMessage avec contexte.
 * @module api/userApi
 * @version 1.1.0
 * @author L&L Ouest Services Team
 * @lastUpdated 2025-09-25
 * @license MIT
 * @dependencies showNotification, validateInput, getStoredToken, roleGuard, authGuard, handleApiError, apiFetch
 * @changelog
 * - v1.1.0: Ajout du paramètre context dans tous les appels apiFetch pour une gestion d'erreur contextualisée avec formatErrorMessage.
 * - v1.0.0: Version initiale avec validation des données et gestion des utilisateurs.
 */

import { showNotification, validateInput, getStoredToken, roleGuard, authGuard, handleApiError, apiFetch } from '../modules/utils.js';


/**
 * Valide les données pour créer un utilisateur.
 * @param {Object} userData - Données de l'utilisateur.
 * @param {string} userData.email - Email de l'utilisateur (format valide).
 * @param {string} userData.password - Mot de passe (8-50 caractères).
 * @param {string} userData.name - Nom de l'utilisateur (2-100 caractères).
 * @param {string} [userData.role='client'] - Rôle de l'utilisateur (client, provider, admin).
 * @param {string} userData.phone - Numéro de téléphone (format international).
 * @param {Object} [userData.address] - Adresse de l'utilisateur (optionnel).
 * @param {string} [userData.company] - Nom de l'entreprise (optionnel, 2-100 caractères).
 * @returns {boolean} - True si les données sont valides.
 * @throws {Error} - Si les données sont invalides.
 */
function validateCreateUserData(userData) {
  const schema = {
    email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { type: 'string', required: true, minLength: 8, maxLength: 50 },
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    role: { type: 'string', enum: ['client', 'provider', 'admin'], default: 'client' },
    phone: { type: 'string', required: true, pattern: /^\+\d{1,3}[\s\d\-\(\)]{4,20}$/ },
    address: {
      type: 'object',
      required: false,
      allowNull: true,
      properties: {
        street: { type: 'string', minLength: 3, maxLength: 255 },
        city: { type: 'string', minLength: 2, maxLength: 100 },
        postalCode: { type: 'string', pattern: /^\d{5}$/ },
        country: { type: 'string', default: 'France' },
      },
    },
    company: { type: 'string', minLength: 2, maxLength: 100, required: false, allowNull: true },
  };
  const { error } = validateInput(userData, schema);
  if (error) {
    showNotification(`Données utilisateur invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error('Données utilisateur invalides');
  }
  return true;
}

/**
 * Valide les données pour mettre à jour un utilisateur.
 * @param {Object} userData - Données de l'utilisateur.
 * @param {string} userData.id - ID de l'utilisateur (UUID).
 * @param {string} [userData.email] - Email de l'utilisateur (format valide, optionnel).
 * @param {string} [userData.name] - Nom de l'utilisateur (2-100 caractères, optionnel).
 * @param {string} [userData.role] - Rôle de l'utilisateur (client, provider, admin, optionnel).
 * @param {string} [userData.phone] - Numéro de téléphone (format international, optionnel).
 * @param {Object} [userData.address] - Adresse de l'utilisateur (optionnel).
 * @param {string} [userData.company] - Nom de l'entreprise (optionnel, 2-100 caractères).
 * @param {Array} [userData.invoices] - Liste des factures (optionnel).
 * @param {Object} [userData.preferences] - Préférences utilisateur (optionnel).
 * @param {string} [userData.createdAt] - Date de création (format ISO, optionnel).
 * @param {string} [userData.lastLogin] - Date de dernière connexion (format ISO, optionnel).
 * @param {boolean} [userData.emailVerified] - Statut de vérification de l'email (optionnel).
 * @returns {boolean} - True si les données sont valides.
 * @throws {Error} - Si les données sont invalides.
 */
function validateUpdateUserData(userData) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    email: { type: 'string', required: false, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    name: { type: 'string', required: false, minLength: 2, maxLength: 100 },
    role: { type: 'string', enum: ['client', 'provider', 'admin'], required: false },
    phone: { type: 'string', required: false, pattern: /^\+\d{1,3}[\s\d\-\(\)]{4,20}$/ },
    address: {
      type: 'object',
      required: false,
      allowNull: true,
      properties: {
        street: { type: 'string', minLength: 3, maxLength: 255 },
        city: { type: 'string', minLength: 2, maxLength: 100 },
        postalCode: { type: 'string', pattern: /^\d{5}$/ },
        country: { type: 'string', default: 'France' },
      },
    },
    company: { type: 'string', minLength: 2, maxLength: 100, required: false, allowNull: true },
    invoices: {
      type: 'array',
      required: false,
      default: [],
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
          url: { type: 'string', pattern: /^https?:\/\/.+/ },
          date: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/ },
          amount: { type: 'number', min: 0 },
        },
      },
    },
    preferences: {
      type: 'object',
      required: false,
      default: { notifications: true, language: 'fr', fcmToken: null },
      properties: {
        notifications: { type: 'boolean', default: true },
        language: { type: 'string', enum: ['fr', 'en'], default: 'fr' },
        fcmToken: { type: 'string', required: false, allowNull: true },
      },
    },
    location: {
      type: 'object',
      required: false,
      allowNull: true,
      properties: {
        lat: { type: 'number' },
        lng: { type: 'number' },
        formattedAddress: { type: 'string', maxLength: 255 },
        placeId: { type: 'string', maxLength: 255 },
        types: { type: 'array', items: { type: 'string' } },
      },
    },
    createdAt: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/, required: false },
    lastLogin: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/, required: false, allowNull: true },
    emailVerified: { type: 'boolean', default: false },
  };
  const { error } = validateInput(userData, schema);
  if (error) {
    showNotification(`Données de mise à jour invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error('Données de mise à jour invalides');
  }
  return true;
}

/**
 * Valide les préférences utilisateur.
 * @param {Object} preferences - Préférences utilisateur.
 * @param {boolean} [preferences.notifications=true] - Activer/désactiver les notifications.
 * @param {string} [preferences.language='fr'] - Langue de préférence (fr, en).
 * @param {string} [preferences.fcmToken] - Token FCM pour notifications push (optionnel).
 * @returns {boolean} - True si les préférences sont valides.
 * @throws {Error} - Si les préférences sont invalides.
 */
function validatePreferences(preferences) {
  const schema = {
    preferences: {
      type: 'object',
      required: true,
      properties: {
        notifications: { type: 'boolean', default: true },
        language: { type: 'string', enum: ['fr', 'en'], default: 'fr' },
        fcmToken: { type: 'string', required: false, allowNull: true },
      },
    },
  };
  const { error } = validateInput({ preferences }, schema);
  if (error) {
    showNotification(`Préférences invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error('Préférences invalides');
  }
  return true;
}

/**
 * Valide les données de facture.
 * @param {Object} invoice - Données de la facture.
 * @param {string} invoice.id - ID de la facture (UUID).
 * @param {string} invoice.userId - ID de l'utilisateur (UUID).
 * @param {number} invoice.amount - Montant de la facture (minimum 0).
 * @param {Array} invoice.items - Liste des éléments de la facture.
 * @param {string} invoice.date - Date de création (format ISO).
 * @param {string} invoice.dueDate - Date d'échéance (format ISO).
 * @param {string} invoice.url - URL de la facture.
 * @returns {boolean} - True si les données sont valides.
 * @throws {Error} - Si les données sont invalides.
 */
function validateInvoice(invoice) {
  const schema = {
    invoice: {
      type: 'object',
      required: true,
      properties: {
        id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
        userId: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
        amount: { type: 'number', min: 0, required: true },
        items: {
          type: 'array',
          required: true,
          items: {
            type: 'object',
            properties: {
              description: { type: 'string', minLength: 1, maxLength: 500, required: true },
              quantity: { type: 'number', min: 1, required: true },
              unitPrice: { type: 'number', min: 0, required: true },
            },
          },
        },
        date: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/, default: () => new Date().toISOString() },
        dueDate: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/, required: true },
        url: { type: 'string', pattern: /^https?:\/\/.+/ },
      },
    },
  };
  const { error } = validateInput({ invoice }, schema);
  if (error) {
    showNotification(`Données de facture invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error('Données de facture invalides');
  }
  return true;
}

/**
 * Valide un ID d’utilisateur ou de facture.
 * @param {string} id - ID à valider.
 * @param {string} fieldName - Nom du champ pour le message d'erreur.
 * @returns {boolean} - True si l'ID est valide.
 * @throws {Error} - Si l'ID est invalide.
 */
function validateId(id, fieldName) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
  };
  const { error } = validateInput({ id }, schema);
  if (error) {
    showNotification(`${fieldName} invalide : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error(`${fieldName} invalide`);
  }
  return true;
}

/**
 * API pour gérer les utilisateurs dans L&L Ouest Services.
 * @namespace userApi
 */
const userApi = {
  /**
   * Crée un nouvel utilisateur.
   * @async
   * @param {Object} userData - Données de l'utilisateur.
   * @returns {Promise<Object>} - Utilisateur créé.
   * @throws {Error} - En cas d'erreur de création.
   */
  async createUser(userData) {
    try {
      validateCreateUserData(userData);
      const response = await apiFetch('/users', 'POST', userData, false, { context: 'Création Utilisateur' });
      showNotification('Utilisateur créé avec succès.', 'success');
      return response.data.user;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la création de l’utilisateur', {
        context: 'Création Utilisateur',
        sourceContext: 'create-user',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Récupère le profil de l'utilisateur connecté.
   * @async
   * @returns {Promise<Object>} - Profil utilisateur.
   * @throws {Error} - En cas d'erreur de récupération.
   */
  async getProfile() {
    try {
      authGuard();
      const response = await apiFetch('/user/profile', 'GET', null, true, { context: 'Récupération Profil Utilisateur' });
      return response.data.user;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la récupération du profil', {
        context: 'Récupération Profil Utilisateur',
        sourceContext: 'get-profile',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Récupère un utilisateur par son ID.
   * @async
   * @param {string} id - ID de l'utilisateur (UUID).
   * @returns {Promise<Object>} - Utilisateur trouvé.
   * @throws {Error} - En cas d'erreur de récupération.
   */
  async getUserById(id) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateId(id, 'ID utilisateur');
      const response = await apiFetch(`/user/${id}`, 'GET', null, true, { context: 'Récupération Utilisateur par ID' });
      return response.data.user;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la récupération de l’utilisateur', {
        context: 'Récupération Utilisateur par ID',
        sourceContext: 'get-user-by-id',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Récupère un utilisateur par son email.
   * @async
   * @param {string} email - Email de l'utilisateur.
   * @returns {Promise<Object>} - Utilisateur trouvé.
   * @throws {Error} - En cas d'erreur de récupération.
   */
  async getUserByEmail(email) {
    try {
      authGuard();
      roleGuard(['admin']);
      const schema = { email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ } };
      validateInput({ email }, schema);
      const response = await apiFetch(`/user/email/${email}`, 'GET', null, true, { context: 'Récupération Utilisateur par Email' });
      return response.data.user;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la récupération de l’utilisateur par email', {
        context: 'Récupération Utilisateur par Email',
        sourceContext: 'get-user-by-email',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Met à jour le profil de l'utilisateur connecté.
   * @async
   * @param {Object} userData - Données à mettre à jour.
   * @returns {Promise<Object>} - Utilisateur mis à jour.
   * @throws {Error} - En cas d'erreur de mise à jour.
   */
  async updateProfile(userData) {
    try {
      authGuard();
      validateUpdateUserData(userData);
      const response = await apiFetch('/user/profile', 'PUT', userData, true, { context: 'Mise à Jour Profil Utilisateur' });
      showNotification('Profil mis à jour avec succès.', 'success');
      return response.data.user;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la mise à jour du profil', {
        context: 'Mise à Jour Profil Utilisateur',
        sourceContext: 'update-profile',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Met à jour un utilisateur (admin uniquement).
   * @async
   * @param {string} id - ID de l'utilisateur (UUID).
   * @param {Object} userData - Données à mettre à jour.
   * @returns {Promise<Object>} - Utilisateur mis à jour.
   * @throws {Error} - En cas d'erreur de mise à jour.
   */
  async updateUser(id, userData) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateUpdateUserData({ id, ...userData });
      const response = await apiFetch(`/user/${id}`, 'PUT', userData, true, { context: 'Mise à Jour Utilisateur' });
      showNotification('Utilisateur mis à jour avec succès.', 'success');
      return response.data.user;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la mise à jour de l’utilisateur', {
        context: 'Mise à Jour Utilisateur',
        sourceContext: 'update-user',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Supprime un utilisateur.
   * @async
   * @param {string} id - ID de l'utilisateur (UUID).
   * @returns {Promise<void>}
   * @throws {Error} - En cas d'erreur de suppression.
   */
  async deleteUser(id) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateId(id, 'ID utilisateur');
      await apiFetch(`/user/${id}`, 'DELETE', null, true, { context: 'Suppression Utilisateur' });
      showNotification('Utilisateur supprimé avec succès.', 'success');
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la suppression de l’utilisateur', {
        context: 'Suppression Utilisateur',
        sourceContext: 'delete-user',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Récupère tous les utilisateurs avec pagination.
   * @async
   * @param {number} [page=1] - Numéro de page.
   * @param {number} [limit=10] - Limite par page.
   * @returns {Promise<Object>} - Liste des utilisateurs et métadonnées de pagination.
   * @throws {Error} - En cas d'erreur de récupération.
   */
  async getAllUsers(page = 1, limit = 10) {
    try {
      authGuard();
      roleGuard(['admin']);
      const schema = {
        page: { type: 'number', min: 1 },
        limit: { type: 'number', min: 1, max: 100 },
      };
      validateInput({ page, limit }, schema);
      const response = await apiFetch(`/users?page=${page}&limit=${limit}`, 'GET', null, true, { context: 'Récupération Liste Utilisateurs' });
      return response.data;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la récupération des utilisateurs', {
        context: 'Récupération Liste Utilisateurs',
        sourceContext: 'get-all-users',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Récupère les utilisateurs par rôle.
   * @async
   * @param {string} role - Rôle des utilisateurs (client, provider, admin).
   * @param {number} [page=1] - Numéro de page.
   * @param {number} [limit=10] - Limite par page.
   * @returns {Promise<Object>} - Liste des utilisateurs et métadonnées de pagination.
   * @throws {Error} - En cas d'erreur de récupération.
   */
  async getUsersByRole(role, page = 1, limit = 10) {
    try {
      authGuard();
      roleGuard(['admin']);
      const schema = {
        role: { type: 'string', enum: ['client', 'provider', 'admin'], required: true },
        page: { type: 'number', min: 1 },
        limit: { type: 'number', min: 1, max: 100 },
      };
      validateInput({ role, page, limit }, schema);
      const response = await apiFetch(`/user/role/${role}?page=${page}&limit=${limit}`, 'GET', null, true, { context: 'Récupération Utilisateurs par Rôle' });
      return response.data;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la récupération des utilisateurs par rôle', {
        context: 'Récupération Utilisateurs par Rôle',
        sourceContext: 'get-users-by-role',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Met à jour les préférences utilisateur.
   * @async
   * @param {Object} preferences - Préférences à mettre à jour.
   * @returns {Promise<Object>} - Utilisateur mis à jour.
   * @throws {Error} - En cas d'erreur de mise à jour.
   */
  async updatePreferences(preferences) {
    try {
      authGuard();
      validatePreferences(preferences);
      const response = await apiFetch('/user/preferences', 'PATCH', { preferences }, true, { context: 'Mise à Jour Préférences Utilisateur' });
      showNotification('Préférences mises à jour avec succès.', 'success');
      return response.data.user;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la mise à jour des préférences', {
        context: 'Mise à Jour Préférences Utilisateur',
        sourceContext: 'update-preferences',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Ajoute une facture à l'utilisateur.
   * @async
   * @param {Object} invoice - Données de la facture.
   * @returns {Promise<Object>} - Utilisateur mis à jour.
   * @throws {Error} - En cas d'erreur d’ajout.
   */
  async addInvoice(invoice) {
    try {
      authGuard();
      validateInvoice(invoice);
      const response = await apiFetch('/user/invoices', 'POST', { invoice }, true, { context: 'Ajout Facture Utilisateur' });
      showNotification('Facture ajoutée avec succès.', 'success');
      return response.data.user;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de l’ajout de la facture', {
        context: 'Ajout Facture Utilisateur',
        sourceContext: 'add-invoice',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },

  /**
   * Supprime une facture de l'utilisateur.
   * @async
   * @param {string} invoiceId - ID de la facture (UUID).
   * @returns {Promise<void>}
   * @throws {Error} - En cas d'erreur de suppression.
   */
  async removeInvoice(invoiceId) {
    try {
      authGuard();
      validateId(invoiceId, 'ID de facture');
      await apiFetch(`/user/invoices/${invoiceId}`, 'DELETE', null, true, { context: 'Suppression Facture Utilisateur' });
      showNotification('Facture supprimée avec succès.', 'success');
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la suppression de la facture', {
        context: 'Suppression Facture Utilisateur',
        sourceContext: 'remove-invoice',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },
  
  /**
   * Vérifie la disponibilité d'un email.
   * @async
   * @param {string} email - Email à vérifier.
   * @returns {Promise<boolean>} - True si l'email est disponible, false sinon.
   * @throws {Error} - En cas d'erreur de validation ou d'authentification.
   */
  async checkEmailAvailability(email) {
    try {
      if (typeof Joi === 'undefined') {
        console.error('Joi-browser n\'est pas chargé. Assurez-vous d\'inclure le script Joi-browser via un CDN.');
        throw new Error('Erreur de configuration : Joi-browser requis.');
      }

      const emailSchema = Joi.string().email().required().label('Email');
      const cleanedEmail = email ? decodeURIComponent(email.trim()) : '';

      const { error } = emailSchema.validate(cleanedEmail);
      if (error) {
        const errorMessage = error.details[0].message.includes('is not allowed to be empty')
          ? 'L\'email est requis.'
          : 'L\'email n\'est pas valide.';
        throw new Error(errorMessage);
      }

      const response = await apiFetch(`/user/check-email/${encodeURIComponent(cleanedEmail)}`, 'GET', null, false, { context: 'Vérification Disponibilité Email' });
      if (response === undefined) {
        console.warn('⚠️ Backend indisponible, email considéré comme non disponible.');
        return false;
      }

      return response.data.available;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la vérification de l\'email', {
        context: 'Vérification Disponibilité Email',
        sourceContext: 'check-email-availability',
        isCritical: false,
        iconSvg: `
          <svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
        actions: error.suggestion ? [{
          text: 'Suivre la suggestion',
          href: '#',
          class: 'bg-ll-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-Cinzel shadow-md hover:shadow-lg transition-all duration-300',
          svg: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }] : [],
      });
      throw handledError;
    }
  },
};

export default userApi;
