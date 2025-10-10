/**
 * @file auth.js
 * @description Gère l'authentification pour L&L Ouest Services, incluant l'inscription, la connexion, la vérification d'email, la réinitialisation de mot de passe, le changement d'email et la vérification de code.
 * @module auth
 * @requires ../api.js
 * @requires ./utils.js
 */

import api from '../api.js';
import { showNotification, validateField, generateString, showLoadingDialog, cacheUserData, showSuccessDialog, showSuccessSignUp, getCachedUserData } from './utils.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

let availableEmail = false;

/**s
 * Module d'authentification pour gérer les opérations liées aux utilisateurs.
 * @namespace
 */
const auth = {
  /**
   * Initialise le module d'authentification en liant les écouteurs d'événements aux formulaires.
   * @function init
   */
  init() {
  this.bindSignUpForm();
  this.bindSignInForm();
  this.bindEmailVerificationForm();
  this.bindPasswordResetForm();
  this.bindChangeEmailForm();
  this.bindConfirmNewEmailForm();
  this.bindResetPasswordForm();
  this.bindSignOutButton();
  this.bindCodeCheckForm();
},

  /**
   * Détermine si le thème est sombre.
   * @function isDarkMode
   * @returns {boolean} True si mode sombre actif.
   */
  isDarkMode() {
    return document.documentElement.classList.contains('dark');
  },

  /**
   * Retourne le nom du champ en français pour l'affichage.
   * @function getFieldName
   * @param {string} field - Nom du champ en anglais.
   * @returns {string} Nom du champ en français.
   */
  getFieldName(field) {
    const fieldNames = {
      'name': 'Nom complet',
      'email': 'Email',
      'currentEmail': 'Email actuel',
      'newEmail': 'Nouvel email',
      'password': 'Mot de passe',
      'confirmPassword': 'Confirmation du mot de passe',
      'phone': 'Numéro de téléphone',
      'country': 'Pays',
      'city': 'Ville',
      'street': 'Rue',
      'postalCode': 'Code postal',
      'code': 'Code de vérification',
      'message': 'Message',
      'subjects': 'Sujets'
    };
    return fieldNames[field.toLowerCase()] || field;
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
   * Ne fait un appel API que si :
   * 1. Le format email est valide
   * 2. L'email n'est pas déjà en cache
   * 3. Le cache n'est pas expiré (10 minutes)
   * @async
   * @function checkEmailAvailabilityCached
   * @param {string} email - L'adresse email à vérifier
   * @param {boolean} [force=false] - Force la vérification même si en cache
   * @returns {Promise<boolean|undefined>} True si disponible, false si existe déjà, undefined si backend indisponible
   * @throws {Error} En cas d'erreur technique (non réseau)
   */
  async checkEmailAvailabilityCached(email, force = false) {
    // Validation format email en frontend
    if (!this.isValidEmailFormat(email)) {
      console.warn('Format email invalide:', email);
      return undefined; // Email malformé = considéré comme indéterminé
    }

    const cacheKey = `email_availability_${btoa(email)}`;
    const cacheData = JSON.parse(localStorage.getItem(cacheKey));
    
    // Vérification cache : valide si existe et non expiré (10 minutes)
    const now = Date.now();
    const isCacheValid = cacheData && (now - cacheData.timestamp) < (10 * 60 * 1000);
    
    if (!force && isCacheValid) {
      return cacheData.available;
    }

    // Appel API si pas en cache ou forcé
    try {
      const available = await api.user.checkEmailAvailability(email);
      if (available === undefined) {
        console.warn('Backend indisponible pour vérification email:', email);
        return undefined; // Backend indisponible
      }
      
      // Mise à jour du cache
      localStorage.setItem(cacheKey, JSON.stringify({
        email,
        available,
        timestamp: now,
        checkedAt: new Date().toISOString()
      }));
      
      return available;
    } catch (error) {
      // Si erreur 400 de validation, on met en cache comme disponible
      if (error.statusCode === 400 && error.message?.includes('email')) {
        console.warn('Email rejeté par validation backend, mis en cache comme disponible:', email);
        localStorage.setItem(cacheKey, JSON.stringify({
          email,
          available: true,
          timestamp: now,
          checkedAt: new Date().toISOString(),
          note: 'format_invalid'
        }));
        return true;
      }
      
      // Autres erreurs, on propage
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
 * Lie la soumission et la validation au formulaire d'inscription.
 * @function bindSignUpForm
 * @description Lie les événements d'input, navigation et soumission au formulaire d'inscription.
 * Gère les étapes multi-pages, validation en temps réel, vérification d'email avec cache, et soumission séquentielle.
 * Affiche des modaux de chargement alignés avec showLoadingDialog.
 * Gère les erreurs de manière alignée avec handleApiError.
 */
bindSignUpForm() {

  const form = document.getElementById('signup-form');
  if (!form) return;

  const steps = form.querySelectorAll('.step');
  const submitButton = form.querySelector('#submit-button');
  if (!submitButton) return;

  let currentStep = 1;
  let isSubmitting = false;
  let isProcessingStep = false;

  this.showStep(steps, currentStep);
  this.updateStepButtonState(steps, currentStep);

  // Validation en temps réel des champs
  const inputs = form.querySelectorAll('input:not([type="hidden"]), select:not(.hidden)');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      if (isSubmitting) return; // Ne pas valider pendant soumission

      const field = input.name;
      let value = input.value.trim();
      if (field.includes('email')) value = decodeURIComponent(value);
      if (field.includes('confirm')) field = 'confirmPassword';

      const error = validateField(field, value);
      this.showFieldError(field, error || (value && field !== 'password' && field !== 'confirmPassword' ? `${this.getFieldName(field)} valide <i class="fas fa-check-circle ml-1 text-green-500"></i>` : ''));

      if (field === 'password' || field === 'confirmPassword') {
        const password = document.getElementById('password')?.value.trim() || '';
        const confirmPassword = document.getElementById('confirmPassword')?.value.trim() || '';
        if (password && confirmPassword) {
          const confirmError = password !== confirmPassword ? 'Les mots de passe ne correspondent pas.' : '';
          this.showFieldError('confirmPassword', confirmError || (confirmPassword ? 'Mot de passe confirmé <i class="fas fa-check-circle ml-1 text-green-500"></i>' : ''));
        }
      }

      if (field === 'email') {
        const nextButton = steps[currentStep - 1]?.querySelector('.next-step');
        if (nextButton) nextButton.disabled = true;
      }
      this.updateStepButtonState(steps, currentStep);
    });
  });

  // Navigation entre étapes : Bouton Suivant
  form.querySelectorAll('.next-step').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();

      if (isProcessingStep || isSubmitting) {
        console.log('⏳ Navigation bloquée - traitement en cours');
        return;
      }

      isProcessingStep = true;
      button.disabled = true;
      button.innerHTML = '<span class="loading-spinner"></span> Validation...';

      try {
        if (await this.validateStep(steps, currentStep)) {
          currentStep++;
          this.showStep(steps, currentStep);
          await this.updateStepButtonState(steps, currentStep);
        }
      } catch (error) {
        console.error('Erreur validation étape:', error);
      } finally {
        isProcessingStep = false;
        button.disabled = false;
        button.innerHTML = '<span>Suivant</span><i class="fas fa-arrow-right ml-2"></i>';
      }
    });
  });

  // Navigation entre étapes : Bouton Précédent
  form.querySelectorAll('.prev-step').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();

      if (isProcessingStep || isSubmitting) return;

      isProcessingStep = true;
      currentStep--;
      this.showStep(steps, currentStep);
      await this.updateStepButtonState(steps, currentStep);
      isProcessingStep = false;
    });
  });

  // Vérification de l'email sur blur - AVEC CACHE
  const emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.addEventListener('blur', async () => {
      if (isSubmitting) return;

      const field = emailInput.name;
      const value = decodeURIComponent(emailInput.value.trim());
      const nextButton = steps[currentStep - 1]?.querySelector('.next-step');

      // Valider le format de l'email (SYNCHRONE)
      let error = validateField(field, value);
      if (error) {
        this.showFieldError(field, error);
        availableEmail = false;
        if (nextButton) nextButton.disabled = true;
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        this.updateStepButtonState(steps, currentStep);
        return;
      }

      // Vérification de la disponibilité avec cache (ASYNCHRONE)
      if (nextButton && !isProcessingStep) {
        nextButton.disabled = true;
        nextButton.innerHTML = '<span class="loading-spinner"></span> Vérification...';
      }

      try {
        const available = await this.checkEmailAvailabilityCached(value);
        availableEmail = available;

        if (available === undefined) {
          console.warn('Backend indisponible, attente de reconnexion...');
          this.showFieldError('email', 'Vérification en attente (serveur indisponible) <i class="fas fa-exclamation ml-1 text-yellow-500"></i>');
          emailInput.classList.remove('border-gray-300', 'dark:border-gray-600', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
          emailInput.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
          if (nextButton) {
            nextButton.disabled = false;
            nextButton.classList.remove('opacity-50', 'cursor-not-allowed');
          }
          submitButton.disabled = false;
          submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
        } else if (!available) {
          this.showFieldError('email', 'Cet email est déjà utilisé. <i class="fas fa-exclamation ml-1 text-yellow-500"></i> <a href="/pages/auth/signin.html" class="text-blue-500 hover:underline">Se connecter</a>');
          emailInput.classList.remove('border-gray-300', 'dark:border-gray-600', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
          emailInput.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
          if (nextButton) {
            nextButton.disabled = true;
            nextButton.classList.add('opacity-50', 'cursor-not-allowed');
          }
          submitButton.disabled = true;
          submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
          this.showFieldError('email', 'Email valide <i class="fas fa-check-circle ml-1 text-green-500"></i>');
          emailInput.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
          emailInput.classList.add('border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
          if (nextButton) {
            nextButton.disabled = false;
            nextButton.classList.remove('opacity-50', 'cursor-not-allowed');
          }
          submitButton.disabled = false;
          submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      } catch (e) {
        console.error('Erreur vérification email:', e);
        this.showFieldError('email', 'Erreur technique lors de la vérification de l\'email');
        emailInput.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
        emailInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
        availableEmail = false;
        if (nextButton) {
          nextButton.disabled = true;
          nextButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
      } finally {
        if (nextButton && !isProcessingStep) {
          nextButton.innerHTML = '<span>Suivant</span><i class="fas fa-arrow-right ml-2"></i>';
        }
      }
      this.updateStepButtonState(steps, currentStep);
    });
  }

  // Soumission du formulaire - SÉQUENTIELLE ET ORDONNÉE
  form.addEventListener('submit', async event => {
    event.preventDefault();

    // Empêcher les soumissions multiples
    if (isSubmitting || submitButton.disabled) {
      console.log('⏳ Soumission bloquée - déjà en cours');
      return;
    }

    // Étape 1: Affichage immédiat du modal de chargement
    await showLoadingDialog('Création de votre compte...', 'Cleaning');

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="loading-spinner"></span> Inscription en cours...';

    try {
      // Étape 2: Validation de toutes les étapes
      console.log('🔄 Validation complète du formulaire...');
      let allStepsValid = true;
      for (let step = 1; step <= steps.length; step++) {
        if (!(await this.validateStep(steps, step))) {
          allStepsValid = false;
          currentStep = step;
          this.showStep(steps, currentStep);
          await this.updateStepButtonState(steps, currentStep);
          break;
        }
      }

      if (!allStepsValid) {
        Swal.close();
        showNotification('Veuillez corriger les erreurs dans le formulaire.', 'error');
        return;
      }

      // Étape 3: Vérification finale des mots de passe
      console.log('🔄 Vérification mots de passe...');
      const password = document.getElementById('password')?.value.trim() || '';
      const confirmPassword = document.getElementById('confirmPassword')?.value.trim() || '';
      if (password !== confirmPassword) {
        this.showFieldError('confirmPassword', 'Les mots de passe ne correspondent pas.');
        currentStep = steps.length;
        this.showStep(steps, currentStep);
        await this.updateStepButtonState(steps, currentStep);
        Swal.close();
        showNotification('Les mots de passe ne correspondent pas.', 'error');
        return;
      }

      // Étape 4: Collecte des données
      console.log('🔄 Collecte des données...');
      const formData = new FormData(form);
      const userData = {
        email: (formData.get('email') || '').trim(),
        password: (formData.get('password') || '').trim(),
        confirmPassword: (formData.get('confirmPassword') || '').trim(),
        name: (formData.get('name') || '').trim(),
        phone: (formData.get('phone') || '').trim(),
        street: (document.getElementById('street')?.value || '').trim(),
        city: (document.getElementById('city')?.value || '').trim(),
        postalCode: (formData.get('postalCode') || '').trim(),
        country: (formData.get('country') || 'France').trim(),
        dialCode: (formData.get('dialCode') || '').trim(),
      };

      // Étape 5: Vérification finale de l'email
      console.log('🔄 Vérification finale email...');
      const emailError = validateField('email', userData.email);
      if (emailError) {
        this.showFieldError('email', emailError);
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        Swal.close();
        showNotification('Veuillez corriger l\'email.', 'error');
        return;
      }

      try {
        const available = await this.checkEmailAvailabilityCached(userData.email, true);
        if (available === undefined) {
          console.warn('Backend indisponible, attente de reconnexion...');
          this.showFieldError('email', 'Vérification en attente (serveur indisponible) <i class="fas fa-exclamation ml-1 text-yellow-500"></i>');
          Swal.close();
          return;
        }
        if (!available) {
          this.showFieldError('email', 'Cet email est déjà utilisé. <i class="fas fa-exclamation ml-1 text-yellow-500"></i> <a href="/pages/auth/signin.html" class="text-blue-500 hover:underline">Se connecter</a>');
          document.querySelector('[name="email"]').classList.remove('border-gray-300', 'dark:border-gray-600', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
          document.querySelector('[name="email"]').classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
          submitButton.disabled = true;
          submitButton.classList.add('opacity-50', 'cursor-not-allowed');
          Swal.close();
          showNotification('Cet email est déjà utilisé.', 'error');
          return;
        }
      } catch (e) {
        console.error('Erreur vérification email finale:', e);
        this.showFieldError('email', 'Erreur technique lors de la vérification de l\'email');
        document.querySelector('[name="email"]').classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
        document.querySelector('[name="email"]').classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        Swal.close();
        showNotification('Erreur lors de la vérification de l\'email.', 'error');
        return;
      }

      if (userData.dialCode && userData.phone) {
        userData.phone = `${userData.dialCode} ${userData.phone}`;
      }

      // Étape 6: Validation finale
      console.log('🔄 Validation finale...');
      const errors = this.validateSignUpForm(userData);
      console.log('Données utilisateur validées:', userData);
      console.log('Erreurs trouvées:', errors);

      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, message]) => this.showFieldError(field, message));
        const firstErrorField = Object.keys(errors)[0];
        const fieldElement = form.querySelector(`[name="${firstErrorField}"]`);
        if (fieldElement) {
          const stepElement = fieldElement.closest('.step');
          if (stepElement) {
            const stepId = stepElement.id;
            currentStep = parseInt(stepId.split('-')[1]);
            this.showStep(steps, currentStep);
            this.updateStepButtonState(steps, currentStep);
          }
        }
        Swal.close();
        showNotification('Veuillez corriger les erreurs dans le formulaire.', 'error');
        return;
      }

      // Étape 7: Définir les post-opérations
    const postOperations = [
      async () => {
        console.log('🚀 Nettoyage du formulaire...');
        form.reset();
        this.clearFieldErrors(form);
      },
      async () => {
        console.log('🚀 Affichage du dialogue de succès...');
        await showSuccessSignUp(userData.name);
      },
      async () => {
        console.log('🚀 Stockage des données de vérification...');
        localStorage.setItem('codeCheckType', 'email-verification');
        localStorage.setItem('codeCheckEmail', userData.email);
      },
      async () => {
        console.log('🚀 Connexion automatique après inscription...');
        const credentials = {
          email: userData.email,
          password: userData.password,
          fcmToken: generateString(32),
        };

        const response = await api.auth.signIn(credentials);
        if (response.token) {
          const loadedUserData = await api.auth.getCurrentUser();
          if (loadedUserData === undefined) {
            console.warn('Backend indisponible pour récupération des données utilisateur, attente de reconnexion...');
            return;
          }
          cacheUserData(loadedUserData);
        }
        console.log('✅ Connexion automatique réussie');
      },
    ];


      console.log('🚀 Lancement de l\'inscription...');
      const response = await api.auth.signUp(userData);
      console.log('✅ Inscription réussie' , response);

    } catch (error) {
      let errorMessage = error.message || 'Erreur technique lors de l\'inscription';

      if (error.status === 429) {
        errorMessage = 'Trop de tentatives d\'envoi d\'email. Veuillez réessayer plus tard.';
      } else if (error.reason === 'email-already-in-use') {
        errorMessage = 'Cet email est déjà utilisé. <a href="/pages/auth/signin.html" class="text-blue-500 hover:underline">Se connecter</a>';
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (typeof errorMessage === 'object' && errorMessage !== null) {
        let messages = '';

        if (errorMessage.error) {
          messages = errorMessage.error;
          console.error(messages);
          showNotification(messages, 'error');
        } else if (Array.isArray(errorMessage)) {
          messages = errorMessage.join('<br>');
          console.error(errorMessage.join('\n'));
          showNotification(messages, 'error');
        } else {
          const errorList = Object.entries(errorMessage)
            .map(([key, val]) => `<b>${this.getFieldName(key)}:</b> ${val}`);
          messages = errorList.join('<br>');
          console.error(
            Object.entries(errorMessage)
              .map(([key, val]) => `${this.getFieldName(key)}: ${val}`)
              .join('\n')
          );
          showNotification(messages || 'Erreur technique lors de l\'inscription', 'error');
        }
      } else {
        console.error(errorMessage);
        showNotification(errorMessage, 'error');
      }
      Swal.close();
      api.auth.resetNotificationState();
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.innerHTML = '<span>S\'inscrire</span><i class="fas fa-check-circle ml-2"></i>';
    }
  });
},


/**
 * Lie la soumission et la validation au formulaire de connexion.
 * @function bindSignInForm
 * @description Lie les événements d'input et de soumission au formulaire de connexion.
 * Gère la validation en temps réel, la vérification d'email avec cache, et la soumission séquentielle.
 * Affiche des modaux de chargement alignés avec showLoadingDialog.
 * Gère les erreurs de manière alignée avec handleApiError.
 * Désactive le bouton de soumission à l'initialisation si les champs sont invalides.
 */
bindSignInForm() {
  const form = document.getElementById('signin-form');
  if (!form) {
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const emailInput = form.querySelector('[name="email"]');
  const passwordInput = form.querySelector('[name="password"]');
  const passwordContainer = document.getElementById('password-container');
  const emailErrorElement = document.getElementById('error-email');
  if (!submitButton || !emailInput || !passwordInput || !passwordContainer || !emailErrorElement) {
    console.warn('Éléments requis introuvables');
    return;
  }

  // Désactiver le bouton par défaut
  submitButton.disabled = true;
  submitButton.classList.add('opacity-50', 'cursor-not-allowed');

  // Fonction debounce pour les vérifications asynchrones
  const debounce = (func, delay) => {
    let timeout;
    return (value) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(value), delay);
    };
  };

  /**
   * Met à jour l'état de validation du bouton de soumission.
   * Cette fonction doit être appelée après chaque modification de champ non-email
   * ou après la vérification asynchrone de l'email.
   * @param {HTMLElement} currentForm - Le formulaire.
   * @param {HTMLElement} currentSubmitButton - Le bouton de soumission.
   */
  const updateSubmitButtonState = (currentForm, currentSubmitButton) => {
      const formData = new FormData(currentForm);
      const credentials = {
          email: (formData.get('email') || '').trim(),
          password: (formData.get('password') || '').trim(),
      };
      
      const errors = this.validateSignInForm(credentials);
      const isEmailValid = !validateField('email', credentials.email);
      const isPasswordValid = !validateField('password', credentials.password, true);

      // Le bouton est valide uniquement si tous les champs sont syntaxiquement valides
      // ET qu'aucun message d'erreur d'email (API check) n'est affiché.
      const hasApiError = emailErrorElement && !emailErrorElement.innerHTML.includes('fa-check-circle') && emailErrorElement.innerHTML.trim() !== '';

      const isValid = Object.keys(errors).length === 0 && !hasApiError && isEmailValid && isPasswordValid;
      
      currentSubmitButton.disabled = !isValid;
      currentSubmitButton.classList.toggle('opacity-50', !isValid);
      currentSubmitButton.classList.toggle('cursor-not-allowed', !isValid);
  };

  /**
   * Vérifie la disponibilité de l'email via cache/API et met à jour l'UI (champ + bouton + visibilité mot de passe).
   * @param {string} value - La valeur de l'email à vérifier.
   * @param {boolean} isInitialLoad - Indique si l'appel vient de l'initialisation.
   */
  const checkEmailAndUpdateButton = async (value, isInitialLoad = false) => {
    let available;
    const syntaxError = validateField('email', value);
    if (syntaxError) {
      this.showFieldError('email', syntaxError);
      emailInput.classList.remove('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50', 'border-green-500', 'border-yellow-500');
      emailInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
      // Masquer le mot de passe en cas d'erreur de syntaxe
      passwordContainer.classList.remove('max-h-48', 'opacity-100');
      passwordContainer.classList.add('max-h-0', 'opacity-0');
      passwordInput.value = '';
      this.showFieldError('password', '');
      updateSubmitButtonState(form, submitButton); 
      return;
    }

    // Affichage de l'état de vérification
    this.showFieldError('email', 'Vérification de l\'email en cours... <i class="fas fa-spinner fa-spin ml-1 text-blue-500"></i>');
    emailInput.classList.remove('border-green-500', 'border-yellow-500', 'border-red-500');
    emailInput.classList.add('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50');
    submitButton.disabled = true;
    submitButton.classList.add('opacity-50', 'cursor-not-allowed');
    if (!isInitialLoad) {
      submitButton.innerHTML = '<span class="loading-spinner"></span> Vérification...';
    }

    try {
      available = await this.checkEmailAvailabilityCached(value);

      if (!isInitialLoad) {
        submitButton.innerHTML = '<span>Se connecter</span><i class="fas fa-sign-in-alt ml-2"></i>';
      }

      if (available === undefined) {
        // Backend indisponible
        this.showFieldError('email', 'Vérification en attente (serveur indisponible) <i class="fas fa-exclamation ml-1 text-yellow-500"></i>');
        emailInput.classList.remove('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50', 'border-green-500');
        emailInput.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
      } else if (available) {
        // Email n'existe pas
        this.showFieldError('email', 'Cet email n\'existe pas. <i class="fas fa-exclamation ml-1 text-yellow-500"></i> <a href="/pages/auth/signup.html" class="text-blue-500 hover:underline">S\'inscrire</a>');
        emailInput.classList.remove('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50', 'border-green-500');
        emailInput.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        // Email existe (valide pour connexion)
        this.showFieldError('email', 'Email valide <i class="fas fa-check-circle ml-1 text-green-500"></i>');
        emailInput.classList.remove('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50', 'border-yellow-500', 'border-red-500');
        emailInput.classList.add('border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
      }
    } catch (e) {
      console.error('Erreur vérification email connexion:', e);
      this.showFieldError('email', 'Erreur technique lors de la vérification de l\'email');
      emailInput.classList.remove('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50', 'border-green-500', 'border-yellow-500');
      emailInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
      submitButton.disabled = true;
      submitButton.classList.add('opacity-50', 'cursor-not-allowed');
      available = undefined; // Pour la logique de visibilité
    }

    // Gestion de la visibilité et validation du mot de passe
    const shouldShowPassword = available === false;
    if (shouldShowPassword) {
      // Animation de descente : afficher le conteneur
      passwordContainer.classList.remove('max-h-0', 'opacity-0');
      passwordContainer.classList.add('max-h-48', 'opacity-100');
      // Validation du mot de passe si valeur présente
      const pwValue = passwordInput.value.trim();
      let pwMessage = '';
      const colorClasses = ['border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50',
                            'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50',
                            'border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50',
                            'border-gray-300', 'dark:border-gray-600', 'focus:ring-2', 'focus:ring-blue-500', 'focus:border-blue-500'];
      passwordInput.classList.remove(...colorClasses);
      if (pwValue) {
        const pwError = validateField('password', pwValue, true);
        pwMessage = pwError || 'Mot de passe valide <i class="fas fa-check-circle ml-1 text-green-500"></i>';
        if (pwError) {
          passwordInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
        } else {
          passwordInput.classList.add('border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
        }
      } else {
        pwMessage = '';
        // Classes par défaut
        passwordInput.classList.add('border-gray-300', 'dark:border-gray-600', 'focus:ring-2', 'focus:ring-blue-500', 'focus:border-blue-500');
      }
      this.showFieldError('password', pwMessage);
      updateSubmitButtonState(form, submitButton);
    } else {
      // Animation de remontée : masquer le conteneur
      passwordContainer.classList.remove('max-h-48', 'opacity-100');
      passwordContainer.classList.add('max-h-0', 'opacity-0');
      passwordInput.value = '';
      this.showFieldError('password', '');
      const colorClasses = ['border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50',
                            'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50',
                            'border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50'];
      passwordInput.classList.remove(...colorClasses);
      updateSubmitButtonState(form, submitButton);
    }
  };

  // Debounce pour vérification constante de l'email sur input
  const debouncedCheckEmail = debounce((value) => checkEmailAndUpdateButton(value, false), 800);

  /**
   * Effectue la validation initiale au chargement, affiche les messages d'état sur les champs
   * et lance la vérification asynchrone de l'email si nécessaire.
   */
  const initialValidation = async () => {
    const formData = new FormData(form);
    const credentials = {
      email: (formData.get('email') || '').trim(),
      password: (formData.get('password') || '').trim(),
    };
    
    // Validation des champs (y compris mot de passe si prérempli)
    form.querySelectorAll('input').forEach(input => {
      const field = input.name;
      const value = input.value.trim();
      
      if (value && field !== 'email') {
        const fieldError = validateField(field, value, true);
        const message = fieldError || `${this.getFieldName(field)} valide <i class="fas fa-check-circle ml-1 text-green-500"></i>`;
        this.showFieldError(field, message);
      }
    });

    // VÉRIFICATION ASYNCHRONE DE L'EMAIL À L'INITIALISATION
    if (credentials.email) {
      const emailSyntaxError = validateField('email', credentials.email);
      if (!emailSyntaxError) {
        await checkEmailAndUpdateButton(credentials.email, true);
      }
    }
    
    // Si l'email est vide, on s'assure que le bouton reste désactivé
    if (!credentials.email) {
        updateSubmitButtonState(form, submitButton);
    }
  };

  // 1. Exécuter la validation initiale au chargement de la page
  initialValidation();

  // ------------------------------------------------------------------
  // 2. Événements en temps réel (input)
  // ------------------------------------------------------------------
  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      const field = input.name;
      const value = input.value.trim();
      
      const error = validateField(field, value, true);
      let message = error || '';
      
      if (!error && value) {
        if (field === 'email') {
            // Pour l'email: Si la syntaxe est bonne, on affiche un message neutre/syntaxique
            // La vérification de disponibilité se fera via debounce.
            message = `${this.getFieldName(field)} format valide <i class="fas fa-check-circle ml-1 text-blue-500"></i>`;
            // Déclencher la vérification API débouancée
            debouncedCheckEmail(value);
        } else {
            // Pour les autres champs: validation complète
            message = `${this.getFieldName(field)} valide <i class="fas fa-check-circle ml-1 text-green-500"></i>`;
        }
      }
      
      this.showFieldError(field, message);
      updateSubmitButtonState(form, submitButton);
    });

    // ------------------------------------------------------------------
    // 3. Événement de vérification d'email (blur) - ASYNCHRONE
    // ------------------------------------------------------------------
    if (input.id === 'email') {
      input.addEventListener('blur', async () => {
        const value = input.value.trim();
        const syntaxError = validateField('email', value);
        if (!syntaxError) {
          // Vérification immédiate sur blur
          await checkEmailAndUpdateButton(value, false);
        }
      });
    }
  });

  // ------------------------------------------------------------------
  // 4. Événement de soumission (submit)
  // ------------------------------------------------------------------
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitButton.disabled) {
      console.log('Soumission bloquée : bouton désactivé');
      return;
    }

    await showLoadingDialog('Connexion en cours...', 'Cleaning');

    const formData = new FormData(form);
    const credentials = {
      email: (formData.get('email') || '').trim(),
      password: (formData.get('password') || '').trim(),
    };

    // Validation locale avant soumission
    const errors = this.validateSignInForm(credentials);
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => this.showFieldError(field, message));
      showNotification('Veuillez corriger les erreurs dans le formulaire.', 'error');
      Swal.close();
      return;
    }

    // Vérification finale de l'email avec cache
    try {
      const available = await this.checkEmailAvailabilityCached(credentials.email);
      if (available === undefined) {
        this.showFieldError('email', 'Vérification en attente (serveur indisponible) <i class="fas fa-exclamation ml-1 text-yellow-500"></i>');
        emailInput.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
        submitButton.disabled = true;
        showNotification('Impossible de vérifier l\'email : Serveur indisponible.', 'error');
        Swal.close();
        return;
      }
      if (available) {
        this.showFieldError('email', 'Cet email n\'existe pas. <i class="fas fa-exclamation ml-1 text-yellow-500"></i> <a href="/pages/auth/signup.html" class="text-blue-500 hover:underline">S\'inscrire</a>');
        emailInput.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
        submitButton.disabled = true;
        showNotification('Cet email n\'existe pas.', 'error');
        Swal.close();
        return;
      }
    } catch (e) {
      this.showFieldError('email', 'Erreur technique lors de la vérification de l\'email');
      emailInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
      submitButton.disabled = true;
      showNotification('Erreur lors de la vérification de l\'email.', 'error');
      Swal.close();
      return;
    }

    try {
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="loading-spinner"></span> Connexion...';

      await api.auth.signIn(credentials);

    } catch (error) {
      Swal.close();
      let errorMessage = error.message || 'Erreur technique lors de la connexion.';
      if (error.status === 401) {
        errorMessage = 'Email ou mot de passe incorrect.';
        this.showFieldError('password', errorMessage);
      } else if (error.status === 429) {
        errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
      }
      showNotification(errorMessage, 'error');
      console.error('❌ Erreur lors de la connexion:', error);
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '<span>Se connecter</span><i class="fas fa-sign-in-alt ml-2"></i>';
      // Reset des erreurs sans re-vérification API pour éviter tout risque de boucle après échec
      this.showFieldError('email', '');
      this.showFieldError('password', '');
      emailInput.classList.remove('border-red-500', 'border-green-500', 'border-yellow-500', 'border-blue-500');
      emailInput.classList.add('border-gray-300', 'dark:border-gray-600');
      passwordInput.classList.remove('border-red-500', 'border-green-500', 'border-yellow-500', 'border-blue-500');
      passwordInput.classList.add('border-gray-300', 'dark:border-gray-600');
      // Masquer le mot de passe après échec pour reset propre
      passwordContainer.classList.remove('max-h-48', 'opacity-100');
      passwordContainer.classList.add('max-h-0', 'opacity-0');
      passwordInput.value = '';
    }
  });
},

  /**
   * Lie la soumission et la validation au formulaire de vérification d'email.
   * @function bindEmailVerificationForm
   * @description Lie les événements d'input et de soumission au formulaire de vérification d'email.
   * Gère la validation en temps réel, la vérification d'email avec cache, et la soumission séquentielle.
   * Affiche des modaux de chargement alignés avec showLoadingDialog.
   * Gère les erreurs de manière alignée avec handleApiError.
   * Supporte le renvoi de code avec paramètre retry.
   */
  bindEmailVerificationForm() {
    const form = document.getElementById('email-verification-form');
    if (!form) return;

    const submitButton = form.querySelector('button[type="submit"]');
    this.updateSubmitButtonState(form, submitButton);

    form.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        const field = input.name;
        const value = input.value.trim();
        const error = validateField(field, value);
        this.showFieldError(field, error || (value ? `${this.getFieldName(field)} valide <i class="fas fa-check-circle ml-1 text-green-500"></i>` : ''));
        this.updateSubmitButtonState(form, submitButton);
      });

      if (input.id === 'email') {
        input.addEventListener('blur', async () => {
          const value = decodeURIComponent(input.value.trim());
          const error = validateField('email', value);
          if (error) {
            this.showFieldError('email', error);
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
            return;
          }

          try {
            // Utilisation du cache pour vérification email
            const available = await this.checkEmailAvailabilityCached(value);
            if (available === undefined) {
              // Backend indisponible, monitorBackend est déjà déclenché
              console.warn('Backend indisponible, attente de reconnexion...');
              this.showFieldError('email', 'Vérification en attente (serveur indisponible) <i class="fas fa-exclamation ml-1 text-yellow-500"></i>');
              input.classList.remove('border-gray-300', 'dark:border-gray-600', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
              input.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
              submitButton.disabled = false; // Laisser actif, monitorBackend gère
              submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
            } else if (!available) {
              this.showFieldError('email', 'Cet email est déjà utilisé. <i class="fas fa-exclamation ml-1 text-yellow-500"></i> <a href="/pages/auth/signin.html" class="text-blue-500 hover:underline">Se connecter</a>');
              input.classList.remove('border-gray-300', 'dark:border-gray-600', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
              input.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
              submitButton.disabled = true;
              submitButton.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
              this.showFieldError('email', 'Email valide <i class="fas fa-check-circle ml-1 text-green-500"></i>');
              input.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
              input.classList.add('border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
              submitButton.disabled = false;
              submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
            }
          } catch (e) {
            console.error('Erreur vérification email verification:', e);
            this.showFieldError('email', 'Erreur technique lors de la vérification de l\'email');
            input.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
            input.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
          }
          this.updateSubmitButtonState(form, submitButton);
        });
      }
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitButton.disabled) return;


      await showLoadingDialog('Envoi de l\'email de vérification...');

      const formData = new FormData(form);
      const emailData = {
        email: (formData.get('email') || '').trim(),
        name: (formData.get('name') || '').trim(),
        retry: false,
      };

      const errors = this.validateEmailVerificationForm(emailData);
      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, message]) => this.showFieldError(field, message));
        showNotification('Veuillez corriger les erreurs dans le formulaire.', 'error');
        return;
      }

      // Vérification finale avec cache pour vérification email
      try {
        const available = await this.checkEmailAvailabilityCached(emailData.email);
        if (available === undefined) {
          // Backend indisponible, monitorBackend est déjà déclenché
          console.warn('Backend indisponible, attente de reconnexion...');
          this.showFieldError('email', 'Vérification en attente (serveur indisponible) <i class="fas fa-exclamation ml-1 text-yellow-500"></i>');
          return;
        }
        if (!available) {
          this.showFieldError('email', 'Cet email est déjà utilisé. <i class="fas fa-exclamation ml-1 text-yellow-500"></i> <a href="/pages/auth/signin.html" class="text-blue-500 hover:underline">Se connecter</a>');
          submitButton.disabled = true;
          submitButton.classList.add('opacity-50', 'cursor-not-allowed');
          showNotification('Cet email est déjà utilisé.', 'error');
          return;
        }
      } catch (e) {
        console.error('Erreur vérification email verification finale:', e);
        this.showFieldError('email', 'Erreur technique lors de la vérification de l\'email');
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        showNotification('Erreur lors de la vérification de l\'email.', 'error');
        return;
      }

      try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> Envoi...';


        // Définir les post-opérations
        const postOperations = [
          async () => {
            console.log('🚀 Nettoyage du formulaire...');
            form.reset();
            this.clearFieldErrors(form);
          },
          async () => {
            console.log('🚀 Stockage des données de vérification...');
            localStorage.setItem('codeCheckType', 'email-verification');
            localStorage.setItem('codeCheckEmail', emailData.email);
          },
          async () => {
            console.log('🚀 Affichage de la notification de succès...');
            showNotification('Email de vérification envoyé.', 'success');
          },
        ];

        // Appel API en dernier
        console.log('🚀 Envoi de l\'email de vérification...');
        await api.auth.sendVerificationEmail(emailData, postOperations);
        console.log('✅ Envoi email de vérification réussi');

      } catch (error) {
        Swal.close();
        showNotification(error.message || 'Erreur technique lors de l\'envoi de l\'email de vérification.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span>Envoyer</span><i class="fas fa-envelope ml-2"></i>';
      }
    });
  },

  /**
   * Lie la soumission et la validation au formulaire de réinitialisation de mot de passe.
   * @function bindPasswordResetForm
   * @description Lie les événements d'input et de soumission au formulaire de réinitialisation de mot de passe.
   * Gère la validation en temps réel, la vérification d'email avec cache, et la soumission séquentielle.
   * Affiche des modaux de chargement alignés avec showLoadingDialog.
   * Gère les erreurs de manière alignée avec handleApiError.
   * Supporte le renvoi de code avec paramètre retry.
   */
  bindPasswordResetForm() {
    const form = document.getElementById('password-reset-form');
    if (!form) return;

    const submitButton = form.querySelector('button[type="submit"]');
    this.updateSubmitButtonState(form, submitButton);

    form.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        const field = input.name;
        const value = input.value.trim();
        const error = validateField(field, value);
        this.showFieldError(field, error || (value ? `${this.getFieldName(field)} valide <i class="fas fa-check-circle ml-1 text-green-500"></i>` : ''));
        this.updateSubmitButtonState(form, submitButton);
      });

      if (input.id === 'email') {
        input.addEventListener('blur', async () => {
          const value = decodeURIComponent(input.value.trim());
          const error = validateField('email', value);
          if (error) {
            this.showFieldError('email', error);
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
            return;
          }

          try {
            // Utilisation du cache pour reset password
            const available = await this.checkEmailAvailabilityCached(value);
            if (available === undefined) {
              // Backend indisponible, monitorBackend est déjà déclenché
              console.warn('Backend indisponible, attente de reconnexion...');
              this.showFieldError('email', 'Vérification en attente (serveur indisponible) <i class="fas fa-exclamation ml-1 text-yellow-500"></i>');
              input.classList.remove('border-gray-300', 'dark:border-gray-600', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
              input.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
              submitButton.disabled = false;
              submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
            } else if (available) {
              this.showFieldError('email', 'Cet email n\'existe pas. <i class="fas fa-exclamation ml-1 text-yellow-500"></i> <a href="/pages/auth/signup.html" class="text-blue-500 hover:underline">S\'inscrire</a>');
              input.classList.remove('border-gray-300', 'dark:border-gray-600', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
              input.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
              submitButton.disabled = true;
              submitButton.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
              this.showFieldError('email', 'Email valide <i class="fas fa-check-circle ml-1 text-green-500"></i>');
              input.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
              input.classList.add('border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
              submitButton.disabled = false;
              submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
            }
          } catch (e) {
            console.error('Erreur vérification email reset:', e);
            this.showFieldError('email', 'Erreur technique lors de la vérification de l\'email');
            input.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
            input.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
          }
          this.updateSubmitButtonState(form, submitButton);
        });
      }
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitButton.disabled) return;


      await showLoadingDialog('Envoi de l\'email de réinitialisation...', 'Cleaning');

      const formData = new FormData(form);
      const emailData = {
        email: (formData.get('email') || '').trim(),
        name: (formData.get('name') || '').trim(),
        retry: false, 
      };

      const errors = this.validatePasswordResetForm(emailData);
      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, message]) => this.showFieldError(field, message));
        showNotification('Veuillez corriger les erreurs dans le formulaire.', 'error');
        return;
      }

      // Vérification finale avec cache pour reset password
      try {
        const available = await this.checkEmailAvailabilityCached(emailData.email);
        if (available === undefined) {
          console.warn('Backend indisponible, attente de reconnexion...');
          this.showFieldError('email', 'Vérification en attente (serveur indisponible) <i class="fas fa-exclamation ml-1 text-yellow-500"></i>');
          return;
        }
        if (available) {
          this.showFieldError('email', 'Cet email n\'existe pas. <i class="fas fa-exclamation ml-1 text-yellow-500"></i> <a href="/pages/auth/signup.html" class="text-blue-500 hover:underline">S\'inscrire</a>');
          document.querySelector('[name="email"]').classList.remove('border-gray-300', 'dark:border-gray-600', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
          document.querySelector('[name="email"]').classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
          submitButton.disabled = true;
          submitButton.classList.add('opacity-50', 'cursor-not-allowed');
          showNotification('Cet email n\'existe pas.', 'error');
          return;
        }
      } catch (e) {
        console.error('Erreur vérification email reset finale:', e);
        this.showFieldError('email', 'Erreur technique lors de la vérification de l\'email');
        document.querySelector('[name="email"]').classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
        document.querySelector('[name="email"]').classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        showNotification('Erreur lors de la vérification de l\'email.', 'error');
        return;
      }

      try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> Envoi...';


      // Définir les post-opérations
    const postOperations = [
      async () => {
        console.log('🚀 Nettoyage du formulaire...');
        form.reset();
        this.clearFieldErrors(form);
      },
      async () => {
        console.log('🚀 Stockage des données de vérification...');
        localStorage.setItem('codeCheckType', 'password-reset');
        localStorage.setItem('codeCheckEmail', emailData.email);
      },
      async () => {
        console.log('🚀 Affichage de la notification de succès...');
        showNotification('Email de réinitialisation envoyé.', 'success');
      },
    ];

    // Appel API en dernier
    console.log('🚀 Envoi de l\'email de réinitialisation...');
    await api.auth.sendPasswordResetEmail(emailData, postOperations);
    console.log('✅ Envoi email de réinitialisation réussi');

      } catch (error) {
        Swal.close();
        showNotification(error.message || 'Erreur technique lors de l\'envoi de l\'email de réinitialisation.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span>Envoyer</span><i class="fas fa-envelope ml-2"></i>';
      }
    });
  },


  /**
 * Lie la soumission et la validation au formulaire de vérification de l'email actuel pour changement d'email.
 * @function bindChangeEmailForm
 * @description Lie les événements d'input et de soumission au formulaire de vérification de l'email actuel.
 * Gère la validation en temps réel, l'envoi d'un code de vérification, et les post-opérations.
 * Affiche des modaux de chargement alignés avec showLoadingDialog.
 * Gère les erreurs de manière alignée avec handleApiError.
 */
