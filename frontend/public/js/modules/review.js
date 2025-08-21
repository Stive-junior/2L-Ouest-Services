/**
 * @file review.js
 * @description Module de gestion des avis pour L&L Ouest Services.
 * Gère la création, consultation, mise à jour, suppression et affichage des avis.
 * @module review
 */

import api from '../api.js';
import { showNotification } from './utils.js';

const review = {
  currentPage: 1,
  limit: 10,

  /**
   * Initialize the review module
   */
  init() {
    this.bindCreateReviewForm();
    this.bindManageReviewForm();
    this.bindServiceReviewsList();
    this.bindUserReviewsList();
  },

  /**
   * Bind submit event and real-time validation to the create review form
   */
  bindCreateReviewForm() {
    const form = document.getElementById('create-review-form');
    if (form) {
      // Submit event
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const reviewData = {
          userId: formData.get('userId').trim(),
          serviceId: formData.get('serviceId').trim(),
          rating: parseInt(formData.get('rating')),
          comment: formData.get('comment').trim(),
          createdAt: new Date().toISOString(),
        };

        // Client-side validation
        const errors = this.validateCreateForm(reviewData);
        if (Object.keys(errors).length > 0) {
          Object.entries(errors).forEach(([field, message]) => {
            this.showFieldError(field, message);
          });
          return;
        }

        try {
          await api.review.createReview(reviewData);
          showNotification('Avis créé avec succès.', 'success');
          form.reset();
          this.clearFieldErrors(form);
        } catch (error) {
          showNotification(error.message || 'Erreur lors de la création de l\'avis.', 'error');
        }
      });

      // Real-time validation
      const inputs = form.querySelectorAll('input, textarea, select');
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
   * Bind events to the manage review form (get, update, delete)
   */
  bindManageReviewForm() {
    const form = document.getElementById('manage-review-form');
    if (form) {
      // Get Review
      const getButton = document.getElementById('get-review');
      if (getButton) {
        getButton.addEventListener('click', async () => {
          const reviewId = form.querySelector('#reviewId').value.trim();
          if (!reviewId) {
            this.showFieldError('reviewId', 'L\'ID de l\'avis est requis.');
            return;
          }
          try {
            const data = await api.review.getReview(reviewId);
            const detailsDiv = document.getElementById('review-details');
            detailsDiv.innerHTML = `
              <p><strong>ID:</strong> ${data.id}</p>
              <p><strong>Note:</strong> ${data.rating}/5</p>
              <p><strong>Commentaire:</strong> ${data.comment}</p>
              <p><strong>Créé le:</strong> ${new Date(data.createdAt).toLocaleDateString()}</p>
            `;
            showNotification('Avis récupéré avec succès.', 'success');
          } catch (error) {
            showNotification(error.message || 'Erreur lors de la récupération de l\'avis.', 'error');
          }
        });
      }

      // Update Review
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const reviewId = formData.get('reviewId').trim();
        const reviewData = {
          rating: formData.get('rating') ? parseInt(formData.get('rating')) : undefined,
          comment: formData.get('comment')?.trim() || undefined,
        };

        // Remove undefined fields
        Object.keys(reviewData).forEach((key) => reviewData[key] === undefined && delete reviewData[key]);

        // Client-side validation
        const errors = this.validateManageForm({ reviewId, ...reviewData });
        if (Object.keys(errors).length > 0) {
          Object.entries(errors).forEach(([field, message]) => {
            this.showFieldError(field, message);
          });
          return;
        }

        try {
          await api.review.updateReview(reviewId, reviewData);
          showNotification('Avis mis à jour avec succès.', 'success');
          document.getElementById('review-details').innerHTML = '';
          this.clearFieldErrors(form);
        } catch (error) {
          showNotification(error.message || 'Erreur lors de la mise à jour de l\'avis.', 'error');
        }
      });

      // Delete Review
      const deleteButton = document.getElementById('delete-review');
      if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
          const reviewId = form.querySelector('#reviewId').value.trim();
          if (!reviewId) {
            this.showFieldError('reviewId', 'L\'ID de l\'avis est requis.');
            return;
          }
          try {
            await api.review.deleteReview(reviewId);
            showNotification('Avis supprimé avec succès.', 'success');
            form.reset();
            document.getElementById('review-details').innerHTML = '';
            this.clearFieldErrors(form);
          } catch (error) {
            showNotification(error.message || 'Erreur lors de la suppression de l\'avis.', 'error');
          }
        });
      }

      // Real-time validation
      const inputs = form.querySelectorAll('input, textarea, select');
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
   * Bind the service reviews list
   */
  bindServiceReviewsList() {
    const listContainer = document.getElementById('service-reviews-list');
    if (listContainer) {
      const serviceId = new URLSearchParams(window.location.search).get('serviceId') || listContainer.dataset.serviceId;
      if (serviceId) {
        api.review.getServiceReviews(serviceId, this.currentPage, this.limit).then((data) => {
          listContainer.innerHTML = data.reviews.map((review) => `
            <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <p><strong>Avis #${review.id}</strong></p>
              <p>Note: ${review.rating}/5</p>
              <p>Commentaire: ${review.comment}</p>
              <p>Créé le: ${new Date(review.createdAt).toLocaleDateString()}</p>
              <button class="view-review mt-2 bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700" data-id="${review.id}">Voir détails</button>
            </div>
          `).join('');

          // Bind view review buttons
          const viewButtons = listContainer.querySelectorAll('.view-review');
          viewButtons.forEach((button) => {
            button.addEventListener('click', async () => {
              const reviewId = button.getAttribute('data-id');
              try {
                const data = await api.review.getReview(reviewId);
                const detailsDiv = document.getElementById('review-details') || listContainer;
                detailsDiv.innerHTML = `
                  <p><strong>ID:</strong> ${data.id}</p>
                  <p><strong>Note:</strong> ${data.rating}/5</p>
                  <p><strong>Commentaire:</strong> ${data.comment}</p>
                  <p><strong>Créé le:</strong> ${new Date(data.createdAt).toLocaleDateString()}</p>
                `;
                showNotification('Détails de l\'avis affichés.', 'success');
              } catch (error) {
                showNotification(error.message || 'Erreur lors de la récupération des détails.', 'error');
              }
            });
          });
        }).catch((error) => {
          showNotification(error.message || 'Erreur lors du chargement des avis.', 'error');
        });
      }
    }
  },

  /**
   * Bind the user reviews list
   */
  bindUserReviewsList() {
    const listContainer = document.getElementById('user-reviews-list');
    if (listContainer) {
      const userId = listContainer.dataset.userId || 'current';
      api.review.getUserReviews(userId, this.currentPage, this.limit).then((data) => {
        listContainer.innerHTML = data.reviews.map((review) => `
          <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p><strong>Avis #${review.id}</strong></p>
            <p>Note: ${review.rating}/5</p>
            <p>Commentaire: ${review.comment}</p>
            <p>Service ID: ${review.serviceId}</p>
            <p>Créé le: ${new Date(review.createdAt).toLocaleDateString()}</p>
            <button class="view-review mt-2 bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700" data-id="${review.id}">Voir détails</button>
          </div>
        `).join('');

        // Bind view review buttons
        const viewButtons = listContainer.querySelectorAll('.view-review');
        viewButtons.forEach((button) => {
          button.addEventListener('click', async () => {
            const reviewId = button.getAttribute('data-id');
            try {
              const data = await api.review.getReview(reviewId);
              const detailsDiv = document.getElementById('review-details') || listContainer;
              detailsDiv.innerHTML = `
                <p><strong>ID:</strong> ${data.id}</p>
                <p><strong>Note:</strong> ${data.rating}/5</p>
                <p><strong>Commentaire:</strong> ${data.comment}</p>
                <p><strong>Service ID:</strong> ${data.serviceId}</p>
                <p><strong>Créé le:</strong> ${new Date(data.createdAt).toLocaleDateString()}</p>
              `;
              showNotification('Détails de l\'avis affichés.', 'success');
            } catch (error) {
              showNotification(error.message || 'Erreur lors de la récupération des détails.', 'error');
            }
          });
        });
      }).catch((error) => {
        showNotification(error.message || 'Erreur lors du chargement des avis utilisateur.', 'error');
      });

      // Pagination
      const prevButton = document.getElementById('prev-page');
      const nextButton = document.getElementById('next-page');
      if (prevButton && nextButton) {
        prevButton.addEventListener('click', () => {
          if (this.currentPage > 1) {
            this.currentPage--;
            this.bindUserReviewsList();
          }
        });
        nextButton.addEventListener('click', () => {
          this.currentPage++;
          this.bindUserReviewsList();
        });
      }
    }
  },

  /**
   * Validate a single form field
   * @param {string} field - The field name
   * @param {string|number} value - The field value
   * @returns {string|null} - Error message or null if valid
   */
  validateField(field, value) {
    switch (field) {
      case 'userId':
        if (!value) return 'L\'ID utilisateur est requis.';
        return null;
      case 'serviceId':
        if (!value) return 'L\'ID du service est requis.';
        return null;
      case 'rating':
        if (!value || isNaN(value)) return 'La note est requise.';
        if (value < 1 || value > 5) return 'La note doit être entre 1 et 5.';
        return null;
      case 'comment':
        if (!value) return 'Le commentaire est requis.';
        if (value.length < 10) return 'Le commentaire doit contenir au moins 10 caractères.';
        return null;
      case 'reviewId':
        if (!value) return 'L\'ID de l\'avis est requis.';
        return null;
      default:
        return null;
    }
  },

  /**
   * Validate the create review form
   * @param {Object} data - Form data
   * @returns {Object} - Object with field errors
   */
  validateCreateForm(data) {
    const errors = {};
    ['userId', 'serviceId', 'rating', 'comment'].forEach((field) => {
      const error = this.validateField(field, data[field]);
      if (error) errors[field] = error;
    });
    return errors;
  },

  /**
   * Validate the manage review form
   * @param {Object} data - Form data
   * @returns {Object} - Object with field errors
   */
  validateManageForm(data) {
    const errors = {};
    ['reviewId', 'rating', 'comment'].forEach((field) => {
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
   * Clear all field errors in a form
   * @param {HTMLFormElement} form - The form element
   */
  clearFieldErrors(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      this.showFieldError(input.name, null);
    });
  },
};

export default review;
