/**
 * @file loadServices.js
 * @description Charge et gère les données des services avec mise en cache et fallback sur données mock
 * @version Ultra Mega Puissante: Fixed null DOM errors, synced sidebar/details, auto-reset index on filters, robust error handling, enhanced navigation
 */

import { getStoredToken, showNotification } from '../modules/utils.js';
import api from '../api.js';
import { showNoServicesMessage } from '../animations/animation.js';

// Configuration du cache ultra-robuste
const SERVICES_CACHE_KEY = 'servicesDataCache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Icônes des services (étendu et optimisé)
const serviceIcons = {
    bureaux: '🏢',
    residentiel: '🏠',
    commercial: '🛍️',
    industriel: '🏭',
    medical: '🏥',
    hotelier: '🏨',
    education: '🎓',
    restaurant: '🍽️',
    sport: '💪',
    evenementiel: '🎪',
    piscine: '🏊',
    vitres: '🔍',
    facade: '🏛️',
    parking: '🅿️',
    jardin: '🌿'
};

// Icônes d'équipement (étendu et optimisé)
const equipmentIcons = {
    vacuum: '🧹',
    mop: '🪣',
    spray: '🧴',
    broom: '🧹',
    bucket: '🪣',
    cloth: '🧽',
    polisher: '✨',
    brush: '🖌️',
    duster: '🪶',
    scraper: '🔪',
    extractor: '💧',
    pressure_washer: '💦',
    steam_cleaner: '♨️',
    floor_machine: '⚙️'
};

let MOCK_SERVICES = [];
let allFilteredServices = [];
let currentServiceIndex = 0;
let paginationVisiblePages = 5;
let currentPageOffset = 0;
let lastFiltersHash = '';


/**
 * Toggle le loading overlay - ROBUSTE: Cache complètement les détails derrière et réapparaît si services disponibles
 */
function toggleServicesLoading(show) {
    const container = document.getElementById('service-detail-container');
    const loading = document.getElementById('services-loading');
    if (!container || !loading) return;

    // Assurer que le container est relative pour positioning
    if (!container.classList.contains('relative')) {
        container.classList.add('relative');
    }

    // Toggle hidden class pour show/hide
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }

    // Si on cache le loading et qu'il y a des services, s'assurer que le contenu est visible (z-0 ou similaire)
    if (!show) {
        const existingContent = container.querySelector('.service-detail-content');
        if (existingContent) {
            existingContent.classList.remove('hidden');
            existingContent.style.zIndex = '0';
        }
    }
}



/**
 * Charge les services mock depuis JSON avec retry et fallback
 */
async function loadMockServices(retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch('/assets/json/mock/mock-services.json');
            if (response.ok) {
                const data = await response.json();
                MOCK_SERVICES = data.services.map(service => ({
                    ...service,
                    icon: serviceIcons[service.category] || serviceIcons.bureaux,
                    equipment: (service.equipment || ['vacuum', 'mop', 'spray']).map(eq => ({
                        icon: equipmentIcons[eq] || equipmentIcons.vacuum,
                        name: eq
                    })),
                    certification: service.certification || getRandomCertification(),
                    garantie: service.garantie || '30 jours',
                    delai_intervention: service.delai_intervention || getRandomInterventionTime(),
                    zone_intervention: service.zone_intervention || 'Île-de-France',
                    // Defaults pour robustesse
                    images: service.images || [{ url: '/assets/images/placeholder.jpg', type: 'after' }],
                    features: service.features || ['Service professionnel', 'Équipé moderne'],
                    members: service.members || [{ name: 'Équipe Pro', role: 'Nettoyeurs', photo: '/assets/images/placeholder-avatar.jpg' }],
                    availability: service.availability || { isAvailable: true, schedule: [{ day: 'Lun-Ven', hours: ['9h-18h'] }] },
                    rating: service.rating || 4.5,
                    reviews: service.reviews || 100,
                    difficulty: service.difficulty || 'medium',
                    frequency: service.frequency || 'hebdomadaire'
                }));
                return; // Succès
            }
        } catch (error) {
            console.warn(`Mock load attempt ${i + 1} failed:`, error);
            if (i === retries - 1) {
                console.error('All mock load attempts failed');
                showNotification('Erreur lors du chargement des données mock.', 'error');
                MOCK_SERVICES = []; // Fallback vide mais géré
            }
            await new Promise(resolve => setTimeout(resolve, 500)); // Delay retry
        }
    }
}

