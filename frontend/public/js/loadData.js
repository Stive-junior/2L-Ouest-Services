/**
 * @file loadData.js
 * @description Charge les données utilisateur avant le rendu de la page
 */

import { getStoredToken, showNotification, setStoredToken, clearStoredToken } from './modules/utils.js';
import api from './api.js';

let userDataCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Charge les données utilisateur et met à jour l'interface
 * @returns {Promise<Object|null>} Données utilisateur ou null si non connecté
 */
export async function loadUserData() {
    try {
        
        const loadingSpinner = document.querySelector('#profile-loading');
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');

        const token = getStoredToken();
        if (!token) {
            console.log('Aucun token trouvé, utilisateur non connecté');
            userDataCache = null;
            cacheTimestamp = 0;
            return null;
        }

        // Vérifier si cache valide
        if (userDataCache && Date.now() - cacheTimestamp < CACHE_TTL) {
            console.log('Retour des données utilisateur du cache');
            return userDataCache;
        }

        console.log('Chargement des données utilisateur depuis l\'API...');
        const userData = await api.auth.getCurrentUser();

        if (userData) {
            userDataCache = userData;
            cacheTimestamp = Date.now();
            console.log('Données utilisateur chargées et mises en cache:', userData);
            return userData;
        } else {
            throw new Error('Aucune donnée utilisateur reçue');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
        if (error.message.includes('Token invalide') || error.message.includes('expiré')) {
            handleInvalidToken();
        }
        userDataCache = null;
        cacheTimestamp = 0;
        return null;
    } finally {
        // Cacher le spinner de chargement
        const loadingSpinner = document.querySelector('#profile-loading');
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }
}

/**
 * Gère un token invalide : déconnexion et redirection
 */
function handleInvalidToken() {
    clearStoredToken();
    userDataCache = null;
    cacheTimestamp = 0;
    showNotification('Session expirée. Veuillez vous reconnecter.', 'error');
    window.location.href = '/signin.html'; // Redirection vers la page de connexion
}

/**
 * Rafraîchit le token si nécessaire
 * @param {string} currentToken - Token actuel
 * @returns {Promise<string>} Nouveau token rafraîchi
 */
async function refreshTokenIfNeeded(currentToken) {
    try {
        const decoded = JSON.parse(atob(currentToken.split('.')[1]));
        const exp = decoded.exp * 1000;
        const now = Date.now();

        if (exp - now < CACHE_TTL) {
            console.log('Token expire bientôt, rafraîchissement...');
            const refreshData = await api.auth.refreshToken();
            setStoredToken(refreshData.token, refreshData.role || 'client');
            return refreshData.token;
        }

        return currentToken;
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token:', error);
        throw new Error('Échec du rafraîchissement du token');
    }
}

/**
 * Met à jour l'interface avec les données utilisateur
 * @param {Object} userData - Données utilisateur
 */
export function updateUIWithUserData(userData) {
    if (!userData) {
        // Afficher l'état non connecté
        const authElements = document.querySelectorAll('[data-auth]');
        authElements.forEach(element => {
            const shouldShow = element.getAttribute('data-auth') === 'unauthenticated';
            element.classList.toggle('hidden', !shouldShow);
            element.classList.toggle('block', shouldShow);
        });
        return;
    }

    console.log('Mise à jour de l\'interface avec les données utilisateur:', userData);

    // Afficher l'état connecté
    const authElements = document.querySelectorAll('[data-auth]');
    authElements.forEach(element => {
        const shouldShow = element.getAttribute('data-auth') === 'authenticated';
        element.classList.toggle('hidden', !shouldShow);
        element.classList.toggle('block', shouldShow);
    });

    // Mise à jour du profil dans la sidebar
    const sidebarProfile = document.querySelector('#sidebar-container [data-auth="authenticated"]');
    const welcome = document.getElementById('welcome');

    if (sidebarProfile) {
        const userNameElement = sidebarProfile.querySelector('h3');
        const userEmailElement = sidebarProfile.querySelector('p');
        const userInitialElement = sidebarProfile.querySelector('.user-initial');
        const userPhotoElement = sidebarProfile.querySelector('#user-photo');
        const countryElement = sidebarProfile.querySelector('span.text-sm.text-white\\/80');
        const roleElement = sidebarProfile.querySelector('span.text-xs');

        if (userNameElement) userNameElement.textContent = userData.name || userData.nom || 'Utilisateur';
        if (userEmailElement) userEmailElement.textContent = userData.email || '';
        if (userInitialElement) {
            const initial = (userData.name || userData.nom || 'U').charAt(0).toUpperCase();
            userInitialElement.textContent = initial;
        }
        if (userPhotoElement && userData.photoURL) {
            userPhotoElement.src = userData.photoURL;
            userPhotoElement.classList.remove('hidden');
            userInitialElement.classList.add('hidden');
        }
        if (countryElement) countryElement.textContent = userData.address?.country || 'Pays inconnu';
        if (roleElement) roleElement.textContent = userData.role || 'Client';

        if (welcome) {
            const firstName = (userData.name || userData.nom || 'Utilisateur').split(' ')[0];
            welcome.textContent = `Bienvenue Mr ${firstName}`;
        }
    }

    // Mise à jour du bouton de toggle d'authentification
    const authToggleButton = document.querySelector('#auth.auth-combined-button');
    if (authToggleButton) {
        authToggleButton.innerHTML = '';

        const avatarWrapper = document.createElement('div');
        avatarWrapper.classList.add('w-8', 'h-8', 'rounded-full', 'overflow-hidden', 'bg-ll-blue', 'text-white', 'flex', 'items-center', 'justify-center', 'text-sm', 'font-semibold', 'mr-2');

        if (userData.photoURL) {
            const img = document.createElement('img');
            img.src = userData.photoURL;
            img.alt = 'Photo de profil';
            img.classList.add('w-full', 'h-full', 'object-cover');
            avatarWrapper.appendChild(img);
        } else {
            const name = userData.name || userData.nom || 'Utilisateur';
            const nameParts = name.trim().split(' ');
            let initials = '';
            if (nameParts.length >= 2) {
                initials = nameParts[0][0] + nameParts[1][0];
                initials = initials.toUpperCase();
            } else {
                initials = nameParts[0].slice(0, 2);
                initials = initials.charAt(0).toUpperCase() + initials.slice(1).toLowerCase();
            }
            avatarWrapper.textContent = initials;
        }

        authToggleButton.appendChild(avatarWrapper);

        const arrow = document.createElement('i');
        arrow.className = 'fas fa-chevron-down text-xs ml-1';
        authToggleButton.appendChild(arrow);
    }

    // Mise à jour du profil détaillé
    const profileDetails = document.querySelector('[data-level="profile-details"]');
    if (profileDetails) {
        const userNameElement = profileDetails.querySelector('h3');
        const userEmailElement = profileDetails.querySelector('p.text-sm.text-white\\/90');
        const userPhoneElement = profileDetails.querySelector('p.text-sm.text-white\\/80');
        const userInitialElement = profileDetails.querySelector('.user-initial');
        const userPhotoElement = profileDetails.querySelector('#user-photo-detailed');
        const addressElement = profileDetails.querySelector('p.text-sm.text-white\\/90');
        const roleElement = profileDetails.querySelector('span.text-xs');
        const notificationsElement = profileDetails.querySelector('#notifications-status');
        const createdAtElement = profileDetails.querySelector('p.text-sm.text-white\\/90:nth-child(4)');
        const lastLoginElement = profileDetails.querySelector('p.text-sm.text-white\\/90:nth-child(5)');

        if (userNameElement) userNameElement.textContent = userData.name || userData.nom || 'Utilisateur';
        if (userEmailElement) userEmailElement.textContent = userData.email || '';
        if (userPhoneElement) userPhoneElement.textContent = userData.phone || '';
        if (userInitialElement) {
            const initial = (userData.name || userData.nom || 'U').charAt(0).toUpperCase();
            userInitialElement.textContent = initial;
        }
        if (userPhotoElement && userData.photoURL) {
            userPhotoElement.src = userData.photoURL;
            userPhotoElement.classList.remove('hidden');
            userInitialElement.classList.add('hidden');
        }
        if (addressElement) {
            const { street, city, postalCode, country } = userData.address || {};
            addressElement.textContent = `${street || ''}, ${city || ''}, ${postalCode || ''}, ${country || 'Pays inconnu'}`;
        }
        if (roleElement) roleElement.textContent = userData.role || 'Client';
        if (notificationsElement) notificationsElement.textContent = userData.preferences?.notifications ? 'Activées' : 'Désactivées';
        if (createdAtElement) {
            const date = new Date(userData.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            createdAtElement.textContent = date;
        }
        if (lastLoginElement) {
            const date = new Date(userData.lastLogin).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            lastLoginElement.textContent = date;
        }
    }

    // Mise à jour du dashboard avec les données utilisateur
    updateDashboardWithUserData(userData);
}

/**
 * Met à jour le dashboard avec les données utilisateur
 * @param {Object} userData - Données utilisateur
 */
function updateDashboardWithUserData(userData) {
    console.log('Mise à jour du dashboard avec:', userData);
}

// Exécution au chargement
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Chargement des données utilisateur...');
    const userData = await loadUserData();
    updateUIWithUserData(userData);
});

