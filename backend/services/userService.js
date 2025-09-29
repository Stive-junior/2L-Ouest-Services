/**
 * @file userService.js
 * @description Service pour gérer les utilisateurs dans L&L Ouest Services.
 * Utilise userRepo pour les opérations CRUD, notificationService pour les notifications,
 * et authService pour la gestion de l'authentification.
 * @module services/userService
 */

const { userRepo } = require('../repositories');
const notificationService = require('./notificationService');
const authService = require('./authService');
const { generateUUID } = require('../utils/helperUtils');
const { logger, logInfo, logError, logAudit } = require('./loggerService');
const { AppError } = require('../utils/errorUtils');
const { validate } = require('../utils/validationUtils');
const { createUserSchema, updateUserSchema, preferencesSchema, invoiceSchema } = require('../utils/validation/userValidation');

/**
 * @typedef {Object} User
 * @property {string} id - ID de l'utilisateur.
 * @property {string} email - Adresse email.
 * @property {string} name - Nom complet ou raison sociale.
 * @property {string} role - Rôle (client, admin).
 * @property {string} [phone] - Numéro de téléphone.
 * @property {Object} [address] - Adresse des locaux.
 * @property {string} [company] - Nom de l'entreprise.
 * @property {Object[]} [invoices] - Liste des factures.
 * @property {Object} [preferences] - Préférences utilisateur.
 * @property {Object} [location] - Localisation.
 * @property {string} createdAt - Date de création (ISO).
 * @property {string} [lastLogin] - Date de dernière connexion (ISO).
 * @property {boolean} emailVerified - Statut de vérification de l'email.
 */

/**
 * @class UserService
 * @description Gère les opérations sur les utilisateurs, y compris création, mise à jour, suppression, et gestion des factures.
 */
class UserService {
  /**
   * Crée un nouvel utilisateur.
   * @async
   * @param {Object} userData - Données de l'utilisateur.
   * @returns {Promise<User>} Utilisateur créé.
   */
  async createUser(userData) {
    const { error, value } = validate(userData, createUserSchema);
    if (error) throw new AppError(400, 'Données utilisateur invalides', error.details);

    try {
      const existingUser = await userRepo.getByEmail(value.email);
      if (existingUser) throw new AppError(409, 'Un utilisateur avec cet email existe déjà');
      const userId = generateUUID();
      const user = await userRepo.create({ ...value, id: userId });
      await authService.createAuthUser(userId, value.email, value.password);
      await notificationService.sendPushNotification(userId, {
        title: 'Bienvenue chez L&L Ouest Services',
        body: `Votre compte ${value.email} a été créé avec succès.`,
        data: { type: 'userCreated', userId },
      });
      logInfo('Utilisateur créé', { userId, email: value.email });
      return user;
    } catch (error) {
      logError('Erreur lors de la création de l\'utilisateur', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création de l\'utilisateur', error.message);
    }
  }

