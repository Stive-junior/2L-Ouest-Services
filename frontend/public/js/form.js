/**
 * @file form.js
 * @description Gère le formulaire d'inscription multi-étapes, incluant la sélection de pays, ville, rue, profil et les mises à jour de l'interface utilisateur. La validation et la soumission sont déléguées à auth.js.
 * @module form
 */

import { showNotification } from './modules/utils.js';

/**
 * État des données du formulaire pour stocker les entrées utilisateur.
 * @type {Object}
 */
let formData = {
    name: '',
    email: '',
    country: 'FR',
    dialCode: '+33',
    phone: '',
    city: 'angers',
    street: 'rue-bressigny',
    postalCode: '49000',
    password: '',
    confirmPassword: '',
    profileImage: '<svg width="256px" height="256px" viewBox="0 0 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg"><g stroke="none" stroke-width="1" stroke-dasharray="none" stroke-opacity="1" fill="none" fill-opacity="1"><rect x="0" y="0" width="256" height="256" fill="#ffffff"></rect><circle cx="128" cy="104" r="40" fill="#dde0f2"></circle><path d="M104,144C104,138.666667 108.666667,134 114,134H142C147.333333,134 152,138.666667 152,144V156H104L104,144Z" fill="#dde0f2"></path><path d="M152,176C152,176.000001 152,176 152,176H152V176Z" fill="#dde0f2"></path></g></svg>'
};

/**
 * Données des pays, villes, rues et icônes SVG en cache.
 */
let countriesData = [];
let citiesData = {};
let streetsData = {};
let svgIconsData = [];

/**
 * Initialise le module de formulaire.
 */
