const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const config = require('../config/config');
const { userRepo, contactRepo } = require('../repositories');
const socketService = require('./socketService');
const { logger, logInfo, logError, logAudit } = require('./loggerService');
const { AppError } = require('../utils/errorUtils');

/**
 * @typedef {Object} Contact
 * @property {string} id - ID du message de contact.
 * @property {string} userId - ID de l'utilisateur.
 * @property {string} name - Nom du contact.
 * @property {string} email - Email du contact.
 * @property {string} phone - Numéro de téléphone du contact.
 * @property {string} subjects - Sujets du message (séparés par des tirets).
 * @property {string} message - Contenu du message.
 * @property {string} createdAt - Date de création du message.
 * @property {string} reply - Réponse de l'admin (optionnel).
 * @property {string} repliedAt - Date de réponse (optionnel).
 * @property {string} status - Statut du contact ('pending'|'replied'|'archived').
 */

/**
 * @class EmailService
 * @description Gère l'envoi d'emails personnalisés pour L&L Ouest Services.
 */
class EmailService {
  
  constructor() {

  this.transporter = nodemailer.createTransport({
    host: config.smtp.host, 
    port: config.smtp.port, 
    secure: config.smtp.secure,  
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },

    pool: false, 
    connectionTimeout: 120000, 
    greetingTimeout: 60000,     
    socketTimeout: 60000,       

    opportunisticTLS: true,     
    ignoreTLS: false,     
    logger: true,      
    debug: true, 
    tls: {
      rejectUnauthorized: true  
    },

    lmtp: false
  });

