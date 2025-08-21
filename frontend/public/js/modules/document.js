/**
 * @file document.js
 * @description Module de gestion des documents pour L&L Ouest Services.
 * Gère la génération, consultation, mise à jour, suppression et affichage des factures.
 * @module document
 */

import api from '../api.js';
import { showNotification } from './utils.js';

const document = {
  currentPage: 1,
  limit: 10,

  /**
   * Initialize the document module
   */
  init() {
    this.bindGenerateInvoiceForm();
    this.bindManageInvoiceForm();
    this.bindInvoicesList();
    this.bindPagination();
  },

  /**
   * Bind submit event to the generate invoice form
   */
  bindGenerateInvoiceForm() {
    const form = document.getElementById('generate-invoice-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const invoiceData = {
          userId: formData.get('userId').trim(),
          amount: parseFloat(formData.get('amount')),
          items: formData.get('items') ? JSON.parse(formData.get('items')) : [],
          dueDate: formData.get('dueDate'),
          createdAt: new Date().toISOString(),
        };

        // Client-side validation
        const errors = this.validateGenerateForm(invoiceData);
        if (Object.keys(errors).length > 0) {
          Object.entries(errors).forEach(([field, message]) => {
            this.showFieldError(field, message);
          });
          return;
        }

        try {
          await api.document.generateInvoice(invoiceData);
          showNotification('Facture générée avec succès.', 'success');
          form.reset();
          this.clearFieldErrors(form);
          this.bindInvoicesList(); // Refresh the list
        } catch (error) {
          showNotification(error.message || 'Erreur lors de la génération de la facture.', 'error');
        }
      });

      // Real-time validation
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
   * Bind events to the manage invoice form (get, update, delete)
   */
  bindManageInvoiceForm() {
    const form = document.getElementById('manage-invoice-form');
    if (form) {
      // Get Invoice
      document.getElementById('get-invoice').addEventListener('click', async () => {
        const invoiceId = form.querySelector('#invoiceId').value.trim();
        if (!invoiceId) {
          this.showFieldError('invoiceId', 'L\'ID de la facture est requis.');
          return;
        }
        try {
          const data = await api.document.getInvoice(invoiceId);
          const detailsDiv = document.getElementById('invoice-details');
          detailsDiv.innerHTML = `
            <p><strong>ID:</strong> ${data.id}</p>
            <p><strong>Montant:</strong> ${data.amount}€</p>
            <p><strong>Date d'échéance:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
            <p><strong>Articles:</strong> ${JSON.stringify(data.items)}</p>
            <p><strong>Créée le:</strong> ${new Date(data.createdAt).toLocaleDateString()}</p>
          `;
          showNotification('Facture récupérée avec succès.', 'success');
        } catch (error) {
          showNotification(error.message || 'Erreur lors de la récupération de la facture.', 'error');
        }
      });

      // Update Invoice
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const invoiceId = formData.get('invoiceId').trim();
        const invoiceData = {
          amount: formData.get('updateAmount') ? parseFloat(formData.get('updateAmount')) : undefined,
          dueDate: formData.get('updateDueDate') || undefined,
        };

        // Remove undefined fields
        Object.keys(invoiceData).forEach((key) => invoiceData[key] === undefined && delete invoiceData[key]);

        // Client-side validation
        const errors = this.validateManageForm({ invoiceId, ...invoiceData });
        if (Object.keys(errors).length > 0) {
          Object.entries(errors).forEach(([field, message]) => {
            this.showFieldError(field, message);
          });
          return;
        }

        try {
          await api.document.updateInvoice(invoiceId, invoiceData);
          showNotification('Facture mise à jour avec succès.', 'success');
          document.getElementById('invoice-details').innerHTML = '';
          this.bindInvoicesList(); // Refresh the list
        } catch (error) {
          showNotification(error.message || 'Erreur lors de la mise à jour de la facture.', 'error');
        }
      });

      // Delete Invoice
      document.getElementById('delete-invoice').addEventListener('click', async () => {
        const invoiceId = form.querySelector('#invoiceId').value.trim();
        if (!invoiceId) {
          this.showFieldError('invoiceId', 'L\'ID de la facture est requis.');
          return;
        }
        try {
          await api.document.deleteInvoice(invoiceId);
          showNotification('Facture supprimée avec succès.', 'success');
          form.reset();
          document.getElementById('invoice-details').innerHTML = '';
          this.bindInvoicesList(); // Refresh the list
        } catch (error) {
          showNotification(error.message || 'Erreur lors de la suppression de la facture.', 'error');
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
   * Bind the invoices list
   */
  bindInvoicesList() {
    const listContainer = document.getElementById('invoices-list');
    if (listContainer) {
      api.document.getUserInvoices(this.currentPage, this.limit).then((data) => {
        listContainer.innerHTML = data.invoices.map((invoice) => `
          <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p><strong>Facture #${invoice.id}</strong></p>
            <p>Montant: ${invoice.amount}€</p>
            <p>Date d'échéance: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p>Créée le: ${new Date(invoice.createdAt).toLocaleDateString()}</p>
            <button class="view-invoice mt-2 bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700" data-id="${invoice.id}">Voir détails</button>
          </div>
        `).join('');

        // Bind view invoice buttons
        const viewButtons = listContainer.querySelectorAll('.view-invoice');
        viewButtons.forEach((button) => {
          button.addEventListener('click', async () => {
            const invoiceId = button.getAttribute('data-id');
            try {
              const data = await api.document.getInvoice(invoiceId);
              const detailsDiv = document.getElementById('invoice-details');
              detailsDiv.innerHTML = `
                <p><strong>ID:</strong> ${data.id}</p>
                <p><strong>Montant:</strong> ${data.amount}€</p>
                <p><strong>Date d'échéance:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
                <p><strong>Articles:</strong> ${JSON.stringify(data.items)}</p>
                <p><strong>Créée le:</strong> ${new Date(data.createdAt).toLocaleDateString()}</p>
              `;
              showNotification('Détails de la facture affichés.', 'success');
            } catch (error) {
              showNotification(error.message || 'Erreur lors de la récupération des détails.', 'error');
            }
          });
        });
      }).catch((error) => {
        showNotification(error.message || 'Erreur lors du chargement des factures.', 'error');
      });
    }
  },

  /**
   * Bind pagination buttons
   */
  bindPagination() {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    if (prevButton && nextButton) {
      prevButton.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.bindInvoicesList();
        }
      });
      nextButton.addEventListener('click', () => {
        this.currentPage++;
        this.bindInvoicesList();
      });
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
      case 'amount':
        if (!value || value <= 0) return 'Le montant doit être supérieur à 0.';
        return null;
      case 'items':
        if (value) {
          try {
            JSON.parse(value);
          } catch {
            return 'Les articles doivent être au format JSON valide.';
          }
        }
        return null;
      case 'dueDate':
        if (!value) return 'La date d\'échéance est requise.';
        return null;
      case 'invoiceId':
        if (!value) return 'L\'ID de la facture est requis.';
        return null;
      case 'updateAmount':
        if (value && value <= 0) return 'Le montant doit être supérieur à 0.';
        return null;
      default:
        return null;
    }
  },

  /**
   * Validate the generate invoice form
   * @param {Object} data - Form data
   * @returns {Object} - Object with field errors
   */
  validateGenerateForm(data) {
    const errors = {};
    ['userId', 'amount', 'items', 'dueDate'].forEach((field) => {
      const error = this.validateField(field, data[field]);
      if (error) errors[field] = error;
    });
    return errors;
  },

  /**
   * Validate the manage invoice form
   * @param {Object} data - Form data
   * @returns {Object} - Object with field errors
   */
  validateManageForm(data) {
    const errors = {};
    ['invoiceId', 'updateAmount', 'updateDueDate'].forEach((field) => {
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
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach((input) => {
      this.showFieldError(input.name, null);
    });
  },
};

export default document;
