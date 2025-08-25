/**
 * @file userApi.js
 * @description Gestion des appels API pour les utilisateurs dans L&L Ouest Services.
 * Intègre des guards pour l'authentification, des validations côté client avec UUID,
 * et la gestion des tokens.
 * @module api/userApi
 */

import { showNotification, validateInput, getStoredToken, roleGuard, authGuard, handleApiError ,apiFetch } from '../modules/utils.js';



/**
 * Valide les données pour créer un utilisateur.
 * @param {Object} userData - Données de l'utilisateur.
 * @returns {boolean} Vrai si les données sont valides.
 * @throws {Error} Si les données sont invalides.
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
    showNotification(`Données utilisateur invalides : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error('Données utilisateur invalides');
  }
  return true;
}

/**
 * Valide les données pour mettre à jour un utilisateur.
 * @param {Object} userData - Données de l'utilisateur.
 * @returns {boolean} Vrai si les données sont valides.
 * @throws {Error} Si les données sont invalides.
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
    showNotification(`Données de mise à jour invalides : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error('Données de mise à jour invalides');
  }
  return true;
}

/**
 * Valide les préférences utilisateur.
 * @param {Object} preferences - Préférences utilisateur.
 * @returns {boolean} Vrai si les préférences sont valides.
 * @throws {Error} Si les préférences sont invalides.
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
    showNotification(`Préférences invalides : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error('Préférences invalides');
  }
  return true;
}

/**
 * Valide les données de facture.
 * @param {Object} invoice - Données de la facture.
 * @returns {boolean} Vrai si les données sont valides.
 * @throws {Error} Si les données sont invalides.
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
    showNotification(`Données de facture invalides : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error('Données de facture invalides');
  }
  return true;
}

/**
 * Valide un ID d’utilisateur ou de facture.
 * @param {string} id - ID à valider.
 * @param {string} fieldName - Nom du champ pour le message d'erreur.
 * @returns {boolean} Vrai si l'ID est valide.
 * @throws {Error} Si l'ID est invalide.
 */
