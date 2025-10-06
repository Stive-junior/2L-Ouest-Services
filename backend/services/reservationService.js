/**
 * @file reservationService.js
 * @description Service pour gérer les réservations dans L&L Ouest Services.
 * Fournit des opérations CRUD pour les réservations avec envoi d'emails de confirmation/réponse et enrichissement des données.
 * @module services/reservationService
 */

const { reservationRepo } = require('../repositories');
const emailService = require('./emailService');
const socketService = require('./socketService');
const { logger, logInfo, logError, logAudit, logWarn } = require('./loggerService');
const { AppError } = require('../utils/errorUtils');
const handlebars = require('handlebars');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * @typedef {Object} Reservation
 * @property {string} id - ID de la réservation.
 * @property {string} serviceId - ID du service réservé.
 * @property {string} serviceName - Nom du service réservé.
 * @property {string} serviceCategory - Catégorie du service réservé.
 * @property {string} userId - ID de l'utilisateur (optionnel).
 * @property {string} name - Nom du client.
 * @property {string} email - Email du client.
 * @property {string} phone - Numéro de téléphone du client (optionnel).
 * @property {string} date - Date souhaitée de l'intervention.
 * @property {string} frequency - Fréquence de la réservation.
 * @property {string} address - Adresse d'intervention.
 * @property {string} options - Options supplémentaires (séparées par des tirets, optionnel).
 * @property {string} message - Instructions ou message spécial.
 * @property {boolean} consentement - Acceptation des conditions.
 * @property {string} createdAt - Date de création.
 * @property {string} reply - Réponse de l'admin (optionnel).
 * @property {string} repliedAt - Date de réponse (optionnel).
 * @property {string} status - Statut de la réservation ('pending'|'confirmed'|'completed'|'cancelled').
 * @property {string} updatedAt - Date de mise à jour (optionnel).
 * @property {string} updatedBy - ID de l'utilisateur qui a mis à jour (optionnel).
 * @property {string} deletedAt - Date de suppression (soft delete, optionnel).
 * @property {string} deletedBy - ID de l'utilisateur qui a supprimé (optionnel).
 * @property {string} emailStatus - Statut des emails envoyés (optionnel).
 * @property {string} errorMessage - Message d'erreur (optionnel).
 */

/**
 * @class ReservationService
 * @description Gère les opérations CRUD pour les réservations avec envoi d'emails et enrichissement.
 */
class ReservationService {
  
  constructor() {
    this.isServiceReady = true;
  }

