/**
 * @file contactApi.js
 * @description Gestion des appels API pour les messages de contact ET réservations dans L&L Ouest Services.
 * Intègre la validation des données, les guards de sécurité, et la gestion des tokens.
 * Envoie des notifications par email au client et à l'admin avec des templates professionnels.
 * Mise à jour pour intégrer le nouveau formatErrorMessage avec contexte + méthodes pour réservations.
 * @module api/contactApi
 * @version 1.2.0
 * @author L&L Ouest Services Team
 * @lastUpdated 2025-10-05
 * @license MIT
 * @dependencies apiFetch, handleApiError, showNotification, validateInput, getStoredToken, authGuard, roleGuard, fetchLogoBase64, emailTemplates
 * @changelog
 * - v1.2.0: Ajout des méthodes pour réservations (createReservation, getReservation, updateReservation, deleteReservation, getAllReservations).
 * - v1.1.0: Ajout du paramètre context dans tous les appels apiFetch pour une gestion d'erreur contextualisée avec formatErrorMessage.
 * - v1.0.0: Version initiale avec intégration des templates email et validation des données.
 */

import { showNotification, validateInput, getStoredToken, authGuard, roleGuard, handleApiError, apiFetch, fetchLogoBase64 } from '../modules/utils.js';
import emailTemplates from '../mail/emailTemplates.js';

/**
 * Valide les données de contact.
 * @param {Object} contactData - Données du contact.
 * @param {string} contactData.id - Identifiant unique du contact (UUID).
 * @param {string} [contactData.userId] - Identifiant de l'utilisateur associé (UUID, optionnel).
 * @param {string} contactData.name - Nom du contact (2-100 caractères).
 * @param {string} [contactData.phone] - Numéro de téléphone (format +33 suivi de 9 chiffres, optionnel).
 * @param {string} contactData.email - Email du contact (format valide).
 * @param {string} contactData.message - Contenu du message (10-1000 caractères).
 * @param {string} [contactData.subjects] - Sujets du message, séparés par des tirets (optionnel).
 * @param {string} contactData.createdAt - Date de création (format ISO).
 * @returns {boolean} - True si les données sont valides.
 * @throws {Error} - Si les données sont invalides.
 */
function validateContactData(contactData) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    userId: { type: 'string', required: false, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    name: { type: 'string', required: true, minLength: 2, maxLength: 100, pattern: /^[a-zA-Z\s-]{2,100}$/ },
    phone: { type: 'string', required: false, pattern: /^\+33\s?\d{1,2}(\s?\d{2}){4}$/ },
    email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, maxLength: 255 },
    message: { type: 'string', required: true, minLength: 10, maxLength: 1000 },
    subjects: { type: 'string', required: false, minLength: 3, maxLength: 500 },
    createdAt: { type: 'string', required: true, pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/ },
  };

  const { error } = validateInput(contactData, schema);
  if (error) {
    showNotification(`Données de contact invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error(`Données de contact invalides : ${error.details.map(d => d.message).join(', ')}`);
  }
  return true;
}

/**
 * Valide les données de réservation (extension pour service).
 * @param {Object} reservationData - Données de la réservation.
 * @param {string} reservationData.id - Identifiant unique (UUID).
 * @param {string} reservationData.serviceId - ID du service (string).
 * @param {string} reservationData.name - Nom (2-100 caractères).
 * @param {string} reservationData.email - Email valide.
 * @param {string} [reservationData.phone] - Téléphone optionnel.
 * @param {string} reservationData.date - Date (format YYYY-MM-DD, future).
 * @param {string} reservationData.frequency - Fréquence (enum: ponctuelle, hebdomadaire, etc.).
 * @param {string} [reservationData.options] - Options séparées par tirets.
 * @param {string} reservationData.message - Message (10-1000 caractères).
 * @param {string} reservationData.createdAt - Date ISO.
 * @returns {boolean} - True si valide.
 * @throws {Error} - Si invalide.
 */
function validateReservationData(reservationData) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    serviceId: { type: 'string', required: true, minLength: 1 },
    name: { type: 'string', required: true, minLength: 2, maxLength: 100, pattern: /^[a-zA-Z\s-]{2,100}$/ },
    phone: { type: 'string', required: false, pattern: /^\+33\s?\d{1,2}(\s?\d{2}){4}$/ },
    email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, maxLength: 255 },
    date: { type: 'string', required: true, pattern: /^\d{4}-\d{2}-\d{2}$/, custom: (val) => new Date(val) >= new Date() },
    frequency: { type: 'string', required: true, enum: ['ponctuelle', 'hebdomadaire', 'bi-mensuelle', 'mensuelle'] },
    options: { type: 'string', required: false, minLength: 3, maxLength: 500 },
    message: { type: 'string', required: true, minLength: 10, maxLength: 1000 },
    createdAt: { type: 'string', required: true, pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/ },
  };

  const { error } = validateInput(reservationData, schema);
  if (error) {
    showNotification(`Données de réservation invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error(`Données de réservation invalides : ${error.details.map(d => d.message).join(', ')}`);
  }
  return true;
}

