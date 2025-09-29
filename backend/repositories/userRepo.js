/**
 * @file userRepo.js
 * @description Repository pour gérer les utilisateurs dans Firestore pour L&L Ouest Services.
 * Fournit des opérations CRUD pour les utilisateurs et leurs factures avec validation et pagination.
 * Utilise userValidation.js pour la validation.
 * @module repositories/userRepo
 */

const { AppError } = require('../utils/errorUtils');
const { validate } = require('../utils/validationUtils');
const { userSchema, invoiceSchema } = require('../utils/validationUtils');
const { generateUUID, formatDate, paginateResults } = require('../utils/helperUtils');
const { logger, logInfo, logError, logAudit } = require('../services/loggerService');

/**
 * @class UserRepository
 * @description Gère les opérations CRUD pour les utilisateurs et leurs factures dans Firestore.
 */
class UserRepository {
  /**
   * @constructor
   * @param {admin.firestore.CollectionReference} collection - Référence à la collection Firestore des utilisateurs.
   */
  constructor(collection) {
    this.collection = collection;
  }

  /**
   * Convertit un document Firestore en format API utilisateur.
   * @param {Object} doc - Document Firestore avec ID.
   * @returns {Object} Utilisateur formaté pour l'API.
   */
  fromFirestore(doc) {
    return {
      id: doc.id,
      email: doc.data().email,
      name: doc.data().name,
      role: doc.data().role,
      phone: doc.data().phone || null,
      address: doc.data().address || null,
      company: doc.data().company || null,
      invoices: doc.data().invoices || [],
      preferences: doc.data().preferences || { notifications: true, language: 'fr', fcmToken: null },
      location: doc.data().location || null,
      createdAt: doc.data().createdAt || null,
      lastLogin: doc.data().lastLogin || null,
      emailVerified: doc.data().emailVerified || false,
    };
  }

  /**
   * Convertit un utilisateur API en format Firestore.
   * @param {Object} user - Utilisateur au format API.
   * @returns {Object} Données formatées pour Firestore.
   */
  toFirestore(user) {
    return {
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone || null,
      address: user.address || null,
      company: user.company || null,
      invoices: user.invoices || [],
      preferences: user.preferences || { notifications: true, language: 'fr', fcmToken: null },
      location: user.location || null,
      createdAt: user.createdAt || formatDate(new Date()),
      lastLogin: user.lastLogin || null,
      emailVerified: user.emailVerified || false,
    };
  }

