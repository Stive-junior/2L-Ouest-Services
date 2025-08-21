/**
 * @file service.js
 * @description Module de gestion des services pour L&L Ouest Services.
 * Gère les formulaires pour créer, mettre à jour, supprimer des services et gérer les images.
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
          category: formData.get('category'),
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
          category: formData.get('category'),
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
        try {
          await api.service.uploadServiceImage(id, file);
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
        listContainer.innerHTML = data.services.map((service) => `
          <div>${service.name} - ${service.price}€ - ${service.category}</div>
        `).join('');
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
        try {
          const data = await api.service.getServicesByCategory(category);
          const listContainer = document.getElementById('services-list');
          listContainer.innerHTML = data.services.map((service) => `
            <div>${service.name} - ${service.price}€ - ${service.category}</div>
          `).join('');
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
        const radius = parseInt(formData.get('radius'));
        try {
          const services = await api.service.getNearbyServices(radius);
          const listContainer = document.getElementById('services-list');
          listContainer.innerHTML = services.map((service) => `
            <div>${service.name} - ${service.price}€ - ${service.category}</div>
          `).join('');
        } catch (error) {
          showNotification(error.message, 'error');
        }
      });
    }
  },
};

export default service;
