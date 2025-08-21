/**
 * @file authService.js
 * @description Service de gestion de l'authentification pour L&L Ouest Services.
 * Utilise Firebase Auth pour vérifier les tokens ID fournis par le client.
 * Synchronise les utilisateurs avec Firestore, génère des JWT pour les API, et envoie des notifications via Socket.IO et FCM.
 * Gère l'envoi de liens pour la vérification d'email et la réinitialisation de mot de passe via Firebase Admin.
 * Intègre les templates HTML fournis par le frontend.
 * @module services/authService
 */

const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const { userRepo } = require('../repositories');
const socketService = require('./socketService');
const notificationService = require('./notificationService');
const emailService = require('./emailService');
const { logInfo, logError, logAudit, logWarn } = require('./loggerService');
const { AppError, UnauthorizedError, NotFoundError } = require('../utils/errorUtils');
const { validate, userSchema } = require('../utils/validationUtils');
const { signUpSchema, signInSchema, tokenSchema, emailSchema, verifyAndChangeEmailSchema } = require('../utils/validation/authValidation');
const config = require('../config/config');

/**
 * @class AuthService
 * @description Gère les opérations d'authentification avec Firebase Auth, synchronisation Firestore, génération JWT, et envoi de liens d'action email.
 */
class AuthService {
  /**
   * @constructor
   * @description Initialise Firebase Admin SDK avec les credentials du service account.
   */
  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: 'll-ouest-services',
          clientEmail: 'firebase-adminsdk-fbsvc@ll-ouest-services.iam.gserviceaccount.com',
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    this.auth = admin.auth();
  }

  /**
   * Génère un JWT signé pour les appels API.
   * @param {string} userId - ID de l'utilisateur.
   * @param {string} role - Rôle de l'utilisateur (client ou admin).
   * @returns {string} JWT signé.
   * @private
   */
  _generateJwt(userId, role) {
    return jwt.sign({ userId, role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  }

  /**
   * Définit les paramètres ActionCodeSettings pour les liens d'action email.
   * @returns {Object} Configuration pour les liens d'action Firebase.
   * @private
   */
  _getActionCodeSettings() {
    return {
      url: `${config.frontendUrl}/auth/verify`,
      handleCodeInApp: true,
      dynamicLinkDomain: 'll-ouest-services.firebaseapp.com',
    };
  }

  /**
   * Inscrit un nouvel utilisateur et synchronise avec Firestore.
   * @param {Object} userData - Données de l'utilisateur.
   * @param {string} userData.email - Adresse email.
   * @param {string} userData.name - Nom complet ou raison sociale.
   * @param {string} userData.phone - Numéro de téléphone.
   * @param {Object} [userData.address] - Adresse (optionnel).
   * @param {string} userData.firebaseToken - Token ID Firebase.
   * @param {string} [userData.fcmToken] - Token FCM (optionnel).
   * @returns {Promise<{ user: Object, token: string }>} Utilisateur créé et JWT.
   * @throws {AppError} En cas d'erreur de validation, d'utilisateur existant ou d'erreur serveur.
   */
  async signUp(userData) {
    const { error, value } = validate(userData, signUpSchema);
    if (error) throw new AppError(400, 'Données d\'inscription invalides', error.details);

    const { email, name, phone, address, firebaseToken, fcmToken } = value;

    try {
      const decodedToken = await this.auth.verifyIdToken(firebaseToken, true);
      const userId = decodedToken.uid;
      logInfo('Token vérifié avec succès', { userId, email: decodedToken.email });

      // Vérifier si l'utilisateur existe déjà
      try {
        await userRepo.getById(userId);
        throw new AppError(409, 'Utilisateur déjà inscrit');
      } catch (error) {
        if (error instanceof NotFoundError) {
          logWarn('Utilisateur non trouvé, création autorisée', { userId, email });
        } else {
          throw error;
        }
      }

      const userProfile = {
        id: userId,
        email,
        name,
        phone,
        address: address || null,
        role: 'client',
        company: null,
        invoices: [],
        preferences: {
          notifications: true,
          language: 'fr',
          fcmToken: fcmToken || null,
        },
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        location: null,
        emailVerified: decodedToken.email_verified || false,
      };

      // Valider le profil utilisateur avant création
      const { error: profileError } = validate(userProfile, userSchema);
      if (profileError) throw new AppError(400, 'Profil utilisateur invalide', profileError.details);

      const user = await userRepo.create(userProfile);
      const token = this._generateJwt(userId, user.role);

      socketService.emitToUser(userId, 'authStatus', {
        status: 'signedUp',
        userId,
        message: 'Inscription réussie',
      });

      await this.sendEmailVerification(email, name);

      if (fcmToken) {
        try {
          await notificationService.sendPushNotification(userId, {
            title: 'Bienvenue chez L&L Ouest Services',
            body: `Votre compte a été créé avec succès, ${name}. Vérifiez votre email pour confirmer.`,
            data: { type: 'welcome', userId },
          });
        } catch (notificationError) {
          logError('Échec notification bienvenue', { error: notificationError.message });
        }
      }

      logAudit('Utilisateur inscrit', { userId, email });
      return { user, token };
    } catch (error) {
      logError('Erreur inscription', { error: error.message, stack: error.stack });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur inscription', error.message);
    }
  }

  /**
   * Connecte un utilisateur existant.
   * @param {Object} credentials - Identifiants de connexion.
   * @param {string} credentials.email - Adresse email.
   * @param {string} credentials.firebaseToken - Token ID Firebase.
   * @param {string} [credentials.fcmToken] - Token FCM (optionnel).
   * @returns {Promise<{ user: Object, token: string }>} Utilisateur et JWT.
   * @throws {AppError} En cas d'erreur de validation, d'email non vérifié ou d'erreur serveur.
   */
  async signIn(credentials) {
    const { error, value } = validate(credentials, signInSchema);
    if (error) throw new AppError(400, 'Identifiants invalides', error.details);

    const { email, firebaseToken, fcmToken } = value;

    try {
      const decodedToken = await this.auth.verifyIdToken(firebaseToken, true);
      const userId = decodedToken.uid;

      if (!decodedToken.email_verified) {
        throw new AppError(403, 'Email non vérifié. Vérifiez votre boîte de réception.');
      }

      const user = await userRepo.getById(userId);

      user.lastLogin = new Date().toISOString();
      user.emailVerified = true;
      if (fcmToken) user.preferences.fcmToken = fcmToken;

      const { error: updateError } = validate(user, userSchema);
      if (updateError) throw new AppError(400, 'Mise à jour du profil invalide', updateError.details);

      await userRepo.update(userId, user);
      const token = this._generateJwt(userId, user.role);

      socketService.emitToUser(userId, 'authStatus', {
        status: 'signedIn',
        userId,
        message: 'Connexion réussie',
      });

      if (user.preferences.fcmToken) {
        try {
          await notificationService.sendPushNotification(userId, {
            title: 'Connexion réussie',
            body: `Bienvenue de retour, ${user.name}.`,
            data: { type: 'login', userId },
          });
        } catch (notificationError) {
          logError('Échec notification connexion', { error: notificationError.message });
        }
      }

      logAudit('Utilisateur connecté', { userId, email });
      return { user, token };
    } catch (error) {
      logError('Erreur connexion', { error: error.message, stack: error.stack });
      throw error instanceof AppError ? error : new AppError(401, 'Erreur serveur connexion', error.message);
    }
  }

  /**
   * Rafraîchit le JWT d'un utilisateur.
   * @param {string} firebaseToken - Token ID Firebase.
   * @returns {Promise<{ userId: string, token: string }>} ID utilisateur et nouveau JWT.
   * @throws {AppError} En cas d'erreur de validation, d'email non vérifié ou d'erreur serveur.
   */
  async refreshToken(firebaseToken) {
    const { error, value } = validate({ firebaseToken }, tokenSchema);
    if (error) throw new AppError(400, 'Token invalide', error.details);

    try {
      const decodedToken = await this.auth.verifyIdToken(value.firebaseToken, true);
      const userId = decodedToken.uid;

      if (!decodedToken.email_verified) {
        throw new AppError(403, 'Email non vérifié.');
      }

      const user = await userRepo.getById(userId);
      const token = this._generateJwt(userId, user.role);

      socketService.emitToUser(userId, 'authStatus', {
        status: 'tokenRefreshed',
        userId,
        message: 'Token rafraîchi',
      });

      logInfo('Token rafraîchi', { userId });
      return { userId, token };
    } catch (error) {
      logError('Erreur rafraîchissement token', { error: error.message, stack: error.stack });
      throw error instanceof AppError ? error : new AppError(401, 'Token Firebase invalide', error.message);
    }
  }

  /**
   * Déconnecte un utilisateur.
   * @param {string} firebaseToken - Token ID Firebase.
   * @returns {Promise<void>}
   * @throws {AppError} En cas d'erreur de validation ou d'erreur serveur.
   */
  async signOut(firebaseToken) {
    const { error, value } = validate({ firebaseToken }, tokenSchema);
    if (error) throw new AppError(400, 'Token invalide', error.details);

    try {
      const decodedToken = await this.auth.verifyIdToken(value.firebaseToken, true);
      const userId = decodedToken.uid;

      const user = await userRepo.getById(userId);

      socketService.emitToUser(userId, 'authStatus', {
        status: 'signedOut',
        userId,
        message: 'Déconnexion réussie',
      });

      if (user.preferences.fcmToken) {
        try {
          await notificationService.sendPushNotification(userId, {
            title: 'Déconnexion',
            body: 'Vous avez été déconnecté avec succès.',
            data: { type: 'logout', userId },
          });
        } catch (notificationError) {
          logError('Échec notification déconnexion', { error: notificationError.message });
        }
      }

      logAudit('Utilisateur déconnecté', { userId });
    } catch (error) {
      logError('Erreur déconnexion', { error: error.message, stack: error.stack });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur déconnexion', error.message);
    }
  }

  /**
   * Vérifie un token ID Firebase.
   * @param {string} firebaseToken - Token ID Firebase.
   * @returns {Promise<{ userId: string }>} ID de l'utilisateur vérifié.
   * @throws {AppError} En cas d'erreur de validation, de token révoqué ou d'erreur serveur.
   */
  async verifyToken(firebaseToken) {
    const { error, value } = validate({ firebaseToken }, tokenSchema);
    if (error) throw new AppError(400, 'Token invalide', error.details);

    try {
      const decodedToken = await this.auth.verifyIdToken(value.firebaseToken, true);
      const userId = decodedToken.uid;

      await userRepo.getById(userId);

      logInfo('Token vérifié', { userId });
      return { userId };
    } catch (error) {
      logError('Erreur vérification token', { error: error.message, stack: error.stack });
      throw error.code === 'auth/id-token-revoked' ? new UnauthorizedError('Token révoqué') : new AppError(401, 'Token invalide', error.message);
    }
  }

  /**
   * Envoie un email de vérification.
   * @param {string} email - Email à vérifier.
   * @param {string} name - Nom de l'utilisateur.
   * @param {string} htmlTemplate - Template HTML pour l'email.
   * @returns {Promise<void>}
   * @throws {AppError} En cas d'erreur de validation ou d'erreur serveur.
   */
  async sendEmailVerification(email, name, htmlTemplate) {
    const { error, value } = validate({ email, name, htmlTemplate }, emailSchema);
    if (error) throw new AppError(400, 'Données invalides pour l\'email de vérification', error.details);

    try {
      const actionCodeSettings = this._getActionCodeSettings();
      const link = await this.auth.generateEmailVerificationLink(value.email, actionCodeSettings);

      const template = require('handlebars').compile(value.htmlTemplate);
      const html = template({ name: value.name, link, company: 'L&L Ouest Services' });

      await emailService.sendEmail({
        to: value.email,
        subject: 'Vérifiez votre email pour L&L Ouest Services',
        html,
      });

      logAudit('Email de vérification envoyé', { email: value.email });
    } catch (error) {
      logError('Erreur envoi vérification email', { error: error.message, stack: error.stack });
      throw new AppError(500, 'Erreur serveur lors de l\'envoi de l\'email de vérification', error.message);
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe.
   * @param {string} email - Email pour réinitialisation.
   * @param {string} name - Nom de l'utilisateur.
   * @param {string} htmlTemplate - Template HTML pour l'email.
   * @returns {Promise<void>}
   * @throws {AppError} En cas d'erreur de validation ou d'erreur serveur.
   */
  async sendPasswordReset(email, name, htmlTemplate) {
    const { error, value } = validate({ email, name, htmlTemplate }, emailSchema);
    if (error) throw new AppError(400, 'Données invalides pour la réinitialisation', error.details);

    try {
      const actionCodeSettings = this._getActionCodeSettings();
      const link = await this.auth.generatePasswordResetLink(value.email, actionCodeSettings);

      const template = require('handlebars').compile(value.htmlTemplate);
      const html = template({ name: value.name, link, company: 'L&L Ouest Services' });

      await emailService.sendEmail({
        to: value.email,
        subject: 'Réinitialisez votre mot de passe pour L&L Ouest Services',
        html,
      });

      logAudit('Email de réinitialisation mot de passe envoyé', { email: value.email });
    } catch (error) {
      logError('Erreur envoi réinitialisation mot de passe', { error: error.message, stack: error.stack });
      throw new AppError(500, 'Erreur serveur lors de l\'envoi de l\'email de réinitialisation', error.message);
    }
  }

  /**
   * Envoie un email pour vérifier et changer l'email.
   * @param {string} currentEmail - Email actuel.
   * @param {string} newEmail - Nouvel email.
   * @param {string} name - Nom de l'utilisateur.
   * @param {string} htmlTemplate - Template HTML pour l'email.
   * @returns {Promise<void>}
   * @throws {AppError} En cas d'erreur de validation ou d'erreur serveur.
   */
  async sendVerifyAndChangeEmail(currentEmail, newEmail, name, htmlTemplate) {
    const { error, value } = validate({ currentEmail, newEmail, name, htmlTemplate }, verifyAndChangeEmailSchema);
    if (error) throw new AppError(400, 'Données invalides pour le changement d\'email', error.details);

    try {
      const actionCodeSettings = this._getActionCodeSettings();
      const link = await this.auth.generateVerifyAndChangeEmailLink(value.currentEmail, value.newEmail, actionCodeSettings);

      const template = require('handlebars').compile(value.htmlTemplate);
      const html = template({ name: value.name, newEmail: value.newEmail, link, company: 'L&L Ouest Services' });

      await emailService.sendEmail({
        to: value.newEmail,
        subject: 'Vérifiez et changez votre email pour L&L Ouest Services',
        html,
      });

      logAudit('Email de vérification et changement envoyé', { currentEmail: value.currentEmail, newEmail: value.newEmail });
    } catch (error) {
      logError('Erreur envoi vérification et changement email', { error: error.message, stack: error.stack });
      throw new AppError(500, 'Erreur serveur lors de l\'envoi de l\'email de vérification et changement', error.message);
    }
  }

  /**
   * Envoie un lien pour connexion sans mot de passe.
   * @param {string} email - Email pour connexion.
   * @param {string} name - Nom de l'utilisateur.
   * @param {string} htmlTemplate - Template HTML pour l'email.
   * @returns {Promise<void>}
   * @throws {AppError} En cas d'erreur de validation ou d'erreur serveur.
   */
  async sendSignInWithEmailLink(email, name, htmlTemplate) {
    const { error, value } = validate({ email, name, htmlTemplate }, emailSchema);
    if (error) throw new AppError(400, 'Données invalides pour la connexion sans mot de passe', error.details);

    try {
      const actionCodeSettings = this._getActionCodeSettings();
      const link = await this.auth.generateSignInWithEmailLink(value.email, actionCodeSettings);

      const template = require('handlebars').compile(value.htmlTemplate);
      const html = template({ name: value.name, link, company: 'L&L Ouest Services' });

      await emailService.sendEmail({
        to: value.email,
        subject: 'Connectez-vous à L&L Ouest Services',
        html,
      });

      logAudit('Email de connexion sans mot de passe envoyé', { email: value.email });
    } catch (error) {
      logError('Erreur envoi connexion sans mot de passe', { error: error.message, stack: error.stack });
      throw new AppError(500, 'Erreur serveur lors de l\'envoi de l\'email de connexion', error.message);
    }
  }
}

module.exports = new AuthService();
