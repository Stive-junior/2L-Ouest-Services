/**
 * @file user.js
 * @description Module de gestion des utilisateurs pour L&L Ouest Services.
 * Gère les formulaires pour afficher et mettre à jour les profils, préférences et factures.
 * @module user
 */

import api from '../api.js';
import { showNotification, generateString } from './utils.js';

const user = {
  init() {
    this.bindProfileForm();
    this.bindPreferencesForm();
    this.bindAddInvoiceForm();
    this.bindRemoveInvoiceForm();
    this.bindUserList();
  },

  bindProfileForm() {
    const form = document.getElementById('profile-form');
    if (form) {
      api.user.getProfile().then((userData) => {
        document.getElementById('name').value = userData.name || '';
        document.getElementById('email').value = userData.email || '';
        document.getElementById('phone').value = userData.phone || '';
        document.getElementById('street').value = userData.address?.street || '';
        document.getElementById('city').value = userData.address?.city || '';
        document.getElementById('postalCode').value = userData.address?.postalCode || '';
        document.getElementById('country').value = userData.address?.country || 'France';
      }).catch((error) => {
        showNotification(error.message, 'error');
      });

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const userData = {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          address: {
            street: formData.get('street'),
            city: formData.get('city'),
            postalCode: formData.get('postalCode'),
            country: formData.get('country') || 'France',
          },
        };
        try {
          await api.user.updateProfile(userData);
          showNotification('Profil mis à jour avec succès.', 'success');
        } catch (error) {
          showNotification(error.message, 'error');
        }
      });
    }
  },

  bindPreferencesForm() {
    const form = document.getElementById('preferences-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const preferences = {
          notifications: formData.get('notifications') === 'on',
          language: formData.get('language'),
          fcmToken: generateString(32),
        };
        try {
          await api.user.updatePreferences(preferences);
          showNotification('Préférences mises à jour avec succès.', 'success');
        } catch (error) {
          showNotification(error.message, 'error');
        }
      });
    }
  },

  bindAddInvoiceForm() {
    const form = document.getElementById('add-invoice-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const invoice = {
          id: generateString(10),
          userId: formData.get('userId'),
          amount: parseFloat(formData.get('amount')),
          items: JSON.parse(formData.get('items') || '[]'),
          date: new Date().toISOString(),
          dueDate: formData.get('dueDate'),
          url: formData.get('url'),
        };
        try {
          await api.user.addInvoice(invoice);
          showNotification('Facture ajoutée avec succès.', 'success');
          form.reset();
        } catch (error) {
          showNotification(error.message, 'error');
        }
      });
    }
  },

  bindRemoveInvoiceForm() {
    const form = document.getElementById('remove-invoice-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const invoiceId = formData.get('invoiceId');
        try {
          await api.user.removeInvoice(invoiceId);
          showNotification('Facture supprimée avec succès.', 'success');
          form.reset();
        } catch (error) {
          showNotification(error.message, 'error');
        }
      });
    }
  },

  bindUserList() {
    const listContainer = document.getElementById('users-list');
    if (listContainer) {
      api.user.getAllUsers().then((data) => {
        listContainer.innerHTML = data.users.map((user) => `
          <div>${user.name} - ${user.email} - ${user.role}</div>
        `).join('');
      }).catch((error) => {
        showNotification(error.message, 'error');
      });
    }
  },
};

export default user;
