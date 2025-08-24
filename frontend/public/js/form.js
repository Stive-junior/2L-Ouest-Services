/**
 * @file form.js
 * @description Manages the multi-step signup form, including country, city, and street selection, UI updates, and modal interactions.
 * @module form
 */

/**
 * Form data state to store user inputs.
 * @type {Object}
 * @property {string} name - User's full name.
 * @property {string} email - User's email address.
 * @property {string} country - Country code (e.g., 'FR').
 * @property {string} dialCode - Country dial code (e.g., '+33').
 * @property {string} phone - User's phone number.
 * @property {string} city - City ID (e.g., 'angers').
 * @property {string} street - Street ID (e.g., 'rue-bressigny').
 * @property {string} postalCode - Postal code.
 * @property {string} password - User's password.
 * @property {string} confirmPassword - Password confirmation.
 */
let formData = {
  name: '',
  email: '',
  country: 'FR',
  dialCode: '+33',
  phone: '',
  city: '',
  street: '',
  postalCode: '',
  password: '',
  confirmPassword: ''
};

/**
 * Cached country data.
 * @type {Array<Object>}
 */
let countriesData = [];

/**
 * Cached city data by country code.
 * @type {Object<string, Array<Object>>}
 */
let citiesData = {};

/**
 * Cached street data by city ID.
 * @type {Object<string, Array<Object>>}
 */
let streetsData = {};

/**
 * Initializes the form module by setting up event listeners and loading initial data.
 * @function init
 */
document.addEventListener('DOMContentLoaded', function() {
  // Restaurer les données du formulaire depuis le localStorage si disponibles
  const savedFormData = localStorage.getItem('signupFormData');
  if (savedFormData) {
    try {
      const parsedData = JSON.parse(savedFormData);
      formData = { ...formData, ...parsedData };
      
      // Mettre à jour les champs du formulaire avec les données sauvegardées
      Object.keys(formData).forEach(key => {
        const element = document.getElementById(key);
        if (element && formData[key]) {
          element.value = formData[key];
        }
      });
      
      // Mettre à jour les champs spéciaux (pays, ville, rue)
      if (formData.country) {
        // Charger les pays pour mettre à jour l'affichage
        fetch('/assets/json/countries.json')
          .then(response => response.json())
          .then(data => {
            countriesData = data;
            const country = countriesData.find(c => c.code === formData.country);
            if (country) {
              document.getElementById('country').value = `${country.flag} ${country.name}`;
              document.getElementById('dialCode').value = formData.dialCode;
            }
            updateSummary(); // Mettre à jour le résumé après chargement des pays
          })
          .catch(error => {
            console.error('Erreur lors du chargement des pays:', error);
            loadFallbackCountries();
            updateSummary();
          });
      }
      
      if (formData.city && formData.country) {
        loadCities(formData.country.toLowerCase());
      }
      
      if (formData.street && formData.city) {
        loadStreets(formData.city);
      }
    } catch (e) {
      console.error('Erreur lors de la restauration des données:', e);
      updateSummary();
    }
  } else {
    // Charger les pays par défaut si aucune donnée sauvegardée
    fetch('/assets/json/countries.json')
      .then(response => response.json())
      .then(data => {
        countriesData = data;
        const france = data.find(country => country.code === 'FR');
        if (france) {
          selectCountry(france.code, `${france.flag} ${france.name}`, france.dial_code);
        }
        updateSummary();
      })
      .catch(error => {
        console.error('Erreur lors du chargement des pays:', error);
        loadFallbackCountries();
        updateSummary();
      });
  }
  
  initForm();
});

/**
 * Sauvegarde les données du formulaire dans le localStorage
 * @function saveFormData
 */
function saveFormData() {
  localStorage.setItem('signupFormData', JSON.stringify(formData));
}

/**
 * Sets up form event listeners and loads initial country data.
 * @function initForm
 * @throws {Error} If country data cannot be loaded.
 */
