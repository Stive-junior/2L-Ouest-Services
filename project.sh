#!/bin/bash

# ==============================================================================
# Script de création de l'arborescence du projet pour L&L Ouest Services
# Auteur: Gemini AI
# Date: 15 août 2025
# Description: Ce script crée la structure de fichiers et de dossiers
#              pour un projet full-stack avec un backend Node.js et un frontend
#              statique, en y insérant des contenus de base.
# ==============================================================================

echo "✅ Démarrage de la création de la structure de projet L&L Ouest Services..."

# ------------------------------------------------------------------------------
# Création des dossiers du backend
# ------------------------------------------------------------------------------
echo "📁 Création des dossiers du backend..."
mkdir -p backend/config backend/controllers backend/middleware backend/models backend/repositories backend/routes backend/services backend/utils
mkdir -p backend/public/uploads
mkdir -p backend/test

# ------------------------------------------------------------------------------
# Création des fichiers du backend avec contenu prérempli
# ------------------------------------------------------------------------------
echo "📝 Création des fichiers du backend avec contenu de base..."
touch backend/.env
echo "const express = require('express');\nconst app = express();\n\n// TODO: Initialiser Firebase, Socket.io et les routes\n\napp.get('/', (req, res) => res.send('Backend is running!'));\n\nconst PORT = process.env.PORT || 3000;\napp.listen(PORT, () => console.log(`Server running on port ${PORT}`));" > backend/app.js
echo "{\n  \"name\": \"ll-ouest-services-backend\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Backend for L&L Ouest Services website\",\n  \"main\": \"app.js\",\n  \"scripts\": {\n    \"start\": \"node app.js\",\n    \"dev\": \"nodemon app.js\",\n    \"test\": \"jest\"\n  },\n  \"dependencies\": {\n    \"express\": \"^4.18.2\",\n    \"firebase-admin\": \"^11.11.0\",\n    \"socket.io\": \"^4.7.2\",\n    \"nodemailer\": \"^6.9.5\",\n    \"dotenv\": \"^16.3.1\",\n    \"cors\": \"^2.8.5\",\n    \"express-rate-limit\": \"^7.1.0\"\n  },\n  \"devDependencies\": {\n    \"nodemon\": \"^3.0.1\",\n    \"jest\": \"^29.7.0\",\n    \"supertest\": \"^6.3.3\"\n  }\n}" > backend/package.json

echo "const admin = require('firebase-admin');\n// TODO: Add service account key\n// const serviceAccount = require('./serviceAccountKey.json');\n// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });\n\nexports.db = admin.firestore();\nexports.auth = admin.auth();\nexports.storage = admin.storage();\nexports.messaging = admin.messaging();" > backend/config/firebase.js
echo "// General configurations\nexports.PORT = process.env.PORT || 3000;\nexports.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';\nexports.API_BASE_URL = '/api/v1';" > backend/config/config.js
echo "require('dotenv').config();\nconst Joi = require('joi');\n\nconst envVarsSchema = Joi.object({\n  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),\n  PORT: Joi.number().default(3000),\n  FIREBASE_SERVICE_ACCOUNT: Joi.string().required().description('Firebase service account key file path'),\n  SMTP_HOST: Joi.string().required().description('SMTP server host'),\n  SMTP_PORT: Joi.number().required().description('SMTP server port'),\n  SMTP_USER: Joi.string().required().description('SMTP username'),\n  SMTP_PASS: Joi.string().required().description('SMTP password'),\n}).unknown()\n\nconst { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);\n\nif (error) {\n  throw new Error(`Config validation error: ${error.message}`);\n}\n\nmodule.exports = envVars;" > backend/config/env.js