// Charger mock au démarrage avec async
loadMockServices();

/**
 * Retourne une certification aléatoire (stable)
 */
function getRandomCertification() {
    const certifications = ['NF X50-900', 'ISO 9001', 'Qualibat', 'Ecocert', 'Label Origine France Garantie'];
    return certifications[Math.floor(Math.random() * certifications.length)];
}

/**
 * Retourne un délai d'intervention aléatoire (stable)
 */
function getRandomInterventionTime() {
    const delais = ['24h', '48h', '72h', '1 semaine'];
    return delais[Math.floor(Math.random() * delais.length)];
}

/**
 * Charge tous les services avec filtres, cache, et auto-reset index si filtres changent
 */
export async function loadServices(filters = {}) {
    toggleServicesLoading(true);
    
    // Hash des filtres pour détecter changements
    const filtersHash = JSON.stringify(filters);
    const filtersChanged = filtersHash !== lastFiltersHash;
    lastFiltersHash = filtersHash;
    
    try {
        const token = getStoredToken();
        let services;

        if (!token) {
            console.log('No token, using mock data.');
            services = [...MOCK_SERVICES]; // Copy pour éviter mutations
        } else {
            let cachedData = getCachedServices();
            if (cachedData && !filtersChanged) {
                console.log('Using cached data.');
                services = [...cachedData];
            } else {
                console.log('Fetching from API...');
                const apiData = await api.service.getAllServices(1, 100, filters).catch(err => {
                    console.warn('API fetch failed, fallback to mock:', err);
                    return null;
                });
                
                if (apiData?.services && apiData.services.length > 0) {
                    services = apiData.services.map(service => ({
                        ...service,
                        icon: serviceIcons[service.category] || serviceIcons.bureaux,
                        equipment: (service.equipment || ['vacuum', 'mop', 'spray']).map(eq => ({
                            icon: equipmentIcons[eq] || equipmentIcons.vacuum,
                            name: eq
                        })),
                        // Defaults pour API data
                        images: service.images || [{ url: '/assets/images/placeholder.jpg', type: 'after' }],
                        features: service.features || ['Service professionnel', 'Équipé moderne'],
                        members: service.members || [{ name: 'Équipe Pro', role: 'Nettoyeurs', photo: '/assets/images/placeholder-avatar.jpg' }],
                        availability: service.availability || { isAvailable: true, schedule: [{ day: 'Lun-Ven', hours: ['9h-18h'] }] },
                        rating: service.rating || 4.5,
                        reviews: service.reviews || 100,
                        difficulty: service.difficulty || 'medium',
                        frequency: service.frequency || 'hebdomadaire'
                    }));
                    cacheServices(services);
                } else {
                    console.log('API empty, using mock.');
                    services = [...MOCK_SERVICES];
                }
            }
        }

        // Appliquer les filtres (toujours, même sur cache)
        allFilteredServices = applyFilters(services, filters);
        
        // Auto-reset index si filtres changent et résultats différents
        if (filtersChanged && allFilteredServices.length > 0) {
            currentServiceIndex = 0;
        } else if (allFilteredServices.length === 0) {
            currentServiceIndex = 0;
        } else if (currentServiceIndex >= allFilteredServices.length) {
            currentServiceIndex = allFilteredServices.length - 1;
        }
        
        return allFilteredServices;
        
    } catch (error) {
        console.error('Error loading services:', error);
        showNotification('Erreur lors du chargement des services.', 'error');
        allFilteredServices = applyFilters(MOCK_SERVICES, filters);
        currentServiceIndex = 0; // Reset sur erreur
        return allFilteredServices;
    } finally {
        toggleServicesLoading(false);
    }
}

/**
 * Applique les filtres avancés avec optimisation (early return)
 */