/**
 * Valide l'ID de contact/réservation.
 * @param {Object} data - Données contenant l'ID.
 * @param {string} data.id - Identifiant unique du contact (UUID).
 * @returns {boolean} - True si l'ID est valide.
 * @throws {Error} - Si l'ID est invalide.
 */
function validateId(data) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
  };
  const { error } = validateInput(data, schema);
  if (error) {
    showNotification(`ID invalide : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error(`ID invalide : ${error.details.map(d => d.message).join(', ')}`);
  }
  return true;
}

/**
 * Valide les paramètres de pagination.
 * @param {Object} data - Données de pagination.
 * @param {number} data.page - Numéro de la page (minimum 1).
 * @param {number} data.limit - Nombre d'éléments par page (1 à 100).
 * @returns {boolean} - True si les données sont valides.
 * @throws {Error} - Si les données sont invalides.
 */
function validatePagination(data) {
  const schema = {
    page: { type: 'number', required: true, min: 1, default: 1 },
    limit: { type: 'number', required: true, min: 1, max: 100, default: 10 },
  };
  const { error } = validateInput(data, schema);
  if (error) {
    showNotification(`Paramètres de pagination invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error(`Paramètres de pagination invalides : ${error.details.map(d => d.message).join(', ')}`);
  }
  return true;
}

/**
 * Valide les données de réponse.
 * @param {Object} replyData - Données de la réponse.
 * @param {string} replyData.id - Identifiant unique du contact (UUID).
 * @param {string} replyData.replyMessage - Contenu de la réponse (10-2000 caractères).
 * @param {string} [replyData.htmlTemplate] - Template HTML pour l'email (optionnel).
 * @param {string} [replyData.replySubject] - Sujet de la réponse (optionnel, 3-100 caractères).
 * @returns {boolean} - True si les données sont valides.
 * @throws {Error} - Si les données sont invalides.
 */
function validateReplyData(replyData) {
  const schema = {
    id: { type: 'string', required: true, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/ },
    replyMessage: { type: 'string', required: true, minLength: 10, maxLength: 2000 },
    htmlTemplate: { type: 'string', required: false },
    replySubject: { type: 'string', required: false, minLength: 3, maxLength: 100 },
  };
  const { error } = validateInput(replyData, schema);
  if (error) {
    showNotification(`Données de réponse invalides : ${error.details.map(d => d.message).join(', ')}`, 'error', false, { showConfirmButton: true, confirmButtonText: 'Okay' });
    throw new Error(`Données de réponse invalides : ${error.details.map(d => d.message).join(', ')}`);
  }
  return true;
}

/**
 * API pour gérer les messages de contact ET réservations dans L&L Ouest Services.
 * @namespace contactApi
 */
