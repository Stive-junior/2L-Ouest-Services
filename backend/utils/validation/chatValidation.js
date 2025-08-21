/**
 * @file chatValidation.js
 * @description Schémas Joi pour valider les opérations de chat dans L&L Ouest Services.
 * @module utils/validation/chatValidation
 */

const Joi = require('joi');
const { userSchema } = require('../validationUtils');

/**
 * Schéma pour envoyer un message.
 * @type {Joi.ObjectSchema}
 */
const sendMessageSchema = Joi.object({
  senderId: Joi.string().required().description('ID de l\'expéditeur'),
  recipientId: Joi.string().required().description('ID du destinataire'),
  content: Joi.alternatives().try(
    Joi.string().min(1).max(1000).description('Contenu textuel du message'),
    Joi.object({
      type: Joi.string().valid('image', 'file', 'audio', 'video').required().description('Type de contenu'),
      url: Joi.string().uri().required().description('URL du fichier'),
      metadata: Joi.object({
        fileName: Joi.string().max(255).optional().description('Nom du fichier'),
        fileSize: Joi.number().positive().optional().description('Taille du fichier en octets'),
        mimeType: Joi.string().pattern(/^[\w-]+\/[\w-]+$/).optional().description('Type MIME'),
        duration: Joi.number().positive().optional().description('Durée pour audio/vidéo (en secondes)'),
      }).optional().description('Métadonnées du fichier'),
    }).description('Contenu multimédia')
  ).required().description('Contenu du message (texte ou multimédia)'),
}).label('SendMessageSchema');

/**
 * Schéma pour l'ID de message.
 * @type {Joi.ObjectSchema}
 */
const idSchema = Joi.object({
  id: Joi.string().required().description('Identifiant unique du message'),
}).label('IdSchema');

/**
 * Schéma pour mettre à jour un message.
 * @type {Joi.ObjectSchema}
 */
const updateMessageSchema = Joi.object({
  id: Joi.string().required().description('Identifiant unique du message'),
  content: Joi.alternatives().try(
    Joi.string().min(1).max(1000).description('Contenu textuel du message'),
    Joi.object({
      type: Joi.string().valid('image', 'file', 'audio', 'video').required().description('Type de contenu'),
      url: Joi.string().uri().required().description('URL du fichier'),
      metadata: Joi.object({
        fileName: Joi.string().max(255).optional().description('Nom du fichier'),
        fileSize: Joi.number().positive().optional().description('Taille du fichier en octets'),
        mimeType: Joi.string().pattern(/^[\w-]+\/[\w-]+$/).optional().description('Type MIME'),
        duration: Joi.number().positive().optional().description('Durée pour audio/vidéo (en secondes)'),
      }).optional().description('Métadonnées du fichier'),
    }).description('Contenu multimédia')
  ).optional().description('Contenu du message (texte ou multimédia)'),
  status: Joi.string().valid('sent', 'delivered', 'read').optional().description('Statut du message'),
}).label('UpdateMessageSchema');

/**
 * Schéma pour récupérer une conversation.
 * @type {Joi.ObjectSchema}
 */
const conversationSchema = Joi.object({
  recipientId: userSchema.extract('id').required().description('ID du destinataire'),
  page: Joi.number().integer().min(1).default(1).description('Numéro de page'),
  limit: Joi.number().integer().min(1).max(100).default(10).description('Limite par page'),
}).label('ConversationSchema');

/**
 * Schéma pour la pagination.
 * @type {Joi.ObjectSchema}
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).description('Numéro de page'),
  limit: Joi.number().integer().min(1).max(100).default(10).description('Limite par page'),
}).label('PaginationSchema');

/**
 * Schéma pour ajouter un fichier à un message.
 * @type {Joi.ObjectSchema}
 */
const fileSchema = Joi.object({
  id: Joi.string().required().description('Identifiant unique du message'),
}).label('FileSchema');

/**
 * Schéma pour supprimer un fichier d'un message.
 * @type {Joi.ObjectSchema}
 */
const deleteFileSchema = Joi.object({
  id: Joi.string().required().description('Identifiant unique du message'),
  fileUrl: Joi.string().uri().required().description('URL du fichier à supprimer'),
}).label('DeleteFileSchema');

module.exports = {
  sendMessageSchema,
  idSchema,
  updateMessageSchema,
  conversationSchema,
  paginationSchema,
  fileSchema,
  deleteFileSchema,
};
