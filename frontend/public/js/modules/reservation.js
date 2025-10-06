/**
 * @file reservationHandler.js
 * @description Module de gestion du formulaire de réservation pour L&L Ouest Services.
 * Gère la validation en temps réel, la modale pour la sélection des options, l'emoji-picker, et les réponses.
 * Inclut la vérification de disponibilité d'email avec cache et persistance des données du formulaire après rafraîchissement.
 * Modélisé sur contact.js avec adaptations pour réservation (date, fréquence, service ID).
 * @module reservation
 * @version 1.0.0
 * @fixes Ajout validation address et consent. Alignement HTML avec .reservation-error. Gestion logs en vérifiant présence éléments. Outils tips ajoutés via HTML.
 */

import api from '../api.js';
import { showNotification, validateField, showLoadingDialog, formatDate, handleApiError, validateFieldInitial } from './utils.js';

const reservation = {

  // Options pour réservation (similaire à subjects dans contact)
  optionsList: [
    { name: 'Nettoyage standard', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5h6m-6 4h6m-6 4h3m-6 4h6m2-12h4a2 2 0 012 2v8a2 2 0 01-2 2h-4" />', description: 'Nettoyage de base pour espaces quotidiens.', type: 'standard' },
    { name: 'Nettoyage en profondeur', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />', description: 'Nettoyage détaillé pour surfaces complexes.', type: 'deep' },
    { name: 'Désinfection complète', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />', description: 'Traitement anti-bactérien et viral.', type: 'disinfection' },
    { name: 'Nettoyage écologique', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />', description: 'Produits verts et respectueux de l\'environnement.', type: 'eco' },
    { name: 'Nettoyage urgent', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />', description: 'Intervention express dans les 24h.', type: 'urgent' },
    { name: 'Autre option', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />', description: 'Demande personnalisée.', type: 'other' },
  ],

  /**
   * Initialise le module de réservation.
   * @function init
   */
  init() {
    const form = document.getElementById('reservation-form');
    if (!form) {
      console.warn('Formulaire de réservation non trouvé, initialisation annulée pour éviter logs.');
      return;
    }
    this.bindReservationForm();
    this.bindTextAreaUtilities();
    this.bindOptionsSelection();
    this.loadSelectedOptions();
    this.loadFormData();
  },

  /**
   * Ouvre la modale de réservation avec préremplissage service/user.
   * @function openReservationModal
   * @param {Object} service - Données du service.
   * @param {Object} user - Données utilisateur (optionnel).
   */
  openReservationModal(service, user = null) {
    const modal = document.getElementById('reservation-modal');
    if (!modal) {
      console.warn('Modale de réservation non trouvée.');
      return;
    }

    // Préremplir champs cachés pour toutes les données du service
    document.getElementById('reservation-service-id').value = service.id || 'default';
    document.getElementById('reservation-service-name').value = service.name || '';
    document.getElementById('reservation-service-category').value = service.category || '';

    // Préremplir user si connecté
    if (user) {
      document.getElementById('reservation-name').value = user.name || '';
      document.getElementById('reservation-email').value = user.email || '';
      document.getElementById('reservation-phone').value = user.phone?.replace('+33 ', '') || '';
    }

    // Mise à jour titre modale
    document.getElementById('reservation-modal-title').textContent = `Réserver "${service.name}"`;
    document.getElementById('reservation-modal-subtitle').textContent = `Devis personnalisé pour ${service.category.charAt(0).toUpperCase() + service.category.slice(1)}`;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Validation initiale seulement après ouverture
    this.initialValidation(document.getElementById('reservation-form'));
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
    const form = document.getElementById('reservation-form');
    if (!form) return;

    const formData = new FormData(form);
    const reservationData = {
      name: formData.get('name')?.trim() || '',
      email: formData.get('email')?.trim() || '',
      phone: formData.get('phone')?.trim() || '',
      date: formData.get('date') || '',
      frequency: formData.get('frequency') || '',
      address: formData.get('address')?.trim() || '',
      options: formData.get('subjects')?.trim() || '',
      message: formData.get('message')?.trim() || '',
      consentement: formData.get('consentement') === 'on',
      serviceId: formData.get('serviceId') || '',
      serviceName: formData.get('serviceName') || '',
      serviceCategory: formData.get('serviceCategory') || '',
    };
    localStorage.setItem('reservationFormData', JSON.stringify(reservationData));
  },

  /**
   * Charge les données du formulaire depuis localStorage.
   * @function loadFormData
   */
  loadFormData() {
    const form = document.getElementById('reservation-form');
    if (!form) return;

    const savedData = localStorage.getItem('reservationFormData');
    if (savedData) {
      const reservationData = JSON.parse(savedData);
      form.querySelector('[name="name"]').value = reservationData.name || '';
      form.querySelector('[name="email"]').value = reservationData.email || '';
      form.querySelector('[name="phone"]').value = reservationData.phone ? reservationData.phone.replace('+33 ', '') : '';
      form.querySelector('[name="date"]').value = reservationData.date || '';
      form.querySelector('[name="frequency"]').value = reservationData.frequency || '';
      form.querySelector('[name="address"]').value = reservationData.address || '';
      form.querySelector('[name="subjects"]').value = reservationData.options || '';
      form.querySelector('[name="message"]').value = reservationData.message || '';
      form.querySelector('[name="serviceId"]').value = reservationData.serviceId || '';
      form.querySelector('[name="serviceName"]').value = reservationData.serviceName || '';
      form.querySelector('[name="serviceCategory"]').value = reservationData.serviceCategory || '';
      if (reservationData.consentement) {
        form.querySelector('[name="consentement"]').checked = true;
      }
      this.loadSelectedOptions();
    }
  },

  /**
   * Affiche un message d'erreur ou de validation pour un champ de formulaire.
   * @function showFieldError
   * @param {string} field - Nom du champ.
   * @param {string|null} message - Message d'erreur, de validation ou de suggestion, ou null pour effacer.
   */
  showFieldError(field, message) {
    const input = document.querySelector(field === 'subjects' ? '#reservation-subjects-display' : field === 'consentement' ? '#reservation-consentement' : `[name="${field}"]`);
    if (!input) {
      console.warn(`Champ ${field} non trouvé`);
      return;
    }

    const errorElement = input.parentElement?.querySelector('.reservation-error') || input.parentElement?.parentElement?.querySelector('.reservation-error');
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
        errorElement.innerHTML = `<span class="text-blue-500"><i class="fas ${message.includes('fa-spinner') ? 'fa-spinner fa-spin' : 'fa-info-circle'} mr-1"></i>${message}</span>`;
        errorElement.classList.remove('text-red-500', 'text-green-500', 'text-yellow-500', 'hidden');
        errorElement.classList.add('text-blue-500', 'block');
        input.classList.add('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50');
      } else if (message.includes('fa-exclamation')) {
        errorElement.innerHTML = `<span class="dark:text-white text-blue-500"><i class="fas fa-exclamation-circle mr-1"></i>${message}</span>`;
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
  updateSubmitButtonState(form, submitButton, isInitialLoad = false) {
    const formData = new FormData(form);
    const reservationData = {
      name: formData.get('name')?.trim() || '',
      email: formData.get('email')?.trim() || '',
      phone: formData.get('phone')?.trim() ? `+33 ${formData.get('phone').trim().replace(/\s+/g, ' ')}` : '',
      date: formData.get('date') || '',
      frequency: formData.get('frequency') || '',
      address: formData.get('address')?.trim() || '',
      options: formData.get('subjects')?.trim().split(',').filter(s => s) || [],
      message: formData.get('message')?.trim() || '',
      consentement: formData.get('consentement') === 'on',
      serviceId: formData.get('serviceId') || '',
      serviceName: formData.get('serviceName') || '',
      serviceCategory: formData.get('serviceCategory') || '',
    };

    // Validation des champs
    const errors = this.validateForm(reservationData, isInitialLoad);
    const isEmailValid = !validateField('email', reservationData.email, false, true);
    const isNameValid = !validateField('name', reservationData.name, false, true);
    const isPhoneValid = !validateField('phone', reservationData.phone, false, true);
    const isDateValid = !errors.date;
    const isFrequencyValid = !errors.frequency;
    const isAddressValid = !errors.address;
    const isOptionsValid = !errors.options;
    const isMessageValid = !errors.message;
    const isConsentValid = !errors.consentement;
    const isServiceValid = !!reservationData.serviceId && !!reservationData.serviceName && !!reservationData.serviceCategory;


    // Déterminer si le formulaire est valide
    const isValid = isEmailValid && isNameValid && isPhoneValid && isDateValid && isFrequencyValid && isAddressValid && isOptionsValid && isMessageValid && isConsentValid && isServiceValid;

    // Mise à jour de l'état du bouton
    submitButton.disabled = !isValid;
    submitButton.classList.toggle('opacity-50', !isValid);
    submitButton.classList.toggle('cursor-not-allowed', !isValid);

    // Restaurer le contenu par défaut du bouton si valide ou après annulation
    if (!submitButton.innerHTML.includes('Envoi...') && !submitButton.innerHTML.includes('Vérification...')) {
      submitButton.innerHTML = `
        <i class="fas fa-paper-plane mr-2" aria-hidden="true"></i>
        <span>Envoyer la Réservation</span>
      `;
    }
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
          <i class="fas fa-paper-plane mr-2" aria-hidden="true"></i>
          <span>Envoyer la Réservation</span>
        `;
      }

      if (available === undefined) {
        this.showFieldError('email', 'Vérification en attente (serveur indisponible) <i class="fas fa-exclamation ml-1 text-yellow-500"></i>');
        emailInput.classList.remove('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50', 'border-green-500');
        emailInput.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
      } else if (!available) {
        this.showFieldError('email', 'Vous êtes déjà membre. <i class="fas fa-exclamation ml-1 text-blue-500"></i> <a href="/pages/auth/signin.html" class="!text-black dark:!text-white underline hover:underline-none">Connectez-vous ici</a>');
        emailInput.classList.add('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50', 'border-green-500');
        emailInput.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
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
   */
  async initialValidation(form) {
    const formData = new FormData(form);
    const reservationData = {
      name: formData.get('name')?.trim() || '',
      email: formData.get('email')?.trim() || '',
      phone: formData.get('phone')?.trim() ? `+33 ${formData.get('phone').trim()}` : '',
      date: formData.get('date') || '',
      frequency: formData.get('frequency') || '',
      address: formData.get('address')?.trim() || '',
      options: formData.get('subjects')?.trim().split(',').filter(s => s) || [],
      message: formData.get('message')?.trim() || '',
      consentement: formData.get('consentement') === 'on',
      serviceId: formData.get('serviceId') || '',
      serviceName: formData.get('serviceName') || '',
      serviceCategory: formData.get('serviceCategory') || '',
    };

    form.querySelectorAll('input:not([type="hidden"]), textarea, select, #reservation-subjects-display').forEach(input => {
      const field = input.name || (input.id === 'reservation-subjects-display' ? 'subjects' : input.name);
      let value = input.value.trim();
      if (field === 'phone' && value) value = `+33 ${value}`;
      if (field === 'subjects') value = value ? value.split(',').filter(s => s) : [];
      if (field === 'consentement') value = input.checked;

      let error = null;
      error = validateFieldInitial(field, value, false, true);

      this.showFieldError(field, error || (value && field !== 'subjects' ? `${this.getFieldName(field)} valide <i class="fas fa-check-circle ml-1 text-green-500"></i>` : field === 'subjects' && value.length > 0 ? `Option(s) valide(s) <i class="fas fa-check-circle ml-1 text-green-500"></i>` : ''));

      const optionsValue = form.querySelector('[name="subjects"]').value.trim() || '';
      const optionsDisplay = document.getElementById('reservation-subjects-display');
      if (!optionsValue && optionsDisplay) {
        this.showFieldError('subjects', 'Sélectionnez au moins une option');
        optionsDisplay.value = 'Sélectionnez des options';
      }
    });

    if (reservationData.email) {
      const emailSyntaxError = validateFieldInitial('email', reservationData.email, false, true);
      if (!emailSyntaxError) {
        await this.checkEmailAndUpdateButton(reservationData.email, true, form, document.getElementById('reservation-submit'), document.getElementById('reservation-email'));
      }
    }

    if (!reservationData.email) {
      this.updateSubmitButtonState(form, document.getElementById('reservation-submit'), true);
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
      date: 'Date',
      frequency: 'Fréquence',
      address: 'Adresse',
      subjects: 'Options',
      message: 'Message',
      consentement: 'Consentement',
      serviceId: 'Service ID',
      serviceName: 'Nom du Service',
      serviceCategory: 'Catégorie du Service',
    };
    return fieldNames[field.toLowerCase()] || field;
  },

  /**
   * Lie le formulaire de réservation pour gérer la soumission et la validation en temps réel.
   * @function bindReservationForm
   */
  bindReservationForm() {
    const form = document.getElementById('reservation-form');
    if (!form) {
      console.warn('Formulaire de réservation introuvable');
      return;
    }

    const submitButton = form.querySelector('#reservation-submit');
    const emailInput = form.querySelector('[name="email"]');
    if (!submitButton || !emailInput) {
      console.warn('Bouton de soumission ou champ email introuvable');
      return;
    }

    let isSubmitting = false;

    // Initialisation de l'état du bouton
    submitButton.disabled = true;
    submitButton.classList.add('opacity-50', 'cursor-not-allowed');

    // Validation en temps réel pour tous les champs
    form.querySelectorAll('input:not([type="hidden"]), textarea, select, #reservation-subjects-display').forEach(input => {
      input.addEventListener('input', async () => {
        const field = input.name || (input.id === 'reservation-subjects-display' ? 'subjects' : input.name);
        let value = input.value.trim();
        if (field === 'phone' && value) value = `+33 ${value.replace(/\s+/g, ' ').trim()}`;
        if (field === 'subjects') value = value ? value.split(',').filter(s => s) : [];

        let error = null;
        if (field === 'email') {
          const syntaxError = validateField('email', value, false, true);
          if (syntaxError) {
            this.showFieldError('email', syntaxError);
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
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
        } else if (field === 'message') {
          if (!value) error = 'Le message est requis.';
          else if (value.length < 10) error = 'Le message doit contenir au moins 10 caractères.';
          else if (value.length > 1000) error = 'Le message ne peut pas dépasser 1000 caractères.';
        } else if (field === 'date') {
          if (!value) error = 'La date est requise.';
          else if (new Date(value) < new Date()) error = 'La date ne peut pas être dans le passé.';
        } else if (field === 'frequency') {
          if (!value) error = 'La fréquence est requise.';
        } else if (field === 'address') {
          if (!value) error = 'L\'adresse est requise.';
          else if (value.length < 5) error = 'L\'adresse doit contenir au moins 5 caractères.';
        } else {
          error = validateField(field, value, false, true);
        }

        this.showFieldError(
          field,
          error || (value && field !== 'subjects' ? `${this.getFieldName(field)} valide <i class="fas fa-check-circle ml-1 text-green-500"></i>` : field === 'subjects' && value.length > 0 ? `Option(s) valide(s) <i class="fas fa-check-circle ml-1 text-green-500"></i>` : '')
        );

        this.updateSubmitButtonState(form, submitButton);
        this.saveFormData();
      });

      // Gestion spécifique pour l'email sur événement blur
      if (input.id === 'reservation-email') {
        input.addEventListener('blur', async () => {
          const value = decodeURIComponent(input.value.trim());
          const syntaxError = validateField('email', value, false, true);
          if (syntaxError) {
            this.showFieldError('email', syntaxError);
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
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

      // Gestion spécifique pour le téléphone
      if (input.id === 'reservation-phone') {
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

      // Gestion spécifique pour le consentement (checkbox)
      if (input.id === 'reservation-consentement') {
        input.addEventListener('change', () => {
          const value = input.checked;
          const error = !value ? 'Le consentement est requis.' : null;
          this.showFieldError('consentement', error || 'Consentement accepté <i class="fas fa-check-circle ml-1 text-green-500"></i>');
          this.updateSubmitButtonState(form, submitButton);
          this.saveFormData();
        });
      }
    });

    // Gestion de la soumission du formulaire
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitButton.disabled || isSubmitting) {
        console.log('Soumission bloquée : bouton désactivé ou soumission en cours');
        return;
      }

      isSubmitting = true;
      submitButton.disabled = true;
      submitButton.classList.add('opacity-50', 'cursor-not-allowed');
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
        const optionsArray = formData.get('subjects')?.trim().split(',').filter(s => s) || [];

        const reservationData = {
          id: crypto.randomUUID(),
          serviceId: formData.get('serviceId') || '',
          serviceName: formData.get('serviceName') || '',
          serviceCategory: formData.get('serviceCategory') || '',
          name: formData.get('name')?.trim() || '',
          email: formData.get('email')?.trim() || '',
          phone: phoneValue,
          date: formData.get('date') || '',
          frequency: formData.get('frequency') || '',
          address: formData.get('address')?.trim() || '',
          options: optionsArray.join('-'),
          message: formData.get('message')?.trim() || '',
          consentement: formData.get('consentement') === 'on',
          createdAt: new Date().toISOString(),
        };

        const errors = this.validateForm(reservationData);
        if (Object.keys(errors).length > 0) {
          Object.entries(errors).forEach(([field, message]) => this.showFieldError(field, message));
          showNotification('Veuillez corriger les erreurs dans le formulaire.', 'error');
          Swal.close();
          isSubmitting = false;
          this.updateSubmitButtonState(form, submitButton);
          return;
        }

        const confirmed = await this.showPreConfirmationModal(reservationData);
        if (!confirmed) {
          Swal.close();
          isSubmitting = false;
          submitButton.innerHTML = `
            <i class="fas fa-paper-plane mr-2" aria-hidden="true"></i>
            <span>Envoyer la Réservation</span>
          `;
          this.updateSubmitButtonState(form, submitButton); 
          return;
        }

        await showLoadingDialog('Envoi de votre réservation...', 'Cleaning');
        const response = await api.contact.createReservation(reservationData); 

        // Réinitialisation du formulaire
        form.reset();
        document.getElementById('reservation-selected-subjects').innerHTML = '';
        document.querySelector('[name="subjects"]').value = '';
        document.getElementById('reservation-subjects-display').value = '';
        this.clearFieldErrors();
        this.clearSelectedOptionsStorage();
        this.invalidateEmailCache();
        localStorage.removeItem('reservationFormData');

        // Réinitialisation du bouton
        submitButton.innerHTML = `
          <i class="fas fa-paper-plane mr-2" aria-hidden="true"></i>
          <span>Envoyer la Réservation</span>
        `;

        await this.showConfirmationModal(reservationData);

        this.initialValidation(form);
      } catch (error) {
        Swal.close();
        let errorMessage = error.message || 'Erreur technique lors de l\'envoi de la réservation.';
        if (error.status === 429) {
          errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
        } else if (error.reason === 'email-already-in-use') {
          errorMessage = 'Vous êtes déjà membre. <a href="/pages/auth/signin.html" class="text-blue-500 underline hover:underline-">Connectez-vous ici</a>';
        }
        showNotification(errorMessage, 'error');
      } finally {
        isSubmitting = false;
        this.updateSubmitButtonState(form, submitButton);
      }
    });
  },

  /**
   * Lie les utilitaires du textarea (emoji picker).
   * @function bindTextAreaUtilities
   */
  bindTextAreaUtilities() {
    const textarea = document.getElementById('reservation-message');
    const emojiBtn = document.getElementById('reservation-emoji-btn'); // Ajouter bouton emoji dans HTML si besoin
    const emojiPicker = document.querySelector('.reservation-emoji-picker'); // Ajouter picker si besoin

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
   * Lie la sélection des options.
   * @function bindOptionsSelection
   */
  bindOptionsSelection() {
    const optionsDisplay = document.getElementById('reservation-subjects-display');
    if (!optionsDisplay) return;

    optionsDisplay.addEventListener('click', () => {
      this.openOptionsModal();
    });
  },

 /**
 * Ouvre la modale de sélection des options (similaire à subjects dans contact).
 * @function openOptionsModal
 */
openOptionsModal() {
  const modal = document.createElement('div');
  modal.id = 'reservation-options-modal';
  modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 md:p-6 transition-opacity duration-500 opacity-0';

  const isDark = document.documentElement.classList.contains('dark');
  const bgClass = isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
  const borderClass = isDark ? 'border-gray-600' : 'border-gray-200';

  modal.innerHTML = `
    <div class="modal-content ${bgClass} rounded-2xl shadow-2xl max-w-4xl w-full mx-auto overflow-hidden transform scale-95 transition-transform duration-500">
      <button class="modal-close absolute top-4 right-4 z-10 bg-white dark:bg-gray-700 rounded-xl p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-md" aria-label="Fermer la modale">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div class="p-6 md:p-8">
        <h3 class="text-2xl font-sans font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-ll-dark-green to-ll-dark-blue bg-[length:200%_100%] animate-gradient-scroll">Sélectionnez les options</h3>
        <div class="relative mb-4">
          <input type="text" id="reservation-option-search" class="w-full pl-4 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ll-blue focus:border-ll-blue text-gray-900 dark:text-gray-100 transition-all duration-300" placeholder="Rechercher une option..." />
        </div>
        <div id="reservation-options-list" class="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[30rem] overflow-y-auto"></div>
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

  const optionsListEl = modal.querySelector('#reservation-options-list');
  const searchInput = modal.querySelector('#reservation-option-search');
  const optionsInput = document.getElementById('reservation-subjects');
  const selectedOptions = new Set(optionsInput.value ? optionsInput.value.split(',').filter(s => s) : []);

  const renderOptions = (filter = '') => {
    optionsListEl.innerHTML = this.optionsList
      .filter(option => option.name.toLowerCase().includes(filter.toLowerCase()))
      .map(option => {
        const isSelected = selectedOptions.has(option.name);
        return `
          <div class="reservation-subject-card aspect-square p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-lg border-2 border-transparent hover:border-ll-blue ${isSelected ? 'border-ll-blue bg-ll-blue/10 dark:bg-ll-blue/20' : ''}" data-name="${option.name}" title="${option.description}">
            <div class="flex flex-col items-center justify-center h-full space-y-2">
              <input type="checkbox" value="${option.name}" class="sr-only" aria-label="${option.name}">
              <svg class="w-8 h-8 text-ll-text-gray dark:text-ll-medium-gray flex-shrink-0 ${isSelected ? 'text-ll-blue' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">${option.icon}</svg>
              <span class="text-base font-medium text-center ${isSelected ? 'text-ll-blue' : ''}">${option.name}</span>
              <p class="text-sm text-gray-600 dark:text-gray-400 text-center mt-1">${option.description}</p>
            </div>
          </div>
        `;
      }).join('');

    optionsListEl.querySelectorAll('.reservation-subject-card').forEach(card => {
      card.addEventListener('click', () => {
        const name = card.dataset.name;
        if (selectedOptions.has(name)) {
          selectedOptions.delete(name);
          card.classList.remove('border-ll-blue', 'bg-ll-blue/10', 'dark:bg-ll-blue/20');
          card.querySelector('svg').classList.remove('text-ll-blue');
          card.querySelector('span').classList.remove('text-ll-blue');
        } else {
          selectedOptions.add(name);
          card.classList.add('border-ll-blue', 'bg-ll-blue/10', 'dark:bg-ll-blue/20');
          card.querySelector('svg').classList.add('text-ll-blue');
          card.querySelector('span').classList.add('text-ll-blue');
        }
      });
    });
  };

  renderOptions();

  searchInput.addEventListener('input', () => renderOptions(searchInput.value));

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
    const selected = Array.from(selectedOptions);
    const selectedOptionsEl = document.getElementById('reservation-selected-subjects');
    selectedOptionsEl.innerHTML = selected.map(opt => `
      <span class="service-feature inline-flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-sm text-gray-900 dark:text-gray-100">
        ${opt}
        <button type="button" class="ml-2 text-red-500 hover:text-red-700" data-remove="${opt}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </span>
    `).join('');

    optionsInput.value = selected.join(',');
    document.getElementById('reservation-subjects-display').value = selected.length > 0 ? `${selected.length} option(s) sélectionnée(s)` : '';
    document.getElementById('reservation-subjects-display').dispatchEvent(new Event('input'));

    selectedOptionsEl.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const toRemove = btn.dataset.remove;
        selectedOptions.delete(toRemove);
        optionsInput.value = Array.from(selectedOptions).join(',');
        btn.parentElement.remove();
        document.getElementById('reservation-subjects-display').value = selectedOptions.size > 0 ? `${selectedOptions.size} option(s) sélectionnée(s)` : '';
        document.getElementById('reservation-subjects-display').dispatchEvent(new Event('input'));
        this.saveSelectedOptions();
      });
    });

    this.saveSelectedOptions();
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
   * Efface les options sélectionnées dans localStorage.
   * @function clearSelectedOptionsStorage
   */
  clearSelectedOptionsStorage() {
    localStorage.removeItem('selectedOptions');
    localStorage.removeItem('reservationFormData');
    this.invalidateEmailCache();
    const optionsInput = document.getElementById('reservation-subjects');
    const selectedOptionsEl = document.getElementById('reservation-selected-subjects');
    const optionsDisplay = document.getElementById('reservation-subjects-display');
    if (optionsInput && selectedOptionsEl && optionsDisplay) {
      optionsInput.value = '';
      selectedOptionsEl.innerHTML = '';
      optionsDisplay.value = '';
      optionsDisplay.dispatchEvent(new Event('input'));
    }
  },

  /**
   * Sauvegarde les options sélectionnées dans localStorage.
   * @function saveSelectedOptions
   */
  saveSelectedOptions() {
    const optionsInput = document.getElementById('reservation-subjects');
    if (optionsInput) {
      localStorage.setItem('selectedOptions', optionsInput.value);
      this.saveFormData();
    }
  },

  /**
   * Charge les options sélectionnées depuis localStorage.
   * @function loadSelectedOptions
   */
  loadSelectedOptions() {
    const optionsInput = document.getElementById('reservation-subjects');
    const selectedOptionsEl = document.getElementById('reservation-selected-subjects');
    const optionsDisplay = document.getElementById('reservation-subjects-display');

    if (!optionsInput || !selectedOptionsEl || !optionsDisplay) return;

    const saved = optionsInput.value ? optionsInput.value : localStorage.getItem('selectedOptions');
    if (saved) {
      optionsInput.value = saved;
      const selected = saved.split(',').filter(s => s);
      const selectedOptionsSet = new Set(selected);

      selectedOptionsEl.innerHTML = Array.from(selectedOptionsSet).map(opt => `
        <span class="service-feature inline-flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-sm text-gray-900 dark:text-gray-100">
          ${opt}
          <button type="button" class="ml-2 text-red-500 hover:text-red-700" data-remove="${opt}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </span>
      `).join('');

      optionsDisplay.value = selected.length > 0 ? `${selected.length} option(s) sélectionnée(s)` : '';

      selectedOptionsEl.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          const toRemove = btn.dataset.remove;
          selectedOptionsSet.delete(toRemove);
          optionsInput.value = Array.from(selectedOptionsSet).join(',');
          btn.parentElement.remove();
          optionsDisplay.value = selectedOptionsSet.size > 0 ? `${selectedOptionsSet.size} option(s) sélectionnée(s)` : '';
          optionsDisplay.dispatchEvent(new Event('input'));
          this.saveSelectedOptions();
        });
      });

      optionsDisplay.value = selected.length > 0 ? `${selected.length} option(s) sélectionnée(s)` : 'Sélectionnez des options';
      optionsDisplay.dispatchEvent(new Event('input'));
    } else {
      optionsInput.value = '';
      selectedOptionsEl.innerHTML = '';
      optionsDisplay.value = 'Sélectionnez des options';
      optionsDisplay.dispatchEvent(new Event('input'));
    }
  },

  /**
   * Valide les données du formulaire de réservation.
   * @function validateForm
   * @param {Object} data - Données du formulaire.
   * @returns {Object} Erreurs de validation.
   */
  validateForm(data, isInitialLoad = false) {
    const errors = {};
    const validOptions = this.optionsList.map(option => option.name);

    // Validation du nom
    const nameError = validateField('name', data.name, false, true);
    if (nameError) errors.name = nameError;

    // Validation de l'email
    const emailError = validateField('email', data.email, false, true);
    if (emailError) errors.email = emailError;

    // Validation du téléphone
    const phoneError = validateField('phone', data.phone, false, true);
    if (phoneError) errors.phone = phoneError;

    // Validation de la date
    if (!data.date) errors.date = 'La date est requise.';
    else if (new Date(data.date) < new Date()) errors.date = 'La date ne peut pas être dans le passé.';

    // Validation de la fréquence
    if (!data.frequency) errors.frequency = 'La fréquence est requise.';

    // Validation de l'adresse
    if (!data.address || data.address.trim() === '') {
      errors.address = 'L\'adresse est requise.';
    } else if (data.address.length < 5) {
      errors.address = 'L\'adresse doit contenir au moins 5 caractères.';
    }

    // Validation des données du service
    if (!data.serviceId) errors.serviceId = 'ID du service requis.';
    if (!data.serviceName || data.serviceName.trim() === '') errors.serviceName = 'Nom du service requis.';
    if (!data.serviceCategory || data.serviceCategory.trim() === '') errors.serviceCategory = 'Catégorie du service requise.';

    // Validation des options
    if (isInitialLoad && !data.options || (Array.isArray(data.options) && data.options.length === 0)) {
      errors.options = 'Veuillez sélectionner au moins une option.';
    } else if (Array.isArray(data.options)) {
      const invalidOptions = data.options.filter(s => !validOptions.includes(s));
      if (invalidOptions.length > 0) {
        errors.options = `Les options suivantes sont invalides : ${invalidOptions.join(', ')}.`;
      }
    }

    // Validation du message
    if (!data.message || data.message.trim() === '') {
      errors.message = 'Le message est requis.';
    } else if (data.message.length < 10) {
      errors.message = 'Le message doit contenir au moins 10 caractères.';
    } else if (data.message.length > 1000) {
      errors.message = 'Le message ne peut pas dépasser 1000 caractères.';
    }

    // Validation du consentement
    if (!data.consentement) {
      errors.consentement = 'Le consentement est requis.';
    }

    return errors;
  },

  /**
   * Efface les erreurs des champs du formulaire.
   * @function clearFieldErrors
   */
  clearFieldErrors() {
    const form = document.getElementById('reservation-form');
    if (!form) return;

    const errorElements = form.querySelectorAll('.reservation-error');
    errorElements.forEach(el => {
      el.textContent = '';
      el.classList.add('hidden');
      el.classList.remove('text-red-500', 'text-green-500', 'text-yellow-500');
    });

    const inputs = form.querySelectorAll('input, textarea, select, #reservation-subjects-display');
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
   * Affiche la modale de pré-confirmation avant envoi (adaptée de contact).
   * @function showPreConfirmationModal
   * @param {Object} reservationData - Données de la réservation.
   * @returns {Promise<boolean>} Confirmation de l'utilisateur.
   */
  async showPreConfirmationModal(reservationData) {
    const isDark = document.documentElement.classList.contains('dark');
    const bgMain = isDark ? '#1F2937' : '#FFFFFF';
    const bgContent = isDark ? 'bg-gray-800' : 'bg-gray-50';
    const textTitle = isDark ? 'text-blue-300' : 'text-ll-blue';
    const textLabel = isDark ? 'text-gray-400' : 'text-gray-600';
    const borderSubtle = isDark ? 'border-gray-700/50' : 'border-gray-300/50';

    const formattedDate = formatDate(new Date().toISOString());

    let optionsDisplay = 'N/A';
    if (Array.isArray(reservationData.options)) {
      optionsDisplay = reservationData.options.length > 0 ? reservationData.options.join(', ') : 'N/A';
    } else if (typeof reservationData.options === 'string') {
      optionsDisplay = reservationData.options.replace(/-/g, ' - ');
    }

    const confirmationSvg = `
      <svg class="w-10 h-10 text-ll-blue dark:text-ll-light-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
      </svg>
    `;

    const { isConfirmed } = await Swal.fire({
      title: `<span class="text-xl sm:text-2xl font-extrabold ${textTitle}">Confirmation de votre réservation</span>`,
      html: `
        <div class="${bgContent} p-4 sm:p-8 rounded-3xl shadow-2xl w-full max-w-full mx-auto font-sans text-left overflow-y-auto max-h-[75vh]">
          <div class="flex items-start mb-6 pb-4 border-b ${borderSubtle}">
            <div class="p-2 ${bgMain} rounded-xl shadow-inner mr-4">
                <img src="/assets/images/logo.png" alt="L&L Ouest Services Logo" class="h-10 w-10 object-contain rounded-lg">
            </div>
            <div>
              <h2 class="text-xl font-bold ${textTitle}">Récapitulatif de la réservation</h2>
              <p class="text-sm ${textLabel} mt-1">Planifiée pour: ${reservationData.date}</p>
            </div>
          </div>
          
          <div class="flex justify-center mb-6">
              ${confirmationSvg}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            
            <div class="${bgMain} p-5 rounded-2xl shadow-lg border ${borderSubtle} transition-all duration-300 hover:shadow-xl">
              <h3 class="text-lg font-semibold mb-4 ${textTitle} flex items-center">
                  <i class="fas fa-user-circle mr-2"></i> Vos Coordonnées
              </h3>
              <div class="grid grid-cols-1 gap-3">
                ${['name', 'email', 'phone', 'address'].map(key => `
                  <div>
                    <label class="block text-xs font-bold ${textLabel} uppercase">${key === 'name' ? 'Nom' : key === 'email' ? 'Email' : key === 'phone' ? 'Téléphone' : 'Adresse'}</label>
                    <p class="mt-0.5 text-base font-medium text-gray-800 dark:text-gray-200 break-words">${reservationData[key] || 'Non renseigné'}</p>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="${bgMain} p-5 rounded-2xl shadow-lg border ${borderSubtle} transition-all duration-300 hover:shadow-xl">
              <h3 class="text-lg font-semibold mb-4 ${textTitle} flex items-center">
                  <i class="fas fa-calendar-check mr-2"></i> Détails de la Réservation
              </h3>
              <div class="grid grid-cols-1 gap-3">
                <div>
                  <label class="block text-xs font-bold ${textLabel} uppercase">Service</label>
                  <p class="mt-0.5 text-base font-medium text-gray-800 dark:text-gray-200">${reservationData.serviceName} (${reservationData.serviceCategory})</p>
                </div>
                <div>
                  <label class="block text-xs font-bold ${textLabel} uppercase">Date</label>
                  <p class="mt-0.5 text-base font-medium text-gray-800 dark:text-gray-200">${reservationData.date}</p>
                </div>
                <div>
                  <label class="block text-xs font-bold ${textLabel} uppercase">Fréquence</label>
                  <p class="mt-0.5 text-base font-medium text-gray-800 dark:text-gray-200">${reservationData.frequency}</p>
                </div>
                <div>
                  <label class="block text-xs font-bold ${textLabel} uppercase">Option(s)</label>
                  <p class="mt-0.5 text-base font-medium text-gray-800 dark:text-gray-200">${optionsDisplay}</p>
                </div>
                <div>
                  <label class="block text-xs font-bold ${textLabel} uppercase">Instructions</label>
                  <div class="mt-0.5 p-3 rounded-xl ${bgContent} border ${borderSubtle} max-h-32 overflow-y-auto shadow-inner">
                    <p class="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">${reservationData.message}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="text-center mt-4">
            <p class="text-sm italic ${textLabel}">
              Veuillez vérifier l'exactitude de ces informations. Vous recevrez une confirmation par email.
            </p>
          </div>
        </div>
      `,
      icon: undefined,
      showCancelButton: true,
      focusConfirm: false, 
      
      confirmButtonText: '<i class="fas fa-paper-plane mr-2"></i> Confirmer et réserver',
      cancelButtonText: '<i class="fas fa-edit mr-2"></i> Modifier ma réservation',

      confirmButtonColor: '#1e90ff',
      cancelButtonColor: '#6b7280',
      width: '100%',

      customClass: {
        popup: 'swal-wide rounded-3xl shadow-xl w-full max-w-lg md:max-w-3xl', 
        confirmButton: 'px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-[1.02] shadow-lg',
        cancelButton: 'px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-[1.02] shadow-lg',
        title: 'pt-4',
      },
      background: bgMain, 
      color: isDark ? '#FDFDFC' : '#1B1B18',
      
      showClass: {
        popup: 'animate__animated animate__zoomIn'
      },
      hideClass: {
        popup: 'animate__animated animate__zoomOut'
      }
    });

    return isConfirmed;
  },

  /**
   * Affiche la modale de confirmation après envoi (adaptée de contact).
   * @function showConfirmationModal
   * @param {Object} reservationData - Données de la réservation.
   * @returns {Promise<void>}
   */
  async showConfirmationModal(reservationData) {
    const isDark = document.documentElement.classList.contains('dark');
    const bgMain = isDark ? '#1F2937' : '#FFFFFF';
    const bgContent = isDark ? 'bg-gray-800' : 'bg-gray-50';
    const textTitle = isDark ? 'text-blue-300' : 'text-ll-blue';
    const textLabel = isDark ? 'text-gray-400' : 'text-gray-600';
    const borderSubtle = isDark ? 'border-gray-700/50' : 'border-gray-300/50';

    const formattedDate = formatDate(new Date().toISOString());

    let optionsDisplay = 'N/A';
    if (Array.isArray(reservationData.options)) {
      optionsDisplay = reservationData.options.length > 0 ? reservationData.options.join(', ') : 'N/A';
    } else if (typeof reservationData.options === 'string') {
      optionsDisplay = reservationData.options.replace(/-/g, ' - ');
    }

    const successSvg = `
      <svg class="w-10 h-10 text-ll-dark-green dark:text-ll-light-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
    `;

    await Swal.fire({
      title: `<span class="text-xl sm:text-2xl font-extrabold ${textTitle}">Réservation confirmée !</span>`,
      html: `
        <div class="${bgContent} p-4 sm:p-8 rounded-3xl shadow-2xl w-full max-w-full mx-auto font-sans text-left overflow-y-auto max-h-[75vh]">
          <div class="flex items-start mb-6 pb-4 border-b ${borderSubtle}">
            <div class="p-2 ${bgMain} rounded-xl shadow-inner mr-4">
              <img src="/assets/images/logo.png" alt="L&L Ouest Services Logo" class="h-10 w-10 object-contain rounded-lg">
            </div>
            <div>
              <h2 class="text-xl font-bold ${textTitle}">Confirmation de réservation</h2>
              <p class="text-sm ${textLabel} mt-1">Planifiée pour: ${reservationData.date}</p>
            </div>
          </div>
          
          <div class="flex justify-center mb-6">
            ${successSvg}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="${bgMain} p-5 rounded-2xl shadow-lg border ${borderSubtle} transition-all duration-300 hover:shadow-xl">
              <h3 class="text-lg font-semibold mb-4 ${textTitle} flex items-center">
                <i class="fas fa-user-circle mr-2"></i> Vos Coordonnées
              </h3>
              <div class="grid grid-cols-1 gap-3">
                ${['name', 'email', 'phone', 'address'].map(key => `
                  <div>
                    <label class="block text-xs font-bold ${textLabel} uppercase">${key === 'name' ? 'Nom' : key === 'email' ? 'Email' : key === 'phone' ? 'Téléphone' : 'Adresse'}</label>
                    <p class="mt-0.5 text-base font-medium text-gray-800 dark:text-gray-200 break-words">${reservationData[key] || 'Non renseigné'}</p>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="${bgMain} p-5 rounded-2xl shadow-lg border ${borderSubtle} transition-all duration-300 hover:shadow-xl">
              <h3 class="text-lg font-semibold mb-4 ${textTitle} flex items-center">
                <i class="fas fa-calendar-check mr-2"></i> Détails de la Réservation
              </h3>
              <div class="grid grid-cols-1 gap-3">
                <div>
                  <label class="block text-xs font-bold ${textLabel} uppercase">Service</label>
                  <p class="mt-0.5 text-base font-medium text-gray-800 dark:text-gray-200">${reservationData.serviceName} (${reservationData.serviceCategory})</p>
                </div>
                <div>
                  <label class="block text-xs font-bold ${textLabel} uppercase">Date</label>
                  <p class="mt-0.5 text-base font-medium text-gray-800 dark:text-gray-200">${reservationData.date}</p>
                </div>
                <div>
                  <label class="block text-xs font-bold ${textLabel} uppercase">Fréquence</label>
                  <p class="mt-0.5 text-base font-medium text-gray-800 dark:text-gray-200">${reservationData.frequency}</p>
                </div>
                <div>
                  <label class="block text-xs font-bold ${textLabel} uppercase">Option(s)</label>
                  <p class="mt-0.5 text-base font-medium text-gray-800 dark:text-gray-200">${optionsDisplay}</p>
                </div>
                <div>
                  <label class="block text-xs font-bold ${textLabel} uppercase">Instructions</label>
                  <div class="mt-0.5 p-3 rounded-xl ${bgContent} border ${borderSubtle} max-h-32 overflow-y-auto shadow-inner">
                    <p class="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">${reservationData.message}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="text-center mt-4">
            <div class="flex justify-center items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-dark-blue dark:text-ll-light-blue">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                Votre réservation a été envoyée. Veuillez vérifier votre boîte mail (<strong>${reservationData.email}</strong>) pour la confirmation.
              </p>
            </div>
            <p class="text-sm italic ${textLabel}">
              Merci pour votre réservation. Nous vous contacterons sous 24h pour confirmer.
            </p>
          </div>
        </div>
      `,
      icon: undefined,
      showConfirmButton: true,
      confirmButtonText: '<i class="fas fa-times mr-2"></i> Fermer',
      confirmButtonColor: '#1e90ff',
      width: '100%',
      customClass: {
        popup: 'swal-wide rounded-3xl shadow-xl w-full max-w-lg md:max-w-3xl',
        confirmButton: 'px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-[1.02] shadow-lg',
        title: 'pt-4',
      },
      background: bgMain,
      color: isDark ? '#FDFDFC' : '#1B1B18',
      showClass: {
        popup: 'animate__animated animate__zoomIn'
      },
      hideClass: {
        popup: 'animate__animated animate__zoomOut'
      }
    });
  },

  /**
   * Ferme la modale de réservation.
   * @function closeReservationModal
   */
  closeReservationModal() {
    const modal = document.getElementById('reservation-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }
  },
};

// Bind global pour fermeture modale
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('reservation-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => reservation.closeReservationModal());
  }

  // Fermeture sur clic extérieur
  const modal = document.getElementById('reservation-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) reservation.closeReservationModal();
    });
  }

  // Annuler bouton
  const cancelBtn = document.getElementById('reservation-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => reservation.closeReservationModal());
  }
});

export default reservation;