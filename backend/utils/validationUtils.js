/**
 * @file validationUtils.js
 * @description Module centralisé contenant des schémas Joi pour valider les données des modèles
 * et une fonction générique pour valider les entrées API. Adapté aux besoins de L&L Ouest Services.
 * @module utils/validationUtils
 */

const Joi = require('joi');
const { AppError } = require('./errorUtils');

/**
 * @typedef {Object} ValidationResult
 * @property {Object} value - Données validées.
 * @property {AppError} [error] - Erreur de validation, si présente.
 */

/**
 * Schéma de validation pour les images d'un service.
 * @type {Joi.ObjectSchema}
 */
const imageSchema = Joi.object({
  url: Joi.string().uri().required().description('URL de l\'image'),
  type: Joi.string().valid('before', 'after', 'showcase', 'equipment').required().description('Type d\'image (avant, après, vitrine, équipement)'),
  description: Joi.string().max(255).optional().description('Description de l\'image'),
  createdAt: Joi.string().isoDate().default(() => new Date().toISOString()).description('Date de création de l\'image'),
}).label('ImageSchema');

/**
 * Schéma de validation pour les utilisateurs dans Firestore.
 * @type {Joi.ObjectSchema}
 */
const userSchema = Joi.object({
  id: Joi.string().required().description('Identifiant unique de l\'utilisateur'),
  email: Joi.string().email().required().max(255).description('Adresse email de l\'utilisateur'),
  name: Joi.string().min(2).max(100).required().description('Nom complet ou raison sociale'),
  role: Joi.string().valid('client', 'admin').default('client').description('Rôle de l\'utilisateur'),
  phone: Joi.string().pattern(/^\+\d{1,3}[\s\d\-\(\)]{4,20}$/).required().description('Numéro de téléphone international'),
  address: Joi.object({
    street: Joi.string().min(3).max(255).optional().description('Rue ou adresse des locaux'),
    city: Joi.string().min(2).max(100).optional().description('Ville'),
    postalCode: Joi.string().pattern(/^\d{5}$/).optional().description('Code postal (format France)'),
    country: Joi.string().default('France').description('Pays'),
  }).optional().allow(null).description('Adresse des locaux professionnels'),
  company: Joi.string().min(2).max(100).optional().allow(null).description('Nom de l\'entreprise (optionnel)'),
  invoices: Joi.array().items(
    Joi.object({
      id: Joi.string().required().description('Identifiant de la facture'),
      url: Joi.string().uri().optional().description('URL du document de facture'),
      date: Joi.string().isoDate().required().description('Date de la facture'),
      amount: Joi.number().positive().required().description('Montant de la facture'),
    })
  ).optional().default([]).description('Liste des factures/documents'),
  preferences: Joi.object({
    notifications: Joi.boolean().default(true).description('Préférence pour les notifications'),
    language: Joi.string().valid('fr', 'en').default('fr').description('Langue préférée'),
    fcmToken: Joi.string().optional().allow(null).description('Token FCM pour notifications'),
  }).optional().default({ notifications: true, language: 'fr', fcmToken: null }).description('Préférences utilisateur'),
  location: Joi.object({
    lat: Joi.number().optional().description('Latitude'),
    lng: Joi.number().optional().description('Longitude'),
    formattedAddress: Joi.string().max(255).optional().description('Adresse formatée'),
    placeId: Joi.string().max(255).optional().description('ID du lieu Google Maps'),
    types: Joi.array().items(Joi.string()).optional().description('Types de lieu'),
  }).optional().allow(null).description('Localisation de l\'utilisateur'),
  createdAt: Joi.string().isoDate().default(() => new Date().toISOString()).description('Date de création'),
  lastLogin: Joi.string().isoDate().optional().allow(null).description('Date de dernière connexion'),
  emailVerified: Joi.boolean().default(false).description('Statut de vérification de l\'email'),
}).label('UserSchema');


/**
 * Schéma de validation pour les services.
 * @type {Joi.ObjectSchema}
 */
