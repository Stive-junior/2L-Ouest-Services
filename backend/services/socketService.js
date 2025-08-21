/**
 * @file socketService.js
 * @description Service WebSocket pour une écoute permanente des actions du site L&L Ouest Services.
 * Gère les connexions en temps réel avec socket.io pour les notifications, messages, localisations, et autres activités.
 * Intègre avec les repositories pour la gestion des données et utilise des événements sécurisés.
 * @module services/socketService
 */

const socketIo = require('socket.io');
const { userRepo, serviceRepo, reviewRepo, chatRepo, contactRepo } = require('../repositories/index');
const { logger, logInfo, logError, logWarn, logAudit } = require('./loggerService');
const { AppError, UnauthorizedError } = require('../utils/errorUtils');
const config = require('../config/config');

/**
 * @class SocketService
 * @description Gère les connexions WebSocket et les événements en temps réel pour L&L Ouest Services.
 */
class SocketService {
  constructor() {
    /**
     * @type {socketIo.Server|null} Instance du serveur socket.io
     */
    this.io = null;

    /**
     * @type {Map<string, string>} Map associant les userId aux socketId
     */
    this.userSocketMap = new Map();

    /**
     * @type {Map<string, Set<string>>} Map associant les rooms aux socketId
     */
    this.roomSocketMap = new Map();

    /**
     * @type {number} Timeout pour les connexions sans namespace (en ms)
     */
    this.connectTimeout = config.socket.connectTimeout || 45000;

    /**
     * @type {Map<string, number>} Map pour le suivi du rate limiting par socket
     */
    this.rateLimitMap = new Map();
  }

  /**
   * Initialise le serveur WebSocket avec des options sécurisées.
   * @param {http.Server} httpServer - Serveur HTTP pour socket.io.
   * @returns {void}
   */
  initialize(httpServer) {
    this.io = new socketIo.Server(httpServer, {
      path: config.socket.path || '/socket.io',
      cors: {
        origin: config.frontendUrl,
        methods: ['GET', 'POST' , 'PUT', 'DELETE'],
        credentials: true,
      },
      serveClient: false,
      connectTimeout: this.connectTimeout,
      connectionStateRecovery: {
        maxDisconnectionDuration: 120000,
        skipMiddlewares: true,
      },
      cleanupEmptyChildNamespaces: true,
      maxHttpBufferSize: 1e6, 
    });

    // Middleware pour vérifier l'authentification
    this.io.use(async (socket, next) => {
      const userId = socket.handshake.query.userId;
      const token = socket.handshake.auth.token;

      try {
        if (!userId || !token) {
          throw new UnauthorizedError('Identifiants manquants');
        }

        const user = await userRepo.getById(userId);
        const  authService  = require('./authService');
        await authService.verifyToken(token);
        socket.data.user = user;
        logInfo('Middleware d\'authentification WebSocket réussi', { userId });
        next();
      } catch (error) {
        logError('Erreur dans le middleware d\'authentification WebSocket', { error: error.message, userId });
        next(new UnauthorizedError('Authentification échouée'));
      }
    });

    // Middleware pour rate limiting
    this.io.use((socket, next) => {
      const socketId = socket.id;
      const now = Date.now();
      const rateLimit = this.rateLimitMap.get(socketId) || { count: 0, lastReset: now };

      if (now - rateLimit.lastReset > 60000) {
        rateLimit.count = 0;
        rateLimit.lastReset = now;
      }

      if (rateLimit.count > 100) {
        logWarn('Limite de requêtes atteinte pour le socket', { socketId });
        return next(new AppError(429, 'Trop de requêtes'));
      }

      rateLimit.count += 1;
      this.rateLimitMap.set(socketId, rateLimit);
      next();
    });

    // Gestion des connexions
    this.io.on('connection', async (socket) => {
      const userId = socket.handshake.query.userId;
      try {
        this.userSocketMap.set(userId, socket.id);
        logInfo('Utilisateur connecté via WebSocket', { userId, socketId: socket.id });

        // Événements utilisateur
        this.handleUserEvents(socket);
        // Événements de localisation
        this.handleLocationEvents(socket);
        // Événements de chat
        this.handleChatEvents(socket);
        // Événements de services
        this.handleServiceEvents(socket);
        // Événements d'avis
        this.handleReviewEvents(socket);
        // Événements de contact
        this.handleContactEvents(socket);

        socket.on('disconnect', (reason) => {
          this.handleDisconnect(socket, reason);
        });
      } catch (error) {
        logError('Erreur lors de la connexion WebSocket', { error: error.message, userId });
        socket.disconnect(true);
      }
    });

    logInfo('Serveur WebSocket initialisé', { path: config.socket.path });
  }

