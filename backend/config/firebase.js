/**
 * @file firebase.js
 * @description Classe d'initialisation de Firebase Admin SDK pour L&L Ouest Services.
 * Initialise l'application Firebase et expose les instances des services (Firestore, Auth, Messaging).
 * Inclut une logique de retentative et de vérification pour une connexion robuste.
 * @module firebase
 */

const admin = require('firebase-admin');
const config = require('./config');
const { logger, logInfo, logWarn, logError } = require('../services/loggerService');
const { AppError } = require('../utils/errorUtils');

/**
 * @class Firebase
 * @description Classe pour gérer l'initialisation et les services Firebase (Firestore, Auth, Messaging).
 */
class Firebase {
  constructor() {
    /** @type {admin.firestore.Firestore | null} */
    this.db = null;
    /** @type {admin.auth.Auth | null} */
    this.auth = null;
    /** @type {admin.messaging.Messaging | null} */
    this.messaging = null;
    /** @type {typeof admin} */
    this.admin = admin;

    this.initializeFirebase();
  }

  /**
   * @function initializeFirebase
   * @description Initialise l'application Firebase Admin SDK avec des credentials directs.
   * Valide les credentials et configure les services Firestore, Auth, et Messaging.
   * @throws {AppError} En cas d'échec de l'initialisation ou de validation des credentials.
   * @returns {void}
   */
  initializeFirebase() {
    try {
      logInfo('Firebase: Validation des credentials directs...');
      const requiredFields = ['projectId', 'clientEmail', 'privateKey'];
      const missingFields = requiredFields.filter(field => !config.firebase[field]);
      if (missingFields.length > 0) {
        throw new AppError(
          500,
          `Configuration Firebase incomplète : champs manquants -> ${missingFields.join(', ')}`,
          'Missing Firebase configuration fields'
        );
      }

      const serviceAccount = {
        project_id: config.firebase.projectId,
        client_email: config.firebase.clientEmail,
        private_key: config.firebase.privateKey,
      };

      if (!this.admin.apps.length) {
        this.admin.initializeApp({
          credential: this.admin.credential.cert(serviceAccount),
          databaseURL: config.firebase.databaseURL,
        });
        logInfo('Firebase Admin SDK initialisé', {
          projectId: config.firebase.projectId,
          environment: config.nodeEnv,
        });
      }

      if (!this.db) this.db = this.admin.firestore();
      if (!this.auth) this.auth = this.admin.auth();
      if (!this.messaging) this.messaging = this.admin.messaging();

      this.db.settings({
        ignoreUndefinedProperties: true,
        cacheSizeBytes: this.admin.firestore.CACHE_SIZE_UNLIMITED,
      });

      this.retryConnect(3, 5000);
    } catch (error) {
      logError('Échec de l\'initialisation de Firebase', {
        error: error.message,
        stack: error.stack,
      });
      throw new AppError(500, 'Échec de l\'initialisation de Firebase', error.message);
    }
  }

  /**
   * @function retryConnect
   * @description Tente de se connecter à Firestore avec des retries en cas d'échec.
   * @param {number} maxRetries - Nombre maximum de tentatives.
   * @param {number} delayMs - Délai entre les tentatives (ms).
   * @returns {Promise<boolean>} True si la connexion est établie.
   * @throws {AppError} Si toutes les tentatives échouent.
   */
  async retryConnect(maxRetries, delayMs) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.verifyConnection();
        logInfo(`Connexion Firebase établie à la tentative ${attempt}`);
        return true;
      } catch (error) {
        lastError = error;
        logWarn(`Tentative de connexion Firestore échouée (${attempt}/${maxRetries})`, {
          error: error.message,
        });
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    logError('Échec de toutes les tentatives de connexion à Firestore', { error: lastError?.message });
    throw new AppError(500, 'Échec de connexion à Firestore après retries', lastError?.message || 'Unknown error');
  }

  /**
   * @function verifyConnection
   * @description Vérifie la connexion à Firestore via une opération de test.
   * @returns {Promise<void>}
   * @throws {AppError} Si la vérification échoue.
   */
  async verifyConnection() {
    try {
      const testDoc = this.db.collection('status').doc('connection_test');
      await testDoc.set({
        lastChecked: this.admin.firestore.FieldValue.serverTimestamp(),
        status: 'connected',
        environment: config.nodeEnv,
      }, { merge: true });
      logInfo('Connexion Firestore vérifiée');
    } catch (error) {
      logError('Échec de la vérification de la connexion Firestore', {
        error: error.message,
        stack: error.stack,
      });
      throw new AppError(500, 'Impossible de vérifier la connexion à Firestore', error.message);
    }
  }

  /**
   * @function listCollections
   * @description Liste les collections disponibles dans Firestore.
   * @returns {Promise<string[]>} Tableau des noms de collections.
   * @throws {AppError} En cas d'erreur lors de la récupération.
   */
  async listCollections() {
    try {
      const collections = await this.db.listCollections();
      const collectionIds = collections.map(col => col.id);
      logInfo('Collections Firestore récupérées', { collections: collectionIds });
      return collectionIds;
    } catch (error) {
      logError('Erreur lors de la récupération des collections Firestore', {
        error: error.message,
      });
      throw new AppError(500, 'Erreur lors de la récupération des collections', error.message);
    }
  }

  /**
   * @function shutdown
   * @description Arrête proprement l'application Firebase.
   * @returns {Promise<void>}
   */
  async shutdown() {
    try {
      if (this.admin.apps.length) {
        await this.admin.app().delete();
        logInfo('Application Firebase arrêtée proprement');
      }
    } catch (error) {
      logError('Erreur lors de l\'arrêt de Firebase', {
        error: error.message,
      });
    }
  }
}

const firebase = new Firebase();

// Exportation des méthodes et services avec bind
module.exports = {
  initializeFirebase: firebase.initializeFirebase.bind(firebase),
  db: firebase.db,
  auth: firebase.auth,
  messaging: firebase.messaging,
  admin: firebase.admin,
  verifyConnection: firebase.verifyConnection.bind(firebase),
  listCollections: firebase.listCollections.bind(firebase),
  shutdown: firebase.shutdown.bind(firebase),
};