bindChangeEmailForm() {
  const form = document.getElementById('change-email-form');
  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');
  this.updateSubmitButtonState(form, submitButton);

  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      const field = input.name;
      const value = input.value.trim();
      const error = validateField(field, value);
      this.showFieldError(field, error || (value ? `${this.getFieldName(field)} valide <i class="fas fa-check-circle ml-1 text-green-500"></i>` : ''));
      this.updateSubmitButtonState(form, submitButton);
    });

    if (input.id === 'currentEmail') {
      input.addEventListener('blur', async () => {
        const value = decodeURIComponent(input.value.trim());
        const error = validateField('currentEmail', value);
        if (error) {
          this.showFieldError('currentEmail', error);
          submitButton.disabled = true;
          submitButton.classList.add('opacity-50', 'cursor-not-allowed');
          return;
        }

        try {
          const available = await this.checkEmailAvailabilityCached(value);
          if (available === undefined) {
            console.warn('Backend indisponible, attente de reconnexion...');
            this.showFieldError('currentEmail', 'Vérification en attente (serveur indisponible) <i class="fas fa-exclamation ml-1 text-yellow-500"></i>');
            input.classList.remove('border-gray-300', 'dark:border-gray-600', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
            input.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
          } else if (available) {
            this.showFieldError('currentEmail', 'Cet email n\'existe pas. <i class="fas fa-exclamation ml-1 text-yellow-500"></i> <a href="/pages/auth/signup.html" class="text-blue-500 hover:underline">S\'inscrire</a>');
            input.classList.remove('border-gray-300', 'dark:border-gray-600', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
            input.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
          } else {
            this.showFieldError('currentEmail', 'Email valide <i class="fas fa-check-circle ml-1 text-green-500"></i>');
            input.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
            input.classList.add('border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
          }
        } catch (e) {
          console.error('Erreur vérification currentEmail:', e);
          this.showFieldError('currentEmail', 'Erreur technique lors de la vérification de l\'email');
          input.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
          input.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
          submitButton.disabled = true;
          submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
        this.updateSubmitButtonState(form, submitButton);
      });
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitButton.disabled) return;

    await showLoadingDialog('Envoi du code de vérification...', 'Cleaning');

    const formData = new FormData(form);
    const emailData = {
      currentEmail: (formData.get('currentEmail') || '').trim(),
      name: (formData.get('name') || '').trim(),
    };

    const errors = this.validateChangeEmailForm(emailData);
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => this.showFieldError(field, message));
      showNotification('Veuillez corriger les erreurs dans le formulaire.', 'error');
      Swal.close();
      return;
    }

    try {
      const available = await this.checkEmailAvailabilityCached(emailData.currentEmail);
      if (available === undefined) {
        console.warn('Backend indisponible, attente de reconnexion...');
        this.showFieldError('currentEmail', 'Vérification en attente (serveur indisponible) <i class="fas fa-exclamation ml-1 text-yellow-500"></i>');
        Swal.close();
        return;
      }
      if (available) {
        this.showFieldError('currentEmail', 'Cet email n\'existe pas. <i class="fas fa-exclamation ml-1 text-yellow-500"></i> <a href="/pages/auth/signup.html" class="text-blue-500 hover:underline">S\'inscrire</a>');
        document.querySelector('[name="currentEmail"]').classList.remove('border-gray-300', 'dark:border-gray-600', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
        document.querySelector('[name="currentEmail"]').classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        showNotification('Cet email n\'existe pas.', 'error');
        Swal.close();
        return;
      }
    } catch (e) {
      console.error('Erreur vérification currentEmail finale:', e);
      this.showFieldError('currentEmail', 'Erreur technique lors de la vérification de l\'email');
      document.querySelector('[name="currentEmail"]').classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
      document.querySelector('[name="currentEmail"]').classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
      submitButton.disabled = true;
      submitButton.classList.add('opacity-50', 'cursor-not-allowed');
      showNotification('Erreur lors de la vérification de l\'email.', 'error');
      Swal.close();
      return;
    }

    try {
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="loading-spinner"></span> Envoi...';

      // Définir les post-opérations
      const postOperations = [
        async () => {
          console.log('🚀 Nettoyage du formulaire...');
          form.reset();
          this.clearFieldErrors(form);
        },
        async () => {
          console.log('🚀 Stockage des données de vérification...');
          localStorage.setItem('codeCheckType', 'change-email');
          localStorage.setItem('codeCheckEmail', emailData.currentEmail);
        },
        async () => {
          console.log('🚀 Affichage de la notification de succès...');
          showNotification('Code de vérification envoyé.', 'success');
        },
      ];

      // Appel API en dernier
      console.log('🚀 Envoi du code de vérification...');
      await api.auth.changeEmail(emailData, postOperations);
      console.log('✅ Envoi code de vérification réussi');


    } catch (error) {
      Swal.close();
      showNotification(error.message || 'Erreur technique lors de l\'envoi du code de vérification.', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '<span>Envoyer</span><i class="fas fa-envelope ml-2"></i>';
    }
  });
},


/**
 * Lie la soumission et la validation au formulaire de confirmation du nouvel email.
 * @function bindConfirmNewEmailForm
 * @description Lie les événements d'input et de soumission au formulaire de saisie du nouvel email.
 * Gère la validation en temps réel, la vérification de disponibilité, et les post-opérations.
 * Affiche des modaux de chargement alignés avec showLoadingDialog.
 * Gère les erreurs de manière alignée avec handleApiError.
 */
bindConfirmNewEmailForm() {
  const form = document.getElementById('confirm-new-email-form');
  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');
  this.updateSubmitButtonState(form, submitButton);

  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      const field = input.name;
      const value = input.value.trim();
      const error = validateField(field, value);
      this.showFieldError(field, error || (value ? `${this.getFieldName(field)} valide <i class="fas fa-check-circle ml-1 text-green-500"></i>` : ''));
      this.updateSubmitButtonState(form, submitButton);
    });

    if (input.id === 'newEmail') {
      input.addEventListener('blur', async () => {
        const value = decodeURIComponent(input.value.trim());
        const error = validateField('newEmail', value);
        if (error) {
          this.showFieldError('newEmail', error);
          submitButton.disabled = true;
          submitButton.classList.add('opacity-50', 'cursor-not-allowed');
          return;
        }

        try {
          const available = await this.checkEmailAvailabilityCached(value);
          if (available === undefined) {
            console.warn('Backend indisponible, attente de reconnexion...');
            this.showFieldError('newEmail', 'Vérification en attente (serveur indisponible) <i class="fas fa-exclamation ml-1 text-yellow-500"></i>');
            input.classList.remove('border-gray-300', 'dark:border-gray-600', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
            input.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
          } else if (!available) {
            this.showFieldError('newEmail', 'Cet email est déjà utilisé. <i class="fas fa-exclamation ml-1 text-yellow-500"></i> <a href="/pages/auth/signin.html" class="text-blue-500 hover:underline">Se connecter</a>');
            input.classList.remove('border-gray-300', 'dark:border-gray-600', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
            input.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
          } else {
            this.showFieldError('newEmail', 'Email valide <i class="fas fa-check-circle ml-1 text-green-500"></i>');
            input.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
            input.classList.add('border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
          }
        } catch (e) {
          console.error('Erreur vérification newEmail:', e);
          this.showFieldError('newEmail', 'Erreur technique lors de la vérification de l\'email');
          input.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
          input.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
          submitButton.disabled = true;
          submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
        this.updateSubmitButtonState(form, submitButton);
      });
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitButton.disabled) return;

    await showLoadingDialog('Envoi de l\'email de confirmation...', 'Cleaning');

    const formData = new FormData(form);
    const emailData = {
      newEmail: (formData.get('newEmail') || '').trim(),
      name: (formData.get('name') || '').trim(),
      retry: false
    };

    const errors = this.validateConfirmNewEmailForm(emailData);
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => this.showFieldError(field, message));
      showNotification('Veuillez corriger les erreurs dans le formulaire.', 'error');
      Swal.close();
      return;
    }

    try {
      const available = await this.checkEmailAvailabilityCached(emailData.newEmail);
      if (available === undefined) {
        console.warn('Backend indisponible, attente de reconnexion...');
        this.showFieldError('newEmail', 'Vérification en attente (serveur indisponible) <i class="fas fa-exclamation ml-1 text-yellow-500"></i>');
        Swal.close();
        return;
      }
      if (!available) {
        this.showFieldError('newEmail', 'Cet email est déjà utilisé. <i class="fas fa-exclamation ml-1 text-yellow-500"></i> <a href="/pages/auth/signin.html" class="text-blue-500 hover:underline">Se connecter</a>');
        document.querySelector('[name="newEmail"]').classList.remove('border-gray-300', 'dark:border-gray-600', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
        document.querySelector('[name="newEmail"]').classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        showNotification('Cet email est déjà utilisé.', 'error');
        Swal.close();
        return;
      }
    } catch (e) {
      console.error('Erreur vérification newEmail finale:', e);
      this.showFieldError('newEmail', 'Erreur technique lors de la vérification de l\'email');
      document.querySelector('[name="newEmail"]').classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
      document.querySelector('[name="newEmail"]').classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
      submitButton.disabled = true;
      submitButton.classList.add('opacity-50', 'cursor-not-allowed');
      showNotification('Erreur lors de la vérification de l\'email.', 'error');
      Swal.close();
      return;
    }

    try {
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="loading-spinner"></span> Envoi...';

      // Définir les post-opérations
      const postOperations = [
        async () => {
          console.log('🚀 Nettoyage du formulaire...');
          form.reset();
          this.clearFieldErrors(form);
        },
        async () => {
          console.log('🚀 Stockage des données de vérification...');
          localStorage.setItem('codeCheckType', 'confirm-new-email');
          localStorage.setItem('codeCheckEmail', emailData.newEmail);
        },
        async () => {
          console.log('🚀 Affichage de la notification de succès...');
          showNotification('Email de confirmation envoyé.', 'success');
        },
      ];

      // Appel API en dernier
      console.log('🚀 Envoi de l\'email de confirmation...');
      await api.auth.confirmNewEmail(emailData, postOperations);
      console.log('✅ Envoi email de confirmation réussi');
      
    } catch (error) {
      Swal.close();
      showNotification(error.message || 'Erreur technique lors de l\'envoi de l\'email de confirmation.', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '<span>Envoyer</span><i class="fas fa-envelope ml-2"></i>';
    }
  });
},



/**
 * Lie la soumission et la validation au formulaire de vérification de code.
 * @function bindCodeCheckForm
 * @description Lie les événements d'input, paste, resend et soumission au formulaire de vérification de code.
 * Gère la saisie automatique, le collage, la soumission automatique quand complet.
 * Affiche l'email en readonly depuis localStorage.
 * Ajoute un bouton de renvoi de code avec paramètre retry=true.
 * Gère les types : email-verification, password-reset, change-email.
 * Affiche des modaux de chargement alignés avec showLoadingDialog.
 * Gère les erreurs de manière alignée avec handleApiError.
 */
bindCodeCheckForm() {
  const form = document.getElementById('code-check-form');
  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const codeInputs = form.querySelectorAll('.code-input');
  const pasteButton = form.querySelector('#paste-code-button');
  const resendButton = form.querySelector('#resend-code-button');
  const emailDisplay = form.querySelector('#code-check-email');
  const codeLength = 6;

  const codeCheckType = localStorage.getItem('codeCheckType');
  const email = localStorage.getItem('codeCheckEmail');
  const name = localStorage.getItem('codeCheckName') || '';

  if (!codeCheckType || !email) {
    showNotification('Session de vérification invalide. Veuillez recommencer.', 'error');
    window.location.href = '/index.html';
    return;
  }

  if (emailDisplay) {
    emailDisplay.textContent = email;
    emailDisplay.classList.add('readonly');
  }

  // Gestion de la saisie dans les champs de code
  codeInputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      const value = input.value.trim();
      if (value.length > 1) {
        input.value = value.slice(0, 1);
      }
      if (value.length === 1 && index < codeInputs.length - 1) {
        codeInputs[index + 1].focus();
      }
      this.checkCodeCompletion(codeInputs, submitButton);
    });

    input.addEventListener('keydown', event => {
      if (event.key === 'Backspace' && !input.value && index > 0) {
        codeInputs[index - 1].focus();
      }
    });

    input.addEventListener('paste', event => {
      event.preventDefault();
      const pastedData = (event.clipboardData || window.clipboardData).getData('text').trim();
      if (/^\d{6}$/.test(pastedData)) {
        pastedData.split('').forEach((char, i) => {
          if (i < codeInputs.length) codeInputs[i].value = char;
        });
        codeInputs[codeInputs.length - 1].focus();
        this.checkCodeCompletion(codeInputs, submitButton);
      } else {
        showNotification('Le code collé est invalide. Veuillez entrer un code à 6 chiffres.', 'error');
      }
    });
  });

  // Gestion du bouton Coller
  if (pasteButton) {
    pasteButton.addEventListener('click', async () => {
      try {
        const pastedData = await navigator.clipboard.readText();
        if (/^\d{6}$/.test(pastedData.trim())) {
          pastedData.trim().split('').forEach((char, i) => {
            if (i < codeInputs.length) codeInputs[i].value = char;
          });
          codeInputs[codeInputs.length - 1].focus();
          this.checkCodeCompletion(codeInputs, submitButton);
        } else {
          showNotification('Le code dans le presse-papiers est invalide. Veuillez copier un code à 6 chiffres.', 'error');
        }
      } catch (error) {
        console.error('Erreur lors du collage du code:', error);
        showNotification('Impossible de lire le presse-papiers. Veuillez coller manuellement.', 'error');
      }
    });
  }

  // Gestion du bouton Renvoi de code
  if (resendButton) {
    resendButton.addEventListener('click', async () => {
      if (resendButton.disabled) return;

      resendButton.disabled = true;
      resendButton.innerHTML = '<span class="loading-spinner"></span> Renvoi...';

      try {
        await showLoadingDialog('Renvoi du code en cours...', 'Cleaning');

        // Définir les post-opérations pour le renvoi
        const postOperations = [
          async () => {
            console.log('🚀 Affichage de la notification de succès pour renvoi...');
            showNotification('Nouveau code envoyé.', 'success');
          },
        ];

        let response;
        const retryData = { email, name, retry: true };
        if (codeCheckType === 'email-verification') {
          response = await api.auth.sendVerificationEmail(retryData, postOperations);
        } else if (codeCheckType === 'password-reset') {
          response = await api.auth.sendPasswordResetEmail(retryData, postOperations);
        } else if (codeCheckType === 'change-email') {
          response = await api.auth.changeEmail(retryData, postOperations);
        } else if (codeCheckType === 'confirm-new-email') {
          response = await api.auth.confirmNewEmail(retryData, postOperations);
        }

        if (response === undefined) {
          console.warn(`Backend indisponible pour renvoi de code (${codeCheckType}), attente de reconnexion...`);
          return;
        }

        console.log('✅ Renvoi de code réussi');
        Swal.close();
      } catch (error) {
        Swal.close();
        showNotification(error.message || 'Erreur technique lors du renvoi du code.', 'error');
      } finally {
        resendButton.disabled = false;
        resendButton.innerHTML = '<span>Renvoi</span><i class="fas fa-redo ml-2"></i>';
      }
    });
  }

  // Soumission du formulaire
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitButton.disabled) return;

    await showLoadingDialog('Vérification du code en cours...', 'team');

    const code = Array.from(codeInputs).map(input => input.value).join('');
    const codeCheckType = localStorage.getItem('codeCheckType');
    const email = localStorage.getItem('codeCheckEmail');

    if (!codeCheckType || !email) {
      showNotification('Session de vérification invalide. Veuillez recommencer.', 'error');
      Swal.close();
      window.location.href = '/index.html';
      return;
    }

    // Vérification de la validité de l'email
    const emailError = validateField('email', email);
    if (emailError) {
      showNotification('Email invalide. Veuillez recommencer.', 'error');
      Swal.close();
      window.location.href = '/index.html';
      return;
    }

    try {
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="loading-spinner"></span> Vérification...';

      // Définir les post-opérations
      const postOperations = [
        async () => {
          console.log('🚀 Nettoyage du formulaire...');
          form.reset();
          this.clearFieldErrors(form);
        },
        async () => {
          console.log('🚀 Nettoyage du stockage local...');
          localStorage.removeItem('codeCheckType');
          localStorage.removeItem('codeCheckEmail');
          localStorage.removeItem('currentEmail');
        },
        async () => {
          console.log('🚀 Affichage de la notification de succès...');
          if (codeCheckType === 'email-verification') {
            showNotification('Email vérifié avec succès !', 'success');
          } else if (codeCheckType === 'password-reset') {
            showNotification('Code validé. Vous pouvez réinitialiser votre mot de passe.', 'success');
          } else if (codeCheckType === 'change-email') {
            showNotification('Vérification de l\'email actuel réussie. Saisissez le nouvel email.', 'success');
          } else if (codeCheckType === 'confirm-new-email') {
            showNotification('Changement d\'email confirmé avec succès !', 'success');
          }
        },
      ];

      // Appel API en dernier (spécifique au type)
      let response;
      if (codeCheckType === 'email-verification') {
        response = await api.auth.verifyEmailCode({ email, code }, postOperations);
      } else if (codeCheckType === 'password-reset') {
        response = await api.auth.verifyPasswordResetCode({ email, code }, postOperations);
      } else if (codeCheckType === 'change-email') {
        response = await api.auth.verifyChangeEmailCode({ email, code }, postOperations);
      } else if (codeCheckType === 'confirm-new-email') {
        response = await api.auth.verifyChangeEmailCode({ email, code }, postOperations);
      }

      if (response === undefined) {
        console.warn(`Backend indisponible pour vérification de code (${codeCheckType}), attente de reconnexion...`);
        Swal.close();
        return;
      }

      console.log('✅ Vérification de code réussie');
      Swal.close();
    } catch (error) {
      Swal.close();
      let errorMessage = error.message || 'Erreur technique lors de la vérification du code.';
      if (error.status === 400) {
        errorMessage = 'Code de vérification invalide ou expiré.';
      } else if (error.status === 429) {
        errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
      }
      showNotification(errorMessage, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '<span>Vérifier</span><i class="fas fa-check-circle ml-2"></i>';
    }
  });
},

  /**
   * Vérifie si tous les champs de code sont remplis pour activer la soumission automatique.
   * @function checkCodeCompletion
   * @param {NodeList} codeInputs - Les champs de saisie du code.
   * @param {HTMLButtonElement} submitButton - Le bouton de soumission.
   */
  checkCodeCompletion(codeInputs, submitButton) {
    const code = Array.from(codeInputs).map(input => input.value).join('');
    if (code.length === codeInputs.length) {
      submitButton.disabled = false;
      submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
      submitButton.click();
    } else {
      submitButton.disabled = true;
      submitButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
  },

  /**
   * Affiche l'étape actuelle avec une animation.
   * @function showStep
   * @param {NodeList} steps - Les éléments d'étape du formulaire.
   * @param {number} step - Le numéro de l'étape actuelle (index basé sur 1).
   */
  showStep(steps, step) {
    steps.forEach((s, index) => {
      s.classList.toggle('hidden', index + 1 !== step);
      if (index + 1 === step) s.classList.add('animate-fade-in');
      else s.classList.remove('animate-fade-in');
    });
    document.querySelectorAll('.step-indicator').forEach((ind, index) => {
      ind.classList.toggle('bg-blue-600', index + 1 <= step);
      ind.classList.toggle('bg-gray-300', index + 1 > step);
    });
  },

  /**
   * Met à jour l'état des boutons de navigation en fonction de la validité du formulaire.
   * @function updateStepButtonState
   * @param {NodeList} steps - Les éléments d'étape du formulaire.
   * @param {number} currentStep - Le numéro de l'étape actuelle (index basé sur 1).
   */
  async updateStepButtonState(steps, currentStep) {
    const stepElement = steps[currentStep - 1];
    const nextButton = stepElement.querySelector('.next-step');
    const prevButton = stepElement.querySelector('.prev-step');
    const submitButton = document.querySelector('#submit-button');

    if (nextButton) {
      const isValid = await this.validateStep(steps, currentStep);
      nextButton.disabled = !isValid;
      nextButton.classList.toggle('opacity-50', !isValid);
      nextButton.classList.toggle('cursor-not-allowed', !isValid);
    }

    if (prevButton) {
      prevButton.disabled = currentStep === 1;
      prevButton.classList.toggle('opacity-50', currentStep === 1);
      prevButton.classList.toggle('cursor-not-allowed', currentStep === 1);
    }

    if (currentStep === steps.length && submitButton) {
      const isValid = await this.validateStep(steps, currentStep);
      const password = document.getElementById('password')?.value.trim() || '';
      const confirmPassword = document.getElementById('confirmPassword')?.value.trim() || '';
      const passwordsMatch = password === confirmPassword;
      submitButton.disabled = !isValid || !passwordsMatch;
      submitButton.classList.toggle('opacity-50', !isValid || !passwordsMatch);
      submitButton.classList.toggle('cursor-not-allowed', !isValid || !passwordsMatch);
    }
  },

  /**
   * Valide une étape spécifique du formulaire d'inscription - SANS CACHE GLOBAL, UNIQUEMENT PAR EMAIL.
   * @function validateStep
   * @param {NodeList} steps - Les éléments d'étape du formulaire.
   * @param {number} step - Le numéro de l'étape à valider (index basé sur 1).
   * @returns {Promise<boolean>} Indique si l'étape est valide.
   */
  async validateStep(steps, step) {
    const stepElement = steps[step - 1];
    const inputs = stepElement.querySelectorAll('input[required]:not([type="hidden"]), select[required]:not(.hidden)');
    let valid = true;

    if (typeof Joi === 'undefined') {
      console.error('Joi-browser n\'est pas chargé. Assurez-vous d\'inclure le script Joi-browser via un CDN.');
      return false;
    }

    // Validation des champs de l'étape
    for (const input of inputs) {
      const field = input.name;
      const value = field.includes('email') ? decodeURIComponent(input.value.trim()) : input.value.trim();
      const error = validateField(field, value);
      
      if (field === 'email') {
        if (!error) {
          try {
            const available = await this.checkEmailAvailabilityCached(value);
            availableEmail = available;
            
            if (available === undefined) {
              // Backend indisponible, monitorBackend est déjà déclenché
              console.warn('Backend indisponible, attente de reconnexion...');
              this.showFieldError('email', 'Vérification en attente (serveur indisponible) <i class="fas fa-exclamation ml-1 text-yellow-500"></i>');
              input.classList.remove('border-gray-300', 'dark:border-gray-600', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
              input.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
              // Ne pas marquer comme invalide, monitorBackend gère
            } else if (!available) {
              this.showFieldError('email', 'Cet email est déjà utilisé. <i class="fas fa-exclamation ml-1 text-yellow-500"></i> <a href="/pages/auth/signin.html" class="text-blue-500 hover:underline">Se connecter</a>');
              input.classList.remove('border-gray-300', 'dark:border-gray-600', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
              input.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
              valid = false;
            } else {
              this.showFieldError('email', 'Email valide <i class="fas fa-check-circle ml-1 text-green-500"></i>');
              input.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
              input.classList.add('border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
            }
          } catch (e) {
            console.error('Erreur validation étape email:', e);
            this.showFieldError('email', 'Erreur technique lors de la vérification de l\'email');
            input.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50', 'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
            input.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
            valid = false;
          }
        } else {
          this.showFieldError('email', error);
          valid = false;
        }
      } else {
        // Validation des autres champs 
        this.showFieldError(field, error || (value ? `${this.getFieldName(field)} valide <i class="fas fa-check-circle ml-1 text-green-500"></i>` : ''));
        if (error) valid = false;
      }
    }

    // Validation spécifique pour la dernière étape (mot de passe)
    if (step === steps.length) {
      const password = document.getElementById('password')?.value.trim() || '';
      const confirmPassword = document.getElementById('confirmPassword')?.value.trim() || '';
      if (password && confirmPassword && password !== confirmPassword) {
        this.showFieldError('confirmPassword', 'Les mots de passe ne correspondent pas.');
        valid = false;
      } else if (password && confirmPassword) {
        this.showFieldError('confirmPassword', 'Mot de passe confirmé <i class="fas fa-check-circle ml-1 text-green-500"></i>');
      }
    }

    return valid;
  },

  /**
 * Lie l'événement de clic aux boutons de déconnexion sur la page.
 * @function bindSignOutButton
 * @description Lie l'événement de déconnexion, gère la confirmation, la déconnexion backend et Firebase.
 * Passe les post-opérations à l'API pour nettoyage des caches, notification, et redirection.
 * Gère les erreurs de manière alignée avec handleApiError.
 */
bindSignOutButton() {
  const buttons = document.querySelectorAll('.signout-button');
  if (!buttons.length) return;

  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      const result = await Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: 'Vous allez être déconnecté de votre compte.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3f7599ff',
        cancelButtonColor: 'rgba(139, 87, 87, 1)',
        confirmButtonText: 'Oui, se déconnecter',
        cancelButtonText: 'Annuler',
        background: this.isDarkMode() ? '#1B1B18' : '#FDFDFC',
        color: this.isDarkMode() ? '#FDFDFC' : '#1B1B18',
      });

      if (!result.isConfirmed) return;

      try {
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner"></span> Déconnexion...';

        await showLoadingDialog('Déconnexion en cours...', 'Cleaning');

        // Définir les post-opérations à passer à l'API
        const postOperations = [
          async () => {
            console.log('🚀 Nettoyage des caches utilisateur...');
            clearUserCache();
            clearStoredToken();
            localStorage.clear();
            sessionStorage.clear();
          },
          async () => {
            console.log('🚀 Affichage de la notification de succès...');
            await showNotification('Déconnexion réussie.', 'success');
          },
        ];

        console.log('🚀 Déconnexion Firebase...');

        // Appel API de déconnexion avec post-opérations
        console.log('🚀 Lancement de la déconnexion backend...');
        const response = await api.auth.signOut(postOperations);
        if (response === undefined) {
          console.warn('Backend indisponible pour déconnexion, poursuite avec déconnexion locale...');
          for (const operation of postOperations) {
            try {
              await operation();
              console.log('✅ Opération post-déconnexion exécutée:', operation.name || 'anonyme');
            } catch (opError) {
              console.error('❌ Erreur lors de l\'exécution de l\'opération post-déconnexion:', opError);
            }
          }
          window.location.replace('/index.html');
          return;
        }

        console.log('✅ Déconnexion réussie');
        Swal.close();
      } catch (error) {
        Swal.close();
        showNotification(error.message || 'Erreur technique lors de la déconnexion.', 'error');
        try {
          clearUserCache();
          clearStoredToken();
          localStorage.clear();
          sessionStorage.clear();
          window.location.replace('/index.html');
        } catch (localError) {
          console.error('Erreur lors de la déconnexion locale:', localError);
        }
      } finally {
        button.disabled = false;
        button.innerHTML = '<span>Se déconnecter</span><i class="fas fa-sign-out-alt ml-2"></i>';
      }
    });
  });
},