function applyFilters(services, filters) {
    const { category, frequency, difficulty, reviewsMin, search } = filters;
    
    return services.filter(service => {
        if (category && category !== 'all' && service.category !== category) return false;
        if (frequency && frequency !== 'all' && service.frequency !== frequency) return false;
        if (difficulty && difficulty !== 'all' && service.difficulty !== difficulty) return false;
        if (reviewsMin && service.reviews < reviewsMin) return false;
        
        // Recherche textuelle optimisée
        if (search) {
            const lowerSearch = search.toLowerCase();
            if (!service.name.toLowerCase().includes(lowerSearch) &&
                !service.description.toLowerCase().includes(lowerSearch) &&
                !service.features.some(feature => feature.toLowerCase().includes(lowerSearch))) {
                return false;
            }
        }
        
        return true;
    });
}

/**
 * Met en cache les services avec TTL et validation
 */
function cacheServices(services) {
    try {
        if (!services || !Array.isArray(services)) return;
        const cacheData = { data: services, timestamp: Date.now() };
        localStorage.setItem(SERVICES_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Cache error:', error);
    }
}

/**
 * Récupère les services en cache s'ils sont valides
 */
function getCachedServices() {
    try {
        const cached = localStorage.getItem(SERVICES_CACHE_KEY);
        if (!cached) return null;
        
        const { data, timestamp } = JSON.parse(cached);
        if (!Array.isArray(data) || Date.now() - timestamp > CACHE_TTL) {
            localStorage.removeItem(SERVICES_CACHE_KEY);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Retrieve cache error:', error);
        localStorage.removeItem(SERVICES_CACHE_KEY);
        return null;
    }
}

/**
 * Rend la barre latérale des services et gère la visibilité (caché sur mobile) - SYNCHRO AVEC DETAILS
 * Met à jour le détail du service pour l'index actuel si valide
 */
export function renderServicesSidebar(services) {
    const sidebarContainer = document.getElementById('services-sidebar-container');
    const sidebar = document.getElementById('services-sidebar');
    if (!sidebar || !sidebarContainer) {
        console.warn('Sidebar elements not found, skipping render.');
        return;
    }

    

    // Clear et render sidebar
    sidebar.innerHTML = services.map((service, index) => {
        const afterImage = service.images?.find(img => img.type === 'after') || { url: '/assets/images/logo.png' };
        const categoryLabel = service.category ? `<span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">${service.category}</span>` : '';

        return `
            <button class="service-sidebar-item w-full text-left p-6 rounded-2xl border border-white/20 dark:border-gray-700/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300 group service-card ${
                index === currentServiceIndex ? 'border-white/50 bg-white/90 dark:bg-gray-700/90 shadow-xl ring-1 ring-white/30' : 'bg-white/50 dark:bg-gray-800/50'
            }" data-service-index="${index}">
                <div class="flex flex-col gap-4 h-full">
                    <img src="${afterImage.url}" alt="${service.name}" class="w-full h-32 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300">
                    <div class="flex-1 min-h-0">
                        <h4 class="font-semibold text-gray-900 dark:text-white text-lg truncate group-hover:text-ll-blue transition-colors">${service.name}</h4>
                        <div class="flex items-center gap-2 mt-2">
                            <div class="flex text-yellow-400 text-sm">
                                ${renderStarRating(service.rating)}
                            </div>
                            <span class="text-xs text-gray-500 dark:text-gray-400">(${service.reviews})</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between pt-2 border-t border-gray-200/50 dark:border-gray-600/50">
                        <div class="flex items-center gap-3">
                            <span class="text-xl transform group-hover:scale-110 transition-transform">${service.icon}</span>
                            ${categoryLabel}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
                            <path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path>
                        </svg>
                    </div>
                </div>
            </button>
        `;
    }).join('');

    // Gestion des clics: SYNCHRO AVEC INDEX ET DETAILS
    sidebar.querySelectorAll('.service-sidebar-item').forEach((item, index) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Mettre à jour index et naviguer (utilise navigateService pour cohérence)
            const direction = index > currentServiceIndex ? 'next' : index < currentServiceIndex ? 'prev' : null;
            const delta = Math.abs(index - currentServiceIndex);
            if (direction) {
                navigateService(direction, delta);
            } else {
                // Même index: refresh
                renderServiceDetail(services[index], index, services.length);
            }
            
            // Update classes actives
            sidebar.querySelectorAll('.service-sidebar-item').forEach((el, i) => {
                if (i === currentServiceIndex) {
                    el.classList.add('border-white/50', 'bg-white/90', 'dark:bg-gray-700/90', 'shadow-xl', 'ring-1', 'ring-white/30');
                    el.classList.remove('bg-white/50', 'dark:bg-gray-800/50', 'border-white/20', 'dark:border-gray-700/50');
                } else {
                    el.classList.remove('border-white/50', 'bg-white/90', 'dark:bg-gray-700/90', 'shadow-xl', 'ring-1', 'ring-white/30');
                    el.classList.add('bg-white/50', 'dark:bg-gray-800/50', 'border-white/20', 'dark:border-gray-700/50');
                }
            });
        });
    });

    // Mettre à jour le sélecteur mobile
    updateMobileServiceSelector(services);

    // Mettre à jour la pagination (avec check null)
    renderServicePagination(services.length);

    // SYNCHRO: Si services > 0 et index valide, update detail IMMEDIATEMENT
    if (services.length > 0 && currentServiceIndex < services.length) {
        AOS.refreshHard(); // Refresh AOS pour animations
        renderServiceDetail(services[currentServiceIndex], currentServiceIndex, services.length);
    } else if (services.length === 0) {
        showNoServicesMessage();
    }
}

