/**
 * @file documentService.js
 * @description Service pour gérer les factures PDF dans L&L Ouest Services.
 * Intègre avec userRepo, storageService, socketService, et notificationService pour la génération et la gestion des factures.
 * Utilise pdfkit pour générer des PDF à partir de templates de données (alternative légère à Puppeteer, sans dépendances système lourdes).
 * @module services/documentService
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { userRepo } = require('../repositories');
const storageService = require('./storageService');
const socketService = require('./socketService');
const notificationService = require('./notificationService');
const { generateUUID, formatDate } = require('../utils/helperUtils');
const { logger, logInfo, logError, logAudit } = require('./loggerService');
const { AppError } = require('../utils/errorUtils');
const { invoiceSchema } = require('../utils/validationUtils');
const handlebars = require('handlebars');

/**
 * @typedef {Object} Invoice
 * @property {string} id - Identifiant unique de la facture.
 * @property {string} userId - ID de l'utilisateur associé.
 * @property {number} amount - Montant total de la facture.
 * @property {Array<Object>} items - Liste des éléments de la facture.
 * @property {string} date - Date de création (ISO 8601).
 * @property {string} dueDate - Date d'échéance (ISO 8601).
 * @property {string} url - URL du fichier PDF.
 */

/**
 * @class DocumentService
 * @description Gère la génération et la gestion des factures PDF pour L&L Ouest Services.
 */