/**
 * Lie la soumission et la validation au formulaire de réinitialisation de mot de passe.
 * @function bindResetPasswordForm
 * @description Lie les événements d'input et de soumission au formulaire de réinitialisation de mot de passe.
 * Gère la validation en temps réel, vérifie que les mots de passe correspondent, et exécute des post-opérations.
 * Affiche des modaux de chargement alignés avec showLoadingDialog.
 * Gère les erreurs de manière alignée avec handleApiError.
 */
bindResetPasswordForm() {
  const form = document.getElementById('reset-password-form');
  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');
  this.updateSubmitButtonState(form, submitButton);

  // Validation en temps réel des champs
  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      const field = input.name;
      const value = input.value.trim();
      const error = validateField(field, value);
      this.showFieldError(field, error || (value ? `${this.getFieldName(field)} valide <i class="fas fa-check-circle ml-1 text-green-500"></i>` : ''));

      // Vérification de la correspondance des mots de passe
      const password = document.getElementById('password')?.value.trim() || '';
      const confirmPassword = document.getElementById('confirm-password')?.value.trim() || '';
      if (password && confirmPassword) {
        const confirmError = password !== confirmPassword ? 'Les mots de passe ne correspondent pas.' : '';
        this.showFieldError('confirm-password', confirmError || (confirmPassword ? 'Mot de passe confirmé <i class="fas fa-check-circle ml-1 text-green-500"></i>' : ''));
      }

      this.updateSubmitButtonState(form, submitButton);
    });
  });

  // Soumission du formulaire
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitButton.disabled) return;

    await showLoadingDialog('Réinitialisation du mot de passe...', 'Cleaning');

    const formData = new FormData(form);
    const passwordData = {
      email: localStorage.getItem('codeCheckEmail') || '',
      password: (formData.get('password') || '').trim(),
      confirmPassword: (formData.get('confirm-password') || '').trim(),
    };

    // Vérification de l'email en localStorage
    if (!passwordData.email) {
     await showNotification('Session de réinitialisation invalide. Veuillez recommencer.', 'error');
      Swal.close();
      window.location.replace('/index.html');
      return;
    }

    // Validation des champs
    const errors = this.validateResetPasswordForm(passwordData);
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => this.showFieldError(field, message));
      await showNotification('Veuillez corriger les erreurs dans le formulaire.', 'error');
      Swal.close();
      return;
    }

    // Vérification finale de la correspondance des mots de passe
    if (passwordData.password !== passwordData.confirmPassword) {
      this.showFieldError('confirm-password', 'Les mots de passe ne correspondent pas.');
      await showNotification('Les mots de passe ne correspondent pas.', 'error');
      Swal.close();
      return;
    }

    try {
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="loading-spinner"></span> Réinitialisation...';

      // Définir les post-opérations
      const postOperations = [
        async () => {
          console.log('🚀 Nettoyage du formulaire...');
          form.reset();
          this.clearFieldErrors(form);
        },
        async () => {
          console.log('🚀 Nettoyage du stockage local...');
          localStorage.removeItem('codeCheckType');
          localStorage.removeItem('codeCheckEmail');
        },
        async () => {
          console.log('🚀 Affichage de la notification de succès...');
         await showNotification('Mot de passe réinitialisé avec succès.', 'success');
        },
        async () => {
          console.log('🚀 Redirection vers la page de connexion...');
         window.location.replace('/pages/auth/signin.html');
        },
      ];

      // Appel API pour réinitialiser le mot de passe
      console.log('🚀 Lancement de la réinitialisation du mot de passe...');
      const response = await api.auth.resetPassword(passwordData, postOperations);
      if (response === undefined) {
        console.warn('Backend indisponible pour réinitialisation du mot de passe, attente de reconnexion...');
        Swal.close();
        return;
      }

      console.log('✅ Réinitialisation du mot de passe réussie');
      Swal.close();
    } catch (error) {
      Swal.close();
      let errorMessage = error.message || 'Erreur technique lors de la réinitialisation du mot de passe.';
      if (error.status === 400) {
        errorMessage = 'Données invalides ou session expirée.';
      } else if (error.status === 429) {
        errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
      }
      showNotification(errorMessage, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '<span>Réinitialiser</span><i class="fas fa-key ml-2"></i>';
    }
  });
},


  /**
 * Valide le formulaire d'inscription.
 * @function validateSignUpForm
 * @param {Object} data - Les données du formulaire.
 * @returns {Object} Un objet contenant les erreurs, vide si aucune erreur.
 */
