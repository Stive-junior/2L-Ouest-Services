/**
 * @file documentApi.js
 * @description Gestion des appels API pour les factures dans L&L Ouest Services.
 * Intègre la validation des données, les guards de sécurité, et la gestion des tokens.
 * @module api/documentApi
 */

import { getAuth } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { showNotification, validateInput, getStoredToken,apiFetch, authGuard, roleGuard, handleApiError } from '../modules/utils.js';

const auth = getAuth();


/**
 * Valide les données pour créer une facture.
 * @param {Object} invoiceData - Données de la facture.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validateCreateInvoiceData(invoiceData) {
  const schema = {
    amount: { type: 'number', required: true, min: 0 },
    items: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        properties: {
          description: { type: 'string', required: true, minLength: 3, maxLength: 500 },
          quantity: { type: 'number', required: true, min: 1 },
          unitPrice: { type: 'number', required: true, min: 0 },
        },
      },
    },
    dueDate: { type: 'string', required: true, pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/ },
    htmlTemplate: { type: 'string', required: true, minLength: 10 },
  };
  const { error } = validateInput(invoiceData, schema);
  if (error) throw new Error(`Données de la facture invalides : ${error.details}`);
  return true;
}

/**
 * Valide les données pour mettre à jour une facture.
 * @param {Object} invoiceData - Données de la facture.
 * @returns {boolean}
 * @throws {Error} Si les données sont invalides.
 */
function validateUpdateInvoiceData(invoiceData) {
  const schema = {
    id: { type: 'string', required: true },
    amount: { type: 'number', min: 0, required: false },
    items: {
      type: 'array',
      required: false,
      items: {
        type: 'object',
        properties: {
          description: { type: 'string', required: true, minLength: 3, maxLength: 500 },
          quantity: { type: 'number', required: true, min: 1 },
          unitPrice: { type: 'number', required: true, min: 0 },
        },
      },
    },
    dueDate: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/, required: false },
  };
  const { error } = validateInput(invoiceData, schema);
  if (error) throw new Error(`Données de mise à jour invalides : ${error.details}`);
  return true;
}

/**
 * Valide l'ID de facture.
 * @param {Object} data - Données contenant l'ID.
 * @returns {boolean}
 * @throws {Error} Si l'ID est invalide.
 */
function validateId(data) {
  const schema = { id: { type: 'string', required: true } };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`ID de facture invalide : ${error.details}`);
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
    page: { type: 'number', min: 1, default: 1 },
    limit: { type: 'number', min: 1, max: 100, default: 10 },
  };
  const { error } = validateInput(data, schema);
  if (error) throw new Error(`Paramètres de pagination invalides : ${error.details}`);
  return true;
}

const documentApi = {
  /**
   * Génère une nouvelle facture.
   * @async
   * @param {Object} invoiceData - Données de la facture (amount, items, dueDate, htmlTemplate).
   * @returns {Promise<Object>} Facture générée.
   */
  async generateInvoice(invoiceData) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateCreateInvoiceData(invoiceData);
      const response = await apiFetch('/documents', 'POST', invoiceData);
      showNotification('Facture générée avec succès.', 'success');
      return response.data.invoice;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la génération de la facture');
    }
  },

  /**
   * Récupère une facture par son ID.
   * @async
   * @param {string} id - ID de la facture.
   * @returns {Promise<Object>} Facture trouvée.
   */
  async getInvoice(id) {
    try {
      authGuard();
      validateId({ id });
      const response = await apiFetch(`/documents/${id}`, 'GET');
      return response.data.invoice;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération de la facture');
    }
  },

  /**
   * Met à jour une facture.
   * @async
   * @param {string} id - ID de la facture.
   * @param {Object} invoiceData - Données à mettre à jour.
   * @returns {Promise<Object>} Facture mise à jour.
   */
  async updateInvoice(id, invoiceData) {
    try {
      authGuard();
      roleGuard(['client', 'admin']);
      validateUpdateInvoiceData({ id, ...invoiceData });
      const response = await apiFetch(`/documents/${id}`, 'PUT', { id, ...invoiceData });
      showNotification('Facture mise à jour avec succès.', 'success');
      return response.data.invoice;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la mise à jour de la facture');
    }
  },

  /**
   * Supprime une facture.
   * @async
   * @param {string} id - ID de la facture.
   * @returns {Promise<void>}
   */
  async deleteInvoice(id) {
    try {
      authGuard();
      roleGuard(['client', 'admin']);
      validateId({ id });
      await apiFetch(`/documents/${id}`, 'DELETE');
      showNotification('Facture supprimée avec succès.', 'success');
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la suppression de la facture');
    }
  },

  /**
   * Récupère les factures de l'utilisateur connecté avec pagination.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<Object>} Liste des factures.
   */
  async getUserInvoices(page = 1, limit = 10) {
    try {
      authGuard();
      validatePagination({ page, limit });
      const response = await apiFetch(`/documents?page=${page}&limit=${limit}`, 'GET');
      return response.data;
    } catch (error) {
      throw await handleApiError(error, 'Erreur lors de la récupération des factures');
    }
  },
};

export default documentApi;