const serviceSchema = Joi.object({
  id: Joi.string().uuid().required().description('Identifiant unique du service'),
  name: Joi.string().min(3).max(100).required().description('Nom du service (ex: Nettoyage de bureaux)'),
  description: Joi.string().min(10).max(1000).required().description('Description détaillée du service'),
  price: Joi.number().positive().required().description('Prix de base du service (€)'),
  area: Joi.number().positive().optional().description('Superficie en m² pour le service'),
  duration: Joi.number().positive().optional().description('Durée estimée en heures'),
  category: Joi.string().valid(
    'bureaux',
    'piscine',
    'régulier',
    'ponctuel',
    'salles de réunion',
    'sas d\'entrée',
    'réfectoire',
    'sanitaires',
    'escaliers',
    'vitrines'
  ).required().description('Catégorie du service'),
  images: Joi.array().items(imageSchema).max(20).optional().description('Images associées au service'),
  availability: Joi.object({
    isAvailable: Joi.boolean().default(true).description('Disponibilité du service'),
    schedule: Joi.array().items(
      Joi.object({
        day: Joi.string().valid('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche').required(),
        hours: Joi.array().items(Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)).required(),
      })
    ).optional().description('Horaires de disponibilité'),
  }).optional().description('Informations de disponibilité'),
  location: Joi.object({
    address: Joi.string().max(255).optional().description('Adresse du service'),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).optional().description('Latitude'),
      lng: Joi.number().min(-180).max(180).optional().description('Longitude'),
    }).optional().description('Coordonnées géographiques'),
  }).optional().description('Localisation du service'),
  createdAt: Joi.string().isoDate().default(() => new Date().toISOString()).description('Date de création'),
  updatedAt: Joi.string().isoDate().optional().description('Date de dernière mise à jour'),
}).label('ServiceSchema');


/**
 * Schéma de validation pour les avis.
 * @type {Joi.ObjectSchema}
 */
const reviewSchema = Joi.object({
  id: Joi.string().required().description('Identifiant unique de l\'avis'),
  userId: Joi.string().required().description('ID de l\'utilisateur ayant laissé l\'avis'),
  serviceId: Joi.string().required().description('ID du service concerné'),
  rating: Joi.number().integer().min(1).max(5).required().description('Note de l\'avis (1 à 5)'),
  comment: Joi.string().min(10).max(500).required().description('Commentaire de l\'avis'),
  images: Joi.array().items(Joi.string().uri()).max(5).optional().description('URLs des images jointes'),
  createdAt: Joi.string().isoDate().default(() => new Date().toISOString()).description('Date de création'),
  updatedAt: Joi.string().isoDate().optional().description('Date de mise à jour'),
}).label('ReviewSchema');

/**
 * Schéma de validation pour les messages de contact.
 * @type {Joi.ObjectSchema}
 */
const contactSchema = Joi.object({
  id: Joi.string().required().description('Identifiant unique du message'),
  name: Joi.string().min(2).max(100).required().description('Nom de la personne'),
  email: Joi.string().email().required().max(255).description('Email de contact'),
  message: Joi.string().min(10).max(1000).required().description('Message envoyé'),
  subject: Joi.string().min(3).max(100).optional().description('Objet du message'),
  createdAt: Joi.string().isoDate().default(() => new Date().toISOString()).description('Date de création'),
}).label('ContactSchema');

/**
 * Schéma de validation pour les messages de chat.
 * @type {Joi.ObjectSchema}
 */
const chatMessageSchema = Joi.object({
  id: Joi.string().required().description('Identifiant unique du message'),
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
  timestamp: Joi.string().isoDate().default(() => new Date().toISOString()).description('Date d\'envoi'),
  status: Joi.string().valid('sent', 'delivered', 'read').default('sent').description('Statut du message'),
}).label('ChatMessageSchema');

/**
 * Schéma de validation pour les factures.
 * @type {Joi.ObjectSchema}
 */
const invoiceSchema = Joi.object({
  id: Joi.string().required().description('Identifiant unique de la facture'),
  userId: Joi.string().required().description('ID de l\'utilisateur'),
  amount: Joi.number().positive().required().description('Montant total de la facture'),
  items: Joi.array().items(
    Joi.object({
      description: Joi.string().min(1).max(500).required().description('Description de l\'élément'),
      quantity: Joi.number().integer().min(1).required().description('Quantité'),
      unitPrice: Joi.number().positive().required().description('Prix unitaire'),
    })
  ).required().description('Liste des éléments de la facture'),
  date: Joi.string().isoDate().default(() => new Date().toISOString()).description('Date de création'),
  dueDate: Joi.string().isoDate().required().description('Date d\'échéance'),
  url: Joi.string().uri().optional().description('URL du fichier PDF'),
}).label('InvoiceSchema');

/**
 * @function validate
 * @description Valide des données avec un schéma Joi donné.
 * @param {Object} data - Données à valider.
 * @param {Joi.ObjectSchema} schema - Schéma Joi à utiliser.
 * @returns {ValidationResult} Résultat de la validation.
 */
const validate = (data, schema) => {
  const { value, error } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
  return {
    value,
    error: error ? new AppError(400, 'Validation failed', error.details) : null,
  };
};

module.exports = {
  userSchema,
  serviceSchema,
  reviewSchema,
  contactSchema,
  chatMessageSchema,
  invoiceSchema,
  validate,
};
