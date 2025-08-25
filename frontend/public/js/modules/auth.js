/**
 * @file auth.js
 * @description Manages authentication for L&L Ouest Services, including signup, signin, email verification, password reset, and email change.
 * @module auth
 */

import api from '../api.js';
import { showNotification, validateField, generateString } from './utils.js';

/**
 * Authentication module for handling user-related operations.
 * @namespace
 */
const auth = {
  /**
   * Initializes the authentication module by binding form event listeners.
   * @function init
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
 * Binds submission and real-time validation to the signup form.
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

  // Real-time validation for input fields
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

  // Step navigation: Next button
  form.querySelectorAll('.next-step').forEach(button => {
    button.addEventListener('click', () => {
      if (this.validateStep(steps, currentStep)) {
        currentStep++;
        this.showStep(steps, currentStep);
        this.updateStepButtonState(steps, currentStep);
      }
    });
  });

  // Step navigation: Previous button
  form.querySelectorAll('.prev-step').forEach(button => {
    button.addEventListener('click', () => {
      currentStep--;
      this.showStep(steps, currentStep);
      this.updateStepButtonState(steps, currentStep);
    });
  });

  // Form submission
  form.addEventListener('submit', async event => {
    event.preventDefault();
    
    // Valider toutes les étapes avant soumission
    let allStepsValid = true;
    for (let step = 1; step <= steps.length; step++) {
      if (!this.validateStep(steps, step)) {
        allStepsValid = false;
        // Afficher l'étape avec erreur
        currentStep = step;
        this.showStep(steps, currentStep);
        this.updateStepButtonState(steps, currentStep);
        break;
      }
    }
    
    if (!allStepsValid ) {
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
      fcmToken: generateString(32)
    };

    


    const errors = this.validateSignUpForm(userData);
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => this.showFieldError(field, message));
      
      // Trouver l'étape contenant le premier champ en erreur
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
        showConfirmButton: false
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
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '<span>S\'inscrire</span><i class="fas fa-check-circle ml-2"></i>';
    }
  });
},

  /**
   * Displays the current step with animation.
   * @function showStep
   * @param {NodeList} steps - The step elements in the form.
   * @param {number} step - The current step number (1-based index).
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
   * Updates the state of navigation buttons based on form validity.
   * @function updateStepButtonState
   * @param {NodeList} steps - The step elements in the form.
   * @param {number} currentStep - The current step number (1-based index).
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
      prevButton.disabled = false;
    }

    if (currentStep === 4 && submitButton) {
      const isValid = this.validateStep(steps, currentStep);
      submitButton.disabled = !isValid;
      submitButton.classList.toggle('opacity-50', !isValid);
      submitButton.classList.toggle('cursor-not-allowed', !isValid);
    }
  },

  /**
   * Validates a specific step in the signup form.
   * @function validateStep
   * @param {NodeList} steps - The step elements in the form.
   * @param {number} step - The step number to validate (1-based index).
   * @returns {boolean} Whether the step is valid.
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

    if (step === 4) {
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
   * Binds submission and validation to the signin form.
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
        fcmToken: generateString(32)
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
          showConfirmButton: false
        });

        await api.auth.signIn(credentials);
        Swal.close();
        showNotification('Connexion réussie !', 'success');
        form.reset();
        this.clearFieldErrors(form);
        window.location.href = '/dashboard.html';
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
   * Binds submission and validation to the email verification form.
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
        name: (formData.get('name') || '').trim()
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
          showConfirmButton: false
        });

        await api.auth.sendEmailVerification(emailData.email, emailData.name);
        Swal.close();
        showNotification('Email de vérification envoyé.', 'success');
        form.reset();
        this.clearFieldErrors(form);
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
   * Binds submission and validation to the password reset form.
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
        name: (formData.get('name') || '').trim()
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
          showConfirmButton: false
        });

        await api.auth.sendPasswordReset(emailData.email, emailData.name);
        Swal.close();
        showNotification('Email de réinitialisation envoyé.', 'success');
        form.reset();
        this.clearFieldErrors(form);
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
   * Binds submission and validation to the change email form.
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
        name: (formData.get('name') || '').trim()
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
          showConfirmButton: false
        });

        await api.auth.sendVerifyAndChangeEmail(emailData.currentEmail, emailData.newEmail, emailData.name);
        Swal.close();
        showNotification('Email de changement envoyé.', 'success');
        form.reset();
        this.clearFieldErrors(form);
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
     * Binds the sign-out button click event to all sign-out buttons on the page.
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
            cancelButtonText: 'Annuler'
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
              timer: 2000
            });

            await api.auth.signOut();

            await Swal.fire({
              title: 'Déconnexion réussie',
              text: 'À bientôt !',
              icon: 'success',
              confirmButtonText: 'OK',
              timer: 1500
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
   * Updates the submit button state based on form validity.
   * @function updateSubmitButtonState
   * @param {HTMLFormElement} form - The form element to validate.
   * @param {HTMLButtonElement} button - The submit button to update.
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
   * Validates the signup form data.
   * @function validateSignUpForm
   * @param {Object} data - The form data to validate.
   * @param {string} data.email - User's email.
   * @param {string} data.password - User's password.
   * @param {string} data.confirmPassword - Password confirmation.
   * @param {string} data.name - User's full name.
   * @param {string} data.phone - User's phone number.
   * @param {string} [data.street] - User's street (optional).
   * @param {string} [data.city] - User's city (optional).
   * @param {string} data.postalCode - User's postal code.
   * @param {string} data.country - User's country.
   * @param {string} data.dialCode - Country dial code.
   * @param {string} data.fcmToken - Firebase Cloud Messaging token.
   * @returns {Object} Validation errors, if any.
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
   * Validates the signin form data.
   * @function validateSignInForm
   * @param {Object} data - The form data to validate.
   * @param {string} data.email - User's email.
   * @param {string} data.password - User's password.
   * @param {string} data.fcmToken - Firebase Cloud Messaging token.
   * @returns {Object} Validation errors, if any.
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
   * Validates the email verification form data.
   * @function validateEmailVerificationForm
   * @param {Object} data - The form data to validate.
   * @param {string} data.email - User's email.
   * @param {string} data.name - User's name.
   * @returns {Object} Validation errors, if any.
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
   * Validates the password reset form data.
   * @function validatePasswordResetForm
   * @param {Object} data - The form data to validate.
   * @param {string} data.email - User's email.
   * @param {string} data.name - User's name.
   * @returns {Object} Validation errors, if any.
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
   * Validates the change email form data.
   * @function validateChangeEmailForm
   * @param {Object} data - The form data to validate.
   * @param {string} data.currentEmail - Current email address.
   * @param {string} data.newEmail - New email address.
   * @param {string} data.name - User's name.
   * @returns {Object} Validation errors, if any.
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
   * Displays an error message for a form field.
   * @function showFieldError
   * @param {string} field - The name of the field.
   * @param {string|null} message - The error message to display, or null to clear.
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
   * Clears all field errors in a form.
   * @function clearFieldErrors
   * @param {HTMLFormElement} form - The form element to clear errors from.
   */
  clearFieldErrors(form) {
    form.querySelectorAll('input:not([type="hidden"]), select:not(.hidden)').forEach(input => {
      this.showFieldError(input.name, null);
    });
  }
};

export default auth;