  /**
   * Gère les événements liés aux utilisateurs (inscription, mise à jour, suppression).
   * @param {socketIo.Socket} socket - Socket de l'utilisateur connecté.
   * @returns {void}
   * @private
   */
  handleUserEvents(socket) {
    const userId = socket.handshake.query.userId;

    socket.on('joinUserRoom', async (callback) => {
      try {
        const user = await userRepo.getById(userId);
        socket.join(`user:${userId}`);
        this.roomSocketMap.set(`user:${userId}`, new Set([socket.id]));
        logInfo('Utilisateur a rejoint sa room', { userId, room: `user:${userId}` });
        callback?.({ status: 'success', room: `user:${userId}` });
      } catch (error) {
        logError('Erreur lors de la jointure de la room utilisateur', { error: error.message, userId });
        callback?.({ status: 'error', error: error.message });
      }
    });

    socket.on('updateUser', async (userData, callback) => {
      try {
        const updatedUser = await userRepo.update(userId, userData);
        this.io.to(`user:${userId}`).emit('userUpdated', { userId, user: updatedUser });
        logAudit('Profil utilisateur mis à jour via WebSocket', { userId });
        callback?.({ status: 'success', user: updatedUser });
      } catch (error) {
        logError('Erreur lors de la mise à jour du profil utilisateur via WebSocket', { error: error.message, userId });
        callback?.({ status: 'error', error: error.message });
      }
    });

    socket.on('deleteUser', async (callback) => {
      try {
        await userRepo.delete(userId);
        this.io.to(`user:${userId}`).emit('userDeleted', { userId });
        this.handleDisconnect(socket, 'user deleted');
        logAudit('Utilisateur supprimé via WebSocket', { userId });
        callback?.({ status: 'success' });
      } catch (error) {
        logError('Erreur lors de la suppression de l\'utilisateur via WebSocket', { error: error.message, userId });
        callback?.({ status: 'error', error: error.message });
      }
    });
  }

  /**
   * Gère les événements liés à la localisation (mise à jour, services à proximité).
   * @param {socketIo.Socket} socket - Socket de l'utilisateur connecté.
   * @returns {void}
   * @private
   */
  handleLocationEvents(socket) {
    const userId = socket.handshake.query.userId;

    socket.on('updateLocation', async ({ lat, lng }, callback) => {
      try {
        const user = await userRepo.getById(userId);
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          throw new AppError(400, 'Coordonnées de localisation invalides');
        }
        const updatedUser = await userRepo.update(userId, { ...user, location: { lat, lng } });
        this.io.to(`user:${userId}`).emit('locationUpdated', { userId, location: { lat, lng } });
        logInfo('Localisation utilisateur mise à jour via WebSocket', { userId, lat, lng });
        callback?.({ status: 'success', location: { lat, lng } });
      } catch (error) {
        logError('Erreur lors de la mise à jour de la localisation via WebSocket', { error: error.message, userId });
        callback?.({ status: 'error', error: error.message });
      }
    });

