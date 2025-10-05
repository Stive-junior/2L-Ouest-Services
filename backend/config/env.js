/**
 * @file env.js
 * @description Module de validation et de chargement des variables d'environnement pour L&L Ouest Services.
 * Utilise Joi pour valider les variables et garantir leur conformité avant utilisation.
 * @module env
 */

const Joi = require('joi');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, `../env/.env`) });
const envFile = process.env.NODE_ENV === 'production' ? '.env.pro' : '.env.dev';
dotenv.config({ path: path.resolve(__dirname, `../env/${envFile}`) });

/**
 * @typedef {Object} EnvVars
 * @property {string} NODE_ENV - Environnement de l'application ('development', 'production', 'test').
 * @property {number} PORT - Port d'écoute du serveur.
 * @property {string[]} FRONTEND_URL - URLs du frontend autorisées pour CORS, séparées par des virgules.
 * @property {string} JWT_SECRET - Clé secrète pour les tokens JWT.
 * @property {string} JWT_EXPIRES_IN - Durée de validité des tokens JWT.
 * @property {string} [FIREBASE_SERVICE_ACCOUNT_PATH] - Chemin vers le fichier de clé de service Firebase.
 * @property {string} FIREBASE_PROJECT_ID - ID du projet Firebase.
 * @property {string} FIREBASE_APP_ID - ID de l'application Firebase.
 * @property {string} FIREBASE_API_KEY - Clé API Firebase.
 * @property {string} FIREBASE_MEASUREMENT_ID - ID de mesure Firebase.
 * @property {string} FIREBASE_CLIENT_EMAIL - Email du client Firebase.
 * @property {string} FIREBASE_PRIVATE_KEY - Clé privée Firebase (échappée).
 * @property {string} [FIREBASE_DATABASE_URL] - URL de la base de données Firebase.
 * @property {string} FIREBASE_STORAGE_BUCKET - Bucket de stockage Firebase.
 * @property {string} FCM_VAPID_KEY - Clé publique VAPID pour FCM (notifications push).
 * @property {string} FCM_SENDER_ID - Sender ID pour FCM (messagingSenderId).
 * @property {string} MAILERSEND_API_KEY - Clé API MailerSend pour l'envoi d'emails transactionnels.
 * @property {number} RATE_LIMIT_WINDOW_MS - Fenêtre de temps pour le rate-limiting (ms).
 * @property {number} RATE_LIMIT_MAX - Nombre maximum de requêtes par fenêtre.
 * @property {string} LOG_LEVEL - Niveau de journalisation ('error', 'warn', 'info', 'debug').
 * @property {string} LOG_FILE_PATH - Chemin du fichier de log.
 * @property {string} SMTP_HOST - Hôte SMTP pour l'envoi d'emails.
 * @property {number} SMTP_PORT - Port SMTP.
 * @property {boolean} SMTP_SECURE - Utilisation de SSL/TLS pour SMTP.
 * @property {string} SMTP_USER - Utilisateur SMTP (email).
 * @property {string} SMTP_PASS - Mot de passe SMTP.
 * @property {string} GOOGLE_MAPS_API_KEY - Clé API Google Maps.
 * @property {string} SOCKET_PATH - Chemin pour le serveur WebSocket.
 * @property {number} SOCKET_CONNECT_TIMEOUT - Timeout pour les connexions WebSocket sans namespace (ms).
 * @property {boolean} SOCKET_SERVE_CLIENT - Si true, sert les fichiers clients socket.io.
 * @property {number} SOCKET_MAX_DISCONNECTION_DURATION - Durée maximale de déconnexion pour la récupération d'état (ms).
 * @property {boolean} SOCKET_CLEANUP_EMPTY_NAMESPACES - Si true, supprime les namespaces vides.
 * @property {boolean} SOCKET_COMPRESSION - Si true, active la compression des données WebSocket.
 * @property {number} SOCKET_PING_TIMEOUT - Timeout pour le ping WebSocket (ms).
 * @property {number} SOCKET_PING_INTERVAL - Intervalle entre les pings WebSocket (ms).
 * @property {number} SOCKET_MAX_HTTP_BUFFER_SIZE - Taille maximale du buffer HTTP pour WebSocket (octets).
 */