function initForm() {
  // Bind input validation
  bindInputValidation();

  // Bind modal interactions
  bindModalInteractions();

  // Bind step navigation
  bindStepNavigation();

  // Bind password toggle functionality
  bindPasswordToggle();

  // Bind password strength checker
  bindPasswordStrengthChecker();
}

/**
 * Binds validation event listeners to form inputs.
 * @function bindInputValidation
 */
function bindInputValidation() {
  const inputs = [
    { id: 'name', validate: value => !value.trim() ? 'Le nom est requis' : null },
    { id: 'email', validate: value => !value ? 'L\'email est requis' : !isValidEmail(value) ? 'Veuillez entrer un email valide' : null },
    { id: 'phone', validate: value => !value ? 'Le numéro de téléphone est requis' : !isValidPhone(value) ? 'Veuillez entrer un numéro de téléphone valide' : null },
    { id: 'postalCode', validate: value => !value.trim() ? 'Le code postal est requis' : null },
    { id: 'password', validate: value => !value ? 'Le mot de passe est requis' : value.length < 8 ? 'Le mot de passe doit contenir au moins 8 caractères' : null },
    { id: 'confirmPassword', validate: value => validateConfirmPassword(value) }
  ];

  inputs.forEach(({ id, validate }) => {
    const input = document.getElementById(id);
    if (!input) return;
    
    // Définir la valeur initiale si elle existe dans formData
    if (formData[id]) {
      input.value = formData[id];
    }
    
    input.addEventListener('blur', () => {
      const value = input.value.trim();
      const error = validate(value);
      if (error) {
        showError(input, error);
      } else {
        clearError(input);
        formData[id] = value;
        saveFormData();
      }
      updateSummary();
    });
    
    input.addEventListener('input', () => {
      formData[id] = input.value.trim();
      updateSummary();
      saveFormData();
    });
  });
}

/**
 * Binds event listeners for modal interactions (country, city, street).
 * @function bindModalInteractions
 */
