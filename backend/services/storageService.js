/**
 * @file storageService.js
 * @description Service pour gérer les fichiers localement (images, PDFs) pour L&L Ouest Services.
 * Intègre avec serviceRepo, reviewRepo, et chatRepo pour la gestion des fichiers.
 * @module services/storageService
 */

const fs = require('fs').promises;
const path = require('path');
const { serviceRepo, reviewRepo, chatRepo } = require('../repositories/index');
const socketService = require('./socketService');
const { generateUUID } = require('../utils/helperUtils');
const { logInfo, logError, logAudit } = require('./loggerService');
const { AppError, NotFoundError } = require('../utils/errorUtils');

/**
 * @class StorageService
 * @description Gère le stockage des fichiers localement pour L&L Ouest Services.
 */
class StorageService {
  constructor() {
    this.storagePath = path.join(__dirname, '..', 'storage');
    this.baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://ll-ouest-services-backend.herokuapp.com/storage'
      : 'http://localhost:3000/storage';
  }

  /**
   * Valide le type de fichier.
   * @param {string} filePath - Chemin ou nom du fichier.
   * @returns {void}
   * @throws {AppError} Si le type de fichier n'est pas supporté.
   * @private
   */
  validateFileType(filePath) {
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(filePath).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new AppError(400, `Type de fichier non supporté : ${ext}`, 'Unsupported file type');
    }
  }

  /**
   * Crée les dossiers nécessaires pour le chemin de destination.
   * @param {string} destination - Chemin relatif dans le dossier storage.
   * @returns {Promise<void>}
   * @private
   */
  async ensureDirectory(destination) {
    const fullPath = path.join(this.storagePath, destination);
    try {
      await fs.mkdir(fullPath, { recursive: true });
    } catch (error) {
      logError('Erreur lors de la création du dossier', { error: error.message, destination });
      throw new AppError(500, 'Erreur serveur lors de la création du dossier', error.message);
    }
  }

  /**
   * Télécharge un fichier localement.
   * @param {Buffer} fileBuffer - Buffer du fichier.
   * @param {string} destination - Chemin relatif de destination (ex. 'services/serviceId/images/').
   * @param {string} fileName - Nom original du fichier.
   * @returns {Promise<string>} URL publique du fichier téléchargé.
   * @throws {AppError} Si le téléchargement du fichier échoue.
   */
  async uploadFile(fileBuffer, destination, fileName) {
    try {
      this.validateFileType(fileName);
      const uniqueFileName = `${generateUUID()}_${path.basename(fileName)}`;
      const filePath = path.join(destination, uniqueFileName);
      const fullPath = path.join(this.storagePath, filePath);
      const relativeUrl = `/storage/${filePath.replace(/\\/g, '/')}`;

      await this.ensureDirectory(destination);
      await fs.writeFile(fullPath, fileBuffer);

      const fileUrl = `${this.baseUrl}/${filePath.replace(/\\/g, '/')}`;
      logInfo('Fichier téléchargé localement', { fileName: uniqueFileName, destination });
      return fileUrl;
    } catch (error) {
      logError('Erreur lors du téléchargement du fichier', { error: error.message, destination });
      throw new AppError(500, 'Erreur serveur lors du téléchargement du fichier', error.message);
    }
  }

  /**
   * Supprime un fichier local.
   * @param {string} fileUrl - URL publique du fichier à supprimer.
   * @returns {Promise<void>}
   * @throws {AppError} Si la suppression échoue.
   */
  async deleteFile(fileUrl) {
    try {
      const relativePath = fileUrl.replace(this.baseUrl, '').replace(/^\/storage\//, '');
      const filePath = path.join(this.storagePath, relativePath);

      try {
        await fs.access(filePath);
      } catch {
        throw new NotFoundError('Fichier non trouvé', 'File not found');
      }

      await fs.unlink(filePath);
      logAudit('Fichier supprimé localement', { fileUrl });
    } catch (error) {
      logError('Erreur lors de la suppression du fichier', { error: error.message, fileUrl });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression du fichier', error.message);
    }
  }

  /**
   * Ajoute une image à un service.
   * @param {string} serviceId - ID du service.
   * @param {Buffer} fileBuffer - Buffer de l'image.
   * @param {string} fileName - Nom original du fichier.
   * @returns {Promise<string>} URL de l'image téléchargée.
   * @throws {AppError} Si l'ajout de l'image échoue.
   */
  async uploadServiceImage(serviceId, fileBuffer, fileName) {
    try {
      await serviceRepo.getById(serviceId);
      const fileUrl = await this.uploadFile(fileBuffer, `services/${serviceId}/images`, fileName);
      socketService.emitToRoom(`service:${serviceId}`, 'serviceImageAdded', { serviceId, fileUrl });
      logAudit('Image ajoutée au service', { serviceId, fileUrl });
      return fileUrl;
    } catch (error) {
      logError('Erreur lors de l\'ajout de l\'image au service', { error: error.message, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'ajout de l\'image au service', error.message);
    }
  }

  /**
   * Supprime une image d'un service.
   * @param {string} serviceId - ID du service.
   * @param {string} fileUrl - URL publique de l'image à supprimer.
   * @returns {Promise<void>}
   * @throws {AppError} Si la suppression échoue.
   */
  async deleteServiceImage(serviceId, fileUrl) {
    try {
      await serviceRepo.getById(serviceId);
      await this.deleteFile(fileUrl);
      socketService.emitToRoom(`service:${serviceId}`, 'serviceImageDeleted', { serviceId, fileUrl });
      logAudit('Image supprimée du service', { serviceId, fileUrl });
    } catch (error) {
      logError('Erreur lors de la suppression de l\'image du service', { error: error.message, serviceId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de l\'image du service', error.message);
    }
  }

  /**
   * Ajoute une image à un avis.
   * @param {string} reviewId - ID de l'avis.
   * @param {Buffer} fileBuffer - Buffer de l'image.
   * @param {string} fileName - Nom original du fichier.
   * @returns {Promise<Object>} Avis mis à jour avec la nouvelle image.
   * @throws {AppError} Si l'ajout de l'image échoue.
   */
  async uploadReviewImage(reviewId, fileBuffer, fileName) {
    try {
      const review = await reviewRepo.getById(reviewId);
      const fileUrl = await this.uploadFile(fileBuffer, `reviews/${reviewId}/images`, fileName);
      const updatedImages = [...(review.images || []), fileUrl];
      const updatedReview = await reviewRepo.update(reviewId, { ...review, images: updatedImages });
      socketService.emitToRoom(`review:${review.serviceId}`, 'reviewUpdated', { reviewId, images: updatedImages });
      logAudit('Image ajoutée à l\'avis', { reviewId, fileUrl });
      return updatedReview;
    } catch (error) {
      logError('Erreur lors de l\'ajout de l\'image à l\'avis', { error: error.message, reviewId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'ajout de l\'image à l\'avis', error.message);
    }
  }

  /**
   * Supprime une image d'un avis.
   * @param {string} reviewId - ID de l'avis.
   * @param {string} fileUrl - URL publique de l'image à supprimer.
   * @returns {Promise<void>}
   * @throws {AppError} Si la suppression échoue.
   */
  async deleteReviewImage(reviewId, fileUrl) {
    try {
      const review = await reviewRepo.getById(reviewId);
      if (!review.images || !review.images.includes(fileUrl)) {
        throw new NotFoundError('Image non trouvée dans l\'avis', 'Image not found in review');
      }
      await this.deleteFile(fileUrl);
      const updatedImages = review.images.filter(url => url !== fileUrl);
      await reviewRepo.update(reviewId, { ...review, images: updatedImages });
      socketService.emitToRoom(`review:${review.serviceId}`, 'reviewUpdated', { reviewId, images: updatedImages });
      logAudit('Image supprimée de l\'avis', { reviewId, fileUrl });
    } catch (error) {
      logError('Erreur lors de la suppression de l\'image de l\'avis', { error: error.message, reviewId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression de l\'image de l\'avis', error.message);
    }
  }

  /**
   * Ajoute un fichier à un message de chat.
   * @param {string} messageId - ID du message.
   * @param {Buffer} fileBuffer - Buffer du fichier.
   * @param {string} fileName - Nom original du fichier.
   * @returns {Promise<Object>} Message mis à jour avec le fichier.
   * @throws {AppError} Si l'ajout du fichier échoue.
   */
  async uploadChatFile(messageId, fileBuffer, fileName) {
    try {
      const message = await chatRepo.getById(messageId);
      const fileUrl = await this.uploadFile(fileBuffer, `chatMessages/${messageId}/files`, fileName);
      const updatedFiles = [...(message.files || []), fileUrl];
      const updatedMessage = await chatRepo.update(messageId, { ...message, files: updatedFiles });
      const room = `chat:${[message.senderId, message.recipientId].sort().join(':')}`;
      socketService.emitToRoom(room, 'newMessageFile', { messageId, fileUrl });
      logAudit('Fichier ajouté au message de chat', { messageId, fileUrl });
      return updatedMessage;
    } catch (error) {
      logError('Erreur lors de l\'ajout du fichier au message de chat', { error: error.message, messageId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'ajout du fichier au message de chat', error.message);
    }
  }

  /**
   * Supprime un fichier d'un message de chat.
   * @param {string} messageId - ID du message.
   * @param {string} fileUrl - URL publique du fichier à supprimer.
   * @returns {Promise<void>}
   * @throws {AppError} Si la suppression échoue.
   */
  async deleteChatFile(messageId, fileUrl) {
    try {
      const message = await chatRepo.getById(messageId);
      if (!message.files || !message.files.includes(fileUrl)) {
        throw new NotFoundError('Fichier non trouvé dans le message', 'File not found in message');
      }
      await this.deleteFile(fileUrl);
      const updatedFiles = message.files.filter(url => url !== fileUrl);
      await chatRepo.update(messageId, { ...message, files: updatedFiles });
      const room = `chat:${[message.senderId, message.recipientId].sort().join(':')}`;
      socketService.emitToRoom(room, 'messageFileDeleted', { messageId, fileUrl });
      logAudit('Fichier supprimé du message de chat', { messageId, fileUrl });
    } catch (error) {
      logError('Erreur lors de la suppression du fichier du message de chat', { error: error.message, messageId });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression du fichier du message de chat', error.message);
    }
  }
}

module.exports = new StorageService();