validateSignUpForm(data) {
  const errors = {};

  // Validation de l'email
  if (!data.email || data.email.trim() === '') {
    errors.email = "L'email est requis.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Veuillez entrer un email valide.";
  }

  // Validation du mot de passe
  if (!data.password || data.password.trim() === '') {
    errors.password = "Le mot de passe est requis.";
  } else if (data.password.length < 8) {
    errors.password = "Le mot de passe doit contenir au moins 8 caractères.";
  } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(data.password)) {
    errors.password = "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.";
  }

  // Validation de la confirmation du mot de passe
  if (!data.confirmPassword || data.confirmPassword.trim() === '') {
    errors.confirmPassword = "La confirmation du mot de passe est requise.";
  } else if (data.confirmPassword !== data.password) {
    errors.confirmPassword = "Les mots de passe ne correspondent pas.";
  }

  // Validation du nom
  if (!data.name || data.name.trim() === '') {
    errors.name = "Le nom est requis.";
  } else if (data.name.length < 2) {
    errors.name = "Le nom doit contenir au moins 2 caractères.";
  }

  // Validation du téléphone (optionnel)
  if (data.phone && data.phone.trim() !== '') {
    if (!/^\+\d{1,3}\s\d{9,}$/.test(data.phone)) {
      errors.phone = "Veuillez entrer un numéro de téléphone valide (ex: +33 123456789).";
    }
  }

  // Validation du code postal (optionnel)
  if (data.postalCode && data.postalCode.trim() !== '') {
    if (!/^\d{5}$/.test(data.postalCode)) {
      errors.postalCode = "Le code postal doit contenir exactement 5 chiffres.";
    }
  }

  // Validation du pays
  if (!data.country || data.country.trim() === '') {
    errors.country = "Le pays est requis.";
  }

  // Les champs street et dialCode sont optionnels et ne nécessitent pas de validation stricte
  return errors;
}
,