    socket.on('findNearbyServices', async ({ radius }, callback) => {
      try {
        const user = await userRepo.getById(userId);
        if (!user.location) {
          throw new AppError(400, 'Localisation utilisateur non définie');
        }
        const { mapService } = require('./mapService');
        const nearbyServices = await mapService.findNearbyServices(userId, radius || 10000);
        socket.emit('nearbyServices', { services: nearbyServices });
        logInfo('Services à proximité envoyés via WebSocket', { userId, count: nearbyServices.length });
        callback?.({ status: 'success', services: nearbyServices });
      } catch (error) {
        logError('Erreur lors de la recherche de services à proximité via WebSocket', { error: error.message, userId });
        callback?.({ status: 'error', error: error.message });
      }
    });
  }

  /**
   * Gère les événements liés aux messages de chat.
   * @param {socketIo.Socket} socket - Socket de l'utilisateur connecté.
   * @returns {void}
   * @private
   */
  handleChatEvents(socket) {
    const userId = socket.handshake.query.userId;

    socket.on('joinChatRoom', async ({ recipientId }, callback) => {
      try {
        await userRepo.getById(recipientId);
        const room = `chat:${[userId, recipientId].sort().join(':')}`;
        socket.join(room);
        this.roomSocketMap.set(room, new Set([...(this.roomSocketMap.get(room) || []), socket.id]));
        logInfo('Utilisateur a rejoint une room de chat', { userId, room });
        callback?.({ status: 'success', room });
      } catch (error) {
        logError('Erreur lors de la jointure de la room de chat', { error: error.message, userId });
        callback?.({ status: 'error', error: error.message });
      }
    });

    socket.on('sendMessage', async ({ recipientId, content }, callback) => {
      try {
        await userRepo.getById(recipientId);
        const message = {
          senderId: userId,
          recipientId,
          content,
          createdAt: new Date().toISOString(),
        };
        const { chatService } = require('./chatService');
        const createdMessage = await chatService.sendMessage(message);
        const room = `chat:${[userId, recipientId].sort().join(':')}`;
        this.io.to(room).emit('newMessage', createdMessage);
        logInfo('Message envoyé via WebSocket', { messageId: createdMessage.id, room });
        callback?.({ status: 'success', message: createdMessage });
      } catch (error) {
        logError('Erreur lors de l\'envoi du message via WebSocket', { error: error.message, userId });
        callback?.({ status: 'error', error: error.message });
      }
    });

    socket.on('markMessageAsRead', async ({ messageId }, callback) => {
      try {
        const { chatService } = require('./chatService');
        const updatedMessage = await chatService.markMessageAsRead(messageId);
        const room = `chat:${[updatedMessage.senderId, updatedMessage.recipientId].sort().join(':')}`;
        this.io.to(room).emit('messageRead', { messageId, status: 'read' });
        logInfo('Message marqué comme lu via WebSocket', { messageId, userId });
        callback?.({ status: 'success', messageId });
      } catch (error) {
        logError('Erreur lors du marquage du message comme lu via WebSocket', { error: error.message, userId, messageId });
        callback?.({ status: 'error', error: error.message });
      }
    });
  }

  /**
   * Gère les événements liés aux services (création, mise à jour, suppression).
   * @param {socketIo.Socket} socket - Socket de l'utilisateur connecté.
   * @returns {void}
   * @private
   */
  handleServiceEvents(socket) {
    const userId = socket.handshake.query.userId;

    socket.on('joinServiceRoom', async ({ serviceId }, callback) => {
      try {
        await serviceRepo.getById(serviceId);
        socket.join(`service:${serviceId}`);
        this.roomSocketMap.set(`service:${serviceId}`, new Set([...(this.roomSocketMap.get(`service:${serviceId}`) || []), socket.id]));
        logInfo('Utilisateur a rejoint une room de service', { userId, serviceId });
        callback?.({ status: 'success', room: `service:${serviceId}` });
      } catch (error) {
        logError('Erreur lors de la jointure de la room de service', { error: error.message, userId, serviceId });
        callback?.({ status: 'error', error: error.message });
      }
    });

    socket.on('createService', async (serviceData, callback) => {
      try {
        const { serviceService } = require('./serviceService');
        const service = await serviceService.createService({ ...serviceData, providerId: userId });
        socket.join(`service:${service.id}`);
        this.roomSocketMap.set(`service:${service.id}`, new Set([socket.id]));
        this.io.to(`service:${service.id}`).emit('newService', service);
        this.io.emit('newServiceBroadcast', { serviceId: service.id, name: service.name });
        logAudit('Service créé via WebSocket', { serviceId: service.id, userId });
        callback?.({ status: 'success', service });
      } catch (error) {
        logError('Erreur lors de la création du service via WebSocket', { error: error.message, userId });
        callback?.({ status: 'error', error: error.message });
      }
    });

    socket.on('updateService', async ({ serviceId, serviceData }, callback) => {
      try {
        const { serviceService } = require('./serviceService');
        const updatedService = await serviceService.updateService(serviceId, serviceData);
        this.io.to(`service:${serviceId}`).emit('serviceUpdated', updatedService);
        logAudit('Service mis à jour via WebSocket', { serviceId, userId });
        callback?.({ status: 'success', service: updatedService });
      } catch (error) {
        logError('Erreur lors de la mise à jour du service via WebSocket', { error: error.message, userId, serviceId });
        callback?.({ status: 'error', error: error.message });
      }
    });

    socket.on('deleteService', async ({ serviceId }, callback) => {
      try {
        const { serviceService } = require('./serviceService');
        await serviceService.deleteService(serviceId);
        this.io.to(`service:${serviceId}`).emit('serviceDeleted', { serviceId });
        this.roomSocketMap.delete(`service:${serviceId}`);
        logAudit('Service supprimé via WebSocket', { serviceId, userId });
        callback?.({ status: 'success' });
      } catch (error) {
        logError('Erreur lors de la suppression du service via WebSocket', { error: error.message, userId, serviceId });
        callback?.({ status: 'error', error: error.message });
      }
    });
  }

  /**
   * Gère les événements liés aux avis (création, mise à jour, suppression).
   * @param {socketIo.Socket} socket - Socket de l'utilisateur connecté.
   * @returns {void}
   * @private
   */
  handleReviewEvents(socket) {
    const userId = socket.handshake.query.userId;

    socket.on('joinReviewRoom', async ({ serviceId }, callback) => {
      try {
        await serviceRepo.getById(serviceId);
        socket.join(`review:${serviceId}`);
        this.roomSocketMap.set(`review:${serviceId}`, new Set([...(this.roomSocketMap.get(`review:${serviceId}`) || []), socket.id]));
        logInfo('Utilisateur a rejoint une room d\'avis', { userId, serviceId });
        callback?.({ status: 'success', room: `review:${serviceId}` });
      } catch (error) {
        logError('Erreur lors de la jointure de la room d\'avis', { error: error.message, userId, serviceId });
        callback?.({ status: 'error', error: error.message });
      }
    });

    socket.on('createReview', async ({ serviceId, rating, comment }, callback) => {
      try {
        const { reviewService } = require('./reviewService');
        const review = await reviewService.createReview({ userId, serviceId, rating, comment });
        this.io.to(`review:${serviceId}`).emit('newReview', review);
        logAudit('Avis créé via WebSocket', { reviewId: review.id, userId, serviceId });
        callback?.({ status: 'success', review });
      } catch (error) {
        logError('Erreur lors de la création de l\'avis via WebSocket', { error: error.message, userId, serviceId });
        callback?.({ status: 'error', error: error.message });
      }
    });

    socket.on('updateReview', async ({ reviewId, reviewData }, callback) => {
      try {
        const { reviewService } = require('./reviewService');
        const updatedReview = await reviewService.updateReview(reviewId, reviewData);
        this.io.to(`review:${updatedReview.serviceId}`).emit('reviewUpdated', updatedReview);
        logAudit('Avis mis à jour via WebSocket', { reviewId, userId });
        callback?.({ status: 'success', review: updatedReview });
      } catch (error) {
        logError('Erreur lors de la mise à jour de l\'avis via WebSocket', { error: error.message, userId, reviewId });
        callback?.({ status: 'error', error: error.message });
      }
    });

    socket.on('deleteReview', async ({ reviewId }, callback) => {
      try {
        const { reviewService } = require('./reviewService');
        const review = await reviewService.getReview(reviewId);
        await reviewService.deleteReview(reviewId);
        this.io.to(`review:${review.serviceId}`).emit('reviewDeleted', { reviewId });
        logAudit('Avis supprimé via WebSocket', { reviewId, userId });
        callback?.({ status: 'success' });
      } catch (error) {
        logError('Erreur lors de la suppression de l\'avis via WebSocket', { error: error.message, userId, reviewId });
        callback?.({ status: 'error', error: error.message });
      }
    });
  }

  /**
   * Gère les événements liés aux messages de contact.
   * @param {socketIo.Socket} socket - Socket de l'utilisateur connecté.
   * @returns {void}
   * @private
   */
  handleContactEvents(socket) {
    const userId = socket.handshake.query.userId;

    socket.on('joinContactRoom', async (callback) => {
      try {
        socket.join(`contact:${userId}`);
        this.roomSocketMap.set(`contact:${userId}`, new Set([socket.id]));
        logInfo('Utilisateur a rejoint une room de contact', { userId });
        callback?.({ status: 'success', room: `contact:${userId}` });
      } catch (error) {
        logError('Erreur lors de la jointure de la room de contact', { error: error.message, userId });
        callback?.({ status: 'error', error: error.message });
      }
    });

    socket.on('createContact', async ({ subject, message }, callback) => {
      try {
        const { emailService } = require('./emailService');
        const contact = await emailService.createContact({ userId, subject, message });
        const admins = await userRepo.getByRole('admin', 1, 100);
        for (const admin of admins.users) {
          this.emitToUser(admin.id, 'newContact', { contactId: contact.id, subject });
        }
        logAudit('Message de contact créé via WebSocket', { contactId: contact.id, userId });
        callback?.({ status: 'success', contact });
      } catch (error) {
        logError('Erreur lors de la création du message de contact via WebSocket', { error: error.message, userId });
        callback?.({ status: 'error', error: error.message });
      }
    });
  }

  /**
   * Gère la déconnexion d'un utilisateur.
   * @param {socketIo.Socket} socket - Socket de l'utilisateur.
   * @param {string} reason - Raison de la déconnexion.
   * @returns {void}
   * @private
   */
  handleDisconnect(socket, reason) {
    const userId = socket.handshake.query.userId;
    this.userSocketMap.delete(userId);
    this.rateLimitMap.delete(socket.id);
    for (const [room, socketIds] of this.roomSocketMap) {
      socketIds.delete(socket.id);
      if (socketIds.size === 0) {
        this.roomSocketMap.delete(room);
      }
    }
    logInfo('Utilisateur déconnecté du WebSocket', { userId, reason });
    this.io.emit('userDisconnected', { userId, reason });
  }

  /**
   * Émet un événement à un utilisateur spécifique.
   * @param {string} userId - ID de l'utilisateur.
   * @param {string} event - Nom de l'événement.
   * @param {any} data - Données à émettre.
   * @returns {void}
   */
  emitToUser(userId, event, data) {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      logInfo('Événement émis à l\'utilisateur', { userId, event });
    } else {
      logWarn('Utilisateur non connecté pour l\'émission d\'événement', { userId, event });
    }
  }

  /**
   * Émet un événement à une room spécifique.
   * @param {string} room - Nom de la room.
   * @param {string} event - Nom de l'événement.
   * @param {any} data - Données à émettre.
   * @returns {void}
   */
  emitToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
    logInfo('Événement émis à la room', { room, event });
  }

  /**
   * Émet un événement à tous les utilisateurs connectés.
   * @param {string} event - Nom de l'événement.
   * @param {any} data - Données à émettre.
   * @returns {void}
   */
  broadcast(event, data) {
    this.io.emit(event, data);
    logInfo('Événement broadcasté', { event });
  }

  /**
   * Ferme le serveur WebSocket.
   * @param {Function} [fn] - Callback optionnel.
   * @returns {Promise<void>}
   */
  async close(fn) {
    try {
      await this.io.close();
      this.userSocketMap.clear();
      this.roomSocketMap.clear();
      this.rateLimitMap.clear();
      logInfo('Serveur WebSocket fermé');
      fn?.();
    } catch (error) {
      logError('Erreur lors de la fermeture du serveur WebSocket', { error: error.message });
      throw new AppError(500, 'Erreur serveur lors de la fermeture du serveur WebSocket', error.message);
    }
  }
}

module.exports = new SocketService();