echo "// Auth Controller\nexports.login = async (req, res) => { /* TODO: Implémenter la logique de connexion */ };\nexports.register = async (req, res) => { /* TODO: Implémenter la logique d'inscription */ };" > backend/controllers/authController.js
echo "// Contact Controller\nexports.sendContact = async (req, res) => { /* TODO: Implémenter l'envoi du formulaire de contact */ };" > backend/controllers/contactController.js
echo "// Service Controller\nexports.getServices = async (req, res) => { /* TODO: Implémenter la récupération des services */ };" > backend/controllers/serviceController.js
echo "// Review Controller\nexports.postReview = async (req, res) => { /* TODO: Implémenter la soumission d'un avis */ };" > backend/controllers/reviewController.js
echo "// Chat Controller\nexports.handleChat = (io) => { io.on('connection', socket => { /* TODO: Gérer la connexion WebSocket */ }); };" > backend/controllers/chatController.js
echo "// Notification Controller\nexports.sendNotif = async (req, res) => { /* TODO: Implémenter l'envoi de notifications */ };" > backend/controllers/notificationController.js
echo "// Admin Controller\nexports.updateContent = async (req, res) => { /* TODO: Implémenter la mise à jour des contenus */ };" > backend/controllers/adminController.js
echo "// Document Controller\nexports.generateReceipt = async (req, res) => { /* TODO: Implémenter la génération de reçus */ };" > backend/controllers/documentController.js

echo "const admin = require('firebase-admin');\nexports.verifyToken = async (req, res, next) => { /* TODO: Vérifier le token JWT */ };" > backend/middleware/authMiddleware.js
echo "exports.errorHandler = (err, req, res, next) => { /* TODO: Gérer les erreurs de l'application */ };" > backend/middleware/errorMiddleware.js
echo "const rateLimit = require('express-rate-limit');\nexports.apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });" > backend/middleware/rateLimitMiddleware.js
echo "const cors = require('cors');\nexports.corsOptions = { origin: process.env.FRONTEND_URL };" > backend/middleware/corsMiddleware.js

echo "// Firestore schema for users\nconst userSchema = { email: 'string', role: 'string' };" > backend/models/userModel.js
echo "// Firestore schema for services\nconst serviceSchema = { name: 'string', description: 'string', price: 'number' };" > backend/models/serviceModel.js
echo "// Firestore schema for reviews\nconst reviewSchema = { author: 'string', rating: 'number', text: 'string' };" > backend/models/reviewModel.js
echo "// Firestore schema for contacts\nconst contactSchema = { name: 'string', email: 'string', message: 'string' };" > backend/models/contactModel.js
echo "// Firestore schema for chat messages\nconst chatMessageSchema = { senderId: 'string', text: 'string', timestamp: 'timestamp' };" > backend/models/chatMessageModel.js

echo "exports.getUserById = async (id) => { /* TODO: Récupérer un utilisateur */ };" > backend/repositories/userRepo.js
echo "exports.getServices = async () => { /* TODO: Récupérer les services */ };" > backend/repositories/serviceRepo.js
echo "exports.getReviews = async () => { /* TODO: Récupérer les avis */ };" > backend/repositories/reviewRepo.js
echo "exports.saveContact = async (data) => { /* TODO: Sauvegarder une demande de contact */ };" > backend/repositories/contactRepo.js
echo "exports.saveMessage = async (data) => { /* TODO: Sauvegarder un message de chat */ };" > backend/repositories/chatRepo.js

echo "const router = require('express').Router();\n// TODO: Définir les routes d'authentification\nmodule.exports = router;" > backend/routes/authRoutes.js
echo "const router = require('express').Router();\n// TODO: Définir les routes de contact\nmodule.exports = router;" > backend/routes/contactRoutes.js
echo "const router = require('express').Router();\n// TODO: Définir les routes de services\nmodule.exports = router;" > backend/routes/serviceRoutes.js
echo "const router = require('express').Router();\n// TODO: Définir les routes d'avis\nmodule.exports = router;" > backend/routes/reviewRoutes.js
echo "const router = require('express').Router();\n// TODO: Définir les routes de chat (pour initialiser la connexion)\nmodule.exports = router;" > backend/routes/chatRoutes.js
echo "const router = require('express').Router();\n// TODO: Définir les routes de notifications\nmodule.exports = router;" > backend/routes/notificationRoutes.js
echo "const router = require('express').Router();\n// TODO: Définir les routes d'administration\nmodule.exports = router;" > backend/routes/adminRoutes.js

