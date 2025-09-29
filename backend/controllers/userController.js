/**
 * @file userController.js
 * @description Contrôleur pour gérer les opérations sur les utilisateurs dans L&L Ouest Services.
 * Fournit des endpoints pour les opérations CRUD, la gestion des préférences et des factures.
 * @module controllers/userController
 */

const userService  = require('../services/userService');
const {  logError, logAudit } = require('../services/loggerService');

/**
 * @class UserController
 * @description Gère les requêtes HTTP pour les utilisateurs.
 */
class UserController {
  /**
   * Crée un nouvel utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec l'utilisateur créé.
   */
  async createUser(req, res, next) {
    try {
      const userData = req.validatedData;
      const user = await userService.createUser(userData);
      res.status(201).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      logError('Erreur lors de la création de l\'utilisateur', { error: error.message });
      next(error);
    }
  }

  /**
   * Récupère le profil de l'utilisateur authentifié.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec le profil utilisateur.
   */
  async getProfile(req, res, next) {
    
    try {
      const user = await userService.getProfile(req.user.userId);
      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      
      logError('Erreur lors de la récupération du profil', { error: error.message, userId: req.user.id });
      next(error);
    }
  }

  /**
   * Récupère un utilisateur par son ID.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec l'utilisateur.
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.validatedData;
      const user = await userService.getUser(id);
      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      logError('Erreur lors de la récupération de l\'utilisateur', { error: error.message, userId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Récupère un utilisateur par son email.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec l'utilisateur.
   */
  async getUserByEmail(req, res, next) {
    try {
      const { email } = req.validatedData;
      const user = await userService.getUserByEmail(email);
      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      logError('Erreur lors de la récupération de l\'utilisateur par email', { error: error.message, email: req.validatedData.email });
      next(error);
    }
  }

  /**
   * Met à jour le profil de l'utilisateur authentifié.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec l'utilisateur mis à jour.
   */
  async updateProfile(req, res, next) {
    try {
      const userData = req.validatedData;
      const updatedUser = await userService.updateUser(req.user.id, userData);
      res.status(200).json({
        status: 'success',
        data: { user: updatedUser },
      });
    } catch (error) {
      logError('Erreur lors de la mise à jour du profil', { error: error.message, userId: req.user.id });
      next(error);
    }
  }

  /**
   * Met à jour un utilisateur (admin uniquement).
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec l'utilisateur mis à jour.
   */
  async updateUser(req, res, next) {
    try {
      const { id, ...userData } = req.validatedData;
      const updatedUser = await userService.updateUser(id, userData);
      res.status(200).json({
        status: 'success',
        data: { user: updatedUser },
      });
    } catch (error) {
      logError('Erreur lors de la mise à jour de l\'utilisateur', { error: error.message, userId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Supprime un utilisateur.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON confirmant la suppression.
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.validatedData;
      await userService.deleteUser(id);
      res.status(200).json({
        status: 'success',
        message: 'Utilisateur supprimé avec succès',
      });
    } catch (error) {
      logError('Erreur lors de la suppression de l\'utilisateur', { error: error.message, userId: req.validatedData.id });
      next(error);
    }
  }

  /**
   * Récupère tous les utilisateurs avec pagination.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec la liste des utilisateurs.
   */
  async getAllUsers(req, res, next) {
    try {
      const { page, limit } = req.validatedData;
      const { users, total, totalPages } = await userService.getAllUsers(page, limit);
      res.status(200).json({
        status: 'success',
        data: { users, total, page, totalPages },
      });
    } catch (error) {
      logError('Erreur lors de la récupération des utilisateurs', { error: error.message });
      next(error);
    }
  }

  /**
   * Récupère les utilisateurs par rôle avec pagination.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec la liste des utilisateurs.
   */
  async getUsersByRole(req, res, next) {
    try {
      const { role, page, limit } = req.validatedData;
      const { users, total, totalPages } = await userService.getUsersByRole(role, page, limit);
      res.status(200).json({
        status: 'success',
        data: { users, total, page, totalPages },
      });
    } catch (error) {
      logError('Erreur lors de la récupération des utilisateurs par rôle', { error: error.message, role: req.validatedData.role });
      next(error);
    }
  }

  /**
   * Met à jour les préférences de l'utilisateur authentifié.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec l'utilisateur mis à jour.
   */
  async updatePreferences(req, res, next) {
    try {
      const { preferences } = req.validatedData;
      const updatedUser = await userService.updatePreferences(req.user.id, preferences);
      res.status(200).json({
        status: 'success',
        data: { user: updatedUser },
      });
    } catch (error) {
      logError('Erreur lors de la mise à jour des préférences', { error: error.message, userId: req.user.id });
      next(error);
    }
  }

  /**
   * Ajoute une facture à l'utilisateur authentifié.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec l'utilisateur mis à jour.
   */
  async addInvoice(req, res, next) {
    try {
      const { invoice } = req.validatedData;
      const updatedUser = await userService.addInvoice(req.user.id, invoice);
      res.status(200).json({
        status: 'success',
        data: { user: updatedUser },
      });
    } catch (error) {
      logError('Erreur lors de l\'ajout de la facture', { error: error.message, userId: req.user.id });
      next(error);
    }
  }

  /**
   * Supprime une facture de l'utilisateur authentifié.
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON avec l'utilisateur mis à jour.
   */
  async removeInvoice(req, res, next) {
    try {
      const { invoiceId } = req.validatedData;
      const updatedUser = await userService.removeInvoice(req.user.id, invoiceId);
      res.status(200).json({
        status: 'success',
        data: { user: updatedUser },
      });
    } catch (error) {
      logError('Erreur lors de la suppression de la facture', { error: error.message, userId: req.user.id, invoiceId: req.validatedData.invoiceId });
      next(error);
    }
  }

  /**
   * Vérifie si un email est disponible (non utilisé par un utilisateur existant).
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Fonction pour passer au middleware suivant.
   * @returns {Promise<void>} - Réponse JSON indiquant si l'email est disponible.
   */
  async checkEmailAvailability(req, res, next) {
    try {
      const { email } = req.validatedData;
      const available = await userService.checkEmailAvailability(email);
      res.status(200).json({
        status: 'success',
        data: { available },
      });
    } catch (error) {
      logError('Erreur lors de la vérification de disponibilité de l\'email', { error: error.message, email: req.validatedData.email });
      next(error);
    }
  }
}

const controller = new UserController();
module.exports = {
  createUser: controller.createUser.bind(controller),
  getProfile: controller.getProfile.bind(controller),
  getUserById: controller.getUserById.bind(controller),
  getUserByEmail: controller.getUserByEmail.bind(controller),
  updateProfile: controller.updateProfile.bind(controller),
  updateUser: controller.updateUser.bind(controller),
  deleteUser: controller.deleteUser.bind(controller),
  getAllUsers: controller.getAllUsers.bind(controller),
  getUsersByRole: controller.getUsersByRole.bind(controller),
  updatePreferences: controller.updatePreferences.bind(controller),
  addInvoice: controller.addInvoice.bind(controller),
  removeInvoice: controller.removeInvoice.bind(controller),
  checkEmailAvailability: controller.checkEmailAvailability.bind(controller),
};