/**
 * Rend la pagination des services avec ellipsis et bouton "more" - FIXED NULL CHECK
 */
function renderServicePagination(totalServices) {
    const paginationContainer = document.getElementById('service-pagination');
    const pagesContainer = document.getElementById('service-pages');
    
    // FIXED: Si pas d'éléments, skip sans erreur
    if (!paginationContainer || !pagesContainer || totalServices < 2) {
        if (paginationContainer) paginationContainer.classList.add('hidden');
        return;
    }

    const totalPages = totalServices;
    const currentPage = currentServiceIndex + 1;
    const maxVisible = paginationVisiblePages;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    let pagesHTML = '';

    // First page
    if (startPage > 1) {
        pagesHTML += `<button class="service-page-btn px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-ll-blue hover:text-white transition-all duration-300 transform hover:scale-105" data-page="1">1</button>`;
        if (startPage > 2) {
            pagesHTML += `<span class="pagination-ellipsis mx-1 text-sm">...</span>`;
        }
    }

    // Visible pages
    for (let i = startPage; i <= endPage; i++) {
        pagesHTML += `
            <button class="service-page-btn px-4 py-2 rounded-full ${i === currentPage ? 'bg-ll-blue text-white shadow-lg neon-glow' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'} font-medium hover:bg-ll-blue hover:text-white transition-all duration-300 transform hover:scale-105" data-page="${i}">
                ${i}
            </button>
        `;
    }

    // Ellipsis and more button
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pagesHTML += `<span class="pagination-ellipsis mx-0 text-sm">...</span>`;
        }
       }

    pagesContainer.innerHTML = pagesHTML;
    paginationContainer.classList.remove('hidden');

    // Événements: Utilise navigateService
    const prevBtn = document.getElementById('service-prev');
    const nextBtn = document.getElementById('service-next');
    if (prevBtn) prevBtn.onclick = () => navigateService('prev');
    if (nextBtn) nextBtn.onclick = () => navigateService('next');

    pagesContainer.querySelectorAll('.service-page-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const page = parseInt(btn.dataset.page);
            if (page !== currentPage && !isNaN(page)) {
                const delta = page - currentPage;
                navigateService(delta > 0 ? 'next' : 'prev', Math.abs(delta));
            }
        };
    });

    // États boutons
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

/**
 * Met à jour le sélecteur de services mobile - SYNCHRO AVEC NAVIGATION
 */