echo "const nodemailer = require('nodemailer');\nexports.sendEmail = async (options) => { /* TODO: Implémenter l'envoi d'e-mails */ };" > backend/services/emailService.js
echo "const admin = require('firebase-admin');\nexports.sendPushNotification = async (token, payload) => { /* TODO: Implémenter l'envoi de notifications push */ };" > backend/services/notificationService.js
echo "const admin = require('firebase-admin');\nexports.uploadFile = async (file) => { /* TODO: Implémenter l'upload de fichiers */ };" > backend/services/storageService.js
echo "const winston = require('winston');\nconst logger = winston.createLogger({ /* TODO: Configurer le logger */ });\nmodule.exports = logger;" > backend/services/loggerService.js
echo "// Document Service\nconst PDFDocument = require('pdfkit');\nexports.generatePDFReceipt = async (data) => { /* TODO: Implémenter la génération de PDF */ };" > backend/services/documentService.js
echo "// Socket Service\nexports.initSocket = (server) => { /* TODO: Initialiser Socket.io */ };" > backend/services/socketService.js

echo "exports.handleApiError = (res, err) => { /* TODO: Gérer les erreurs d'API */ };" > backend/utils/errorUtils.js
echo "const Joi = require('joi');\nexports.contactSchema = Joi.object({ /* TODO: Schéma de validation */ });" > backend/utils/validationUtils.js
echo "exports.formatDate = (date) => { /* TODO: Formater la date */ };" > backend/utils/helperUtils.js

touch backend/test/auth.test.js
touch backend/test/api.test.js

# ------------------------------------------------------------------------------
# Création des dossiers du frontend
# ------------------------------------------------------------------------------
echo "📁 Création des dossiers du frontend..."
mkdir -p frontend/public/css frontend/public/js/modules frontend/public/assets/{images,videos,icons}
touch frontend/package.json
touch frontend/postcss.config.js
touch frontend/tailwind.config.js

# ------------------------------------------------------------------------------
# Création des fichiers du frontend avec contenu prérempli
# ------------------------------------------------------------------------------
echo "📝 Création des fichiers du frontend avec contenu de base..."
echo "<!DOCTYPE html>\n<html lang=\"fr\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Accueil - L&L Ouest Services</title>\n  <link rel=\"stylesheet\" href=\"/css/tailwind.css\">\n  <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css\">\n  <script src=\"/js/main.js\" defer></script>\n</head>\n<body>\n  \n</body>\n</html>" > frontend/public/index.html
echo "<!DOCTYPE html>\n<html lang=\"fr\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>À propos - L&L Ouest Services</title>\n  <link rel=\"stylesheet\" href=\"/css/tailwind.css\">\n</head>\n<body>\n  \n</body>\n</html>" > frontend/public/about.html
echo "/* Tailwind CSS styles will be compiled here */" > frontend/public/css/tailwind.css

