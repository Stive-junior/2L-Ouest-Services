/**
 * @file loadServiceDetail.js
 * @description Gère le chargement, rendu et navigation du détail d'un service. Async, robuste avec redirection sur ID invalide.
 * Intègre auth pour préremplir modale réservation. SYNCHRO avec sidebar et pagination.
 * Version Ultra Complet: Rendu full (images, features, équipe, etc.), modale réservation, highlights recherche, validation temps réel.
 * @version Mise à jour Professionnelle: Infos prioritaires en haut (nom > catégorie > rating > description), grille images complète sans carousel.
 * Mises à jour: Gestion loading hidden par défaut, show not found si pas trouvé, Tailwind direct, responsive full.
 * Ajout: Main dédié pour affichage loading du service (#service-loading-main), togglé explicitement ici pour cohérence.
 * Ajout: Paramètre URL 'reserve=true' pour ouvrir directement la modale de réservation après rendu.
 */

import { loadUserData } from '../loadData.js';
import reservation from '../modules/reservation.js';
import { showNotification } from '../modules/utils.js';
import { equipmentIcons, loadServices, navigateService, toggleServicesLoading, renderServicesSidebar } from './loadService.js';

let allServices = [];
let currentUser = null;
let currentServiceIndex = 0;

/**
 * Toggle pour le main de chargement du service
 * @param {boolean} show - true pour afficher le main loading, false pour le cacher
 */
function toggleServiceLoadingMain(show) {
    const loadingMain = document.getElementById('service-loading-main');
    const overlay = document.getElementById('loading-overlay');
    const body = document.body;

    if (show) {
        loadingMain.classList.remove('hidden');
        overlay.style.display = 'flex'; // Réaffiche l'overlay si besoin
        body.classList.add('loading');
    } else {
        loadingMain.classList.add('hidden');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
        body.classList.remove('loading');
    }
}

function renderStarRating(rating, prefix = '') {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';
    
    // Étoiles pleines
    for (let i = 0; i < fullStars; i++) {
        stars += `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="url(#gold-gradient-${prefix}${i})" stroke="currentColor" stroke-width="1" class="star-filled hover:scale-110 transition-all duration-300" data-rating="${i + 1}" aria-hidden="true">
                <defs>
                    <linearGradient id="gold-gradient-${prefix}${i}" x1="0%" y1="0%" x2="100%" y2="100%">
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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="url(#half-gold-${prefix})" stroke="currentColor" stroke-width="1" class="star-filled hover:scale-110 transition-all duration-300" aria-hidden="true">
                <defs>
                    <linearGradient id="half-gold-${prefix}" x1="0%" y1="0%" x2="100%" y2="0%">
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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E5E7EB dark:stroke-gray-600" stroke-width="2" class="star-empty hover:scale-110 transition-all duration-300" data-rating="${fullStars + (hasHalfStar ? 1 : 0) + i + 1}" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
        `;
    }

    return stars;
}

/**
 * Fonction pour afficher/masquer le contenu selon si service trouvé ou non
 */
function renderContent(isFound, service = null, index = 0, total = 1) {
    const mainContent = document.getElementById('service-main-content');
    const notFoundPage = document.getElementById('service-not-found-page');

    if (isFound) {
        mainContent.classList.remove('hidden');
        notFoundPage.classList.add('hidden');
        if (service) {
            renderServiceDetail(service, index, total);
        }
    } else {
        mainContent.classList.add('hidden');
        notFoundPage.classList.remove('hidden');
        showNotification('Service non trouvé.', 'error');
    }

    // Masquer loading overlay et main loading
    toggleServiceLoadingMain(false);
}

/**
 * Rendu professionnel premium du détail du service
 */