const contactApi = {
  /**
   * Crée un nouveau message de contact via l'API et envoie des emails de confirmation (client) et notification (admin).
   * Valide les données avant envoi, génère un ID unique, et utilise les templates emails avec toutes les données nécessaires.
   * Affiche une notification utilisateur en cas de succès ou d'erreur.
   * @async
   * @function createContact
   * @param {Object} contactData - Données du contact à envoyer.
   * @param {string} contactData.name - Nom du contact (2-100 caractères).
   * @param {string} contactData.email - Email du contact (format valide).
   * @param {string} [contactData.phone] - Numéro de téléphone (optionnel, format +33 suivi de 9 chiffres).
   * @param {string} [contactData.subjects] - Sujets du message, séparés par des tirets (optionnel, 3-500 caractères).
   * @param {string} contactData.message - Contenu du message (10-1000 caractères).
   * @param {string} [contactData.userId] - ID de l'utilisateur associé (optionnel, UUID).
   * @returns {Promise<Object>} - Données du contact créé, incluant l'ID et le statut des emails.
   * @throws {Error} - En cas d'erreur de validation ou d'échec de l'API.
   */
  async createContact(contactData) {
    try {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      const normalizedContactData = {
        id,
        name: contactData.name?.trim(),
        email: contactData.email?.trim().toLowerCase(),
        phone: contactData.phone?.trim(),
        subjects: contactData.subjects?.trim() || 'Nouveau message de contact',
        message: contactData.message?.trim(),
        createdAt,
        userId: contactData.userId?.trim() || null,
      };

      validateContactData(normalizedContactData);

      const templateData = {
        id: normalizedContactData.id,
        name: normalizedContactData.name,
        email: normalizedContactData.email,
        phone: normalizedContactData.phone || 'N/A',
        subjects: normalizedContactData.subjects,
        message: normalizedContactData.message,
        createdAt: new Date(normalizedContactData.createdAt).toLocaleDateString('fr-FR'),
        company: 'L&L Ouest Services',
        currentYear: new Date().getFullYear(),
        supportPhone: '+33 1 23 45 67 89',
        website: 'https://www.llouestservices.com',
        logoBase64: await fetchLogoBase64(),
      };

      const response = await apiFetch('/contact', 'POST', {
        ...normalizedContactData,
        clientHtmlTemplate: emailTemplates.contactClientConfirmation(templateData),
        adminHtmlTemplate: emailTemplates.contactAdminNotification(templateData),
      }, false, { context: 'Création Message Contact' });

      showNotification('Message de contact envoyé avec succès.', 'success');
      return response.data.contact;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de l’envoi du message de contact', {
        context: 'Création Message Contact',
        sourceContext: 'create-contact',
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
      showNotification(handledError.message || 'Erreur lors de l’envoi du message de contact.', 'error');
      throw handledError;
    }
  },


    /**
   * Crée une nouvelle réservation via l'API et envoie des emails de confirmation (client) et notification (admin).
   * Valide les données avant envoi, génère un ID unique, et utilise les templates emails adaptés aux réservations.
   * Affiche une notification utilisateur en cas de succès ou d'erreur.
   * @async
   * @function createReservation
   * @param {Object} reservationData - Données de la réservation à envoyer.
   * @param {string} reservationData.serviceId - ID du service réservé.
   * @param {string} reservationData.serviceName - Nom du service réservé.
   * @param {string} reservationData.serviceCategory - Catégorie du service réservé.
   * @param {string} reservationData.name - Nom du client (2-100 caractères).
   * @param {string} reservationData.email - Email du client (format valide).
   * @param {string} [reservationData.phone] - Numéro de téléphone (optionnel, format +33 suivi de 9 chiffres).
   * @param {string} reservationData.date - Date de réservation (format YYYY-MM-DD, future).
   * @param {string} reservationData.frequency - Fréquence (ponctuelle, hebdomadaire, etc.).
   * @param {string} [reservationData.options] - Options, séparées par des tirets (optionnel, 3-500 caractères).
   * @param {string} reservationData.message - Instructions spéciales (10-1000 caractères).
   * @param {string} [reservationData.userId] - ID de l'utilisateur associé (optionnel, UUID).
   * @returns {Promise<Object>} - Données de la réservation créée, incluant l'ID et le statut des emails.
   * @throws {Error} - En cas d'erreur de validation ou d'échec de l'API.
   */
  async createReservation(reservationData) {
    try {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      const normalizedReservationData = {
        id,
        serviceId: reservationData.serviceId?.trim(),
        serviceName: reservationData.serviceName?.trim(),
        serviceCategory: reservationData.serviceCategory?.trim(),
        name: reservationData.name?.trim(),
        email: reservationData.email?.trim().toLowerCase(),
        phone: reservationData.phone?.trim(),
        date: reservationData.date?.trim(),
        frequency: reservationData.frequency?.trim(),
        options: reservationData.options?.trim() || 'Standard',
        message: reservationData.message?.trim(),
        createdAt,
        userId: reservationData.userId?.trim() || null,
      };

      validateReservationData(normalizedReservationData);

      const templateData = {
        id: normalizedReservationData.id,
        serviceId: normalizedReservationData.serviceId,
        serviceName: normalizedReservationData.serviceName,
        serviceCategory: normalizedReservationData.serviceCategory,
        name: normalizedReservationData.name,
        email: normalizedReservationData.email,
        phone: normalizedReservationData.phone || 'N/A',
        date: new Date(normalizedReservationData.date).toLocaleDateString('fr-FR'),
        frequency: normalizedReservationData.frequency,
        options: normalizedReservationData.options,
        message: normalizedReservationData.message,
        createdAt: new Date(normalizedReservationData.createdAt).toLocaleDateString('fr-FR'),
        company: 'L&L Ouest Services',
        currentYear: new Date().getFullYear(),
        supportPhone: '+33 1 23 45 67 89',
        website: 'https://www.llouestservices.com',
        logoBase64: await fetchLogoBase64(),
      };

      const response = await apiFetch('/reservations', 'POST', {
        ...normalizedReservationData,
        clientHtmlTemplate: emailTemplates.reservationClientConfirmation(templateData),
        adminHtmlTemplate: emailTemplates.reservationAdminNotification(templateData),
      }, false, { context: 'Création Réservation' });

      showNotification('Réservation créée avec succès.', 'success');
      return response.data.reservation;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la création de la réservation', {
        context: 'Création Réservation',
        sourceContext: 'create-reservation',
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
      showNotification(handledError.message || 'Erreur lors de la création de la réservation.', 'error');
      throw handledError;
    }
  },

  /**
   * Récupère une réservation spécifique par son ID.
   * @async
   * @function getReservation
   * @param {string} id - Identifiant unique de la réservation (UUID).
   * @returns {Promise<Object>} - Données de la réservation.
   * @throws {Error} - En cas d'erreur de validation ou d'échec de l'API.
   */
  async getReservation(id) {
    try {
      authGuard();
      validateId({ id });
      const response = await apiFetch(`/reservations/${id}`, 'GET', null, true, { context: 'Récupération Réservation' });
      return response.data.reservation;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la récupération de la réservation', {
        context: 'Récupération Réservation',
        sourceContext: 'get-reservation',
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
   * Met à jour une réservation existante.
   * @async
   * @function updateReservation
   * @param {string} id - Identifiant unique de la réservation (UUID).
   * @param {Object} reservationData - Données de la réservation à mettre à jour.
   * @param {string} reservationData.serviceId - ID du service.
   * @param {string} reservationData.name - Nom du client (2-100 caractères).
   * @param {string} reservationData.email - Email du client (format valide).
   * @param {string} [reservationData.phone] - Numéro de téléphone (optionnel).
   * @param {string} reservationData.date - Date de réservation (YYYY-MM-DD, future).
   * @param {string} reservationData.frequency - Fréquence (ponctuelle, etc.).
   * @param {string} [reservationData.options] - Options séparées par tirets.
   * @param {string} reservationData.message - Instructions (10-1000 caractères).
   * @param {string} [reservationData.userId] - ID utilisateur (UUID).
   * @param {string} [reservationData.createdAt] - Date création (ISO, optionnel).
   * @returns {Promise<Object>} - Données de la réservation mise à jour.
   * @throws {Error} - En cas d'erreur de validation ou d'échec de l'API.
   */
  async updateReservation(id, reservationData) {
    try {
      authGuard();
      roleGuard(['client', 'admin']);
      validateReservationData({ ...reservationData, id, createdAt: reservationData.createdAt || new Date().toISOString() });
      const response = await apiFetch(`/reservations/${id}`, 'PUT', reservationData, true, { context: 'Mise à Jour Réservation' });
      showNotification('Réservation mise à jour avec succès.', 'success');
      return response.data.reservation;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la mise à jour de la réservation', {
        context: 'Mise à Jour Réservation',
        sourceContext: 'update-reservation',
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
   * Supprime une réservation.
   * @async
   * @function deleteReservation
   * @param {string} id - Identifiant unique de la réservation (UUID).
   * @returns {Promise<void>}
   * @throws {Error} - En cas d'erreur de validation ou d'échec de l'API.
   */
  async deleteReservation(id) {
    try {
      authGuard();
      roleGuard(['client', 'admin']);
      validateId({ id });
      await apiFetch(`/reservations/${id}`, 'DELETE', null, true, { context: 'Suppression Réservation' });
      showNotification('Réservation supprimée avec succès.', 'success');
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la suppression de la réservation', {
        context: 'Suppression Réservation',
        sourceContext: 'delete-reservation',
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
   * Récupère toutes les réservations avec pagination et filtres.
   * @async
   * @function getAllReservations
   * @param {number} [page=1] - Numéro de la page (minimum 1).
   * @param {number} [limit=10] - Nombre d'éléments par page (1 à 100).
   * @param {Object} [filters={}] - Filtres pour la requête (ex. { serviceId, email }).
   * @returns {Promise<Object>} - Liste des réservations et métadonnées de pagination.
   * @throws {Error} - En cas d'erreur de validation ou d'échec de l'API.
   */
  async getAllReservations(page = 1, limit = 10, filters = {}) {
    try {
      authGuard();
      roleGuard(['admin']);
      validatePagination({ page, limit });
      const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      for (const [key, value] of Object.entries(filters)) {
        if (value) query.append(key, value);
      }
      const response = await apiFetch(`/reservations?${query.toString()}`, 'GET', null, true, { context: 'Récupération Liste Réservations' });
      return response.data;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la récupération des réservations', {
        context: 'Récupération Liste Réservations',
        sourceContext: 'get-all-reservations',
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
   * Récupère un message de contact spécifique par son ID.
   * @async
   * @function getContact
   * @param {string} id - Identifiant unique du contact (UUID).
   * @returns {Promise<Object>} - Données du contact.
   * @throws {Error} - En cas d'erreur de validation ou d'échec de l'API.
   */
  async getContact(id) {
    try {
      authGuard();
      validateId({ id });
      const response = await apiFetch(`/contacts/${id}`, 'GET', null, true, { context: 'Récupération Message Contact' });
      return response.data.contact;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la récupération du message de contact', {
        context: 'Récupération Message Contact',
        sourceContext: 'get-contact',
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
   * Met à jour un message de contact existant.
   * @async
   * @function updateContact
   * @param {string} id - Identifiant unique du contact (UUID).
   * @param {Object} contactData - Données du contact à mettre à jour.
   * @param {string} contactData.name - Nom du contact (2-100 caractères).
   * @param {string} contactData.email - Email du contact (format valide).
   * @param {string} [contactData.phone] - Numéro de téléphone (optionnel, format +33 suivi de 9 chiffres).
   * @param {string} [contactData.subjects] - Sujets du message, séparés par des tirets (optionnel).
   * @param {string} contactData.message - Contenu du message (10-1000 caractères).
   * @param {string} [contactData.userId] - ID de l'utilisateur associé (optionnel, UUID).
   * @param {string} [contactData.createdAt] - Date de création (format ISO, optionnel).
   * @returns {Promise<Object>} - Données du contact mis à jour.
   * @throws {Error} - En cas d'erreur de validation ou d'échec de l'API.
   */
  async updateContact(id, contactData) {
    try {
      authGuard();
      roleGuard(['client', 'admin']);
      validateContactData({ ...contactData, id, createdAt: contactData.createdAt || new Date().toISOString() });
      const response = await apiFetch(`/contacts/${id}`, 'PUT', contactData, true, { context: 'Mise à Jour Message Contact' });
      showNotification('Message de contact mis à jour avec succès.', 'success');
      return response.data.contact;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la mise à jour du message de contact', {
        context: 'Mise à Jour Message Contact',
        sourceContext: 'update-contact',
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
   * Supprime un message de contact.
   * @async
   * @function deleteContact
   * @param {string} id - Identifiant unique du contact (UUID).
   * @returns {Promise<void>}
   * @throws {Error} - En cas d'erreur de validation ou d'échec de l'API.
   */
  async deleteContact(id) {
    try {
      authGuard();
      roleGuard(['client', 'admin']);
      validateId({ id });
      await apiFetch(`/contacts/${id}`, 'DELETE', null, true, { context: 'Suppression Message Contact' });
      showNotification('Message de contact supprimé avec succès.', 'success');
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la suppression du message de contact', {
        context: 'Suppression Message Contact',
        sourceContext: 'delete-contact',
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
   * Récupère tous les messages de contact avec pagination et filtres.
   * @async
   * @function getAllContacts
   * @param {number} [page=1] - Numéro de la page (minimum 1).
   * @param {number} [limit=10] - Nombre d'éléments par page (1 à 100).
   * @param {Object} [filters={}] - Filtres pour la requête (ex. { userId, email }).
   * @returns {Promise<Object>} - Liste des contacts et métadonnées de pagination.
   * @throws {Error} - En cas d'erreur de validation ou d'échec de l'API.
   */
  async getAllContacts(page = 1, limit = 10, filters = {}) {
    try {
      authGuard();
      roleGuard(['admin']);
      validatePagination({ page, limit });
      const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      for (const [key, value] of Object.entries(filters)) {
        if (value) query.append(key, value);
      }
      const response = await apiFetch(`/contacts?${query.toString()}`, 'GET', null, true, { context: 'Récupération Liste Messages Contact' });
      return response.data;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de la récupération des messages de contact', {
        context: 'Récupération Liste Messages Contact',
        sourceContext: 'get-all-contacts',
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
   * Envoie une réponse à un message de contact.
   * @async
   * @function replyToContact
   * @param {string} id - Identifiant unique du contact (UUID).
   * @param {string} replyMessage - Contenu de la réponse (10-2000 caractères).
   * @param {string} [htmlTemplate] - Template HTML pour l'email (optionnel).
   * @param {string} [replySubject] - Sujet de la réponse (optionnel, 3-100 caractères).
   * @returns {Promise<Object>} - Données de la réponse envoyée.
   * @throws {Error} - En cas d'erreur de validation ou d'échec de l'API.
   */
  async replyToContact(id, replyMessage, htmlTemplate, replySubject) {
    try {
      authGuard();
      roleGuard(['admin']);
      validateReplyData({ id, replyMessage, htmlTemplate, replySubject });
      const response = await apiFetch(`/contacts/${id}/reply`, 'POST', {
        id,
        replyMessage,
        htmlTemplate: htmlTemplate || emailTemplates.contactReply({
          id,
          replyMessage,
          company: 'L&L Ouest Services',
          currentYear: new Date().getFullYear(),
          supportPhone: '+33 1 23 45 67 89',
          website: 'https://www.llouestservices.com',
          logoBase64: await fetchLogoBase64(),
        }),
        replySubject,
      }, true, { context: 'Réponse Message Contact' });
      showNotification('Réponse envoyée avec succès.', 'success');
      return response.data;
    } catch (error) {
      const handledError = await handleApiError(error, 'Erreur lors de l’envoi de la réponse', {
        context: 'Réponse Message Contact',
        sourceContext: 'reply-to-contact',
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

export default contactApi;