document.addEventListener('DOMContentLoaded', function() {
    const savedFormData = localStorage.getItem('signupFormData');
    if (savedFormData) {
        try {
            const parsedData = JSON.parse(savedFormData);
            formData = { ...formData, ...parsedData };
            Object.keys(formData).forEach(key => {
                const element = document.getElementById(key);
                if (element && formData[key]) {
                    element.value = formData[key];
                }
            });
            if (formData.profileImage) {
                const preview = document.getElementById('profile-preview');
                if(preview){
                preview.src = `data:image/svg+xml;utf8,${encodeURIComponent(formData.profileImage)}`;
                }
            }
            if (formData.country) {
                fetch('/assets/json/countries.json')
                    .then(response => response.json())
                    .then(data => {
                        countriesData = data;
                        const country = countriesData.find(c => c.code === formData.country);
                        if (country) {

                            const countr = document.getElementById('country');
                            const dialCode = document.getElementById('dialCode');
                            if(countr && dialCode){
                            country.value = `${country.flag} ${country.name}`;
                            dialCode.value = formData.dialCode;

                            }
                            loadCities(formData.country.toLowerCase());
                        }
                        updateSummary();
                    })
                    .catch(error => {
                        console.error('Erreur lors du chargement des pays:', error);
                        loadFallbackCountries();
                        updateSummary();
                    });
            }
        } catch (e) {
            console.error('Erreur lors de la restauration des données:', e);
            updateSummary();
        }
    } else {
        fetch('/assets/json/countries.json')
            .then(response => response.json())
            .then(data => {
                countriesData = data;
                const france = data.find(country => country.code === 'FR');
                if (france) {
                    selectCountry(france.code, `${france.flag} ${france.name}`, france.dial_code);
                    loadCities('fr');
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
 * Sauvegarde les données du formulaire dans le localStorage.
 */
function saveFormData() {
    localStorage.setItem('signupFormData', JSON.stringify(formData));
}

/**
 * Charge les données de secours pour les pays en cas d'échec.
 */
function loadFallbackCountries() {
    countriesData = [
        { code: 'FR', name: 'France', flag: '🇫🇷', dial_code: '+33' }
    ];
    const countryInput = document.getElementById('country');
    const dialCodeInput = document.getElementById('dialCode');
    if (countryInput) countryInput.value = '🇫🇷 France';
    if (dialCodeInput) dialCodeInput.value = '+33';
    formData.country = 'FR';
    formData.dialCode = '+33';
    loadCities('fr');
}

/**
 * Charge les données de secours pour les villes en cas d'échec.
 */
function loadFallbackCities(countryCode) {
    if (countryCode === 'fr') {
        citiesData[countryCode] = [
            { id: 'angers', name: 'Angers', postalCode: '49000' }
        ];
        const cityInput = document.getElementById('city');
        const postalCodeInput = document.getElementById('postalCode');
        if (cityInput) cityInput.value = 'Angers';
        if (postalCodeInput) postalCodeInput.value = '49000';
        formData.city = 'angers';
        formData.postalCode = '49000';
        loadStreets('angers');
        displayCities(citiesData[countryCode], countryCode);
    }
}

/**
 * Charge les données de secours pour les rues en cas d'échec.
 */
function loadFallbackStreets(cityId) {
    if (cityId === 'angers') {
        streetsData[cityId] = [
            { id: 'rue-bressigny', name: 'Rue Bressigny' }
        ];
        const streetInput = document.getElementById('street');
        if (streetInput) streetInput.value = 'Rue Bressigny';
        formData.street = 'rue-bressigny';
        displayStreets(streetsData[cityId]);
    }
}

/**
 * Charge les icônes SVG depuis un fichier JSON.
 */
function loadSvgIcons() {
    fetch('/assets/json/profile.json')
        .then(response => response.json())
        .then(data => {
            svgIconsData = data;
            document.getElementById('svg-count').textContent = svgIconsData.length;
            populateSvgIconsGrid(svgIconsData);
        })
        .catch(error => {
            console.error('Erreur lors du chargement des icônes SVG:', error);
            svgIconsData = [
                {
                    id: 'default',
                    svg: '<svg width="256px" height="256px" viewBox="0 0 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg"><g stroke="none" stroke-width="1" stroke-dasharray="none" stroke-opacity="1" fill="none" fill-opacity="1"><rect x="0" y="0" width="256" height="256" fill="#ffffff"></rect><circle cx="128" cy="104" r="40" fill="#dde0f2"></circle><path d="M104,144C104,138.666667 108.666667,134 114,134H142C147.333333,134 152,138.666667 152,144V156H104L104,144Z" fill="#dde0f2"></path><path d="M152,176C152,176.000001 152,176 152,176H152V176Z" fill="#dde0f2"></path></g></svg>'
                }
            ];
            populateSvgIconsGrid(svgIconsData);
        });
}

/**
 * Configure les écouteurs d'événements du formulaire.
 */
function initForm() {
    bindInputEvents();
    bindModalInteractions();
    bindStepNavigation();
    bindProfileEdit();
    bindPasswordToggle();
}

/**
 * Ajouter la fonctionnalité de recherche et aléatoire pour les icônes SVG.
 */
document.addEventListener('DOMContentLoaded', function() {
    const svgSearch = document.getElementById('svg-search');
    if (svgSearch) {
        let searchTimeout;
        svgSearch.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {

                if (svgIconsData) {
                    const searchTerm = svgSearch.value.toLowerCase();
                    const filteredIcons = svgIconsData.filter(icon => 
                        icon.id.toLowerCase().includes(searchTerm)
                    );
                    populateSvgIconsGrid(filteredIcons);
                }
            }, 300);
        });
    }

    const randomSvgBtn = document.getElementById('random-svg');
    if (randomSvgBtn && svgIconsData) {
        randomSvgBtn.addEventListener('click', function() {
            const randomIndex = Math.floor(Math.random() * svgIconsData.length);
            const randomIcon = svgIconsData[randomIndex];
            formData.profileImage = `data:image/svg+xml;utf8,${encodeURIComponent(randomIcon.svg)}`;
            saveFormData();
            updateSummary();
            const profilePreview = document.getElementById('profile-preview');
            if (profilePreview) {
                profilePreview.src = `data:image/svg+xml;utf8,${encodeURIComponent(randomIcon.svg)}`;
                profilePreview.classList.add('animate-pulse');
                setTimeout(() => profilePreview.classList.remove('animate-pulse'), 1000);
            }
            const svgModal = document.getElementById('svg-modal');
            const profileModal = document.getElementById('profile-modal');
            if (svgModal) svgModal.classList.add('hidden');
            if (profileModal) profileModal.classList.add('hidden');
            document.body.classList.remove('modal-active');
        });
    }

    const cancelProfileModal = document.getElementById('cancel-profile-modal');
    if (cancelProfileModal) {
        cancelProfileModal.addEventListener('click', function() {
            const profileModal = document.getElementById('profile-modal');
            if (profileModal) profileModal.classList.add('hidden');
            document.body.classList.remove('modal-active');
        });
    }

    const cancelSvgModal = document.getElementById('cancel-svg-modal');
    if (cancelSvgModal) {
        cancelSvgModal.addEventListener('click', function() {
            const svgModal = document.getElementById('svg-modal');
            if (svgModal) svgModal.classList.add('hidden');
            document.body.classList.remove('modal-active');
        });
    }
});

/**
 * Lie les écouteurs d'événements pour les champs de saisie.
 */
function bindInputEvents() {
    const inputs = [
        'name',
        'email',
        'phone',
        'postalCode',
        'password',
        'confirmPassword'
    ];

    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;

        if (formData[id]) {
            input.value = formData[id];
        }

        input.addEventListener('input', () => {
            formData[id] = input.value.trim();
            updateSummary();
            saveFormData();
        });
    });
}


/**
 * Lie les écouteurs d'événements pour la modification du profil.
 */
function bindProfileEdit() {
    const profileEditBtn = document.getElementById('profile-edit-btn');
    const profileModal = document.getElementById('profile-modal');
    const closeProfileModal = document.getElementById('close-profile-modal');
    const svgOptionCard = document.getElementById('svg-option-card');
    const imageOptionCard = document.getElementById('image-option-card');
    const svgModal = document.getElementById('svg-modal');
    const closeSvgModal = document.getElementById('close-svg-modal');
    const profileUpload = document.getElementById('profile-upload');
    const profilePreview = document.getElementById('profile-preview');

    const imageIconSvg = document.getElementById('image-icon-svg');
    const lottieContainer = document.getElementById('lottie-loader-container');
    let lottieAnimation = null;
    
    if (lottieContainer) {
        lottieAnimation = lottie.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            path: '/assets/json/animation.json' // Chemin vers le fichier JSON de l'animation
        });
    }

    const setLoadingState = (isLoading) => {
        if (isLoading) {
            imageOptionCard.style.pointerEvents = 'none';
            imageOptionCard.classList.add('opacity-70');
            
            if (lottieAnimation) {
                imageIconSvg.classList.add('hidden');
                lottieContainer.classList.remove('hidden');
                lottieAnimation.play();
            }
        } else {
            imageOptionCard.style.pointerEvents = 'auto';
            imageOptionCard.classList.remove('opacity-70');
            
            if (lottieAnimation) {
                lottieAnimation.stop();
                lottieContainer.classList.add('hidden');
                imageIconSvg.classList.remove('hidden');
            }
        }
    };
    
    if (profileEditBtn && profileModal) {
        profileEditBtn.addEventListener('click', () => {
            profileModal.classList.remove('hidden');
            document.body.classList.add('modal-active');
        });
    }

    if (closeProfileModal && profileModal) {
        closeProfileModal.addEventListener('click', () => {
            profileModal.classList.add('hidden');
            document.body.classList.remove('modal-active');
        });
    }

    if (svgOptionCard && profileModal && svgModal) {
        svgOptionCard.addEventListener('click', () => {
            profileModal.classList.add('hidden');
            svgModal.classList.remove('hidden');
            document.body.classList.add('modal-active');
            loadSvgIcons();
        });
    }

    if (imageOptionCard && profileUpload) {
        imageOptionCard.addEventListener('click', () => {
            setLoadingState(true);
            profileUpload.click();
        });
    }

    if (closeSvgModal && svgModal) {
        closeSvgModal.addEventListener('click', () => {
            svgModal.classList.add('hidden');
            document.body.classList.remove('modal-active');
        });
    }

    if (profileUpload && profilePreview) {
        profileUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            
            if (file) {
                const MAX_SIZE = 2 * 1024 * 1024;
                if (file.size > MAX_SIZE) {
                    showNotification('L\'image ne doit pas dépasser 2 Mo.', 'error');
                    event.target.value = null;
                    setLoadingState(false);
                    return;
                }

                if (!file.type.startsWith('image/')) {
                    showNotification('Le fichier doit être une image (JPG, PNG ou WEBP).', 'error');
                    event.target.value = null;
                    setLoadingState(false);
                    return;
                }

                const reader = new FileReader();
                
                reader.onload = (e) => {
                    formData.profileImage = e.target.result;
                    saveFormData();
                    updateSummary();
                    profilePreview.src = e.target.result;
                    
                    profileModal.classList.add('hidden');
                    document.body.classList.remove('modal-active');
                    
                    setLoadingState(false);
                    showNotification('Votre photo de profil a été mise à jour avec succès !', 'success');
                };
                
                reader.onerror = () => {
                    showNotification('Une erreur est survenue lors de la lecture du fichier.', 'error');
                    setLoadingState(false);
                };
                
                reader.readAsDataURL(file);
                
            } else {
                setLoadingState(false);
            }
            
            event.target.value = null;
        });
    }
}


