### Catégories d'Issues GitHub

Voici un listing complet d'issues pour le projet GitHub, organisé par catégories. Chaque issue respecte les champs standards de création d'issues sur GitHub : **Titre**, **Description** (détaillée), **Labels** (ex. : frontend, backend, enhancement, bug), **Assignees** (fictifs comme dev1, dev2), **Milestones** (ex. : Setup Initial, MVP, V1, Tests & Déploiement). J'ai visé plus de 30 issues pour une couverture exhaustive, en les groupant logiquement. Les issues sont en français, comme demandé, pour une meilleure lisibilité dans un contexte francophone.

#### Catégorie : Setup (Configuration Initiale)
1. **Titre** : Initialiser le repository GitHub  
   **Description** : Créer un nouveau repository GitHub nommé "ll-ouest-services-site". Ajouter un .gitignore adapté pour Node.js et front-end (ignorer node_modules, .env, dist, etc.). Configurer les branches principales : main (production), develop (développement), et feature branches. Ajouter une licence MIT et un README.md basique avec overview du projet.  
   **Labels** : setup, enhancement  
   **Assignees** : dev1  
   **Milestone** : Setup Initial  

2. **Titre** : Configurer les environnements de développement  
   **Description** : Installer les dépendances globales (Node.js, npm/yarn). Créer un package.json pour le backend avec dependencies comme express, socket.io, firebase-admin, nodemailer, etc. Pour le front-end, configurer Tailwind CSS via PostCSS ou CLI, et ajouter des scripts npm pour build/watch. Inclure .env.example avec placeholders pour clés Firebase, SMTP, etc.  
   **Labels** : setup, backend, frontend  
   **Assignees** : dev1  
   **Milestone** : Setup Initial  

3. **Titre** : Initialiser Firebase pour le projet  
   **Description** : Créer un projet Firebase via console.firebase.google.com. Activer Firestore, Auth, Storage, Cloud Messaging. Télécharger le fichier de config admin SDK et l'intégrer dans backend/config/firebase.js. Tester une connexion basique avec retryConnect et verifyConnection comme dans l'exemple fourni.  
   **Labels** : setup, backend, integration  
   **Assignees** : dev2  
   **Milestone** : Setup Initial  

4. **Titre** : Créer l'arborescence des fichiers via script shell  
   **Description** : Utiliser le script create_structure.sh fourni pour générer tous les dossiers et fichiers squelettes (backend et frontend). Vérifier que tous les placeholders sont en place (ex. : imports dans controllers). Committer les changements initiaux.  
   **Labels** : setup, enhancement  
   **Assignees** : dev1  
   **Milestone** : Setup Initial  

#### Catégorie : Backend (Développement du Backend)
5. **Titre** : Implémenter la configuration Firebase complète  
   **Description** : Étendre firebase.js avec initialisation robuste pour Auth, Firestore, Storage, Messaging. Ajouter fonctions retryConnect (pour reconnexion auto) et verifyConnection (vérification ping). Gérer les erreurs avec logging. Utiliser admin SDK pour Node.js.  
   **Labels** : backend, enhancement  
   **Assignees** : dev2  
   **Milestone** : MVP  

6. **Titre** : Développer les modèles Firestore  
   **Description** : Définir les schémas dans /models : userModel.js (champs : email, role, etc.), serviceModel.js (nom, description, etc.), reviewModel.js (texte, note, userId), contactModel.js (nom, email, message), chatMessageModel.js (senderId, content, timestamp). Utiliser validationUtils pour schemas Joi.  
   **Labels** : backend, database  
   **Assignees** : dev2  
   **Milestone** : MVP  

7. **Titre** : Créer les repositories pour CRUD Firestore  
   **Description** : Implémenter userRepo.js, serviceRepo.js, etc., avec fonctions async pour create, read, update, delete via Firestore. Ajouter error handling et logging. Par exemple, getUser(id) doit query par doc ID.  
   **Labels** : backend, database  
   **Assignees** : dev2  
   **Milestone** : MVP  

8. **Titre** : Développer les controllers pour APIs  
   **Description** : Dans controllers, implémenter authController.js (login/register avec Firebase Auth), contactController.js (envoi formulaire via emailService), serviceController.js (CRUD services), etc. Utiliser repositories pour DB ops. Ajouter validation des inputs.  
   **Labels** : backend, api  
   **Assignees** : dev2  
   **Milestone** : MVP  

