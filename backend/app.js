/**
 * @file app.js
 * @description Fichier principal de l'application backend pour L&L Ouest Services.
 * Configure et initialise l'application Express, les middlewares, les routes, Firebase, et WebSocket.
 * Inclut des vérifications de santé, une journalisation avancée, une gestion des erreurs robuste, et un arrêt gracieux.
 * @module app
 */

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const os = require('os');
const ngrok = require('ngrok');
const dns = require('dns').promises;
const fileUpload = require('express-fileupload');
const path = require('path');

const { logger, logInfo, logError, logWarn } = require('./services/loggerService');
const { AppError } = require('./utils/errorUtils');
const { db, admin, verifyConnection, listCollections, shutdown } = require('./config/firebase');
const config = require('./config/config');
const { corsMiddleware, errorMiddleware, rateLimitMiddleware, loggingMiddleware, authenticate } = require('./middleware');
const socketService = require('./services/socketService');

// Importation des routes depuis index.js
const {
  authRoutes,
  chatRoutes,
  contactRoutes,
  documentRoutes,
  mapRoutes,
  notificationRoutes,
  reviewRoutes,
  serviceRoutes,
  userRoutes,
} = require('./routes');

const app = express();
let ngrokUrl = null;
let localUrl = null;
let isShuttingDown = false;

// --- Vérification de la connectivité réseau avec retries ---
async function checkNetworkConnectivity(maxRetries = 3, delayMs = 5000) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await dns.resolve('firestore.googleapis.com');
      logInfo('Connexion réseau à Firestore : OK', { attempt });
      return true;
    } catch (err) {
      lastError = err;
      logWarn(`Échec de la vérification réseau (tentative ${attempt}/${maxRetries})`, {
        error: err.message,
        stack: err.stack,
      });
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  logError('Impossible de se connecter au réseau pour Firestore', { error: lastError?.message });
  throw new AppError(500, 'Impossible de se connecter au réseau pour Firestore', lastError?.message || 'Unknown error');
}

// --- Vérifications de santé avec retries ---
async function healthCheck(maxRetries = 3, delayMs = 5000) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logInfo('Début de la vérification de santé', { attempt });

      // Vérification des variables d'environnement requises
      const requiredEnvVars = [
        'NODE_ENV',
        'PORT',
        'FRONTEND_URL',
        'JWT_SECRET',
        'JWT_EXPIRES_IN',
        'FIREBASE_PROJECT_ID',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_DATABASE_URL',
        'RATE_LIMIT_WINDOW_MS',
        'RATE_LIMIT_MAX',
        'LOG_LEVEL',
        'LOG_FILE_PATH',
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASS',
        'GOOGLE_MAPS_API_KEY',
        'SOCKET_PATH',
        'SOCKET_CONNECT_TIMEOUT',
        'SOCKET_MAX_DISCONNECTION_DURATION',
        'SOCKET_PING_TIMEOUT',
        'SOCKET_PING_INTERVAL',
        'SOCKET_MAX_HTTP_BUFFER_SIZE',
        'FCM_VAPID_KEY',
      ];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      if (missingVars.length > 0) {
        throw new AppError(500, `Variables d'environnement manquantes : ${missingVars.join(', ')}`, 'Missing environment variables');
      }
      logInfo('Vérification des variables d\'environnement : OK');

      // Test d'écriture dans Firestore
      await db.collection('status').doc('health_check').set({
        lastChecked: admin.firestore.FieldValue.serverTimestamp(),
        status: 'healthy',
        environment: config.nodeEnv,
      });
      logInfo('Écriture de test Firestore réussie');

      // Liste des collections Firestore
      const collections = await listCollections();
      logInfo('Connexion Firestore : OK', { collections });

      // Vérification de la configuration Google Maps
      if (!config.googleMaps.apiKey) {
        throw new AppError(500, 'Clé API Google Maps non définie', 'Missing Google Maps API key');
      }
      logInfo('Clé API Google Maps : OK');

      // Vérification de la configuration SMTP
      if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) {
        throw new AppError(500, 'Configuration SMTP incomplète', 'Incomplete SMTP configuration');
      }
      logInfo('Configuration SMTP : OK');

      // Vérification de la configuration Socket.IO
      if (!config.socket.path) {
        throw new AppError(500, 'Chemin Socket.IO non défini', 'Missing Socket.IO path');
      }
      logInfo('Configuration Socket.IO : OK');

      return true;
    } catch (err) {
      lastError = err;
      logWarn(`Échec de la vérification de santé (tentative ${attempt}/${maxRetries})`, {
        error: err.message,
        stack: err.stack,
      });
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  logError('Échec définitif de la vérification de santé', {
    error: lastError?.message,
    stack: lastError?.stack,
  });
  throw new AppError(500, 'Échec définitif de la vérification de santé', lastError?.message || 'Unknown error');
}