/**
 * Lie les écouteurs d'événements pour les interactions avec les modales (pays, ville, rue).
 */
function bindModalInteractions() {
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
 * Lie les écouteurs d'événements pour la navigation entre les étapes du formulaire.
 */
function bindStepNavigation() {
    document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', () => {
            const currentStep = button.closest('.step');
            const nextStepId = button.dataset.next;
            updateStepIndicators(parseInt(nextStepId));
            currentStep.classList.add('hidden');
            const nextStep = document.getElementById(`step-${nextStepId}`);
            nextStep.classList.remove('hidden');
            nextStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
            saveFormData();
        });
    });

    document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', () => {
            const currentStep = button.closest('.step');
            const prevStepId = button.dataset.prev;
            updateStepIndicators(parseInt(prevStepId));
            currentStep.classList.add('hidden');
            const prevStep = document.getElementById(`step-${prevStepId}`);
            prevStep.classList.remove('hidden');
            prevStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

/**
 * Lie la fonctionnalité de bascule pour les champs de mot de passe.
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
 * Remplit la grille des icônes SVG dans la modale SVG.
 */
function populateSvgIconsGrid(icons) {
    const svgIconsList = document.getElementById('svg-icons-list');
    const profileModal = document.getElementById('profile-modal');
    const svgModal = document.getElementById('svg-modal');
    const profilePreview = document.getElementById('profile-preview');

    if (!svgIconsList) return;
    svgIconsList.innerHTML = '';

    if (icons.length === 0) {
        svgIconsList.innerHTML = '<div class="col-span-full p-6 text-center text-gray-500 dark:text-gray-400">Aucune icône SVG disponible.</div>';
        return;
    }

    icons.forEach(icon => {
        const div = document.createElement('div');
        div.className = 'svg-option header-btn flex items-center justify-center w-full h-[11rem] py-2 rounded-lg cursor-pointer transition-all duration-200 ' +
                        'bg-ll-white dark:bg-gray-700 ' +
                        'hover:bg-blue-100 dark:hover:bg-blue-600/50 hover:ring-2 hover:ring-blue-500 ' +
                        'focus:outline-none focus:ring-4 focus:ring-blue-500/50';
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');

        const styledSvg = icon.svg.replace(/<svg/, '<svg class="w-[12rem] h-full text-ll-black dark:text-ll-light-gray"');

        div.innerHTML = styledSvg;

        div.addEventListener('click', () => {
            formData.profileImage = `data:image/svg+xml;utf8,${encodeURIComponent(icon.svg)}`;
            saveFormData();
            updateSummary();
            if (profilePreview) {
                profilePreview.src = `data:image/svg+xml;utf8,${encodeURIComponent(icon.svg)}`;
            }
            if (svgModal) svgModal.classList.add('hidden');
            if (profileModal) profileModal.classList.add('hidden');
            document.body.classList.remove('modal-active');
        });

        svgIconsList.appendChild(div);
    });
}