9. **Titre** : Configurer les routes Express  
   **Description** : Dans /routes, définir authRoutes.js (POST /login, etc.), contactRoutes.js (POST /contact), etc. Utiliser router Express et middlewares (auth, rateLimit). Importer dans app.js.  
   **Labels** : backend, api  
   **Assignees** : dev2  
   **Milestone** : MVP  

10. **Titre** : Implémenter WebSockets pour chat instantané  
    **Description** : Dans app.js, intégrer Socket.io. Dans chatController.js et chatRoutes.js, gérer événements : join room, send message (sauvegarde en DB via chatRepo), broadcast. Utiliser observables pour écoute constante (inspiré RxJS si besoin côté back).  
    **Labels** : backend, realtime, enhancement  
    **Assignees** : dev3  
    **Milestone** : V1  

11. **Titre** : Intégrer services pour emails et notifications  
    **Description** : Dans emailService.js, configurer Nodemailer avec SendGrid/SMTP via .env. Dans notificationService.js, utiliser Firebase Messaging pour push notifs. Tester envoi pour contacts et auth events.  
    **Labels** : backend, integration  
    **Assignees** : dev2  
    **Milestone** : V1  

12. **Titre** : Ajouter middlewares de sécurité  
    **Description** : Implémenter authMiddleware.js (vérif JWT Firebase), errorMiddleware.js (global catch), rateLimitMiddleware.js (express-rate-limit), corsMiddleware.js. Appliquer à routes sensibles.  
    **Labels** : backend, security  
    **Assignees** : dev2  
    **Milestone** : MVP  

13. **Titre** : Gérer le stockage de fichiers (images/vidéos)  
    **Description** : Dans storageService.js, implémenter upload/download via Firebase Storage. Intégrer dans controllers pour reviews et realizations (avant/après). Gérer ACL pour public/private.  
    **Labels** : backend, storage  
    **Assignees** : dev2  
    **Milestone** : V1  

#### Catégorie : Frontend (Développement du Frontend)
14. **Titre** : Configurer Tailwind CSS avec palette couleurs  
    **Description** : Dans tailwind.config.js, définir theme.colors avec #FFFFFF (blanc), #23953D (vert vif), #3582AE (bleu), etc. Compiler tailwind.css. Appliquer classes pour design ultra-moderne (gradients, shadows).  
    **Labels** : frontend, design  
    **Assignees** : dev1  
    **Milestone** : MVP  

15. **Titre** : Développer les pages statiques HTML  
    **Description** : Créer index.html (accueil avec présentation), about.html (historique, mission), services.html (détails prestations), realizations.html (photos/vidéos), reviews.html (avis), contact.html (formulaire), mentions.html (RGPD). Utiliser Tailwind pour responsive.  
    **Labels** : frontend, ui  
    **Assignees** : dev1  
    **Milestone** : MVP  

16. **Titre** : Intégrer scripts JS pour dynamisme  
    **Description** : Dans main.js, init AOS pour animations, Swiper pour sliders (témoignages). Ajouter lazy loading images via utils.js.  
    **Labels** : frontend, js  
    **Assignees** : dev1  
    **Milestone** : MVP  

17. **Titre** : Implémenter formulaire de contact  
    **Description** : Dans contact.js, utiliser fetch pour POST /api/contact. Valider inputs, afficher feedback (success/error). Intégrer RGPD  (cookies via JS localStorage).  
    **Labels** : frontend, form  
    **Assignees** : dev1  
    **Milestone** : MVP  

18. **Titre** : Ajouter chat instantané front-end  
    **Description** : Dans chat.js, connecter Socket.io client. Gérer UI chat (input, messages list), observables pour real-time updates (RxJS pour listen). Inspiré WhatsApp (scroll auto, typing indicators).  
    **Labels** : frontend, realtime  
    **Assignees** : dev3  
    **Milestone** : V1  

19. **Titre** : Intégrer carte Leaflet pour localisation  
    **Description** : Dans map.js, charger Leaflet via CDN. Afficher marker à l'adresse : 64 Avenue de la Quantinière, 49800 Trélazé-France. Ajouter zoom responsive.  
    **Labels** : frontend, integration  
    **Assignees** : dev1  
    **Milestone** : V1  

20. **Titre** : Créer dashboard admin  
    **Description** : Dans admin.html et admin.js, UI pour CRUD (services, reviews, etc.) via fetch APIs. Protéger avec auth.js (Firebase Auth SDK, login email/Google). Ajouter modifs textes/images.  
    **Labels** : frontend, admin  
    **Assignees** : dev1  
    **Milestone** : V1  