function validateId(id, fieldName) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
  };
  const { error } = validateInput({ id }, schema);
  if (error) {
    showNotification(`${fieldName} invalide : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error(`${fieldName} invalide`);
  }
  return true;
}

const userApi = {
  /**
   * Crée un nouvel utilisateur.
   * @async
   * @param {Object} userData - Données de l'utilisateur.
   * @returns {Promise<Object>} Utilisateur créé.
   * @throws {Error} En cas d'erreur de création.
   */
  async createUser(userData) {
    try {
      validateCreateUserData(userData);
      const response = await apiFetch('/users', 'POST', userData, false);
      showNotification('Utilisateur créé avec succès.', 'success');
      return response.data.user;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la création de l’utilisateur');
    }
  },

  /**
   * Récupère le profil de l'utilisateur connecté.
   * @async
   * @returns {Promise<Object>} Profil utilisateur.
   * @throws {Error} En cas d'erreur de récupération.
   */
  async getProfile() {
    try {
      authGuard();
      const response = await apiFetch('/users/profile', 'GET');
      return response.data.user;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération du profil');
    }
  },

  /**
   * Récupère un utilisateur par son ID.
   * @async
   * @param {string} id - ID de l'utilisateur.
   * @returns {Promise<Object>} Utilisateur trouvé.
   * @throws {Error} En cas d'erreur de récupération.
   */
  async getUserById(id) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateId(id, 'ID utilisateur');
      const response = await apiFetch(`/users/${id}`, 'GET');
      return response.data.user;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération de l’utilisateur');
    }
  },

  /**
   * Récupère un utilisateur par son email.
   * @async
   * @param {string} email - Email de l'utilisateur.
   * @returns {Promise<Object>} Utilisateur trouvé.
   * @throws {Error} En cas d'erreur de récupération.
   */
  async getUserByEmail(email) {
    try {
      authGuard();
      roleGuard(['admin']);
      const schema = { email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ } };
      validateInput({ email }, schema);
      const response = await apiFetch(`/users/email/${email}`, 'GET');
      return response.data.user;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération de l’utilisateur par email');
    }
  },

  /**
   * Met à jour le profil de l'utilisateur connecté.
   * @async
   * @param {Object} userData - Données à mettre à jour.
   * @returns {Promise<Object>} Utilisateur mis à jour.
   * @throws {Error} En cas d'erreur de mise à jour.
   */
  async updateProfile(userData) {
    try {
      authGuard();
      validateUpdateUserData(userData);
      const response = await apiFetch('/users/profile', 'PUT', userData);
      showNotification('Profil mis à jour avec succès.', 'success');
      return response.data.user;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la mise à jour du profil');
    }
  },

  /**
   * Met à jour un utilisateur (admin uniquement).
   * @async
   * @param {string} id - ID de l'utilisateur.
   * @param {Object} userData - Données à mettre à jour.
   * @returns {Promise<Object>} Utilisateur mis à jour.
   * @throws {Error} En cas d'erreur de mise à jour.
   */
  async updateUser(id, userData) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateUpdateUserData({ id, ...userData });
      const response = await apiFetch(`/users/${id}`, 'PUT', userData);
      showNotification('Utilisateur mis à jour avec succès.', 'success');
      return response.data.user;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la mise à jour de l’utilisateur');
    }
  },

  /**
   * Supprime un utilisateur.
   * @async
   * @param {string} id - ID de l'utilisateur.
   * @returns {Promise<void>}
   * @throws {Error} En cas d'erreur de suppression.
   */
  async deleteUser(id) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateId(id, 'ID utilisateur');
      await apiFetch(`/users/${id}`, 'DELETE');
      showNotification('Utilisateur supprimé avec succès.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la suppression de l’utilisateur');
    }
  },

  /**
   * Récupère tous les utilisateurs avec pagination.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<Object>} Liste des utilisateurs.
   * @throws {Error} En cas d'erreur de récupération.
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
      const response = await apiFetch(`/users?page=${page}&limit=${limit}`, 'GET');
      return response.data;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération des utilisateurs');
    }
  },

  /**
   * Récupère les utilisateurs par rôle.
   * @async
   * @param {string} role - Rôle des utilisateurs.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<Object>} Liste des utilisateurs.
   * @throws {Error} En cas d'erreur de récupération.
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
      const response = await apiFetch(`/users/role/${role}?page=${page}&limit=${limit}`, 'GET');
      return response.data;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération des utilisateurs par rôle');
    }
  },

  /**
   * Met à jour les préférences utilisateur.
   * @async
   * @param {Object} preferences - Préférences à mettre à jour.
   * @returns {Promise<Object>} Utilisateur mis à jour.
   * @throws {Error} En cas d'erreur de mise à jour.
   */
  async updatePreferences(preferences) {
    try {
      authGuard();
      validatePreferences(preferences);
      const response = await apiFetch('/users/preferences', 'PATCH', { preferences });
      showNotification('Préférences mises à jour avec succès.', 'success');
      return response.data.user;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la mise à jour des préférences');
    }
  },

  /**
   * Ajoute une facture à l'utilisateur.
   * @async
   * @param {Object} invoice - Données de la facture.
   * @returns {Promise<Object>} Utilisateur mis à jour.
   * @throws {Error} En cas d'erreur d’ajout.
   */
  async addInvoice(invoice) {
    try {
      authGuard();
      validateInvoice(invoice);
      const response = await apiFetch('/users/invoices', 'POST', { invoice });
      showNotification('Facture ajoutée avec succès.', 'success');
      return response.data.user;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de l’ajout de la facture');
    }
  },

  /**
   * Supprime une facture de l'utilisateur.
   * @async
   * @param {string} invoiceId - ID de la facture.
   * @returns {Promise<void>}
   * @throws {Error} En cas d'erreur de suppression.
   */
  async removeInvoice(invoiceId) {
    try {
      authGuard();
      validateId(invoiceId, 'ID de facture');
      await apiFetch(`/users/invoices/${invoiceId}`, 'DELETE');
      showNotification('Facture supprimée avec succès.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la suppression de la facture');
    }
  },
};

export default userApi;
