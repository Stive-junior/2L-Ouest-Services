/**
 * @file authService.js
 * @description Service de gestion de l'authentification pour L&L Ouest Services.
 * Utilise Firebase Auth pour vérifier les tokens ID fournis par le client.
 * Synchronise les utilisateurs avec Firestore, génère des JWT pour les API, et envoie des notifications via Socket.IO et FCM.
 * Gère l'envoi de liens pour la vérification d'email, la réinitialisation de mot de passe, et le changement d'email via Firebase Admin.
 * Intègre les templates HTML fournis par le frontend.
 * Utilise les services initialisés par firebase.js pour éviter les réinitialisations multiples.
 * @module services/authService
 * @version 1.4.0
 * @author L&L Ouest Services Team
 * @lastUpdated 2025-09-26
 * @license MIT
 * @dependencies firebase-admin, firestore, socket.io, notificationService, emailService, sanitize-html
 * @changelog
 * - v1.4.0: Ajout de la gestion séquentielle du changement d'email et de la mise à jour du mot de passe.
 * - v1.3.0: Ajout de la limitation de taux, sanitisation des entrées, et sécurité JWT renforcée.
 * - v1.2.0: Nettoyage complet de Firebase Auth et Firestore en cas d'échec dans signUp.
 * - v1.1.0: Suppression de getUserByEmail, validation via verifyIdToken et getUser.
 * - v1.0.0: Version initiale avec inscription, validation, et synchronisation Firestore.
 */

const { auth, db, messaging, admin } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const { userRepo } = require('../repositories');
const socketService = require('./socketService');
const notificationService = require('./notificationService');
const emailService = require('./emailService');
const { logInfo, logError, logAudit, logWarn } = require('./loggerService');
const { AppError } = require('../utils/errorUtils');
const { validate, userSchema } = require('../utils/validationUtils');
const { signUpSchema, signInSchema, tokenSchema, emailSchema, verifyAndChangeEmailSchema, codeSchema, passwordSchema, newEmailSchema } = require('../utils/validation/authValidation');
const config = require('../config/config');
const { default: emailTemplates } = require('./emailTemplates');
const { randomInt } = require('crypto');
const sanitizeHtml = require('sanitize-html');

/**
 * @template T
 * @function withRetries
 * @description Exécute une fonction asynchrone avec des tentatives en cas d'échec.
 * @param {() => Promise<T>} fn - Fonction asynchrone à exécuter.
 * @param {number} [maxRetries=3] - Nombre maximum de tentatives.
 * @param {number} [delayMs=1000] - Délai en millisecondes entre les tentatives.
 * @returns {Promise<T>} Le résultat de la fonction `fn`.
 * @throws {Error} La dernière erreur si toutes les tentatives échouent.
 */
const withRetries = async (fn, maxRetries = 3, delayMs = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        logWarn(`Tentative ${i + 1}/${maxRetries} échouée. Nouvelle tentative dans ${delayMs}ms.`, { error: error.message });
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  logError(`Échec après ${maxRetries} tentatives.`, { error: lastError.message });
  throw lastError;
};

/**
 * @class AuthService
 * @description Gère les opérations d'authentification avec Firebase Auth, synchronisation Firestore, génération JWT, et envoi de liens d'action email.
 * Cette classe assure une synchronisation fiable entre Firebase Authentication et la base de données locale (Firestore).
 * Elle prévient les créations multiples d'utilisateurs pour le même email en vérifiant l'unicité globale.
 * Intègre la gestion du FCM Token fourni par le client, en s'appuyant sur le service messaging initialisé dans firebase.js.
 * Récupère dynamiquement les configurations FCM (VAPID Key et Sender ID) depuis config.firebase.
 */
class AuthService {
  constructor() {
    this.auth = auth;
    this.db = db;
    this.messaging = messaging;
    this.fcmVapidKey = config.firebase.vapidKey;
    this.fcmSenderId = config.firebase.senderId;

    if (!this.messaging) {
      logWarn('Service Firebase Messaging non disponible - Notifications push désactivées', {
        vapidKeyPresent: !!this.fcmVapidKey,
        senderIdPresent: !!this.fcmSenderId,
      });
    } else {
      logInfo('Service Firebase Messaging disponible pour notifications push', {
        senderId: this.fcmSenderId,
        vapidKeyLength: this.fcmVapidKey ? this.fcmVapidKey.length : 0,
      });
    }
  }

