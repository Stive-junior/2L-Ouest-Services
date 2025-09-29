/**
 * @file loadService.js
 * @description Loads service data from Firebase with localStorage caching and mock data fallback.
 * Integrates Swiper carousel for service images, equipment icons, and Lottie animations for loading states.
 */

import { getStoredToken, showNotification } from '../modules/utils.js';
import api from '../api.js';

// Cache configuration
const SERVICES_CACHE_KEY = 'servicesDataCache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// SVG Icons for Services
const serviceIcons = {
    bureaux: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><path d="M6 8h12"></path><path d="M6 12h12"></path><path d="M6 16h12"></path></svg>`,
    vitrines: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M2 10h20"></path></svg>`,
    régulier: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
    ponctuel: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    salles_de_réunion: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 3v18"></path><path d="M9 9h12"></path></svg>`,
    sas_dentrée: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M12 7v10"></path></svg>`,
    réfectoire: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16"></path><path d="M4 6h16"></path><path d="M4 18h16"></path></svg>`,
    sanitaires: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"></path><path d="M6 12h12"></path></svg>`,
    escaliers: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6v6H4z"></path><path d="M14 4h6v6h-6z"></path><path d="M4 14h6v6H4z"></path><path d="M14 14h6v6h-6z"></path></svg>`,
    piscine: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 14h2l2-2 2 4 2-2 2 4 2-2 2 4h2"></path><path d="M2 18h2l2-2 2 4 2-2 2 4 2-2 2 4h2"></path></svg>`,
};

// Equipment Icons
const equipmentIcons = {
    vacuum: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2H2v6h2l2 2 2-2h8l2 2 2-2h2V2z"></path><path d="M12 10v12"></path><path d="M8 14h8"></path></svg>`,
    mop: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v12"></path><rect x="8" y="14" width="8" height="6" rx="2"></rect></svg>`,
    spray: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h8v4H8z"></path><path d="M12 10v8"></path><path d="M10 18h4"></path></svg>`,
};

let MOCK_SERVICES = [];


// Toggle loading state for services
function toggleServicesLoading(show) {
    const loadingEl = document.getElementById('services-loading');
    const servicesList = document.getElementById('services-list');
    if (loadingEl && servicesList) {
        loadingEl.classList.toggle('hidden', !show);
        servicesList.classList.toggle('hidden', show);
    }
}