echo "document.addEventListener('DOMContentLoaded', () => {\n  console.log('Main script loaded');\n  // TODO: Initialiser les bibliothèques (AOS, Swiper, etc.)\n});" > frontend/public/js/main.js
echo "import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';\n// TODO: Gérer l'authentification côté client" > frontend/public/js/modules/auth.js
echo "exports.sendContactForm = async (formData) => { /* TODO: Envoyer le formulaire de contact via API */ };" > frontend/public/js/modules/contact.js
echo "import io from 'https://cdn.socket.io/4.7.2/socket.io.esm.js';\n// TODO: Gérer le chat WebSocket côté client" > frontend/public/js/modules/chat.js
echo "import L from 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';\n// TODO: Initialiser la carte Leaflet" > frontend/public/js/modules/map.js
echo "// Scripts pour le dashboard admin" > frontend/public/js/modules/admin.js
echo "import { getMessaging } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging.js';\n// TODO: Gérer les notifications push" > frontend/public/js/modules/notifications.js
echo "exports.lazyLoadImages = () => { /* TODO: Implémenter le lazy loading */ };" > frontend/public/js/modules/utils.js
echo "exports.api = { getServices: () => fetch('/api/v1/services'), postContact: (data) => fetch('/api/v1/contact', { method: 'POST', body: data }) };" > frontend/public/js/api.js

# Création des fichiers pour les autres pages
echo "" > frontend/public/services.html
echo "" > frontend/public/realizations.html
echo "" > frontend/public/reviews.html
echo "" > frontend/public/contact.html
echo "" > frontend/public/mentions.html
echo "" > frontend/public/admin.html
touch frontend/public/assets/images/logo.png
touch frontend/public/assets/images/placeholder.jpg
touch frontend/public/assets/videos/placeholder.mp4
touch frontend/public/assets/icons/placeholder.svg

# Création des fichiers de configuration à la racine
echo "module.exports = {\n  content: [\"./frontend/public/**/*.{html,js}\"],\n  theme: {\n    extend: {\n      colors: {\n        'll-white': '#FFFFFF',\n        'll-green-vif': '#23953D',\n        'll-blue-moyen': '#3582AE',\n        'll-green-profond-1': '#1A9135',\n        'll-green-profond-2': '#1D9238',\n        'll-green-profond-3': '#1B9136',\n        'll-gris-clair': '#F4F4F4',\n        'll-gris-anthracite': '#333333',\n        'll-bleu-ciel': '#A9D6E5',\n        'll-beige-doux': '#FAF3E0',\n      },\n    },\n  },\n  plugins: [],\n}" > frontend/tailwind.config.js
echo "module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}" > frontend/postcss.config.js
echo "{\n  \"name\": \"ll-ouest-services-frontend\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Frontend for L&L Ouest Services website\",\n  \"scripts\": {\n    \"build:css\": \"tailwindcss -i ./frontend/tailwind-input.css -o ./frontend/public/css/tailwind.css\",\n    \"watch:css\": \"tailwindcss -i ./frontend/tailwind-input.css -o ./frontend/public/css/tailwind.css --watch\"\n  },\n  \"devDependencies\": {\n    \"tailwindcss\": \"^3.3.3\",\n    \"postcss\": \"^8.4.31\",\n    \"autoprefixer\": \"^10.4.16\"\n  }\n}" > frontend/package.json

# Fichiers à la racine du projet
echo "node_modules\n.env\n/backend/public/uploads" > .gitignore
echo "# Projet L&L Ouest Services\n\nCe dépôt contient le code source du site web de L&L Ouest Services.\n\n## Structure du projet\n- `backend/`: Serveur Node.js avec Express et Firebase\n- `frontend/`: Site web statique (HTML, CSS, JS) servi via un hébergeur comme Vercel\n\n## Installation\n1. `npm install` dans le dossier `backend`\n2. `npm install` dans le dossier `frontend`\n\n## Lancement du développement\n- Dans `backend/` : `npm run dev`\n- Dans `frontend/` : `npm run watch:css`" > README.md
echo "root = true\n\n[*]\nindent_style = space\nindent_size = 2\nend_of_line = lf\ncharset = utf-8\ntrim_trailing_whitespace = true\ninsert_final_newline = true" > .editorconfig
echo "{\n  \"semi\": true,\n  \"trailingComma\": \"es5\",\n  \"singleQuote\": true,\n  \"printWidth\": 80\n}" > .prettierrc

echo "✅ Structure de projet créée et prête pour le développement!"