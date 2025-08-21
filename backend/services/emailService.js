/**
 * @file emailService.js
 * @description Service d'envoi d'emails personnalisés avec nodemailer et templates Handlebars.
 * Intègre avec userRepo et contactRepo pour les emails de contact et notifications.
 * @module services/emailService
 */

const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const config = require('../config/config');
const { userRepo, contactRepo } = require('../repositories');
const  socketService  = require('./socketService');
const { logger, logInfo, logError, logAudit } = require('./loggerService');
const { AppError } = require('../utils/errorUtils');

/**
 * @typedef {Object} Contact
 * @property {string} id - ID du message de contact.
 * @property {string} userId - ID de l'utilisateur.
 * @property {string} name - Nom du contact.
 * @property {string} email - Email du contact.
 * @property {string} subject - Sujet du message.
 * @property {string} message - Contenu du message.
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
    });
  }

  /**
   * Envoie un email générique avec HTML personnalisé.
   * @param {Object} options - Options de l'email.
   * @param {string} options.to - Destinataire.
   * @param {string} options.subject - Sujet.
   * @param {string} options.html - Contenu HTML.
   * @param {Array<Object>} [options.attachments] - Pièces jointes (optionnel).
   * @returns {Promise<void>}
   * @throws {AppError} Si l'envoi échoue.
   */
  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `"L&L Ouest Services" <${config.smtp.user}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments || [],
      };

      await this.transporter.sendMail(mailOptions);
      logInfo('Email générique envoyé', { to: options.to, subject: options.subject });
    } catch (error) {
      logError('Erreur lors de l\'envoi de l\'email générique', { error: error.message, to: options.to });
      throw new AppError(500, 'Erreur serveur lors de l\'envoi de l\'email', error.message);
    }
  }

  /**
   * Envoie un email de confirmation pour un message de contact.
   * @param {string} contactId - ID du message de contact.
   * @param {string} htmlTemplate - Template HTML fourni par le frontend.
   * @returns {Promise<void>}
   * @throws {AppError} Si le template HTML est invalide ou si l'envoi échoue.
   */
  async sendContactEmail(contactId, htmlTemplate) {
    try {
      const contact = await contactRepo.getById(contactId);
      if (!htmlTemplate || typeof htmlTemplate !== 'string') {
        throw new AppError(400, 'Template HTML invalide ou manquant');
      }

      const template = handlebars.compile(htmlTemplate);
      const html = template({
        name: contact.name,
        email: contact.email,
        message: contact.message,
        subject: contact.subject || 'Nouveau message de contact',
        company: 'L&L Ouest Services',
      });

      await this.sendEmail({
        to: contact.email,
        subject: 'Confirmation de votre message',
        html,
      });

      socketService.emitToUser(contact.userId, 'contactEmailSent', { contactId });
      logInfo('Email de contact envoyé', { contactId, email: contact.email });
    } catch (error) {
      logError('Erreur lors de l\'envoi de l\'email de contact', { error: error.message, contactId });
      throw new AppError(500, 'Erreur serveur lors de l\'envoi de l\'email de contact', error.message);
    }
  }

  /**
   * Envoie un email avec une facture en pièce jointe.
   * @param {string} userId - ID de l'utilisateur.
   * @param {string} invoicePath - Chemin du fichier PDF de la facture.
   * @param {Invoice} invoice - Détails de la facture.
   * @param {string} htmlTemplate - Template HTML fourni par le frontend.
   * @returns {Promise<void>}
   * @throws {AppError} Si le template HTML est invalide ou si l'envoi échoue.
   */
  async sendInvoiceEmail(userId, invoicePath, invoice, htmlTemplate) {
    try {
      const user = await userRepo.getById(userId);
      if (!htmlTemplate || typeof htmlTemplate !== 'string') {
        throw new AppError(400, 'Template HTML invalide ou manquant');
      }

      const template = handlebars.compile(htmlTemplate);
      const html = template({
        name: user.name,
        invoiceId: invoice.id,
        amount: invoice.amount,
        date: new Date(invoice.date).toLocaleDateString('fr-FR'),
        company: 'L&L Ouest Services',
      });

      await this.sendEmail({
        to: user.email,
        subject: `Votre facture ${invoice.id}`,
        html,
        attachments: [{ path: invoicePath }],
      });

      socketService.emitToUser(userId, 'invoiceEmailSent', { invoiceId: invoice.id });
      logAudit('Email de facture envoyé', { userId, invoiceId: invoice.id });
    } catch (error) {
      logError('Erreur lors de l\'envoi de l\'email de facture', { error: error.message, userId });
      throw new AppError(500, 'Erreur serveur lors de l\'envoi de l\'email de facture', error.message);
    }
  }

  /**
   * Crée un message de contact.
   * @param {Object} contactData - Données du contact.
   * @param {string} contactData.userId - ID de l'utilisateur.
   * @param {string} contactData.name - Nom du contact.
   * @param {string} contactData.email - Email du contact.
   * @param {string} contactData.subject - Sujet du message.
   * @param {string} contactData.message - Contenu du message.
   * @returns {Promise<Contact>} Message de contact créé.
   * @throws {AppError} Si la création échoue.
   */
  async createContact(contactData) {
    try {
      const contact = await contactRepo.create(contactData);
      socketService.emitToUser(contact.userId, 'newContact', { contactId: contact.id });
      logAudit('Message de contact créé', { contactId: contact.id });
      return contact;
    } catch (error) {
      logError('Erreur lors de la création du message de contact', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création du message de contact', error.message);
    }
  }

  /**
   * Récupère un message de contact par son ID.
   * @param {string} contactId - ID du message de contact.
   * @returns {Promise<Contact>} Message de contact trouvé.
   * @throws {AppError} Si la récupération échoue.
   */
  async getContact(contactId) {
    try {
      const contact = await contactRepo.getById(contactId);
      logInfo('Message de contact récupéré', { contactId });
      return contact;
    } catch (error) {
      logError('Erreur lors de la récupération du message de contact', { error: error.message, contactId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération du message de contact', error.message);
    }
  }

  /**
   * Met à jour un message de contact.
   * @param {string} contactId - ID du message de contact.
   * @param {Partial<Contact>} contactData - Données à mettre à jour.
   * @returns {Promise<Contact>} Message de contact mis à jour.
   * @throws {AppError} Si la mise à jour échoue.
   */
  async updateContact(contactId, contactData) {
    try {
      const contact = await contactRepo.update(contactId, contactData);
      socketService.emitToUser(contact.userId, 'contactUpdated', { contactId });
      logAudit('Message de contact mis à jour', { contactId });
      return contact;
    } catch (error) {
      logError('Erreur lors de la mise à jour du message de contact', { error: error.message, contactId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour du message de contact', error.message);
    }
  }

  /**
   * Supprime un message de contact.
   * @param {string} contactId - ID du message de contact.
   * @returns {Promise<void>}
   * @throws {AppError} Si la suppression échoue.
   */
  async deleteContact(contactId) {
    try {
      const contact = await contactRepo.getById(contactId);
      await contactRepo.delete(contactId);
      socketService.emitToUser(contact.userId, 'contactDeleted', { contactId });
      logAudit('Message de contact supprimé', { contactId });
    } catch (error) {
      logError('Erreur lors de la suppression du message de contact', { error: error.message, contactId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression du message de contact', error.message);
    }
  }

  /**
   * Récupère tous les messages de contact avec pagination.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<{ contacts: Contact[], total: number, page: number, limit: number }>} Liste des messages de contact paginée.
   * @throws {AppError} Si la récupération échoue.
   */
  async getAllContacts(page = 1, limit = 10) {
    try {
      const result = await contactRepo.getAll(page, limit);
      logInfo('Liste des messages de contact récupérée', { page, limit, total: result.total });
      return result;
    } catch (error) {
      logError('Erreur lors de la récupération des messages de contact', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des messages de contact', error.message);
    }
  }
}

module.exports = new EmailService();