// Load mock services from JSON
async function loadMockServices() {
    try {
        const response = await fetch('/assets/json/mock/mock-services.json');
        if (response.ok) {
            MOCK_SERVICES = await response.json();
            MOCK_SERVICES = MOCK_SERVICES.map(service => ({
                ...service,
                icon: serviceIcons[service.category] || serviceIcons.bureaux,
                equipment: ['vacuum', 'mop', 'spray'],
            }));
        } else {
            throw new Error('Failed to load mock services');
        }
    } catch (error) {
        console.error('Error loading mock services:', error);
        showNotification('Erreur lors du chargement des données mock.', 'error');
        MOCK_SERVICES = [
            {
                id: 'mock-uuid-1',
                name: 'Nettoyage de Bureaux',
                description: 'Nettoyage professionnel pour bureaux et espaces de travail.',
                price: 150,
                area: 100,
                duration: 2,
                category: 'bureaux',
                ecoFriendly: true,
                icon: serviceIcons.bureaux,
                equipment: ['vacuum', 'mop', 'spray'],
                images: [
                    { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', type: 'before', description: 'Bureau avant nettoyage' },
                    { url: 'https://images.unsplash.com/photo-1600585152915-d208bec867a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', type: 'after', description: 'Bureau après nettoyage' },
                ],
                availability: { isAvailable: true, schedule: [{ day: 'lundi', hours: ['09:00', '17:00'] }] },
                location: { address: '123 Rue Exemple, Nantes', coordinates: { lat: 47.2184, lng: -1.5536 } },
                createdAt: new Date().toISOString(),
                features: ['Produits écologiques', 'Nettoyage en profondeur', 'Service personnalisé'],
                rating: 4,
                reviews: 120,
            },
            {
                id: 'mock-uuid-2',
                name: 'Nettoyage de Vitrines',
                description: 'Nettoyage des vitrines commerciales pour une présentation impeccable.',
                price: 80,
                area: 50,
                duration: 1,
                category: 'vitrines',
                ecoFriendly: true,
                icon: serviceIcons.vitrines,
                equipment: ['mop', 'spray'],
                images: [
                    { url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', type: 'before', description: 'Vitrine avant nettoyage' },
                    { url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', type: 'after', description: 'Vitrine après nettoyage' },
                ],
                availability: { isAvailable: true, schedule: [{ day: 'mardi', hours: ['10:00', '16:00'] }] },
                location: { address: '456 Avenue Test, Rennes', coordinates: { lat: 48.1147, lng: -1.6794 } },
                createdAt: new Date().toISOString(),
                features: ['Produits sans traces', 'Service rapide', 'Horaires flexibles'],
                rating: 4.5,
                reviews: 85,
            },
        ];
    }
}

// Load mock services at startup
loadMockServices();

/**
 * Loads service data with optional filters.
 * @param {Object} [filters] - Filters (e.g., { area, duration, category }).
 * @returns {Promise<Array<Object>|null>} List of services or null on error.
 */
export async function loadServices(filters = {}) {
    
    toggleServicesLoading(true);
    try {
        const token = getStoredToken();
        if (!token) {
            console.log('No token found, returning mock data.');
            return applyFilters(MOCK_SERVICES, filters);
        }

        const cachedData = getCachedServices();
        if (cachedData) {
            console.log('Returning cached service data.');
            return applyFilters(cachedData, filters);
        }

        console.log('Fetching service data from Firebase API...');
        const servicesData = await api.service.getAllServices(1, 50, filters);

        if (servicesData?.services) {
            const servicesWithIcons = servicesData.services.map(service => ({
                ...service,
                icon: serviceIcons[service.category] || serviceIcons.bureaux,
                equipment: service.equipment || ['vacuum', 'mop', 'spray'],
            }));
            cacheServices(servicesWithIcons);
            return applyFilters(servicesWithIcons, filters);
        } else {
            console.log('No services data from API, using mock data.');
            return applyFilters(MOCK_SERVICES, filters);
        }
    } catch (error) {
        console.error('Error loading services:', error);
        showNotification('Erreur lors du chargement des services.', 'error');
        return applyFilters(MOCK_SERVICES, filters);
    } finally {
        toggleServicesLoading(false);
    }
}

/**
 * Applies filters to service data.
 * @param {Array<Object>} services - List of services.
 * @param {Object} filters - Filters to apply.
 * @returns {Array<Object>} Filtered services.
 */
function applyFilters(services, filters) {
    return services.filter(service => {
        const { category, areaMin, areaMax, durationMin, durationMax, priceMin, priceMax, ecoFriendly } = filters;
        return (
            (!category || category === 'all' || service.category === category) &&
            (!areaMin || service.area >= areaMin) &&
            (!areaMax || service.area <= areaMax) &&
            (!durationMin || service.duration >= durationMin) &&
            (!durationMax || service.duration <= durationMax) &&
            (!priceMin || service.price >= priceMin) &&
            (!priceMax || service.price <= priceMax) &&
            (!ecoFriendly || service.ecoFriendly)
        );
    });
}

/**
 * Caches services data in localStorage with TTL.
 * @param {Array<Object>} services - Services to cache.
 */
function cacheServices(services) {
    try {
        const cacheData = {
            data: services,
            timestamp: Date.now(),
        };
        localStorage.setItem(SERVICES_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Error caching services:', error);
    }
}

/**
 * Retrieves cached services if not expired.
 * @returns {Array<Object>|null} Cached services or null.
 */
function getCachedServices() {
    try {
        const cached = localStorage.getItem(SERVICES_CACHE_KEY);
        if (!cached) return null;
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
            return data;
        }
        localStorage.removeItem(SERVICES_CACHE_KEY);
        return null;
    } catch (error) {
        console.error('Error retrieving cached services:', error);
        return null;
    }
}

/**
 * Renders services in the Swiper carousel.
 * @param {Array<Object>} services - Services to render.
 */
export function renderServices(services) {
    const servicesList = document.getElementById('services-list');
    if (!servicesList) return;

    servicesList.innerHTML = services.map(service => `
        <div class="swiper-slide service-card-enhanced relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl group" data-service-id="${service.id}">
            <div class="service-badge absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-sm font-semibold ${service.ecoFriendly ? 'bg-green-100 text-green-800' : service.rating >= 4.5 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}">
                ${service.ecoFriendly ? 'Éco-responsable' : service.rating >= 4.5 ? 'Populaire' : 'Nouveau'}
            </div>
            <div class="service-image relative overflow-hidden">
                <img src="${service.images[0]?.url || 'https://via.placeholder.com/400'}" alt="${service.name}" class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy">
            </div>
            <div class="service-content p-6 transition-transform duration-300 group-hover:translate-y-2">
                <div class="flex items-center gap-3 mb-3">
                    <span class="text-blue-600 dark:text-blue-400">${service.icon}</span>
                    <h3 class="service-title text-lg font-bold text-gray-900 dark:text-white">${service.name}</h3>
                </div>
                <p class="service-description text-gray-600 dark:text-gray-300 text-sm mb-4">${service.description}</p>
                <div class="service-features flex flex-wrap gap-2 mb-4">
                    ${service.features.map(feature => `<span class="service-feature text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">${feature}</span>`).join('')}
                </div>
                <div class="service-equipment flex gap-2 mb-4">
                    ${service.equipment.map(eq => `<span class="text-blue-600 dark:text-blue-400">${equipmentIcons[eq]}</span>`).join('')}
                </div>
                <div class="service-price text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">${service.price} €</div>
                <div class="service-actions flex gap-3">
                    <button class="book-service bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300" data-service-id="${service.id}">
                        Réserver
                    </button>
                    <button class="details-service bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300" data-service-id="${service.id}">
                        Détails
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Initialize Swiper with conditional loop
    const swiperOptions = {
        slidesPerView: 1,
        spaceBetween: 20,
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        breakpoints: {
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
        },
    };
    if (services.length >= 3) {
        swiperOptions.loop = true;
    }
    new Swiper('.services-swiper', swiperOptions);

    // Add event listeners for buttons
    document.querySelectorAll('.book-service').forEach(button => {
        button.addEventListener('click', () => {
            const serviceId = button.dataset.serviceId;
            showNotification(`Service ${serviceId} réservé avec succès !`, 'success');
        });
    });

    document.querySelectorAll('.details-service').forEach(button => {
        button.addEventListener('click', () => {
            const serviceId = button.dataset.serviceId;
            const service = services.find(s => s.id === serviceId);
            if (service) {
                showServiceDetails(service);
            }
        });
    });
}


/**
 * Displays service details in a modal.
 * @param {Object} service - Service data.
 */
function showServiceDetails(service) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-xl">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">${service.name}</h3>
                <button class="close-modal text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div class="p-6">
                <div class="swiper service-detail-swiper">
                    <div class="swiper-wrapper">
                        ${service.images.map(img => `
                            <div class="swiper-slide">
                                <img src="${img.url}" alt="${img.description}" class="w-full h-64 object-cover rounded-lg">
                            </div>
                        `).join('')}
                    </div>
                    <div class="swiper-pagination"></div>
                </div>
                <p class="mt-4 text-gray-600 dark:text-gray-300">${service.description}</p>
                <div class="mt-4">
                    <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">${service.price} €</span>
                    <span class="text-gray-500 dark:text-gray-400 ml-2">/ prestation</span>
                </div>
                <div class="mt-4">
                    <h4 class="font-semibold text-gray-900 dark:text-white">Caractéristiques :</h4>
                    <ul class="list-disc pl-5 mt-2 text-gray-600 dark:text-gray-300">
                        ${service.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                </div>
                <div class="mt-4">
                    <h4 class="font-semibold text-gray-900 dark:text-white">Équipement utilisé :</h4>
                    <div class="flex gap-2 mt-2">
                        ${service.equipment.map(eq => `<span class="text-blue-600 dark:text-blue-400">${equipmentIcons[eq]}</span>`).join('')}
                    </div>
                </div>
                <div class="mt-4">
                    <h4 class="font-semibold text-gray-900 dark:text-white">Disponibilité :</h4>
                    <p class="text-gray-600 dark:text-gray-300">${service.availability.isAvailable ? 'Disponible' : 'Non disponible'}</p>
                    ${service.availability.schedule.map(sch => `
                        <p class="text-gray-600 dark:text-gray-300">${sch.day}: ${sch.hours.join(' - ')}</p>
                    `).join('')}
                </div>
                <div class="mt-4">
                    <h4 class="font-semibold text-gray-900 dark:text-white">Évaluation :</h4>
                    <p class="text-gray-600 dark:text-gray-300">${service.rating} / 5 (${service.reviews} avis)</p>
                </div>
            </div>
            <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button class="book-service bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300" data-service-id="${service.id}">
                    Réserver maintenant
                </button>
                <button class="close-modal bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300">
                    Fermer
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Initialize Swiper for modal images
    new Swiper('.service-detail-swiper', {
        slidesPerView: 1,
        spaceBetween: 10,
        pagination: { el: '.swiper-pagination', clickable: true },
    });

    // Close modal
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => modal.remove());
    });

    // Book service
    modal.querySelector('.book-service').addEventListener('click', () => {
        showNotification(`Service ${service.name} réservé avec succès !`, 'success');
        modal.remove();
    });
}