  /**
   * Définit les Custom Claims pour un utilisateur dans Firebase Auth.
   * @param {string} userId - ID de l'utilisateur.
   * @param {Object} claims - Claims à définir (par exemple, { role: 'client' }).
   * @returns {Promise<void>}
   * @private
   */
  async _setCustomClaims(userId, claims) {
    try {
      await this.auth.setCustomUserClaims(userId, claims);
      logInfo('Custom Claims définis avec succès', { userId, claims });
    } catch (error) {
      logError('Erreur lors de la définition des Custom Claims', { userId, error: error.message });
      throw new AppError(500, 'Erreur lors de la définition des Custom Claims', error.message);
    }
  }

  /**
   * Génère un JWT signé pour les appels API avec algorithme sécurisé.
   * @param {string} userId - ID de l'utilisateur.
   * @param {string} role - Rôle de l'utilisateur (client ou admin).
   * @returns {string} JWT signé.
   * @private
   */
  _generateJwt(userId, role) {
    return jwt.sign({ userId, role }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      algorithm: 'HS512',
      header: { kid: 'custom-jwt-key' },
    });
  }

  /**
   * Définit les paramètres ActionCodeSettings pour les liens d'action email.
   * @returns {Object} Configuration pour les liens d'action Firebase.
   * @private
   */
  _getActionCodeSettings() {
    return {
      url: `${config.frontendUrl[0]}/auth/verify`,
      handleCodeInApp: true,
      dynamicLinkDomain: 'll-ouest-services.firebaseapp.com',
    };
  }

  /**
   * Vérifie un JWT généré par le backend (utilisé dans middleware pour routes protégées).
   * @param {string} token - JWT à vérifier.
   * @returns {Object} Payload décodé du JWT.
   * @throws {AppError} Si le token est invalide ou expiré.
   */
  async verifyJwt(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS512'] });
      logInfo('JWT personnalisé vérifié avec succès', { userId: decoded.userId });
      return decoded;
    } catch (error) {
      logError('Erreur lors de la vérification du JWT personnalisé', { error: error.message });
      throw new AppError(401, 'JWT invalide ou expiré', error.message);
    }
  }

  /**
   * Nettoie les données de l'utilisateur dans Firebase Auth et Firestore en cas d'échec.
   * @param {string} userId - ID de l'utilisateur à supprimer.
   * @param {string} email - Email de l'utilisateur pour journalisation.
   * @returns {Promise<void>}
   * @private
   */
  async _cleanupUser(userId, email) {
    try {
      await withRetries(() => this.auth.deleteUser(userId), 3, 2000);
      logInfo('Cleanup : Utilisateur Firebase supprimé', { userId, email });
    } catch (deleteError) {
      logError('Échec du nettoyage de l\'utilisateur Firebase', { userId, email, error: deleteError.message });
    }
    try {
      await userRepo.delete(userId);
      logInfo('Cleanup : Profil Firestore supprimé', { userId, email });
    } catch (deleteError) {
      logError('Échec du nettoyage du profil Firestore', { userId, email, error: deleteError.message });
    }
  }

  /**
   * Sanitize les données utilisateur pour prévenir les attaques XSS.
   * @param {Object} userData - Données utilisateur.
   * @returns {Object} Données sanitizées.
   * @private
   */
  _sanitizeUserData(userData) {
    const sanitized = { ...userData };
    if (sanitized.email) sanitized.email = sanitizeHtml(sanitized.email);
    if (sanitized.newEmail) sanitized.newEmail = sanitizeHtml(sanitized.newEmail);
    if (sanitized.name) sanitized.name = sanitizeHtml(sanitized.name);
    if (sanitized.phone) sanitized.phone = sanitizeHtml(sanitized.phone);
    if (sanitized.newPassword) sanitized.newPassword = sanitizeHtml(sanitized.newPassword);
    if (sanitized.address && typeof sanitized.address === 'object') {
      sanitized.address = {
        ...sanitized.address,
        street: sanitized.address.street ? sanitizeHtml(sanitized.address.street) : undefined,
        city: sanitized.address.city ? sanitizeHtml(sanitized.address.city) : undefined,
        postalCode: sanitized.address.postalCode ? sanitizeHtml(sanitized.address.postalCode) : undefined,
        country: sanitized.address.country ? sanitizeHtml(sanitized.address.country) : undefined,
      };
    }
    return sanitized;
  }

  /**
   * Inscrit un nouvel utilisateur et synchronise avec Firestore de manière atomique.
   * @param {Object} userData - Données de l'utilisateur validées.
   * @returns {Promise<{ user: Object, token: string }>} Utilisateur créé et JWT.
   */
  async signUp(userData) {
    const { error, value } = validate(this._sanitizeUserData(userData), signUpSchema);
    if (error) throw new AppError(400, 'Données d\'inscription invalides', error.details);

    const { email, name, phone, address, firebaseToken, fcmToken: providedFcmToken, role } = value;

    let validatedFcmToken = null;
    if (providedFcmToken) {
      if (typeof providedFcmToken !== 'string' || providedFcmToken.length < 100) {
        logWarn('FCM Token fourni invalide - Ignoré pour cet utilisateur', { fcmTokenLength: providedFcmToken.length, email });
      } else {
        validatedFcmToken = providedFcmToken;
        logInfo('FCM Token validé et accepté pour inscription', { email, fcmTokenLength: validatedFcmToken.length });
      }
    }

    let decodedToken = null;
    let userId = null;
    let user = null;

    try {
      decodedToken = await withRetries(() => this.auth.verifyIdToken(firebaseToken, true), 3, 2000);
      logInfo('Token Firebase vérifié avec succès', { userId: decodedToken.uid, email: decodedToken.email });

      userId = decodedToken.uid;
      const firebaseUser = await this.auth.getUser(userId).catch(() => null);
      if (!firebaseUser) {
        logWarn('Utilisateur non trouvé dans Firebase Auth pour le token fourni', { email, userId });
        throw new AppError(400, 'Utilisateur non trouvé dans Firebase Auth');
      }

      const [existingUserById, existingUserByEmail] = await Promise.all([
        userRepo.getById(userId),
        userRepo.getByEmail(email),
      ]);
      if (existingUserById || existingUserByEmail) {
        logWarn('Doublon détecté dans Firestore', { userId, email });
        throw new AppError(409, 'Utilisateur déjà inscrit avec cet ID ou email');
      }

      const userProfile = {
        id: userId,
        email,
        name,
        phone,
        address: address || null,
        role: role || 'client',
        company: null,
        invoices: [],
        preferences: {
          notifications: true,
          language: 'fr',
          fcmToken: validatedFcmToken,
        },
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        location: null,
        emailVerified: decodedToken.email_verified || false,
      };

      const { error: profileError } = validate(userProfile, userSchema);
      if (profileError) {
        logWarn('Profil utilisateur invalide', { error: profileError.details });
        throw new AppError(400, 'Profil utilisateur invalide', profileError.details);
      }

      await this.db.runTransaction(async (transaction) => {
        const docRef = this.db.collection('users').doc(userId);
        transaction.set(docRef, userRepo.toFirestore(userProfile));
      });
      user = await userRepo.getById(userId);
      logInfo('Profil utilisateur créé dans Firestore', { userId, email });

      await this._setCustomClaims(userId, { role: userProfile.role });
      const token = this._generateJwt(userId, userProfile.role);

      socketService.emitToUser(userId, 'authStatus', {
        status: 'signedUp',
        userId,
        message: 'Inscription réussie',
      });

      await this.sendEmailVerification({ email, name, retry: false });

      if (validatedFcmToken && this.messaging) {
        try {
          await notificationService.sendPushNotification(userId, {
            title: 'Bienvenue chez L&L Ouest Services',
            body: `Votre compte a été créé avec succès, ${name}. Vérifiez votre email pour confirmer.`,
            data: { type: 'welcome', userId },
          });
          logInfo('Notification push bienvenue envoyée', { userId, email });
        } catch (notificationError) {
          logError('Échec notification bienvenue', { error: notificationError.message });
          throw new AppError(500, 'Échec de l\'envoi de la notification push', notificationError.message);
        }
      }

      logAudit('Utilisateur inscrit avec succès', { userId, email });
      return { user, token };
    } catch (error) {
      logError('Erreur inscription', { error: error.message, stack: error.stack });
      if (userId) await this._cleanupUser(userId, email);
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'inscription', error.message);
    }
  }

  /**
   * Connecte un utilisateur existant.
   * @param {Object} credentials - Identifiants de connexion.
   * @returns {Promise<{ user: Object, token: string }>} Utilisateur et JWT.
   */
  async signIn(credentials) {
    const { error, value } = validate(this._sanitizeUserData(credentials), signInSchema);
    if (error) throw new AppError(400, 'Identifiants invalides', error.details);

    const { email, firebaseToken, fcmToken } = value;

    try {
      const decodedToken = await this.auth.verifyIdToken(firebaseToken, true);
      const userId = decodedToken.uid;

      const user = await userRepo.getById(userId);
      if (!user) throw new AppError(404, 'Utilisateur non trouvé dans Firestore');

      const currentClaims = (await this.auth.getUser(userId)).customClaims || {};
      if (!currentClaims.role || currentClaims.role !== user.role) {
        await this._setCustomClaims(userId, { role: user.role });
      }

      user.lastLogin = new Date().toISOString();
      user.emailVerified = decodedToken.email_verified || false;
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
   */
  async refreshToken(firebaseToken) {
    const { error, value } = validate({ firebaseToken }, tokenSchema);
    if (error) throw new AppError(400, 'Token invalide', error.details);

    try {
      const decodedToken = await this.auth.verifyIdToken(value.firebaseToken, true);
      const userId = decodedToken.uid;

      const user = await userRepo.getById(userId);
      if (!user) throw new AppError(404, 'Utilisateur non trouvé');

      const currentClaims = (await this.auth.getUser(userId)).customClaims || {};
      if (!currentClaims.role || currentClaims.role !== user.role) {
        await this._setCustomClaims(userId, { role: user.role });
      }

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
   * @returns {Promise<string>} ID de l'utilisateur déconnecté.
   */
  async signOut(firebaseToken) {
    const { error, value } = validate({ firebaseToken }, tokenSchema);
    if (error) throw new AppError(400, 'Token invalide', error.details);

    try {
      const decodedToken = await this.auth.verifyIdToken(value.firebaseToken, true);
      const userId = decodedToken.uid;

      const user = await userRepo.getById(userId);
      if (!user) logWarn('Utilisateur non trouvé pour déconnexion', { userId });

      socketService.emitToUser(userId, 'authStatus', {
        status: 'signedOut',
        userId,
        message: 'Déconnexion réussie',
      });

      logAudit('Utilisateur déconnecté', { userId });
      return userId;
    } catch (error) {
      logError('Erreur déconnexion', { error: error.message, stack: error.stack });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur déconnexion', error.message);
    }
  }

  /**
   * Vérifie un token Firebase ID et synchronise l'utilisateur avec la BDD locale si nécessaire.
   * @param {string} firebaseToken - Le token Firebase ID à vérifier.
   * @returns {Promise<{ user: Object, token: string }>} L'utilisateur synchronisé et un JWT frais.
   */
  async verifyToken(firebaseToken) {
    try {
      const decodedToken = await this.auth.verifyIdToken(firebaseToken, true);
      const userId = decodedToken.uid;
      const email = sanitizeHtml(decodedToken.email);
      logInfo('Token vérifié avec succès', { userId, email });

      let user = await userRepo.getById(userId);

      if (!user) {
        logWarn('Utilisateur trouvé dans Firebase mais absent en BDD - Synchronisation en cours', { userId, email });

        const existingByEmail = await userRepo.getByEmail(email);
        if (existingByEmail) {
          throw new AppError(409, 'Email déjà associé à un autre utilisateur - Conflit de synchronisation');
        }

        const minimalProfile = {
          id: userId,
          email,
          name: sanitizeHtml(decodedToken.name || 'Utilisateur Anonyme'),
          phone: sanitizeHtml(decodedToken.phone_number || ''),
          address: null,
          role: 'client',
          company: null,
          invoices: [],
          preferences: {
            notifications: true,
            language: 'fr',
            fcmToken: null,
          },
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          location: null,
          emailVerified: decodedToken.email_verified || false,
        };

        const { error: profileError } = validate(minimalProfile, userSchema);
        if (profileError) {
          throw new AppError(400, 'Profil minimal invalide lors de la synchronisation', profileError.details);
        }

        await this.db.runTransaction(async (transaction) => {
          const docRef = this.db.collection('users').doc(userId);
          transaction.set(docRef, userRepo.toFirestore(minimalProfile));
        });

        user = await userRepo.getById(userId);
        logInfo('Utilisateur synchronisé avec succès en BDD', { userId });
      }

      const currentClaims = (await this.auth.getUser(userId)).customClaims || {};
      if (!currentClaims.role) {
        await this._setCustomClaims(userId, { role: user.role });
      }

      const token = this._generateJwt(userId, user.role);
      return { user, token };
    } catch (error) {
      logError('Erreur lors de la vérification du Firebase ID token', { error: error.message, stack: error.stack });
      throw error instanceof AppError ? error : new AppError(401, 'Token Firebase invalide', error.message);
    }
  }

  /**
   * Envoie un email de vérification avec un code à 6 chiffres.
   * @param {Object} reqData - Données de la requête.
   * @returns {Promise<void>}
   */
  async sendEmailVerification(reqData) {
    const { error, value } = validate(reqData, emailSchema);
    if (error) throw new AppError(400, 'Données invalides pour l\'email de vérification', error.details);

    const { email, name, retry, htmlTemplate, logoBase64 } = value;

    try {
      const code = randomInt(100000, 999999).toString();
      await db.collection('verificationCodes').doc(email).set({
        code,
        expires: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        retry,
      });

      const templateData = {
        name: sanitizeHtml(name),
        code,
        logoBase64,
      };

      const templateSource = htmlTemplate || emailTemplates.verification(templateData);
      const compiledTemplate = require('handlebars').compile(templateSource);
      const html = sanitizeHtml(compiledTemplate(templateData), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt'] },
      });

      await emailService.sendEmail({
        to: email,
        subject: 'Vérifiez votre email pour L&L Ouest Services',
        html,
      });

      logAudit('Email de vérification envoyé', { email, retry });
    } catch (error) {
      logError('Erreur lors de l\'envoi de la vérification d\'email', { error: error.message, stack: error.stack });
      const status = error.message.includes('TOO_MANY_ATTEMPTS') ? 429 : 500;
      const message = error.message.includes('TOO_MANY_ATTEMPTS')
        ? 'Trop de tentatives d\'envoi d\'email, veuillez réessayer plus tard.'
        : 'Erreur serveur lors de l\'envoi de l\'email de vérification.';
      throw new AppError(status, message, error.message);
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe avec code à 6 chiffres.
   * @param {Object} reqData - Données de la requête.
   * @returns {Promise<void>}
   */
  async sendPasswordReset(reqData) {
    const { error, value } = validate(reqData, emailSchema);
    if (error) throw new AppError(400, 'Données invalides pour la réinitialisation', error.details);

    const { email, name, retry, htmlTemplate, logoBase64 } = value;

    try {
      const code = randomInt(100000, 999999).toString();
      await db.collection('passwordResetCodes').doc(email).set({
        code,
        expires: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        retry,
      });

      const templateData = {
        name: sanitizeHtml(name),
        code,
        logoBase64,
      };

      const templateSource = htmlTemplate || emailTemplates.passwordReset(templateData);
      const compiledTemplate = require('handlebars').compile(templateSource);
      const html = sanitizeHtml(compiledTemplate(templateData), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt'] },
      });

      await emailService.sendEmail({
        to: email,
        subject: 'Réinitialisez votre mot de passe pour L&L Ouest Services',
        html,
      });

      logAudit('Email de réinitialisation mot de passe envoyé', { email, retry });
    } catch (error) {
      logError('Erreur envoi réinitialisation mot de passe', { error: error.message, stack: error.stack });
      const status = error.message.includes('TOO_MANY_ATTEMPTS') ? 429 : 500;
      const message = error.message.includes('TOO_MANY_ATTEMPTS')
        ? 'Trop de tentatives d\'envoi d\'email, veuillez réessayer plus tard.'
        : 'Erreur serveur lors de l\'envoi de l\'email de réinitialisation.';
      throw new AppError(status, message, error.message);
    }
  }

  /**
   * Envoie un email pour vérifier l'email actuel avant changement.
   * @param {Object} reqData - Données de la requête.
   * @returns {Promise<void>}
   */
  async requestNewEmail(reqData) {
    const { error, value } = validate(reqData, emailSchema);
    if (error) throw new AppError(400, 'Données invalides pour la vérification d\'email actuel', error.details);

    const { email, name, retry, htmlTemplate, logoBase64 } = value;

    try {
      const code = randomInt(100000, 999999).toString();
      await db.collection('changeEmailCodes').doc(email).set({
        code,
        expires: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        retry,
        currentEmail: email,
      });

      const templateData = {
        name: sanitizeHtml(name),
        code,
        logoBase64,
      };

      const templateSource = htmlTemplate || emailTemplates.changeEmailVerification(templateData);
      const compiledTemplate = require('handlebars').compile(templateSource);
      const html = sanitizeHtml(compiledTemplate(templateData), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt'] },
      });

      await emailService.sendEmail({
        to: email,
        subject: 'Vérifiez votre email actuel pour L&L Ouest Services',
        html,
      });

      logAudit('Email de vérification d\'email actuel envoyé', { email, retry });
    } catch (error) {
      logError('Erreur envoi vérification email actuel', { error: error.message, stack: error.stack });
      const status = error.message.includes('TOO_MANY_ATTEMPTS') ? 429 : 500;
      const message = error.message.includes('TOO_MANY_ATTEMPTS')
        ? 'Trop de tentatives d\'envoi d\'email, veuillez réessayer plus tard.'
        : 'Erreur serveur lors de l\'envoi de l\'email de vérification.';
      throw new AppError(status, message, error.message);
    }
  }

  /**
   * Envoie un email pour confirmer le nouvel email.
   * @param {Object} reqData - Données de la requête.
   * @returns {Promise<void>}
   */
  async confirmNewEmail(reqData) {
    const { error, value } = validate(reqData, newEmailSchema);
    if (error) throw new AppError(400, 'Données invalides pour la confirmation du nouvel email', error.details);

    const { newEmail, name, retry, htmlTemplate, logoBase64 } = value;

    try {
      const code = randomInt(100000, 999999).toString();
      await db.collection('changeEmailCodes').doc(newEmail).set({
        code,
        expires: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        retry,
        newEmail,
      });

      const templateData = {
        name: sanitizeHtml(name),
        code,
        logoBase64,
      };

      const templateSource = htmlTemplate || emailTemplates.changeEmail(templateData);
      const compiledTemplate = require('handlebars').compile(templateSource);
      const html = sanitizeHtml(compiledTemplate(templateData), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt'] },
      });

      await emailService.sendEmail({
        to: newEmail,
        subject: 'Confirmez votre nouvel email pour L&L Ouest Services',
        html,
      });

      logAudit('Email de confirmation de nouvel email envoyé', { newEmail, retry });
    } catch (error) {
      logError('Erreur envoi confirmation nouvel email', { error: error.message, stack: error.stack });
      const status = error.message.includes('TOO_MANY_ATTEMPTS') ? 429 : 500;
      const message = error.message.includes('TOO_MANY_ATTEMPTS')
        ? 'Trop de tentatives d\'envoi d\'email, veuillez réessayer plus tard.'
        : 'Erreur serveur lors de l\'envoi de l\'email de confirmation.';
      throw new AppError(status, message, error.message);
    }
  }

  /**
   * Met à jour le mot de passe d'un utilisateur.
   * @param {Object} data - Données de la requête.
   * @returns {Promise<void>}
   */
  async updatePassword(data) {
    const { error, value } = validate(this._sanitizeUserData(data), passwordSchema);
    if (error) throw new AppError(400, 'Données invalides pour la mise à jour du mot de passe', error.details);

    const { email, newPassword } = value;

    try {

      const userRecord = await this.auth.getUserByEmail(email);
      const userId = userRecord.uid;

      const user = await userRepo.getById(userId);
      if (!user) throw new AppError(404, 'Utilisateur non trouvé');
      if (user.email !== email) throw new AppError(400, 'Email non correspondant');

      await this.auth.updateUser(userId, { password: newPassword });

      socketService.emitToUser(userId, 'authStatus', {
        status: 'passwordUpdated',
        userId,
        message: 'Mot de passe mis à jour avec succès',
      });

      logAudit('Mot de passe mis à jour', { userId, email });
    } catch (error) {
      logError('Erreur mise à jour mot de passe', { error: error.message, stack: error.stack });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour du mot de passe', error.message);
    }
  }

  /**
   * Envoie un lien pour connexion sans mot de passe.
   * @param {string} email - Email pour connexion.
   * @param {string} name - Nom de l'utilisateur.
   * @param {string} [htmlTemplate] - Template HTML pour l'email.
   * @returns {Promise<void>}
   */
  async sendSignInWithEmailLink(email, name, htmlTemplate) {
    const { error, value } = validate({ email: sanitizeHtml(email), name: sanitizeHtml(name), htmlTemplate }, emailSchema);
    if (error) throw new AppError(400, 'Données invalides pour la connexion sans mot de passe', error.details);

    try {
      const actionCodeSettings = this._getActionCodeSettings();
      const link = await this.auth.generateSignInWithEmailLink(value.email, actionCodeSettings);

      const template = require('handlebars').compile(value.htmlTemplate || emailTemplates.signIn({ name: value.name, link: '{{link}}' }));
      const html = sanitizeHtml(template({ name: value.name, link, company: 'L&L Ouest Services' }), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'a']),
        allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, a: ['href'], img: ['src', 'alt'] },
      });

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


  /**
 * Vérifie un code de vérification d'email stocké dans Firestore.
 * @param {Object} data - Données du code.
 * @returns {Promise<{ success: boolean, redirect: string, message?: string }>}
 */
