/**
 * @file contactController.js
 * @description Contrôleur pour gérer les messages de contact dans L&L Ouest Services.
 * Fournit des endpoints pour créer, récupérer, mettre à jour, supprimer et lister les messages de contact, ainsi que pour envoyer des emails de confirmation.
 * @module controllers/contactController
 */

const emailService  = require('../services/emailService');
const { logger, logError } = require('../services/loggerService');
const { AppError } = require('../utils/errorUtils');

/**
 * @class ContactController
 * @description Gère les requêtes HTTP pour les messages de contact.
 */
class ContactController {
  /**
   * Crée un nouveau message de contact et envoie un email de confirmation.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec le message de contact créé.
   */
  async createContact(req, res, next) {
    try {
      const contactData = { ...req.validatedData, userId: req.user?.id || null };
      const contact = await emailService.createContact(contactData);
      await emailService.sendContactEmail(contact.id, req.body.htmlTemplate);
      res.status(201).json({
        status: 'success',
        data: { contact },
      });
    } catch (error) {
      logError('Erreur lors de la création du message de contact', { error: error.message });
      next(error);
    }
  }

  /**
   * Récupère un message de contact par son ID.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec le message de contact.
   */
  async getContact(req, res, next) {
    try {
      const { id } = req.validatedData;
      const contact = await emailService.getContact(id);
      if (contact.userId && contact.userId !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'Accès interdit au message de contact');
      }
      res.status(200).json({
        status: 'success',
        data: { contact },
      });
    } catch (error) {
      logError('Erreur lors de la récupération du message de contact', { error: error.message, contactId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Met à jour un message de contact.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec le message de contact mis à jour.
   */
  async updateContact(req, res, next) {
    try {
      const { id, ...contactData } = req.validatedData;
      const contact = await emailService.getContact(id);
      if (contact.userId && contact.userId !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'Seul l\'auteur ou un admin peut modifier le message de contact');
      }
      const updatedContact = await emailService.updateContact(id, contactData);
      res.status(200).json({
        status: 'success',
        data: { contact: updatedContact },
      });
    } catch (error) {
      logError('Erreur lors de la mise à jour du message de contact', { error: error.message, contactId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Supprime un message de contact.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant la suppression.
   */
  async deleteContact(req, res, next) {
    try {
      const { id } = req.validatedData;
      const contact = await emailService.getContact(id);
      if (contact.userId && contact.userId !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'Seul l\'auteur ou un admin peut supprimer le message de contact');
      }
      await emailService.deleteContact(id);
      res.status(200).json({
        status: 'success',
        message: 'Message de contact supprimé avec succès',
      });
    } catch (error) {
      logError('Erreur lors de la suppression du message de contact', { error: error.message, contactId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Récupère tous les messages de contact avec pagination.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec la liste des messages de contact.
   */
  async getAllContacts(req, res, next) {
    try {
      const { page, limit } = req.validatedData;
      const { contacts, total, page: currentPage, limit: currentLimit } = await emailService.getAllContacts(page, limit);
      res.status(200).json({
        status: 'success',
        data: { contacts, total, page: currentPage, limit: currentLimit },
      });
    } catch (error) {
      logError('Erreur lors de la récupération des messages de contact', { error: error.message });
      next(error);
    }
  }
}

const controller = new ContactController();
module.exports = {
  createContact: controller.createContact.bind(controller),
  getContact: controller.getContact.bind(controller),
  updateContact: controller.updateContact.bind(controller),
  deleteContact: controller.deleteContact.bind(controller),
  getAllContacts: controller.getAllContacts.bind(controller),
};
