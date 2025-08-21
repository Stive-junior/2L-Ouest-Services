/**
 * @file config.js
 * @description Fichier de configuration centralisé qui expose les paramètres validés
 * de l'application à partir des variables d'environnement pour L&L Ouest Services.
 * @module config
 */

const { validateEnv } = require('./env');

/**
 * @typedef {Object} AppConfig
 * @property {string} nodeEnv - Environnement de l'application ('development', 'production', 'test').
 * @property {number} port - Port d'écoute du serveur.
 * @property {string[]} frontendUrl - URLs du frontend autorisées pour CORS.
 * @property {object} jwt - Configuration JWT.
 * @property {string} jwt.secret - Clé secrète pour les tokens JWT.
 * @property {string} jwt.expiresIn - Durée de validité des tokens JWT.
 * @property {object} firebase - Configuration Firebase.
 * @property {string} [firebase.serviceAccountPath] - Chemin du fichier de clé de service.
 * @property {string} firebase.projectId - ID du projet Firebase.
 * @property {string} firebase.clientEmail - Email du client Firebase.
 * @property {string} firebase.privateKey - Clé privée Firebase.
 * @property {string} [firebase.databaseURL] - URL de la base de données Firebase.
 * @property {string} firebase.storageBucket - Bucket de stockage Firebase.
 * @property {object} rateLimit - Configuration du rate-limiting.
 * @property {number} rateLimit.windowMs - Fenêtre de temps en ms.
 * @property {number} rateLimit.max - Nombre maximum de requêtes.
 * @property {object} logging - Configuration du logging.
 * @property {string} logging.level - Niveau de journalisation.
 * @property {string} logging.filePath - Chemin du fichier de log.
 * @property {object} smtp - Configuration SMTP.
 * @property {string} smtp.host - Hôte SMTP.
 * @property {number} smtp.port - Port SMTP.
 * @property {boolean} smtp.secure - Utilisation de SSL/TLS.
 * @property {string} smtp.user - Utilisateur SMTP.
 * @property {string} smtp.pass - Mot de passe SMTP.
 * @property {object} googleMaps - Configuration Google Maps.
 * @property {string} googleMaps.apiKey - Clé API Google Maps.
 * @property {object} socket - Configuration WebSocket.
 * @property {string} socket.path - Chemin pour le serveur WebSocket.
 * @property {number} socket.connectTimeout - Timeout pour les connexions WebSocket sans namespace (ms).
 * @property {boolean} socket.serveClient - Si true, sert les fichiers clients socket.io.
 * @property {number} socket.maxDisconnectionDuration - Durée maximale de déconnexion pour la récupération d'état (ms).
 * @property {boolean} socket.cleanupEmptyNamespaces - Si true, supprime les namespaces WebSocket vides.
 * @property {boolean} socket.compression - Si true, active la compression des données WebSocket.
 * @property {number} socket.pingTimeout - Timeout pour le ping WebSocket (ms).
 * @property {number} socket.pingInterval - Intervalle entre les pings WebSocket (ms).
 * @property {number} socket.maxHttpBufferSize - Taille maximale du buffer HTTP pour WebSocket (octets).
 */

/** @type {AppConfig} */
const config = validateEnv();

module.exports = config;