export function renderServiceDetail(service, index = 0, total = 1) {
    // Validation robuste avec fallback élégant
    if (!service || typeof service !== 'object') {
        console.warn('Service invalide, utilisation des valeurs par défaut');
        service = {
            id: 'default',
            name: 'Service Professionnel de Nettoyage',
            description: 'Notre service de nettoyage professionnel offre une solution complète et éco-responsable pour maintenir vos espaces impeccables. Avec des techniques avancées et des produits certifiés, nous garantissons un résultat optimal respectueux de votre environnement.',
            category: 'bureaux',
            images: [
                { url: '/assets/images/services/office-cleaning-1.jpg', type: 'before', description: 'Espace de travail avant nettoyage' },
                { url: '/assets/images/services/office-cleaning-2.jpg', type: 'after', description: 'Résultat professionnel après intervention' },
                { url: '/assets/images/services/office-cleaning-3.jpg', type: 'process', description: 'Notre équipe en action' },
                { url: '/assets/images/services/team-work.jpg', type: 'team', description: 'Équipe qualifiée au travail' }
            ],
            features: [
                'Techniques de nettoyage professionnelles certifiées',
                'Produits éco-responsables et biodégradables',
                'Équipement haute performance et maintenance régulière',
                'Personnel formé et expérimenté',
                'Flexibilité des horaires selon vos besoins',
                'Rapport de qualité après chaque intervention',
                'Service client dédié 7j/7',
                'Garantie satisfaction 100%'
            ],
            equipment: [
                { icon: equipmentIcons.vacuum.svg, name: equipmentIcons.vacuum.name },
                { icon: equipmentIcons.mop.svg, name: equipmentIcons.mop.name },
                { icon: equipmentIcons.spray.svg, name: equipmentIcons.spray.name },
                { icon: equipmentIcons.brush.svg, name: 'Brosse spécialisée' },
                { icon: equipmentIcons.glove.svg, name: 'Équipement de protection' },
                { icon: equipmentIcons.truck.svg, name: 'Flotte de véhicules' }
            ],
            members: [
                { name: 'Jean Dupont', role: 'Responsable Technique Senior', photo: '/assets/images/team/technician-1.jpg', experience: '8 ans' },
                { name: 'Marie Martin', role: 'Superviseuse Qualité', photo: '/assets/images/team/supervisor-1.jpg', experience: '6 ans' },
                { name: 'Pierre Leclerc', role: 'Expert Équipements', photo: '/assets/images/team/technician-2.jpg', experience: '5 ans' }
            ],
            availability: { 
                isAvailable: true, 
                schedule: [
                    { day: 'Lundi - Vendredi', hours: ['7h00 - 20h00'] },
                    { day: 'Samedi', hours: ['8h00 - 18h00'] },
                    { day: 'Dimanche', hours: ['Intervention sur devis'] }
                ]
            },
            rating: 4.7,
            reviews: 127,
            difficulty: 'medium',
            certification: 'NF X50-900 & EcoLabel',
            garantie: '30 jours satisfaction garantie',
            delai_intervention: 'Sous 24h ouvrées',
            zone_intervention: 'Région Ouest de la France',
            frequency: 'Personnalisable',
            price_range: 'À partir de 45€/h',
            included_services: [
                'Diagnostic initial gratuit',
                'Devis personnalisé',
                'Produits fournis',
                'Assurance responsabilité civile',
                'Suivi qualité'
            ]
        };
    }

    currentServiceIndex = index;

    // 1. Mise à jour header infos prioritaires (nom > catégorie > rating > description)
    const selectors = {
        icon: `#service-icon-placeholder`,
        category: `#service-category-placeholder`,
        title: `#service-title-main`,
        rating: `#service-rating-main`,
        reviews: `#service-reviews-main`,
        difficulty: `#service-difficulty-main`,
        description: `#service-description-main`
    };

    const iconEl = document.querySelector(selectors.icon);
    const categoryEl = document.querySelector(selectors.category);
    const titleEl = document.querySelector(selectors.title);
    const ratingEl = document.querySelector(selectors.rating);
    const reviewsEl = document.querySelector(selectors.reviews);
    const difficultyEl = document.querySelector(selectors.difficulty);
    const descEl = document.querySelector(selectors.description);

    if (iconEl) iconEl.textContent = service.icon || '🏢';
    if (categoryEl) categoryEl.textContent = service.category?.charAt(0).toUpperCase() + service.category?.slice(1) || 'Professionnel';
    if (titleEl) titleEl.textContent = service.name;
    if (ratingEl) ratingEl.innerHTML = renderStarRating(service.rating || 4.5);
    if (reviewsEl) reviewsEl.textContent = `(${service.reviews || 0} avis clients)`;
    if (difficultyEl) {
        const difficultyText = { easy: 'Facile', medium: 'Intermédiaire', hard: 'Difficile' }[service.difficulty] || 'Intermédiaire';
        difficultyEl.textContent = difficultyText;
        difficultyEl.className = `badge px-3 py-1 rounded-full text-sm font-semibold ${
            service.difficulty === 'easy' ? 'bg-[rgba(144,238,144,0.2)] text-ll-dark-green dark:text-ll-white' : 
            service.difficulty === 'medium' ? 'bg-[rgba(37,99,235,0.2)] text-ll-blue dark:text-ll-white' : 'dark:bg-medium-gray bg-[rgba(27,27,24,0.2)] text-ll-black dark:text-ll-white'
        }`;
    }
    if (descEl) descEl.textContent = service.description;

    // 2. Grille d'images complète et professionnelle (sans carousel)
    const galleryEl = document.getElementById('service-images-gallery');
    if (galleryEl) {
        const images = service.images && service.images.length > 0 ? service.images : [
            { url: '/assets/images/services/default-service.jpg', type: 'default', description: 'Service professionnel L&L Ouest Services' }
        ];
        
        galleryEl.innerHTML = images.map((img, idx) => `
            <div class="service-image-item relative overflow-hidden rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-1 hover:scale-102 bg-gray-100 dark:bg-gray-800 hover:shadow-[0_8px_30px_rgba(37,99,235,0.2)]" data-aos="fade-up" data-aos-delay="${idx * 100}">
                <img src="${img.url}" alt="${img.description || service.name}" 
                     class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                     loading="${idx === 0 ? 'eager' : 'lazy'}"
                     onerror="this.src='/assets/images/services/default-service.jpg'">
                <div class="service-image-overlay absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4 transform translate-y-full transition-transform duration-300">
                    <p class="font-semibold">${img.description}</p>
                    <div class="flex items-center mt-1">
                        <span class="w-2 h-2 bg-white rounded-full mr-2"></span>
                        <span class="text-xs opacity-90">${idx + 1}/${images.length}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 3. Description détaillée avec mise en forme premium
    const fullDescEl = document.getElementById('service-full-description');
    if (fullDescEl) {
        const description = service.description || 'Service professionnel de qualité supérieure.';
        fullDescEl.innerHTML = `
            <div class="prose prose-lg max-w-none">
                <div class="bg-gradient-to-r from-ll-blue/5 to-ll-green/5 rounded-3xl p-6 mb-6 border-l-4 border-ll-blue">
                    <p class="text-lg leading-relaxed text-ll-text-gray dark:text-gray-300">${description}</p>
                </div>
                ${service.included_services ? `
                <div class="mt-8">
                    <h4 class="text-xl font-semibold text-ll-black dark:text-ll-white mb-4">Services Inclus</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        ${service.included_services.map(service => `
                            <div class="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                                <svg class="w-5 h-5 text-ll-dark-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="text-ll-text-gray dark:text-gray-300 text-sm">${service}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    // 4. Features en grille masonry premium
    const featuresEl = document.getElementById('service-features-detailed');
    if (featuresEl) {
        const features = service.features || ['Service professionnel de qualité'];
        const heightClasses = ['h-24', 'h-32', 'h-40', 'h-48'];
        const featureElements = features.map((feature, idx) => {
            const heightClass = heightClasses[idx % heightClasses.length] || 'h-32';
            
            return `
                <div class="feature-card h-30 group relative overflow-hidden bg-white dark:bg-gray-800 border border-[rgba(37,99,235,0.1)] dark:border-[rgba(37,99,235,0.2)] rounded-3xl p-6 transition-all duration-300 hover:border-ll-blue hover:shadow-[0_8px_25px_rgba(37,99,235,0.15)] hover:-translate-y-0.5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] flex items-start" 
                     data-aos="fade-up" data-aos-delay="${idx * 100}">
                    
                    <div class="flex items-start space-x-3 h-full relative z-10">
                        <div class="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-ll-blue to-ll-dark-blue rounded-full flex items-center justify-center mt-1 group-hover:scale-110 transition-transform duration-300">
                            <svg class="w-3 h-3 text-ll-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <p class="text-ll-text-gray dark:text-gray-300 text-sm leading-relaxed font-medium group-hover:text-ll-black dark:group-hover:text-ll-white transition-colors duration-300">${feature}</p>
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(37,99,235,0.05)] to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </div>
            `;
        }).join('');
        
        featuresEl.innerHTML = featureElements;
    }

    // 5. Équipements premium avec animations
    const equipmentEl = document.getElementById('service-equipment-detailed');
    if (equipmentEl) {
        const equipment = service.equipment || [];
        equipmentEl.innerHTML = equipment.map((eq, idx) => `
            <div class="equipment-item group relative perspective-[100px]" data-aos="zoom-in" data-aos-delay="${idx * 150}">
                <div class="w-full aspect-square bg-gradient-to-br from-ll-white to-ll-light-bg dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-lg hover:shadow-2xl border border-gray-200/50 dark:border-gray-700/50 transition-all duration-500 hover:scale-105 [transform-style:preserve-3d] hover:rotate-y-5 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                    <div class="text-5xl mb-3 transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2">
                        ${eq.icon}
                    </div>
                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ll-black/80 to-transparent p-4 text-center transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <span class="text-ll-white text-sm font-medium block">${eq.name}</span>
                    </div>
                    <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div class="w-6 h-6 bg-ll-blue rounded-full flex items-center justify-center">
                            <svg class="w-3 h-3 text-ll-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 6. Équipe professionnelle avec cartes détaillées
    const membersEl = document.getElementById('service-members-detailed');
    if (membersEl) {
        const members = service.members || [];
        membersEl.innerHTML = members.map((member, idx) => `
            <div class="team-member-card group" data-aos="fade-up" data-aos-delay="${idx * 200 * 3}">
                <div class="bg-ll-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:border-ll-blue/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
                    <div class="flex items-start space-x-4">
                        <div class="relative">
                            <img src="${member.photo}" alt="${member.name}" 
                                 class="w-16 h-16 md:w-20 md:h-20 rounded-3xl object-cover border-2 border-gray-200 dark:border-gray-700 group-hover:border-ll-blue transition-colors duration-300 shadow-lg"
                                 onerror="this.src='/assets/images/team/default-avatar.jpg'">
                            <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-ll-dark-green rounded-full border-2 border-ll-white dark:border-gray-800 flex items-center justify-center">
                                <svg class="w-3 h-3 text-ll-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="text-lg font-semibold text-ll-black dark:text-ll-white group-hover:text-ll-blue transition-colors duration-300 truncate">${member.name}</h3>
                            <p class="text-sm text-ll-blue dark:text-ll-blue font-medium mt-1">${member.role}</p>
                            ${member.experience ? `<p class="text-xs text-ll-text-gray dark:text-gray-400 mt-1">${member.experience} d'expérience</p>` : ''}
                            <div class="flex items-center mt-3 space-x-1">
                                ${renderStarRating(4.5, `member-${idx}-`)}
                                <span class="text-xs text-ll-text-gray dark:text-gray-400 ml-1">4.5/5</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 7. Section disponibilité et informations premium
    const updateInfoSection = (id, value, fallback = 'Non spécifié') => {
        const element = document.getElementById(id);
        if (element) element.textContent = value || fallback;
    };

    // Mise à jour des informations
    updateInfoSection('service-availability-detailed', 
        service.availability?.isAvailable ? '✅ Disponible' : '⏳ Sous 48h', 
        '✅ Disponible immédiatement');
    updateInfoSection('service-certification-detailed', service.certification, 'Certifications en cours');
    updateInfoSection('service-garantie-detailed', service.garantie, 'Garantie standard');
    updateInfoSection('service-delai-detailed', service.delai_intervention, 'Sous 48h');

    // 8. Horaires avec design premium
    const scheduleEl = document.getElementById('service-schedule-detailed');
    if (scheduleEl) {
        const schedule = service.availability?.schedule || [];
        scheduleEl.innerHTML = schedule.map((sch, idx) => `
            <li class="schedule-item" data-aos="fade-right" data-aos-delay="${idx * 100 *3}">
                <div class="flex items-center justify-between p-4 bg-ll-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-200/50 dark:border-gray-700/50 hover:border-ll-blue/30 transition-all duration-300 group">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-ll-blue/10 rounded-xl flex items-center justify-center group-hover:bg-ll-blue/20 transition-colors duration-300">
                            <span class="text-ll-blue font-semibold text-sm">${idx + 1}</span>
                        </div>
                        <span class="font-semibold text-ll-text-gray dark:text-gray-300 capitalize">${sch.day}</span>
                    </div>
                    <span class="text-ll-blue dark:text-ll-blue font-bold text-sm bg-ll-blue/10 px-3 py-1 rounded-full group-hover:bg-ll-blue/20 transition-colors duration-300">
                        ${Array.isArray(sch.hours) ? sch.hours.join(' - ') : sch.hours}
                    </span>
                </div>
            </li>
        `).join('');
    }

    // 9. Boutons CTA premium avec animations
    const bookBtns = document.querySelectorAll('#service-book-cta, #service-final-cta');
    bookBtns.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            reservation.openReservationModal(service, currentUser);
        };
        
        // Animation hover améliorée
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // 10. Initialisation des animations
    if (typeof AOS !== 'undefined') {
        setTimeout(() => AOS.refresh(), 500);
    }

    // 11. Mise à jour de la sidebar
    renderServicesSidebar(allServices);

    // 12. Scroll smooth vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });

    console.log('Service detail rendered professionally:', service.name);
}

/**
 * Chargement async principal avec gestion d'erreur robuste
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation du détail du service...');

    // Affichage loading par défaut (main loading + overlay visible)
    toggleServiceLoadingMain(true);

    try {
        // Chargement des données utilisateur
        currentUser = await loadUserData();
        
        // Récupération de l'ID du service et paramètre reserve
        const urlParams = new URLSearchParams(window.location.search);
        const serviceId = urlParams.get('service') || urlParams.get('id');
        const reserveParam = urlParams.get('reserve') === 'true';

        if (!serviceId) {
            console.warn('Aucun ID de service trouvé');
            renderContent(false);
            return;
        }

        // Chargement des services
        allServices = await loadServices({});

        const serviceIndex = allServices.findIndex(s => {
            const id = s.id || s.name?.toLowerCase().replace(/\s+/g, '-');
            return id === serviceId;
        });

        if (serviceIndex === -1) {
            console.error('Service non trouvé:', serviceId);
            renderContent(false);
            return;
        }

        // Service trouvé: navigation et rendu
        navigateService(null, serviceIndex);
        renderContent(true, allServices[serviceIndex], serviceIndex, allServices.length);

        // Vérifier si ouverture directe de la modale de réservation
        if (reserveParam) {
            reservation.openReservationModal(allServices[serviceIndex], currentUser);
        }

        // Initialisation du système de réservation (seulement si formulaire présent)
        if (document.getElementById('reservation-form')) {
            reservation.init();
        }

        console.log('✅ Service détail chargé avec succès');

    } catch (error) {
        console.error('❌ Erreur critique lors du chargement:', error);
        showNotification('Erreur lors du chargement du service.', 'error');
        renderContent(false);
    } finally {

        toggleServiceLoadingMain(false);
    }
});