/**
 * Schéma de validation des variables d'environnement avec Joi.
 * @type {Joi.ObjectSchema<EnvVars>}
 */
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .description('Environnement de l\'application'),
  PORT: Joi.number()
    .integer()
    .min(1024)
    .max(65535)
    .default(3000)
    .description('Port d\'écoute du serveur Express'),
  FRONTEND_URL: Joi.string()
    .required()
    .pattern(/^https?:\/\/[^,\s]+(,\s*https?:\/\/[^,\s]+)*$/)
    .description('URLs du frontend pour CORS, séparées par des virgules'),
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('Clé secrète pour signer les tokens JWT'),
  JWT_EXPIRES_IN: Joi.string()
    .default('7d')
    .pattern(/^\d+[smhdw]$/)
    .description('Durée de validité des tokens JWT (ex: 1h, 7d)'),
  FIREBASE_SERVICE_ACCOUNT_PATH: Joi.string()
    .optional()
    .description('Chemin vers le fichier de clé de service Firebase'),
  FIREBASE_PROJECT_ID: Joi.string()
    .required()
    .description('ID du projet Firebase'),
  FIREBASE_APP_ID: Joi.string()
    .required()
    .description('ID de l\'application Firebase'),
  FIREBASE_API_KEY: Joi.string()
    .required()
    .description('Clé API Firebase'),
  FIREBASE_MEASUREMENT_ID: Joi.string()
    .required()
    .description('ID de mesure Firebase'),
  FIREBASE_CLIENT_EMAIL: Joi.string()
    .email()
    .required()
    .description('Email du client Firebase'),
  FIREBASE_PRIVATE_KEY: Joi.string()
    .required()
    .description('Clé privée Firebase (échappée avec \\n)'),
  FIREBASE_DATABASE_URL: Joi.string()
    .uri()
    .optional()
    .description('URL de la base de données Firebase'),
  FIREBASE_STORAGE_BUCKET: Joi.string()
    .required()
    .description('Bucket de stockage Firebase'),
  FCM_VAPID_KEY: Joi.string()
    .required()
    .description('Clé publique VAPID pour FCM (notifications push)'),
  FCM_SENDER_ID: Joi.string()
    .required()
    .description('Sender ID pour FCM (messagingSenderId)'),
  MAILERSEND_API_KEY: Joi.string()
    .required()
    .description('Clé API MailerSend pour l\'envoi d\'emails transactionnels'),
  
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .min(1000)
    .default(15 * 60 * 1000)
    .description('Fenêtre de temps pour le rate-limiting (ms)'),
  RATE_LIMIT_MAX: Joi.number()
    .integer()
    .min(1)
    .default(100)
    .description('Nombre maximum de requêtes par fenêtre'),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info')
    .description('Niveau de journalisation'),
  LOG_FILE_PATH: Joi.string()
    .default('logs/app.log')
    .description('Chemin du fichier de log'),
  SMTP_HOST: Joi.string()
    .hostname()
    .required()
    .description('Hôte SMTP pour l\'envoi d\'emails'),
  SMTP_PORT: Joi.number()
    .integer()
    .min(1)
    .max(65535)
    .required()
    .description('Port SMTP'),
  SMTP_SECURE: Joi.boolean()
    .default(false)
    .description('Utilisation de SSL/TLS pour SMTP'),
  SMTP_USER: Joi.string()
    .email()
    .required()
    .description('Utilisateur SMTP (email)'),
  SMTP_PASS: Joi.string()
    .required()
    .description('Mot de passe SMTP'),
  GOOGLE_MAPS_API_KEY: Joi.string()
    .required()
    .description('Clé API Google Maps'),
  SOCKET_PATH: Joi.string()
    .default('/socket.io')
    .description('Chemin pour le serveur WebSocket'),
  SOCKET_CONNECT_TIMEOUT: Joi.number()
    .integer()
    .min(1000)
    .default(45000)
    .description('Timeout pour les connexions WebSocket sans namespace (ms)'),
  SOCKET_SERVE_CLIENT: Joi.boolean()
    .default(false)
    .description('Si true, sert les fichiers clients socket.io'),
  SOCKET_MAX_DISCONNECTION_DURATION: Joi.number()
    .integer()
    .min(1000)
    .default(120000)
    .description('Durée maximale de déconnexion pour la récupération d\'état (ms)'),
  SOCKET_CLEANUP_EMPTY_NAMESPACES: Joi.boolean()
    .default(true)
    .description('Si true, supprime les namespaces vides'),
  SOCKET_COMPRESSION: Joi.boolean()
    .default(true)
    .description('Si true, active la compression des données WebSocket'),
  SOCKET_PING_TIMEOUT: Joi.number()
    .integer()
    .min(1000)
    .default(5000)
    .description('Timeout pour le ping WebSocket (ms)'),
  SOCKET_PING_INTERVAL: Joi.number()
    .integer()
    .min(1000)
    .default(25000)
    .description('Intervalle entre les pings WebSocket (ms)'),
  SOCKET_MAX_HTTP_BUFFER_SIZE: Joi.number()
    .integer()
    .min(1024)
    .default(1e6)
    .description('Taille maximale du buffer HTTP pour WebSocket (octets)'),
})
  .unknown(true);