  async init() {
    try {
      logInfo('Initialisation ReservationService réussie');
      this.isServiceReady = true;
    } catch (error) {
      this.isServiceReady = false;
      logError('Échec initialisation ReservationService (continu au démarrage)', { 
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code,
          name: error.name
        }
      });
    }
  }

  async createReservation(reservationData, clientHtmlTemplate, adminHtmlTemplate) {
    let clientSendResult = null;
    let adminSendResult = null;
    let reservationCache = null;

    try {
      if (!reservationData.email || !reservationData.name || !reservationData.message || !reservationData.date || !reservationData.frequency || !reservationData.address || !reservationData.serviceId || !reservationData.serviceName || !reservationData.serviceCategory || !reservationData.consentement) {
        throw new AppError(400, 'Données de réservation incomplètes (nom, email, message, date, fréquence, adresse, service requis et consentement accepté)');
      }

      const reservation = await reservationRepo.create({
        ...reservationData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        email: reservationData.email,
        phone: reservationData.phone,
        options: reservationData.options,
        status: 'pending',
      });

      reservationCache = reservation;

      logInfo('Réservation créée en base de données', {
        reservationId: reservation.id,
        name: reservation.name,
        email: reservation.email,
        serviceName: reservation.serviceName,
        serviceCategory: reservation.serviceCategory,
        hasPhone: !!reservation.phone,
        hasOptions: !!reservation.options,
        messageLength: reservation.message.length,
        date: reservation.date,
        frequency: reservation.frequency,
      });

      // Envoi de la confirmation au client
      if (clientHtmlTemplate) {
        clientSendResult = await this.sendReservationEmail(
          reservation.id,
          reservation.email,
          clientHtmlTemplate,
          'Confirmation de votre réservation - L&L Ouest Services',
          { isClientConfirmation: true }
        );
      }

      // Envoi de la notification à l'admin (config.smtp.user ou fallback)
      if (adminHtmlTemplate) {
        const adminEmail = config.smtp?.user || 'nanatchoffojunior@gmail.com';
        adminSendResult = await this.sendReservationEmail(
          reservation.id,
          adminEmail,
          adminHtmlTemplate,
          `Nouvelle réservation reçue - ${reservation.name}`,
          { isAdminNotification: true }
        );
      }

      if (reservation.userId) {
        socketService.emitToUser(reservation.userId, 'newReservation', {
          reservationId: reservation.id,
          clientSent: !!clientSendResult,
          adminSent: !!adminSendResult,
        });
      }

      logAudit('Réservation créée et emails envoyés avec succès', {
        reservationId: reservation.id,
        name: reservation.name,
        email: reservation.email,
        serviceName: reservation.serviceName,
        hasOptions: !!reservation.options,
        clientEmailSent: !!clientSendResult,
        adminEmailSent: !!adminSendResult,
        clientMessageId: clientSendResult?.messageId,
        adminMessageId: adminSendResult?.messageId,
      });

      return {
        ...reservation,
        emailStatus: {
          clientSent: !!clientSendResult,
          adminSent: !!adminSendResult,
          clientMessageId: clientSendResult?.messageId,
          adminMessageId: adminSendResult?.messageId,
          sentAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        name: error.name,
        reservationData: {
          name: reservationData.name,
          email: reservationData.email,
          hasMessage: !!reservationData.message,
          hasOptions: !!reservationData.options,
          hasPhone: !!reservationData.phone,
          hasDate: !!reservationData.date,
          hasFrequency: !!reservationData.frequency,
          hasAddress: !!reservationData.address,
          hasServiceId: !!reservationData.serviceId,
          hasServiceName: !!reservationData.serviceName,
          hasServiceCategory: !!reservationData.serviceCategory,
          consentement: !!reservationData.consentement,
          userId: reservationData.userId,
        },
        clientTemplateProvided: !!clientHtmlTemplate,
        adminTemplateProvided: !!adminHtmlTemplate,
        clientSent: !!clientSendResult,
        adminSent: !!adminSendResult,
        reservationCacheId: reservationCache?.id,
      };
      
      logError('Erreur lors de la création de la réservation', errorDetails);


      if (reservationCache && reservationCache.id) {
        try {
          await reservationRepo.update(reservationCache.id, {
            status: 'created_email_failed',
            errorMessage: error.message.substring(0, 500),
          });
          logWarn('Réservation marquée comme échouée après erreur de création', { reservationId: reservationCache.id });
        } catch (updateError) {
          logError('Échec mise à jour statut réservation après erreur', { 
            reservationId: reservationCache.id, 
            updateError: updateError.message 
          });
        }
      }

      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création de la réservation', error.message);
    }
  }

  async getReservation(reservationId) {
    try {
      if (!reservationId || typeof reservationId !== 'string') {
        throw new AppError(400, 'ID de réservation invalide');
      }

      const reservation = await reservationRepo.getById(reservationId);
      if (!reservation) {
        throw new AppError(404, 'Réservation non trouvée');
      }

      const enrichedReservation = {
        ...reservation,
        optionsArray: reservation.options ? reservation.options.split('-').map(s => s.trim()).filter(s => s.length > 0) : [],
        optionsCount: reservation.options ? reservation.options.split('-').filter(s => s.trim().length > 0).length : 0,
        optionsPreview: reservation.options ? (reservation.options.length > 50 ? reservation.options.substring(0, 50) + '...' : reservation.options) : 'N/A',
        messagePreview: reservation.message ? (reservation.message.length > 100 ? reservation.message.substring(0, 100) + '...' : reservation.message) : '',
        messageLength: reservation.message ? reservation.message.length : 0,
        createdAtFormatted: reservation.createdAt ? new Date(reservation.createdAt).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : null,
        repliedAtFormatted: reservation.repliedAt ? new Date(reservation.repliedAt).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : null,
        dateFormatted: reservation.date ? new Date(reservation.date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }) : null,
        statusLabel: this.getStatusLabel(reservation.status),
        phoneValid: reservation.phone && reservation.phone.startsWith('+33') && reservation.phone.length === 12,
        consentementAccepted: reservation.consentement === true,
        emailStatus: reservation.emailStatus || {
          clientSent: false,
          adminSent: false,
          sentAt: null,
        },
      };

      logInfo('Réservation récupérée avec succès', {
        reservationId,
        name: reservation.name,
        status: reservation.status,
        hasOptions: !!reservation.options,
        optionsCount: enrichedReservation.optionsCount,
        messageLength: enrichedReservation.messageLength,
        phoneValid: enrichedReservation.phoneValid,
        consentementAccepted: enrichedReservation.consentementAccepted,
      });

      return enrichedReservation;
    } catch (error) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        name: error.name,
        reservationId,
      };
      logError('Erreur lors de la récupération de la réservation', errorDetails);
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de la réservation', error.message);
    }
  }

  getStatusLabel(status) {
    const statusLabels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      completed: 'Terminée',
      cancelled: 'Annulée',
      created_email_failed: 'Créée (email échoué)',
      spam: 'Spam',
      closed: 'Fermée',
      deleted: 'Supprimée',
    };
    return statusLabels[status] || status;
  }

  async updateReservation(reservationId, reservationData) {
    try {
      if (!reservationId || typeof reservationId !== 'string') {
        throw new AppError(400, 'ID de réservation invalide');
      }

      if (Object.keys(reservationData).length === 0) {
        throw new AppError(400, 'Aucune donnée à mettre à jour fournie');
      }

      if (reservationData.options !== undefined && typeof reservationData.options === 'string') {
        reservationData.options = reservationData.options.trim().replace(/,/g, '-').trim();
        if (reservationData.options.length === 0) {
          reservationData.options = null;
        }
      }

      if (reservationData.phone !== undefined && typeof reservationData.phone === 'string') {
        const normalizedPhone = reservationData.phone.trim().replace(/[^\d+]/g, '');
        if (normalizedPhone.startsWith('33')) {
          reservationData.phone = '+33' + normalizedPhone.substring(2);
        } else if (normalizedPhone.startsWith('0')) {
          reservationData.phone = '+33' + normalizedPhone.substring(1);
        }
        if (normalizedPhone.length !== 12 || !normalizedPhone.startsWith('+33')) {
          reservationData.phone = null;
        }
      }

      if (reservationData.status === undefined) {
        reservationData.status = 'pending';
      }

      if (reservationData.consentement !== undefined) {
        reservationData.consentement = reservationData.consentement === true || reservationData.consentement === 'on';
      }

      const reservation = await reservationRepo.update(reservationId, reservationData);
      if (!reservation) {
        throw new AppError(404, 'Réservation non trouvée');
      }

      const enrichedReservation = {
        ...reservation,
        optionsArray: reservation.options ? reservation.options.split('-').map(s => s.trim()).filter(s => s.length > 0) : [],
        optionsCount: reservation.options ? reservation.options.split('-').filter(s => s.trim().length > 0).length : 0,
        optionsPreview: reservation.options ? (reservation.options.length > 50 ? reservation.options.substring(0, 50) + '...' : reservation.options) : 'N/A',
        messagePreview: reservation.message ? (reservation.message.length > 100 ? reservation.message.substring(0, 100) + '...' : reservation.message) : '',
        messageLength: reservation.message ? reservation.message.length : 0,
        createdAtFormatted: reservation.createdAt ? new Date(reservation.createdAt).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : null,
        repliedAtFormatted: reservation.repliedAt ? new Date(reservation.repliedAt).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : null,
        dateFormatted: reservation.date ? new Date(reservation.date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }) : null,
        statusLabel: this.getStatusLabel(reservation.status),
        phoneValid: reservation.phone && reservation.phone.startsWith('+33') && reservation.phone.length === 12,
        consentementAccepted: reservation.consentement === true,
        emailStatus: reservation.emailStatus || {
          clientSent: false,
          adminSent: false,
          sentAt: null,
        },
      };

      if (reservation.userId) {
        socketService.emitToUser(reservation.userId, 'reservationUpdated', {
          reservationId,
          updatedFields: Object.keys(reservationData),
          newStatus: enrichedReservation.statusLabel,
        });
      }

      if (reservationData.status && reservationData.status !== 'pending') {
        socketService.emitToUser('reservationStatusChanged', {
          reservationId,
          newStatus: enrichedReservation.statusLabel,
          updatedBy: reservationData.updatedBy || 'system',
        });
      }

      logAudit('Réservation mise à jour avec succès', {
        reservationId,
        updatedFields: Object.keys(reservationData),
        oldStatus: reservationData.status ? 'N/A' : 'unchanged',
        newStatus: enrichedReservation.status,
        hasOptions: !!enrichedReservation.options,
        optionsCount: enrichedReservation.optionsCount,
      });

      return enrichedReservation;
    } catch (error) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        name: error.name,
        reservationId,
        updatedFields: Object.keys(reservationData || {}),
        hasOptions: !!reservationData?.options,
      };
      logError('Erreur lors de la mise à jour de la réservation', errorDetails);
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour de la réservation', error.message);
    }
  }

  async deleteReservation(reservationId, deletedBy) {
    try {
      if (!reservationId || typeof reservationId !== 'string') {
        throw new AppError(400, 'ID de réservation invalide');
      }

      const reservation = await reservationRepo.getById(reservationId);
      if (!reservation) {
        throw new AppError(404, 'Réservation non trouvée');
      }

      const deletedAt = new Date().toISOString();
      await reservationRepo.update(reservationId, {
        status: 'deleted',
        deletedAt,
        deletedBy: deletedBy || null,
      });

      const deletedReservation = {
        ...reservation,
        status: 'deleted',
        deletedAt,
        deletedBy,
        statusLabel: 'Supprimée',
        optionsArray: reservation.options ? reservation.options.split('-').map(s => s.trim()).filter(s => s.length > 0) : [],
        optionsCount: reservation.options ? reservation.options.split('-').filter(s => s.trim().length > 0).length : 0,
        messagePreview: reservation.message ? (reservation.message.length > 100 ? reservation.message.substring(0, 100) + '...' : reservation.message) : '',
        phoneValid: reservation.phone && reservation.phone.startsWith('+33') && reservation.phone.length === 12,
        consentementAccepted: reservation.consentement === true,
      };

      if (reservation.userId) {
        socketService.emitToUser(reservation.userId, 'reservationDeleted', {
          reservationId,
          deletedAt,
          deletedBy,
          reason: 'archived',
        });
      }

      socketService.emitToAdmins('reservationDeleted', {
        reservationId,
        deletedBy: deletedBy || 'system',
        deletedReservation: {
          name: reservation.name,
          email: reservation.email,
          serviceName: reservation.serviceName,
          date: reservation.date,
          deletedAt,
        },
      });

      logAudit('Réservation supprimée (soft delete)', {
        reservationId,
        name: reservation.name,
        email: reservation.email,
        serviceName: reservation.serviceName,
        deletedBy,
        deletedAt,
        hadOptions: !!reservation.options,
        originalStatus: reservation.status,
      });

      return {
        deletedReservation,
        deletedAt,
        message: 'Réservation supprimée avec succès',
      };
    } catch (error) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        name: error.name,
        reservationId,
        deletedBy,
      };
      logError('Erreur lors de la suppression de la réservation', errorDetails);
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de la réservation', error.message);
    }
  }

  async getAllReservations(page = 1, limit = 10, filters = {}, sortBy = 'createdAt', sortOrder = 'desc') {
    try {
      if (typeof page !== 'number' || page < 1) {
        page = 1;
      }
      if (typeof limit !== 'number' || limit < 1 || limit > 100) {
        limit = 10;
      }

      const normalizedFilters = {
        name: (filters.name || '').trim().toLowerCase(),
        email: (filters.email || '').trim().toLowerCase(),
        status: filters.status || null,
        serviceId: filters.serviceId || null,
        serviceName: (filters.serviceName || '').trim().toLowerCase(),
        serviceCategory: (filters.serviceCategory || '').trim().toLowerCase(),
        frequency: filters.frequency || null,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : null,
        dateTo: filters.dateTo ? new Date(filters.dateTo) : null,
        withReply: filters.withReply === true,
        repliedOnly: filters.repliedOnly === true,
        hasOptions: filters.hasOptions === true,
      };

      if (normalizedFilters.dateFrom && isNaN(normalizedFilters.dateFrom.getTime())) {
        throw new AppError(400, 'Date de début invalide');
      }
      if (normalizedFilters.dateTo && isNaN(normalizedFilters.dateTo.getTime())) {
        throw new AppError(400, 'Date de fin invalide');
      }

      const validSortFields = ['createdAt', 'name', 'email', 'status', 'repliedAt', 'date', 'serviceName'];
      const validSortOrders = ['asc', 'desc'];
      const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const finalSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';

      const result = await reservationRepo.getAll(page, limit, normalizedFilters, finalSortBy, finalSortOrder);

      const enrichedReservations = result.reservations.map(reservation => ({
        ...reservation,
        optionsArray: reservation.options ? reservation.options.split('-').map(s => s.trim()).filter(s => s.length > 0) : [],
        optionsCount: reservation.options ? reservation.options.split('-').filter(s => s.trim().length > 0).length : 0,
        optionsPreview: reservation.options ? (reservation.options.length > 50 ? reservation.options.substring(0, 50) + '...' : reservation.options) : 'N/A',
        messagePreview: reservation.message ? (reservation.message.length > 100 ? reservation.message.substring(0, 100) + '...' : reservation.message) : '',
        messageLength: reservation.message ? reservation.message.length : 0,
        createdAtFormatted: reservation.createdAt ? new Date(reservation.createdAt).toLocaleDateString('fr-FR', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : null,
        repliedAtFormatted: reservation.repliedAt ? new Date(reservation.repliedAt).toLocaleDateString('fr-FR', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : null,
        dateFormatted: reservation.date ? new Date(reservation.date).toLocaleDateString('fr-FR', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) : null,
        statusLabel: this.getStatusLabel(reservation.status),
        hasReply: !!reservation.reply && !!reservation.repliedAt,
        daysSinceCreation: reservation.createdAt ? Math.floor((new Date() - new Date(reservation.createdAt)) / (1000 * 60 * 60 * 24)) : 0,
        daysSinceReply: reservation.repliedAt ? Math.floor((new Date() - new Date(reservation.repliedAt)) / (1000 * 60 * 60 * 24)) : null,
        phoneValid: reservation.phone && reservation.phone.startsWith('+33') && reservation.phone.length === 12,
        consentementAccepted: reservation.consentement === true,
        emailStatus: reservation.emailStatus || {
          clientSent: false,
          adminSent: false,
          sentAt: null,
        },
      }));

      const enrichedResult = {
        ...result,
        reservations: enrichedReservations,
        filters: normalizedFilters,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.total / limit),
          hasNextPage: page < Math.ceil(result.total / limit),
          hasPrevPage: page > 1,
        },
        sort: {
          by: finalSortBy,
          order: finalSortOrder,
        },
        summary: {
          total: result.total,
          pending: enrichedReservations.filter(r => r.status === 'pending').length,
          confirmed: enrichedReservations.filter(r => r.status === 'confirmed').length,
          completed: enrichedReservations.filter(r => r.status === 'completed').length,
          cancelled: enrichedReservations.filter(r => r.status === 'cancelled').length,
          withOptions: enrichedReservations.filter(r => r.optionsCount > 0).length,
          avgMessageLength: enrichedReservations.reduce((sum, r) => sum + r.messageLength, 0) / Math.max(enrichedReservations.length, 1),
        },
      };

      logInfo('Liste des réservations récupérée avec succès', {
        page,
        limit,
        total: result.total,
        reservationsCount: enrichedReservations.length,
        filtersApplied: Object.keys(normalizedFilters).filter(key => normalizedFilters[key]).length,
        sortBy: finalSortBy,
        sortOrder: finalSortOrder,
        pendingCount: enrichedResult.summary.pending,
        confirmedCount: enrichedResult.summary.confirmed,
      });

      return enrichedResult;
    } catch (error) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        name: error.name,
        page,
        limit,
        filtersKeys: Object.keys(filters),
        sortBy,
        sortOrder,
      };
      logError('Erreur lors de la récupération des réservations', errorDetails);
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des réservations', error.message);
    }
  }

  async sendReplyEmail(reservationId, replyMessage, htmlTemplate, replySubject, additionalData = {}) {
    try {
      const reservation = await reservationRepo.getById(reservationId);
      if (!reservation) {
        throw new AppError(404, 'Réservation non trouvée');
      }

      if (!replyMessage || typeof replyMessage !== 'string' || replyMessage.trim().length < 10) {
        throw new AppError(400, 'Message de réponse invalide (minimum 10 caractères)');
      }

      // Load and encode logo in base64
      const logoPath = path.join(__dirname, '../storage/logo.png'); 
      let logoBase64;
      try {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = logoBuffer.toString('base64');
      } catch (fsError) {
        logWarn('Logo non trouvé pour email de réponse de réservation', { path: logoPath, error: fsError.message });
        logoBase64 = '';
      }

      const cleanReply = replyMessage.trim();

      const subject = replySubject ||
        `Re: Votre réservation du ${new Date(reservation.date).toLocaleDateString('fr-FR')} - L&L Ouest Services`;

      let html;
      let text;
      if (htmlTemplate && typeof htmlTemplate === 'string') {
        const template = handlebars.compile(htmlTemplate);
        html = template({
          name: reservation.name,
          email: reservation.email,
          serviceName: reservation.serviceName,
          serviceCategory: reservation.serviceCategory,
          originalMessage: reservation.message,
          originalOptions: reservation.options || 'N/A',
          reply: cleanReply,
          date: new Date(reservation.date).toLocaleDateString('fr-FR'),
          frequency: reservation.frequency,
          address: reservation.address,
          createdAt: new Date(reservation.createdAt).toLocaleDateString('fr-FR'),
          company: 'L&L Ouest Services',
          supportPhone: '+33 1 23 45 67 89',
          website: 'https://www.llouestservices.com',
          repliedByName: additionalData.repliedByName || 'L&L Ouest Services',
          logoBase64,
          ...additionalData,
        });

        // Version text simple
        text = `Bonjour ${reservation.name || 'Utilisateur'},

Réponse à votre réservation du ${new Date(reservation.date).toLocaleDateString('fr-FR')} pour le service "${reservation.serviceName}" (${reservation.serviceCategory}).

Votre message original:
${reservation.message.replace(/\n/g, '\n')}

${reservation.phone ? `Téléphone: ${reservation.phone}` : ''}
${reservation.address ? `Adresse: ${reservation.address}` : ''}
Fréquence: ${reservation.frequency}
Options: ${reservation.options ? reservation.options.replace(/-/g, ', ') : 'Aucune'}

Notre réponse:
${cleanReply.replace(/\n/g, '\n')}

${additionalData.repliedByName ? `Répondu par : ${additionalData.repliedByName}` : ''}

Cordialement,
L&L Ouest Services`;
      } else {
        // Fallback template (updated to match the new design)
        html = `
          <!DOCTYPE html>
          <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Open Sans', Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 0; color: #6c757d; font-size: 14px; line-height: 1.6; }
              .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 6px; overflow: hidden; }
              .header { padding: 20px; border-bottom: 2px solid #2563eb; text-align: center; }
              .header img { width: 60px; height: 60px; margin-bottom: 10px; }
              .header h1 { font-family: 'Merriweather', serif; font-size: 18px; color: #2563eb; margin: 0; font-weight: 700; }
              .content { padding: 20px; }
              .content p { margin: 10px 0; }
              .original-message { border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; margin-bottom: 15px; background-color: #f8f9fa; }
              .original-message h3 { font-family: 'Merriweather', serif; font-size: 16px; color: #2563eb; margin: 0 0 10px; }
              .reply-section { border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; margin-bottom: 15px; }
              .reply-section h3 { font-family: 'Merriweather', serif; font-size: 16px; color: #2563eb; margin: 0 0 10px; }
              .button { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 10px 0; transition: background-color 0.3s; }
              .button:hover { background-color: #1e40af; }
              .footer { border-top: 1px solid #dee2e6; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; }
              .footer a { color: #2563eb; text-decoration: none; }
              .footer a:hover { text-decoration: underline; }
              @media only screen and (max-width: 600px) {
                .container { margin: 10px; padding: 10px; }
                .content { padding: 15px; }
                .button { display: block; text-align: center; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="data:image/png;base64,${logoBase64}" alt="L&L Ouest Services Logo">
                <h1>Réponse à Votre Réservation</h1>
              </div>
              <div class="content">
                <p>Cher(e) ${reservation.name || 'Utilisateur'},</p>
                <p>Merci pour votre réservation du ${new Date(reservation.date).toLocaleDateString('fr-FR')} pour le service "${reservation.serviceName}" (${reservation.serviceCategory}). Voici notre réponse :</p>
                <div class="original-message">
                  <h3>Votre message original :</h3>
                  <p>${reservation.message.replace(/\n/g, '<br>')}</p>
                  ${reservation.phone ? `<p><strong>Téléphone :</strong> ${reservation.phone}</p>` : ''}
                  <p><strong>Adresse :</strong> ${reservation.address}</p>
                  <p><strong>Fréquence :</strong> ${reservation.frequency}</p>
                  ${reservation.options ? `<p><strong>Options :</strong> ${reservation.options.replace(/-/g, ', ')}</p>` : ''}
                </div>
                <div class="reply-section">
                  <h3>Notre réponse :</h3>
                  <p>${cleanReply.replace(/\n/g, '<br>')}</p>
                  ${additionalData.repliedByName ? `<p>Répondu par : ${additionalData.repliedByName}</p>` : ''}
                </div>
                <p>Pour toute question supplémentaire, contactez-nous au <strong>+33 1 23 45 67 89</strong> ou par email à <a href="mailto:contact@llouestservices.com">contact@llouestservices.com</a>.</p>
                <p><a href="https://www.llouestservices.com" class="button">Visiter notre site</a></p>
                <p>Cordialement,<br>L&L Ouest Services</p>
              </div>
              <div class="footer">
                <p>L&L Ouest Services &copy; ${new Date().getFullYear()} | Tous droits réservés<br>
                   <a href="https://www.llouestservices.com">https://www.llouestservices.com</a> | Support : +33 1 23 45 67 89</p>
              </div>
            </div>
          </body>
          </html>
        `;
        text = `Bonjour ${reservation.name || 'Utilisateur'},

Merci pour votre réservation du ${new Date(reservation.date).toLocaleDateString('fr-FR')} pour le service "${reservation.serviceName}" (${reservation.serviceCategory}).

Votre message original:
${reservation.message.replace(/\n/g, '\n')}

${reservation.phone ? `Téléphone: ${reservation.phone}` : ''}
Adresse: ${reservation.address}
Fréquence: ${reservation.frequency}
Options: ${reservation.options ? reservation.options.replace(/-/g, ', ') : 'Aucune'}

Notre réponse:
${cleanReply.replace(/\n/g, '\n')}

${additionalData.repliedByName ? `Répondu par : ${additionalData.repliedByName}` : ''}

Pour toute question supplémentaire, contactez-nous au +33 1 23 45 67 89 ou par email à contact@llouestservices.com.

Cordialement,
L&L Ouest Services`;
      }

      const sendResult = await this.sendEmail({
        to: reservation.email.trim().toLowerCase(),
        subject,
        text,
        html,
        headers: {
          'X-Reservation-ID': reservation.id,
          'X-Reply-ID': crypto.randomUUID(),
          'X-Reply-Type': 'admin_response',
          'X-Replied-By': additionalData.repliedBy || 'system',
        },
      });

      const updatedReservation = await reservationRepo.update(reservationId, {
        reply: cleanReply,
        repliedAt: new Date().toISOString(),
        status: 'replied',
        updatedAt: new Date().toISOString(),
        repliedBy: additionalData.repliedBy || null,
      });

      if (!updatedReservation) {
        throw new AppError(500, 'Échec de la mise à jour de la réservation après envoi de la réponse');
      }

      const enrichedUpdatedReservation = {
        ...updatedReservation,
        optionsArray: updatedReservation.options ? updatedReservation.options.split('-').map(s => s.trim()).filter(s => s.length > 0) : [],
        optionsCount: updatedReservation.options ? updatedReservation.options.split('-').filter(s => s.trim().length > 0).length : 0,
        optionsPreview: updatedReservation.options ? (updatedReservation.options.length > 50 ? updatedReservation.options.substring(0, 50) + '...' : updatedReservation.options) : 'N/A',
        messagePreview: updatedReservation.message ? (updatedReservation.message.length > 100 ? updatedReservation.message.substring(0, 100) + '...' : updatedReservation.message) : '',
        replyPreview: updatedReservation.reply ? (updatedReservation.reply.length > 100 ? updatedReservation.reply.substring(0, 100) + '...' : updatedReservation.reply) : '',
        statusLabel: this.getStatusLabel(updatedReservation.status),
        phoneValid: updatedReservation.phone && updatedReservation.phone.startsWith('+33') && updatedReservation.phone.length === 12,
        consentementAccepted: updatedReservation.consentement === true,
        hasReply: true,
        replyLength: updatedReservation.reply ? updatedReservation.reply.length : 0,
        repliedAtFormatted: updatedReservation.repliedAt ? new Date(updatedReservation.repliedAt).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : null,
        dateFormatted: updatedReservation.date ? new Date(updatedReservation.date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }) : null,
      };

      if (reservation.userId) {
        socketService.emitToUser(reservation.userId, 'reservationReplied', {
          reservationId,
          replyPreview: enrichedUpdatedReservation.replyPreview,
          repliedAt: enrichedUpdatedReservation.repliedAtFormatted,
          messageId: sendResult.messageId,
          repliedBy: additionalData.repliedByName || 'L&L Ouest Services',
        });
      }

      socketService.emitToAdmins('reservationReplied', {
        reservationId,
        repliedTo: reservation.email,
        replyLength: enrichedUpdatedReservation.replyLength,
        messageId: sendResult.messageId,
        repliedBy: additionalData.repliedByName || 'system',
      });

      logAudit('Email de réponse envoyé et réservation mise à jour', {
        reservationId,
        email: reservation.email,
        replyLength: cleanReply.length,
        messageId: sendResult.messageId,
        status: enrichedUpdatedReservation.status,
        repliedBy: additionalData.repliedBy || 'system',
        htmlLength: html.length,
        textLength: text.length,
      });

      return {
        messageId: sendResult.messageId,
        updatedReservation: enrichedUpdatedReservation,
      };
    } catch (error) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        name: error.name,
        reservationId,
        replyLength: replyMessage ? replyMessage.length : 0,
        hasTemplate: !!htmlTemplate,
        subject: replySubject,
        additionalDataKeys: Object.keys(additionalData || {}),
      };
      logError('Erreur lors de l\'envoi de l\'email de réponse de réservation', errorDetails);
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'envoi de l\'email de réponse de réservation', error.message);
    }
  }

  async sendReservationEmail(reservationId, recipient, htmlTemplate, emailSubject, templateData = {}) {
    try {
      if (!reservationId || typeof reservationId !== 'string') {
        throw new AppError(400, 'ID de réservation requis et doit être une chaîne');
      }
      if (!recipient || typeof recipient !== 'string') {
        throw new AppError(400, 'Destinataire email requis');
      }
      if (!htmlTemplate || typeof htmlTemplate !== 'string') {
        throw new AppError(400, 'Template HTML requis');
      }

      const reservation = await reservationRepo.getById(reservationId);
      if (!reservation) {
        throw new AppError(404, 'Réservation non trouvée');
      }

      if (!reservation.email || !reservation.name || !reservation.message || !reservation.date || !reservation.frequency || !reservation.address || !reservation.serviceId || !reservation.serviceName || !reservation.serviceCategory || reservation.consentement !== true) {
        throw new AppError(400, 'Données de réservation incomplètes');
      }

      // Charger et encoder le logo en base64
      const logoPath = path.join(__dirname, '../storage/logo.png');
      let logoBase64;
      try {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = logoBuffer.toString('base64');
      } catch (fsError) {
        logWarn('Logo non trouvé pour email de réservation', { path: logoPath, error: fsError.message });
        logoBase64 = '';
      }

      const subject = emailSubject || `Réservation - ${reservation.name} - ${reservation.serviceName} - L&L Ouest Services`;

      const template = handlebars.compile(htmlTemplate);
      const html = template({
        id: reservation.id,
        serviceId: reservation.serviceId,
        serviceName: reservation.serviceName,
        serviceCategory: reservation.serviceCategory,
        name: reservation.name,
        email: reservation.email,
        phone: reservation.phone || 'N/A',
        date: reservation.date,
        frequency: reservation.frequency,
        address: reservation.address,
        options: reservation.options || 'Aucune option sélectionnée',
        message: reservation.message,
        createdAt: reservation.createdAt ? new Date(reservation.createdAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
        company: 'L&L Ouest Services',
        currentYear: new Date().getFullYear(),
        supportPhone: '+33 1 23 45 67 89',
        website: 'https://www.llouestservices.com',
        logoBase64,
        ...templateData,
      });

      // Version text simple pour compatibilité
      const text = `Bonjour ${reservation.name},

Vous avez soumis une réservation le ${new Date(reservation.createdAt).toLocaleDateString('fr-FR')} pour le service "${reservation.serviceName}" (${reservation.serviceCategory}).

Date souhaitée: ${reservation.date}
Fréquence: ${reservation.frequency}
Adresse: ${reservation.address}
Options: ${reservation.options || 'Aucune'}
Message: ${reservation.message}

Cordialement,
L&L Ouest Services`;

      const result = await emailService.sendEmail({
        to: recipient.trim().toLowerCase(),
        subject,
        text,
        html,
        headers: {
          'X-Reservation-ID': reservation.id,
          'X-Reservation-Name': reservation.name,
          'X-Service-Name': reservation.serviceName,
          'X-Service-Category': reservation.serviceCategory,
        },
      });

      if (reservation.userId) {
        const eventType = templateData.isAdminReply ? 'reservationReplied' : 'reservationEmailSent';
        socketService.emitToUser(reservation.userId, eventType, {
          reservationId: reservation.id,
          recipient,
          messageId: result.messageId,
        });
      }

      const logType = templateData.isAdminReply ? 'réponse admin' :
                     templateData.isClientConfirmation ? 'confirmation client' : 'email réservation';
      logInfo(`Email de réservation ${logType} envoyé`, {
        reservationId,
        recipient,
        messageId: result.messageId,
        serviceName: reservation.serviceName,
        serviceCategory: reservation.serviceCategory,
        subject: subject.substring(0, 50) + (subject.length > 50 ? '...' : ''),
        htmlLength: html.length,
        textLength: text.length,
      });

      return result;
    } catch (error) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        name: error.name,
        reservationId,
        recipient,
        hasTemplate: !!htmlTemplate,
        templateLength: htmlTemplate ? htmlTemplate.length : 0,
        subject: emailSubject,
        templateDataKeys: Object.keys(templateData || {}),
      };
      logError('Erreur lors de l\'envoi de l\'email de réservation', errorDetails);
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'envoi de l\'email de réservation', error.message);
    }
  }
}

module.exports = new ReservationService();