/**
 * @file documentController.js
 * @description Contrôleur pour gérer les factures dans L&L Ouest Services.
 * Fournit des endpoints pour générer, récupérer, mettre à jour, supprimer et lister les factures.
 * @module controllers/documentController
 */

const  documentService  = require('../services/documentService');
const  emailService  = require('../services/emailService');
const { logger, logError } = require('../services/loggerService');
const { AppError } = require('../utils/errorUtils');

/**
 * @class DocumentController
 * @description Gère les requêtes HTTP pour les factures.
 */
class DocumentController {
  /**
   * Génère une nouvelle facture et envoie un email de confirmation.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec la facture générée.
   */
  async generateInvoice(req, res, next) {
    try {
      const { amount, items, dueDate } = req.validatedData;
      const { filePath, invoice } = await documentService.generateInvoice(req.user.id, { amount, items, dueDate }, req.body.htmlTemplate);
      await emailService.sendInvoiceEmail(req.user.id, filePath, invoice, req.body.htmlTemplate);
      res.status(201).json({
        status: 'success',
        data: { invoice },
      });
    } catch (error) {
      logError('Erreur lors de la génération de la facture', { error: error.message, userId: req.user.id });
      next(error);
    }
  }

  /**
   * Récupère une facture par son ID.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec la facture.
   */
  async getInvoice(req, res, next) {
    try {
      const { id } = req.validatedData;
      const invoice = await documentService.getInvoice(req.user.id, id);
      if (invoice.userId !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'Accès interdit à la facture');
      }
      res.status(200).json({
        status: 'success',
        data: { invoice },
      });
    } catch (error) {
      logError('Erreur lors de la récupération de la facture', { error: error.message, invoiceId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Met à jour une facture.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec la facture mise à jour.
   */
  async updateInvoice(req, res, next) {
    try {
      const { id, ...invoiceData } = req.validatedData;
      const invoice = await documentService.getInvoice(req.user.id, id);
      if (invoice.userId !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'Seul l\'utilisateur associé ou un admin peut modifier la facture');
      }
      const updatedInvoice = await documentService.updateInvoice(req.user.id, id, invoiceData);
      res.status(200).json({
        status: 'success',
        data: { invoice: updatedInvoice },
      });
    } catch (error) {
      logError('Erreur lors de la mise à jour de la facture', { error: error.message, invoiceId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Supprime une facture.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant la suppression.
   */
  async deleteInvoice(req, res, next) {
    try {
      const { id } = req.validatedData;
      const invoice = await documentService.getInvoice(req.user.id, id);
      if (invoice.userId !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'Seul l\'utilisateur associé ou un admin peut supprimer la facture');
      }
      await documentService.deleteInvoice(req.user.id, id);
      res.status(200).json({
        status: 'success',
        message: 'Facture supprimée avec succès',
      });
    } catch (error) {
      logError('Erreur lors de la suppression de la facture', { error: error.message, invoiceId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Récupère les factures d'un utilisateur avec pagination.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec la liste des factures.
   */
  async getUserInvoices(req, res, next) {
    try {
      const { page, limit } = req.validatedData;
      const { invoices, total, page: currentPage, totalPages } = await documentService.getUserInvoices(req.user.id, page, limit);
      res.status(200).json({
        status: 'success',
        data: { invoices, total, page: currentPage, totalPages },
      });
    } catch (error) {
      logError('Erreur lors de la récupération des factures de l\'utilisateur', { error: error.message, userId: req.user.id });
      next(error);
    }
  }
}

const controller = new DocumentController();
module.exports = {
  generateInvoice: controller.generateInvoice.bind(controller),
  getInvoice: controller.getInvoice.bind(controller),
  updateInvoice: controller.updateInvoice.bind(controller),
  deleteInvoice: controller.deleteInvoice.bind(controller),
  getUserInvoices: controller.getUserInvoices.bind(controller),
};
