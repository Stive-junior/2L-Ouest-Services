// firebase-messaging-sw.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getMessaging, onBackgroundMessage } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-sw.js';

// Cache pour les configurations Firebase
let firebaseConfigCache = null;
let messagingCache = null;

// Récupération des configurations Firebase avec cache
async function getFirebaseConfig() {
  // Utiliser le cache si disponible
  if (firebaseConfigCache) {
    return firebaseConfigCache;
  }

  try {
    const response = await fetch('/api/config/firebase', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-cache' // Éviter le cache du navigateur pour les configs
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const { data } = await response.json();
    
    // Mettre en cache pour cette session du Service Worker
    firebaseConfigCache = {
      apiKey: data.apiKey,
      authDomain: data.authDomain,
      databaseURL: data.databaseURL,
      projectId: data.projectId,
      storageBucket: data.storageBucket,
      messagingSenderId: data.senderId,
      appId: data.appId,
      measurementId: data.measurementId,
    };
    
    return firebaseConfigCache;
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Erreur récupération config:', error);
    
    // Ne pas utiliser de config par défaut - retourner null pour éviter les faux positifs
    firebaseConfigCache = null;
    throw error;
  }
}

// Initialisation au chargement du Service Worker
self.addEventListener('install', async (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installé');
  
  // Activer immédiatement le nouveau Service Worker
  self.skipWaiting();
  
  // Précharger les configurations
  event.waitUntil(
    (async () => {
      try {
        await getFirebaseConfig();
        console.log('[firebase-messaging-sw.js] Configurations préchargées');
      } catch (error) {
        console.warn('[firebase-messaging-sw.js] Échec préchargement configurations');
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activé');
  
  // Prendre le contrôle immédiatement
  event.waitUntil(self.clients.claim());
  
  // Initialiser Firebase Messaging
  event.waitUntil(
    (async () => {
      try {
        const firebaseConfig = await getFirebaseConfig();
        if (!firebaseConfig) {
          console.error('[firebase-messaging-sw.js] Impossible d\'initialiser sans config');
          return;
        }
        
        const app = initializeApp(firebaseConfig);
        messagingCache = getMessaging(app);
        
        console.log('[firebase-messaging-sw.js] Firebase Messaging initialisé avec succès');
        
        // Gestion des messages en arrière-plan
        onBackgroundMessage(messagingCache, (payload) => {
          console.log('[firebase-messaging-sw.js] Notification reçue:', payload);
          
          // Vérifications de sécurité
          if (!payload || !payload.notification) {
            console.warn('[firebase-messaging-sw.js] Payload invalide');
            return;
          }
          
          const notificationTitle = payload.notification.title || 'L&L Ouest Services';
          const notificationBody = payload.notification.body || 'Vous avez une nouvelle notification';
          
          // Options de notification sécurisées
          const notificationOptions = {
            body: notificationBody,
            icon: '/assets/images/logo.png',
            badge: '/assets/images/badge.png',
            vibrate: [100, 50, 100],
            data: {
              ...payload.data,
              timestamp: Date.now(),
              url: payload.data?.url || '/dashboard.html'
            },
            actions: [
              {
                action: 'view',
                title: 'Voir',
                icon: '/assets/images/icons/eye.png'
              },
              {
                action: 'close',
                title: 'Fermer',
                icon: '/assets/images/icons/close.png'
              }
            ],
            requireInteraction: false,
            silent: false,
            tag: `ll-ouest-${Date.now()}`
          };

          // Affichage de la notification
          return self.registration.showNotification(notificationTitle, notificationOptions);
        });
        
      } catch (error) {
        console.error('[firebase-messaging-sw.js] Erreur initialisation:', error);
        messagingCache = null;
      }
    })()
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Clic sur notification:', event.action);
  
  // Fermer la notification
  event.notification.close();
  
  let targetUrl = '/dashboard.html';
  
  // Déterminer l'URL de destination
  if (event.action === 'view' || !event.action) {
    targetUrl = event.notification.data?.url || '/dashboard.html';
  } else if (event.action === 'close') {
    // Ne rien faire pour l'action close
    return;
  }
  
  // Ouvrir l'URL dans une nouvelle fenêtre ou focus sur une existante
  event.waitUntil(
    (async () => {
      const windowClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });
      
      // Chercher une fenêtre existante avec l'URL
      let client = windowClients.find(c => 
        c.url === targetUrl && 'focus' in c
      );
      
      if (client) {
        // Focus sur la fenêtre existante
        client.focus();
      } else {
        // Ouvrir une nouvelle fenêtre
        client = await clients.openWindow(targetUrl);
        if (client) {
          await client.focus();
        }
      }
    })()
  );
});

// Gestion des erreurs
self.addEventListener('error', (event) => {
  console.error('[firebase-messaging-sw.js] Erreur Service Worker:', event.error);
  
  // Log détaillé pour le debugging
  if (event.error && event.error.message) {
    console.error('[firebase-messaging-sw.js] Détails erreur:', {
      message: event.error.message,
      stack: event.error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Gestion de la fermeture du Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Nettoyage périodique du cache
setInterval(() => {
  if (firebaseConfigCache) {
    // Vérifier si le cache est trop vieux (24h)
    const cacheAge = Date.now() - (firebaseConfigCache.timestamp || 0);
    if (cacheAge > 24 * 60 * 60 * 1000) {
      console.log('[firebase-messaging-sw.js] Cache configurations expiré - nettoyage');
      firebaseConfigCache = null;
    }
  }
}, 60 * 60 * 1000); // Vérifier toutes les heures

console.log('[firebase-messaging-sw.js] Service Worker chargé et prêt');
