/**
 * @file app.js
 * @description Fichier principal de l'application backend pour L&L Ouest Services.
 * Configure et initialise l'application Express, les middlewares, les routes, Firebase, et WebSocket.
 * Inclut des vérifications de santé, une journalisation avancée, une gestion des erreurs robuste, et un arrêt gracieux.
 * Optimisé pour déploiement en ligne gratuit (ex. Render, Railway) sans dépendance à Redis.
 * @module app
 */

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const os = require('os');
const dns = require('dns').promises;
const fileUpload = require('express-fileupload');
const path = require('path');

const { logger, logInfo, logError, logWarn } = require('./services/loggerService');
const { AppError } = require('./utils/errorUtils');
const { db, admin, verifyConnection, listCollections, shutdown } = require('./config/firebase');
const config = require('./config/config');
const { corsMiddleware, errorMiddleware, loggingMiddleware, authenticate } = require('./middleware');
const socketService = require('./services/socketService');
const emailService = require('./services/emailService');

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
  configRoutes,
} = require('./routes');

const app = express();
let localUrl = null;
let isShuttingDown = false;

global.networkStatus = true;
let offlineStartTime = null;
const MAX_OFFLINE_DURATION = 5 * 60 * 1000; // 5 minutes

// --- Middleware de Contrôle Réseau (avant chaque route) ---
async function networkCheckMiddleware(req, res, next) {
  try {
    await dns.resolve('firestore.googleapis.com');
    global.networkStatus = true;
    offlineStartTime = null;
    next(); // Réseau OK, continuer
  } catch (err) {
    global.networkStatus = false;
    if (!offlineStartTime) offlineStartTime = Date.now();
    logError('Middleware : Réseau instable détecté', { error: err.message, path: req.path });
    res.status(503).json({
      status: 'unavailable',
      message: 'Réseau instable. Veuillez réessayer plus tard.',
      retryAfter: 30, // En secondes
    });
  }
}

// --- Écoute Constante de l'État Réseau ---
function monitorNetwork(intervalMs = 30000) { // Toutes les 30s
  setInterval(async () => {
    try {
      await dns.resolve('firestore.googleapis.com');
      if (!global.networkStatus) {
        global.networkStatus = true;
        offlineStartTime = null;
        logInfo('Réseau restauré');
      }
    } catch (err) {
      if (global.networkStatus) {
        global.networkStatus = false;
        offlineStartTime = Date.now();
        logWarn('Réseau perdu');
      } else if (Date.now() - offlineStartTime > MAX_OFFLINE_DURATION) {
        logError('Offline prolongé : Shutdown initié');
        process.emit('SIGTERM'); // Déclencher shutdown gracieux
      }
    }
  }, intervalMs);
  logInfo('Écoute réseau constante démarrée');
}

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

      // Vérification des variables d'environnement requises (gardé)
      const requiredEnvVars = [
        'NODE_ENV', 'PORT', 'FRONTEND_URL', 'JWT_SECRET', 'JWT_EXPIRES_IN',
        'FIREBASE_PROJECT_ID', 'FIREBASE_APP_ID', 'FIREBASE_API_KEY', 'FIREBASE_MEASUREMENT_ID',
        'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_DATABASE_URL', 'FIREBASE_STORAGE_BUCKET',
        'FCM_VAPID_KEY', 'FCM_SENDER_ID', 'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX',
        'LOG_LEVEL', 'LOG_FILE_PATH', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS',
        'GOOGLE_MAPS_API_KEY', 'SOCKET_PATH', 'SOCKET_CONNECT_TIMEOUT', 'SOCKET_MAX_DISCONNECTION_DURATION',
        'SOCKET_PING_TIMEOUT', 'SOCKET_PING_INTERVAL', 'SOCKET_MAX_HTTP_BUFFER_SIZE',
      ];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      if (missingVars.length > 0) {
        throw new AppError(500, `Variables d'environnement manquantes : ${missingVars.join(', ')}`, 'Missing environment variables');
      }
      logInfo('Vérification des variables d\'environnement : OK');  // ← Log ajouté

      // Test d'écriture dans Firestore (gardé, mais avec log)
      logInfo('Tentative d\'écriture Firestore...');  // ← Log ajouté
      await db.collection('status').doc('health_check').set({
        lastChecked: admin.firestore.FieldValue.serverTimestamp(),
        status: 'healthy',
        environment: config.nodeEnv,
      });
      logInfo('Écriture de test Firestore réussie');

       const collections = await listCollections();
      logInfo('Connexion Firestore : OK', { collections });


     logInfo('Tentative de vérification SMTP...');
      const smtpVerified = await emailService.verifyTransporterWithRetry(3, 5000);
      if (!smtpVerified) {
        logWarn('SMTP non vérifié (mais service continue)');
        if (config.nodeEnv === 'production') {
          throw new AppError(503, 'Configuration SMTP invalide après retries');
         }
      } else {
        logInfo('Vérification SMTP : OK');
      }

      // Vérification de la configuration Google Maps (gardé)
      if (!config.googleMaps.apiKey) {
        throw new AppError(500, 'Clé API Google Maps non définie', 'Missing Google Maps API key');
      }
      logInfo('Configuration Google Maps : OK');

      // Vérification de la configuration SMTP (gardé)
      if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) {
        throw new AppError(500, 'Configuration SMTP incomplète', 'Incomplete SMTP configuration');
      }
      logInfo('Variable Configuration SMTP : OK');

      // Vérification de la configuration Socket.IO (gardé)
      if (!config.socket.path) {
        throw new AppError(500, 'Chemin Socket.IO non défini', 'Missing Socket.IO path');
      }
      logInfo('Configuration Socket.IO : OK');

      // Vérification de la configuration Firebase client-side (gardé)
      if (!config.firebase.appId || !config.firebase.apiKey || !config.firebase.measurementId) {
        throw new AppError(500, 'Configuration Firebase client-side incomplète', 'Incomplete Firebase client configuration');
      }
      logInfo('Configuration Firebase client-side : OK');

      logInfo('healthCheck completé avec succès');  
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
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
}));
app.use(compression());
app.use(corsMiddleware);
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined', { stream: { write: message => logInfo(message.trim()) } }));
app.use('/storage', authenticate, express.static(path.join(__dirname, 'storage')));
app.use(fileUpload());