function bindModalInteractions() {
  // Country modal
  const countryInput = document.getElementById('country');
  if (countryInput) {
    countryInput.addEventListener('click', () => {
      document.getElementById('country-modal')?.classList.remove('hidden');
      document.body.classList.add('modal-active');
      populateCountryGrid(countriesData);
    });
  }

  const closeCountryModal = document.getElementById('close-country-modal');
  if (closeCountryModal) {
    closeCountryModal.addEventListener('click', () => {
      document.getElementById('country-modal')?.classList.add('hidden');
      document.body.classList.remove('modal-active');
    });
  }

  const countrySearch = document.getElementById('country-search');
  if (countrySearch) {
    countrySearch.addEventListener('input', () => {
      const searchTerm = countrySearch.value.toLowerCase();
      const filteredCountries = countriesData.filter(country =>
        country.name.toLowerCase().includes(searchTerm) || country.code.toLowerCase().includes(searchTerm)
      );
      populateCountryGrid(filteredCountries);
    });
  }

  // City modal
  const cityInput = document.getElementById('city');
  if (cityInput) {
    cityInput.addEventListener('click', () => {
      if (!formData.country) {
        showNotification('Veuillez d\'abord sélectionner un pays', 'error');
        return;
      }
      loadCities(formData.country.toLowerCase());
      document.getElementById('city-modal')?.classList.remove('hidden');
      document.body.classList.add('modal-active');
    });
  }

  const closeCityModal = document.getElementById('close-city-modal');
  if (closeCityModal) {
    closeCityModal.addEventListener('click', () => {
      document.getElementById('city-modal')?.classList.add('hidden');
      document.body.classList.remove('modal-active');
    });
  }

  const citySearch = document.getElementById('city-search');
  if (citySearch) {
    citySearch.addEventListener('input', () => {
      const searchTerm = citySearch.value.toLowerCase();
      const cityList = document.getElementById('city-list');
      const cities = citiesData[formData.country.toLowerCase()] || [];
      cityList.innerHTML = '';
      const filteredCities = cities.filter(city =>
        city.name.toLowerCase().includes(searchTerm) || city.postalCode.includes(searchTerm)
      );
      if (filteredCities.length === 0) {
        cityList.innerHTML = '<div class="p-4 text-center text-gray-500">Aucune ville trouvée</div>';
        return;
      }
      filteredCities.forEach(city => {
        const div = document.createElement('div');
        div.className = 'p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 city-item';
        if (formData.city === city.id) {
          div.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
        }
        div.dataset.id = city.id;
        div.dataset.name = city.name;
        div.dataset.postalCode = city.postalCode;
        div.innerHTML = `
          <div class="font-medium">${city.name}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">${city.postalCode}</div>
        `;
        div.addEventListener('click', () => selectCity(city.id, city.name, city.postalCode));
        cityList.appendChild(div);
      });
    });
  }

  // Street modal
  const streetInput = document.getElementById('street');
  if (streetInput) {
    streetInput.addEventListener('click', () => {
      if (!formData.city) {
        showNotification('Veuillez d\'abord sélectionner une ville', 'error');
        return;
      }
      loadStreets(formData.city);
      document.getElementById('street-modal')?.classList.remove('hidden');
      document.body.classList.add('modal-active');
    });
  }

  const closeStreetModal = document.getElementById('close-street-modal');
  if (closeStreetModal) {
    closeStreetModal.addEventListener('click', () => {
      document.getElementById('street-modal')?.classList.add('hidden');
      document.body.classList.remove('modal-active');
    });
  }

  const streetSearch = document.getElementById('street-search');
  if (streetSearch) {
    streetSearch.addEventListener('input', () => {
      const searchTerm = streetSearch.value.toLowerCase();
      const streetList = document.getElementById('street-list');
      const streets = streetsData[formData.city] || [];
      streetList.innerHTML = '';
      const filteredStreets = streets.filter(street => street.name.toLowerCase().includes(searchTerm));
      if (filteredStreets.length === 0) {
        streetList.innerHTML = '<div class="p-4 text-center text-gray-500">Aucune rue trouvée</div>';
        return;
      }
      filteredStreets.forEach(street => {
        const div = document.createElement('div');
        div.className = 'p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 street-item';
        if (formData.street === street.id) {
          div.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
        }
        div.dataset.id = street.id;
        div.dataset.name = street.name;
        div.innerHTML = `<div class="font-medium">${street.name}</div>`;
        div.addEventListener('click', () => selectStreet(street.id, street.name));
        streetList.appendChild(div);
      });
    });
  }
}

/**
 * Binds navigation event listeners for form steps.
 * @function bindStepNavigation
 */
