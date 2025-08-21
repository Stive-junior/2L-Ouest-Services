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
  constructor(collection) {
    this.collection = collection;
  }

  /**
   * Convertit un document Firestore en format API utilisateur.
   * @param {Object} doc - Document Firestore avec ID.
   * @returns {Object} Utilisateur formaté.
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
   * @param {Object} user - Utilisateur API.
   * @returns {Object} Données Firestore.
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
   * @param {Object} userData - Données de l'utilisateur.
   * @returns {Promise<Object>} Utilisateur créé.
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
      logError('Erreur lors de la création de l\'utilisateur', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la création de l\'utilisateur', error.message);
    }
  }

  /**
   * Récupère un utilisateur par son ID.
   * @async
   * @param {string} id - ID de l'utilisateur.
   * @returns {Promise<Object>} Utilisateur trouvé.
   */
  async getById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        logError('Utilisateur non trouvé', { id });
        throw new AppError(404, 'Utilisateur non trouvé');
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
   * @returns {Promise<Object>} Utilisateur trouvé.
   */
  async getByEmail(email) {
    try {
      const query = this.collection.where('email', '==', email).limit(1);
      const snapshot = await query.get();
      if (snapshot.empty) {
        logError('Utilisateur non trouvé par email', { email });
        throw new AppError(404, 'Utilisateur non trouvé');
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
   */
  async update(id, userData) {
    try {
      const existingUser = await this.getById(id);
      const { value, error } = validate({ ...existingUser, ...userData, id }, userSchema);
      if (error) {
        logError('Erreur de validation lors de la mise à jour de l\'utilisateur', { error: error.details });
        throw new AppError(400, 'Données utilisateur invalides', error.details);
      }

      const docRef = this.collection.doc(id);
      await docRef.update(this.toFirestore(value));
      logAudit('Utilisateur mis à jour', { userId: id, email: value.email });
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
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        logError('Utilisateur non trouvé pour suppression', { id });
        throw new AppError(404, 'Utilisateur non trouvé');
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
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<{ users: Object[], total: number, page: number, totalPages: number }>}
   */
  async getByRole(role, page = 1, limit = 10) {
    try {
      const query = this.collection.where('role', '==', role).orderBy('createdAt', 'desc');
      const { results, total, totalPages } = await paginateResults(query, page, limit);
      const users = results.map(doc => this.fromFirestore({ id: doc.id, data: () => doc.data() }));
      logInfo('Utilisateurs récupérés par rôle', { role, page, limit, total });
      return { users, total, page, totalPages };
    } catch (error) {
      logError('Erreur lors de la récupération des utilisateurs par rôle', { error: error.message, role });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des utilisateurs par rôle', error.message);
    }
  }

  /**
   * Récupère tous les utilisateurs avec pagination.
   * @async
   * @param {number} page - Numéro de page.
   * @param {number} limit - Limite par page.
   * @returns {Promise<{ users: Object[], total: number, page: number, totalPages: number }>}
   */
  async getAll(page = 1, limit = 10) {
    try {
      const query = this.collection.orderBy('createdAt', 'desc');
      const { results, total, totalPages } = await paginateResults(query, page, limit);
      const users = results.map(doc => this.fromFirestore({ id: doc.id, data: () => doc.data() }));
      logInfo('Tous les utilisateurs récupérés', { page, limit, total });
      return { users, total, page, totalPages };
    } catch (error) {
      logError('Erreur lors de la récupération de tous les utilisateurs', { error: error.message });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de tous les utilisateurs', error.message);
    }
  }

  /**
   * Ajoute une facture à un utilisateur.
   * @async
   * @param {string} id - ID de l'utilisateur.
   * @param {Object} invoice - Données de la facture.
   * @returns {Promise<Object>} Utilisateur mis à jour.
   */
  async addInvoice(id, invoice) {
    try {
      const { value, error } = validate({ invoice }, invoiceSchema);
      if (error) {
        logError('Erreur de validation lors de l\'ajout de la facture', { error: error.details });
        throw new AppError(400, 'Données de facture invalides', error.details);
      }

      const existingUser = await this.getById(id);
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
   * @returns {Promise<void>}
   */
  async deleteInvoice(userId, invoiceId) {
    try {
      const user = await this.getById(userId);
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
   */
  async updatePreferences(id, preferences) {
    try {
      const { value, error } = validate({ preferences }, { preferences: userSchema.extract('preferences') });
      if (error) {
        logError('Erreur de validation lors de la mise à jour des préférences', { error: error.details });
        throw new AppError(400, 'Préférences invalides', error.details);
      }

      const existingUser = await this.getById(id);
      const docRef = this.collection.doc(id);
      await docRef.update({ preferences: value.preferences });
      logAudit('Préférences utilisateur mises à jour', { userId: id });
      return this.fromFirestore({ id, data: () => ({ ...existingUser, preferences: value.preferences }) });
    } catch (error) {
      logError('Erreur lors de la mise à jour des préférences', { error: error.message, id });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la mise à jour des préférences', error.message);
    }
  }
}

module.exports = UserRepository;