async verifyEmailCode(data) {
  const { error, value } = validate(data, codeSchema);
  if (error) throw new AppError(400, 'Données de code invalides', error.details);

  const { email, code } = value;

  const doc = await db.collection('verificationCodes').doc(email).get();
  if (!doc.exists) {
    throw new AppError(400, 'Code de vérification invalide');
  }

  const docData = doc.data();
  if (docData.expires.toDate() < new Date()) {
    const newCode = randomInt(100000, 999999).toString();
    await db.collection('verificationCodes').doc(email).set({
      code: newCode,
      expires: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      retry: true,
    });

    const templateData = {
      name: sanitizeHtml(docData.name || 'Utilisateur'),
      code: newCode,
      logoBase64: docData.logoBase64 || '',
    };

    const templateSource = docData.htmlTemplate || emailTemplates.verification(templateData);
    const compiledTemplate = require('handlebars').compile(templateSource);
    const html = sanitizeHtml(compiledTemplate(templateData), {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt'] },
    });

    await emailService.sendEmail({
      to: email,
      subject: 'Vérifiez votre email pour L&L Ouest Services',
      html,
    });

    logAudit('Nouveau code de vérification envoyé (expiré)', { email });
    return {
      success: false,
      message: 'Code de vérification expiré. Un nouveau code a été envoyé.',
      redirect: '/pages/auth/code-check.html',
    };
  }

  if (docData.code !== code) {
    throw new AppError(400, 'Code de vérification invalide');
  }

  const user = await userRepo.getByEmail(email);
  if (user) {
    user.emailVerified = true;
    await userRepo.update(user.id, user);
    await this.auth.updateUser(user.id, { emailVerified: true });
  }

  await db.collection('verificationCodes').doc(email).delete();

  logAudit('Code email vérifié', { email });
  return { success: true, redirect: '/dashboard.html' };
}

