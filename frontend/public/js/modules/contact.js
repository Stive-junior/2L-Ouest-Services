/**
 * @file contact.js
 * @description Module de gestion du formulaire de contact pour L&L Ouest Services.
 * Gère la validation en temps réel, la modale pour la sélection des sujets, l'emoji-picker, la liste des contacts, et les réponses.
 * Inclut la vérification de disponibilité d'email avec cache et persistance des données du formulaire après rafraîchissement.
 * @module contact
 */

import api from '../api.js';
import { showNotification, validateField, showLoadingDialog, formatDate, handleApiError, validateFieldInitial } from './utils.js';

let isSubmitting = false;

const contact = {
  subjectsList: [
    { name: 'Demande de devis', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5h6m-6 4h6m-6 4h3m-6 4h6m2-12h4a2 2 0 012 2v8a2 2 0 01-2 2h-4" />', type: 'quote' },
    { name: 'Service client', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />', type: 'support' },
    { name: 'Partenariat', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />', type: 'partner' },
    { name: 'Nettoyage résidentiel', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />' },
    { name: 'Nettoyage commercial', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7a3 3 0 11-6 0 3 3 0 016 0z" />' },
    { name: 'Nettoyage en profondeur', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />' },
    { name: 'Nettoyage de vitres', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />' },
    { name: 'Nettoyage après travaux', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />' },
    { name: 'Désinfection', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z m-1 15v-2h2v2h-2z m0-4v-6h2v6h-2z" />' },
    { name: 'Autre', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />', type: 'other' },
  ],

  /**
   * Initialise le module de contact.
   * @function init
   */
  init() {
    this.bindContactForm();
    this.bindTextAreaUtilities();
    this.bindSubjectSelection();
    this.bindContactList();
    this.bindFilterForm();
    this.loadSelectedSubjects();
    this.loadFormData();
  },

  /**
   * Vérifie si un email est valide en format avant toute opération.
   * @function isValidEmailFormat
   * @param {string} email - L'adresse email à valider
   * @returns {boolean} True si le format est valide
   */
  isValidEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Vérifie la disponibilité d'un email avec cache LocalStorage.
   * @async
   * @function checkEmailAvailabilityCached
   * @param {string} email - L'adresse email à vérifier
   * @param {boolean} [force=false] - Force la vérification même si en cache
   * @returns {Promise<boolean|undefined>} True si disponible, false si existe déjà, undefined si backend indisponible
   * @throws {Error} En cas d'erreur technique
   */
  async checkEmailAvailabilityCached(email, force = false) {
    if (!this.isValidEmailFormat(email)) {
      console.warn('Format email invalide:', email);
      return undefined;
    }

    const cacheKey = `email_availability_${btoa(email)}`;
    const cacheData = JSON.parse(localStorage.getItem(cacheKey));
    const now = Date.now();
    const isCacheValid = cacheData && (now - cacheData.timestamp) < (10 * 60 * 1000);

    if (!force && isCacheValid) {
      return cacheData.available;
    }

    try {
      const available = await api.user.checkEmailAvailability(email);
      if (available === undefined) {
        console.warn('Backend indisponible pour vérification email:', email);
        return undefined;
      }

      localStorage.setItem(cacheKey, JSON.stringify({
        email,
        available,
        timestamp: now,
        checkedAt: new Date().toISOString(),
      }));
      return available;
    } catch (error) {
      if (error.statusCode === 400 && error.message?.includes('email')) {
        console.warn('Email rejeté par validation backend, mis en cache comme disponible:', email);
        localStorage.setItem(cacheKey, JSON.stringify({
          email,
          available: true,
          timestamp: now,
          checkedAt: new Date().toISOString(),
          note: 'format_invalid',
        }));
        return true;
      }
      console.error('Erreur vérification email:', error);
      throw error;
    }
  },

  /**
   * Invalide tous les caches d'email availability.
   * @function invalidateEmailCache
   */
  invalidateEmailCache() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('email_availability_'));
    keys.forEach(key => {
      localStorage.removeItem(key);
      console.log('Cache email invalidé:', key);
    });
  },

  /**
   * Sauvegarde les données du formulaire dans localStorage.
   * @function saveFormData
   */
  saveFormData() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const formData = new FormData(form);
    const contactData = {
      name: formData.get('name')?.trim() || '',
      email: formData.get('email')?.trim() || '',
      phone: formData.get('phone')?.trim() || '',
      subjects: formData.get('subjects')?.trim() || '',
      message: formData.get('message')?.trim() || '',
    };
    localStorage.setItem('contactFormData', JSON.stringify(contactData));
  },

  /**
   * Charge les données du formulaire depuis localStorage.
   * @function loadFormData
   */
  loadFormData() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const savedData = localStorage.getItem('contactFormData');
    if (savedData) {
      const contactData = JSON.parse(savedData);
      form.querySelector('[name="name"]').value = contactData.name || '';
      form.querySelector('[name="email"]').value = contactData.email || '';
      form.querySelector('[name="phone"]').value = contactData.phone ? contactData.phone.replace('+33 ', '') : '';
      form.querySelector('[name="subjects"]').value = contactData.subjects || '';
      form.querySelector('[name="message"]').value = contactData.message || '';
      this.loadSelectedSubjects();
    }
  },

/**
 * Affiche un message d'erreur ou de validation pour un champ de formulaire.
 * @function showFieldError
 * @param {string} field - Nom du champ.
 * @param {string|null} message - Message d'erreur, de validation ou de suggestion, ou null pour effacer.
 */
showFieldError(field, message) {
  const input = document.querySelector(field === 'subjects' ? '#subject-display' : `[name="${field}"]`);
  if (!input) {
    console.warn(`Champ ${field} non trouvé`);
    return;
  }

  const errorElement = input.parentElement.querySelector('.error-message') || input.parentElement.parentElement.querySelector('.error-message');
  if (!errorElement) {
    console.warn(`Élément d'erreur pour le champ ${field} non trouvé`);
    return;
  }

  // Réinitialiser les classes de bordure
  input.classList.remove(
    'border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50',
    'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50',
    'border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50',
    'border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50',
    'border-gray-300', 'dark:border-gray-600'
  );

  if (message) {
    if (message.includes('fa-check-circle')) {
      // Validation réussie (vert)
      errorElement.innerHTML = `<span class="text-green-500">${message}</span>`;
      errorElement.classList.remove('text-red-500', 'text-yellow-500', 'text-blue-500', 'hidden');
      errorElement.classList.add('text-green-500', 'block');
      input.classList.add('border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
    } else if (message.includes('fa-spinner') || message.toLowerCase().includes('vérification')) {
      // Vérification en cours ou message contenant "vérification" (bleu)
      errorElement.innerHTML = `<span class="text-blue-500"><i class="fas ${message.includes('fa-spinner') ? 'fa-spinner fa-spin' : 'fa-info-circle'} mr-1"></i>${message}</span>`;
      errorElement.classList.remove('text-red-500', 'text-green-500', 'text-yellow-500', 'hidden');
      errorElement.classList.add('text-blue-500', 'block');
      input.classList.add('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50');
    } else if (message.includes('fa-exclamation')) {
      // Avertissement (bleu au lieu de jaune)
      errorElement.innerHTML = `<span class="text-blue-500"><i class="fas fa-exclamation-circle mr-1"></i>${message}</span>`;
      errorElement.classList.remove('text-red-500', 'text-green-500', 'text-yellow-500', 'hidden');
      errorElement.classList.add('text-blue-500', 'block');
      input.classList.add('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50');
    } else {
      // Erreur (rouge)
      errorElement.innerHTML = `<span class="text-red-500"><i class="fas fa-times-circle mr-1"></i>${message}</span>`;
      errorElement.classList.remove('text-green-500', 'text-yellow-500', 'text-blue-500', 'hidden');
      errorElement.classList.add('text-red-500', 'block');
      input.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
    }
  } else {
    // Effacer le message
    errorElement.innerHTML = '';
    errorElement.classList.add('hidden');
    errorElement.classList.remove('text-red-500', 'text-green-500', 'text-yellow-500', 'text-blue-500');
    input.classList.add('border-gray-300', 'dark:border-gray-600', 'focus:border-blue-500', 'focus:ring-blue-500/50');
  }
},


  /**
   * Met à jour l'état du bouton de soumission basé sur la validité du formulaire.
   * @function updateSubmitButtonState
   * @param {HTMLElement} form - Le formulaire.
   * @param {HTMLElement} submitButton - Le bouton de soumission.
   */
  updateSubmitButtonState(form, submitButton) {
    const formData = new FormData(form);
    const contactData = {
      name: formData.get('name')?.trim() || '',
      email: formData.get('email')?.trim() || '',
      phone: formData.get('phone')?.trim() ? `+33 ${formData.get('phone').trim()}` : '',
      subjects: formData.get('subjects')?.trim().split(',').filter(s => s) || [],
      message: formData.get('message')?.trim() || '',
    };

    const errors = this.validateForm(contactData);
    const isEmailValid = !validateField('email', contactData.email, false, true);
    const isNameValid = !validateField('name', contactData.name, false, true);
    const isPhoneValid = !validateField('phone', contactData.phone, false, true);
    const isSubjectsValid = !errors.subjects;
    const isMessageValid = !errors.message;

    const emailErrorElement = document.getElementById('error-email');
    const hasApiError = emailErrorElement && !emailErrorElement.innerHTML.includes('fa-check-circle') && emailErrorElement.innerHTML.trim() !== '';

    const isValid = isEmailValid && isNameValid && isPhoneValid && isSubjectsValid && isMessageValid && !hasApiError;

    submitButton.disabled = !isValid;
    submitButton.classList.toggle('opacity-50', !isValid);
    submitButton.classList.toggle('cursor-not-allowed', !isValid);
  },

  /**
   * Vérifie la disponibilité de l'email et met à jour l'UI.
   * @async
   * @function checkEmailAndUpdateButton
   * @param {string} value - La valeur de l'email à vérifier.
   * @param {boolean} isInitialLoad - Indique si l'appel vient de l'initialisation.
   * @param {HTMLElement} form - Le formulaire.
   * @param {HTMLElement} submitButton - Le bouton de soumission.
   * @param {HTMLElement} emailInput - Le champ email.
   */
  async checkEmailAndUpdateButton(value, isInitialLoad, form, submitButton, emailInput) {
    const syntaxError = validateField('email', value, false, true);
    if (syntaxError) {
      this.showFieldError('email', syntaxError);
      emailInput.classList.remove('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50', 'border-green-500', 'border-yellow-500');
      emailInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
      this.updateSubmitButtonState(form, submitButton);
      return;
    }

    if (isInitialLoad && value) {
      this.showFieldError('email', 'Vérification de l\'email en cours... <i class="fas fa-spinner fa-spin ml-1 text-blue-500"></i>');
      emailInput.classList.remove('border-green-500', 'border-yellow-500', 'border-red-500');
      emailInput.classList.add('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50');
      submitButton.disabled = true;
      submitButton.classList.add('opacity-50', 'cursor-not-allowed');
    }

    try {
      const available = await this.checkEmailAvailabilityCached(value);

      if (!isInitialLoad) {
        submitButton.innerHTML = `
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          <span>Envoyer le message</span>
        `;
      }

      if (available === undefined) {
        this.showFieldError('email', 'Vérification en attente (serveur indisponible) <i class="fas fa-exclamation ml-1 text-yellow-500"></i>');
        emailInput.classList.remove('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50', 'border-green-500');
        emailInput.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
      } else if (!available) {
        this.showFieldError('email', 'Cet email est déjà utilisé. <i class="fas fa-exclamation ml-1 text-blue-500"></i> <a href="/pages/auth/signin.html" class="!text-black dark:!text-white hover:underline">Se connecter</a>');
        emailInput.classList.add('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50', 'border-green-500');
        emailInput.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        this.showFieldError('email', 'Email valide <i class="fas fa-check-circle ml-1 text-green-500"></i>');
        emailInput.classList.remove('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50', 'border-yellow-500', 'border-red-500');
        emailInput.classList.add('border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
        this.updateSubmitButtonState(form, submitButton);
      }
    } catch (e) {
      console.error('Erreur vérification email:', e);
      this.showFieldError('email', 'Erreur technique lors de la vérification de l\'email');
      emailInput.classList.remove('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50', 'border-green-500', 'border-yellow-500');
      emailInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
      submitButton.disabled = true;
      submitButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
  },

  /**
   * Effectue la validation initiale du formulaire au chargement.
   * @async
   * @function initialValidation
   * @param {HTMLElement} form - Le formulaire.
   * @param {HTMLElement} submitButton - Le bouton de soumission.
   * @param {HTMLElement} emailInput - Le champ email.
   */
  async initialValidation(form, submitButton, emailInput) {
    const formData = new FormData(form);
    const contactData = {
      name: formData.get('name')?.trim() || '',
      email: formData.get('email')?.trim() || '',
      phone: formData.get('phone')?.trim() ? `+33 ${formData.get('phone').trim()}` : '',
      subjects: formData.get('subjects')?.trim().split(',').filter(s => s) || [],
      message: formData.get('message')?.trim() || '',
    };

    form.querySelectorAll('input:not([type="hidden"]), textarea, #subject-display').forEach(input => {
      const field = input.name || (input.id === 'subject-display' ? 'subjects' : input.name);
      let value = input.value.trim();
      if (field === 'phone' && value) value = `+33 ${value}`;
      if (field === 'subjects') value = value ? value.split(',').filter(s => s) : [];

      let error = null;
      if (field === 'subjects') {
        const validSubjects = this.subjectsList.map(subject => subject.name);
        if (value.some(s => !validSubjects.includes(s))) error = `Les sujets suivants sont invalides : ${value.filter(s => !validSubjects.includes(s)).join(', ')}.`;
      } else {
        error = validateFieldInitial(field, value, false, true);
      }

      this.showFieldError(field, error || (value && field !== 'subjects' ? `${this.getFieldName(field)} valide <i class="fas fa-check-circle ml-1 text-green-500"></i>` : field === 'subjects' && value.length > 0 ? `Sujet(s) valide(s) <i class="fas fa-check-circle ml-1 text-green-500"></i>` : ''));
    });

    if (contactData.email) {
      const emailSyntaxError = validateFieldInitial('email', contactData.email, false, true);
      if (!emailSyntaxError) {
        await this.checkEmailAndUpdateButton(contactData.email, true, form, submitButton, emailInput);
      }
    }

    if (!contactData.email) {
      this.updateSubmitButtonState(form, submitButton);
    }
  },

  /**
   * Retourne le nom du champ en français pour l'affichage.
   * @function getFieldName
   * @param {string} field - Nom du champ en anglais.
   * @returns {string} Nom du champ en français.
   */
  getFieldName(field) {
    const fieldNames = {
      name: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      subjects: 'Sujets',
      message: 'Message',
    };
    return fieldNames[field.toLowerCase()] || field;
  },

  /**
   * Lie le formulaire de contact pour gérer la soumission et la validation en temps réel.
   * @function bindContactForm
   */
  bindContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const submitButton = form.querySelector('#contact-submit');
    const emailInput = form.querySelector('[name="email"]');
    if (!submitButton || !emailInput) {
      console.warn('Bouton de soumission ou champ email introuvable');
      return;
    }

    submitButton.disabled = true;
    submitButton.classList.add('opacity-50', 'cursor-not-allowed');

    this.initialValidation(form, submitButton, emailInput);

    form.querySelectorAll('input:not([type="hidden"]), textarea, #subject-display').forEach(input => {
      input.addEventListener('input', async () => {
        const field = input.name || (input.id === 'subject-display' ? 'subjects' : input.name);
        let value = input.value.trim();
        if (field === 'phone' && value) value = `+33 ${value.replace(/\s+/g, ' ').trim()}`;
        if (field === 'subjects') value = value ? value.split(',').filter(s => s) : [];

        let error = null;
        if (field === 'message') {
          if (!value) error = 'Le message est requis.';
          else if (value.length < 10) error = 'Le message doit contenir au moins 10 caractères.';
          else if (value.length > 1000) error = 'Le message ne peut pas dépasser 1000 caractères.';
        } else if (field === 'subjects') {
          const validSubjects = this.subjectsList.map(subject => subject.name);
          if (!value || value.length === 0) error = 'Veuillez sélectionner au moins un sujet.';
          else if (value.some(s => !validSubjects.includes(s))) error = `Les sujets suivants sont invalides : ${value.filter(s => !validSubjects.includes(s)).join(', ')}.`;
        } else {
          error = validateField(field, value, false, true);
        }

        this.showFieldError(
          field,
          error || (value && field !== 'subjects' ? `${this.getFieldName(field)} valide <i class="fas fa-check-circle ml-1 text-green-500"></i>` : field === 'subjects' && value.length > 0 ? `Sujet(s) valide(s) <i class="fas fa-check-circle ml-1 text-green-500"></i>` : '')
        );

        if (field === 'email' && !error) {
          this.showFieldError('email', `${this.getFieldName('email')} format valide <i class="fas fa-check-circle ml-1 text-blue-500"></i>`);
        }

        this.updateSubmitButtonState(form, submitButton);
        this.saveFormData();
      });

      if (input.id === 'email') {
        input.addEventListener('blur', async () => {
          const value = decodeURIComponent(input.value.trim());
          const syntaxError = validateField('email', value, false, true);

          if (syntaxError) {
            this.showFieldError('email', syntaxError);
            await this.checkEmailAndUpdateButton(value, false, form, submitButton, emailInput);
            return;
          }

          this.showFieldError('email', 'Vérification de l\'email en cours... <i class="fas fa-spinner fa-spin ml-1 text-blue-500"></i>');
          emailInput.classList.remove('border-green-500', 'border-yellow-500', 'border-red-500');
          emailInput.classList.add('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50');
          submitButton.disabled = true;
          submitButton.classList.add('opacity-50', 'cursor-not-allowed');
          submitButton.innerHTML = `
            <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Vérification...
          `;

          await this.checkEmailAndUpdateButton(value, false, form, submitButton, emailInput);
        });
      }

      if (input.id === 'phone') {
        input.addEventListener('input', () => {
          let value = input.value.trim();
          value = value.replace(/[^0-9\s]/g, '').replace(/\s+/g, ' ').trim();
          input.value = value;
          const fullPhone = value ? `+33 ${value}` : '';
          const error = validateField('phone', fullPhone, false, true);
          this.showFieldError('phone', error || (value ? `Téléphone valide <i class="fas fa-check-circle ml-1 text-green-500"></i>` : ''));
          this.updateSubmitButtonState(form, submitButton);
          this.saveFormData();
        });
      }
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitButton.disabled || isSubmitting) {
        console.log('Soumission bloquée : bouton désactivé ou soumission en cours');
        return;
      }

      isSubmitting = true;
      await showLoadingDialog('Envoi de votre message...', 'Cleaning');
      submitButton.disabled = true;
      submitButton.innerHTML = `
        <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Envoi...
      `;

      try {
        const formData = new FormData(form);
        let phoneValue = formData.get('phone')?.trim() || '';
        if (phoneValue) phoneValue = `+33 ${phoneValue.replace(/\s+/g, ' ').trim()}`;
        const subjectsArray = formData.get('subjects')?.trim().split(',').filter(s => s) || [];

        const contactData = {
          id: crypto.randomUUID(),
          name: formData.get('name')?.trim() || '',
          email: formData.get('email')?.trim() || '',
          phone: phoneValue,
          subjects: subjectsArray.join('-'),
          message: formData.get('message')?.trim() || '',
          createdAt: new Date().toISOString(),
        };

        const errors = this.validateForm(contactData);
        if (Object.keys(errors).length > 0) {
          Object.entries(errors).forEach(([field, message]) => this.showFieldError(field, message));
          showNotification('Veuillez corriger les erreurs dans le formulaire.', 'error');
          Swal.close();
          return;
        }

        const emailError = validateField('email', contactData.email, false, true);
        if (emailError) {
          this.showFieldError('email', emailError);
          showNotification('Veuillez corriger l\'email.', 'error');
          Swal.close();
          return;
        }

        const available = await this.checkEmailAvailabilityCached(contactData.email, true);
        if (available === undefined) {
          this.showFieldError('email', 'Vérification en attente (serveur indisponible) <i class="fas fa-exclamation ml-1 text-yellow-500"></i>');
          showNotification('Serveur temporairement indisponible.', 'error');
          Swal.close();
          return;
        }
        if (!available) {
          this.showFieldError('email', 'Cet email est déjà utilisé. <i class="fas fa-exclamation ml-1 text-yellow-500"></i> <a href="/pages/auth/signin.html" class="text-blue-500 hover:underline">Se connecter</a>');
          showNotification('Cet email est déjà utilisé.', 'error');
          Swal.close();
          return;
        }

        const confirmed = await this.showPreConfirmationModal(contactData);
        if (!confirmed) {
          Swal.close();
          return;
        }

        const response = await api.contact.createContact(contactData);
        await this.showConfirmationModal(contactData);

        form.reset();
        document.getElementById('selected-subjects').innerHTML = '';
        document.querySelector('[name="subjects"]').value = '';
        document.getElementById('subject-display').value = '';
        this.clearFieldErrors();
        this.clearSelectedSubjectsStorage();
        this.invalidateEmailCache();
        localStorage.removeItem('contactFormData');
        this.updateSubmitButtonState(form, submitButton);
      } catch (error) {
        Swal.close();
        let errorMessage = error.message || 'Erreur technique lors de l\'envoi du message.';
        if (error.status === 429) {
          errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
        } else if (error.reason === 'email-already-in-use') {
          errorMessage = 'Cet email est déjà utilisé. <a href="/pages/auth/signin.html" class="text-blue-500 hover:underline">Se connecter</a>';
        }
        showNotification(errorMessage, 'error');
      } finally {
        isSubmitting = false;
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        submitButton.innerHTML = `
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          <span>Envoyer le message</span>
        `;
        this.initialValidation(form, submitButton, emailInput);
      }
    });
  },

  /**
   * Lie les utilitaires du textarea (emoji picker).
   * @function bindTextAreaUtilities
   */
  bindTextAreaUtilities() {
    const textarea = document.getElementById('message');
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPicker = document.querySelector('.emoji-picker');

    if (!textarea || !emojiBtn || !emojiPicker) return;

    const insertAtCursor = (text) => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
      textarea.dispatchEvent(new Event('input'));
    };

    emojiBtn.addEventListener('click', () => {
      emojiPicker.classList.toggle('hidden');
    });

    emojiPicker.addEventListener('emoji-click', (event) => {
      insertAtCursor(event.detail.unicode);
      emojiPicker.classList.add('hidden');
    });

    document.addEventListener('click', (event) => {
      if (!emojiBtn.contains(event.target) && !emojiPicker.contains(event.target)) {
        emojiPicker.classList.add('hidden');
      }
    });
  },

  /**
   * Lie la sélection des sujets.
   * @function bindSubjectSelection
   */
  bindSubjectSelection() {
    const subjectDisplay = document.getElementById('subject-display');
    if (!subjectDisplay) return;

    subjectDisplay.addEventListener('click', () => {
      this.openSubjectsModal();
    });
  },

  /**
   * Ouvre la modale de sélection des sujets.
   * @function openSubjectsModal
   */
  openSubjectsModal() {
    const modal = document.createElement('div');
    modal.id = 'subjects-modal';
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 md:p-6 transition-opacity duration-500 opacity-0';

    const isDark = document.documentElement.classList.contains('dark');
    const bgClass = isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const borderClass = isDark ? 'border-gray-600' : 'border-gray-200';

    modal.innerHTML = `
      <div class="modal-content ${bgClass} rounded-2xl shadow-2xl max-w-4xl w-full mx-auto overflow-hidden transform scale-95 transition-transform duration-500">
        <button class="modal-close absolute top-4 right-4 z-10 bg-white dark:bg-gray-700 rounded-full p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-md" aria-label="Fermer la modale">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div class="p-6 md:p-8">
          <h3 class="text-2xl font-sans font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-ll-dark-green to-ll-dark-blue bg-[length:200%_100%] animate-gradient-scroll">Sélectionnez les sujets</h3>
          <div class="relative mb-4">
            <input type="text" id="subject-search" class="w-full pl-4 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ll-blue focus:border-ll-blue text-gray-900 dark:text-gray-100 transition-all duration-300" placeholder="Rechercher un sujet..." />
          </div>
          <div id="subjects-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto"></div>
          <div class="mt-6 flex justify-end space-x-4">
            <button class="modal-cancel px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">Annuler</button>
            <button class="modal-confirm px-4 py-2 bg-ll-blue text-white rounded-lg hover:bg-ll-dark-blue focus:ring-2 focus:ring-ll-blue/50 transition-all">Confirmer</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    setTimeout(() => {
      modal.classList.remove('opacity-0');
      modal.classList.add('opacity-100');
      modal.querySelector('.modal-content').classList.remove('scale-95');
      modal.querySelector('.modal-content').classList.add('scale-100');
    }, 10);

    const subjectsListEl = modal.querySelector('#subjects-list');
    const searchInput = modal.querySelector('#subject-search');
    const subjectsInput = document.getElementById('subjects');
    const selectedSubjects = new Set(subjectsInput.value ? subjectsInput.value.split(',').filter(s => s) : []);

    const renderSubjects = (filter = '') => {
      subjectsListEl.innerHTML = this.subjectsList
        .filter(subject => subject.name.toLowerCase().includes(filter.toLowerCase()))
        .map(subject => `
          <div class="subject-card p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md ${selectedSubjects.has(subject.name) ? 'bg-ll-blue/20 border-ll-blue border-2' : ''}" data-name="${subject.name}">
            <div class="flex items-center space-x-3">
              <input type="checkbox" value="${subject.name}" class="sr-only">
              <svg class="w-6 h-6 text-ll-text-gray dark:text-ll-medium-gray flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">${subject.icon}</svg>
              <span class="text-base font-medium">${subject.name}</span>
            </div>
          </div>
        `).join('');

      subjectsListEl.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', () => {
          const name = card.dataset.name;
          if (selectedSubjects.has(name)) {
            selectedSubjects.delete(name);
            card.classList.remove('bg-ll-blue/20', 'border-ll-blue', 'border-2');
          } else {
            selectedSubjects.add(name);
            card.classList.add('bg-ll-blue/20', 'border-ll-blue', 'border-2');
          }
        });
      });
    };

    renderSubjects();

    searchInput.addEventListener('input', () => renderSubjects(searchInput.value));

    const closeModal = () => {
      modal.classList.remove('opacity-100');
      modal.classList.add('opacity-0');
      modal.querySelector('.modal-content').classList.remove('scale-100');
      modal.querySelector('.modal-content').classList.add('scale-95');
      setTimeout(() => modal.remove(), 500);
      document.body.style.overflow = 'auto';
    };

    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-cancel').addEventListener('click', closeModal);
    modal.querySelector('.modal-confirm').addEventListener('click', () => {
      const selected = Array.from(selectedSubjects);
      const selectedSubjectsEl = document.getElementById('selected-subjects');
      selectedSubjectsEl.innerHTML = selected.map(sub => `
        <span class="service-feature inline-flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-sm text-gray-900 dark:text-gray-100">
          ${sub}
          <button type="button" class="ml-2 text-red-500 hover:text-red-700" data-remove="${sub}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </span>
      `).join('');

      subjectsInput.value = selected.join(',');
      document.getElementById('subject-display').value = selected.length > 0 ? `${selected.length} sujet(s) sélectionné(s)` : '';
      document.getElementById('subject-display').dispatchEvent(new Event('input'));

      selectedSubjectsEl.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          const toRemove = btn.dataset.remove;
          selectedSubjects.delete(toRemove);
          subjectsInput.value = Array.from(selectedSubjects).join(',');
          btn.parentElement.remove();
          document.getElementById('subject-display').value = selectedSubjects.size > 0 ? `${selectedSubjects.size} sujet(s) sélectionné(s)` : '';
          document.getElementById('subject-display').dispatchEvent(new Event('input'));
          this.saveSelectedSubjects();
        });
      });

      this.saveSelectedSubjects();
      this.saveFormData();
      closeModal();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    searchInput.focus();
    document.body.style.overflow = 'hidden';
  },

  /**
   * Efface les sujets sélectionnés dans localStorage.
   * @function clearSelectedSubjectsStorage
   */
  clearSelectedSubjectsStorage() {
    localStorage.removeItem('selectedSubjects');
    localStorage.removeItem('contactFormData');
    this.invalidateEmailCache();
    const subjectsInput = document.getElementById('subjects');
    const selectedSubjectsEl = document.getElementById('selected-subjects');
    const subjectDisplay = document.getElementById('subject-display');
    if (subjectsInput && selectedSubjectsEl && subjectDisplay) {
      subjectsInput.value = '';
      selectedSubjectsEl.innerHTML = '';
      subjectDisplay.value = '';
      subjectDisplay.dispatchEvent(new Event('input'));
    }
  },

  /**
   * Sauvegarde les sujets sélectionnés dans localStorage.
   * @function saveSelectedSubjects
   */
  saveSelectedSubjects() {
    const subjectsInput = document.getElementById('subjects');
    if (subjectsInput) {
      localStorage.setItem('selectedSubjects', subjectsInput.value);
      this.saveFormData();
    }
  },

  /**
   * Charge les sujets sélectionnés depuis localStorage.
   * @function loadSelectedSubjects
   */
  loadSelectedSubjects() {
    const subjectsInput = document.getElementById('subjects');
    const selectedSubjectsEl = document.getElementById('selected-subjects');
    const subjectDisplay = document.getElementById('subject-display');

    if (!subjectsInput || !selectedSubjectsEl || !subjectDisplay) return;

    const saved = subjectsInput.value ? subjectsInput.value : localStorage.getItem('selectedSubjects');
    if (saved) {
      subjectsInput.value = saved;
      const selected = saved.split(',').filter(s => s);
      const selectedSubjectsSet = new Set(selected);

      selectedSubjectsEl.innerHTML = selected.map(sub => `
        <span class="service-feature inline-flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-sm text-gray-900 dark:text-gray-100">
          ${sub}
          <button type="button" class="ml-2 text-red-500 hover:text-red-700" data-remove="${sub}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </span>
      `).join('');

      subjectDisplay.value = selected.length > 0 ? `${selected.length} sujet(s) sélectionné(s)` : '';

      selectedSubjectsEl.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          const toRemove = btn.dataset.remove;
          selectedSubjectsSet.delete(toRemove);
          subjectsInput.value = Array.from(selectedSubjectsSet).join(',');
          btn.parentElement.remove();
          subjectDisplay.value = selectedSubjectsSet.size > 0 ? `${selectedSubjectsSet.size} sujet(s) sélectionné(s)` : '';
          subjectDisplay.dispatchEvent(new Event('input'));
          this.saveSelectedSubjects();
        });
      });

      subjectDisplay.dispatchEvent(new Event('input'));
    } else {
      subjectsInput.value = '';
      selectedSubjectsEl.innerHTML = '';
      subjectDisplay.value = '';
      subjectDisplay.dispatchEvent(new Event('input'));
    }
  },

  /**
   * Lie les événements pour la liste des contacts.
   * @function bindContactList
   */
  bindContactList() {
    const contactTable = document.getElementById('contact-table');
    if (!contactTable) return;

    contactTable.addEventListener('click', async (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      const contactId = target.dataset.id;

      try {
        switch (action) {
          case 'view':
            await this.showContactDetails(contactId);
            break;
          case 'reply':
            await this.showReplyModal(contactId);
            break;
          case 'update':
            await this.showUpdateModal(contactId);
            break;
          case 'delete':
            await this.deleteContact(contactId);
            break;
        }
      } catch (error) {
        await handleApiError(error, 'Erreur lors de l\'opération sur le contact');
      }
    });

    this.loadContacts();
  },

  /**
   * Lie le formulaire de filtrage des contacts.
   * @function bindFilterForm
   */
  bindFilterForm() {
    const filterForm = document.getElementById('filter-form');
    if (!filterForm) return;

    filterForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(filterForm);
      const filters = {
        name: formData.get('filter-name')?.trim() || '',
        email: formData.get('filter-email')?.trim() || '',
        page: parseInt(formData.get('page') || '1', 10),
        limit: parseInt(formData.get('limit') || '10', 10),
      };
      await this.loadContacts(filters);
    });

    filterForm.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', () => filterForm.requestSubmit());
    });
  },

  /**
   * Charge la liste des contacts.
   * @function loadContacts
   * @param {Object} filters - Filtres pour la liste des contacts.
   */
  async loadContacts(filters = { page: 1, limit: 10 }) {
    const contactTableBody = document.getElementById('contact-table-body');
    const pagination = document.getElementById('pagination');
    if (!contactTableBody || !pagination) return;

    try {
      await showLoadingDialog('Chargement des contacts...', 'Loading');
      const response = await api.contact.getAllContacts(filters.page, filters.limit);
      Swal.close();

      contactTableBody.innerHTML = response.contacts
        .map(
          (contact) => `
            <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-ll-light-gray/20 dark:hover:bg-ll-medium-gray/20 transition-colors duration-200">
              <td class="py-4 px-6">${contact.name}</td>
              <td class="py-4 px-6">${contact.email}</td>
              <td class="py-4 px-6">${contact.subjects ? contact.subjects.join(', ') : 'N/A'}</td>
              <td class="py-4 px-6">${formatDate(contact.createdAt)}</td>
              <td class="py-4 px-6 flex space-x-2">
                <button data-action="view" data-id="${contact.id}" class="text-ll-blue hover:text-ll-dark-blue" title="Voir">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                </button>
                <button data-action="reply" data-id="${contact.id}" class="text-ll-blue hover:text-ll-dark-blue" title="Répondre">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6"/>
                  </svg>
                </button>
                <button data-action="update" data-id="${contact.id}" class="text-ll-blue hover:text-ll-dark-blue" title="Modifier">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button data-action="delete" data-id="${contact.id}" class="text-red-500 hover:text-red-700" title="Supprimer">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M4 7h16"/>
                  </svg>
                </button>
              </td>
            </tr>
          `
        )
        .join('');

      pagination.innerHTML = this.renderPagination(response.pagination);
    } catch (error) {
      Swal.close();
      await handleApiError(error, 'Erreur lors du chargement des contacts');
    }
  },

  /**
   * Rend la pagination pour la liste des contacts.
   * @function renderPagination
   * @param {Object} pagination - Données de pagination.
   * @returns {string} HTML de la pagination.
   */
  renderPagination({ total, page, limit }) {
    const totalPages = Math.ceil(total / limit);
    const prevDisabled = page === 1 ? 'opacity-50 cursor-not-allowed' : '';
    const nextDisabled = page === totalPages ? 'opacity-50 cursor-not-allowed' : '';
    return `
      <div class="flex justify-center space-x-2 mt-4">
        <button class="px-4 py-2 bg-ll-blue text-white rounded-lg ${prevDisabled}" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <span class="px-4 py-2 text-ll-text-gray dark:text-ll-medium-gray">Page ${page} / ${totalPages}</span>
        <button class="px-4 py-2 bg-ll-blue text-white rounded-lg ${nextDisabled}" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    `;
  },

  /**
   * Affiche les détails d'un contact.
   * @function showContactDetails
   * @param {string} contactId - ID du contact.
   */
  async showContactDetails(contactId) {
    try {
      const contact = await api.contact.getContact(contactId);
      const isDark = document.documentElement.classList.contains('dark');
      const bgClass = isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
      const borderClass = isDark ? 'border-gray-600' : 'border-gray-200';

      await Swal.fire({
        title: 'Détails du contact',
        html: `
          <div class="${bgClass} p-6 rounded-xl ${borderClass} shadow-lg">
            <div class="flex justify-between items-center mb-4">
              <img src="/assets/images/logo.png" alt="L&L Ouest Services Logo" class="h-12">
              <span class="text-sm">${formatDate(contact.createdAt)}</span>
            </div>
            <p class="text-base mb-2"><strong>Nom :</strong> ${contact.name}</p>
            <p class="text-base mb-2"><strong>Email :</strong> ${contact.email}</p>
            <p class="text-base mb-2"><strong>Téléphone :</strong> ${contact.phone || 'N/A'}</p>
            <p class="text-base mb-2"><strong>Sujets :</strong> ${contact.subjects ? contact.subjects.join(', ') : 'N/A'}</p>
            <p class="text-base mb-2"><strong>Message :</strong> ${contact.message}</p>
            <p class="text-base"><strong>Date :</strong> ${formatDate(contact.createdAt)}</p>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Fermer',
        confirmButtonColor: '#1e90ff',
        background: isDark ? '#1B1B18' : '#FDFDFC',
        color: isDark ? '#FDFDFC' : '#1B1B18',
        customClass: { popup: 'swal-wide max-w-2xl' },
        didOpen: () => {
          Swal.getPopup().classList.add('animate__animated', 'animate__fadeInDown');
        },
      });
    } catch (error) {
      await handleApiError(error, 'Erreur lors de l\'affichage des détails du contact');
    }
  },

  /**
   * Affiche la modale pour répondre à un contact.
   * @function showReplyModal
   * @param {string} contactId - ID du contact.
   */
  async showReplyModal(contactId) {
    try {
      const contact = await api.contact.getContact(contactId);
      const isDark = document.documentElement.classList.contains('dark');
      const bgClass = isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
      const borderClass = isDark ? 'border-gray-600' : 'border-gray-200';

      const { value: replyMessage } = await Swal.fire({
        title: `Répondre à ${contact.name}`,
        html: `
          <div class="${bgClass} p-6 rounded-xl ${borderClass} shadow-lg">
            <div class="flex justify-between items-center mb-4">
              <img src="/assets/images/logo.png" alt="L&L Ouest Services Logo" class="h-12">
              <span class="text-sm">${formatDate(new Date().toISOString())}</span>
            </div>
            <p class="text-base mb-4"><strong>Message original :</strong> ${contact.message}</p>
            <textarea id="swal-reply-message" class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-ll-blue focus:border-ll-blue" rows="5" placeholder="Votre réponse..."></textarea>
          </div>
        `,
        showCancelButton: true,
        cancelButtonText: 'Annuler',
        confirmButtonText: 'Envoyer',
        confirmButtonColor: '#1e90ff',
        background: isDark ? '#1B1B18' : '#FDFDFC',
        color: isDark ? '#FDFDFC' : '#1B1B18',
        customClass: { popup: 'swal-wide max-w-2xl' },
        preConfirm: () => {
          const reply = document.getElementById('swal-reply-message').value.trim();
          if (!reply || reply.length < 10) {
            Swal.showValidationMessage('La réponse doit contenir au moins 10 caractères.');
            return false;
          }
          return reply;
        },
        didOpen: () => {
          Swal.getPopup().classList.add('animate__animated', 'animate__fadeInDown');
        },
      });

      if (replyMessage) {
        try {
          await showLoadingDialog('Envoi de la réponse...', 'Sending');
          await api.contact.updateContact(contactId, {
            ...contact,
            reply: replyMessage,
            repliedAt: new Date().toISOString(),
          });
          Swal.close();
          showNotification('Réponse envoyée avec succès.', 'success');
          await this.loadContacts();
        } catch (error) {
          Swal.close();
          await handleApiError(error, 'Erreur lors de l\'envoi de la réponse');
        }
      }
    } catch (error) {
      await handleApiError(error, 'Erreur lors de l\'ouverture de la modale de réponse');
    }
  },

  /**
   * Affiche la modale pour modifier un contact.
   * @function showUpdateModal
   * @param {string} contactId - ID du contact.
   */
  async showUpdateModal(contactId) {
    try {
      const contact = await api.contact.getContact(contactId);
      const isDark = document.documentElement.classList.contains('dark');
      const bgClass = isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
      const borderClass = isDark ? 'border-gray-600' : 'border-gray-200';

      const { value: formValues } = await Swal.fire({
        title: 'Modifier le contact',
        html: `
          <div class="${bgClass} p-6 rounded-xl ${borderClass} shadow-lg">
            <div class="space-y-4">
              <div>
                <label for="swal-name" class="block text-sm font-medium">Nom</label>
                <input id="swal-name" class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg" value="${contact.name}" />
              </div>
              <div>
                <label for="swal-email" class="block text-sm font-medium">Email</label>
                <input id="swal-email" class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg" value="${contact.email}" />
              </div>
              <div>
                <label for="swal-phone" class="block text-sm font-medium">Téléphone</label>
                <div class="relative flex items-center">
                  <span class="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-50 dark:bg-gray-700 px-2 text-ll-text-gray dark:text-ll-medium-gray z-10 select-none pointer-events-none">+33</span>
                  <input id="swal-phone" class="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" value="${contact.phone ? contact.phone.replace('+33 ', '') : ''}" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium">Sujets</label>
                <input id="swal-subjects-display" readonly class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer" value="${contact.subjects ? contact.subjects.join(', ') : ''}" placeholder="Cliquez pour sélectionner les sujets"/>
                <input type="hidden" id="swal-subjects" value="${contact.subjects ? contact.subjects.join(',') : ''}">
                <div id="swal-selected-subjects" class="flex flex-wrap gap-2 mt-2"></div>
              </div>
              <div>
                <label for="swal-message" class="block text-sm font-medium">Message</label>
                <textarea id="swal-message" class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg" rows="5">${contact.message}</textarea>
              </div>
            </div>
          </div>
        `,
        showCancelButton: true,
        cancelButtonText: 'Annuler',
        confirmButtonText: 'Mettre à jour',
        confirmButtonColor: '#1e90ff',
        background: isDark ? '#1B1B18' : '#FDFDFC',
        color: isDark ? '#FDFDFC' : '#1B1B18',
        customClass: { popup: 'swal-wide max-w-2xl' },
        preConfirm: async () => {
          let swalPhone = document.getElementById('swal-phone').value.trim();
          if (swalPhone) {
            swalPhone = `+33 ${swalPhone.replace(/\s+/g, ' ').trim()}`;
          }
          const updatedData = {
            name: document.getElementById('swal-name').value.trim(),
            email: document.getElementById('swal-email').value.trim(),
            phone: swalPhone,
            subjects: document.getElementById('swal-subjects').value.trim().split(',').filter(s => s),
            message: document.getElementById('swal-message').value.trim(),
            createdAt: contact.createdAt,
          };
          const errors = this.validateForm(updatedData);
          if (Object.keys(errors).length > 0) {
            Swal.showValidationMessage(Object.values(errors).join('<br>'));
            return false;
          }

          const emailError = validateField('email', updatedData.email, false, true);
          if (emailError) {
            Swal.showValidationMessage(emailError);
            return false;
          }

          try {
            const available = await this.checkEmailAvailabilityCached(updatedData.email, true);
            if (!available) {
              Swal.showValidationMessage('Cet email est déjà utilisé.');
              return false;
            }
          } catch (e) {
            Swal.showValidationMessage('Erreur lors de la vérification de l\'email.');
            return false;
          }

          return updatedData;
        },
        didOpen: () => {
          Swal.getPopup().classList.add('animate__animated', 'animate__fadeInDown');
          const subjectsDisplay = document.getElementById('swal-subjects-display');
          const selectedSubjectsEl = document.getElementById('swal-selected-subjects');

          const selectedSubjects = new Set(document.getElementById('swal-subjects').value.split(',').filter(s => s));
          selectedSubjectsEl.innerHTML = Array.from(selectedSubjects).map(sub => `
            <span class="service-feature inline-flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-sm text-gray-900 dark:text-gray-100">
              ${sub}
              <button type="button" class="ml-2 text-red-500 hover:text-red-700" data-remove="${sub}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </span>
          `).join('');

          selectedSubjectsEl.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
              const toRemove = btn.dataset.remove;
              selectedSubjects.delete(toRemove);
              document.getElementById('swal-subjects').value = Array.from(selectedSubjects).join(',');
              btn.parentElement.remove();
              document.getElementById('swal-subjects-display').value = selectedSubjects.size > 0 ? `${selectedSubjects.size} sujet(s) sélectionné(s)` : '';
            });
          });

          subjectsDisplay.addEventListener('click', () => {
            const originalSubjectsInput = document.getElementById('subjects');
            document.getElementById('subjects').value = document.getElementById('swal-subjects').value;
            this.openSubjectsModal();

            const observer = new MutationObserver(() => {
              const newValue = document.getElementById('subjects').value;
              document.getElementById('swal-subjects').value = newValue;
              document.getElementById('swal-subjects-display').value = newValue ? newValue.split(',').filter(s => s).length + ' sujet(s) sélectionné(s)' : '';
              selectedSubjectsEl.innerHTML = newValue.split(',').filter(s => s).map(sub => `
                <span class="service-feature inline-flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-sm text-gray-900 dark:text-gray-100">
                  ${sub}
                  <button type="button" class="ml-2 text-red-500 hover:text-red-700" data-remove="${sub}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </span>
              `).join('');
            });
            observer.observe(document.getElementById('subjects'), { attributes: true, attributeFilter: ['value'] });

            const modal = document.getElementById('subjects-modal');
            modal.addEventListener('click', () => observer.disconnect(), { once: true });
            modal.querySelector('.modal-close').addEventListener('click', () => observer.disconnect(), { once: true });
            modal.querySelector('.modal-cancel').addEventListener('click', () => observer.disconnect(), { once: true });
            modal.querySelector('.modal-confirm').addEventListener('click', () => observer.disconnect(), { once: true });
          });
        },
      });

      if (formValues) {
        try {
          await showLoadingDialog('Mise à jour du contact...', 'Updating');
          await api.contact.updateContact(contactId, formValues);
          Swal.close();
          showNotification('Contact mis à jour avec succès.', 'success');
          await this.loadContacts();
        } catch (error) {
          Swal.close();
          await handleApiError(error, 'Erreur lors de la mise à jour du contact');
        }
      }
    } catch (error) {
      await handleApiError(error, 'Erreur lors de l\'ouverture de la modale de mise à jour');
    }
  },

  /**
   * Supprime un contact.
   * @function deleteContact
   * @param {string} contactId - ID du contact.
   */
  async deleteContact(contactId) {
    const confirm = await Swal.fire({
      title: 'Confirmer la suppression',
      text: 'Êtes-vous sûr de vouloir supprimer ce contact ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#bdbdbdff',
      background: document.documentElement.classList.contains('dark') ? '#1B1B18' : '#FDFDFC',
      color: document.documentElement.classList.contains('dark') ? '#FDFDFC' : '#1B1B18',
    });

    if (confirm.isConfirmed) {
      try {
        await showLoadingDialog('Suppression du contact...', 'Deleting');
        await api.contact.deleteContact(contactId);
        Swal.close();
        showNotification('Contact supprimé avec succès.', 'success');
        await this.loadContacts();
      } catch (error) {
        Swal.close();
        await handleApiError(error, 'Erreur lors de la suppression du contact');
      }
    }
  },



  /**
   * Valide les données du formulaire de contact.
   * @function validateForm
   * @param {Object} data - Données du formulaire.
   * @returns {Object} Erreurs de validation.
   */
  validateForm(data) {
    const errors = {};
    const validSubjects = this.subjectsList.map(subject => subject.name);

    // Validation du nom
    const nameError = validateField('nom', data.name, false, true);
    if (nameError) errors.name = nameError;

    // Validation de l'email
    const emailError = validateField('email', data.email, false, true);
    if (emailError) errors.email = emailError;

    // Validation du téléphone
    const phoneError = validateField('phone', data.phone, false, true);
    if (phoneError) errors.phone = phoneError;

    // Validation des sujets
    if (!data.subjects || (Array.isArray(data.subjects) && data.subjects.length === 0)) {
      errors.subjects = 'Veuillez sélectionner au moins un sujet.';
    } else if (Array.isArray(data.subjects)) {
      const invalidSubjects = data.subjects.filter(s => !validSubjects.includes(s));
      if (invalidSubjects.length > 0) {
        errors.subjects = `Les sujets suivants sont invalides : ${invalidSubjects.join(', ')}.`;
      }
    }

    // Validation explicite du message
    if (!data.message || data.message.trim() === '') {
      errors.message = 'Le message est requis.';
    } else if (data.message.length < 10) {
      errors.message = 'Le message doit contenir au moins 10 caractères.';
    } else if (data.message.length > 1000) {
      errors.message = 'Le message ne peut pas dépasser 1000 caractères.';
    }

    return errors;
  },

  /**
   * Efface les erreurs des champs du formulaire.
   * @function clearFieldErrors
   */
  clearFieldErrors() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const errorElements = form.querySelectorAll('.error-message');
    errorElements.forEach(el => {
      el.textContent = '';
      el.classList.add('hidden');
      el.classList.remove('text-red-500', 'text-green-500', 'text-yellow-500');
    });

    const inputs = form.querySelectorAll('input, textarea, #subject-display');
    inputs.forEach((input) => {
      input.classList.remove(
        'border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50',
        'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50',
        'border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50'
      );
      input.classList.add('border-gray-300', 'dark:border-gray-600', 'focus:border-blue-500', 'focus:ring-blue-500/50');
    });
  },

  /**
 * Affiche la modale de pré-confirmation avant envoi avec un design amélioré.
 * @function showPreConfirmationModal
 * @param {Object} contactData - Données du contact.
 * @returns {Promise<boolean>} Confirmation de l'utilisateur.
 */