21. **Titre** : Optimiser performances front-end  
    **Description** : Ajouter minification CSS/JS, lazy loading pour assets, optim images (via JS ou tools). Viser vitesse chargement <2s. Tester responsive (mobile/tablette/PC).  
    **Labels** : frontend, performance  
    **Assignees** : dev1  
    **Milestone** : V1  

#### Catégorie : Intégrations (Intégrations et Fonctionnalités Avancées)
22. **Titre** : Intégrer authentification Firebase front/back  
    **Description** : Utiliser Firebase Auth SDK front pour login, et backend pour verify tokens. Gérer sessions, notifications push sur login.  
    **Labels** : integration, auth  
    **Assignees** : dev2  
    **Milestone** : MVP  

23. **Titre** : Gérer génération de documents (reçus)  
    **Description** : Créer API pour générer PDFs structurés (reçus services) via lib comme pdfkit. Stockage en Firebase Storage, envoi par email. UI front pour download.  
    **Labels** : integration, enhancement  
    **Assignees** : dev3  
    **Milestone** : V1  

24. **Titre** : Implémenter gestion des avis et opinions  
    **Description** : APIs CRUD pour reviews, modération admin. Front : afficher avec étoiles, photos. Intégrer témoignages avec sliders.  
    **Labels** : integration, ui  
    **Assignees** : dev1  
    **Milestone** : V1  

25. **Titre** : Ajouter icônes réseaux sociaux et liens  
    **Description** : Intégrer Font Awesome/Heroicons via CDN. Ajouter footer avec liens (Facebook, etc., placeholders si non fournis).  
    **Labels** : integration, design  
    **Assignees** : dev1  
    **Milestone** : V1  

#### Catégorie : Tests (Tests et Validation)
26. **Titre** : Écrire tests unitaires backend  
    **Description** : Utiliser Jest pour tester controllers, repositories (mocks Firestore). Couvrir 80% : auth, CRUD, errors.  
    **Labels** : tests, backend  
    **Assignees** : dev2  
    **Milestone** : Tests & Déploiement  

27. **Titre** : Tester frontend end-to-end  
    **Description** : Utiliser Cypress pour tester UI (formulaires, chat, responsive). Vérifier sans bugs, RGPD compliance.  
    **Labels** : tests, frontend  
    **Assignees** : dev1  
    **Milestone** : Tests & Déploiement  

28. **Titre** : Valider respect du cahier de charge  
    **Description** : Checklist : arborescence site, responsive, vitesse, modifiable admin, sauvegardes Firebase, palette couleurs. Tester sur delays fictifs (15/08/2025 - 01/10/2025).  
    **Labels** : tests, validation  
    **Assignees** : dev1, dev2  
    **Milestone** : Tests & Déploiement  

#### Catégorie : Déploiement (Déploiement et Maintenance)
29. **Titre** : Déployer backend sur Firebase Functions  
    **Description** : Configurer Firebase Functions pour app.js (Express + Socket.io). Utiliser deploy.sh pour push. Tester APIs en prod.  
    **Labels** : deployment, backend  
    **Assignees** : dev2  
    **Milestone** : Tests & Déploiement  

30. **Titre** : Déployer frontend sur Vercel  
    **Description** : Configurer Vercel pour /frontend (static site). Ajouter domain gratuit (ex. : via Freenom ou Vercel subdomain). Intégrer env vars pour APIs.  
    **Labels** : deployment, frontend  
    **Assignees** : dev1  
    **Milestone** : Tests & Déploiement  

31. **Titre** : Configurer sauvegardes et mises à jour  
    **Description** : Utiliser Firebase auto-backups. Ajouter cron pour updates régulières (ex. : via Functions). Documenter maintenance dans README.  
    **Labels** : deployment, maintenance  
    **Assignees** : dev2  
    **Milestone** : Tests & Déploiement  

32. **Titre** : Proposer nom de domaine gratuit  
    **Description** : Rechercher options gratuites (ex. : Freenom pour .tk, ou subdomains GitHub Pages/Vercel). Intégrer dans deploy.sh. Sugérer ll-ouest-services.tk si disponible.  
    **Labels** : deployment, enhancement  
    **Assignees** : dev1  
    **Milestone** : Tests & Déploiement  

Attends validation pour passer à l'étape 3 (Implémentation du Code).


rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /user/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /services/{serviceId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /reviews/{reviewId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /chat/{chatId} {
      allow read, write: if request.auth != null && request.auth.uid in resource.data.participants;
    }
    match /contact/{contactId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if request.auth != null;
    }
  }
}