/**
 * Vérifie un code de réinitialisation de mot de passe stocké dans Firestore.
 * @param {Object} data - Données du code.
 * @returns {Promise<{ success: boolean, redirect: string, message?: string }>}
 */
async verifyPasswordResetCode(data) {
  const { error, value } = validate(data, codeSchema);
  if (error) throw new AppError(400, 'Données de code invalides', error.details);

  const { email, code } = value;

  const doc = await db.collection('passwordResetCodes').doc(email).get();
  if (!doc.exists) {
    throw new AppError(400, 'Code de réinitialisation invalide');
  }

  const docData = doc.data();
  if (docData.expires.toDate() < new Date()) {
    const newCode = randomInt(100000, 999999).toString();
    await db.collection('passwordResetCodes').doc(email).set({
      code: newCode,
      expires: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      retry: true,
    });

    const templateData = {
      name: sanitizeHtml(docData.name || 'Utilisateur'),
      code: newCode,
      logoBase64: docData.logoBase64 || '',
    };

    const templateSource = docData.htmlTemplate || emailTemplates.passwordReset(templateData);
    const compiledTemplate = require('handlebars').compile(templateSource);
    const html = sanitizeHtml(compiledTemplate(templateData), {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt'] },
    });

    await emailService.sendEmail({
      to: email,
      subject: 'Réinitialisez votre mot de passe pour L&L Ouest Services',
      html,
    });

    logAudit('Nouveau code de réinitialisation envoyé (expiré)', { email });
    return {
      success: false,
      message: 'Code de réinitialisation expiré. Un nouveau code a été envoyé.',
      redirect: '/pages/auth/code-check.html',
    };
  }

  if (docData.code !== code) {
    throw new AppError(400, 'Code de réinitialisation invalide');
  }

  await db.collection('passwordResetCodes').doc(email).delete();

  logAudit('Code reset vérifié', { email });
  return { success: true, redirect: '/pages/auth/reset-password.html' };
}

