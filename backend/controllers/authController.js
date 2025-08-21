/**
 * @file authController.js
 * @description Contrôleur pour les opérations d'authentification dans L&L Ouest Services.
 * Gère l'inscription, la connexion, la déconnexion, la vérification des tokens, et l'envoi d'emails d'action.
 * Intègre le service AuthService pour la logique métier et utilise les middlewares pour la validation et l'authentification.
 * @module controllers/authController
 */

const { logAudit, logError } = require('../services/loggerService');
const { AppError } = require('../utils/errorUtils');
const authService = require('../services/authService');

/**
 * @class AuthController
 * @description Contrôleur pour gérer les routes d'authentification. Appelle les méthodes du AuthService.
 */
class AuthController {
  /**
   * Inscrit un nouvel utilisateur.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.body - Données de l'utilisateur.
   * @param {string} req.body.email - Adresse email de l'utilisateur.
   * @param {string} req.body.name - Nom complet ou raison sociale.
   * @param {string} req.body.phone - Numéro de téléphone international.
   * @param {Object} [req.body.address] - Adresse des locaux professionnels (optionnel).
   * @param {string} req.body.firebaseToken - Token Firebase ID pour l'authentification.
   * @param {string} [req.body.fcmToken] - Token FCM pour notifications push (optionnel).
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON avec l'utilisateur créé et le JWT.
   * @throws {AppError} En cas d'erreur de validation, d'utilisateur existant ou d'erreur serveur.
   */
  async signUp(req, res, next) {
    try {
      const { email, name, phone, address, firebaseToken, fcmToken } = req.body;
      const { user, token } = await authService.signUp({
        email,
        name,
        phone,
        address,
        firebaseToken,
        fcmToken,
      });
      logAudit('Utilisateur inscrit via contrôleur', { userId: user.id, email });
      res.status(201).json({ status: 'success', data: { user, token } });
    } catch (error) {
      logError('Erreur lors de l\'inscription', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Connecte un utilisateur existant.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.body - Identifiants de connexion.
   * @param {string} req.body.email - Adresse email de l'utilisateur.
   * @param {string} req.body.firebaseToken - Token Firebase ID pour l'authentification.
   * @param {string} [req.body.fcmToken] - Token FCM pour notifications push (optionnel).
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON avec l'utilisateur connecté et le JWT.
   * @throws {AppError} En cas d'erreur de validation, d'email non vérifié ou d'erreur serveur.
   */
  async signIn(req, res, next) {
    try {
      const { email, firebaseToken, fcmToken } = req.body;
      const { user, token } = await authService.signIn({
        email,
        firebaseToken,
        fcmToken,
      });
      logAudit('Utilisateur connecté via contrôleur', { userId: user.id, email });
      res.status(200).json({ status: 'success', data: { user, token } });
    } catch (error) {
      logError('Erreur lors de la connexion', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Rafraîchit le JWT d'un utilisateur.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.body - Données de rafraîchissement.
   * @param {string} req.body.firebaseToken - Token Firebase ID pour l'authentification.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON avec l'ID utilisateur et le nouveau JWT.
   * @throws {AppError} En cas d'erreur de validation, d'email non vérifié ou d'erreur serveur.
   */
  async refreshToken(req, res, next) {
    try {
      const { firebaseToken } = req.body;
      const { userId, token } = await authService.refreshToken(firebaseToken);
      logAudit('Token rafraîchi via contrôleur', { userId });
      res.status(200).json({ status: 'success', data: { userId, token } });
    } catch (error) {
      logError('Erreur lors du rafraîchissement du token', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Déconnecte un utilisateur.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.body - Données de déconnexion.
   * @param {string} req.body.firebaseToken - Token Firebase ID pour l'authentification.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON confirmant la déconnexion.
   * @throws {AppError} En cas d'erreur de validation ou d'erreur serveur.
   */
  async signOut(req, res, next) {
    try {
      const { firebaseToken } = req.body;
      await authService.signOut(firebaseToken);
      logAudit('Utilisateur déconnecté via contrôleur', { userId: req.user?.id || 'unknown' });
      res.status(200).json({ status: 'success', message: 'Déconnexion réussie' });
    } catch (error) {
      logError('Erreur lors de la déconnexion', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Vérifie un token Firebase ID.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.body - Données de vérification.
   * @param {string} req.body.firebaseToken - Token Firebase ID pour l'authentification.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON avec l'ID utilisateur vérifié.
   * @throws {AppError} En cas d'erreur de validation, de token révoqué ou d'erreur serveur.
   */
  async verifyToken(req, res, next) {
    try {
      const { firebaseToken } = req.body;
      const { userId } = await authService.verifyToken(firebaseToken);
      logAudit('Token vérifié via contrôleur', { userId });
      res.status(200).json({ status: 'success', data: { userId } });
    } catch (error) {
      logError('Erreur lors de la vérification du token', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Envoie un email de vérification.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.body - Données de l'email.
   * @param {string} req.body.email - Adresse email à vérifier.
   * @param {string} req.body.name - Nom complet ou raison sociale.
   * @param {string} req.body.htmlTemplate - Template HTML pour l'email.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON confirmant l'envoi de l'email.
   * @throws {AppError} En cas d'erreur de validation ou d'erreur serveur.
   */
  async sendEmailVerification(req, res, next) {
    try {
      const { email, name, htmlTemplate } = req.body;
      await authService.sendEmailVerification(email, name, htmlTemplate);
      logAudit('Email de vérification envoyé via contrôleur', { email });
      res.status(200).json({ status: 'success', message: 'Email de vérification envoyé' });
    } catch (error) {
      logError('Erreur lors de l\'envoi de l\'email de vérification', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.body - Données de l'email.
   * @param {string} req.body.email - Adresse email pour réinitialisation.
   * @param {string} req.body.name - Nom complet ou raison sociale.
   * @param {string} req.body.htmlTemplate - Template HTML pour l'email.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON confirmant l'envoi de l'email.
   * @throws {AppError} En cas d'erreur de validation ou d'erreur serveur.
   */
  async sendPasswordReset(req, res, next) {
    try {
      const { email, name, htmlTemplate } = req.body;
      await authService.sendPasswordReset(email, name, htmlTemplate);
      logAudit('Email de réinitialisation envoyé via contrôleur', { email });
      res.status(200).json({ status: 'success', message: 'Email de réinitialisation envoyé' });
    } catch (error) {
      logError('Erreur lors de l\'envoi de l\'email de réinitialisation', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Envoie un email pour vérifier et changer l'email.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.body - Données de l'email.
   * @param {string} req.body.currentEmail - Adresse email actuelle.
   * @param {string} req.body.newEmail - Nouvelle adresse email.
   * @param {string} req.body.name - Nom complet ou raison sociale.
   * @param {string} req.body.htmlTemplate - Template HTML pour l'email.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON confirmant l'envoi de l'email.
   * @throws {AppError} En cas d'erreur de validation ou d'erreur serveur.
   */
  async sendVerifyAndChangeEmail(req, res, next) {
    try {
      const { currentEmail, newEmail, name, htmlTemplate } = req.body;
      await authService.sendVerifyAndChangeEmail(currentEmail, newEmail, name, htmlTemplate);
      logAudit('Email de changement d\'email envoyé via contrôleur', { currentEmail, newEmail });
      res.status(200).json({ status: 'success', message: 'Email de changement envoyé' });
    } catch (error) {
      logError('Erreur lors de l\'envoi de l\'email de changement', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Envoie un lien pour connexion sans mot de passe.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} req.body - Données de l'email.
   * @param {string} req.body.email - Adresse email pour connexion.
   * @param {string} req.body.name - Nom complet ou raison sociale.
   * @param {string} req.body.htmlTemplate - Template HTML pour l'email.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant pour la gestion des erreurs.
   * @returns {Promise<void>} Réponse JSON confirmant l'envoi de l'email.
   * @throws {AppError} En cas d'erreur de validation ou d'erreur serveur.
   */
  async sendSignInWithEmailLink(req, res, next) {
    try {
      const { email, name, htmlTemplate } = req.body;
      await authService.sendSignInWithEmailLink(email, name, htmlTemplate);
      logAudit('Email de connexion par lien envoyé via contrôleur', { email });
      res.status(200).json({ status: 'success', message: 'Email de connexion envoyé' });
    } catch (error) {
      logError('Erreur lors de l\'envoi de l\'email de connexion', { error: error.message, stack: error.stack });
      next(error);
    }
  }
}

const controller = new AuthController();
module.exports = {
  signUp: controller.signUp.bind(controller),
  signIn: controller.signIn.bind(controller),
  refreshToken: controller.refreshToken.bind(controller),
  signOut: controller.signOut.bind(controller),
  verifyToken: controller.verifyToken.bind(controller),
  sendEmailVerification: controller.sendEmailVerification.bind(controller),
  sendPasswordReset: controller.sendPasswordReset.bind(controller),
  sendVerifyAndChangeEmail: controller.sendVerifyAndChangeEmail.bind(controller),
  sendSignInWithEmailLink: controller.sendSignInWithEmailLink.bind(controller),
};
