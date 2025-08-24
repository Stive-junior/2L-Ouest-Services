/**
 * @file contactApi.js
 * @description Gestion des appels API pour les messages de contact dans L&L Ouest Services.
 * Intègre la validation des données, les guards de sécurité, et la gestion des tokens.
 * @module api/contactApi
 */

import { getAuth } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { showNotification, validateInput, getStoredToken, authGuard, roleGuard, handleApiError, apiFetch } from '../modules/utils.js';
import emailTemplates from '../templates/emailTemplates.js';

const API_BASE_URL = 'http://localhost:35473/api';
const auth = getAuth();


/**
 * Valide les données de contact.
 * @param {Object} contactData - Données du contact.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validateContactData(contactData) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    userId: { type: 'string', required: false, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    message: { type: 'string', required: true, minLength: 10, maxLength: 1000 },
    subject: { type: 'string', required: false, minLength: 3, maxLength: 100 },
    createdAt: { type: 'string', required: true, pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/ },
  };
  const { error } = validateInput(contactData, schema);
  if (error) {
    showNotification(`Données de contact invalides : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error(`Données de contact invalides : ${error.details}`);
  }
  return true;
}

/**
 * Valide l'ID de contact.
 * @param {Object} data - Données contenant l'ID.
 * @returns {boolean}
 * @throws {Error} Si l'ID est invalide.
 */
function validateId(data) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
  };
  const { error } = validateInput(data, schema);
  if (error) {
    showNotification(`ID de contact invalide : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error(`ID de contact invalide : ${error.details}`);
  }
  return true;
}

/**
 * Valide les paramètres de pagination.
 * @param {Object} data - Données de pagination.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validatePagination(data) {
  const schema = {
    page: { type: 'number', required: true, min: 1, default: 1 },
    limit: { type: 'number', required: true, min: 1, max: 100, default: 10 },
  };
  const { error } = validateInput(data, schema);
  if (error) {
    showNotification(`Paramètres de pagination invalides : ${error.details}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error(`Paramètres de pagination invalides : ${error.details}`);
  }
  return true;
}

const contactApi = {
  /**
   * Crée un nouveau message de contact.
   * @async
   * @param {Object} contactData - Données du contact (id, userId, name, email, message, subject, createdAt).
   * @returns {Promise<Object>} Contact créé.
   */
  async createContact(contactData) {
    try {
      validateContactData({ ...contactData, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
      const response = await apiFetch('/contacts', 'POST', {
        ...contactData,
        htmlTemplate: emailTemplates.contactConfirmation({
          name: contactData.name,
          subject: contactData.subject || 'Nouveau message de contact',
          message: contactData.message,
        }),
      }, false);
      showNotification('Message de contact envoyé avec succès.', 'success');
      return response.data.contact;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de l’envoi du message de contact');
    }
  },

  /**
   * Récupère un message de contact par son ID.
   * @async
   * @param {string} id - ID du contact.
   * @returns {Promise<Object>} Contact trouvé.
   */
  async getContact(id) {
    try {
      authGuard();
      validateId({ id });
      const response = await apiFetch(`/contacts/${id}`, 'GET');
      return response.data.contact;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération du message de contact');
    }
  },

  /**
   * Met à jour un message de contact.
   * @async
   * @param {string} id - ID du contact.
   * @param {Object} contactData - Données à mettre à jour.
   * @returns {Promise<Object>} Contact mis à jour.
   */
  async updateContact(id, contactData) {
    try {
      authGuard();
      roleGuard(['client', 'admin']);
      validateContactData({ ...contactData, id, createdAt: contactData.createdAt || new Date().toISOString() });
      const response = await apiFetch(`/contacts/${id}`, 'PUT', contactData);
      showNotification('Message de contact mis à jour avec succès.', 'success');
      return response.data.contact;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la mise à jour du message de contact');
    }
  },

  /**
   * Supprime un message de contact.
   * @async
   * @param {string} id - ID du contact.
   * @returns {Promise<void>}
   */
  async deleteContact(id) {
    try {
      authGuard();
      roleGuard(['client', 'admin']);
      validateId({ id });
      await apiFetch(`/contacts/${id}`, 'DELETE');
      showNotification('Message de contact supprimé avec succès.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la suppression du message de contact');
    }
  },

  /**
   * Récupère tous les messages de contact avec pagination.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<Object>} Liste des contacts.
   */
  async getAllContacts(page = 1, limit = 10) {
    try {
      authGuard();
      roleGuard(['admin']);
      validatePagination({ page, limit });
      const response = await apiFetch(`/contacts?page=${page}&limit=${limit}`, 'GET');
      return response.data;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération des messages de contact');
    }
  },
};

export default contactApi;
