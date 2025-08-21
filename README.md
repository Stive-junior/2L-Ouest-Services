# 2L-Ouest-Services
Prestation de services de nettoyage professionnel


project-root/
├── backend/
│   ├── config/
│   │   ├── firebase.js          # Configuration et initialisation de Firebase (Auth, Firestore, Storage, Messaging)
│   │   └── config.js            # Configurations générales (ports, URLs, etc.)
│   ├── controllers/
│   │   ├── authController.js    # Contrôleurs pour l'authentification (login, register, logout)
│   │   ├── contactController.js # Contrôleurs pour les formulaires de contact et envois d'emails
│   │   ├── serviceController.js # Contrôleurs pour la gestion des services (CRUD)
│   │   ├── reviewController.js  # Contrôleurs pour les avis et témoignages clients
│   │   ├── chatController.js    # Contrôleurs pour la gestion du chat instantané via WebSockets
│   │   ├── notificationController.js # Contrôleurs pour les notifications push/email
│   │   └── adminController.js   # Contrôleurs pour le dashboard admin (mises à jour contenus)
│   ├── middleware/
│   │   ├── authMiddleware.js    # Middleware pour vérification JWT via Firebase Auth
│   │   ├── errorMiddleware.js   # Middleware pour gestion des erreurs globales
│   │   ├── rateLimitMiddleware.js # Middleware pour limitation de taux (anti-DDoS)
│   │   └── corsMiddleware.js    # Middleware pour configuration CORS
│   ├── models/
│   │   ├── userModel.js         # Schéma Firestore pour les utilisateurs (admins/clients)
│   │   ├── serviceModel.js      # Schéma pour les services de nettoyage
│   │   ├── reviewModel.js       # Schéma pour les avis clients
│   │   ├── contactModel.js      # Schéma pour les demandes de contact
│   │   └── chatMessageModel.js  # Schéma pour les messages de chat
│   ├── repositories/
│   │   ├── userRepo.js          # Repository pour opérations DB sur users via Firestore
│   │   ├── serviceRepo.js       # Repository pour services
│   │   ├── reviewRepo.js        # Repository pour reviews
│   │   ├── contactRepo.js       # Repository pour contacts
│   │   └── chatRepo.js          # Repository pour chat messages
│   ├── routes/
│   │   ├── authRoutes.js        # Routes API pour authentification
│   │   ├── contactRoutes.js     # Routes pour contacts et formulaires
│   │   ├── serviceRoutes.js     # Routes pour gestion services
│   │   ├── reviewRoutes.js      # Routes pour avis
│   │   ├── chatRoutes.js        # Routes pour initialisation chat (WebSocket endpoints)
│   │   ├── notificationRoutes.js # Routes pour notifications
│   │   └── adminRoutes.js       # Routes pour admin dashboard APIs
│   ├── services/
│   │   ├── emailService.js      # Service pour envoi emails via Nodemailer/SendGrid
│   │   ├── notificationService.js # Service pour push notifications via Firebase Messaging
│   │   ├── storageService.js    # Service pour upload/stockage fichiers via Firebase Storage
│   │   └── loggerService.js     # Service pour logging (console + fichiers si besoin)
│   ├── utils/
│   │   ├── errorUtils.js        # Utilitaires pour gestion erreurs
│   │   ├── validationUtils.js   # Utilitaires pour validation données (Joi ou custom)
│   │   └── helperUtils.js       # Fonctions helpers générales (dates, strings)
│   ├── app.js                   # Fichier principal du serveur Express + Socket.io
│   ├── .env                     # Variables d'environnement (clés Firebase, SMTP, etc.)
│   └── package.json             # Dépendances Node.js (express, socket.io, firebase-admin, etc.)
├── frontend/
│   ├── public/
│   │   ├── index.html           # Page Accueil
│   │   ├── about.html           # Page A propos
│   │   ├── services.html        # Page Nos Services
│   │   ├── realizations.html    # Page Réalisations (photos/vidéos avant/après)
│   │   ├── reviews.html         # Page Avis Clients
│   │   ├── contact.html         # Page Contact
│   │   ├── mentions.html        # Page Mentions Légales et RGPD
│   │   └── admin.html           # Dashboard Admin (protégé par auth)
│   ├── css/
│   │   └── tailwind.css         # Fichier CSS généré par Tailwind (post-process)
│   ├── js/
│   │   ├── main.js              # Script principal (init AOS, Swiper, etc.)
│   │   ├── auth.js              # Gestion authentification front (Firebase Auth SDK)
│   │   ├── contact.js           # Script pour formulaire contact (fetch API)
│   │   ├── chat.js              # Script pour chat instantané (Socket.io client + RxJS observables)
│   │   ├── map.js               # Intégration Leaflet pour maps
│   │   ├── admin.js             # Scripts pour dashboard admin (CRUD via APIs)
│   │   ├── notifications.js     # Gestion notifications front (Firebase Messaging SDK)
│   │   └── utils.js             # Utilitaires front (error handling, lazy loading)
│   ├── assets/
│   │   ├── images/              # Dossier pour images statiques (logo, etc.)
│   │   │   └── logo.png         # Exemple : Logo entreprise (fourni par client)
│   │   ├── videos/              # Dossier pour vidéos statiques
│   │   └── icons/               # Dossier pour icônes (Heroicons ou custom)
│   └── tailwind.config.js       # Configuration Tailwind CSS (palette couleurs personnalisée)
├── .gitignore                   # Fichiers à ignorer (node_modules, .env, etc.)
├── README.md                    # Documentation projet
└── deploy.sh                    # Script shell pour déploiement (ex. Vercel pour front, Firebase pour back)