  this.isSmtpVerified = false;

}



  async verifyTransporterWithRetry(maxRetries = 3, delayMs = 5000) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logInfo(`Vérification SMTP (tentative ${attempt}/${maxRetries})`);
        await this.transporter.verify();
        this.isSmtpVerified = true;
        logInfo('Configuration SMTP vérifiée avec succès');
        return true;
      } catch (error) {
        lastError = error;
        
        if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
          logWarn(`Timeout SMTP détecté : ${error.message}. Vérifiez firewall Render ou port SMTP.`);
         }

        logWarn(`Échec de la vérification SMTP (tentative ${attempt}/${maxRetries})`, { error: error.message });
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    this.isSmtpVerified = false;
    logError('Vérification SMTP échouée après retries', { error: lastError?.message });

    if (config.nodeEnv === 'production') {
      throw new AppError(500, 'Configuration SMTP invalide après retries', lastError?.message);
     }
    return false;
  }


  async init() {
    try {
      await this.verifyTransporter();
      this.smtpReady = true;
      logInfo('Initialisation SMTP réussie');
    } catch (error) {
      this.smtpReady = false;
      logError('Échec initialisation SMTP (continu au démarrage)', { error: error.message });
    }
  }

  async verifyTransporter() {
    return await this.verifyTransporterWithRetry();
  }

  async sendEmail(options) {
    try {

     if (!this.isSmtpVerified) {
        const verified = await this.verifyTransporterWithRetry(2, 3000);
        if (!verified) {
          throw new AppError(503, 'Service SMTP temporairement indisponible', 'SMTP not ready');
        }
      }

      if (!options.to || typeof options.to !== 'string') {
        throw new AppError(400, 'Destinataire email requis et doit être une chaîne');
      }
      if (!options.subject || typeof options.subject !== 'string') {
        throw new AppError(400, 'Sujet de l\'email requis');
      }
      if (!options.html || typeof options.html !== 'string') {
        throw new AppError(400, 'Contenu HTML requis');
      }

      const cleanTo = options.to.trim().toLowerCase();

      const mailOptions = {
        from: `"L&L Ouest Services" <${config.smtp.user}>`,
        to: cleanTo,
        cc: options.cc ? options.cc.trim().split(',').map(email => email.trim().toLowerCase()) : undefined,
        bcc: options.bcc ? options.bcc.trim().split(',').map(email => email.trim().toLowerCase()) : undefined,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments || [],
        headers: options.headers || {},
        tracking: {
          clickTracking: { enable: true, skipQueryParam: true },
          openTracking: { enable: true },
        },
      };

      const result = await this.transporter.sendMail(mailOptions);

      logInfo('Email envoyé avec succès', {
        messageId: result.messageId,
        to: cleanTo,
        subject: options.subject,
        response: result.response,
      });

      return {
        messageId: result.messageId,
        response: result.response,
        accepted: result.accepted,
        rejected: result.rejected,
      };
    } catch (error) {
      logError('Erreur lors de l\'envoi de l\'email', {
        error: error.message,
        to: options.to,
        subject: options.subject,
      });
      if (error.code === 'ECONNECTION' || error.message.includes('timeout')) {
        this.isSmtpVerified = false;
      }
      throw new AppError(500, 'Erreur serveur lors de l\'envoi de l\'email', error.message);
    }
  }

  async sendContactEmail(contactId, recipient, htmlTemplate, emailSubject, templateData = {}) {
  try {
    if (!contactId || typeof contactId !== 'string') {
      throw new AppError(400, 'ID de contact requis et doit être une chaîne');
    }
    if (!recipient || typeof recipient !== 'string') {
      throw new AppError(400, 'Destinataire email requis');
    }
    if (!htmlTemplate || typeof htmlTemplate !== 'string') {
      throw new AppError(400, 'Template HTML requis');
    }

    const contact = await contactRepo.getById(contactId);
    if (!contact) {
      throw new AppError(404, 'Message de contact non trouvé');
    }

    if (!contact.email || !contact.name || !contact.message) {
      throw new AppError(400, 'Données de contact incomplètes');
    }

    // Charger et encoder le logo en base64
    const logoPath = path.join(__dirname, '../storage/logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString('base64');

    const subject = emailSubject || `Message de contact - ${contact.name} - L&L Ouest Services`;

    const template = handlebars.compile(htmlTemplate);
    const html = template({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone || 'N/A',
      subjects: contact.subjects || 'Nouveau message de contact',
      message: contact.message,
      createdAt: contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
      company: 'L&L Ouest Services',
      currentYear: new Date().getFullYear(),
      supportPhone: '+33 1 23 45 67 89',
      website: 'https://www.llouestservices.com',
      ...templateData,
    });

    const result = await this.sendEmail({
      to: recipient.trim().toLowerCase(),
      subject,
      html,
      headers: {
        'X-Contact-ID': contact.id,
        'X-Contact-Name': contact.name,
        'X-Contact-Subjects': contact.subjects || '',
      },
    });

    if (contact.userId) {
      const eventType = templateData.isAdminReply ? 'contactReplied' : 'contactEmailSent';
      socketService.emitToUser(contact.userId, eventType, {
        contactId: contact.id,
        recipient,
        messageId: result.messageId,
      });
    }

    const logType = templateData.isAdminNotification ? 'notification admin' :
                   templateData.isClientConfirmation ? 'confirmation client' : 'email contact';
    logInfo(`Email de contact ${logType} envoyé`, {
      contactId,
      recipient,
      messageId: result.messageId,
      subjects: contact.subjects,
      subject: subject.substring(0, 50) + (subject.length > 50 ? '...' : ''),
    });

    return result;
  } catch (error) {
    logError('Erreur lors de l\'envoi de l\'email de contact', {
      error: error.message,
      contactId,
      recipient,
      hasTemplate: !!htmlTemplate,
      templateLength: htmlTemplate ? htmlTemplate.length : 0,
    });
    throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'envoi de l\'email de contact', error.message);
  }
}




  async sendInvoiceEmail(userId, invoicePath, invoice, htmlTemplate, additionalData = {}) {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new AppError(400, 'ID d\'utilisateur requis');
    }
    if (!invoicePath || typeof invoicePath !== 'string') {
      throw new AppError(400, 'Chemin de la facture requis');
    }
    if (!invoice || typeof invoice !== 'object') {
      throw new AppError(400, 'Détails de la facture requis');
    }
    if (!htmlTemplate || typeof htmlTemplate !== 'string') {
      throw new AppError(400, 'Template HTML requis');
    }

    const user = await userRepo.getById(userId);
    if (!user) {
      throw new AppError(404, 'Utilisateur non trouvé');
    }

    
    const logoPath = path.join(__dirname, '../storage/logo.png'); 
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString('base64');

    const template = handlebars.compile(htmlTemplate);
    const html = template({
      name: user.name,
      email: user.email,
      invoiceId: invoice.id || invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber || invoice.id || `LL${Date.now()}`,
      amount: invoice.amount || invoice.total || '0.00',
      date: invoice.date ? new Date(invoice.date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-FR') : 'N/A',
      company: 'L&L Ouest Services',
      currency: invoice.currency || '€',
      currentYear: new Date().getFullYear(),
      supportPhone: '+33 1 23 45 67 89',
      website: 'https://www.llouestservices.com',
      logoBase64: logoBase64,
      link: invoice.link || '#',
      ...additionalData,
    });

    const attachments = [{
      filename: `facture-${invoice.id || invoice.invoiceId || 'LL' + Date.now()}.pdf`,
      path: invoicePath,
      contentType: 'application/pdf',
      ...(invoice.description && { description: invoice.description }),
    }];

    const result = await this.sendEmail({
      to: user.email.trim().toLowerCase(),
      subject: `Votre facture ${invoice.id || invoice.invoiceId} - L&L Ouest Services`,
      html,
      attachments,
      headers: {
        'X-Invoice-ID': invoice.id || invoice.invoiceId,
        'X-User-ID': userId,
      },
    });

    socketService.emitToUser(userId, 'invoiceEmailSent', {
      invoiceId: invoice.id || invoice.invoiceId,
      messageId: result.messageId,
    });

    logAudit('Email de facture envoyé avec succès', {
      userId,
      invoiceId: invoice.id || invoice.invoiceId,
      amount: invoice.amount || invoice.total,
      messageId: result.messageId,
    });

    return result;
  } catch (error) {
    logError('Erreur lors de l\'envoi de l\'email de facture', {
      error: error.message,
      userId,
      invoiceId: invoice?.id,
      hasTemplate: !!htmlTemplate,
    });
    throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'envoi de l\'email de facture', error.message);
  }
}

  async createContact(contactData, clientHtmlTemplate, adminHtmlTemplate) {
    let clientSendResult = null;
    let adminSendResult = null;
    let contactCache = null;

    try {
      if (!contactData.email || !contactData.name || !contactData.message) {
        throw new AppError(400, 'Données de contact incomplètes (nom, email et message requis)');
      }

     
     
      const contact = await contactRepo.create({
        ...contactData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        email: contactData.email,
        phone: contactData.phone,
        subjects: contactData.subjects,
        status: 'pending',
      });

      contactCache = contact;

      logInfo('Contact créé en base de données', {
        contactId: contact.id,
        name: contact.name,
        email: contact.email,
        hasPhone: !!contact.phone,
        hasSubjects: !!contact.subjects,
        messageLength: contact.message.length,
      });

      if (clientHtmlTemplate) {
        clientSendResult = await this.sendContactEmail(
          contact.id,
          contact.email,
          clientHtmlTemplate,
          'Confirmation de votre message - L&L Ouest Services',
          { isClientConfirmation: true }
        );
      }

      if (adminHtmlTemplate) {
        const adminEmail = config.smtp.user || 'nanatchoffojunior@gmail.com';
        adminSendResult = await this.sendContactEmail(
          contact.id,
          adminEmail,
          adminHtmlTemplate,
          `Nouveau message de contact reçu - ${contact.name}`,
          { isAdminNotification: true }
        );
      }

      if (contact.userId) {
        socketService.emitToUser(contact.userId, 'newContact', {
          contactId: contact.id,
          clientSent: !!clientSendResult,
          adminSent: !!adminSendResult,
        });
      }

      let admins = [];

try {
  admins = await userRepo.getByEmail(config.smtp.user);

} catch (socketError) {
  logWarn('Erreur notification socket admins', { error: socketError.message });
}
 

    

      logAudit('Message de contact créé et emails envoyés avec succès', {
        contactId: contact.id,
        name: contact.name,
        email: contact.email,
        hasSubjects: !!contact.subjects,
        clientEmailSent: !!clientSendResult,
        adminEmailSent: !!adminSendResult,
        clientMessageId: clientSendResult?.messageId,
        adminMessageId: adminSendResult?.messageId,
      });

      return {
        ...contact,
        emailStatus: {
          clientSent: !!clientSendResult,
          adminSent: !!adminSendResult,
          clientMessageId: clientSendResult?.messageId,
          adminMessageId: adminSendResult?.messageId,
          sentAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logError('Erreur lors de la création du message de contact', {
        error: error.message,
        errorCode: error.code,
        contactData: {
          name: contactData.name,
          email: contactData.email,
          hasMessage: !!contactData.message,
          hasSubjects: !!contactData.subjects,
          hasPhone: !!contactData.phone,
          userId: contactData.userId,
        },
        clientTemplateProvided: !!clientHtmlTemplate,
        adminTemplateProvided: !!adminHtmlTemplate,
        clientSent: !!clientSendResult,
        adminSent: !!adminSendResult,
      });

      if (contactCache && contactCache.id) {
        await contactRepo.update(contactCache.id, {
          status: 'created_email_failed',
          errorMessage: error.message.substring(0, 500),
        });
      }

      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création du message de contact', error.message);
    }
  }

  async getContact(contactId) {
    try {
      if (!contactId || typeof contactId !== 'string') {
        throw new AppError(400, 'ID de contact invalide');
      }

      const contact = await contactRepo.getById(contactId);
      if (!contact) {
        throw new AppError(404, 'Message de contact non trouvé');
      }

      const enrichedContact = {
        ...contact,
        subjectsArray: contact.subjects ? contact.subjects.split('-').map(s => s.trim()).filter(s => s.length > 0) : [],
        subjectsCount: contact.subjects ? contact.subjects.split('-').filter(s => s.trim().length > 0).length : 0,
        messagePreview: contact.message ? (contact.message.length > 100 ? contact.message.substring(0, 100) + '...' : contact.message) : '',
        messageLength: contact.message ? contact.message.length : 0,
        createdAtFormatted: contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : null,
        repliedAtFormatted: contact.repliedAt ? new Date(contact.repliedAt).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : null,
        statusLabel: this.getStatusLabel(contact.status),
        phoneValid: contact.phone && contact.phone.startsWith('+33') && contact.phone.length === 12,
      };

      logInfo('Message de contact récupéré avec succès', {
        contactId,
        name: contact.name,
        status: contact.status,
        hasSubjects: !!contact.subjects,
        subjectsCount: enrichedContact.subjectsCount,
        messageLength: enrichedContact.messageLength,
        phoneValid: enrichedContact.phoneValid,
      });

      return enrichedContact;
    } catch (error) {
      logError('Erreur lors de la récupération du message de contact', { error: error.message, contactId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération du message de contact', error.message);
    }
  }

  getStatusLabel(status) {
    const statusLabels = {
      pending: 'En attente',
      replied: 'Répondu',
      archived: 'Archivé',
      created_email_failed: 'Créé (email échoué)',
      spam: 'Spam',
      closed: 'Fermé',
      deleted: 'Supprimé',
    };
    return statusLabels[status] || status;
  }

  async updateContact(contactId, contactData) {
    try {
      if (!contactId || typeof contactId !== 'string') {
        throw new AppError(400, 'ID de contact invalide');
      }

      if (Object.keys(contactData).length === 0) {
        throw new AppError(400, 'Aucune donnée à mettre à jour fournie');
      }

      if (contactData.subjects !== undefined && typeof contactData.subjects === 'string') {
        contactData.subjects = contactData.subjects.trim().replace(/,/g, '-').trim();
        if (contactData.subjects.length === 0) {
          contactData.subjects = null;
        }
      }

      if (contactData.phone !== undefined && typeof contactData.phone === 'string') {
        const normalizedPhone = contactData.phone.trim().replace(/[^\d+]/g, '');
        if (normalizedPhone.startsWith('33')) {
          contactData.phone = '+33' + normalizedPhone.substring(2);
        } else if (normalizedPhone.startsWith('0')) {
          contactData.phone = '+33' + normalizedPhone.substring(1);
        }
        if (normalizedPhone.length !== 12 || !normalizedPhone.startsWith('+33')) {
          contactData.phone = null;
        }
      }

      if (contactData.status === undefined) {
        contactData.status = 'pending';
      }

      const contact = await contactRepo.update(contactId, contactData);
      if (!contact) {
        throw new AppError(404, 'Message de contact non trouvé');
      }

      const enrichedContact = {
        ...contact,
        subjectsArray: contact.subjects ? contact.subjects.split('-').map(s => s.trim()).filter(s => s.length > 0) : [],
        subjectsCount: contact.subjects ? contact.subjects.split('-').filter(s => s.trim().length > 0).length : 0,
        messagePreview: contact.message ? (contact.message.length > 100 ? contact.message.substring(0, 100) + '...' : contact.message) : '',
        messageLength: contact.message ? contact.message.length : 0,
        createdAtFormatted: contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : null,
        repliedAtFormatted: contact.repliedAt ? new Date(contact.repliedAt).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : null,
        statusLabel: this.getStatusLabel(contact.status),
        phoneValid: contact.phone && contact.phone.startsWith('+33') && contact.phone.length === 12,
      };

      if (contact.userId) {
        socketService.emitToUser(contact.userId, 'contactUpdated', {
          contactId,
          updatedFields: Object.keys(contactData),
          newStatus: enrichedContact.statusLabel,
        });
      }

      if (contactData.status && contactData.status !== 'pending') {
        socketService.emitToUser('contactStatusChanged', {
          contactId,
          newStatus: enrichedContact.statusLabel,
          updatedBy: contactData.updatedBy || 'system',
        });
      }

      logAudit('Message de contact mis à jour avec succès', {
        contactId,
        updatedFields: Object.keys(contactData),
        oldStatus: contactData.status ? 'N/A' : 'unchanged',
        newStatus: enrichedContact.status,
        hasSubjects: !!enrichedContact.subjects,
        subjectsCount: enrichedContact.subjectsCount,
      });

      return enrichedContact;
    } catch (error) {
      logError('Erreur lors de la mise à jour du message de contact', {
        error: error.message,
        contactId,
        updatedFields: Object.keys(contactData || {}),
        hasSubjects: !!contactData?.subjects,
      });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour du message de contact', error.message);
    }
  }

  async deleteContact(contactId, deletedBy) {
    try {
      if (!contactId || typeof contactId !== 'string') {
        throw new AppError(400, 'ID de contact invalide');
      }

      const contact = await contactRepo.getById(contactId);
      if (!contact) {
        throw new AppError(404, 'Message de contact non trouvé');
      }

      const deletedAt = new Date().toISOString();
      await contactRepo.update(contactId, {
        status: 'deleted',
        deletedAt,
        deletedBy: deletedBy || null,
      });

      const deletedContact = {
        ...contact,
        status: 'deleted',
        deletedAt,
        deletedBy,
        statusLabel: 'Supprimé',
        subjectsArray: contact.subjects ? contact.subjects.split('-').map(s => s.trim()).filter(s => s.length > 0) : [],
        subjectsCount: contact.subjects ? contact.subjects.split('-').filter(s => s.trim().length > 0).length : 0,
        messagePreview: contact.message ? (contact.message.length > 100 ? contact.message.substring(0, 100) + '...' : contact.message) : '',
        messageLength: contact.message ? contact.message.length : 0,
        phoneValid: contact.phone && contact.phone.startsWith('+33') && contact.phone.length === 12,
      };

      if (contact.userId) {
        socketService.emitToUser(contact.userId, 'contactDeleted', {
          contactId,
          deletedAt,
          deletedBy,
          reason: 'archived',
        });
      }

      socketService.emitToAdmins('contactDeleted', {
        contactId,
        deletedBy: deletedBy || 'system',
        deletedContact: {
          name: contact.name,
          email: contact.email,
          subjects: contact.subjects,
          deletedAt,
        },
      });

      logAudit('Message de contact supprimé (soft delete)', {
        contactId,
        name: contact.name,
        email: contact.email,
        deletedBy,
        deletedAt,
        hadSubjects: !!contact.subjects,
        originalStatus: contact.status,
      });

      return {
        deletedContact,
        deletedAt,
        message: 'Contact archivé avec succès',
      };
    } catch (error) {
      logError('Erreur lors de la suppression du message de contact', {
        error: error.message,
        contactId,
        deletedBy,
      });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression du message de contact', error.message);
    }
  }

  async getAllContacts(page = 1, limit = 10, filters = {}, sortBy = 'createdAt', sortOrder = 'desc') {
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
        subjects: (filters.subjects || '').trim().toLowerCase(),
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : null,
        dateTo: filters.dateTo ? new Date(filters.dateTo) : null,
        withReply: filters.withReply === true,
        repliedOnly: filters.repliedOnly === true,
        hasSubjects: filters.hasSubjects === true,
      };

      if (normalizedFilters.dateFrom && isNaN(normalizedFilters.dateFrom.getTime())) {
        throw new AppError(400, 'Date de début invalide');
      }
      if (normalizedFilters.dateTo && isNaN(normalizedFilters.dateTo.getTime())) {
        throw new AppError(400, 'Date de fin invalide');
      }

      const validSortFields = ['createdAt', 'name', 'email', 'status', 'repliedAt'];
      const validSortOrders = ['asc', 'desc'];
      const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const finalSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';

      const result = await contactRepo.getAll(page, limit, normalizedFilters, finalSortBy, finalSortOrder);

      const enrichedContacts = result.contacts.map(contact => ({
        ...contact,
        subjectsArray: contact.subjects ? contact.subjects.split('-').map(s => s.trim()).filter(s => s.length > 0) : [],
        subjectsCount: contact.subjects ? contact.subjects.split('-').filter(s => s.trim().length > 0).length : 0,
        subjectsPreview: contact.subjects ? (contact.subjects.length > 50 ? contact.subjects.substring(0, 50) + '...' : contact.subjects) : 'N/A',
        messagePreview: contact.message ? (contact.message.length > 100 ? contact.message.substring(0, 100) + '...' : contact.message) : '',
        messageLength: contact.message ? contact.message.length : 0,
        createdAtFormatted: contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('fr-FR', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : null,
        repliedAtFormatted: contact.repliedAt ? new Date(contact.repliedAt).toLocaleDateString('fr-FR', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : null,
        statusLabel: this.getStatusLabel(contact.status),
        hasReply: !!contact.reply && !!contact.repliedAt,
        daysSinceCreation: contact.createdAt ? Math.floor((new Date() - new Date(contact.createdAt)) / (1000 * 60 * 60 * 24)) : 0,
        daysSinceReply: contact.repliedAt ? Math.floor((new Date() - new Date(contact.repliedAt)) / (1000 * 60 * 60 * 24)) : null,
        phoneValid: contact.phone && contact.phone.startsWith('+33') && contact.phone.length === 12,
        emailStatus: contact.emailStatus || {
          clientSent: false,
          adminSent: false,
          sentAt: null,
        },
      }));

      const enrichedResult = {
        ...result,
        contacts: enrichedContacts,
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
          pending: enrichedContacts.filter(c => c.status === 'pending').length,
          replied: enrichedContacts.filter(c => c.status === 'replied').length,
          withSubjects: enrichedContacts.filter(c => c.subjectsCount > 0).length,
          avgMessageLength: enrichedContacts.reduce((sum, c) => sum + c.messageLength, 0) / Math.max(enrichedContacts.length, 1),
        },
      };

      logInfo('Liste des messages de contact récupérée avec succès', {
        page,
        limit,
        total: result.total,
        contactsCount: enrichedContacts.length,
        filtersApplied: Object.keys(normalizedFilters).filter(key => normalizedFilters[key]).length,
        sortBy: finalSortBy,
        sortOrder: finalSortOrder,
        pendingCount: enrichedResult.summary.pending,
        repliedCount: enrichedResult.summary.replied,
      });

      return enrichedResult;
    } catch (error) {
      logError('Erreur lors de la récupération des messages de contact', {
        error: error.message,
        page,
        limit,
        filters,
        sortBy,
        sortOrder,
      });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des messages de contact', error.message);
    }
  }

 async sendReplyEmail(contactId, replyMessage, htmlTemplate, replySubject, additionalData = {}) {
  try {
    const contact = await contactRepo.getById(contactId);
    if (!contact) {
      throw new AppError(404, 'Message de contact non trouvé');
    }

    if (!replyMessage || typeof replyMessage !== 'string' || replyMessage.trim().length < 10) {
      throw new AppError(400, 'Message de réponse invalide (minimum 10 caractères)');
    }

    // Load and encode logo in base64
    const logoPath = path.join(__dirname, '../storage/logo.png'); 
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString('base64');

    const cleanReply = replyMessage.trim();

    const subject = replySubject ||
      `Re: Votre message du ${new Date(contact.createdAt).toLocaleDateString('fr-FR')} - L&L Ouest Services`;

    let html;
    if (htmlTemplate && typeof htmlTemplate === 'string') {
      const template = handlebars.compile(htmlTemplate);
      html = template({
        name: contact.name,
        email: contact.email,
        originalMessage: contact.message,
        originalSubjects: contact.subjects || 'N/A',
        reply: cleanReply,
        createdAt: new Date(contact.createdAt).toLocaleDateString('fr-FR'),
        company: 'L&L Ouest Services',
        supportPhone: '+33 1 23 45 67 89',
        website: 'https://www.llouestservices.com',
        repliedByName: additionalData.repliedByName || 'L&L Ouest Services',
        logoBase64: logoBase64,
        ...additionalData,
      });
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
            body { font-family: 'Open Sans', Arial, sans-serif; background-color: ${colors.light}; margin: 0; padding: 0; color: ${colors.secondary}; font-size: 14px; line-height: 1.6; }
            .container { max-width: 600px; margin: 20px auto; background-color: ${colors.white}; border: 1px solid ${colors.border}; border-radius: 6px; overflow: hidden; }
            .header { padding: 20px; border-bottom: 2px solid ${colors.primary}; text-align: center; }
            .header img { width: 60px; height: 60px; margin-bottom: 10px; }
            .header h1 { font-family: 'Merriweather', serif; font-size: 18px; color: ${colors.primary}; margin: 0; font-weight: 700; }
            .content { padding: 20px; }
            .content p { margin: 10px 0; }
            .original-message { border: 1px solid ${colors.border}; border-radius: 4px; padding: 15px; margin-bottom: 15px; background-color: ${colors.light}; }
            .original-message h3 { font-family: 'Merriweather', serif; font-size: 16px; color: ${colors.primary}; margin: 0 0 10px; }
            .reply-section { border: 1px solid ${colors.border}; border-radius: 4px; padding: 15px; margin-bottom: 15px; }
            .reply-section h3 { font-family: 'Merriweather', serif; font-size: 16px; color: ${colors.primary}; margin: 0 0 10px; }
            .button { display: inline-block; background-color: ${colors.primary}; color: ${colors.white}; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 10px 0; transition: background-color 0.3s; }
            .button:hover { background-color: ${colors.accent}; }
            .footer { border-top: 1px solid ${colors.border}; padding: 15px; text-align: center; font-size: 12px; color: ${colors.secondary}; }
            .footer a { color: ${colors.primary}; text-decoration: none; }
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
              <h1>Réponse à Votre Message</h1>
            </div>
            <div class="content">
              <p>Cher(e) ${contact.name || 'Utilisateur'},</p>
              <p>Merci pour votre message du ${new Date(contact.createdAt).toLocaleDateString('fr-FR')} concernant "${contact.subjects || 'votre demande'}". Voici notre réponse :</p>
              <div class="original-message">
                <h3>Votre message original :</h3>
                <p>${contact.message.replace(/\n/g, '<br>')}</p>
                ${contact.phone ? `<p><strong>Téléphone :</strong> ${contact.phone}</p>` : ''}
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
    }

    const sendResult = await this.sendEmail({
      to: contact.email.trim().toLowerCase(),
      subject,
      html,
      headers: {
        'X-Contact-ID': contact.id,
        'X-Reply-ID': crypto.randomUUID(),
        'X-Reply-Type': 'admin_response',
        'X-Replied-By': additionalData.repliedBy || 'system',
      },
    });

    const updatedContact = await contactRepo.update(contactId, {
      reply: cleanReply,
      repliedAt: new Date().toISOString(),
      status: 'replied',
      updatedAt: new Date().toISOString(),
      repliedBy: additionalData.repliedBy || null,
    });

    if (!updatedContact) {
      throw new AppError(500, 'Échec de la mise à jour du contact après envoi de la réponse');
    }

    const enrichedUpdatedContact = {
      ...updatedContact,
      subjectsArray: updatedContact.subjects ? updatedContact.subjects.split('-').map(s => s.trim()).filter(s => s.length > 0) : [],
      subjectsCount: updatedContact.subjects ? updatedContact.subjects.split('-').filter(s => s.trim().length > 0).length : 0,
      messagePreview: updatedContact.message ? (updatedContact.message.length > 100 ? updatedContact.message.substring(0, 100) + '...' : updatedContact.message) : '',
      replyPreview: updatedContact.reply ? (updatedContact.reply.length > 100 ? updatedContact.reply.substring(0, 100) + '...' : updatedContact.reply) : '',
      statusLabel: this.getStatusLabel(updatedContact.status),
      phoneValid: updatedContact.phone && updatedContact.phone.startsWith('+33') && updatedContact.phone.length === 12,
      hasReply: true,
      replyLength: updatedContact.reply ? updatedContact.reply.length : 0,
    };

    if (contact.userId) {
      socketService.emitToUser(contact.userId, 'contactReplied', {
        contactId,
        replyPreview: enrichedUpdatedContact.replyPreview,
        repliedAt: enrichedUpdatedContact.repliedAtFormatted,
        messageId: sendResult.messageId,
        repliedBy: additionalData.repliedByName || 'L&L Ouest Services',
      });
    }

    socketService.emitToAdmins('contactReplied', {
      contactId,
      repliedTo: contact.email,
      replyLength: enrichedUpdatedContact.replyLength,
      messageId: sendResult.messageId,
      repliedBy: additionalData.repliedByName || 'system',
    });

    logAudit('Email de réponse envoyé et contact mis à jour', {
      contactId,
      email: contact.email,
      replyLength: cleanReply.length,
      messageId: sendResult.messageId,
      status: enrichedUpdatedContact.status,
      repliedBy: additionalData.repliedBy || 'system',
    });

    return {
      messageId: sendResult.messageId,
      updatedContact: enrichedUpdatedContact,
    };
  } catch (error) {
    logError('Erreur lors de l\'envoi de l\'email de réponse', {
      error: error.message,
      contactId,
      replyLength: replyMessage ? replyMessage.length : 0,
      hasTemplate: !!htmlTemplate,
    });
    throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'envoi de l\'email de réponse', error.message);
  }
}

  async getContactStats(filters = {}) {
    try {
      const stats = await contactRepo.getStats(filters);

      return {
        totalContacts: stats.total || 0,
        pendingContacts: stats.pending || 0,
        repliedContacts: stats.replied || 0,
        archivedContacts: stats.archived || 0,
        deletedContacts: stats.deleted || 0,
        contactsWithSubjects: stats.withSubjects || 0,
        averageMessageLength: stats.averageMessageLength || 0,
        contactsByStatus: stats.contactsByStatus || {},
        contactsByDate: stats.contactsByDate || [],
        topSubjects: stats.topSubjects || [],
        responseTime: {
          averageDaysToReply: stats.averageDaysToReply || 0,
          fastestReply: stats.fastestReply || null,
          slowestReply: stats.slowestReply || null,
        },
        filtersApplied: Object.keys(filters).filter(key => filters[key]).length,
      };
    } catch (error) {
      logError('Erreur lors de la récupération des statistiques des contacts', {
        error: error.message,
        filters,
      });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des statistiques', error.message);
    }
  }

  async exportContactsToCSV(filters = {}, sortBy = 'createdAt', sortOrder = 'desc') {
    try {
      const result = await this.getAllContacts(1, 10000, filters, sortBy, sortOrder);

      if (result.contacts.length === 0) {
        return 'ID,Nom,Email,Téléphone,Sujets,Message,Statut,Créé le,Répondu le\n';
      }

      let csv = 'ID,Nom,Email,Téléphone,Sujets,Message,Statut,Créé le,Répondu le\n';

      result.contacts.forEach(contact => {
        const row = [
          `"${contact.id}"`,
          `"${contact.name.replace(/"/g, '""')}"`,
          `"${contact.email}"`,
          `"${contact.phone || ''}"`,
          `"${(contact.subjects || '').replace(/"/g, '""')}"`,
          `"${(contact.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `"${this.getStatusLabel(contact.status)}"`,
          `"${contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('fr-FR') : ''}"`,
          `"${contact.repliedAt ? new Date(contact.repliedAt).toLocaleDateString('fr-FR') : ''}"`,
        ].join(',');
        csv += row + '\n';
      });

      logInfo('Export CSV des contacts généré', {
        totalExported: result.contacts.length,
        filtersApplied: Object.keys(filters).filter(key => filters[key]).length,
      });

      return csv;
    } catch (error) {
      logError('Erreur lors de l\'export CSV des contacts', {
        error: error.message,
        filters,
        sortBy,
        sortOrder,
      });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'export des contacts', error.message);
    }
  }
}

module.exports = new EmailService();
