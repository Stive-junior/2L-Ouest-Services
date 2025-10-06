/**
 * @file contactController.js
 * @description Contrôleur pour gérer les messages de contact et les réservations dans L&L Ouest Services.
 * Fournit des endpoints pour créer, récupérer, mettre à jour, supprimer et lister les messages de contact et les réservations, ainsi que pour envoyer des emails de confirmation/réponse.
 * @module controllers/contactController
 */
const emailService = require('../services/emailService');
const reservationService = require('../services/reservationService');
const { logger, logError } = require('../services/loggerService');
const { AppError } = require('../utils/errorUtils');


/**
 * @class ContactController
 * @description Gère les requêtes HTTP pour les messages de contact et les réservations.
 */
class ContactController {
  /**
   * Crée un nouveau message de contact et envoie des emails de confirmation.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec le message de contact créé.
   */
  async createContact(req, res, next) {
    try {
      const contactData = { ...req.validatedData, userId: req.user?.id || null };
      const { clientHtmlTemplate, adminHtmlTemplate } = req.body;
      const contact = await emailService.createContact(contactData, clientHtmlTemplate, adminHtmlTemplate);
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
      const updatedContact = await emailService.updateContact(id, { ...contactData, updatedBy: req.user.id });
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
      const result = await emailService.deleteContact(id, req.user.id);
      res.status(200).json({
        status: 'success',
        data: result,
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
      const { page, limit, ...filters } = req.validatedData;
      const result = await emailService.getAllContacts(page, limit, filters);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      logError('Erreur lors de la récupération des messages de contact', { error: error.message });
      next(error);
    }
  }

  /**
   * Envoie une réponse à un message de contact.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec le résultat de l'envoi.
   */
  async replyToContact(req, res, next) {
    try {
      const { id, replyMessage, htmlTemplate, replySubject } = req.validatedData;
      const result = await emailService.sendReplyEmail(id, replyMessage, htmlTemplate, replySubject, {
        repliedBy: req.user.id,
        repliedByName: req.user.name,
      });
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      logError('Erreur lors de l\'envoi de la réponse au message de contact', { error: error.message, contactId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Crée une nouvelle réservation et envoie des emails de confirmation.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec la réservation créée.
   */
  async createReservation(req, res, next) {
    try {
      const reservationData = { ...req.validatedData, userId: req.user?.id || null };
      const { clientHtmlTemplate, adminHtmlTemplate } = req.body;
      const reservation = await reservationService.createReservation(reservationData, clientHtmlTemplate, adminHtmlTemplate);
      res.status(201).json({
        status: 'success',
        data: { reservation },
      });
    } catch (error) {
      logError('Erreur lors de la création de la réservation', { error: error.message });
      next(error);
    }
  }

  /**
   * Récupère une réservation par son ID.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec la réservation.
   */
  async getReservation(req, res, next) {
    try {
      const { id } = req.validatedData;
      const reservation = await reservationService.getReservation(id);
      if (reservation.userId && reservation.userId !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'Accès interdit à la réservation');
      }
      res.status(200).json({
        status: 'success',
        data: { reservation },
      });
    } catch (error) {
      logError('Erreur lors de la récupération de la réservation', { error: error.message, reservationId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Met à jour une réservation.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec la réservation mise à jour.
   */
  async updateReservation(req, res, next) {
    try {
      const { id, ...reservationData } = req.validatedData;
      const reservation = await reservationService.getReservation(id);
      if (reservation.userId && reservation.userId !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'Seul l\'auteur ou un admin peut modifier la réservation');
      }
      const updatedReservation = await reservationService.updateReservation(id, { ...reservationData, updatedBy: req.user.id });
      res.status(200).json({
        status: 'success',
        data: { reservation: updatedReservation },
      });
    } catch (error) {
      logError('Erreur lors de la mise à jour de la réservation', { error: error.message, reservationId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Supprime une réservation.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant la suppression.
   */
  async deleteReservation(req, res, next) {
    try {
      const { id } = req.validatedData;
      const reservation = await reservationService.getReservation(id);
      if (reservation.userId && reservation.userId !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'Seul l\'auteur ou un admin peut supprimer la réservation');
      }
      const result = await reservationService.deleteReservation(id, req.user.id);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      logError('Erreur lors de la suppression de la réservation', { error: error.message, reservationId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Récupère toutes les réservations avec pagination.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec la liste des réservations.
   */
  async getAllReservations(req, res, next) {
    try {
      const { page, limit, ...filters } = req.validatedData;
      const result = await reservationService.getAllReservations(page, limit, filters);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      logError('Erreur lors de la récupération des réservations', { error: error.message });
      next(error);
    }
  }

  /**
   * Envoie une réponse à une réservation.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec le résultat de l'envoi.
   */
  async replyToReservation(req, res, next) {
    try {
      const { id, replyMessage, htmlTemplate, replySubject } = req.validatedData;
      const result = await reservationService.sendReplyEmail(id, replyMessage, htmlTemplate, replySubject, {
        repliedBy: req.user.id,
        repliedByName: req.user.name,
      });
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      logError('Erreur lors de l\'envoi de la réponse à la réservation', { error: error.message, reservationId: req.validatedData.id });
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
  replyToContact: controller.replyToContact.bind(controller),
  createReservation: controller.createReservation.bind(controller),
  getReservation: controller.getReservation.bind(controller),
  updateReservation: controller.updateReservation.bind(controller),
  deleteReservation: controller.deleteReservation.bind(controller),
  getAllReservations: controller.getAllReservations.bind(controller),
  replyToReservation: controller.replyToReservation.bind(controller),
};