async showPreConfirmationModal(contactData) {
  const isDark = document.documentElement.classList.contains('dark');
  const modalBgClass = isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900';
  const contentBgClass = isDark ? 'bg-gray-800' : 'bg-white';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const formattedDate = formatDate(new Date().toISOString());

  // Handle subjects, ensuring a clean comma-separated list
  let subjectsDisplay = 'N/A';
  if (Array.isArray(contactData.subjects)) {
    subjectsDisplay = contactData.subjects.length > 0 ? contactData.subjects.join(', ') : 'N/A';
  } else if (typeof contactData.subjects === 'string') {
    subjectsDisplay = contactData.subjects.replace(/-/g, ' - ');
  }

  const { isConfirmed } = await Swal.fire({
    title: 'Confirmation de votre demande',
    html: `
      <div class="${modalBgClass} p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto font-sans text-left overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-8 pb-4 border-b ${borderClass}">
          <div class="flex items-center">
            <img src="/assets/images/logo.png" alt="L&L Ouest Services Logo" class="h-14 mr-4 rounded-xl p-1">
            <div>
              <h2 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-ll-dark-green to-ll-dark-blue">Récapitulatif de la demande</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Envoyé le: ${formattedDate}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
          <div class="${contentBgClass} p-6 rounded-lg shadow-inner ${borderClass} border">
            <h3 class="text-lg font-semibold mb-4 text-ll-blue dark:text-ll-light-blue">Vos Coordonnées</h3>
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Nom</label>
                <p class="mt-1 text-base font-medium">${contactData.name}</p>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Email</label>
                <p class="mt-1 text-base font-medium">${contactData.email}</p>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Téléphone</label>
                <p class="mt-1 text-base font-medium">${contactData.phone || 'Non renseigné'}</p>
              </div>
            </div>
          </div>

          <div class="${contentBgClass} p-6 rounded-lg shadow-inner ${borderClass} border">
            <h3 class="text-lg font-semibold mb-4 text-ll-blue dark:text-ll-light-blue">Détails de la demande</h3>
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Sujet(s)</label>
                <p class="mt-1 text-base font-medium">${subjectsDisplay}</p>
              </div>
              <div class="col-span-1">
                <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Message</label>
                <div class="mt-1 p-3 rounded-md border ${borderClass} ${contentBgClass} max-h-48 overflow-y-auto">
                  <p class="text-base whitespace-pre-wrap">${contactData.message}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center mb-6">
          <p class="text-sm italic text-gray-600 dark:text-gray-300">
            Veuillez vérifier l'exactitude des informations ci-dessus avant de confirmer.
          </p>
        </div>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,

    confirmButtonText: 'Confirmer et envoyer',
    cancelButtonText: 'Modifier ma demande',


    confirmButtonColor: '#1e90ff',
    cancelButtonColor: '#6b7280',
    width: '100%',

    customClass: {
      popup: 'swal-wide w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-4xl',
      confirmButton: 'px-6 py-3 rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500/50',
      cancelButton: 'px-6 py-3 rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50',
    },
    background: isDark ? '#121212' : '#FDFDFC',
    color: isDark ? '#FDFDFC' : '#1B1B18',
    didOpen: () => {
      const swalPopup = Swal.getPopup();
      swalPopup.classList.add('animate__animated', 'animate__fadeInDown');
    },
  });

  return isConfirmed;
},

/**
 * Affiche la modale de confirmation après envoi.
 * @function showConfirmationModal
 * @param {Object} contactData - Données du contact.
 */
async showConfirmationModal(contactData) {
  const isDark = document.documentElement.classList.contains('dark');
  const bgClass = isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
  const borderClass = isDark ? 'border-gray-600' : 'border-gray-200';
  const formattedDate = formatDate(new Date().toISOString());
  const subjectsDisplay = contactData.subjects ? contactData.subjects.replace(/-/g, ' - ') : 'N/A';

  await Swal.fire({
    title: 'Message envoyé avec succès !',
    html: `
      <div class="${bgClass} p-6 rounded-xl ${borderClass} shadow-lg max-w-lg mx-auto">
        <div class="flex justify-between items-center mb-6 border-b pb-4 ${borderClass}">
          <img src="/assets/images/logo.png" alt="L&L Ouest Services Logo" class="h-12 border ${borderClass} rounded rounded-xl p-1">
          <span class="text-sm font-medium">${formattedDate}</span>
        </div>
        <section class="mb-6 border-b ${borderClass} pb-4">
          <h3 class="text-lg font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-ll-dark-green to-ll-dark-blue">Vos coordonnées :</h3>
          <div class="grid grid-cols-1 gap-2 text-base text-start">
            <p><strong>Nom :</strong> ${contactData.name}</p>
            <p><strong>Email :</strong> ${contactData.email}</p>
            <p><strong>Téléphone :</strong> ${contactData.phone || 'N/A'}</p>
          </div>
        </section>
        <section class="mb-6 border-b ${borderClass} pb-4">
          <h3 class="text-lg font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-ll-dark-green to-ll-dark-blue">Votre demande :</h3>
          <div class="grid grid-cols-1 gap-2 text-base text-start">
            <p><strong>Sujets :</strong> ${subjectsDisplay}</p>
            <p><strong>Message :</strong> ${contactData.message}</p>
          </div>
        </section>
        <p class="text-sm italic text-center">Merci pour votre message. Nous vous répondrons sous 48h.</p>
      </div>
    `,
    icon: 'success',
    showConfirmButton: true,
    confirmButtonText: 'Fermer',
    confirmButtonColor: '#1e90ff',
    background: isDark ? '#1B1B18' : '#FDFDFC',
    color: isDark ? '#FDFDFC' : '#1B1B18',
    customClass: { popup: 'swal-wide max-w-2xl' },
    didOpen: () => {
      Swal.getPopup().classList.add('animate__animated', 'animate__fadeInDown');
    },
  });
},
};

export default contact;