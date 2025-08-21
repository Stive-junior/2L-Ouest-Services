/**
 * @file animation.js
 * @description Gère les animations globales, les carrousels Swiper et le composant Vue.js du profil utilisateur.
 * @requires Vue, AOS, Swiper, api.js, utils.js
 */

import { createApp, ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js';
import Swiper from 'https://unpkg.com/swiper@8/swiper-bundle.esm.browser.min.js';
import { showNotification, getStoredToken } from '../modules/utils.js';
import api from '../api.js';

document.addEventListener('DOMContentLoaded', () => {
  

  /**
   * Initialise les carrousels de la page en utilisant la bibliothèque Swiper.
   */
  const initSwiperCarousels = () => {
    document.querySelectorAll('[data-carousel]').forEach((carousel) => {
      new Swiper(carousel, {
        loop: true,
        autoplay: {
          delay: 5000,
          disableOnInteraction: false,
        },
        pagination: {
          el: carousel.querySelector('.carousel-indicators'),
          clickable: true,
          renderBullet: (index, className) => {
            return `<span class="${className} w-3 h-3 bg-gray-400 dark:bg-gray-600 rounded-full cursor-pointer hover:bg-blue-600 dark:hover:bg-blue-400 transition-colors"></span>`;
          },
        },
        effect: 'fade',
        fadeEffect: {
          crossFade: true,
        },
        on: {
          slideChange: function () {
            const slides = carousel.querySelectorAll('.carousel-slide');
            slides.forEach((slide, idx) => {
              const isActive = idx === this.activeIndex;
              slide.classList.toggle('data-active', isActive);
              const caption = slide.querySelector('.carousel-caption');
              if (caption) {
                caption.classList.toggle('opacity-0', !isActive);
                caption.classList.toggle('translate-y-4', !isActive);
                caption.classList.toggle('opacity-100', isActive);
                caption.classList.toggle('translate-y-0', isActive);
              }
            });
          },
        },
      });
    });
  };

  /**
   * Initialise l'observateur d'intersection pour les animations de type "fade-in".
   */
  const initFadeInAnimations = () => {
    const fadeInElements = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 }
    );
    fadeInElements.forEach((el) => observer.observe(el));
  };

  /**
   * Initialise le composant Vue.js pour l'affichage du profil utilisateur dans la sidebar.
   */
  const initVueComponent = () => {
    const publicPages = [
      'signin', 'signup', 'verify-email', 'password-reset', 'change-email',
      'about', 'contact', 'mentions', 'realizations', 'services', 'reviews', 'reviews-user',
    ];
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');

    // Empêche l'exécution du composant sur les pages publiques si l'utilisateur n'est pas authentifié.
    if (publicPages.includes(currentPage) && !getStoredToken()) {
      return;
    }

    const app = createApp({
      setup() {
        const user = ref(null);
        const isAuthenticated = ref(!!getStoredToken());

        const loadUser = async () => {
          try {
            const userData = await api.auth.getCurrentUser();
            user.value = userData || { name: 'Utilisateur', email: '' };
          } catch (error) {
            user.value = { name: 'Utilisateur', email: '' };
            console.warn('Utilisateur non authentifié ou erreur:', error.message);
          }
        };

        const signOut = async () => {
          try {
            await api.auth.signOut();
            showNotification('Déconnexion réussie.', 'success');
            window.location.href = '/pages/auth/signin.html';
          } catch (error) {
            showNotification(error.message || 'Erreur lors de la déconnexion.', 'error', false, {
              showConfirmButton: true,
              confirmButtonText: 'Okay',
            });
          }
        };

        loadUser();

        return { user, isAuthenticated, signOut };
      },
      template: `
        <div v-if="isAuthenticated" class="mb-6 p-4 bg-gradient-to-r from-blue-600/90 to-blue-800/90 rounded-xl text-white shadow-lg transform transition-all duration-300 hover:scale-102" data-auth="authenticated">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-gray-900/50 flex items-center justify-center text-xl font-bold shadow-inner">
              {{ user ? user.name.charAt(0).toUpperCase() : 'U' }}
            </div>
            <div>
              <h3 class="font-bold text-white/95 text-lg">{{ user ? user.nom : 'Utilisateurs' }}</h3>
              <p class="text-sm text-white/90">{{ user ? user.email : '' }}</p>
            </div>
          </div>
          <button @click="signOut" class="mt-2 p-2 bg-red-600 rounded-lg text-white hover:bg-red-700 transition">Déconnexion</button>
        </div>
        <div v-else class="mb-6 p-4 bg-gradient-to-r from-gray-600/90 to-gray-800/90 rounded-xl text-white shadow-lg" data-auth="unauthenticated">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-gray-900/50 flex items-center justify-center text-xl font-bold shadow-inner">G</div>
            <div>
              <h3 class="font-bold text-white/95 text-lg">Invité</h3>
              <p class="text-sm text-white/90">Connectez-vous pour plus de fonctionnalités</p>
            </div>
          </div>
        </div>
      `,
    });

    const sidebarContainer = document.querySelector('#sidebar-container');
    if (sidebarContainer) {
      app.mount('#sidebar-container');
    } else {
      console.warn('Conteneur #sidebar-container non trouvé. Le composant Vue.js ne peut pas être monté.');
    }
  };

  /**
   * Met à jour la visibilité des éléments HTML basés sur l'état d'authentification.
   */
  const updateAuthDependentElements = () => {
    const isAuthenticated = !!getStoredToken();
    document.querySelectorAll('[data-auth="authenticated"]').forEach((el) => {
      el.style.display = isAuthenticated ? 'block' : 'none';
    });
    document.querySelectorAll('[data-auth="unauthenticated"]').forEach((el) => {
      el.style.display = isAuthenticated ? 'none' : 'block';
    });
  };

  initSwiperCarousels();
  initFadeInAnimations();
  initVueComponent();
  updateAuthDependentElements();
});
