/**
 * @file animation.js
 * @description Gère les animations globales, les carrousels Swiper et la mise à jour des informations utilisateur.
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


  initSwiperCarousels();
  initFadeInAnimations();

});
