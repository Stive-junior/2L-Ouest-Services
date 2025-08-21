/**
 * @file contact.js
 * @description Module de gestion des contacts pour L&L Ouest Services.
 * Gère le formulaire de contact avec validation en temps réel et envoi via l'API.
 * @module contact
 */

import api from '../api.js';
import { showNotification } from './utils.js';

const contact = {
  /**
   * Initialize the contact module
   */
  init() {
    this.bindContactForm();
    this.bindRealTimeValidation();
  },

  /**
   * Bind submit event to the contact form
   */
  bindContactForm() {
    const form = document.getElementById('contact-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const contactData = {
          id: crypto.randomUUID(),
          userId: formData.get('userId') || null,
          name: formData.get('name').trim(),
          email: formData.get('email').trim(),
          subject: formData.get('subject').trim(),
          message: formData.get('message').trim(),
          createdAt: new Date().toISOString(),
        };

        // Client-side validation
        const errors = this.validateForm(contactData);
        if (Object.keys(errors).length > 0) {
          Object.entries(errors).forEach(([field, message]) => {
            this.showFieldError(field, message);
          });
          return;
        }

        try {
          await api.contact.createContact(contactData);
          showNotification('Message envoyé avec succès. Nous vous répondrons bientôt.', 'success');
          form.reset();
          this.clearFieldErrors();
        } catch (error) {
          showNotification(error.message || 'Erreur lors de l\'envoi du message.', 'error');
        }
      });
    }
  },

  /**
   * Bind real-time validation to form inputs
   */
  bindRealTimeValidation() {
    const form = document.getElementById('contact-form');
    if (form) {
      const inputs = form.querySelectorAll('input, textarea');
      inputs.forEach((input) => {
        input.addEventListener('input', () => {
          const field = input.name;
          const value = input.value.trim();
          const error = this.validateField(field, value);
          this.showFieldError(field, error);
        });
      });
    }
  },

  /**
   * Validate a single form field
   * @param {string} field - The field name
   * @param {string} value - The field value
   * @returns {string|null} - Error message or null if valid
   */
  validateField(field, value) {
    switch (field) {
      case 'name':
        if (!value) return 'Le nom est requis.';
        if (value.length < 2) return 'Le nom doit contenir au moins 2 caractères.';
        return null;
      case 'email':
        if (!value) return 'L\'email est requis.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'L\'email n\'est pas valide.';
        return null;
      case 'subject':
        if (!value) return 'Le sujet est requis.';
        if (value.length < 5) return 'Le sujet doit contenir au moins 5 caractères.';
        return null;
      case 'message':
        if (!value) return 'Le message est requis.';
        if (value.length < 10) return 'Le message doit contenir au moins 10 caractères.';
        return null;
      default:
        return null;
    }
  },

  /**
   * Validate the entire form
   * @param {Object} data - Form data
   * @returns {Object} - Object with field errors
   */
  validateForm(data) {
    const errors = {};
    Object.keys(data).forEach((field) => {
      const error = this.validateField(field, data[field]);
      if (error) errors[field] = error;
    });
    return errors;
  },

  /**
   * Show error message for a specific field
   * @param {string} field - The field name
   * @param {string|null} message - The error message or null to clear
   */
  showFieldError(field, message) {
    const input = document.querySelector(`#${field}`);
    const errorElement = input.nextElementSibling;
    if (message) {
      errorElement.textContent = message;
      errorElement.classList.remove('hidden');
      input.classList.add('border-red-500');
      input.classList.remove('border-gray-300', 'dark:border-gray-600');
    } else {
      errorElement.textContent = '';
      errorElement.classList.add('hidden');
      input.classList.remove('border-red-500');
      input.classList.add('border-gray-300', 'dark:border-gray-600');
    }
  },

  /**
   * Clear all field errors
   */
  clearFieldErrors() {
    const form = document.getElementById('contact-form');
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach((input) => {
      this.showFieldError(input.name, null);
    });
  },
};

export default contact;
