/**
 * @file auth.js
 * @description Gère l'authentification pour L&L Ouest Services, incluant l'inscription, la connexion, la vérification d'email, la réinitialisation de mot de passe, le changement d'email et la vérification de code.
 * @module auth
 * @requires ../api.js
 * @requires ./utils.js
 */

import api from '../api.js';
import { showNotification, validateField, generateString } from './utils.js';

/**
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
    this.bindSignOutButton();
    this.bindCodeCheckForm();
  },

  /**
   * Lie la soumission et la validation en temps réel au formulaire d'inscription.
   * @function bindSignUpForm
   */
  bindSignUpForm() {
    const form = document.getElementById('signup-form');
    if (!form) return;

    const steps = form.querySelectorAll('.step');
    const submitButton = form.querySelector('button[type="submit"]');
    let currentStep = 1;
    this.showStep(steps, currentStep);
    this.updateStepButtonState(steps, currentStep);

    // Validation en temps réel des champs
    const inputs = form.querySelectorAll('input:not([type="hidden"]), select:not(.hidden)');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        const field = input.name;
        const value = input.value.trim();
        const error = validateField(field, value);
        this.showFieldError(field, error);
        if (field === 'password' || field === 'confirmPassword') {
          const password = document.getElementById('password')?.value.trim() || '';
          const confirmPassword = document.getElementById('confirmPassword')?.value.trim() || '';
          this.showFieldError('confirmPassword', password && confirmPassword && password !== confirmPassword ? 'Les mots de passe ne correspondent pas.' : '');
        }
        this.updateStepButtonState(steps, currentStep);
      });
    });

    // Navigation entre étapes : Bouton Suivant
    form.querySelectorAll('.next-step').forEach(button => {
      button.addEventListener('click', () => {
        if (this.validateStep(steps, currentStep)) {
          currentStep++;
          this.showStep(steps, currentStep);
          this.updateStepButtonState(steps, currentStep);
        }
      });
    });

    // Navigation entre étapes : Bouton Précédent
    form.querySelectorAll('.prev-step').forEach(button => {
      button.addEventListener('click', () => {
        currentStep--;
        this.showStep(steps, currentStep);
        this.updateStepButtonState(steps, currentStep);
      });
    });

    // Soumission du formulaire
    form.addEventListener('submit', async event => {
      event.preventDefault();

      // Valider toutes les étapes avant soumission
      let allStepsValid = true;
      for (let step = 1; step <= steps.length; step++) {
        if (!this.validateStep(steps, step)) {
          allStepsValid = false;
          currentStep = step;
          this.showStep(steps, currentStep);
          this.updateStepButtonState(steps, currentStep);
          break;
        }
      }

      if (!allStepsValid) {
        showNotification('Veuillez corriger les erreurs dans le formulaire.', 'error');
        return;
      }

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
        fcmToken: generateString(32),
      };

      const errors = this.validateSignUpForm(userData);
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
        showNotification('Veuillez corriger les erreurs dans le formulaire.', 'error');
        return;
      }

      if (userData.dialCode && userData.phone) {
        userData.phone = `${userData.dialCode} ${userData.phone}`;
      }

      try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> Traitement...';

        Swal.fire({
          title: 'Veuillez patienter...',
          html: '<div class="flex justify-center items-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ll-blue"></div></div>',
          allowOutsideClick: false,
          showConfirmButton: false,
        });

        await api.auth.signUp(userData);
        Swal.close();
        showNotification('Inscription réussie !', 'success');
        form.reset();
        this.clearFieldErrors(form);
        localStorage.removeItem('signupFormData');
        window.location.href = '/dashboard.html';
      } catch (error) {
        Swal.close();
        showNotification(error.message || 'Erreur lors de l\'inscription.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span>S\'inscrire</span><i class="fas fa-check-circle ml-2"></i>';
      }
    });
  },

  /**
   * Lie la soumission et la validation au formulaire de connexion.
   * @function bindSignInForm
   */
  bindSignInForm() {
    const form = document.getElementById('signin-form');
    if (!form) return;

    const submitButton = form.querySelector('button[type="submit"]');
    this.updateSubmitButtonState(form, submitButton);

    form.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        const field = input.name;
        const value = input.value.trim();
        const error = validateField(field, value, true);
        this.showFieldError(field, error);
        this.updateSubmitButtonState(form, submitButton);
      });
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitButton.disabled) return;

      const formData = new FormData(form);
      const credentials = {
        email: (formData.get('email') || '').trim(),
        password: (formData.get('password') || '').trim(),
        fcmToken: generateString(32),
      };

      const errors = this.validateSignInForm(credentials);
      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, message]) => this.showFieldError(field, message));
        return;
      }

      try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> Connexion...';

        Swal.fire({
          title: 'Veuillez patienter...',
          html: '<div class="flex justify-center items-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ll-blue"></div></div>',
          allowOutsideClick: false,
          showConfirmButton: false,
        });

        await api.auth.signIn(credentials);
        Swal.close();
        showNotification('Connexion réussie ! Veuillez patienter...', 'success');
        form.querySelectorAll('input').forEach(input => (input.disabled = true));

        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 5000);
      } catch (error) {
        Swal.close();
        showNotification(error.message || 'Erreur lors de la connexion.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span>Se connecter</span><i class="fas fa-sign-in-alt ml-2"></i>';
      }
    });
  },

  /**
   * Lie la soumission et la validation au formulaire de vérification d'email.
   * @function bindEmailVerificationForm
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
        this.showFieldError(field, error);
        this.updateSubmitButtonState(form, submitButton);
      });
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitButton.disabled) return;

      const formData = new FormData(form);
      const emailData = {
        email: (formData.get('email') || '').trim(),
        name: (formData.get('name') || '').trim(),
      };

      const errors = this.validateEmailVerificationForm(emailData);
      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, message]) => this.showFieldError(field, message));
        return;
      }

      try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> Envoi...';

        Swal.fire({
          title: 'Veuillez patienter...',
          html: '<div class="flex justify-center items-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ll-blue"></div></div>',
          allowOutsideClick: false,
          showConfirmButton: false,
        });

        await api.auth.sendEmailVerification(emailData.email, emailData.name);
        localStorage.setItem('codeCheckType', 'email-verification');
        localStorage.setItem('codeCheckEmail', emailData.email);
        Swal.close();
        showNotification('Email de vérification envoyé.', 'success');
        form.reset();
        this.clearFieldErrors(form);
        window.location.href = '/pages/auth/code-check.html';
      } catch (error) {
        Swal.close();
        showNotification(error.message || 'Erreur lors de l\'envoi de l\'email de vérification.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span>Envoyer</span><i class="fas fa-envelope ml-2"></i>';
      }
    });
  },

  /**
   * Lie la soumission et la validation au formulaire de réinitialisation de mot de passe.
   * @function bindPasswordResetForm
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
        this.showFieldError(field, error);
        this.updateSubmitButtonState(form, submitButton);
      });
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitButton.disabled) return;

      const formData = new FormData(form);
      const emailData = {
        email: (formData.get('email') || '').trim(),
        name: (formData.get('name') || '').trim(),
      };

      const errors = this.validatePasswordResetForm(emailData);
      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, message]) => this.showFieldError(field, message));
        return;
      }

      try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> Envoi...';

        Swal.fire({
          title: 'Veuillez patienter...',
          html: '<div class="flex justify-center items-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ll-blue"></div></div>',
          allowOutsideClick: false,
          showConfirmButton: false,
        });

        await api.auth.sendPasswordReset(emailData.email, emailData.name);
        localStorage.setItem('codeCheckType', 'password-reset');
        localStorage.setItem('codeCheckEmail', emailData.email);
        Swal.close();
        showNotification('Email de réinitialisation envoyé.', 'success');
        form.reset();
        this.clearFieldErrors(form);
        window.location.href = '/pages/auth/code-check.html';
      } catch (error) {
        Swal.close();
        showNotification(error.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span>Envoyer</span><i class="fas fa-envelope ml-2"></i>';
      }
    });
  },

  /**
   * Lie la soumission et la validation au formulaire de changement d'email.
   * @function bindChangeEmailForm
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
        this.showFieldError(field, error);
        this.updateSubmitButtonState(form, submitButton);
      });
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitButton.disabled) return;

      const formData = new FormData(form);
      const emailData = {
        currentEmail: (formData.get('currentEmail') || '').trim(),
        newEmail: (formData.get('newEmail') || '').trim(),
        name: (formData.get('name') || '').trim(),
      };

      const errors = this.validateChangeEmailForm(emailData);
      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, message]) => this.showFieldError(field, message));
        return;
      }

      try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> Envoi...';

        Swal.fire({
          title: 'Veuillez patienter...',
          html: '<div class="flex justify-center items-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ll-blue"></div></div>',
          allowOutsideClick: false,
          showConfirmButton: false,
        });

        await api.auth.sendVerifyAndChangeEmail(emailData.currentEmail, emailData.newEmail, emailData.name);
        localStorage.setItem('codeCheckType', 'change-email');
        localStorage.setItem('codeCheckEmail', emailData.newEmail);
        Swal.close();
        showNotification('Email de changement envoyé.', 'success');
        form.reset();
        this.clearFieldErrors(form);
        window.location.href = '/pages/auth/code-check.html';
      } catch (error) {
        Swal.close();
        showNotification(error.message || 'Erreur lors de l\'envoi de l\'email de changement.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span>Envoyer</span><i class="fas fa-envelope ml-2"></i>';
      }
    });
  },

  /**
   * Lie la soumission et la validation au formulaire de vérification de code.
   * @function bindCodeCheckForm
   */
  bindCodeCheckForm() {
    const form = document.getElementById('code-check-form');
    if (!form) return;

    const submitButton = form.querySelector('button[type="submit"]');
    const codeInputs = form.querySelectorAll('.code-input');
    const codeLength = 6;

    // Gestion de la saisie dans les champs de code
    codeInputs.forEach((input, index) => {
      input.addEventListener('input', () => {
        const value = input.value.trim();
        if (value.length > 1) {
          input.value = value.slice(0, 1); // Limiter à un caractère
        }
        if (value.length === 1 && index < codeInputs.length - 1) {
          codeInputs[index + 1].focus(); // Passer au champ suivant
        }
        this.checkCodeCompletion(codeInputs, submitButton);
      });

      input.addEventListener('keydown', event => {
        if (event.key === 'Backspace' && !input.value && index > 0) {
          codeInputs[index - 1].focus(); // Revenir au champ précédent
        }
      });

      input.addEventListener('paste', event => {
        event.preventDefault();
        const pastedData = (event.clipboardData || window.clipboardData).getData('text').trim();
        if (/^\d{6}$/.test(pastedData)) {
          pastedData.split('').forEach((char, i) => {
            if (i < codeInputs.length) codeInputs[i].value = char;
          });
          this.checkCodeCompletion(codeInputs, submitButton);
        }
      });
    });

    // Soumission du formulaire
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitButton.disabled) return;

      const code = Array.from(codeInputs).map(input => input.value).join('');
      const codeCheckType = localStorage.getItem('codeCheckType');
      const email = localStorage.getItem('codeCheckEmail');

      if (!codeCheckType || !email) {
        showNotification('Session de vérification invalide. Veuillez recommencer.', 'error');
        window.location.href = '/index.html';
        return;
      }

      try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> Vérification...';

        Swal.fire({
          title: 'Veuillez patienter...',
          html: '<div class="flex justify-center items-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ll-blue"></div></div>',
          allowOutsideClick: false,
          showConfirmButton: false,
        });

        if (codeCheckType === 'email-verification') {
          await api.auth.verifyEmailCode(email, code);
          showNotification('Email vérifié avec succès !', 'success');
          window.location.href = '/dashboard.html';
        } else if (codeCheckType === 'password-reset') {
          await api.auth.verifyPasswordResetCode(email, code);
          showNotification('Code validé. Vous pouvez réinitialiser votre mot de passe.', 'success');
          window.location.href = '/pages/auth/reset-password.html';
        } else if (codeCheckType === 'change-email') {
          await api.auth.verifyChangeEmailCode(email, code);
          showNotification('Changement d\'email effectué avec succès !', 'success');
          window.location.href = '/dashboard.html';
        }

        Swal.close();
        localStorage.removeItem('codeCheckType');
        localStorage.removeItem('codeCheckEmail');
        form.reset();
      } catch (error) {
        Swal.close();
        showNotification(error.message || 'Erreur lors de la vérification du code.', 'error');
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
      submitButton.click(); // Soumission automatique
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
  updateStepButtonState(steps, currentStep) {
    const stepElement = steps[currentStep - 1];
    const nextButton = stepElement.querySelector('.next-step');
    const prevButton = stepElement.querySelector('.prev-step');
    const submitButton = document.querySelector('button[type="submit"]');

    if (nextButton) {
      const isValid = this.validateStep(steps, currentStep);
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
      const isValid = this.validateStep(steps, currentStep);
      submitButton.disabled = !isValid;
      submitButton.classList.toggle('opacity-50', !isValid);
      submitButton.classList.toggle('cursor-not-allowed', !isValid);
    }
  },

  /**
   * Valide une étape spécifique du formulaire d'inscription.
   * @function validateStep
   * @param {NodeList} steps - Les éléments d'étape du formulaire.
   * @param {number} step - Le numéro de l'étape à valider (index basé sur 1).
   * @returns {boolean} Indique si l'étape est valide.
   */
  validateStep(steps, step) {
    const stepElement = steps[step - 1];
    const inputs = stepElement.querySelectorAll('input[required]:not([type="hidden"]), select[required]:not(.hidden)');
    let valid = true;

    inputs.forEach(input => {
      const field = input.name;
      const value = input.value.trim();
      const error = validateField(field, value);
      if (error) {
        this.showFieldError(field, error);
        valid = false;
      } else {
        this.showFieldError(field, '');
      }
    });

    if (step === steps.length) {
      const password = document.getElementById('password')?.value.trim() || '';
      const confirmPassword = document.getElementById('confirmPassword')?.value.trim() || '';
      if (password && confirmPassword && password !== confirmPassword) {
        this.showFieldError('confirmPassword', 'Les mots de passe ne correspondent pas.');
        valid = false;
      }
    }

    return valid;
  },

  /**
   * Lie l'événement de clic aux boutons de déconnexion sur la page.
   * @function bindSignOutButton
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
          confirmButtonColor: '#30d67bff',
          cancelButtonColor: 'rgba(221, 51, 51, 1)',
          confirmButtonText: 'Oui, se déconnecter',
          cancelButtonText: 'Annuler',
        });

        if (!result.isConfirmed) return;

        try {
          button.disabled = true;
          button.innerHTML = '<span class="loading-spinner"></span> Déconnexion...';

          Swal.fire({
            title: 'Au revoir !',
            html: `
              <div class="flex flex-col items-center">
                <div class="animate-pulse rounded-full h-16 w-16 border-4 border-green-500 flex items-center justify-center mb-4">
                  <i class="fas fa-check text-green-500 text-2xl"></i>
                </div>
                <p class="text-lg">Déconnexion en cours...</p>
              </div>`,
            allowOutsideClick: false,
            showConfirmButton: false,
            timer: 1000,
          });

          await api.auth.signOut();
          await Swal.fire({
            title: 'Déconnexion réussie',
            text: 'À bientôt !',
            icon: 'success',
            confirmButtonText: 'OK',
            timer: 1000,
          });

          showNotification('Déconnexion réussie.', 'success');
          window.location.href = '/pages/auth/signin.html';
        } catch (error) {
          Swal.close();
          showNotification(error.message || 'Erreur lors de la déconnexion.', 'error');
          button.disabled = false;
          button.innerHTML = '<span>Se déconnecter</span><i class="fas fa-sign-out-alt ml-2"></i>';
        }
      });
    });
  },

  /**
   * Met à jour l'état du bouton de soumission en fonction de la validité du formulaire.
   * @function updateSubmitButtonState
   * @param {HTMLFormElement} form - Le formulaire à valider.
   * @param {HTMLButtonElement} button - Le bouton de soumission à mettre à jour.
   */
  updateSubmitButtonState(form, button) {
    const inputs = form.querySelectorAll('input[required]:not([type="hidden"]), select[required]:not(.hidden)');
    let hasError = false;

    inputs.forEach(input => {
      const error = validateField(input.name, input.value.trim());
      if (error) hasError = true;
    });

    button.disabled = hasError;
    button.classList.toggle('opacity-50', hasError);
    button.classList.toggle('cursor-not-allowed', hasError);
  },

  /**
   * Valide les données du formulaire d'inscription.
   * @function validateSignUpForm
   * @param {Object} data - Les données du formulaire à valider.
   * @param {string} data.email - Email de l'utilisateur.
   * @param {string} data.password - Mot de passe de l'utilisateur.
   * @param {string} data.confirmPassword - Confirmation du mot de passe.
   * @param {string} data.name - Nom complet de l'utilisateur.
   * @param {string} data.phone - Numéro de téléphone de l'utilisateur.
   * @param {string} [data.street] - Rue de l'utilisateur (optionnel).
   * @param {string} [data.city] - Ville de l'utilisateur (optionnel).
   * @param {string} data.postalCode - Code postal de l'utilisateur.
   * @param {string} data.country - Pays de l'utilisateur.
   * @param {string} data.dialCode - Indicatif téléphonique du pays.
   * @param {string} data.fcmToken - Jeton Firebase Cloud Messaging.
   * @returns {Object} Erreurs de validation, si présentes.
   */
  validateSignUpForm(data) {
    const errors = {};
    ['email', 'password', 'name', 'phone', 'postalCode', 'country'].forEach(field => {
      const error = validateField(field, data[field]);
      if (error) errors[field] = error;
    });

    if (data.city) {
      const error = validateField('city', data.city);
      if (error) errors.city = error;
    }
    if (data.street) {
      const error = validateField('street', data.street);
      if (error) errors.street = error;
    }
    if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas.';
    }

    return errors;
  },

  /**
   * Valide les données du formulaire de connexion.
   * @function validateSignInForm
   * @param {Object} data - Les données du formulaire à valider.
   * @param {string} data.email - Email de l'utilisateur.
   * @param {string} data.password - Mot de passe de l'utilisateur.
   * @param {string} data.fcmToken - Jeton Firebase Cloud Messaging.
   * @returns {Object} Erreurs de validation, si présentes.
   */
  validateSignInForm(data) {
    const errors = {};
    ['email', 'password'].forEach(field => {
      const error = validateField(field, data[field], true);
      if (error) errors[field] = error;
    });
    return errors;
  },

  /**
   * Valide les données du formulaire de vérification d'email.
   * @function validateEmailVerificationForm
   * @param {Object} data - Les données du formulaire à valider.
   * @param {string} data.email - Email de l'utilisateur.
   * @param {string} data.name - Nom de l'utilisateur.
   * @returns {Object} Erreurs de validation, si présentes.
   */
  validateEmailVerificationForm(data) {
    const errors = {};
    ['email', 'name'].forEach(field => {
      const error = validateField(field, data[field]);
      if (error) errors[field] = error;
    });
    return errors;
  },

  /**
   * Valide les données du formulaire de réinitialisation de mot de passe.
   * @function validatePasswordResetForm
   * @param {Object} data - Les données du formulaire à valider.
   * @param {string} data.email - Email de l'utilisateur.
   * @param {string} data.name - Nom de l'utilisateur.
   * @returns {Object} Erreurs de validation, si présentes.
   */
  validatePasswordResetForm(data) {
    const errors = {};
    ['email', 'name'].forEach(field => {
      const error = validateField(field, data[field]);
      if (error) errors[field] = error;
    });
    return errors;
  },

  /**
   * Valide les données du formulaire de changement d'email.
   * @function validateChangeEmailForm
   * @param {Object} data - Les données du formulaire à valider.
   * @param {string} data.currentEmail - Email actuel de l'utilisateur.
   * @param {string} data.newEmail - Nouvel email de l'utilisateur.
   * @param {string} data.name - Nom de l'utilisateur.
   * @returns {Object} Erreurs de validation, si présentes.
   */
  validateChangeEmailForm(data) {
    const errors = {};
    ['currentEmail', 'newEmail', 'name'].forEach(field => {
      const error = validateField(field, data[field]);
      if (error) errors[field] = error;
    });
    if (data.currentEmail && data.newEmail && data.currentEmail === data.newEmail) {
      errors.newEmail = 'Le nouvel email doit être différent de l\'email actuel.';
    }
    return errors;
  },

  /**
   * Affiche un message d'erreur pour un champ de formulaire.
   * @function showFieldError
   * @param {string} field - Nom du champ.
   * @param {string|null} message - Message d'erreur à afficher, ou null pour effacer.
   */
  showFieldError(field, message) {
    const input = document.querySelector(`[name="${field}"]`);
    if (!input) return;

    const errorElement = input.parentElement.querySelector('.error-message') || input.nextElementSibling;
    if (message) {
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
      }
      input.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
      input.classList.remove('border-gray-300', 'dark:border-gray-600', 'focus:border-blue-500', 'focus:ring-blue-500/50');
    } else {
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.add('hidden');
      }
      input.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/50');
      input.classList.add('border-gray-300', 'dark:border-gray-600', 'focus:border-blue-500', 'focus:ring-blue-500/50');
    }
  },

  /**
   * Efface toutes les erreurs des champs d'un formulaire.
   * @function clearFieldErrors
   * @param {HTMLFormElement} form - Le formulaire dont les erreurs doivent être effacées.
   */
  clearFieldErrors(form) {
    form.querySelectorAll('input:not([type="hidden"]), select:not(.hidden)').forEach(input => {
      this.showFieldError(input.name, null);
    });
  },
};

export default auth;