/**
 * Vérifie un code de changement d'email stocké dans Firestore.
 * @param {Object} data - Données du code.
 * @returns {Promise<{ success: boolean, redirect: string, message?: string }>}
 */
async verifyChangeEmailCode(data) {
  const { error, value } = validate(data, codeSchema);
  if (error) throw new AppError(400, 'Données de code invalides', error.details);

  const { email, code } = value;

  const doc = await db.collection('changeEmailCodes').doc(email).get();
  if (!doc.exists) {
    throw new AppError(400, 'Code de changement d\'email invalide');
  }

  const docData = doc.data();
  if (docData.expires.toDate() < new Date()) {
    const newCode = randomInt(100000, 999999).toString();
    await db.collection('changeEmailCodes').doc(email).set({
      code: newCode,
      expires: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      retry: true,
      currentEmail: docData.currentEmail,
      newEmail: docData.newEmail || undefined,
    });

    const templateData = {
      name: sanitizeHtml(docData.name || 'Utilisateur'),
      code: newCode,
      logoBase64: docData.logoBase64 || '',
    };

    const templateSource = docData.htmlTemplate || (docData.newEmail ? emailTemplates.changeEmail(templateData) : emailTemplates.changeEmailVerification(templateData));
    const compiledTemplate = require('handlebars').compile(templateSource);
    const html = sanitizeHtml(compiledTemplate(templateData), {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt'] },
    });

    await emailService.sendEmail({
      to: email,
      subject: docData.newEmail ? 'Confirmez votre nouvel email pour L&L Ouest Services' : 'Vérifiez votre email actuel pour L&L Ouest Services',
      html,
    });

    logAudit('Nouveau code de changement d\'email envoyé (expiré)', { email });
    return {
      success: false,
      message: 'Code de changement d\'email expiré. Un nouveau code a été envoyé.',
      redirect: '/pages/auth/code-check.html',
    };
  }

  if (docData.code !== code) {
    throw new AppError(400, 'Code de changement d\'email invalide');
  }

  if (docData.currentEmail && !docData.newEmail) {
    await db.collection('changeEmailCodes').doc(email).delete();
    logAudit('Code email actuel vérifié', { email });
    return { success: true, redirect: '/pages/auth/change-email.html' };
  } else if (docData.newEmail) {
    const user = await userRepo.getByEmail(docData.currentEmail);
    if (user) {
      user.email = email;
      await userRepo.update(user.id, user);
      await this.auth.updateUser(user.id, { email });

      await emailService.sendEmail({
        to: docData.currentEmail,
        subject: 'Votre email a été mis à jour',
        html: sanitizeHtml(emailTemplates.emailChanged({ name: user.name, newEmail: email }), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
          allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt'] },
        }),
      });

      logAudit('Email mis à jour et notification envoyée', { oldEmail: docData.currentEmail, newEmail: email });
    }

    await db.collection('changeEmailCodes').doc(email).delete();
    return { success: true, redirect: '/dashboard.html' };
  }

  throw new AppError(400, 'Données de changement d\'email invalides');
}

}

module.exports = new AuthService();