  /**
   * Crée un nouvel utilisateur dans Firestore.
   * @async
   * @param {Object} userData - Données de l'utilisateur à créer.
   * @returns {Promise<Object>} Utilisateur créé.
   * @throws {AppError} En cas d'erreur de validation ou d'accès à Firestore.
   */
  async create(userData) {
    try {
      const { value, error } = validate({ ...userData, id: userData.id || generateUUID() }, userSchema);
      if (error) {
        logError('Erreur de validation lors de la création de l\'utilisateur', { error: error.details });
        throw new AppError(400, 'Données utilisateur invalides', error.details);
      }

      const docRef = this.collection.doc(value.id);
      await docRef.set(this.toFirestore(value));
      logInfo('Utilisateur créé', { userId: value.id, email: value.email });
      return this.fromFirestore({ id: value.id, data: () => value });
    } catch (error) {
      logError('Erreur lors de la création de l\'utilisateur', { error: error.message, userData });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création de l\'utilisateur', error.message);
    }
  }

  /**
   * Récupère un utilisateur par son ID.
   * @async
   * @param {string} id - ID de l'utilisateur.
   * @returns {Promise<Object|null>} Utilisateur trouvé ou null si non trouvé.
   * @throws {AppError} En cas d'erreur d'accès à Firestore.
   */
  async getById(id) {
    try {
      if (!id || typeof id !== 'string') {
        logError('ID utilisateur invalide', { id });
        throw new AppError(400, 'ID utilisateur invalide');
      }

      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        logInfo('Utilisateur non trouvé', { id });
        return null;
      }
      logInfo('Utilisateur récupéré', { id });
      return this.fromFirestore({ id: doc.id, data: () => doc.data() });
    } catch (error) {
      logError('Erreur lors de la récupération de l\'utilisateur', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de l\'utilisateur', error.message);
    }
  }

  /**
   * Récupère un utilisateur par son email.
   * @async
   * @param {string} email - Email de l'utilisateur.
   * @returns {Promise<Object|null>} Utilisateur trouvé ou null si non trouvé.
   * @throws {AppError} En cas d'erreur d'accès à Firestore.
   */
  async getByEmail(email) {
    try {
      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        logError('Email invalide', { email });
        throw new AppError(400, 'Email invalide');
      }

      const query = this.collection.where('email', '==', email.trim().toLowerCase()).limit(1);
      const snapshot = await query.get();
      if (snapshot.empty) {
        logInfo('Utilisateur non trouvé par email', { email });
        return null;
      }
      const doc = snapshot.docs[0];
      logInfo('Utilisateur récupéré par email', { email });
      return this.fromFirestore({ id: doc.id, data: () => doc.data() });
    } catch (error) {
      logError('Erreur lors de la récupération de l\'utilisateur par email', { error: error.message, email });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de l\'utilisateur par email', error.message);
    }
  }

  /**
   * Met à jour un utilisateur dans Firestore.
   * @async
   * @param {string} id - ID de l'utilisateur.
   * @param {Object} userData - Données à mettre à jour.
   * @returns {Promise<Object>} Utilisateur mis à jour.
   * @throws {AppError} En cas d'erreur de validation ou d'accès à Firestore.
   */
  async update(id, userData) {
    try {
      if (!id || typeof id !== 'string') {
        logError('ID utilisateur invalide', { id });
        throw new AppError(400, 'ID utilisateur invalide');
      }

      const existingUser = await this.getById(id);
      if (!existingUser) {
        logError('Utilisateur non trouvé pour mise à jour', { id });
        throw new AppError(404, 'Utilisateur non trouvé');
      }

      const { value, error } = validate({ ...existingUser, ...userData, id }, userSchema);
      if (error) {
        logError('Erreur de validation lors de la mise à jour de l\'utilisateur', { error: error.details });
        throw new AppError(400, 'Données utilisateur invalides', error.details);
      }

      const docRef = this.collection.doc(id);
      await docRef.update(this.toFirestore(value));
      logAudit('Utilisateur mis à jour', { userId: id, email: value.email, updatedFields: Object.keys(userData) });
      return this.fromFirestore({ id, data: () => value });
    } catch (error) {
      logError('Erreur lors de la mise à jour de l\'utilisateur', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour de l\'utilisateur', error.message);
    }
  }

  /**
   * Supprime un utilisateur de Firestore.
   * @async
   * @param {string} id - ID de l'utilisateur.
   * @returns {Promise<void>} Résultat de la suppression.
   * @throws {AppError} En cas d'erreur d'accès à Firestore.
   */
  async delete(id) {
    try {
      if (!id || typeof id !== 'string') {
        logError('ID utilisateur invalide', { id });
        throw new AppError(400, 'ID utilisateur invalide');
      }

      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        logInfo('Utilisateur non trouvé pour suppression', { id });
        return;
      }
      await this.collection.doc(id).delete();
      logAudit('Utilisateur supprimé', { id });
    } catch (error) {
      logError('Erreur lors de la suppression de l\'utilisateur', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de l\'utilisateur', error.message);
    }
  }

  /**
   * Récupère les utilisateurs par rôle avec pagination.
   * @async
   * @param {string} role - Rôle de l'utilisateur (client, admin).
   * @param {number} page - Numéro de page (par défaut 1).
   * @param {number} limit - Limite par page (par défaut 10).
   * @returns {Promise<{ users: Object[], total: number, page: number, totalPages: number }>} Liste des utilisateurs paginés.
   * @throws {AppError} En cas d'erreur d'accès à Firestore ou de manque d'index.
   */
  async getByRole(role, page = 1, limit = 10) {
    try {
      if (!['client', 'admin'].includes(role)) {
        logError('Rôle invalide', { role });
        throw new AppError(400, 'Rôle invalide. Valeurs attendues : client, admin');
      }
      if (typeof page !== 'number' || page < 1) {
        logError('Numéro de page invalide', { page });
        throw new AppError(400, 'Numéro de page invalide');
      }
      if (typeof limit !== 'number' || limit < 1 || limit > 100) {
        logError('Limite par page invalide', { limit });
        throw new AppError(400, 'Limite par page invalide (1 à 100)');
      }

      const query = this.collection.where('role', '==', role).orderBy('createdAt', 'desc');
      try {
        const { results, total, totalPages } = await paginateResults(query, page, limit);
        const users = results.map(doc => this.fromFirestore({ id: doc.id, data: () => doc.data() }));
        logInfo('Utilisateurs récupérés par rôle', { role, page, limit, total });
        return { users, total, page, totalPages };
      } catch (error) {
        if (error.code === 'failed-precondition' && error.message.includes('requires an index')) {
          logError('Index manquant pour la requête Firestore', {
            error: error.message,
            role,
            suggestion: 'Créez un index composite pour role et createdAt dans la console Firebase.',
            indexUrl: error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)?.[0],
          });
          throw new AppError(500, 'Index Firestore manquant. Veuillez créer un index composite pour role et createdAt.', error.message);
        }
        throw error;
      }
    } catch (error) {
      logError('Erreur lors de la récupération des utilisateurs par rôle', { error: error.message, role, page, limit });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des utilisateurs par rôle', error.message);
    }
  }

  /**
   * Récupère tous les utilisateurs avec pagination.
   * @async
   * @param {number} page - Numéro de page (par défaut 1).
   * @param {number} limit - Limite par page (par défaut 10).
   * @returns {Promise<{ users: Object[], total: number, page: number, totalPages: number }>} Liste des utilisateurs paginés.
   * @throws {AppError} En cas d'erreur d'accès à Firestore.
   */
  async getAll(page = 1, limit = 10) {
    try {
      if (typeof page !== 'number' || page < 1) {
        logError('Numéro de page invalide', { page });
        throw new AppError(400, 'Numéro de page invalide');
      }
      if (typeof limit !== 'number' || limit < 1 || limit > 100) {
        logError('Limite par page invalide', { limit });
        throw new AppError(400, 'Limite par page invalide (1 à 100)');
      }

      const query = this.collection.orderBy('createdAt', 'desc');
      const { results, total, totalPages } = await paginateResults(query, page, limit);
      const users = results.map(doc => this.fromFirestore({ id: doc.id, data: () => doc.data() }));
      logInfo('Tous les utilisateurs récupérés', { page, limit, total });
      return { users, total, page, totalPages };
    } catch (error) {
      logError('Erreur lors de la récupération de tous les utilisateurs', { error: error.message, page, limit });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de tous les utilisateurs', error.message);
    }
  }

  /**
   * Ajoute une facture à un utilisateur.
   * @async
   * @param {string} id - ID de l'utilisateur.
   * @param {Object} invoice - Données de la facture.
   * @returns {Promise<Object>} Utilisateur mis à jour avec la nouvelle facture.
   * @throws {AppError} En cas d'erreur de validation ou d'accès à Firestore.
   */
  async addInvoice(id, invoice) {
    try {
      if (!id || typeof id !== 'string') {
        logError('ID utilisateur invalide', { id });
        throw new AppError(400, 'ID utilisateur invalide');
      }

      const { value, error } = validate({ invoice }, invoiceSchema);
      if (error) {
        logError('Erreur de validation lors de l\'ajout de la facture', { error: error.details });
        throw new AppError(400, 'Données de facture invalides', error.details);
      }

      const existingUser = await this.getById(id);
      if (!existingUser) {
        logError('Utilisateur non trouvé pour ajout de facture', { id });
        throw new AppError(404, 'Utilisateur non trouvé');
      }

      const invoices = [...(existingUser.invoices || []), { ...value.invoice, id: value.invoice.id || generateUUID() }];
      const docRef = this.collection.doc(id);
      await docRef.update({ invoices });
      logAudit('Facture ajoutée à l\'utilisateur', { userId: id, invoiceId: value.invoice.id });
      return this.fromFirestore({ id, data: () => ({ ...existingUser, invoices }) });
    } catch (error) {
      logError('Erreur lors de l\'ajout de la facture', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'ajout de la facture', error.message);
    }
  }

  /**
   * Supprime une facture d'un utilisateur.
   * @async
   * @param {string} userId - ID de l'utilisateur.
   * @param {string} invoiceId - ID de la facture.
   * @returns {Promise<void>} Résultat de la suppression.
   * @throws {AppError} En cas d'erreur d'accès à Firestore.
   */
  async deleteInvoice(userId, invoiceId) {
    try {
      if (!userId || typeof userId !== 'string') {
        logError('ID utilisateur invalide', { userId });
        throw new AppError(400, 'ID utilisateur invalide');
      }
      if (!invoiceId || typeof invoiceId !== 'string') {
        logError('ID de facture invalide', { invoiceId });
        throw new AppError(400, 'ID de facture invalide');
      }

      const user = await this.getById(userId);
      if (!user) {
        logError('Utilisateur non trouvé pour suppression de facture', { userId });
        throw new AppError(404, 'Utilisateur non trouvé');
      }

      const invoices = (user.invoices || []).filter(inv => inv.id !== invoiceId);
      const docRef = this.collection.doc(userId);
      await docRef.update({ invoices });
      logAudit('Facture supprimée', { userId, invoiceId });
    } catch (error) {
      logError('Erreur lors de la suppression de la facture', { error: error.message, userId, invoiceId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de la facture', error.message);
    }
  }

  /**
   * Met à jour les préférences d'un utilisateur.
   * @async
   * @param {string} id - ID de l'utilisateur.
   * @param {Object} preferences - Préférences à mettre à jour.
   * @returns {Promise<Object>} Utilisateur mis à jour.
   * @throws {AppError} En cas d'erreur de validation ou d'accès à Firestore.
   */
  async updatePreferences(id, preferences) {
    try {
      if (!id || typeof id !== 'string') {
        logError('ID utilisateur invalide', { id });
        throw new AppError(400, 'ID utilisateur invalide');
      }

      const { value, error } = validate({ preferences }, { preferences: userSchema.extract('preferences') });
      if (error) {
        logError('Erreur de validation lors de la mise à jour des préférences', { error: error.details });
        throw new AppError(400, 'Préférences invalides', error.details);
      }

      const existingUser = await this.getById(id);
      if (!existingUser) {
        logError('Utilisateur non trouvé pour mise à jour des préférences', { id });
        throw new AppError(404, 'Utilisateur non trouvé');
      }

      const docRef = this.collection.doc(id);
      await docRef.update({ preferences: value.preferences });
      logAudit('Préférences utilisateur mises à jour', { userId: id, updatedPreferences: Object.keys(preferences) });
      return this.fromFirestore({ id, data: () => ({ ...existingUser, preferences: value.preferences }) });
    } catch (error) {
      logError('Erreur lors de la mise à jour des préférences', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour des préférences', error.message);
    }
  }
}

module.exports = UserRepository;
