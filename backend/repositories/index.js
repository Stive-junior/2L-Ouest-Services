/**
 * @file index.js
 * @description Centralise les instances des repositories et les références aux collections Firestore
 * pour le projet L&L Ouest Services. Fournit un point d'accès unique pour les repositories.
 * @module repositories/index
 */

const { db } = require('../config/firebase');
const UserRepository = require('./userRepo');
const ServiceRepository = require('./serviceRepo');
const ReviewRepository = require('./reviewRepo');
const ContactRepository = require('./contactRepo');
const ChatRepository = require('./chatRepo');
const { logger, logInfo, logError } = require('../services/loggerService');
const { AppError } = require('../utils/errorUtils');

/**
 * @constant {Object} collections
 * @description Références aux collections Firestore utilisées par les repositories.
 * @type {{ users: admin.firestore.CollectionReference, services: admin.firestore.CollectionReference, reviews: admin.firestore.CollectionReference, contacts: admin.firestore.CollectionReference, chatMessages: admin.firestore.CollectionReference }}
 */
const collections = {
  users: db.collection('users'),
  services: db.collection('services'),
  reviews: db.collection('reviews'),
  contacts: db.collection('contacts'),
  chatMessages: db.collection('chatMessages'),
};

/**
 * @function initializeRepositories
 * @description Initialise les instances des repositories avec les références aux collections.
 * @returns {{ userRepo: UserRepository, serviceRepo: ServiceRepository, reviewRepo: ReviewRepository, contactRepo: ContactRepository, chatRepo: ChatRepository }}
 */
const initializeRepositories = () => {
  try {
    logInfo('Initialisation des repositories');
    return {
      userRepo: new UserRepository(collections.users),
      serviceRepo: new ServiceRepository(collections.services),
      reviewRepo: new ReviewRepository(collections.reviews),
      contactRepo: new ContactRepository(collections.contacts),
      chatRepo: new ChatRepository(collections.chatMessages),
    };
  } catch (error) {
    logError('Erreur lors de l\'initialisation des repositories', { error: error.message });
    throw new AppError(500, 'Erreur lors de l\'initialisation des repositories', error.message);
  }
};

module.exports = {
  collections,
  ...initializeRepositories(),
};