/**
 * Valide le formulaire de connexion.
 * @function validateSignInForm
 * @param {Object} data - Les données du formulaire.
 * @returns {Object} Un objet contenant les erreurs, vide si aucune erreur.
 */
validateSignInForm(data) {
  const errors = {};

  // Validation de l'email
  if (!data.email || data.email.trim() === '') {
    errors.email = "L'email est requis.";
  } else {
    const emailError = validateField('email', data.email, true);
    if (emailError) errors.email = emailError;
  }

  // Validation du mot de passe
  if (!data.password || data.password.trim() === '') {
    errors.password = "Le mot de passe est requis.";
  } else {
    const passwordError = validateField('password', data.password, true);
    if (passwordError) errors.password = passwordError;
  }

  return errors;
},

/**
 * Valide le formulaire de vérification d'email.
 * @function validateEmailVerificationForm
 * @param {Object} data - Les données du formulaire.
 * @returns {Object} Un objet contenant les erreurs, vide si aucune erreur.
 */
validateEmailVerificationForm(data) {
  const errors = {};

  // Validation de l'email
  if (!data.email || data.email.trim() === '') {
    errors.email = "L'email est requis.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Veuillez entrer un email valide.";
  }

  // Validation du nom
  if (!data.name || data.name.trim() === '') {
    errors.name = "Le nom est requis.";
  } else if (data.name.length < 2) {
    errors.name = "Le nom doit contenir au moins 2 caractères.";
  }

  return errors;
},

