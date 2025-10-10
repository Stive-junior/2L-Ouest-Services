/**
 * @file chatRoutes.js
 * @description Routes pour gérer les messages dans L&L Ouest Services.
 * Applique les middlewares pour l'authentification et la validation.
 * @module routes/chatRoutes
 */

const express = require('express');
const router = express.Router();
const { authenticate, validationMiddleware } = require('../middleware');
const { sendMessage, getMessage, updateMessage, deleteMessage, getConversation, markMessageAsRead, getUserMessages, uploadChatFile, deleteChatFile } = require('../controllers/chatController');
const { sendMessageSchema, idSchema, updateMessageSchema, conversationSchema, paginationSchema, fileSchema, deleteFileSchema } = require('../utils/validation/chatValidation');

// Routes protégées par authentification
router.use(authenticate);

router.post('/messages', [validationMiddleware(sendMessageSchema)], sendMessage);
router.get('/messages/:id', [validationMiddleware(idSchema)], getMessage);
router.put('/messages/:id', [validationMiddleware(updateMessageSchema)], updateMessage);
router.delete('/messages/:id', [validationMiddleware(idSchema)], deleteMessage);
router.get('/:recipientId', [validationMiddleware(conversationSchema)], getConversation);
router.patch('/messages/:id/read', [validationMiddleware(idSchema)], markMessageAsRead);
router.get('/', [validationMiddleware(paginationSchema)], getUserMessages);
router.post('/messages/:id/file', [validationMiddleware(fileSchema)], uploadChatFile);
router.delete('/messages/:id/file', [validationMiddleware(deleteFileSchema)], deleteChatFile);