app.use('/api', networkCheckMiddleware);

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
      `${apiPrefix}/config/firebase`,
    ],
  });
});

// --- Route pour récupérer l'URL du serveur ---
app.get('/api/server-url', (req, res) => {
  res.status(200).json({
    serverUrl: localUrl || `http://localhost:${config.port}`,
    status: 'active',
    message: 'URL du serveur',
    timestamp: new Date().toISOString(),
  });
});


app.use(express.json());
app.use(authenticate);

// --- Montage des routes avec préfixes API ---
const apiPrefix = '/api';
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/user`, userRoutes);
app.use(`${apiPrefix}/config`, configRoutes);
app.use(`${apiPrefix}/services`, serviceRoutes);
app.use(`${apiPrefix}/review`, reviewRoutes);
app.use(`${apiPrefix}/chat`, chatRoutes);
app.use(`${apiPrefix}/contact`, contactRoutes);
app.use(`${apiPrefix}/document`, documentRoutes);
app.use(`${apiPrefix}/map`, mapRoutes);
app.use(`${apiPrefix}/notification`, notificationRoutes);


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
      smtpStatus: emailService.isSmtpVerified ? 'verified' : 'unverified',
      collections,
      socketStatus: socketService.io ? 'connected' : 'disconnected',
      networkStatus: global.networkStatus ? 'online' : 'offline',
    });
  } catch (err) {
    logError('Échec de la vérification de santé', { error: err.message });
    res.status(500).json({
      status: 'unhealthy',
      error: err.message,
    });
  }
});

app.get('/api/check', async (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
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
      `${apiPrefix}/config`,
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

app.use(loggingMiddleware);
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

    // Écoute d'abord (priorité Render : listen ASAP)
    const port = process.env.PORT || config.port;
    const server = app.listen(port, '0.0.0.0', async () => {
      logInfo(`Serveur démarré sur le port ${port}`);  

      emailService.init().catch(err => {
        logError('Init SMTP échouée au démarrage', { error: err.message });
      });

      healthCheck().then(() => {
        logInfo('HealthCheck background OK');
      }).catch(err => {
        logError('HealthCheck background failed', { error: err.message });
      });

      // Détermination de l'adresse IP locale
      const interfaces = os.networkInterfaces();
      const ip = Object.values(interfaces)
        .flat()
        .find(i => i.family === 'IPv4' && !i.internal)?.address || '0.0.0.0';
      localUrl = `http://${ip}:${port}`;

      // Initialisation du SocketService
      socketService.initialize(server);
      logInfo('SocketService initialisé');

      // Mise à jour du statut Firestore (avec try-catch)
      try {
        await db.collection('status').doc('api_status').set({
          last_started: admin.firestore.FieldValue.serverTimestamp(),
          message: 'API démarrée',
          port,
          environment: config.nodeEnv,
          ip,
          localUrl,
        });
      } catch (err) {
        logError('Erreur mise à jour statut Firestore', { error: err.message });
      }

      // Mise à jour URL (avec try-catch)
      try {
        await updateApiUrlInFirestore(localUrl, 'active');
      } catch (err) {
        logError('Erreur update URL Firestore', { error: err.message });
      }

      // Démarrer l'écoute réseau constante
      monitorNetwork();
      logInfo('Startup complet !'); 
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