/**
 * Valide le formulaire de réinitialisation de mot de passe.
 * @function validatePasswordResetForm
 * @param {Object} data - Les données du formulaire.
 * @returns {Object} Un objet contenant les erreurs, vide si aucune erreur.
 */
validatePasswordResetForm(data) {
  const errors = {};

  // Validation de l'email
  if (!data.email || data.email.trim() === '') {
    errors.email = "L'email est requis.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Veuillez entrer un email valide.";
  }

  // Validation du nom
  if (!data.name || data.name.trim() === '') {
    errors.name = "Le nom est requis.";
  } else if (data.name.length < 2) {
    errors.name = "Le nom doit contenir au moins 2 caractères.";
  }

  return errors;
},

/**
 * Valide le formulaire de changement d'email.
 * @function validateChangeEmailForm
 * @param {Object} data - Les données du formulaire.
 * @returns {Object} Un objet contenant les erreurs, vide si aucune erreur.
 */
 validateChangeEmailForm(data) {
  const errors = {};

  // Validation de l'email actuel
  if (!data.currentEmail || data.currentEmail.trim() === '') {
    errors.currentEmail = "L'email actuel est requis.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.currentEmail)) {
    errors.currentEmail = "Veuillez entrer un email valide pour l'email actuel.";
  }

  // Validation du nom
  if (!data.name || data.name.trim() === '') {
    errors.name = "Le nom est requis.";
  } else if (data.name.length < 2) {
    errors.name = "Le nom doit contenir au moins 2 caractères.";
  }

  return errors;
},