/**
 * Valide les variables d'environnement et renvoie les valeurs validées.
 * @returns {EnvVars} Variables d'environnement validées
 * @throws {Error} Si la validation échoue
 */
const validateEnv = () => {
  const { value: envVars, error } = envVarsSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {
    const errorDetails = error.details.map(detail => detail.message).join('; ');
    throw new Error(`Erreur de validation des variables d'environnement : ${errorDetails}`);
  }

  return {
    nodeEnv: envVars.NODE_ENV,
    port: envVars.PORT,
    frontendUrl: envVars.FRONTEND_URL.split(',').map(url => url.trim()),
    jwt: {
      secret: envVars.JWT_SECRET,
      expiresIn: envVars.JWT_EXPIRES_IN,
    },
    firebase: {
      serviceAccountPath: envVars.FIREBASE_SERVICE_ACCOUNT_PATH,
      projectId: envVars.FIREBASE_PROJECT_ID,
      appId: envVars.FIREBASE_APP_ID,
      apiKey: envVars.FIREBASE_API_KEY,
      authDomain: envVars.FIREBASE_AUTH_DOMAIN,
      measurementId: envVars.FIREBASE_MEASUREMENT_ID,
      clientEmail: envVars.FIREBASE_CLIENT_EMAIL,
      privateKey: envVars.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      databaseURL: envVars.FIREBASE_DATABASE_URL,
      storageBucket: envVars.FIREBASE_STORAGE_BUCKET,
      vapidKey: envVars.FCM_VAPID_KEY,
      senderId: envVars.FCM_SENDER_ID,
    },
    mailersend: {
      apiKey: envVars.MAILERSEND_API_KEY,
    },
    rateLimit: {
      windowMs: envVars.RATE_LIMIT_WINDOW_MS,
      max: envVars.RATE_LIMIT_MAX,
    },
    logging: {
      level: envVars.LOG_LEVEL,
      filePath: envVars.LOG_FILE_PATH,
    },
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      secure: envVars.SMTP_SECURE,
      user: envVars.SMTP_USER,
      pass: envVars.SMTP_PASS,
    },
    googleMaps: {
      apiKey: envVars.GOOGLE_MAPS_API_KEY,
    },
    socket: {
      path: envVars.SOCKET_PATH,
      connectTimeout: envVars.SOCKET_CONNECT_TIMEOUT,
      serveClient: envVars.SOCKET_SERVE_CLIENT,
      maxDisconnectionDuration: envVars.SOCKET_MAX_DISCONNECTION_DURATION,
      cleanupEmptyNamespaces: envVars.SOCKET_CLEANUP_EMPTY_NAMESPACES,
      compression: envVars.SOCKET_COMPRESSION,
      pingTimeout: envVars.SOCKET_PING_TIMEOUT,
      pingInterval: envVars.SOCKET_PING_INTERVAL,
      maxHttpBufferSize: envVars.SOCKET_MAX_HTTP_BUFFER_SIZE,
    },
  };
};

module.exports = { validateEnv };