  /**
   * Récupère le profil de l'utilisateur connecté.
   * @async
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Promise<User>} Profil utilisateur.
   */
  async getProfile(userId) {
    try {
      const user = await userRepo.getById(userId);
      logInfo('Profil utilisateur récupéré', { userId });
      return user;
    } catch (error) {
      logError('Erreur lors de la récupération du profil', { error: error.message, userId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération du profil', error.message);
    }
  }

  /**
   * Récupère un utilisateur par son ID.
   * @async
   * @param {string} id - ID de l'utilisateur.
   * @returns {Promise<User>} Utilisateur trouvé.
   */
  async getUserById(id) {
    try {
      const user = await userRepo.getById(id);
      logInfo('Utilisateur récupéré par ID', { id });
      return user;
    } catch (error) {
      logError('Erreur lors de la récupération de l\'utilisateur par ID', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de l\'utilisateur', error.message);
    }
  }

  /**
   * Récupère un utilisateur par son email.
   * @async
   * @param {string} email - Email de l'utilisateur.
   * @returns {Promise<User>} Utilisateur trouvé.
   */
  async getUserByEmail(email) {
    try {
      const user = await userRepo.getByEmail(email);
      logInfo('Utilisateur récupéré par email', { email });
      return user;
    } catch (error) {
      logError('Erreur lors de la récupération de l\'utilisateur par email', { error: error.message, email });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de l\'utilisateur par email', error.message);
    }
  }

  /**
   * Met à jour le profil de l'utilisateur connecté.
   * @async
   * @param {string} userId - ID de l'utilisateur.
   * @param {Object} userData - Données à mettre à jour.
   * @returns {Promise<User>} Utilisateur mis à jour.
   */
  async updateProfile(userId, userData) {
    const { error, value } = validate({ ...userData, id: userId }, updateUserSchema);
    if (error) throw new AppError(400, 'Données de mise à jour invalides', error.details);

    try {
      const user = await userRepo.update(userId, value);
      await notificationService.sendPushNotification(userId, {
        title: 'Profil mis à jour',
        body: 'Votre profil a été mis à jour avec succès.',
        data: { type: 'profileUpdated', userId },
      });
      logAudit('Profil utilisateur mis à jour', { userId });
      return user;
    } catch (error) {
      logError('Erreur lors de la mise à jour du profil', { error: error.message, userId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour du profil', error.message);
    }
  }

  /**
   * Met à jour un utilisateur (admin uniquement).
   * @async
   * @param {string} id - ID de l'utilisateur.
   * @param {Object} userData - Données à mettre à jour.
   * @returns {Promise<User>} Utilisateur mis à jour.
   */
  async updateUser(id, userData) {
    const { error, value } = validate({ ...userData, id }, updateUserSchema);
    if (error) throw new AppError(400, 'Données de mise à jour invalides', error.details);

    try {
      const user = await userRepo.update(id, value);
      await notificationService.sendPushNotification(id, {
        title: 'Compte mis à jour',
        body: 'Votre compte a été mis à jour par un administrateur.',
        data: { type: 'userUpdated', userId: id },
      });
      logAudit('Utilisateur mis à jour par admin', { userId: id });
      return user;
    } catch (error) {
      logError('Erreur lors de la mise à jour de l\'utilisateur', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour de l\'utilisateur', error.message);
    }
  }

  /**
   * Supprime un utilisateur.
   * @async
   * @param {string} id - ID de l'utilisateur.
   * @returns {Promise<void>}
   */
  async deleteUser(id) {
    try {
      await userRepo.delete(id);
      await authService.deleteAuthUser(id);
      logAudit('Utilisateur supprimé', { userId: id });
    } catch (error) {
      logError('Erreur lors de la suppression de l\'utilisateur', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de l\'utilisateur', error.message);
    }
  }

  /**
   * Récupère tous les utilisateurs avec pagination.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Nombre d'utilisateurs par page.
   * @returns {Promise<{ users: User[], total: number, page: number, totalPages: number }>}
   */
  async getAllUsers(page = 1, limit = 10) {
    try {
      const result = await userRepo.getAll(page, limit);
      logInfo('Tous les utilisateurs récupérés', { page, limit, total: result.total });
      return result;
    } catch (error) {
      logError('Erreur lors de la récupération de tous les utilisateurs', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de tous les utilisateurs', error.message);
    }
  }

  /**
   * Récupère les utilisateurs par rôle avec pagination.
   * @async
   * @param {string} role - Rôle des utilisateurs.
   * @param {number} page - Numéro de page.
   * @param {number} limit - Nombre d'utilisateurs par page.
   * @returns {Promise<{ users: User[], total: number, page: number, totalPages: number }>}
   */
  async getUsersByRole(role, page = 1, limit = 10) {
    try {
      const result = await userRepo.getByRole(role, page, limit);
      logInfo('Utilisateurs récupérés par rôle', { role, page, limit, total: result.total });
      return result;
    } catch (error) {
      logError('Erreur lors de la récupération des utilisateurs par rôle', { error: error.message, role });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des utilisateurs par rôle', error.message);
    }
  }

  /**
   * Met à jour les préférences d'un utilisateur.
   * @async
   * @param {string} userId - ID de l'utilisateur.
   * @param {Object} preferences - Préférences à mettre à jour.
   * @returns {Promise<User>} Utilisateur mis à jour.
   */
  async updatePreferences(userId, preferences) {
    const { error, value } = validate({ preferences }, preferencesSchema);
    if (error) throw new AppError(400, 'Préférences invalides', error.details);

    try {
      const user = await userRepo.updatePreferences(userId, value.preferences);
      await notificationService.sendPushNotification(userId, {
        title: 'Préférences mises à jour',
        body: 'Vos préférences ont été mises à jour avec succès.',
        data: { type: 'preferencesUpdated', userId },
      });
      logAudit('Préférences utilisateur mises à jour', { userId });
      return user;
    } catch (error) {
      logError('Erreur lors de la mise à jour des préférences', { error: error.message, userId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour des préférences', error.message);
    }
  }

  /**
   * Ajoute une facture à un utilisateur.
   * @async
   * @param {string} userId - ID de l'utilisateur.
   * @param {Object} invoice - Données de la facture.
   * @returns {Promise<User>} Utilisateur mis à jour.
   */
  async addInvoice(userId, invoice) {
    const { error, value } = validate({ invoice }, invoiceSchema);
    if (error) throw new AppError(400, 'Données de facture invalides', error.details);

    try {
      const user = await userRepo.addInvoice(userId, value.invoice);
      await notificationService.sendPushNotification(userId, {
        title: 'Nouvelle facture ajoutée',
        body: `Une nouvelle facture (ID: ${value.invoice.id}) a été ajoutée à votre compte.`,
        data: { type: 'invoiceAdded', userId, invoiceId: value.invoice.id },
      });
      logAudit('Facture ajoutée', { userId, invoiceId: value.invoice.id });
      return user;
    } catch (error) {
      logError('Erreur lors de l\'ajout de la facture', { error: error.message, userId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'ajout de la facture', error.message);
    }
  }

  /**
   * Supprime une facture d'un utilisateur.
   * @async
   * @param {string} userId - ID de l'utilisateur.
   * @param {string} invoiceId - ID de la facture.
   * @returns {Promise<void>}
   */
  async removeInvoice(userId, invoiceId) {
    try {
      await userRepo.deleteInvoice(userId, invoiceId);
      await notificationService.sendPushNotification(userId, {
        title: 'Facture supprimée',
        body: `La facture (ID: ${invoiceId}) a été supprimée de votre compte.`,
        data: { type: 'invoiceRemoved', userId, invoiceId },
      });
      logAudit('Facture supprimée', { userId, invoiceId });
    } catch (error) {
      logError('Erreur lors de la suppression de la facture', { error: error.message, userId, invoiceId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de la facture', error.message);
    }
  }

  /**
   * Vérifie si un email est disponible (non utilisé par un utilisateur existant).
   * @async
   * @param {string} email - Email à vérifier.
   * @returns {Promise<boolean>} True si disponible, false sinon.
   */
  async checkEmailAvailability(email) {
    try {
      const user = await userRepo.getByEmail(email);
      return !user;
    } catch (error) {
      logError('Erreur lors de la vérification de disponibilité de l\'email', { error: error.message, email });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la vérification de l\'email', error.message);
    }
  }
}

module.exports = new UserService();