/**
 * Remplit la grille des pays dans la modale.
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
        div.className = 'country-item p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200';
        if (formData.country === country.code) {
            div.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
        }
        div.dataset.code = country.code;
        div.dataset.name = `${country.flag} ${country.name}`;
        div.dataset.dialCode = country.dial_code;
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
 * Sélectionne un pays et met à jour les données du formulaire.
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
    formData.city = code === 'FR' ? 'angers' : '';
    formData.street = code === 'FR' ? 'rue-bressigny' : '';
    formData.postalCode = code === 'FR' ? '49000' : '';
    const cityInput = document.getElementById('city');
    const streetInput = document.getElementById('street');
    const postalCodeInput = document.getElementById('postalCode');
    if (cityInput) cityInput.value = code === 'FR' ? 'Angers' : 'Sélectionnez une ville';
    if (streetInput) streetInput.value = code === 'FR' ? 'Rue Bressigny' : 'Sélectionnez une rue';
    if (postalCodeInput) postalCodeInput.value = code === 'FR' ? '49000' : '';
    loadCities(code.toLowerCase());
    updateSummary();
    saveFormData();
}

/**
 * Charge les villes pour un pays donné.
 */
function loadCities(countryCode) {
    if (citiesData[countryCode]) {
        displayCities(citiesData[countryCode], countryCode);
        if (countryCode === 'fr' && !formData.city) {
            const defaultCity = citiesData[countryCode].find(c => c.id === 'angers');
            if (defaultCity) {
                selectCity(defaultCity.id, defaultCity.name, defaultCity.postalCode);
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
            if (countryCode === 'fr' && !formData.city) {
                const defaultCity = cities.find(c => c.id === 'angers');
                if (defaultCity) {
                    selectCity(defaultCity.id, defaultCity.name, defaultCity.postalCode);
                }
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des villes:', error);
            loadFallbackCities(countryCode);
        });
}

/**
 * Affiche les villes dans la modale des villes.
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
 * Sélectionne une ville et met à jour les données du formulaire.
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
    formData.street = id === 'angers' ? 'rue-bressigny' : '';
    const streetInput = document.getElementById('street');
    if (streetInput) streetInput.value = id === 'angers' ? 'Rue Bressigny' : 'Sélectionnez une rue';
    loadStreets(id);
    updateSummary();
    saveFormData();
}

/**
 * Charge les rues pour une ville donnée.
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
 * Affiche les rues dans la modale des rues.
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
 * Sélectionne une rue et met à jour les données du formulaire.
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
 * Met à jour les indicateurs d'étape en fonction de l'étape active.
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
 * Met à jour la section de sommaire avec les données du formulaire.
 */
function updateSummary() {
    const summaryName = document.getElementById('summary-name');
    const summaryEmail = document.getElementById('summary-email');
    const summaryPhone = document.getElementById('summary-phone');
    const summaryCountry = document.getElementById('summary-country');
    const summaryAddress = document.getElementById('summary-address');
    const profilePreview = document.getElementById('profile-preview');

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
    if (profilePreview) {
        profilePreview.src = formData.profileImage.startsWith('<svg')
            ? `data:image/svg+xml;utf8,${encodeURIComponent(formData.profileImage)}`
            : formData.profileImage || 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg width="256px" height="256px" viewBox="0 0 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg"><g stroke="none" stroke-width="1" stroke-dasharray="none" stroke-opacity="1" fill="none" fill-opacity="1"><rect x="0" y="0" width="256" height="256" fill="#ffffff"></rect><circle cx="128" cy="104" r="40" fill="#dde0f2"></circle><path d="M104,144C104,138.666667 108.666667,134 114,134H142C147.333333,134 152,138.666667 152,144V156H104L104,144Z" fill="#dde0f2"></path><path d="M152,176C152,176.000001 152,176 152,176H152V176Z" fill="#dde0f2"></path></g></svg>');
    }
}

/**
 * Réinitialise le formulaire à son état initial.
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
        confirmPassword: '',
        profileImage: '<svg width="256px" height="256px" viewBox="0 0 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg"><g stroke="none" stroke-width="1" stroke-dasharray="none" stroke-opacity="1" fill="none" fill-opacity="1"><rect x="0" y="0" width="256" height="256" fill="#ffffff"></rect><circle cx="128" cy="104" r="40" fill="#dde0f2"></circle><path d="M104,144C104,138.666667 108.666667,134 114,134H142C147.333333,134 152,138.666667 152,144V156H104L104,144Z" fill="#dde0f2"></path><path d="M152,176C152,176.000001 152,176 152,176H152V176Z" fill="#dde0f2"></path></g></svg>'
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
    saveFormData();
}

