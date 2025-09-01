/**
 * @file service.js
 * @description Module de gestion des services pour L&L Ouest Services.
 * Gère les formulaires pour créer, mettre à jour, supprimer des services et gérer les images.
 * Intègre un carrousel Swiper pour les images de services et des filtres avancés.
 * @module service
 */

import api from '../api.js';
import { showNotification } from './utils.js';

const service = {
  init() {
    this.bindCreateServiceForm();
    this.bindUpdateServiceForm();
    this.bindDeleteServiceForm();
    this.bindUploadImageForm();
    this.bindDeleteImageForm();
    this.bindServicesList();
    this.bindServicesByCategory();
    this.bindNearbyServices();
    this.bindServiceFilters();
  },

  bindCreateServiceForm() {
    const form = document.getElementById('create-service-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const serviceData = {
          name: formData.get('name'),
          description: formData.get('description'),
          price: parseFloat(formData.get('price')),
          area: formData.get('area') ? parseFloat(formData.get('area')) : undefined,
          duration: formData.get('duration') ? parseFloat(formData.get('duration')) : undefined,
          category: formData.get('category'),
          location: formData.get('address') ? {
            address: formData.get('address'),
            coordinates: {
              lat: parseFloat(formData.get('lat')) || undefined,
              lng: parseFloat(formData.get('lng')) || undefined,
            },
          } : undefined,
        };
        try {
          await api.service.createService(serviceData);
          showNotification('Service créé avec succès.', 'success');
          form.reset();
        } catch (error) {
          showNotification(error.message, 'error');
        }
      });
    }
  },

  bindUpdateServiceForm() {
    const form = document.getElementById('update-service-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const id = formData.get('id');
        const serviceData = {
          name: formData.get('name'),
          description: formData.get('description'),
          price: formData.get('price') ? parseFloat(formData.get('price')) : undefined,
          area: formData.get('area') ? parseFloat(formData.get('area')) : undefined,
          duration: formData.get('duration') ? parseFloat(formData.get('duration')) : undefined,
          category: formData.get('category'),
          availability: formData.get('isAvailable') ? {
            isAvailable: formData.get('isAvailable') === 'true',
            schedule: formData.get('schedule') ? JSON.parse(formData.get('schedule')) : undefined,
          } : undefined,
          location: formData.get('address') ? {
            address: formData.get('address'),
            coordinates: {
              lat: parseFloat(formData.get('lat')) || undefined,
              lng: parseFloat(formData.get('lng')) || undefined,
            },
          } : undefined,
        };
        try {
          await api.service.updateService(id, serviceData);
          showNotification('Service mis à jour avec succès.', 'success');
        } catch (error) {
          showNotification(error.message, 'error');
        }
      });
    }
  },

  bindDeleteServiceForm() {
    const form = document.getElementById('delete-service-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const id = formData.get('id');
        try {
          await api.service.deleteService(id);
          showNotification('Service supprimé avec succès.', 'success');
          form.reset();
        } catch (error) {
          showNotification(error.message, 'error');
        }
      });
    }
  },

  bindUploadImageForm() {
    const form = document.getElementById('upload-service-image-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const id = formData.get('id');
        const file = formData.get('file');
        const type = formData.get('type');
        const description = formData.get('description');
        try {
          await api.service.uploadServiceImage(id, file, type, description);
          showNotification('Image ajoutée avec succès.', 'success');
          form.reset();
        } catch (error) {
          showNotification(error.message, 'error');
        }
      });
    }
  },

  bindDeleteImageForm() {
    const form = document.getElementById('delete-service-image-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const id = formData.get('id');
        const fileUrl = formData.get('fileUrl');
        try {
          await api.service.deleteServiceImage(id, fileUrl);
          showNotification('Image supprimée avec succès.', 'success');
          form.reset();
        } catch (error) {
          showNotification(error.message, 'error');
        }
      });
    }
  },

  bindServicesList() {
    const listContainer = document.getElementById('services-list');
    if (listContainer) {
      api.service.getAllServices().then((data) => {
        this.renderServices(listContainer, data.services);
      }).catch((error) => {
        showNotification(error.message, 'error');
      });
    }
  },

  bindServicesByCategory() {
    const form = document.getElementById('services-by-category-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const category = formData.get('category');
        const page = parseInt(formData.get('page')) || 1;
        const limit = parseInt(formData.get('limit')) || 10;
        try {
          const data = await api.service.getServicesByCategory(category, page, limit);
          const listContainer = document.getElementById('services-list');
          this.renderServices(listContainer, data.services);
        } catch (error) {
          showNotification(error.message, 'error');
        }
      });
    }
  },

  bindNearbyServices() {
    const form = document.getElementById('nearby-services-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const lat = parseFloat(formData.get('lat'));
        const lng = parseFloat(formData.get('lng'));
        const radius = parseInt(formData.get('radius')) || 10000;
        const page = parseInt(formData.get('page')) || 1;
        const limit = parseInt(formData.get('limit')) || 10;
        const filters = {
          area: formData.get('areaMin') && formData.get('areaMax') ? {
            min: parseFloat(formData.get('areaMin')),
            max: parseFloat(formData.get('areaMax')),
          } : undefined,
          duration: formData.get('durationMin') && formData.get('durationMax') ? {
            min: parseFloat(formData.get('durationMin')),
            max: parseFloat(formData.get('durationMax')),
          } : undefined,
        };
        try {
          const data = await api.service.getNearbyServices(lat, lng, radius, page, limit, filters);
          const listContainer = document.getElementById('services-list');
          this.renderServices(listContainer, data.services);
        } catch (error) {
          showNotification(error.message, 'error');
        }
      });
    }
  },

  bindServiceFilters() {
    const form = document.getElementById('service-filters-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const page = parseInt(formData.get('page')) || 1;
        const limit = parseInt(formData.get('limit')) || 10;
        const filters = {
          area: formData.get('areaMin') && formData.get('areaMax') ? {
            min: parseFloat(formData.get('areaMin')),
            max: parseFloat(formData.get('areaMax')),
          } : undefined,
          duration: formData.get('durationMin') && formData.get('durationMax') ? {
            min: parseFloat(formData.get('durationMin')),
            max: parseFloat(formData.get('durationMax')),
          } : undefined,
        };
        try {
          const data = await api.service.getAllServices(page, limit, filters);
          const listContainer = document.getElementById('services-list');
          this.renderServices(listContainer, data.services);
        } catch (error) {
          showNotification(error.message, 'error');
        }
      });
    }
  },

  renderServices(container, services) {
    container.innerHTML = `
      <div class="swiper-wrapper">
        ${services.map((service) => `
          <div class="swiper-slide">
            <div class="bg-ll-light-bg dark:bg-ll-black p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300" data-aos="fade-up">
              <div class="swiper service-images-swiper">
                <div class="swiper-wrapper">
                  ${service.images && service.images.length > 0
                    ? service.images.map(img => `
                      <div class="swiper-slide">
                        <img src="${img.url}" alt="${img.description || service.name}" class="w-full h-48 object-cover rounded-t-xl mb-4 cursor-pointer" onclick="openLightbox('${img.url}')">
                      </div>
                    `).join('')
                    : `<div class="swiper-slide">
                        <img src="https://via.placeholder.com/400x300?text=${service.name}" alt="${service.name}" class="w-full h-48 object-cover rounded-t-xl mb-4">
                      </div>`
                  }
                </div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-next"></div>
                <div class="swiper-button-prev"></div>
              </div>
              <h3 class="text-2xl font-bold mb-2 text-ll-black dark:text-ll-white">${service.name}</h3>
              <p class="text-ll-text-gray dark:text-ll-medium-gray mb-2">${service.description}</p>
              <p class="font-bold text-ll-blue">${service.price} €</p>
              <p class="text-sm text-ll-text-gray dark:text-ll-medium-gray">${service.category}</p>
              ${service.area ? `<p class="text-sm text-ll-text-gray dark:text-ll-medium-gray">Superficie: ${service.area} m²</p>` : ''}
              ${service.duration ? `<p class="text-sm text-ll-text-gray dark:text-ll-medium-gray">Durée: ${service.duration} heures</p>` : ''}
              ${service.location?.address ? `<p class="text-sm text-ll-text-gray dark:text-ll-medium-gray">Adresse: ${service.location.address}</p>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="swiper-pagination"></div>
      <div class="swiper-button-next"></div>
      <div class="swiper-button-prev"></div>
    `;
    // Initialiser les carrousels pour chaque service
    container.querySelectorAll('.service-images-swiper').forEach(swiper => {
      new Swiper(swiper, {
        loop: true,
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        autoplay: { delay: 3000, disableOnInteraction: false },
      });
    });
  },
};

export default service;