/**
 * Valide le formulaire de confirmation du nouvel email.
 * @function validateConfirmNewEmailForm
 * @param {Object} data - Les données du formulaire.
 * @returns {Object} Un objet contenant les erreurs, vide si aucune erreur.
 */
validateConfirmNewEmailForm(data) {
  const errors = {};

  // Validation du nouvel email
  if (!data.newEmail || data.newEmail.trim() === '') {
    errors.newEmail = "Le nouvel email est requis.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.newEmail)) {
    errors.newEmail = "Le nouvel email est invalide.";
  }

  // Validation du nom (optionnel)
  if (data.name && data.name.trim() !== '' && data.name.length < 2) {
    errors.name = "Le nom doit contenir au moins 2 caractères.";
  }

  return errors;
},

/**
 * Valide les données du formulaire de réinitialisation de mot de passe.
 * @function validateResetPasswordForm
 * @param {Object} data - Les données du formulaire.
 * @param {string} data.email - Adresse email.
 * @param {string} data.password - Nouveau mot de passe.
 * @param {string} data.confirmPassword - Confirmation du mot de passe.
 * @returns {Object} Un objet contenant les erreurs de validation, ou vide si valide.
 */
validateResetPasswordForm(data) {
  const errors = {};

  // Validation de l'email
  const emailError = validateField('email', data.email);
  if (emailError) {
    errors.email = emailError;
  }

  // Validation du mot de passe
  const passwordError = validateField('password', data.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  // Validation de la confirmation du mot de passe
  const confirmPasswordError = validateField('confirmPassword', data.confirmPassword);
  if (confirmPasswordError) {
    errors.confirmPassword = confirmPasswordError;
  }

  // Vérification de la correspondance des mots de passe
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Les mots de passe ne correspondent pas.';
  }

  return errors;
},