class DocumentService {
  /**
   * Génère une facture PDF à partir d'un template HTML fourni par le frontend.
   * @param {string} userId - ID de l'utilisateur.
   * @param {Object} invoiceData - Données de la facture.
   * @param {number} invoiceData.amount - Montant total de la facture.
   * @param {Array<Object>} invoiceData.items - Liste des éléments de la facture.
   * @param {string} invoiceData.dueDate - Date d'échéance.
   * @param {string} htmlTemplate - Template HTML fourni par le frontend (utilisé pour extraire la structure via Handlebars, mais converti en doc pdfkit).
   * @returns {Promise<{ filePath: string, invoice: Invoice }>} Objet contenant l'URL du fichier PDF et les détails de la facture.
   * @throws {AppError} Si le template HTML est invalide ou si la génération échoue.
   */
  async generateInvoice(userId, invoiceData, htmlTemplate) {
    try {
      const { value, error } = invoiceSchema.validate({
        userId,
        amount: invoiceData.amount,
        items: invoiceData.items,
        dueDate: invoiceData.dueDate,
      }, { abortEarly: false });
      if (error) {
        logError('Erreur de validation des données de la facture', { error: error.message });
        throw new AppError(400, 'Données de facture invalides', error.details.map(detail => detail.message).join(', '));
      }

      const user = await userRepo.getById(userId);
      const invoiceId = generateUUID();
      const pdfFilePath = path.join('/tmp', `invoice_${invoiceId}.pdf`);

      if (!htmlTemplate || typeof htmlTemplate !== 'string') {
        throw new AppError(400, 'Template HTML invalide ou manquant');
      }

      // Compiler le template Handlebars pour extraire les données (mais on utilise pdfkit pour la génération PDF)
      const template = handlebars.compile(htmlTemplate);
      const htmlContext = template({
        invoiceId,
        user,
        date: formatDate(new Date()),
        dueDate: formatDate(new Date(value.dueDate)),
        items: value.items,
        amount: value.amount,
        company: 'L&L Ouest Services',
      });
      // Note: Ici, on pourrait parser htmlContext si besoin, mais pour simplicité, on reconstruit la structure PDF avec pdfkit directement à partir des données

      // Création du document PDF avec pdfkit
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(pdfFilePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(18).font('bold').text('L&L Ouest Services', 50, 50);
      doc.fontSize(14).font('bold').text(`Facture #${invoiceId}`, 50, 80);

      // Table des items (manuel avec pdfkit : positions et lignes)
      let yPos = 120;
      doc.fontSize(12).font('bold').fillColor('#4285f4').text('Description', 50, yPos);
      doc.text('Quantité', 300, yPos);
      doc.text('Prix Unitaire', 380, yPos);
      doc.text('Total', 480, yPos);
      yPos += 20;

      // Ligne de header
      doc.moveTo(50, yPos).lineTo(550, yPos).strokeColor('#4285f4').lineWidth(1).stroke();
      yPos += 10;

      // Lignes des items
      value.items.forEach(item => {
        const itemTotal = item.quantity * item.unitPrice;
        doc.fontSize(10).fillColor('black').text(item.description, 50, yPos, { width: 240, align: 'left' });
        doc.text(item.quantity.toString(), 300, yPos, { width: 70, align: 'center' });
        doc.text(`€${item.unitPrice.toFixed(2)}`, 380, yPos, { width: 80, align: 'right' });
        doc.text(`€${itemTotal.toFixed(2)}`, 480, yPos, { width: 60, align: 'right' });
        yPos += 20;

        // Ligne séparatrice
        doc.moveTo(50, yPos - 5).lineTo(550, yPos - 5).strokeColor('#ddd').lineWidth(0.5).stroke();
      });

      // Total
      yPos += 20;
      doc.fontSize(16).font('bold').fillColor('black').text(`Total: €${value.amount.toFixed(2)}`, 380, yPos, { align: 'right' });
      yPos += 40;

      // Dates et client
      doc.fontSize(12).text(`Date: ${formatDate(new Date())}`, 50, yPos);
      doc.text(`Échéance: ${formatDate(new Date(value.dueDate))}`, 300, yPos);
      yPos += 30;
      doc.text(`Client: ${user.name || 'N/A'}`, 50, yPos);
      doc.text(`Email: ${user.email}`, 50, yPos + 20);

      // Footer
      yPos += 60;
      doc.fontSize(10).font('italic').text('Merci pour votre confiance !', 50, yPos, { align: 'center', width: 450 });

      // Finaliser le PDF
      doc.end();

      // Attendre que le stream finisse
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      const fileUrl = await storageService.uploadFile(pdfFilePath, `invoices/${userId}/${invoiceId}.pdf`);

      const invoice = {
        id: invoiceId,
        userId,
        amount: value.amount,
        items: value.items,
        date: formatDate(new Date()),
        dueDate: value.dueDate,
        url: fileUrl,
      };
      await userRepo.addInvoice(userId, invoice);

      socketService.emitToUser(userId, 'newInvoice', { invoiceId, amount: invoice.amount });
      await notificationService.sendPushNotification(userId, {
        title: 'Nouvelle facture',
        body: `Votre facture ${invoiceId} de ${invoice.amount} € est disponible.`,
      });

      logAudit('Facture générée', { userId, invoiceId });
      return { filePath: fileUrl, invoice };
    } catch (error) {
      logError('Erreur lors de la génération de la facture', { error: error.message, userId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la génération de la facture', error.message);
    }
  }

  /**
   * Récupère une facture par son ID.
   * @param {string} userId - ID de l'utilisateur.
   * @param {string} invoiceId - ID de la facture.
   * @returns {Promise<Invoice>} Facture trouvée.
   * @throws {AppError} Si la récupération échoue.
   */
  async getInvoice(userId, invoiceId) {
    try {
      if (!userId || !invoiceId) {
        throw new AppError(400, 'ID utilisateur et ID facture requis');
      }
      const invoice = await userRepo.getInvoiceById(userId, invoiceId);
      logInfo('Facture récupérée', { userId, invoiceId });
      return invoice;
    } catch (error) {
      logError('Erreur lors de la récupération de la facture', { error: error.message, userId, invoiceId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de la facture', error.message);
    }
  }

  /**
   * Met à jour une facture.
   * @param {string} userId - ID de l'utilisateur.
   * @param {string} invoiceId - ID de la facture.
   * @param {Partial<Invoice>} invoiceData - Données à mettre à jour.
   * @returns {Promise<Invoice>} Facture mise à jour.
   * @throws {AppError} Si la mise à jour échoue.
   */
  async updateInvoice(userId, invoiceId, invoiceData) {
    try {
      if (!userId || !invoiceId) {
        throw new AppError(400, 'ID utilisateur et ID facture requis');
      }
      const existingInvoice = await userRepo.getInvoiceById(userId, invoiceId);
      const { value, error } = invoiceSchema.validate(
        { ...existingInvoice, ...invoiceData, id: invoiceId, userId },
        { abortEarly: false }
      );
      if (error) {
        logError('Erreur de validation des données de la facture', { error: error.message });
        throw new AppError(400, 'Données de facture invalides', error.details.map(detail => detail.message).join(', '));
      }

      const updatedInvoice = await userRepo.updateInvoice(userId, invoiceId, value);
      socketService.emitToUser(userId, 'invoiceUpdated', { invoiceId, amount: updatedInvoice.amount });
      await notificationService.sendPushNotification(userId, {
        title: 'Facture mise à jour',
        body: `Votre facture ${invoiceId} a été mise à jour.`,
      });
      logAudit('Facture mise à jour', { userId, invoiceId });
      return updatedInvoice;
    } catch (error) {
      logError('Erreur lors de la mise à jour de la facture', { error: error.message, userId, invoiceId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour de la facture', error.message);
    }
  }

  /**
   * Supprime une facture.
   * @param {string} userId - ID de l'utilisateur.
   * @param {string} invoiceId - ID de la facture.
   * @returns {Promise<void>}
   * @throws {AppError} Si la suppression échoue.
   */
  async deleteInvoice(userId, invoiceId) {
    try {
      if (!userId || !invoiceId) {
        throw new AppError(400, 'ID utilisateur et ID facture requis');
      }
      const invoice = await userRepo.getInvoiceById(userId, invoiceId);
      await storageService.deleteFile(invoice.url);
      await userRepo.deleteInvoice(userId, invoiceId);
      socketService.emitToUser(userId, 'invoiceDeleted', { invoiceId });
      await notificationService.sendPushNotification(userId, {
        title: 'Facture supprimée',
        body: `Votre facture ${invoiceId} a été supprimée.`,
      });
      logAudit('Facture supprimée', { userId, invoiceId });
    } catch (error) {
      logError('Erreur lors de la suppression de la facture', { error: error.message, userId, invoiceId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de la facture', error.message);
    }
  }

  /**
   * Récupère les factures d'un utilisateur avec pagination.
   * @param {string} userId - ID de l'utilisateur.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<{ invoices: Invoice[], total: number, page: number, totalPages: number }>} Liste des factures paginée.
   * @throws {AppError} Si la récupération échoue.
   */
  async getUserInvoices(userId, page = 1, limit = 10) {
    try {
      if (!userId) {
        throw new AppError(400, 'ID utilisateur requis');
      }
      const result = await userRepo.getInvoicesByUser(userId, page, limit);
      logInfo('Factures de l\'utilisateur récupérées', { userId, page, limit, total: result.total });
      return result;
    } catch (error) {
      logError('Erreur lors de la récupération des factures de l\'utilisateur', { error: error.message, userId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des factures', error.message);
    }
  }
}

module.exports = new DocumentService();