function bindStepNavigation() {
  document.querySelectorAll('.next-step').forEach(button => {
    button.addEventListener('click', () => {
      const currentStep = button.closest('.step');
      const nextStepId = button.dataset.next;
      const nextStep = document.getElementById(`step-${nextStepId}`);
      if (validateStep(currentStep.id)) {
        updateStepIndicators(parseInt(nextStepId));
        currentStep.classList.add('hidden');
        nextStep.classList.remove('hidden');
        nextStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
        saveFormData();
      }
    });
  });

  document.querySelectorAll('.prev-step').forEach(button => {
    button.addEventListener('click', () => {
      const currentStep = button.closest('.step');
      const prevStepId = button.dataset.prev;
      const prevStep = document.getElementById(`step-${prevStepId}`);
      updateStepIndicators(parseInt(prevStepId));
      currentStep.classList.add('hidden');
      prevStep.classList.remove('hidden');
      prevStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/**
 * Binds password toggle functionality for password fields.
 * @function bindPasswordToggle
 */
function bindPasswordToggle() {
  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
      const input = button.parentElement.querySelector('input');
      const icon = button.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });
}

/**
 * Binds password strength checker to the password input.
 * @function bindPasswordStrengthChecker
 */
function bindPasswordStrengthChecker() {
  const passwordInput = document.getElementById('password');
  if (passwordInput) {
    if (formData.password) {
      passwordInput.value = formData.password;
      checkPasswordStrength(formData.password);
    }
    
    passwordInput.addEventListener('input', () => {
      checkPasswordStrength(passwordInput.value);
    });
  }
}

/**
 * Populates the country grid in the modal.
 * @function populateCountryGrid
 * @param {Array<Object>} countries - List of countries to display.
 */
function populateCountryGrid(countries) {
  const grid = document.getElementById('country-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (countries.length === 0) {
    grid.innerHTML = '<div class="col-span-full p-4 text-center text-gray-500">Aucun pays trouvé</div>';
    return;
  }
  countries.forEach(country => {
    const div = document.createElement('div');
    div.className = 'country-item';
    if (formData.country === country.code) {
      div.classList.add('selected');
    }
    div.innerHTML = `
      <span class="text-3xl mb-2">${country.flag}</span>
      <span class="text-sm font-medium text-center mb-1">${country.name}</span>
      <span class="text-xs text-gray-500 dark:text-gray-400">${country.dial_code}</span>
    `;
    div.addEventListener('click', () => selectCountry(country.code, `${country.flag} ${country.name}`, country.dial_code));
    grid.appendChild(div);
  });
}

/**
 * Selects a country and updates form data.
 * @function selectCountry
 * @param {string} code - Country code (e.g., 'FR').
 * @param {string} display - Display text (e.g., '🇫🇷 France').
 * @param {string} dialCode - Country dial code (e.g., '+33').
 */
function selectCountry(code, display, dialCode) {
  formData.country = code;
  formData.dialCode = dialCode;
  const countryInput = document.getElementById('country');
  const dialCodeInput = document.getElementById('dialCode');
  if (countryInput) countryInput.value = display;
  if (dialCodeInput) dialCodeInput.value = dialCode;
  document.getElementById('country-modal')?.classList.add('hidden');
  document.body.classList.remove('modal-active');
  formData.city = '';
  formData.street = '';
  formData.postalCode = '';
  const cityInput = document.getElementById('city');
  const streetInput = document.getElementById('street');
  const postalCodeInput = document.getElementById('postalCode');
  if (cityInput) cityInput.value = 'Sélectionnez une ville';
  if (streetInput) streetInput.value = 'Sélectionnez une rue';
  if (postalCodeInput) postalCodeInput.value = '';
  loadCities(code.toLowerCase());
  updateSummary();
  populateCountryGrid(countriesData);
  saveFormData();
}

/**
 * Loads cities for a given country.
 * @function loadCities
 * @param {string} countryCode - Country code (e.g., 'fr').
 * @throws {Error} If city data cannot be loaded.
 */
function loadCities(countryCode) {
  if (citiesData[countryCode]) {
    displayCities(citiesData[countryCode], countryCode);
    // Restaurer la ville sélectionnée si elle existe
    if (formData.city) {
      const city = citiesData[countryCode].find(c => c.id === formData.city);
      if (city) {
        document.getElementById('city').value = city.name;
        document.getElementById('postalCode').value = formData.postalCode;
      }
    }
    return;
  }
  fetch(`/assets/json/${countryCode}.json`)
    .then(response => {
      if (!response.ok) throw new Error('Erreur de chargement des villes');
      return response.json();
    })
    .then(cities => {
      citiesData[countryCode] = cities;
      displayCities(cities, countryCode);
      if (formData.city) {
        const city = cities.find(c => c.id === formData.city);
        if (city) {
          document.getElementById('city').value = city.name;
          document.getElementById('postalCode').value = formData.postalCode;
        }
      }
    })
    .catch(error => {
      console.error('Erreur lors du chargement des villes:', error);
      loadFallbackCities(countryCode);
    });
}

/**
 * Displays cities in the city modal.
 * @function displayCities
 * @param {Array<Object>} cities - List of cities to display.
 * @param {string} countryCode - Country code (e.g., 'fr').
 */
function displayCities(cities, countryCode) {
  const cityList = document.getElementById('city-list');
  if (!cityList) return;
  cityList.innerHTML = '';
  if (cities.length === 0) {
    cityList.innerHTML = '<div class="p-4 text-center text-gray-500">Aucune ville disponible pour ce pays</div>';
    return;
  }
  cities.forEach(city => {
    const div = document.createElement('div');
    div.className = 'p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 city-item';
    if (formData.city === city.id) {
      div.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
    }
    div.dataset.id = city.id;
    div.dataset.name = city.name;
    div.dataset.postalCode = city.postalCode;
    div.innerHTML = `
      <div class="font-medium">${city.name}</div>
      <div class="text-sm text-gray-500 dark:text-gray-400">${city.postalCode}</div>
    `;
    div.addEventListener('click', () => selectCity(city.id, city.name, city.postalCode));
    cityList.appendChild(div);
  });
}

/**
 * Selects a city and updates form data.
 * @function selectCity
 * @param {string} id - City ID (e.g., 'angers').
 * @param {string} name - City name (e.g., 'Angers').
 * @param {string} postalCode - City postal code (e.g., '49000').
 */
function selectCity(id, name, postalCode) {
  formData.city = id;
  formData.postalCode = postalCode;
  const cityInput = document.getElementById('city');
  const postalCodeInput = document.getElementById('postalCode');
  if (cityInput) cityInput.value = name;
  if (postalCodeInput) postalCodeInput.value = postalCode;
  document.getElementById('city-modal')?.classList.add('hidden');
  document.body.classList.remove('modal-active');
  formData.street = '';
  const streetInput = document.getElementById('street');
  if (streetInput) streetInput.value = 'Sélectionnez une rue';
  loadStreets(id);
  updateSummary();
  saveFormData();
}

/**
 * Loads streets for a given city.
 * @function loadStreets
 * @param {string} cityId - City ID (e.g., 'angers').
 * @throws {Error} If street data cannot be loaded.
 */
function loadStreets(cityId) {
  if (streetsData[cityId]) {
    displayStreets(streetsData[cityId]);
    if (formData.street) {
      const street = streetsData[cityId].find(s => s.id === formData.street);
      if (street) {
        document.getElementById('street').value = street.name;
      }
    }
    return;
  }
  fetch(`/assets/json/${cityId}.json`)
    .then(response => {
      if (!response.ok) throw new Error('Erreur de chargement des rues');
      return response.json();
    })
    .then(streets => {
      streetsData[cityId] = streets;
      displayStreets(streets);
      if (formData.street) {
        const street = streets.find(s => s.id === formData.street);
        if (street) {
          document.getElementById('street').value = street.name;
        }
      }
    })
    .catch(error => {
      console.error('Erreur lors du chargement des rues:', error);
      loadFallbackStreets(cityId);
    });
}

/**
 * Displays streets in the street modal.
 * @function displayStreets
 * @param {Array<Object>} streets - List of streets to display.
 */
function displayStreets(streets) {
  const streetList = document.getElementById('street-list');
  if (!streetList) return;
  streetList.innerHTML = '';
  if (streets.length === 0) {
    streetList.innerHTML = '<div class="p-4 text-center text-gray-500">Aucune rue disponible pour cette ville</div>';
    return;
  }
  streets.forEach(street => {
    const div = document.createElement('div');
    div.className = 'p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 street-item';
    if (formData.street === street.id) {
      div.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
    }
    div.dataset.id = street.id;
    div.dataset.name = street.name;
    div.innerHTML = `<div class="font-medium">${street.name}</div>`;
    div.addEventListener('click', () => selectStreet(street.id, street.name));
    streetList.appendChild(div);
  });
}

/**
 * Selects a street and updates form data.
 * @function selectStreet
 * @param {string} id - Street ID (e.g., 'rue-bressigny').
 * @param {string} name - Street name (e.g., 'Rue Bressigny').
 */
function selectStreet(id, name) {
  formData.street = id;
  const streetInput = document.getElementById('street');
  if (streetInput) streetInput.value = name;
  document.getElementById('street-modal')?.classList.add('hidden');
  document.body.classList.remove('modal-active');
  updateSummary();
  saveFormData();
}

/**
 * Updates step indicators based on the active step.
 * @function updateStepIndicators
 * @param {number} activeStep - The active step number (1-based index).
 */
function updateStepIndicators(activeStep) {
  document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
    if (index < activeStep - 1) {
      indicator.classList.add('completed');
      indicator.classList.remove('active');
    } else if (index === activeStep - 1) {
      indicator.classList.add('active');
      indicator.classList.remove('completed');
    } else {
      indicator.classList.remove('active', 'completed');
    }
  });
}

/**
 * Validates a form step.
 * @function validateStep
 * @param {string} stepId - The ID of the step (e.g., 'step-1').
 * @returns {boolean} Whether the step is valid.
 */
function validateStep(stepId) {
  let isValid = true;
  if (stepId === 'step-1') {
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    if (!name?.value.trim()) {
      showError(name, 'Le nom est requis');
      isValid = false;
    } else {
      clearError(name);
      formData.name = name.value.trim();
    }
    const emailValue = email?.value.trim();
    if (!emailValue) {
      showError(email, 'L\'email est requis');
      isValid = false;
    } else if (!isValidEmail(emailValue)) {
      showError(email, 'Veuillez entrer un email valide');
      isValid = false;
    } else {
      clearError(email);
      formData.email = emailValue;
    }
  } else if (stepId === 'step-2') {
    if (!formData.country) {
      showNotification('Veuillez sélectionner un pays', 'error');
      isValid = false;
    }
    const phone = document.getElementById('phone');
    const phoneValue = phone?.value.trim();
    if (!phoneValue) {
      showError(phone, 'Le numéro de téléphone est requis');
      isValid = false;
    } else if (!isValidPhone(phoneValue)) {
      showError(phone, 'Veuillez entrer un numéro de téléphone valide');
      isValid = false;
    } else {
      clearError(phone);
      formData.phone = phoneValue;
    }
  } else if (stepId === 'step-3') {
    if (!formData.city) {
      showNotification('Veuillez sélectionner une ville', 'error');
      isValid = false;
    }
    if (!formData.street) {
      showNotification('Veuillez sélectionner une rue', 'error');
      isValid = false;
    }
    const postalCode = document.getElementById('postalCode');
    if (!postalCode?.value.trim()) {
      showError(postalCode, 'Le code postal est requis');
      isValid = false;
    } else {
      clearError(postalCode);
      formData.postalCode = postalCode.value.trim();
    }
  } else if (stepId === 'step-4') {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    if (!password?.value) {
      showError(password, 'Le mot de passe est requis');
      isValid = false;
    } else if (password.value.length < 8) {
      showError(password, 'Le mot de passe doit contenir au moins 8 caractères');
      isValid = false;
    } else {
      clearError(password);
      formData.password = password.value;
    }
    if (!confirmPassword?.value) {
      showError(confirmPassword, 'Veuillez confirmer votre mot de passe');
      isValid = false;
    } else if (confirmPassword.value !== password?.value) {
      showError(confirmPassword, 'Les mots de passe ne correspondent pas');
      isValid = false;
    } else {
      clearError(confirmPassword);
      formData.confirmPassword = confirmPassword.value;
    }
  }
  
  if (isValid) {
    saveFormData();
  }
  
  return isValid;
}

/**
 * Validates the confirm password field.
 * @function validateConfirmPassword
 * @param {string} value - The confirm password value.
 * @returns {string|null} Error message if invalid, null otherwise.
 */
function validateConfirmPassword(value) {
  const password = document.getElementById('password')?.value;
  if (!value) return 'Veuillez confirmer votre mot de passe';
  if (value !== password) return 'Les mots de passe ne correspondent pas';
  return null;
}

/**
 * Displays an error message for a field.
 * @function showError
 * @param {HTMLInputElement} field - The input field.
 * @param {string} message - The error message.
 */
function showError(field, message) {
  if (!field) return;
  const errorElement = field.parentElement.nextElementSibling;
  if (errorElement && errorElement.classList.contains('error-message')) {
    errorElement.textContent = message;
  }
  field.classList.add('border-red-500');
}

/**
 * Clears an error message for a field.
 * @function clearError
 * @param {HTMLInputElement} field - The input field.
 */
function clearError(field) {
  if (!field) return;
  const errorElement = field.parentElement.nextElementSibling;
  if (errorElement && errorElement.classList.contains('error-message')) {
    errorElement.textContent = '';
  }
  field.classList.remove('border-red-500');
}

/**
 * Validates an email address.
 * @function isValidEmail
 * @param {string} email - The email to validate.
 * @returns {boolean} Whether the email is valid.
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validates a phone number.
 * @function isValidPhone
 * @param {string} phone - The phone number to validate.
 * @returns {boolean} Whether the phone number is valid.
 */
function isValidPhone(phone) {
  const re = /^[0-9+\s()-]{10,}$/;
  return re.test(phone);
}

/**
 * Checks password strength and updates UI.
 * @function checkPasswordStrength
 * @param {string} password - The password to check.
 */
function checkPasswordStrength(password) {
  const strengthElement = document.getElementById('password-strength');
  if (!strengthElement) return;
  let strength = 0;
  let message = '';
  let color = '';
  if (password.length === 0) {
    strengthElement.textContent = '';
    return;
  }
  if (password.length > 7) strength++;
  if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) strength++;
  if (password.match(/([0-9])/)) strength++;
  if (password.match(/([!,@,#,$,%,^,&,*,?,_,~])/)) strength++;
  switch (strength) {
    case 0:
    case 1:
      message = 'Faible';
      color = 'text-red-500';
      break;
    case 2:
      message = 'Moyen';
      color = 'text-yellow-500';
      break;
    case 3:
      message = 'Fort';
      color = 'text-green-500';
      break;
    case 4:
      message = 'Très fort';
      color = 'text-green-600 font-bold';
      break;
  }
  strengthElement.innerHTML = `Force du mot de passe: <span class="${color}">${message}</span>`;
}

/**
 * Updates the summary section with form data.
 * @function updateSummary
 */
function updateSummary() {
  const summaryName = document.getElementById('summary-name');
  const summaryEmail = document.getElementById('summary-email');
  const summaryPhone = document.getElementById('summary-phone');
  const summaryCountry = document.getElementById('summary-country');
  const summaryAddress = document.getElementById('summary-address');
  
  if (summaryName) summaryName.textContent = formData.name || 'Non renseigné';
  if (summaryEmail) summaryEmail.textContent = formData.email || 'Non renseigné';
  
  if (summaryPhone) {
    summaryPhone.textContent = formData.phone ? 
      `${formData.dialCode} ${formData.phone}` : 'Non renseigné';
  }
  
  if (summaryCountry) {
    const selectedCountry = countriesData.find(country => country.code === formData.country);
    summaryCountry.textContent = selectedCountry ? 
      `${selectedCountry.flag} ${selectedCountry.name}` : 'Non renseigné';
  }
  
  if (summaryAddress) {
    const cityElement = document.getElementById('city');
    const streetElement = document.getElementById('street');
    const postalCodeElement = document.getElementById('postalCode');
    
    let addressText = 'Non renseigné';
    if (formData.city && formData.street && formData.postalCode) {
      addressText = `${streetElement?.value || ''}, ${postalCodeElement?.value || ''} ${cityElement?.value || ''}`;
    } else if (formData.city && formData.postalCode) {
      addressText = `${postalCodeElement?.value || ''} ${cityElement?.value || ''}`;
    }
    summaryAddress.textContent = addressText;
  }
}

/**
 * Displays a notification to the user.
 * @function showNotification
 * @param {string} message - The message to display.
 * @param {string} [type='info'] - The type of notification ('info', 'success', 'error').
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform transition-transform duration-300 ${
    type === 'error' ? 'bg-red-500 text-white' :
    type === 'success' ? 'bg-green-500 text-white' :
    'bg-blue-500 text-white'
  }`;
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas ${
        type === 'error' ? 'fa-exclamation-circle' :
        type === 'success' ? 'fa-check-circle' :
        'fa-info-circle'
      } mr-2"></i>
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.classList.add('translate-x-0');
  }, 10);
  setTimeout(() => {
    notification.classList.remove('translate-x-0');
    notification.classList.add('translate-x-full');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
}

/**
 * Resets the form to its initial state.
 * @function resetForm
 */
function resetForm() {
  formData = {
    name: '',
    email: '',
    country: 'FR',
    dialCode: '+33',
    phone: '',
    city: '',
    street: '',
    postalCode: '',
    password: '',
    confirmPassword: ''
  };
  const inputs = ['name', 'email', 'phone', 'postalCode', 'password', 'confirmPassword'];
  inputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) input.value = '';
  });
  const france = countriesData.find(country => country.code === 'FR');
  if (france) {
    selectCountry(france.code, `${france.flag} ${france.name}`, france.dial_code);
  }
  const cityInput = document.getElementById('city');
  const streetInput = document.getElementById('street');
  if (cityInput) cityInput.value = 'Sélectionnez une ville';
  if (streetInput) streetInput.value = 'Sélectionnez une rue';
  document.querySelectorAll('.step').forEach(step => step.classList.add('hidden'));
  document.getElementById('step-1')?.classList.remove('hidden');
  updateStepIndicators(1);
  updateSummary();
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  document.querySelectorAll('input').forEach(input => input.classList.remove('border-red-500'));
  saveFormData();
}

/**
 * Loads fallback country data if JSON loading fails.
 * @function loadFallbackCountries
 */
function loadFallbackCountries() {
  const fallbackCountries = [
    { name: 'France', flag: '🇫🇷', code: 'FR', dial_code: '+33' },
    { name: 'Belgique', flag: '🇧🇪', code: 'BE', dial_code: '+32' },
    { name: 'Suisse', flag: '🇨🇭', code: 'CH', dial_code: '+41' }
  ];
  countriesData = fallbackCountries;
  populateCountryGrid(fallbackCountries);
  const france = fallbackCountries.find(country => country.code === 'FR');
  if (france) {
    selectCountry(france.code, `${france.flag} ${france.name}`, france.dial_code);
  }
}

/**
 * Loads fallback city data for a country.
 * @function loadFallbackCities
 * @param {string} countryCode - Country code (e.g., 'fr').
 */
function loadFallbackCities(countryCode) {
  const fallbackCities = {
    fr: [
      { id: 'angers', name: 'Angers', postalCode: '49000' },
      { id: 'nantes', name: 'Nantes', postalCode: '44000' },
      { id: 'rennes', name: 'Rennes', postalCode: '35000' }
    ],
    be: [
      { id: 'bruxelles', name: 'Bruxelles', postalCode: '1000' },
      { id: 'liege', name: 'Liège', postalCode: '4000' }
    ],
    ch: [
      { id: 'geneve', name: 'Genève', postalCode: '1200' },
      { id: 'zurich', name: 'Zurich', postalCode: '8000' }
    ]
  };
  const cities = fallbackCities[countryCode] || [];
  citiesData[countryCode] = cities;
  displayCities(cities, countryCode);
}

/**
 * Loads fallback street data for a city.
 * @function loadFallbackStreets
 * @param {string} cityId - City ID (e.g., 'angers').
 */
function loadFallbackStreets(cityId) {
  const fallbackStreets = {
    angers: [
      { id: 'rue-bressigny', name: 'Rue Bressigny' },
      { id: 'bd-ayrault', name: 'Boulevard Ayrault' }
    ],
    nantes: [
      { id: 'rue-crete', name: 'Rue de la Crée' },
      { id: 'bd-graslin', name: 'Boulevard Graslin' }
    ],
    rennes: [
      { id: 'rue-de-paris', name: 'Rue de Paris' },
      { id: 'rue-de-brest', name: 'Rue de Brest' }
    ]
  };
  const streets = fallbackStreets[cityId] || [];
  streetsData[cityId] = streets;
  displayStreets(streets);
}