function updateMobileServiceSelector(services) {
    const mobileSelector = document.getElementById('mobile-service-selector');
    if (!mobileSelector) return;

    const currentValue = mobileSelector.value;

    mobileSelector.innerHTML = '<option value="">Sélectionnez un service</option>' + 
        services.map((service, index) => `
            <option value="${index}" ${index === currentServiceIndex ? 'selected' : ''}>
                ${service.name} (${service.rating} ⭐)
            </option>
        `).join('');

    if (currentValue && services[currentValue]) {
        mobileSelector.value = currentValue;
    }

    // Change: Utilise navigateService
    const handler = mobileSelector._changeHandler;
    if (handler) mobileSelector.removeEventListener('change', handler);
    mobileSelector._changeHandler = (e) => {
        const selectedIndex = parseInt(e.target.value);
        if (!isNaN(selectedIndex) && services[selectedIndex]) {
            const delta = selectedIndex - currentServiceIndex;
            navigateService(delta > 0 ? 'next' : 'prev', Math.abs(delta));
        }
    };
    mobileSelector.addEventListener('change', mobileSelector._changeHandler);
}

/**
 * Rend le détail d'un service - ROBUSTE AVEC DEFAULTS ET SYNCHRO
 */
export function renderServiceDetail(service, index = 0, total = 1) {
    const container = document.getElementById('service-detail-container');
    if (!container) {
        console.warn('Detail container not found, skipping render.');
        return;
    }

    // Defaults si service invalide
    if (!service || typeof service !== 'object') {
        service = {
            name: 'Service par défaut',
            description: 'Description par défaut.',
            images: [{ url: '/assets/images/placeholder.jpg', type: 'after', description: 'Description par défaut' }],
            features: ['Feature 1'],
            equipment: [{ icon: '🧹', name: 'Default' }],
            members: [{ name: 'Équipe', role: 'Pro', photo: '/assets/images/placeholder-avatar.jpg' }],
            availability: { isAvailable: true, schedule: [{ day: 'Lun-Ven', hours: ['9h-18h'] }] },
            rating: 4.5,
            reviews: 100,
            difficulty: 'medium',
            certification: 'Non spécifié',
            garantie: 'Non spécifié',
            delai_intervention: 'Non spécifié',
            zone_intervention: 'Non spécifié'
        };
    }

    currentServiceIndex = index; // Sync global index

    // Carousel d'images - robuste avec check
    const imagesWrapper = document.getElementById('service-images');
    if (imagesWrapper) {
        imagesWrapper.innerHTML = service.images.map((img, imgIndex) => `
            <div class="swiper-slide relative">
                <img src="${img.url}" alt="${img.description || service.name}" class="w-full h-64 md:h-80 lg:h-96 object-cover rounded-xl" loading="lazy" onerror="this.src='/assets/images/logo.png'">
                ${img.type === 'before' ? `
                    <span class="absolute top-4 left-4 bg-red-500/90 text-white px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm">Avant</span>
                ` : img.type === 'after' ? `
                    <span class="absolute top-4 left-4 bg-green-500/90 text-white px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm">Après</span>
                ` : ''}
                ${img.description ? `
                    <p class="absolute bottom-4 left-4 right-4 text-white text-sm bg-black/50 rounded p-2 text-center backdrop-blur-sm">${img.description}</p>
                ` : ''}
            </div>
        `).join('');

        // Swiper init robuste
        if (window.Swiper) {
            const swiperEl = document.querySelector('.service-image-swiper');
            if (swiperEl && swiperEl.swiper && typeof swiperEl.swiper.destroy === 'function') {
                try {
                    swiperEl.swiper.destroy(true, true);
                } catch (err) {
                    console.warn('Error destroying previous Swiper instance:', err);
                }
            }
            
            setTimeout(() => {
                if (swiperEl) {
                    try {
                        const newSwiper = new window.Swiper('.service-image-swiper', {
                            slidesPerView: 1,
                            spaceBetween: 0,
                            pagination: { 
                                el: '.swiper-pagination',
                                clickable: true,
                                renderBullet: function (index, className) {
                                    return `<span class="${className} !w-3 !h-3 !bg-white/50 !opacity-50 hover:!opacity-100 !transition-all"></span>`;
                                }
                            },
                            navigation: {
                                nextEl: '.swiper-button-next',
                                prevEl: '.swiper-button-prev',
                            },
                            loop: service.images.length > 1,
                            lazy: true,
                            autoplay: service.images.length > 1 ? {
                                delay: 5000,
                                disableOnInteraction: false,
                            } : false,
                            effect: 'fade',
                            fadeEffect: { crossFade: true }
                        });
                        swiperEl.swiper = newSwiper;
                    } catch (swiperErr) {
                        console.error('Error initializing Swiper:', swiperErr);
                    }
                }
            }, 150);
        }
    }

    // Détails basiques
    const nameEl = document.getElementById('service-name');
    const descEl = document.getElementById('service-description');
    if (nameEl) nameEl.textContent = service.name;
    if (descEl) descEl.textContent = service.description;

    // Rating
    const ratingEl = document.getElementById('service-rating');
    const ratingValueEl = document.getElementById('service-rating-value');
    const reviewsEl = document.getElementById('service-reviews');
    if (ratingEl) ratingEl.innerHTML = renderStarRating(service.rating);
    if (ratingValueEl) ratingValueEl.textContent = service.rating.toFixed(1);
    if (reviewsEl) reviewsEl.textContent = `${service.reviews} avis`;

    // Difficulté
    const difficultyEl = document.getElementById('service-difficulty');
    if (difficultyEl) {
        const difficultyColors = { easy: 'difficulty-easy', medium: 'difficulty-medium', hard: 'difficulty-hard' };
        const difficultyText = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };
        difficultyEl.textContent = difficultyText[service.difficulty] || 'Moyen';
        difficultyEl.className = `difficulty-badge ${difficultyColors[service.difficulty] || 'difficulty-medium'}`;
    }

    // Features
    const featuresList = document.getElementById('service-features');
    if (featuresList) {
        featuresList.innerHTML = service.features.map(feature => `
            <li class="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-600/30 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-colors group">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500 flex-shrink-0">
                    <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">${feature}</span>
            </li>
        `).join('');
    }

    // Equipment
    const equipmentEl = document.getElementById('service-equipment');
    if (equipmentEl) {
        equipmentEl.innerHTML = service.equipment.map(eq => `
            <div class="text-center group cursor-pointer transform hover:scale-110 transition-all duration-300">
                <div class="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-ll-blue">
                    <span class="text-3xl block mb-2">${eq.icon}</span>
                    <span class="text-xs text-gray-600 dark:text-gray-400 font-medium capitalize">${eq.name}</span>
                </div>
            </div>
        `).join('');
    }

    // Members
    const membersEl = document.getElementById('service-members');
    if (membersEl) {
        membersEl.innerHTML = service.members.map(member => `
            <div class="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-600/30 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-all duration-300 group">
                <img src="${member.photo}" alt="${member.name}" class="w-12 h-12 md:w-16 md:h-16 rounded-xl object-cover border-2 border-transparent group-hover:border-ll-blue transition-colors" onerror="this.src='/assets/images/placeholder-avatar.jpg'">
                <div class="flex-1">
                    <p class="font-semibold text-gray-900 dark:text-white group-hover:text-ll-blue transition-colors">${member.name}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${member.role}</p>
                    <div class="flex gap-1 mt-2">
                        ${Array.from({ length: 5 }, (_, i) => `
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="${i < 4 ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-400">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Availability
    const availabilityEl = document.getElementById('service-availability');
    const scheduleEl = document.getElementById('service-schedule');
    if (availabilityEl) {
        availabilityEl.textContent = service.availability.isAvailable ? 
            '✅ Service disponible immédiatement' : '❌ Service temporairement indisponible';
    }
    if (scheduleEl) {
        scheduleEl.innerHTML = service.availability.schedule.map(sch => `
            <li class="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-600/30 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-colors">
                <span class="font-medium text-gray-700 dark:text-gray-300 capitalize">${sch.day}</span>
                <span class="dark:text-ll-white text-ll-black font-semibold">${sch.hours.join(' - ')}</span>
            </li>
        `).join('');
    }

    // Infos comp
    const certEl = document.getElementById('service-certification');
    const guarEl = document.getElementById('service-garantie');
    const delaiEl = document.getElementById('service-delai');
    const zoneEl = document.getElementById('service-zone');
    if (certEl) certEl.textContent = service.certification || 'Non spécifié';
    if (guarEl) guarEl.textContent = service.garantie || 'Non spécifié';
    if (delaiEl) delaiEl.textContent = service.delai_intervention || 'Non spécifié';
    if (zoneEl) zoneEl.textContent = service.zone_intervention || 'Non spécifié';

    // Boutons d'action
    const bookButton = document.getElementById('book-service');
    const demoButton = document.getElementById('demo-service');
    const moreInfoButton = document.getElementById('more-info-service');

    if (bookButton) {
        bookButton.onclick = () => {
            showNotification(`Service "${service.name}" réservé avec succès !`, 'success');
            window.location.href = `/reservation?service=${service.id || index}`;
        };
    }

    if (demoButton) {
        demoButton.onclick = () => {
            if (window.openVideoModal && service.videoDemo) {
                window.openVideoModal(service.videoDemo , service.name);
            } else {
                showNotification('Démonstration vidéo non disponible pour ce service.', 'info');
            }
        };
    }

    if (moreInfoButton) {
        moreInfoButton.href = `/services/${service.id || index}`;
    }

    highlightSearchTerms(service);

    // Update mobile selector
    updateMobileServiceSelector(allFilteredServices);

    if (typeof AOS !== 'undefined') AOS.refresh();
}


/**
 * Met en surbrillance les termes de recherche - SANS FOND, JUSTE COULEUR + GLOW LÉGER
 */
function highlightSearchTerms(service) {
    const searchTerm = document.getElementById('service-search')?.value;
    if (!searchTerm) return;

    const elements = [document.getElementById('service-name'), document.getElementById('service-description')];

    elements.forEach(element => {
        if (element) {
            const text = element.textContent;
            const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            const highlighted = text.replace(regex, '<span class="text-yellow-500 font-bold" style="text-shadow: 0 0 8px rgba(255, 193, 7, 0.6);">$1</span>');
            element.innerHTML = highlighted;
        }
    });
}



/**
 * Rend la notation par étoiles avec animation futuriste
 */
function renderStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';
    
    // Étoiles pleines
    for (let i = 0; i < fullStars; i++) {
        stars += `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="url(#gold-gradient)" stroke="currentColor" stroke-width="1" class="star-filled transform hover:scale-110 transition-all neon-glow" data-rating="${i + 1}">
                <defs>
                    <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#fbbf24"/>
                        <stop offset="100%" stop-color="#f59e0b"/>
                    </linearGradient>
                </defs>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
        `;
    }
    
    if (hasHalfStar) {
        stars += `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="url(#half-gold)" stroke="currentColor" stroke-width="1" class="star-filled transform hover:scale-110 transition-all neon-glow">
                <defs>
                    <linearGradient id="half-gold" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="50%" stop-color="#fbbf24"/>
                        <stop offset="50%" stop-color="transparent"/>
                    </linearGradient>
                </defs>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
        `;
    }
    
    // Étoiles vides
    for (let i = 0; i < emptyStars; i++) {
        stars += `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="star-empty transform hover:scale-110 transition-all neon-glow" data-rating="${fullStars + (hasHalfStar ? 1 : 0) + i + 1}">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
        `;
    }

    return stars;
}



/**
 * Navigue vers le service précédent/suivant - UTILISE TOUJOURS POUR SYNCHRO
 */
export function navigateService(direction, delta = 1) {
    const total = allFilteredServices.length;
    if (total === 0) return;

    let newIndex = currentServiceIndex;
    if (direction === 'prev') {
        newIndex = Math.max(0, currentServiceIndex - delta);
    } else if (direction === 'next') {
        newIndex = Math.min(total - 1, currentServiceIndex + delta);
    }

    if (newIndex !== currentServiceIndex) {
        currentServiceIndex = newIndex;
        renderServiceDetail(allFilteredServices[currentServiceIndex], currentServiceIndex, total);
        renderServicesSidebar(allFilteredServices);
        if (typeof AOS !== 'undefined') AOS.refresh();
    }
}

export function getServiceIndex() {
    return currentServiceIndex;
}

export function setServiceIndex(index) {
    currentServiceIndex = Math.max(0, Math.min(index, allFilteredServices.length - 1));
}

export default {
    loadServices,
    renderServicesSidebar,
    renderServiceDetail,
    navigateService,
    toggleServicesLoading,
    getServiceIndex,
    setServiceIndex
};