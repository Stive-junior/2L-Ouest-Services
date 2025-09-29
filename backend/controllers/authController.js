/**
 * @file authController.js
 * @description Contrôleur pour les opérations d'authentification dans L&L Ouest Services.
 * Gère l'inscription, la connexion, la déconnexion, la vérification des tokens, l'envoi d'emails d'action, et la mise à jour des mots de passe/emails.
 * Intègre le service AuthService pour la logique métier et utilise les middlewares pour la validation et l'authentification.
 * @module controllers/authController
 * @version 1.4.0
 * @author L&L Ouest Services Team
 * @lastUpdated 2025-09-26
 * @license MIT
 * @dependencies authService, loggerService, errorUtils, firebase
 * @changelog
 * - v1.4.0: Ajout des méthodes pour la mise à jour du mot de passe et la gestion séquentielle du changement d'email.
 * - v1.3.0: Version initiale fournie.
 */

const { logAudit, logError } = require('../services/loggerService');
const authService = require('../services/authService');
const { userRepo } = require('../repositories');
const sanitizeHtml = require('sanitize-html');

/**
 * @class AuthController
 * @description Contrôleur pour gérer les routes d'authentification. Appelle les méthodes du AuthService.
 */
class AuthController {
  /**
   * Sanitize les données de la requête.
   * @param {Object} data - Données à sanitiser.
   * @returns {Object} Données sanitizées.
   * @private
   */
  _sanitizeData(data) {
    const sanitized = { ...data };
    if (sanitized.email) sanitized.email = sanitizeHtml(sanitized.email);
    if (sanitized.newEmail) sanitized.newEmail = sanitizeHtml(sanitized.newEmail);
    if (sanitized.currentEmail) sanitized.currentEmail = sanitizeHtml(sanitized.currentEmail);
    if (sanitized.name) sanitized.name = sanitizeHtml(sanitized.name);
    if (sanitized.phone) sanitized.phone = sanitizeHtml(sanitized.phone);
    if (sanitized.newPassword) sanitized.newPassword = sanitizeHtml(sanitized.newPassword);
    if (sanitized.htmlTemplate) sanitized.htmlTemplate = sanitizeHtml(sanitized.htmlTemplate, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'a']),
      allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt'], a: ['href'] },
    });
    if (sanitized.logoBase64) sanitized.logoBase64 = sanitizeHtml(sanitized.logoBase64);
    return sanitized;
  }

  /**
   * Inscrit un nouvel utilisateur.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant.
   */
  async signUp(req, res, next) {
    try {
      const sanitizedData = this._sanitizeData(req.body);
      const { email, name, phone, address, firebaseToken, fcmToken } = sanitizedData;
      const { user, token } = await authService.signUp({
        email,
        name,
        phone,
        address,
        firebaseToken,
        fcmToken,
      });
      logAudit('Utilisateur inscrit via contrôleur', { userId: user.id, email });
      res.status(201).json({
        status: 'success',
        data: { user, token },
        redirect: '/auth/verify-email.html',
      });
    } catch (error) {
      logError('Erreur lors de l\'inscription', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Récupère un utilisateur par email.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant.
   */
  async getUserByEmail(req, res, next) {
    try {
      const { email } = this._sanitizeData(req.body);
      const user = await userRepo.getByEmail(email);
      if (user) {
        res.status(200).json({ status: 'success', data: { user } });
      } else {
        res.status(404).json({ status: 'error', message: 'Utilisateur non trouvé' });
      }
    } catch (error) {
      logError('Erreur lors de la récupération de l\'utilisateur par email', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Connecte un utilisateur existant.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant.
   */
  async signIn(req, res, next) {
    try {
      const sanitizedData = this._sanitizeData(req.body);
      const { email, firebaseToken, fcmToken } = sanitizedData;
      const { user, token } = await authService.signIn({
        email,
        firebaseToken,
        fcmToken,
      });
      logAudit('Utilisateur connecté via contrôleur', { userId: user.id, email });
      res.status(200).json({
        status: 'success',
        data: { user, token },
        redirect: user.emailVerified ? '/dashboard.html' : '/pages/auth/verify-email.html',
      });
    } catch (error) {
      logError('Erreur lors de la connexion', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Rafraîchit le JWT d'un utilisateur.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant.
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
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant.
   */
  async signOut(req, res, next) {
    try {
      const { firebaseToken } = req.body;
      const userId = await authService.signOut(firebaseToken);
      logAudit('Utilisateur déconnecté via contrôleur', { userId });
      res.status(200).json({
        status: 'success',
        message: 'Déconnexion réussie',
        redirect: '/',
      });
    } catch (error) {
      logError('Erreur lors de la déconnexion', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Vérifie un token Firebase et retourne l'utilisateur synchronisé.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant.
   */
  async verifyToken(req, res, next) {
    try {
      const { firebaseToken } = req.body;
      const { user, token } = await authService.verifyToken(firebaseToken);
      logAudit('Token Firebase vérifié via contrôleur', { userId: user.id });
      res.status(200).json({
        status: 'success',
        data: { user, token, role: user.role },
        redirect: user.emailVerified ? '/dashboard.html' : '/auth/verify-email.html',
      });
    } catch (error) {
      logError('Erreur lors de la vérification du token', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Envoie un email de vérification.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant.
   */
  async sendEmailVerification(req, res, next) {
    try {
      const sanitizedData = this._sanitizeData(req.body);
      const { email, name, htmlTemplate, logoBase64, retry } = sanitizedData;
      await authService.sendEmailVerification({ email, name, htmlTemplate, logoBase64, retry });
      logAudit('Email de vérification envoyé via contrôleur', { email });
      res.status(200).json({
        status: 'success',
        message: 'Email de vérification envoyé',
        redirect: '/pages/auth/code-check.html',
      });
    } catch (error) {
      logError('Erreur lors de l\'envoi de l\'email de vérification', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant.
   */
  async sendPasswordReset(req, res, next) {
    try {
      const sanitizedData = this._sanitizeData(req.body);
      const { email, name, htmlTemplate, logoBase64, retry } = sanitizedData;
      await authService.sendPasswordReset({ email, name, htmlTemplate, logoBase64, retry });
      logAudit('Email de réinitialisation envoyé via contrôleur', { email });
      res.status(200).json({
        status: 'success',
        message: 'Email de réinitialisation envoyé',
        redirect: '/auth/code-check.html',
      });
    } catch (error) {
      logError('Erreur lors de l\'envoi de l\'email de réinitialisation', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Envoie un email pour vérifier l'email actuel avant changement.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant.
   */
  async requestNewEmail(req, res, next) {
    try {
      const sanitizedData = this._sanitizeData(req.body);
      const { email, name, htmlTemplate, logoBase64, retry } = sanitizedData;
      await authService.requestNewEmail({ email, name, htmlTemplate, logoBase64, retry });
      logAudit('Email de vérification d\'email actuel envoyé via contrôleur', { email });
      res.status(200).json({
        status: 'success',
        message: 'Email de vérification envoyé',
        redirect: '/pages/auth/code-check.html',
      });
    } catch (error) {
      logError('Erreur lors de l\'envoi de l\'email de vérification', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Confirme le nouvel email après vérification.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant.
   */
  async confirmNewEmail(req, res, next) {
    try {
      const sanitizedData = this._sanitizeData(req.body);
      const { newEmail, name, htmlTemplate, logoBase64, retry } = sanitizedData;
      await authService.confirmNewEmail({ newEmail, name, htmlTemplate, logoBase64, retry });
      logAudit('Email de confirmation de nouvel email envoyé via contrôleur', { newEmail });
      res.status(200).json({
        status: 'success',
        message: 'Email de confirmation envoyé',
        redirect: '/pages/auth/code-check.html',
      });
    } catch (error) {
      logError('Erreur lors de l\'envoi de l\'email de confirmation', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Met à jour le mot de passe après vérification.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant.
   */
  async updatePassword(req, res, next) {
    try {
      const sanitizedData = this._sanitizeData(req.body);
      const { email, newPassword } = sanitizedData;
      await authService.updatePassword({ email, newPassword });
      logAudit('Mot de passe mis à jour via contrôleur', { email });
      res.status(200).json({
        status: 'success',
        message: 'Mot de passe mis à jour avec succès',
        redirect: '/pages/auth/signin.html',
      });
    } catch (error) {
      logError('Erreur lors de la mise à jour du mot de passe', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Envoie un lien pour connexion sans mot de passe.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant.
   */
  async sendSignInWithEmailLink(req, res, next) {
    try {
      const sanitizedData = this._sanitizeData(req.body);
      const { email, name, htmlTemplate } = sanitizedData;
      await authService.sendSignInWithEmailLink(email, name, htmlTemplate);
      logAudit('Email de connexion par lien envoyé via contrôleur', { email });
      res.status(200).json({
        status: 'success',
        message: 'Email de connexion envoyé',
        redirect: '/auth/signin.html',
      });
    } catch (error) {
      logError('Erreur lors de l\'envoi de l\'email de connexion', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Vérifie le code de vérification à 6 chiffres.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant.
   */
  async verifyEmailCode(req, res, next) {
    try {
      const sanitizedData = this._sanitizeData(req.body);
      const { email, code } = sanitizedData;
      const { redirect } = await authService.verifyEmailCode({ email, code });
      logAudit('Code de vérification validé via contrôleur', { email });
      res.status(200).json({
        status: 'success',
        message: 'Email vérifié avec succès',
        redirect,
      });
    } catch (error) {
      logError('Erreur lors de la vérification du code', { error: error.message, stack: error.stack });
      if (error.message.includes('expiré')) {
        res.status(400).json({
          status: 'error',
          message: 'Code de vérification expiré. Un nouveau code a été envoyé.',
          redirect: '/pages/auth/code-check.html',
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * Vérifie le code de réinitialisation de mot de passe.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant.
   */
  async verifyPasswordResetCode(req, res, next) {
    try {
      const sanitizedData = this._sanitizeData(req.body);
      const { email, code } = sanitizedData;
      await authService.verifyPasswordResetCode({ email, code });
      logAudit('Code de réinitialisation validé via contrôleur', { email });
      res.status(200).json({
        status: 'success',
        message: 'Code de réinitialisation vérifié',
        redirect: '/auth/reset-password.html',
      });
    } catch (error) {
      logError('Erreur lors de la vérification du code de réinitialisation', { error: error.message, stack: error.stack });
      if (error.message.includes('expiré')) {
        const sanitizedData = this._sanitizeData(req.body);
        await authService.sendPasswordReset({ ...sanitizedData, retry: true });
        res.status(400).json({
          status: 'error',
          message: 'Code de réinitialisation expiré. Un nouveau code a été envoyé.',
          redirect: '/auth/code-check.html',
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * Vérifie le code de changement d'email.
   * @async
   * @param {Object} req - Requête HTTP.
   * @param {Object} res - Réponse HTTP.
   * @param {Function} next - Middleware suivant.
   */
  async verifyChangeEmailCode(req, res, next) {
    try {
      const sanitizedData = this._sanitizeData(req.body);
      const { email, code } = sanitizedData;
      await authService.verifyChangeEmailCode({ email, code });
      logAudit('Code de changement d\'email validé via contrôleur', { email });
      res.status(200).json({
        status: 'success',
        message: 'Changement d\'email vérifié',
        redirect: '/pages/auth/confirm-new-email.html',
      });
    } catch (error) {
      logError('Erreur lors de la vérification du code de changement d\'email', { error: error.message, stack: error.stack });
      if (error.message.includes('expiré')) {
        const sanitizedData = this._sanitizeData(req.body);
        await authService.requestNewEmail({ ...sanitizedData, retry: true });
        res.status(400).json({
          status: 'error',
          message: 'Code de changement d\'email expiré. Un nouveau code a été envoyé.',
          redirect: '/pages/auth/code-check.html',
        });
      } else {
        next(error);
      }
    }
  }
}

const controller = new AuthController();
module.exports = {
  signUp: controller.signUp.bind(controller),
  signIn: controller.signIn.bind(controller),
  getUserByEmail: controller.getUserByEmail.bind(controller),
  refreshToken: controller.refreshToken.bind(controller),
  signOut: controller.signOut.bind(controller),
  verifyToken: controller.verifyToken.bind(controller),
  sendEmailVerification: controller.sendEmailVerification.bind(controller),
  sendPasswordReset: controller.sendPasswordReset.bind(controller),
  requestNewEmail: controller.requestNewEmail.bind(controller),
  confirmNewEmail: controller.confirmNewEmail.bind(controller),
  updatePassword: controller.updatePassword.bind(controller),
  sendSignInWithEmailLink: controller.sendSignInWithEmailLink.bind(controller),
  verifyEmailCode: controller.verifyEmailCode.bind(controller),
  verifyPasswordResetCode: controller.verifyPasswordResetCode.bind(controller),
  verifyChangeEmailCode: controller.verifyChangeEmailCode.bind(controller),
};