// --- Mise à jour de l'URL dans Firestore ---
async function updateApiUrlInFirestore(url, status) {
  try {
    await db.collection('config').doc('api').set({
      baseUrl: url,
      status: status,
      environment: config.nodeEnv,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    logInfo(`URL API mise à jour dans Firestore : ${url}`, { status });
  } catch (err) {
    logError('Échec de la mise à jour de l\'URL dans Firestore', {
      error: err.message,
      stack: err.stack,
    });
  }
}

// --- Middlewares globaux ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));
app.use(compression());
app.use(corsMiddleware);
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(rateLimitMiddleware);
app.use('/storage', authenticate, express.static(path.join(__dirname, 'storage')));
app.use(fileUpload());

// --- Route d'accueil ---
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Bienvenue sur l\'API L&L Ouest Services !',
    version: '1.0.0',
    environment: config.nodeEnv,
    endpoints: [
      `${apiPrefix}/auth/signup`,
      `${apiPrefix}/auth/signin`,
      `${apiPrefix}/auth/refresh`,
      `${apiPrefix}/auth/signout`,
      `${apiPrefix}/auth/verify`,
      `${apiPrefix}/user`,
      `${apiPrefix}/user/profile`,
      `${apiPrefix}/user/:id`,
      `${apiPrefix}/user/email/:email`,
      `${apiPrefix}/user/preferences`,
      `${apiPrefix}/user/invoices`,
      `${apiPrefix}/service`,
      `${apiPrefix}/service/:id`,
      `${apiPrefix}/service/category/:category`,
      `${apiPrefix}/service/nearby`,
      `${apiPrefix}/service/:id/location`,
      `${apiPrefix}/service/:id/image`,
      `${apiPrefix}/review`,
      `${apiPrefix}/review/:id`,
      `${apiPrefix}/review/service/:serviceId`,
      `${apiPrefix}/review/user`,
      `${apiPrefix}/review/:id/image`,
      `${apiPrefix}/chat`,
      `${apiPrefix}/chat/messages`,
      `${apiPrefix}/chat/messages/:id`,
      `${apiPrefix}/chat/:recipientId`,
      `${apiPrefix}/chat/messages/:id/read`,
      `${apiPrefix}/chat/messages/:id/file`,
      `${apiPrefix}/contact`,
      `${apiPrefix}/contact/:id`,
      `${apiPrefix}/document`,
      `${apiPrefix}/document/:id`,
      `${apiPrefix}/map/geocode`,
      `${apiPrefix}/map/distance`,
      `${apiPrefix}/map/user/location`,
      `${apiPrefix}/map/service/location`,
      `${apiPrefix}/map/nearby`,
      `${apiPrefix}/map/subscribe`,
      `${apiPrefix}/notification/push`,
      `${apiPrefix}/notification/message`,
      `${apiPrefix}/notification/message/read`,
      `${apiPrefix}/notification/service`,
      `${apiPrefix}/notification/service/update`,
      `${apiPrefix}/notification/review`,
      `${apiPrefix}/notification/user`,
      `${apiPrefix}/notification/contact`,
    ],
  });
});

// --- Route pour récupérer l'URL ngrok ---
app.get('/api/ngrok-url', (req, res) => {
  res.status(200).json({
    ngrokUrl: ngrokUrl || localUrl || `http://localhost:${config.port}`,
    status: ngrokUrl ? 'active' : 'local',
    message: ngrokUrl ? 'ngrok connecté' : 'ngrok non connecté, utilisant l\'URL locale',
    timestamp: new Date().toISOString(),
  });
});

