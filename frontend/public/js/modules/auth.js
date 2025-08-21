/**
 * @file auth.js
 * @description Module de gestion de l'authentification pour L&L Ouest Services.
 * Gère l'inscription, la connexion, la déconnexion, la vérification d'email, la réinitialisation de mot de passe, et le changement d'email.
 * @module auth
 */

import api from '../api.js';
import { showNotification, generateString } from './utils.js';

const auth = {
  /**
   * Initialize the authentication module
   */
  init() {
    this.bindSignUpForm();
    this.bindSignInForm();
    this.bindEmailVerificationForm();
    this.bindPasswordResetForm();
    this.bindChangeEmailForm();
    this.bindSignOutButton();
  },

  /**
   * Bind submit event and real-time validation to the signup form
   */
  bindSignUpForm() {
    const form = document.getElementById('signup-form');
    if (form) {
      // Submit event
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const userData = {
          email: formData.get('email').trim(),
          password: formData.get('password').trim(),
          name: formData.get('name').trim(),
          phone: formData.get('phone').trim(),
          street: formData.get('street').trim(),
          city: formData.get('city').trim(),
          postalCode: formData.get('postalCode').trim(),
          country: formData.get('country').trim() || 'France',
          fcmToken: generateString(32),
        };

        // Client-side validation
        const errors = this.validateSignUpForm(userData);
        if (Object.keys(errors).length > 0) {
          Object.entries(errors).forEach(([field, message]) => {
            this.showFieldError(field, message);
          });
          return;
        }

        try {
          await api.auth.signUp(userData);
          showNotification('Inscription réussie !', 'success');
          form.reset();
          this.clearFieldErrors(form);
          window.location.href = '/dashboard.html';
        } catch (error) {
          showNotification(error.message || 'Erreur lors de l\'inscription.', 'error');
        }
      });

      // Real-time validation
      const inputs = form.querySelectorAll('input, select');
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
   * Bind submit event and real-time validation to the signin form
   */
  bindSignInForm() {
    const form = document.getElementById('signin-form');
    if (form) {
      // Submit event
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const credentials = {
          email: formData.get('email').trim(),
          password: formData.get('password').trim(),
          fcmToken: generateString(32),
        };

        // Client-side validation
        const errors = this.validateSignInForm(credentials);
        if (Object.keys(errors).length > 0) {
          Object.entries(errors).forEach(([field, message]) => {
            this.showFieldError(field, message);
          });
          return;
        }

        try {
          await api.auth.signIn(credentials);
          showNotification('Connexion réussie !', 'success');
          form.reset();
          this.clearFieldErrors(form);
          window.location.href = '/dashboard.html';
        } catch (error) {
          showNotification(error.message || 'Erreur lors de la connexion.', 'error');
        }
      });

      // Real-time validation
      const inputs = form.querySelectorAll('input');
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
   * Bind submit event and real-time validation to the email verification form
   */
  bindEmailVerificationForm() {
    const form = document.getElementById('email-verification-form');
    if (form) {
      // Submit event
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const emailData = {
          email: formData.get('email').trim(),
          name: formData.get('name').trim(),
        };

        // Client-side validation
        const errors = this.validateEmailVerificationForm(emailData);
        if (Object.keys(errors).length > 0) {
          Object.entries(errors).forEach(([field, message]) => {
            this.showFieldError(field, message);
          });
          return;
        }

        try {
          await api.auth.sendEmailVerification(emailData.email, emailData.name);
          showNotification('Email de vérification envoyé.', 'success');
          form.reset();
          this.clearFieldErrors(form);
        } catch (error) {
          showNotification(error.message || 'Erreur lors de l\'envoi de l\'email de vérification.', 'error');
        }
      });

      // Real-time validation
      const inputs = form.querySelectorAll('input');
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
   * Bind submit event and real-time validation to the password reset form
   */
  bindPasswordResetForm() {
    const form = document.getElementById('password-reset-form');
    if (form) {
      // Submit event
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const emailData = {
          email: formData.get('email').trim(),
          name: formData.get('name').trim(),
        };

        // Client-side validation
        const errors = this.validatePasswordResetForm(emailData);
        if (Object.keys(errors).length > 0) {
          Object.entries(errors).forEach(([field, message]) => {
            this.showFieldError(field, message);
          });
          return;
        }

        try {
          await api.auth.sendPasswordReset(emailData.email, emailData.name);
          showNotification('Email de réinitialisation envoyé.', 'success');
          form.reset();
          this.clearFieldErrors(form);
        } catch (error) {
          showNotification(error.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation.', 'error');
        }
      });

      // Real-time validation
      const inputs = form.querySelectorAll('input');
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
   * Bind submit event and real-time validation to the change email form
   */
  bindChangeEmailForm() {
    const form = document.getElementById('change-email-form');
    if (form) {
      // Submit event
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const emailData = {
          currentEmail: formData.get('currentEmail').trim(),
          newEmail: formData.get('newEmail').trim(),
          name: formData.get('name').trim(),
        };

        // Client-side validation
        const errors = this.validateChangeEmailForm(emailData);
        if (Object.keys(errors).length > 0) {
          Object.entries(errors).forEach(([field, message]) => {
            this.showFieldError(field, message);
          });
          return;
        }

        try {
          await api.auth.sendVerifyAndChangeEmail(emailData.currentEmail, emailData.newEmail, emailData.name);
          showNotification('Email de changement envoyé.', 'success');
          form.reset();
          this.clearFieldErrors(form);
        } catch (error) {
          showNotification(error.message || 'Erreur lors de l\'envoi de l\'email de changement.', 'error');
        }
      });

      // Real-time validation
      const inputs = form.querySelectorAll('input');
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
   * Bind click event to the signout button
   */
  bindSignOutButton() {
    const button = document.getElementById('signout-button');
    if (button) {
      button.addEventListener('click', async () => {
        try {
          await api.auth.signOut();
          showNotification('Déconnexion réussie.', 'success');
          window.location.href = '/pages/auth/signin.html';
        } catch (error) {
          showNotification(error.message || 'Erreur lors de la déconnexion.', 'error');
        }
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
      case 'email':
      case 'currentEmail':
        if (!value) return 'L\'email est requis.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'L\'email n\'est pas valide.';
        return null;
      case 'newEmail':
        if (!value) return 'Le nouvel email est requis.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Le nouvel email n\'est pas valide.';
        return null;
      case 'password':
        if (!value) return 'Le mot de passe est requis.';
        if (value.length < 8) return 'Le mot de passe doit contenir au moins 6 caractères.';
        return null;
      case 'name':
        if (!value) return 'Le nom est requis.';
        if (value.length < 2) return 'Le nom doit contenir au moins 2 caractères.';
        return null;
      case 'phone':
        if (!value) return 'Le numéro de téléphone est requis.';
        if (!/^\+?\d{10,15}$/.test(value)) return 'Le numéro de téléphone n\'est pas valide.';
        return null;
      case 'street':
        if (!value) return 'L\'adresse est requise.';
        return null;
      case 'city':
        if (!value) return 'La ville est requise.';
        return null;
      case 'postalCode':
        if (!value) return 'Le code postal est requis.';
        if (!/^\d{5}$/.test(value)) return 'Le code postal doit contenir 5 chiffres.';
        return null;
      case 'country':
        if (!value) return 'Le pays est requis.';
        return null;
      default:
        return null;
    }
  },

  /**
   * Validate the signup form
   * @param {Object} data - Form data
   * @returns {Object} - Object with field errors
   */
  validateSignUpForm(data) {
    const errors = {};
    ['email', 'password', 'name', 'phone', 'street', 'city', 'postalCode', 'country'].forEach((field) => {
      const error = this.validateField(field, data[field]);
      if (error) errors[field] = error;
    });
    return errors;
  },

  /**
   * Validate the signin form
   * @param {Object} data - Form data
   * @returns {Object} - Object with field errors
   */
  validateSignInForm(data) {
    const errors = {};
    ['email', 'password'].forEach((field) => {
      const error = this.validateField(field, data[field]);
      if (error) errors[field] = error;
    });
    return errors;
  },

  /**
   * Validate the email verification form
   * @param {Object} data - Form data
   * @returns {Object} - Object with field errors
   */
  validateEmailVerificationForm(data) {
    const errors = {};
    ['email', 'name'].forEach((field) => {
      const error = this.validateField(field, data[field]);
      if (error) errors[field] = error;
    });
    return errors;
  },

  /**
   * Validate the password reset form
   * @param {Object} data - Form data
   * @returns {Object} - Object with field errors
   */
  validatePasswordResetForm(data) {
    const errors = {};
    ['email', 'name'].forEach((field) => {
      const error = this.validateField(field, data[field]);
      if (error) errors[field] = error;
    });
    return errors;
  },

  /**
   * Validate the change email form
   * @param {Object} data - Form data
   * @returns {Object} - Object with field errors
   */
  validateChangeEmailForm(data) {
    const errors = {};
    ['currentEmail', 'newEmail', 'name'].forEach((field) => {
      const error = this.validateField(field, data[field]);
      if (error) errors[field] = error;
    });
    if (data.currentEmail === data.newEmail) {
      errors.newEmail = 'Le nouvel email doit être différent de l\'email actuel.';
    }
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
   * Clear all field errors in a form
   * @param {HTMLFormElement} form - The form element
   */
  clearFieldErrors(form) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input) => {
      this.showFieldError(input.name, null);
    });
  },
};

export default auth;