/**
 * Met à jour l'état du bouton de soumission en fonction de la validité du formulaire.
 * @function updateSubmitButtonState
 * @param {HTMLFormElement} form - Le formulaire.
 * @param {HTMLButtonElement} submitButton - Le bouton de soumission.
 */
updateSubmitButtonState(form, submitButton) {
  const inputs = form.querySelectorAll('input[required]:not([type="hidden"])');
  let valid = true;

  inputs.forEach(input => {
    const field = input.name;
    const value = field.includes('email') ? decodeURIComponent(input.value.trim()) : input.value.trim();
    const error = validateField(field, value, true);
    if (error) valid = false;
  });

  submitButton.disabled = !valid;
  submitButton.classList.toggle('opacity-50', !valid);
  submitButton.classList.toggle('cursor-not-allowed', !valid);
},


/**
 * Affiche un message d'erreur ou de validation pour un champ de formulaire.
 * @function showFieldError
 * @param {string} field - Nom du champ.
 * @param {string|null} message - Message d'erreur, de validation ou de suggestion, ou null pour effacer.
 */
showFieldError(field, message) {
  const input = document.querySelector(`[name="${field}"]`);
  if (!input) {
    console.warn(`Champ ${field} introuvable pour afficher le message`);
    return;
  }

  const errorElement = input.parentElement.parentElement.querySelector('.error-message');
  if (!errorElement) {
    console.warn(`Élément de message d'erreur introuvable pour le champ ${field}`);
    return;
  }

  input.classList.remove(
    'border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50',
    'border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50',
    'border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50',
    'border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50',
    'border-gray-300', 'dark:border-gray-600'
  );

  if (message) {
    if (message.includes('fa-check-circle')) {
      errorElement.innerHTML = `<span class="text-green-500"><i class="fas fa-check-circle mr-1"></i>${message.replace(/<i class="fas fa-check-circle ml-1 text-green-500"><\/i>/, '')}</span>`;
      errorElement.classList.remove('text-red-500', 'text-yellow-500', 'hidden');
      errorElement.classList.add('text-green-500', 'block');
      input.classList.add('border-green-500', 'focus:border-green-500', 'focus:ring-green-500/50');
    } else if (message.includes('fa-exclamation')) {
      errorElement.innerHTML = `<span class="text-yellow-500"><i class="fas fa-exclamation-circle mr-1"></i>${message.replace(/<i class="fas fa-exclamation ml-1 text-yellow-500"><\/i>/, '')}</span>`;
      errorElement.classList.remove('text-red-500', 'text-green-500', 'hidden');
      errorElement.classList.add('text-yellow-500', 'block');
      input.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500/50');
    } else if (message.includes('fa-spinner')) {
      errorElement.innerHTML = `<span class="text-blue-500"><i class="fas fa-spinner fa-spin mr-1"></i>${message.replace(/<i class="fas fa-spinner fa-spin ml-1 text-blue-500"><\/i>/, '')}</span>`;
      errorElement.classList.remove('text-red-500', 'text-green-500', 'text-yellow-500', 'hidden');
      errorElement.classList.add('text-blue-500', 'block');
      input.classList.add('border-blue-500', 'focus:border-blue-500', 'focus:ring-blue-500/50');
    } else {
      errorElement.innerHTML = `<span class="text-red-500"><i class="fas fa-times-circle mr-1"></i>${message}</span>`;
      errorElement.classList.remove('text-green-500', 'text-yellow-500', 'hidden');
      errorElement.classList.add('text-red-500', 'block');
      input.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
    }
  } else {
    errorElement.innerHTML = '';
    errorElement.classList.add('hidden');
    errorElement.classList.remove('text-red-500', 'text-green-500', 'text-yellow-500', 'text-blue-500');
    input.classList.add('border-gray-300', 'dark:border-gray-600', 'focus:border-blue-500', 'focus:ring-blue-500/50');
  }
},

  /**
   * Efface les messages d'erreur d'un formulaire.
   * @function clearFieldErrors
   * @param {HTMLFormElement} form - Le formulaire.
   */
  clearFieldErrors(form) {
    form.querySelectorAll('.error-message').forEach(errorElement => {
      errorElement.innerHTML = '';
      errorElement.classList.add('hidden');
    });

    form.querySelectorAll('input, select').forEach(input => {
      input.classList.remove('border-red-500', 'border-yellow-500', 'border-green-500', 'focus:border-red-500', 'focus:border-yellow-500', 'focus:border-green-500', 'focus:ring-red-500/50', 'focus:ring-yellow-500/50', 'focus:ring-green-500/50');
      input.classList.add('border-gray-300', 'dark:border-gray-600');
    });
  }
};



export default auth;