// --- Montage des routes avec préfixes API ---
const apiPrefix = '/api';
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/user`, userRoutes);
app.use(`${apiPrefix}/services`, serviceRoutes);
app.use(`${apiPrefix}/review`, reviewRoutes);
app.use(`${apiPrefix}/chat`, chatRoutes);
app.use(`${apiPrefix}/contact`, contactRoutes);
app.use(`${apiPrefix}/document`, documentRoutes);
app.use(`${apiPrefix}/map`, mapRoutes);
app.use(`${apiPrefix}/notification`, notificationRoutes);

app.use(loggingMiddleware);
// --- Route de santé ---
app.get('/api/health', async (req, res) => {
  try {
    await verifyConnection();
    const collections = await listCollections();
    res.status(200).json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      firebaseStatus: 'connected',
      collections,
      socketStatus: socketService.io ? 'connected' : 'disconnected',
    });
  } catch (err) {
    logError('Échec de la vérification de santé', { error: err.message });
    res.status(500).json({
      status: 'unhealthy',
      error: err.message,
    });
  }
});

// --- Route de base API ---
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Bienvenue sur l\'API L&L Ouest Services !',
    version: '1.0.0',
    environment: config.nodeEnv,
    endpoints: [
      `${apiPrefix}/auth`,
      `${apiPrefix}/user`,
      `${apiPrefix}/service`,
      `${apiPrefix}/review`,
      `${apiPrefix}/chat`,
      `${apiPrefix}/contact`,
      `${apiPrefix}/document`,
      `${apiPrefix}/map`,
      `${apiPrefix}/notification`,
    ],
  });
});

// --- Middleware de gestion des erreurs (doit être en dernier) ---
app.use(errorMiddleware);


// --- Gestion des arrêts gracieux ---
process.on('SIGTERM', async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logInfo('Signal SIGTERM reçu. Arrêt du serveur...');
  try {
    await socketService.close();
    await shutdown();
    await updateApiUrlInFirestore(localUrl || `http://localhost:${config.port}`, 'stopped');
    if (ngrokUrl) {
      await ngrok.disconnect();
      logInfo('ngrok déconnecté');
    }
    logInfo('Arrêt gracieux terminé');
  } catch (err) {
    logError('Erreur lors de l\'arrêt du serveur', { error: err.message });
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logInfo('Signal SIGINT reçu. Arrêt du serveur...');
  try {
    await socketService.close();
    await shutdown();
    await updateApiUrlInFirestore(localUrl || `http://localhost:${config.port}`, 'stopped');
    if (ngrokUrl) {
      await ngrok.disconnect();
      logInfo('ngrok déconnecté');
    }
    logInfo('Arrêt gracieux terminé');
  } catch (err) {
    logError('Erreur lors de l\'arrêt du serveur', { error: err.message });
  }
  process.exit(0);
});

// --- Gestion des erreurs non gérées ---
process.on('unhandledRejection', (reason, promise) => {
  logError('Promesse non gérée rejetée', {
    reason: reason.message || reason,
    stack: reason.stack,
    promise,
  });
});

process.on('uncaughtException', (err) => {
  logError('Exception non gérée', {
    error: err.message,
    stack: err.stack,
  });
  if (!isShuttingDown) {
    process.exit(1);
  }
});

// --- Démarrage du serveur ---
async function startServer() {
  try {
    logInfo('Démarrage du serveur...');
    await checkNetworkConnectivity();
    logInfo('Firebase initialisé');
    await healthCheck();

    // Détermination de l'adresse IP locale
    const interfaces = os.networkInterfaces();
    const ip = Object.values(interfaces)
      .flat()
      .find(i => i.family === 'IPv4' && !i.internal)?.address || '0.0.0.0';
    localUrl = `http://${ip}:${config.port}`;

    const server = app.listen(config.port, '0.0.0.0', async () => {
      logInfo(`Serveur démarré sur le port ${config.port}`, {
        localUrl: `${localUrl}${apiPrefix}`,
        environment: config.nodeEnv,
      });

      // Initialisation du SocketService
      socketService.initialize(server);
      logInfo('SocketService initialisé');

      // Mise à jour du statut Firestore
      await db.collection('status').doc('api_status').set({
        last_started: admin.firestore.FieldValue.serverTimestamp(),
        message: 'API démarrée',
        port: config.port,
        environment: config.nodeEnv,
        ip,
        localUrl,
      });

      // Connexion ngrok (en dernier recours)
      if (process.env.NGROK_AUTH_TOKEN) {
        try {
          ngrokUrl = await ngrok.connect({
            addr: config.port,
            authtoken: process.env.NGROK_AUTH_TOKEN,
          });
          logInfo(`ngrok connecté avec succès`, { ngrokUrl });
          await updateApiUrlInFirestore(ngrokUrl, 'active');
        } catch (ngrokError) {
          logWarn(`Impossible de connecter ngrok, utilisant l'URL locale`, {
            error: ngrokError.message,
            stack: ngrokError.stack,
          });
          ngrokUrl = null;
          await updateApiUrlInFirestore(localUrl, 'local');
        }
      } else {
        logWarn('NGROK_AUTH_TOKEN non défini, utilisant l\'URL locale');
        await updateApiUrlInFirestore(localUrl, 'local');
      }
    });

    // Gestion des signaux pour arrêt du serveur
    process.on('SIGTERM', () => server.close());
    process.on('SIGINT', () => server.close());
  } catch (err) {
    logError('Échec du démarrage du serveur', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

startServer();

module.exports = app;
