/**
 * @file animation.js
 * @description Module de gestion des animations globales pour L&L Ouest Services.
 * Ce module gère les carrousels Swiper avancés, les sliders avant/après avec support tactile et accessibilité, les interactions utilisateur dynamiques,
 * les filtres de services avec animations fluides, les animations Lottie pour les états de chargement et interactions, les modales futuristes avec effets 3D,
 * le thème sombre/clair avec transitions douces, les particules interactives pour un design futuriste, les scroll animations avec AOS personnalisé,
 * et des sections supplémentaires pour FAQ, équipe, partenaires, blog, événements, galerie, statistiques, tarification, et contacts.
 * Le design est ultra professionnel et futuriste avec des effets néon, gradients, et animations CSS/JS avancées.
 * Le module est optimisé pour les performances, avec lazy loading, debounce, et gestion des ressources.
 * @requires AOS
 * @requires Swiper
 * @requires SweetAlert2
 * @requires lottie-web
 * @requires utils.js
 * @requires api.js
 * @requires loadService.js
 */

// Imports essentiels
import { showNotification, openLightbox } from '../modules/utils.js';
import api from '../api.js';
import { renderServices, loadServices } from '../injection/loadService.js';

// Icônes SVG pour catégories avec effets néon
const categoryIcons = {
  all: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><path d="M3 3h18v18H3z"></path><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>`,
  bureaux: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M6 8h12"></path><path d="M6 12h12"></path><path d="M6 16h12"></path></svg>`,
  piscine: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><path d="M2 14h2l2-2 2 4 2-2 2 4 2-2 2 4h2"></path><path d="M2 18h2l2-2 2 4 2-2 2 4 2-2 2 4h2"></path></svg>`,
  régulier: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
  ponctuel: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  salles_de_réunion: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 3v18"></path><path d="M9 9h12"></path></svg>`,
  sas_dentrée: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M12 7v10"></path></svg>`,
  réfectoire: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><path d="M4 12h16"></path><path d="M4 6h16"></path><path d="M4 18h16"></path></svg>`,
  sanitaires: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><path d="M12 3v18"></path><path d="M6 12h12"></path></svg>`,
  escaliers: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><path d="M4 4h6v6H4z"></path><path d="M14 4h6v6h-6z"></path><path d="M4 14h6v6H4z"></path><path d="M14 14h6v6h-6z"></path></svg>`,
  vitrines: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M2 10h20"></path></svg>`,
  industriel: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><path d="M2 20h20V4H2z"></path><path d="M6 4v16"></path><path d="M10 4v16"></path><path d="M14 4v16"></path><path d="M18 4v16"></path></svg>`,
  commercial: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 9h6v6H9z"></path></svg>`,
  residentiel: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><path d="M3 12l9-9 9 9"></path><path d="M5 10v10a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V10"></path></svg>`,
  medical: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><path d="M12 2v20"></path><path d="M4 10h16"></path><path d="M4 14h16"></path></svg>`,
  education: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M12 3v18"></path><path d="M3 12h18"></path></svg>`,
  hotelier: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M6 10h.01"></path><path d="M6 14h.01"></path><path d="M10 10h.01"></path><path d="M10 14h.01"></path><path d="M14 10h.01"></path><path d="M14 14h.01"></path><path d="M18 10h.01"></path><path d="M18 14h.01"></path></svg>`,
  restaurant: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><path d="M4 12h16"></path><path d="M4 6h16"></path><path d="M4 18h16"></path></svg>`,
  gym: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><path d="M4 7h16v10H4z"></path><path d="M8 10v4"></path><path d="M12 10v4"></path><path d="M16 10v4"></path></svg>`,
  parking: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M8 8h8v8H8z"></path></svg>`,
  jardin: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><path d="M12 3v18"></path><path d="M6 9h12"></path><path d="M4 15h16"></path></svg>`,
  facade: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M6 8v8"></path><path d="M10 8v8"></path><path d="M14 8v8"></path><path d="M18 8v8"></path></svg>`,
  toiture: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><path d="M3 12l9-9 9 9"></path><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"></path></svg>`,
  evenementiel: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ll-blue hover:text-ll-dark-blue"><path d="M12 2v4"></path><path d="M2 12h4"></path><path d="M12 18v4"></path><path d="M18 12h4"></path><path d="M4 4l16 16"></path><path d="M4 20L20 4"></path></svg>`,
};



 // Icônes d'expansion/collapse
  const expandIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>`;
  const collapseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500">
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>`;

// Données mock étendues
let MOCK_CATEGORIES = [];
let MOCK_TESTIMONIALS = [];
let MOCK_SERVICES = [];
let MOCK_FAQ = [];
let MOCK_TEAM = [];
let MOCK_PARTNERS = [];
let MOCK_BLOG_POSTS = [];
let MOCK_EVENTS = [];
let MOCK_GALLERY = [];
let MOCK_STATS = [];
let MOCK_PRICING = [];
let MOCK_CONTACTS = [];
let WHY_US_DATA = [];
let ECO_DATA = [];

/**
 * Charge les données mock depuis JSON avec fallback détaillé et logs.
 * @async
 */
async function loadMockData() {
  try {
    const categoriesResponse = await fetch('/assets/json/mock/mock-categories.json');
    if (categoriesResponse.ok) {
      MOCK_CATEGORIES = await categoriesResponse.json();
      MOCK_CATEGORIES = [
        { id: 'all', name: 'Tout', icon: categoryIcons.all },
        ...MOCK_CATEGORIES,
        { id: 'industriel', name: 'Industriel', icon: categoryIcons.industriel },
        { id: 'commercial', name: 'Commercial', icon: categoryIcons.commercial },
        { id: 'residentiel', name: 'Résidentiel', icon: categoryIcons.residentiel },
        { id: 'medical', name: 'Médical', icon: categoryIcons.medical },
        { id: 'education', name: 'Éducation', icon: categoryIcons.education },
        { id: 'hotelier', name: 'Hôtelier', icon: categoryIcons.hotelier },
        { id: 'restaurant', name: 'Restaurant', icon: categoryIcons.restaurant },
        { id: 'gym', name: 'Gym', icon: categoryIcons.gym },
        { id: 'parking', name: 'Parking', icon: categoryIcons.parking },
        { id: 'jardin', name: 'Jardin', icon: categoryIcons.jardin },
        { id: 'facade', name: 'Façade', icon: categoryIcons.facade },
        { id: 'toiture', name: 'Toiture', icon: categoryIcons.toiture },
        { id: 'evenementiel', name: 'Événementiel', icon: categoryIcons.evenementiel },
      ];
    } else {
      throw new Error('Échec du chargement des catégories');
    }

    const testimonialsResponse = await fetch('/assets/json/mock/mock-testimonials.json');
    if (testimonialsResponse.ok) {
      MOCK_TESTIMONIALS = await testimonialsResponse.json();
      MOCK_TESTIMONIALS.push(
        {
          id: 't4',
          text: 'Excellente équipe, résultats impeccables.',
          author: 'Paul Martin',
          title: 'Directeur',
          rating: 5,
          image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
          details: 'Service rapide avec une attention particulière aux détails, utilisant des produits écologiques.',
        },
        {
          id: 't5',
          text: 'Service rapide et efficace pour notre bureau.',
          author: 'Sophie Laurent',
          title: 'Manager',
          rating: 4,
          image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
          details: 'Le nettoyage a été effectué en moins de 2 heures, avec une grande précision.',
        },
        {
          id: 't6',
          text: 'Parfait pour nos besoins industriels.',
          author: 'Luc Dubois',
          title: 'Ingénieur',
          rating: 4,
          image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
          details: 'Utilisation de technologies avancées pour un nettoyage en profondeur.',
        },
        {
          id: 't7',
          text: 'Un service client exceptionnel et des résultats au-delà des attentes.',
          author: 'Clara Moreau',
          title: 'Responsable RH',
          rating: 5,
          image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
          details: 'Le personnel était courtois et très professionnel.',
        },
        {
          id: 't8',
          text: 'Nettoyage impeccable pour notre restaurant.',
          author: 'Antoine Lefèvre',
          title: 'Chef Restaurateur',
          rating: 4,
          image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
          details: 'Service adapté aux normes d’hygiène strictes de la restauration.',
        },
        {
          id: 't9',
          text: 'Ils ont transformé notre espace commercial.',
          author: 'Émilie Bernard',
          title: 'Directrice Commerciale',
          rating: 4,
          image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
          details: 'Travail rapide et soigné, avec des produits respectueux de l’environnement.',
        },
        {
          id: 't10',
          text: 'Service fiable pour notre école.',
          author: 'Marc Dubois',
          title: 'Directeur d’École',
          rating: 4,
          image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
          details: 'Nettoyage complet des salles de classe avec des produits sans allergènes.',
        },
        {
          id: 't11',
          text: 'Parfait pour nos événements spéciaux.',
          author: 'Julie Renaud',
          title: 'Organisatrice d’Événements',
          rating: 5,
          image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
          details: 'Service ponctuel et flexible, adapté à nos besoins.',
        },
        {
          id: 't12',
          text: 'Nettoyage écologique de haute qualité.',
          author: 'Thomas Leroy',
          title: 'Particulier',
          rating: 4,
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
          details: 'Utilisation de produits biodégradables, très appréciée.',
        },
        {
          id: 't13',
          text: 'Service rapide pour notre hôtel.',
          author: 'Laura Petit',
          title: 'Directrice d’Hôtel',
          rating: 4,
          image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
          details: 'Nettoyage complet des chambres en un temps record.',
        }
      );
    } else {
      throw new Error('Échec du chargement des témoignages');
    }

    const faqResponse = await fetch('/assets/json/mock/mock-faq.json');
    if (faqResponse.ok) {
      MOCK_FAQ = await faqResponse.json();
    } else {
     

        MOCK_FAQ = [
    {
      question: 'Quels sont vos tarifs ?',
      answer: 'Nos <span class="highlight text-blue-500 font-semibold">tarifs</span> sont établis sur mesure, en fonction de la <span class="highlight text-blue-500 font-semibold">surface à nettoyer</span>, de la fréquence des interventions et des services spécifiques que vous souhaitez. N\'hésitez pas à nous contacter pour un <span class="highlight text-blue-500 font-semibold">devis gratuit</span> et sans engagement !',
      category: 'tarifs',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>`
    },
    {
      question: 'Utilisez-vous des produits écologiques ?',
      answer: 'Absolument. Nous sommes engagés dans une démarche <span class="highlight text-green-500 font-semibold">éco-responsable</span> et privilégions l\'utilisation de <span class="highlight text-green-500 font-semibold">produits certifiés biodégradables</span> et non toxiques pour l\'environnement et la santé de nos clients.',
      category: 'ecologie',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500">
        <path d="M4 20h16"></path>
        <path d="m6.9 15-3.9 5"></path>
        <path d="m10.2 12.6-6.2 8.3"></path>
        <path d="m8 11 3-4 2 6 3-4c.5-.3 1.3-.3 1.5.2.3.5 0 1.3-.5 1.5l-3.5 2"></path>
        <path d="m22 2-3 7c-.5 1.1-2.2 1-2.9-.2-.8-1.3 0-2.8 1.4-3l2-1"></path>
      </svg>`
    },
    {
      question: 'Dans quelles régions intervenez-vous ?',
      answer: 'Nous couvrons l\'ensemble de l\'<span class="highlight text-purple-500 font-semibold">Ouest de la France</span>, incluant la <span class="highlight text-purple-500 font-semibold">Bretagne</span>, les <span class="highlight text-purple-500 font-semibold">Pays de la Loire</span>, et une partie de la <span class="highlight text-purple-500 font-semibold">Normandie</span> et de la <span class="highlight text-purple-500 font-semibold">Nouvelle-Aquitaine</span>. Pour plus de précisions, veuillez nous contacter.',
      category: 'regions',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-500">
        <circle cx="12" cy="10" r="3"></circle>
        <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"></path>
      </svg>`
    },
    {
      question: 'Quels types de services proposez-vous ?',
      answer: 'Nous offrons une gamme complète de <span class="highlight text-blue-500 font-semibold">services de nettoyage</span>, incluant le ménage domestique, le nettoyage commercial, et des services spécialisés comme le nettoyage de vitres ou après travaux. Consultez notre page services pour plus de détails.',
      category: 'tarifs',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500">
        <path d="M20 6 9 17l-5-5"></path>
      </svg>`
    },
    {
      question: 'Vos produits sont-ils sans danger pour les animaux ?',
      answer: 'Oui, nos <span class="highlight text-green-500 font-semibold">produits écologiques</span> sont conçus pour être sans danger pour les <span class="highlight text-green-500 font-semibold">animaux domestiques</span> et les enfants, tout en étant efficaces pour un nettoyage en profondeur.',
      category: 'ecologie',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500">
        <path d="M4 20h16"></path>
        <path d="m6.9 15-3.9 5"></path>
        <path d="m10.2 12.6-6.2 8.3"></path>
        <path d="m8 11 3-4 2 6 3-4c.5-.3 1.3-.3 1.5.2.3.5 0 1.3-.5 1.5l-3.5 2"></path>
        <path d="m22 2-3 7c-.5 1.1-2.2 1-2.9-.2-.8-1.3 0-2.8 1.4-3l2-1"></path>
      </svg>`
    }
  ];

    }

    const teamResponse = await fetch('/assets/json/mock/mock-team.json');
    if (teamResponse.ok) {
      MOCK_TEAM = await teamResponse.json();
    } else {

    MOCK_TEAM = [
    {
        name: "John Doe",
        role: "Directeur Général",
        roleCategory: "management",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        bio: "Fondateur de L&L Ouest Services, John dirige l’entreprise avec une vision axée sur l’écologie et l’excellence. Avec plus de 15 ans d’expérience, il a transformé le secteur du nettoyage en intégrant des pratiques durables.",
        skills: [
            { name: "Leadership", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20 7h-10'></path><path d='M14 17H4'></path><circle cx='17' cy='17' r='3'></circle><circle cx='7' cy='7' r='3'></circle></svg>", level: 95 },
            { name: "Stratégie", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 8V4'></path><path d='M10 12h4'></path></svg>", level: 90 },
            { name: "Écologie", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5Z'></path><path d='m12 12 3.5 3.5L19 12l-3.5-3.5L12 12Z'></path></svg>", level: 92 }
        ],
        certifications: ["MBA en Gestion d’Entreprise", "Certification Éco-Entrepreneur", "Leadership Durable"],
        performance: {
            Leadership: 95,
            "Satisfaction Client": 90,
            Innovation: 85,
            "Gestion Budgétaire": 88
        },
        actionImages: [
            "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
        ],
        socialLinks: {
            linkedin: "https://www.linkedin.com/in/johndoe",
            email: "john.doe@llouestservices.fr",
            phone: "+33 6 12 34 56 78"
        },
        yearsExperience: 15,
        availability: "Sur rendez-vous",
        education: ["Master en Administration des Affaires, HEC Paris"],
        languages: ["Français", "Anglais", "Espagnol"],
        projectsCompleted: 120
    },
    {
        name: "Jane Smith",
        role: "Directrice des Opérations",
        roleCategory: "management",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        bio: "Jane excelle dans la coordination des équipes pour garantir des opérations fluides et efficaces. Diplômée en management opérationnel, elle optimise nos processus pour une qualité de service exceptionnelle.",
        skills: [
            { name: "Gestion de Projet", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect><line x1='16' y1='2' x2='16' y2='6'></line><line x1='8' y1='2' x2='8' y2='6'></line><line x1='3' y1='10' x2='21' y2='10'></line></svg>", level: 92 },
            { name: "Planification", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path><polyline points='14 2 14 8 20 8'></polyline></svg>", level: 94 },
            { name: "Communication", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path></svg>", level: 90 }
        ],
        certifications: ["PMP Certification", "Lean Six Sigma Green Belt", "Management Agile"],
        performance: {
            "Efficacité Opérationnelle": 92,
            "Satisfaction Équipe": 88,
            "Respect des Délais": 90,
            "Optimisation Processus": 91
        },
        actionImages: [
            "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
        ],
        socialLinks: {
            linkedin: "https://www.linkedin.com/in/janesmith",
            email: "jane.smith@llouestservices.fr",
            phone: "+33 6 23 45 67 89"
        },
        yearsExperience: 12,
        availability: "Disponible en semaine",
        education: ["Licence en Management Opérationnel, ESSEC"],
        languages: ["Français", "Anglais"],
        projectsCompleted: 85
    },
    {
        name: "Luc Martin",
        role: "Responsable Technique",
        roleCategory: "technical",
        image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
        bio: "Luc est un expert des équipements de nettoyage de pointe, garantissant des résultats impeccables. Ingénieur de formation, il supervise l’ensemble de nos équipements et processus techniques.",
        skills: [
            { name: "Maintenance Équipements", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'></path></svg>", level: 96 },
            { name: "Technologie Verte", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5Z'></path><path d='m12 12 3.5 3.5L19 12l-3.5-3.5L12 12Z'></path></svg>", level: 93 },
            { name: "Formation Technique", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 20h9'></path><path d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'></path></svg>", level: 89 }
        ],
        certifications: ["Ingénieur en Génie Chimique", "Certification Hygiène et Sécurité", "Expert en Nettoyage Industriel"],
        performance: {
            Maintenance: 90,
            "Innovation Technique": 85,
            Fiabilité: 88,
            "Sécurité Équipements": 92
        },
        actionImages: [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
        ],
        socialLinks: {
            linkedin: "https://www.linkedin.com/in/lucmartin",
            email: "luc.martin@llouestservices.fr",
            phone: "+33 6 34 56 78 90"
        },
        yearsExperience: 10,
        availability: "Disponible sur site",
        education: ["Diplôme d’Ingénieur, École Centrale Paris"],
        languages: ["Français", "Anglais", "Allemand"],
        projectsCompleted: 65
    },
    {
        name: "Clara Dubois",
        role: "Responsable Marketing",
        roleCategory: "management",
        image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
        bio: "Clara conçoit des campagnes innovantes pour promouvoir nos services écologiques, renforçant la visibilité de L&L Ouest Services auprès des clients.",
        skills: [
            { name: "Marketing Digital", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='4' width='20' height='16' rx='2'></rect><path d='M10 10h4'></path><path d='M12 12v6'></path><path d='M10 18h4'></path></svg>", level: 88 },
            { name: "Communication", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path></svg>", level: 90 },
            { name: "Stratégie de Marque", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 8V4'></path><path d='M10 12h4'></path></svg>", level: 87 }
        ],
        certifications: ["Google Ads Certification", "Marketing Stratégique", "SEO Avancé"],
        performance: {
            "Engagement Client": 88,
            "Campagnes Réussies": 90,
            Créativité: 85,
            "Visibilité Marque": 89
        },
        actionImages: [
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
        ],
        socialLinks: {
            linkedin: "https://www.linkedin.com/in/claradubois",
            email: "clara.dubois@llouestservices.fr",
            phone: "+33 6 45 67 89 01"
        },
        yearsExperience: 8,
        availability: "Disponible en semaine",
        education: ["Master en Marketing, Sorbonne Université"],
        languages: ["Français", "Anglais", "Italien"],
        projectsCompleted: 50
    },
    {
        name: "Antoine Lefèvre",
        role: "Agent de Nettoyage",
        roleCategory: "cleaning",
        image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
        bio: "Antoine excelle dans le nettoyage des espaces professionnels avec une attention méticuleuse aux détails, garantissant des environnements impeccables.",
        skills: [
            { name: "Nettoyage Général", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M10 5v3'></path><path d='M14 5v3'></path><path d='M10 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4'></path><path d='M8 17l2-2 2 2'></path></svg>", level: 85 },
            { name: "Dépoussiérage", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20 6H4'></path><path d='M14 12H4'></path><path d='M16 18H4'></path></svg>", level: 88 },
            { name: "Produits Écologiques", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5Z'></path><path d='m12 12 3.5 3.5L19 12l-3.5-3.5L12 12Z'></path></svg>", level: 90 }
        ],
        certifications: ["Formation Nettoyage Professionnel", "Certificat Produits Écologiques", "Hygiène et Sécurité"],
        performance: {
            Efficacité: 85,
            "Satisfaction Client": 90,
            Précision: 88,
            Ponctualité: 87
        },
        actionImages: [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
        ],
        socialLinks: {
            linkedin: "https://www.linkedin.com/in/antoinelefevre",
            email: "antoine.lefevre@llouestservices.fr",
            phone: "+33 6 56 78 90 12"
        },
        yearsExperience: 5,
        availability: "Disponible tous les jours",
        education: ["CAP Propreté"],
        languages: ["Français"],
        projectsCompleted: 200
    },
    {
        name: "Émilie Bernard",
        role: "Spécialiste Nettoyage de Vitres",
        roleCategory: "cleaning",
        image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
        bio: "Émilie est experte dans le nettoyage des vitres, assurant une clarté impeccable, même en hauteur, avec un focus sur la sécurité.",
        skills: [
            { name: "Nettoyage de Vitres", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'></rect><line x1='3' y1='9' x2='21' y2='9'></line><line x1='3' y1='15' x2='21' y2='15'></line></svg>", level: 92 },
            { name: "Travail en Hauteur", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M8 3L12 7L16 3'></path><path d='M12 22V7'></path></svg>", level: 90 },
            { name: "Sécurité", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'></path></svg>", level: 95 }
        ],
        certifications: ["CACES Nacelle", "Formation Sécurité Vitres", "Certificat Travail en Hauteur"],
        performance: {
            Précision: 92,
            Rapidité: 85,
            "Satisfaction Client": 90,
            Sécurité: 95
        },
        actionImages: [
            "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
        ],
        socialLinks: {
            linkedin: "https://www.linkedin.com/in/emiliebernard",
            email: "emilie.bernard@llouestservices.fr",
            phone: "+33 6 67 89 01 23"
        },
        yearsExperience: 7,
        availability: "Disponible sur rendez-vous",
        education: ["BEP Métiers de l’Hygiène"],
        languages: ["Français", "Anglais"],
        projectsCompleted: 150
    },
    {
        name: "Marc Dubois",
        role: "Spécialiste Dépoussiérage",
        roleCategory: "cleaning",
        image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        bio: "Marc maîtrise l’art du dépoussiérage pour des environnements sains et propres, utilisant des techniques écologiques avancées.",
        skills: [
            { name: "Dépoussiérage", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20 6H4'></path><path d='M14 12H4'></path><path d='M16 18H4'></path></svg>", level: 90 },
            { name: "Produits Écologiques", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5Z'></path><path d='m12 12 3.5 3.5L19 12l-3.5-3.5L12 12Z'></path></svg>", level: 88 },
            { name: "Précision", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'></circle><polyline points='12 6 12 12 16.5 12'></polyline></svg>", level: 85 }
        ],
        certifications: ["Formation Nettoyage Écologique", "Certificat Hygiène", "Techniques de Dépoussiérage Avancées"],
        performance: {
            Efficacité: 88,
            "Satisfaction Client": 85,
            Précision: 90,
            "Utilisation Éco-Produits": 87
        },
        actionImages: [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
        ],
        socialLinks: {
            linkedin: "https://www.linkedin.com/in/marcDubois",
            email: "marc.dubois@llouestservices.fr",
            phone: "+33 6 78 90 12 34"
        },
        yearsExperience: 6,
        availability: "Disponible tous les jours",
        education: ["CAP Propreté"],
        languages: ["Français"],
        projectsCompleted: 180
    },
    {
        name: "Julie Renaud",
        role: "Coordinatrice Événements",
        roleCategory: "management",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        bio: "Julie organise des services de nettoyage pour des événements avec une précision remarquable, assurant des espaces parfaits pour chaque occasion.",
        skills: [
            { name: "Organisation d’Événements", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect><line x1='16' y1='2' x2='16' y2='6'></line><line x1='8' y1='2' x2='8' y2='6'></line><line x1='3' y1='10' x2='21' y2='10'></line></svg>", level: 90 },
            { name: "Coordination", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'></path><circle cx='8.5' cy='7' r='4'></circle><polyline points='17 11 19 13 23 9'></polyline></svg>", level: 88 },
            { name: "Logistique", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'></path><circle cx='12' cy='10' r='3'></circle></svg>", level: 85 }
        ],
        certifications: ["Événementiel Professionnel", "Gestion de Projet Événementiel", "Logistique Avancée"],
        performance: {
            Organisation: 90,
            "Satisfaction Client": 85,
            Flexibilité: 88,
            "Coordination Équipe": 87
        },
        actionImages: [
            "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
        ],
        socialLinks: {
            linkedin: "https://www.linkedin.com/in/julierenaud",
            email: "julie.renaud@llouestservices.fr",
            phone: "+33 6 89 01 23 45"
        },
        yearsExperience: 9,
        availability: "Disponible sur rendez-vous",
        education: ["Licence en Gestion Événementielle, IUT Paris"],
        languages: ["Français", "Anglais"],
        projectsCompleted: 70
    },
    {
        name: "Thomas Leroy",
        role: "Formateur Nettoyage",
        roleCategory: "technical",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        bio: "Thomas forme les équipes aux techniques de nettoyage modernes et écologiques, renforçant leurs compétences pour des résultats optimaux.",
        skills: [
            { name: "Formation", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 20h9'></path><path d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'></path></svg>", level: 90 },
            { name: "Techniques de Nettoyage", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M10 5v3'></path><path d='M14 5v3'></path><path d='M10 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4'></path><path d='M8 17l2-2 2 2'></path></svg>", level: 88 },
            { name: "Écologie", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5Z'></path><path d='m12 12 3.5 3.5L19 12l-3.5-3.5L12 12Z'></path></svg>", level: 85 }
        ],
        certifications: ["Formateur Agréé", "Certificat Nettoyage Écologique", "Pédagogie Active"],
        performance: {
            Formation: 90,
            "Engagement Équipe": 88,
            Innovation: 85,
            Pédagogie: 87
        },
        actionImages: [
            "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
        ],
        socialLinks: {
            linkedin: "https://www.linkedin.com/in/thomasleroy",
            email: "thomas.leroy@llouestservices.fr",
            phone: "+33 6 90 12 34 56"
        },
        yearsExperience: 8,
        availability: "Disponible en semaine",
        education: ["Licence en Formation Professionnelle, CNAM"],
        languages: ["Français", "Anglais"],
        projectsCompleted: 60
    },
    {
        name: "Laura Petit",
        role: "Assistante Administrative",
        roleCategory: "management",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        bio: "Laura gère les plannings et réservations avec une organisation irréprochable, assurant une coordination fluide pour nos clients.",
        skills: [
            { name: "Organisation", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect><line x1='16' y1='2' x2='16' y2='6'></line><line x1='8' y1='2' x2='8' y2='6'></line><line x1='3' y1='10' x2='21' y2='10'></line></svg>", level: 90 },
            { name: "Gestion Administrative", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path><polyline points='14 2 14 8 20 8'></polyline></svg>", level: 88 },
            { name: "Service Client", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path></svg>", level: 92 }
        ],
        certifications: ["Formation Gestion Administrative", "Certificat Service Client", "Bureautique Avancée"],
        performance: {
            Organisation: 90,
            "Satisfaction Client": 92,
            Efficacité: 88,
            "Gestion des Plannings": 89
        },
        actionImages: [
            "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
        ],
        socialLinks: {
            linkedin: "https://www.linkedin.com/in/laurapetit",
            email: "laura.petit@llouestservices.fr",
            phone: "+33 6 01 23 45 67"
        },
        yearsExperience: 6,
        availability: "Disponible en semaine",
        education: ["BTS Assistant de Gestion, Lycée Saint-Louis"],
        languages: ["Français", "Anglais"],
        projectsCompleted: 100
    },
    {
        name: "Sophie Lambert",
        role: "Superviseuse Nettoyage Écologique",
        roleCategory: "cleaning",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        bio: "Sophie supervise les équipes de nettoyage écologique, assurant l’utilisation de produits respectueux de l’environnement pour des résultats durables.",
        skills: [
            { name: "Nettoyage Écologique", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5Z'></path><path d='m12 12 3.5 3.5L19 12l-3.5-3.5L12 12Z'></path></svg>", level: 90 },
            { name: "Supervision", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'></path><circle cx='8.5' cy='7' r='4'></circle><polyline points='17 11 19 13 23 9'></polyline></svg>", level: 88 },
            { name: "Contrôle Qualité", icon: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'></polyline></svg>", level: 85 }
        ],
        certifications: ["Certificat Nettoyage Écologique", "Formation Supervision", "Contrôle Qualité ISO"],
        performance: {
            "Qualité du Travail": 90,
            "Satisfaction Client": 88,
            Leadership: 85,
            "Utilisation Éco-Produits": 87
        },
        actionImages: [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
        ],
        socialLinks: {
            linkedin: "https://www.linkedin.com/in/sophielambert",
            email: "sophie.lambert@llouestservices.fr",
            phone: "+33 6 12 34 56 78"
        },
        yearsExperience: 7,
        availability: "Disponible tous les jours",
        education: ["BEP Métiers de l’Hygiène"],
        languages: ["Français"],
        projectsCompleted: 140
    }
];



    }

    const partnersResponse = await fetch('/assets/json/mock/mock-partners.json');
    if (partnersResponse.ok) {
      MOCK_PARTNERS = await partnersResponse.json();
    } else {
     
       MOCK_PARTNERS = [
            {
                name: "Hilton Hotels & Resorts",
                logo: "https://seeklogo.com/images/H/hilton-hotels-resorts-logo-304F248592-seeklogo.com.png",
                description: "Une collaboration pour garantir une expérience client irréprochable. Notre engagement commun pour l'hygiène et le confort soutient leur réputation mondiale d'excellence.",
                website: "https://www.hilton.com"
            },
            {
                name: "JLL",
                logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/JLL_logo.svg/2560px-JLL_logo.svg.png",
                description: "Recommandé pour la valorisation et l'entretien d'actifs immobiliers prestigieux. JLL nous choisit pour notre fiabilité et notre capacité à maintenir des standards élevés.",
                website: "https://www.jll.com"
            },
            {
                name: "WeWork",
                logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/WeWork_logo.svg/2560px-WeWork_logo.svg.png",
                description: "Partenaire de confiance pour des espaces de travail sains et créatifs. Nous assurons un environnement impeccable pour stimuler le bien-être et la productivité.",
                website: "https://www.wework.com"
            },
            {
                name: "Westfield",
                logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Westfield_Logo.svg/2560px-Westfield_Logo.svg.png",
                description: "Assurer une expérience premium dans des zones à très fort trafic. Nos équipes relèvent le défi quotidien de la propreté avec efficacité et discrétion.",
                website: "https://www.westfield.com"
            },
            {
                name: "Equinox",
                logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Equinox_Hotels_logo.svg/1280px-Equinox_Hotels_logo.svg.png",
                description: "Maintenir des standards d'hygiène stricts pour une clientèle exigeante. Equinox valorise notre engagement envers la sécurité et la satisfaction de leurs membres.",
                website: "https://www.equinox.com"
            }
        ];

        
    }

    const blogResponse = await fetch('/assets/json/mock/mock-blog-posts.json');
    if (blogResponse.ok) {
      MOCK_BLOG_POSTS = await blogResponse.json();
    } else {
      MOCK_BLOG_POSTS = [
        { id: 'b1', title: 'Comment choisir un service de nettoyage ?', content: 'Conseils pour sélectionner le bon service.', date: '2025-08-01', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
        { id: 'b2', title: 'Les avantages du nettoyage écologique', content: 'Pourquoi opter pour des produits verts.', date: '2025-07-15', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
        { id: 'b3', title: 'Entretien des bureaux : nos astuces', content: 'Maintenir un espace de travail propre.', date: '2025-06-30', image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
        { id: 'b4', title: 'Nettoyage événementiel : ce qu’il faut savoir', content: 'Préparer vos événements avec soin.', date: '2025-06-15', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
        { id: 'b5', title: 'L’importance de la propreté en milieu médical', content: 'Normes strictes pour la santé.', date: '2025-05-20', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      ];
    }

    const eventsResponse = await fetch('/assets/json/mock/mock-events.json');
    if (eventsResponse.ok) {
      MOCK_EVENTS = await eventsResponse.json();
    } else {
      MOCK_EVENTS = [
        { id: 'e1', title: 'Salon du Nettoyage Écologique', date: '2025-09-10', location: 'Nantes', description: 'Découvrez nos innovations.' },
        { id: 'e2', title: 'Atelier Propreté', date: '2025-10-05', location: 'Rennes', description: 'Formation sur les techniques modernes.' },
        { id: 'e3', title: 'Conférence Durabilité', date: '2025-11-20', location: 'Brest', description: 'Engagement pour un avenir vert.' },
      ];
    }

    const galleryResponse = await fetch('/assets/json/mock/mock-gallery.json');
    if (galleryResponse.ok) {
      MOCK_GALLERY = await galleryResponse.json();
    } else {
      MOCK_GALLERY = [
        { id: 'g1', src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', alt: 'Nettoyage de bureau' },
        { id: 'g2', src: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', alt: 'Nettoyage industriel' },
        { id: 'g3', src: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', alt: 'Piscine propre' },
      ];
    }

    const statsResponse = await fetch('/assets/json/mock/mock-stats.json');
    if (statsResponse.ok) {
      MOCK_STATS = await statsResponse.json();
    } else {
      MOCK_STATS = [
            {
                label: "Clients Satisfaits",
                value: 1500,
                unit: "+",
                svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-4 text-ll-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0-12l-1 3m5-3l1 3m5-3l1 3m-5 3v6m-2-6v6m2-6l-1 3m-2-3l-1 3" />
                </svg>`, // Icon for clients (group of people)
                description: "Plus de 1500 clients fidèles dans divers secteurs."
            },
            {
                label: "Années d'Expérience",
                value: 20,
                unit: "+",
                svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-4 text-ll-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>`, // Icon for calendar
                description: "20 ans d'expertise en services de nettoyage professionnels."
            },
            {
                label: "Interventions Réalisées",
                value: 5000,
                unit: "+",
                svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-4 text-ll-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>`, // Icon for broom/cleaning
                description: "Plus de 5000 missions de nettoyage accomplies avec succès."
            },
            {
                label: "Équipes Professionnelles",
                value: 30,
                unit: "+",
                svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-4 text-ll-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>`, // Icon for team
                description: "30 équipes qualifiées pour un service impeccable."
            },
            {
                label: "Produits Éco-labellisés",
                value: 100,
                unit: "%",
                svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-4 text-ll-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.372V17.25m-6 0V15m0-5.25v1.5m0 3v1.5m0 3V21m3.75-3v1.5m0-3V15m0-5.25v1.5m0 3v1.5m0 3V21M15 9a3 3 0 100-6H9a3 3 0 000 6h6zm-3 3a3 3 0 100-6H9a3 3 0 000 6h3z" />
                </svg>`, // Icon for leaf/eco
                description: "100% de produits respectueux de l'environnement."
            }
        ];
    }

    const pricingResponse = await fetch('/assets/json/mock/mock-pricing.json');
    if (pricingResponse.ok) {
      MOCK_PRICING = await pricingResponse.json();
    } else {
      MOCK_PRICING = [
        { id: 'p1', name: 'Basique', price: 99, features: ['Nettoyage régulier', 'Produits standards', 'Support email'] },
        { id: 'p2', name: 'Pro', price: 199, features: ['Nettoyage avancé', 'Produits écologiques', 'Support prioritaire'] },
        { id: 'p3', name: 'Premium', price: 299, features: ['Nettoyage complet', 'Produits écologiques', 'Support 24/7', 'Rapport détaillé'] },
      ];
    }

    const contactsResponse = await fetch('/assets/json/mock/mock-contacts.json');
    if (contactsResponse.ok) {
      MOCK_CONTACTS = await contactsResponse.json();
    } else {
      MOCK_CONTACTS = [
        { id: 'c1', name: 'Support Général', email: 'support@llouests.com', phone: '+33 1 23 45 67 89' },
        { id: 'c2', name: 'Service Commercial', email: 'sales@llouests.com', phone: '+33 1 23 45 67 90' },
        { id: 'c3', name: 'Recrutement', email: 'hr@llouests.com', phone: '+33 1 23 45 67 91' },
      ];
    }

  const reasonResponse = await  fetch('/assets/json/mock/why-us-data.json');
   if(reasonResponse.ok){
    WHY_US_DATA = await reasonResponse.json();
   }

   const ecoResponse = await fetch('/assets/json/mock/eco-data.json');
   if(ecoResponse.ok){
    ECO_DATA = await ecoResponse.json();
   }


  } catch (error) {
    console.error('Erreur lors du chargement des données mock:', error);
    MOCK_CATEGORIES = [
      { id: 'all', name: 'Tout', icon: categoryIcons.all },
      { id: 'bureaux', name: 'Bureaux', icon: categoryIcons.bureaux },
      { id: 'piscine', name: 'Piscine', icon: categoryIcons.piscine },
      { id: 'régulier', name: 'Régulier', icon: categoryIcons.régulier },
      { id: 'ponctuel', name: 'Ponctuel', icon: categoryIcons.ponctuel },
      { id: 'salles_de_réunion', name: 'Salles de Réunion', icon: categoryIcons.salles_de_réunion },
      { id: 'sas_dentrée', name: 'Sas d’Entrée', icon: categoryIcons.sas_dentrée },
      { id: 'réfectoire', name: 'Réfectoire', icon: categoryIcons.réfectoire },
      { id: 'sanitaires', name: 'Sanitaires', icon: categoryIcons.sanitaires },
      { id: 'escaliers', name: 'Escaliers', icon: categoryIcons.escaliers },
      { id: 'vitrines', name: 'Vitrines', icon: categoryIcons.vitrines },
      { id: 'industriel', name: 'Industriel', icon: categoryIcons.industriel },
      { id: 'commercial', name: 'Commercial', icon: categoryIcons.commercial },
      { id: 'residentiel', name: 'Résidentiel', icon: categoryIcons.residentiel },
      { id: 'medical', name: 'Médical', icon: categoryIcons.medical },
      { id: 'education', name: 'Éducation', icon: categoryIcons.education },
      { id: 'hotelier', name: 'Hôtelier', icon: categoryIcons.hotelier },
      { id: 'restaurant', name: 'Restaurant', icon: categoryIcons.restaurant },
      { id: 'gym', name: 'Gym', icon: categoryIcons.gym },
      { id: 'parking', name: 'Parking', icon: categoryIcons.parking },
      { id: 'jardin', name: 'Jardin', icon: categoryIcons.jardin },
      { id: 'facade', name: 'Façade', icon: categoryIcons.facade },
      { id: 'toiture', name: 'Toiture', icon: categoryIcons.toiture },
      { id: 'evenementiel', name: 'Événementiel', icon: categoryIcons.evenementiel },
    ];

    MOCK_TESTIMONIALS = [
      {
        id: 't1',
        text: 'Service exceptionnel ! L’équipe est professionnelle et à l’écoute.',
        author: 'Jean Dupont',
        title: 'Client Satisfait',
        rating: 5,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        details: 'Détails étendus sur le service, avec mention des aspects écologiques et la rapidité.',
      },
      {
        id: 't2',
        text: 'Rapide, efficace et respectueux de l’environnement.',
        author: 'Entreprise XYZ',
        title: 'Client Professionnel',
        rating: 4,
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        details: 'Service adapté aux besoins des entreprises.',
      },
      {
        id: 't3',
        text: 'Un service de qualité qui dépasse nos attentes.',
        author: 'Marie L.',
        title: 'Particulier',
        rating: 5,
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        details: 'Nettoyage complet avec des produits écologiques.',
      },
    ];

    showNotification('Données mock chargées en secours.', 'warning');
  }
}




// Données pour hero slides avec plus de slides
 
    const HERO_SLIDES = [
      {
        type: 'video',
        src: '/assets/videos/hamburgeur.mp4',
        poster: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        title: 'L&L Ouest Services',
        subtitle: 'Excellence et écologie pour un environnement impeccable et sain à Angers',
        buttons: [
          { text: 'Demander un devis', href: '/pages/auth/signup.html', class: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg', ariaLabel: 'Demander un devis gratuit', icon: '📝' },
          { text: 'Nos services', href: '#services', class: 'border-2 border-gray-200 dark:border-gray-400 text-gray-200 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-400 dark:hover:text-gray-900 shadow-lg', ariaLabel: 'Voir tous les services', icon: '🛠️' },
        ],
        thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        sidebarMessage: 'Nettoyage professionnel à Angers pour un espace éclatant.'
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        title: 'Professionnels du Nettoyage',
        subtitle: 'Solutions sur mesure pour entreprises et particuliers dans l’Ouest de la France',
        buttons: [
          { text: 'En savoir plus', href: '#about', class: 'bg-gray-200 dark:bg-gray-400 text-gray-900 dark:text-gray-900 hover:bg-blue-600 hover:text-white shadow-lg', ariaLabel: 'En savoir plus sur nous', icon: 'ℹ️' },
        ],
        thumbnail: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        sidebarMessage: 'Découvrez nos services personnalisés pour tous vos besoins.'
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        title: 'Nettoyage Écologique',
        subtitle: 'Produits biodégradables pour un avenir durable à Angers',
        buttons: [
          { text: 'Engagement vert', href: '#eco-commitments', class: 'bg-green-600 hover:bg-green-700 text-white shadow-lg', ariaLabel: 'Découvrir notre engagement écologique', icon: '🌿' },
        ],
        thumbnail: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        sidebarMessage: 'Un nettoyage respectueux de l’environnement.'
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        title: 'Avant & Après',
        subtitle: 'Transformez vos espaces avec nos services professionnels',
        buttons: [
          { text: 'Voir les résultats', href: '#before-after', class: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg', ariaLabel: 'Voir les transformations avant/après', icon: '📸' },
        ],
        thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        sidebarMessage: 'Voyez la différence avec nos nettoyages.'
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        title: 'Outils Modernes',
        subtitle: 'Technologie de pointe pour des résultats impeccables',
        buttons: [
          { text: 'Nos méthodes', href: '#services', class: 'bg-gray-200 dark:bg-gray-400 text-gray-900 dark:text-gray-900 hover:bg-blue-600 hover:text-white shadow-lg', ariaLabel: 'Découvrir nos méthodes de nettoyage', icon: '⚙️' },
        ],
        thumbnail: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        sidebarMessage: 'Des outils innovants pour un nettoyage optimal.'
      },
      {
        type: 'video',
        src: '/assets/videos/hamburgeur.mp4',
        poster: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        title: 'Technologie de Nettoyage',
        subtitle: 'Découvrez nos outils modernes pour un nettoyage optimal',
        buttons: [
          { text: 'Nos équipements', href: '#equipment', class: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg', ariaLabel: 'Voir nos équipements de nettoyage', icon: '🔧' },
        ],
        thumbnail: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        sidebarMessage: 'Technologie avancée pour des résultats éclatants.'
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        title: 'Service Personnalisé',
        subtitle: 'Des solutions adaptées à vos besoins spécifiques à Angers',
        buttons: [
          { text: 'Personnaliser', href: '#customize', class: 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg', ariaLabel: 'Personnaliser votre service de nettoyage', icon: '🎨' },
        ],
        thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        sidebarMessage: 'Des services sur mesure pour vous.'
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        title: 'Engagement Communautaire',
        subtitle: 'Nous soutenons les initiatives locales à Angers',
        buttons: [
          { text: 'Nos actions', href: '#community', class: 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg', ariaLabel: 'Découvrir nos actions communautaires', icon: '🤝' },
        ],
        thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        sidebarMessage: 'Soutien aux projets locaux pour un avenir meilleur.'
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        title: 'Équipe Professionnelle',
        subtitle: 'Rencontrez nos experts dédiés à votre satisfaction',
        buttons: [
          { text: 'Notre équipe', href: '#team', class: 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg', ariaLabel: 'Rencontrer notre équipe', icon: '👥' },
        ],
        thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        sidebarMessage: 'Une équipe dévouée pour des résultats parfaits.'
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        title: 'Partenariats de Qualité',
        subtitle: 'Collaborez avec nos partenaires pour des résultats optimaux',
        buttons: [
          { text: 'Nos partenaires', href: '#partners', class: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg', ariaLabel: 'Découvrir nos partenaires', icon: '🤝' },
        ],
        thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        sidebarMessage: 'Des partenariats pour un service exceptionnel.'
      }
    ];




// Fonction de debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Lazy load des images avec IntersectionObserver
 * @param {NodeList} images - Liste des images à charger paresseusement
 */
function lazyLoadImages(images) {
  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    },
    { rootMargin: '0px 0px 200px 0px' }
  );

  images.forEach(img => observer.observe(img));
}


let activeSlide = 0;
let swiperInstance = null;





/**
 * Initialise le carrousel hero avec navigation par thumbnails verticaux, effets de parchemin au survol,
 * pause au survol, animations AOS, et bulles flottantes pour une entreprise de nettoyage à Angers.
 */

    /**
     * Initialize hero carousel
     */
async function initHeroCarousel() {
    const slidesContainer = document.getElementById('hero-slides');
    const thumbnailList = document.getElementById('thumbnail-list');
    if (!slidesContainer || !thumbnailList) return;

    // Génération des Slides
    slidesContainer.innerHTML = HERO_SLIDES.map((slide, index) => `
        <div class="swiper-slide relative w-full h-full" role="group" aria-label="Slide ${index + 1}">
            ${slide.type === 'video' ? `
                <div class="absolute inset-0 z-0">
                    <video class="w-full h-full object-cover" poster="${slide.poster}" muted loop playsinline preload="none" src="${slide.src}">
                        <source src="${slide.src}" type="video/mp4">
                    </video>
                </div>
                <div class="video-overlay z-5"></div>
            ` : `
                <div class="absolute inset-0 z-0 bg-cover bg-center" style="background-image: url('${slide.src}');"></div>
                <div class="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70"></div>
            `}
            <div class="relative z-10 flex flex-col justify-center items-center text-center text-white h-full px-6 carousel-caption">
           <h1 class="text-4xl md:text-6xl font-cinzel font-bold mb-4 tracking-tight text-fade-in">${slide.title}</h1>
                <p class="text-lg md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed font-light text-fade-in">${slide.subtitle}</p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center items-center text-fade-in">
                    ${slide.buttons.map(btn => `
                        <a href="${btn.href}" class="${btn.class} action py-3 px-8 rounded-full font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 flex items-center gap-2" aria-label="${btn.ariaLabel}">
                            <span>${btn.icon}</span> ${btn.text}
                        </a>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');

    // Génération des Thumbnails
    thumbnailList.innerHTML = HERO_SLIDES.map((slide, index) => `
        <div class="thumbnail-item relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent" 
             data-slide-index="${index}"
             data-sidebar-message="${slide.sidebarMessage}"
             data-buttons='${JSON.stringify(slide.buttons)}'>
            <img src="${slide.thumbnail}" alt="Aperçu ${index + 1}" class="w-full h-full object-cover">
        </div>
    `).join('');
    
    // Variables DOM
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    const thumbContainer = document.getElementById('thumbnail-container');
    const parchmentInfo = document.getElementById('parchment-info');
    const navUp = document.getElementById('thumb-nav-up');
    const navDown = document.getElementById('thumb-nav-down');
    const viewport = document.getElementById('thumbnail-viewport');
    const scrollAmount = 80;
    
    // Timer pour le parchemin
    let parchmentTimer;
    const parchmentDelay = 300; // Délai avant affichage du parchemin

    // Fonctions
    
      function updateThumbnails(activeIndex) {
        thumbnails.forEach((thumb, idx) => {
          thumb.classList.toggle('active', idx === activeIndex);
        });
      
        // Update parchment info for active slide
        showParchmentInfo(thumbnails[activeIndex]);
      }


    function handleSlideMedia(swiper) {
        swiper.slides.forEach((slide, idx) => {
            const video = slide.querySelector('video');
            if (video) {
                if (idx === swiper.activeIndex) {
                    video.play().catch(e => console.log("L'autoplay de la vidéo a été bloqué."));
                } else {
                    video.pause();
                    video.currentTime = 0;
                }
            }
        });
    }
    
    function checkScrollButtons() {
        // Masquer/afficher les boutons de navigation selon la position du scroll
        if (viewport.scrollTop <= 10) {
            navUp.classList.add('hidden');
        } else {
            navUp.classList.remove('hidden');
        }
        
        if (viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 10) {
            navDown.classList.add('hidden');
        } else {
            navDown.classList.remove('hidden');
        }
    }
    
    function showParchmentInfo(thumb) {
        clearTimeout(parchmentTimer);
        parchmentTimer = setTimeout(() => {
            const message = thumb.dataset.sidebarMessage;
            const buttons = JSON.parse(thumb.dataset.buttons);

            parchmentInfo.innerHTML = `
                <div class="flex items-start mb-2">
                    <div class="text-xl mr-2">📜</div>
                    <p class="text-sm md:text-base font-semibold">${message}</p>
                </div>
                <div class="flex flex-col gap-2 items-start mt-3">
                    ${buttons.map(btn => `
                        <a href="${btn.href}" class="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors" aria-label="${btn.ariaLabel}">
                            <span class="text-base">${btn.icon}</span>
                            <span>${btn.text}</span>
                        </a>
                    `).join('')}
                </div>
            `;
            parchmentInfo.classList.add('visible');
        }, parchmentDelay);
    }
    
    function hideParchmentInfo() {
        clearTimeout(parchmentTimer);
        parchmentInfo.classList.remove('visible');
    }

    // Initialisation de Swiper
    const swiper = new Swiper('[data-carousel]', {
        effect: 'fade',
        fadeEffect: { crossFade: true },
        loop: true,
        autoplay: { delay: 7000, disableOnInteraction: false },
        resizeObserver: true,
        on: {
            slideChange: (swiper) => {
                const activeIndex = swiper.realIndex;
                updateThumbnails(activeIndex);
                handleSlideMedia(swiper);
            },
            init: (swiper) => {
                updateThumbnails(swiper.realIndex);
                handleSlideMedia(swiper);
              
                checkScrollButtons();
            }
        },
        a11y: { enabled: true, prevSlideMessage: 'Précédent', nextSlideMessage: 'Suivant' },
    });

    // Écouteurs d'événements pour la navigation des thumbnails
    thumbnails.forEach((thumb) => {
        thumb.addEventListener('click', () => {
            swiper.slideToLoop(parseInt(thumb.dataset.slideIndex));
        });
        
        thumb.addEventListener('mouseenter', (e) => {
            showParchmentInfo(thumb);
        });
        
        thumb.addEventListener('mouseleave', () => {
            hideParchmentInfo();
        });
    });
    
    // Navigation par boutons
    navUp.addEventListener('click', () => {
        viewport.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
    });

    navDown.addEventListener('click', () => {
        viewport.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    });
    
    // Vérification de la position du scroll
    viewport.addEventListener('scroll', checkScrollButtons);
    
    // Détection de la direction de la souris pour le défilement automatique
    let lastMouseY = 0;
    thumbContainer.addEventListener('mousemove', (e) => {
        const currentMouseY = e.clientY;
        const deltaY = currentMouseY - lastMouseY;
        
        if (Math.abs(deltaY) > 5) { // Seuil pour éviter les micro-mouvements
            if (deltaY < 0 && currentMouseY < 100) {
                // Souris se déplace vers le haut dans la partie supérieure
                viewport.scrollBy({ top: -scrollAmount/2, behavior: 'smooth' });
            } else if (deltaY > 0 && currentMouseY > (viewport.clientHeight - 100)) {
                // Souris se déplace vers le bas dans la partie inférieure
                viewport.scrollBy({ top: scrollAmount/2, behavior: 'smooth' });
            }
        }
        
        lastMouseY = currentMouseY;
    });
    
    // Arrêt/reprise de l'autoplay
    thumbContainer.addEventListener('mouseenter', () => {
        swiper.autoplay.stop();
    });

    thumbContainer.addEventListener('mouseleave', () => {
        hideParchmentInfo();
        swiper.autoplay.start();
    });
    
    // Initialisation des boutons de navigation
    checkScrollButtons();
}


   


/**
 * Initialise le carrousel des témoignages avec un design futuriste et une boucle infinie
 */
function initTestimonialsCarousel() {
  const testimonialsContainer = document.getElementById('testimonials-list');
  const loadingIndicator = document.getElementById('testimonials-loading');
  if (!testimonialsContainer) {
    console.log('Conteneur des témoignages non trouvé');
    return;
  }

  

  // Fetch testimonials data (replace with your actual data source)
  const testimonials = MOCK_TESTIMONIALS;

  if (testimonials.length === 0) {
    loadingIndicator?.classList.add('hidden');
    document.getElementById('no-testimonials')?.classList.remove('hidden');
    return;
  }

  testimonialsContainer.innerHTML = testimonials.map((testimonial, index) => {
    const rating = Math.min(Math.max(Number(testimonial.rating), 0), 5);
    const expandIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    const collapseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
    const fullTextIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path><path d="M14 2v6h6M10 13h4M10 17h4M10 9h4"></path></svg>`;

    return `
      <div class="swiper-slide">
        <div class="testimonial-card-futuristic relative p-6 bg-gray-800 dark:bg-gray-950 rounded-3xl border border-blue-600/20 shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out h-full flex flex-col justify-between transform hover:-translate-y-2" data-aos="fade-up" data-aos-delay="${index * 100}">
          <div class="flex items-center mb-4">
            <img src="${testimonial.image}" data-src="${testimonial.image}" class="w-16 h-16 rounded-full object-cover mr-4 border-2 border-blue-500 lazy" alt="Photo de ${testimonial.author}">
            <div>
              <p class="font-bold text-lg text-blue-400">${testimonial.author}</p>
              <p class="text-sm text-gray-400">${testimonial.title}</p>
            </div>
          </div>
          <div class="flex items-center mb-4">
            ${Array(rating).fill('<i class="fas fa-star text-yellow-400" aria-hidden="true"></i>').join('')}
            ${Array(5 - rating).fill('<i class="fas fa-star text-gray-600" aria-hidden="true"></i>').join('')}
          </div>
          <p class="text-base italic text-gray-300 flex-grow transition-all duration-300 testimonial-text line-clamp-3">${testimonial.text}</p>
          <div class="testimonial-details hidden mt-4 text-gray-300">${testimonial.details}</div>
          <div class="text-center mt-6 flex justify-between items-center">
            
            <button class="view-full-testimonial text-blue-400 hover:text-blue-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md py-2 px-3 transition-colors flex items-center gap-2" data-testimonial-id="${testimonial.id}" aria-label="Voir le témoignage complet de ${testimonial.author}">
              ${fullTextIcon}
              <span>Voir le complet</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  lazyLoadImages(document.querySelectorAll('.testimonial-card-futuristic img.lazy'));

  const swiperOptions = {
    slidesPerView: 1,
    spaceBetween: 30,
    effect: 'slide',
    loop: true,
    speed: 1000,
    autoplay: {
      delay: 1000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true, 
    },
    breakpoints: {
      640: { slidesPerView: 2, spaceBetween: 20 },
      1024: { slidesPerView: 3, spaceBetween: 30 },
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      renderBullet: (index, className) => `<span class="${className} w-3 h-3 bg-gray-600 dark:bg-gray-400 rounded-full transition-all duration-300 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Aller au témoignage ${index + 1}"></span>`,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    a11y: {
      enabled: true,
      prevSlideMessage: 'Témoignage précédent',
      nextSlideMessage: 'Témoignage suivant',
      paginationBulletMessage: 'Aller au témoignage {{index}}',
    },
  };

  const swiper = new Swiper('.testimonials-swiper', swiperOptions);

  loadingIndicator?.classList.add('hidden');
  document.querySelector('.testimonials-swiper')?.classList.remove('hidden');

  

  // Event listeners for opening the full testimonial modal
  document.querySelectorAll('.view-full-testimonial').forEach(button => {
    button.addEventListener('click', () => {
      const testimonialId = button.dataset.testimonialId;
      const testimonial = MOCK_TESTIMONIALS.find(t => t.id === testimonialId);
      if (testimonial) {
        openTestimonialModal(testimonial);
      }
    });
  });
}

/**
 * Ouvre une modale futuriste pour un témoignage complet
 * @param {Object} testimonial - Données du témoignage
 */
function openTestimonialModal(testimonial) {
  const modal = document.createElement('div');
  modal.id = 'testimonial-modal';
  modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 md:p-6 transition-opacity duration-500 opacity-0';

  modal.innerHTML = `
    <div class="modal-content bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full mx-auto overflow-hidden max-h-[90vh] overflow-y-auto transform scale-95 transition-transform duration-500">
      <button class="modal-close absolute top-4 right-4 z-10 bg-white dark:bg-gray-700 rounded-full p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-md" aria-label="Fermer la modale">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-8">
        <!-- Left Column: Image, Rating, Details -->
        <div class="space-y-6">
          <div class="text-center">
            <img src="${testimonial.image || 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80'}" class="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-blue-200 dark:border-gray-600 shadow-md" alt="Photo de ${testimonial.author}">
            <h3 class="text-2xl font-sans font-bold text-gray-900 dark:text-white">${testimonial.author}</h3>
            <p class="text-blue-600 dark:text-blue-400 font-medium">${testimonial.title}</p>
            <div class="mt-2 flex justify-center">
              ${Array(testimonial.rating || 5).fill('<svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.098 9.397c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.97z"/></svg>').join('')}
              ${Array(5 - (testimonial.rating || 5)).fill('<svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.098 9.397c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.97z"/></svg>').join('')}
            </div>
          </div>
          <div class="bg-blue-50 dark:bg-gray-700 p-4 rounded-xl shadow-sm">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Détails du Témoignage
            </h4>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${testimonial.details || 'Aucun détail supplémentaire fourni.'}</p>
          </div>
        </div>
        <!-- Right Column: Testimonial Text -->
        <div class="space-y-6">
          <div class="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Témoignage
            </h4>
            <p class="text-gray-700 dark:text-gray-300 italic leading-relaxed">${testimonial.text}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => {
    modal.classList.remove('opacity-0');
    modal.classList.add('opacity-100');
    modal.querySelector('.modal-content').classList.remove('scale-95');
    modal.querySelector('.modal-content').classList.add('scale-100');
  }, 10);

  const closeModal = () => {
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    modal.querySelector('.modal-content').classList.remove('scale-100');
    modal.querySelector('.modal-content').classList.add('scale-95');
    setTimeout(() => modal.remove(), 500);
    document.body.style.overflow = 'auto';
  };

  modal.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  modal.addEventListener('click', e => {
    if (e.target === modal) {
      closeModal();
    }
  });

  modal.querySelector('.modal-close').focus();
  document.body.style.overflow = 'hidden';
}




let typingInterval = null;

   
    /**
     * Simule une frappe de texte dans un élément.
     * @param {HTMLElement} element - L'élément où afficher le texte.
     * @param {string} text - Le texte complet à taper.
     * @param {number} speed - La vitesse de frappe en ms.
     */
    function typeAnswer(element, text, speed = 30) {
      if (typingInterval) clearInterval(typingInterval);
      let i = 0;
      element.innerHTML = '';
      const cursor = '<span class="typing-cursor"></span>';
      element.innerHTML = cursor;

      typingInterval = setInterval(() => {
        if (i < text.length) {
          element.innerHTML = text.substring(0, i + 1) + cursor;
          i++;
        } else {
          clearInterval(typingInterval);
          setTimeout(() => {
            if (element.querySelector('.typing-cursor')) {
              element.querySelector('.typing-cursor').style.display = 'none';
            }
          }, 1000);
        }
      }, speed);
    }

    /**
     * Initialise la section FAQ avec accordéon animé, filtres par catégorie, pagination, icônes SVG,
     * fermeture automatique des autres accordéons, effet de typing, et bouton de contact
     */
    function initFAQSection() {
      const faqContainer = document.getElementById('faq-list');
      const paginationContainer = document.querySelector('.faq-pagination');
      if (!faqContainer || !paginationContainer) {
        console.warn('Conteneur FAQ ou pagination non trouvé');
        return;
      }

      


      // Paramètres de pagination
      const ITEMS_PER_PAGE = 5;
      let currentPage = 1;
      let currentFilter = 'all';

      // Fonction pour rendre les items FAQ
      function renderFAQItems(page = 1, filter = 'all') {
        const filteredFAQ = filter === 'all' ? MOCK_FAQ : MOCK_FAQ.filter(faq => faq.category === filter);
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedFAQ = filteredFAQ.slice(startIndex, endIndex);

        faqContainer.innerHTML = paginatedFAQ.map((faq, index) => `
          <div class="faq-item rounded-2xl mb-6 overflow-hidden" data-category="${faq.category}" data-aos="fade-up" data-aos-delay="${index * 100}">
            <button class="faq-toggle w-full text-left p-6 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-green-500 rounded-t-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" aria-expanded="false" aria-controls="faq-content-${startIndex + index}">
              <div class="flex items-center gap-4">
                ${faq.icon || ''}
                <span class="text-xl font-semibold text-gray-900 dark:text-white">${faq.question}</span>
              </div>
              <span class="faq-icon ml-auto text-gray-500 dark:text-gray-400">${expandIcon}</span>
            </button>
            <div id="faq-content-${startIndex + index}" class="faq-content hidden p-6 text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-200 dark:border-gray-600 transition-all duration-300">
              <p class="mb-6"></p>
              <div class="flex justify-between gap-6">
                <a href="#contact" class="text-white bg-green-500 dark:bg-transparent border-xl border p-2 rounded-xl border-green-500  font-medium text-sm flex items-center gap-2 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  En savoir plus
                </a>
                <a href="#related" class="text-white bg-blue-500 dark:bg-transparent border-xl border p-2 rounded-xl border-blue-500  font-medium text-sm flex items-center gap-2 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V9l-7-7z"></path>
                    <path d="M13 3v6h6"></path>
                  </svg>
                  Demandez votre devis
                </a>
              </div>
            </div>
          </div>
        `).join('');

        const totalPages = Math.ceil(filteredFAQ.length / ITEMS_PER_PAGE);
        paginationContainer.innerHTML = `
          <button class="faq-prev-page px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage === 1 ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6"></path>
            </svg>
          </button>
          ${Array.from({ length: totalPages }, (_, i) => `
            <button class="faq-page-btn px-4 py-2 rounded-full ${i + 1 === currentPage ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'} font-medium hover:bg-green-500 hover:text-white transition-colors" data-page="${i + 1}">
              ${i + 1}
            </button>
          `).join('')}
          <button class="faq-next-page px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage === totalPages ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"></path>
            </svg>
          </button>
        `;

        // Gestion des toggles avec effet de typing
        const toggles = faqContainer.querySelectorAll('.faq-toggle');
        toggles.forEach(button => {
          button.addEventListener('click', () => {
            const content = button.nextElementSibling;
            const icon = button.querySelector('.faq-icon');
            const isExpanded = content.classList.contains('hidden');
            const parent = button.closest('#faq-list');
            const textElement = content.querySelector('p');
            const faqIndex = parseInt(content.id.replace('faq-content-', '')) % MOCK_FAQ.length;
            const answerText = filteredFAQ[faqIndex].answer;

            // Fermer tous les autres
            parent.querySelectorAll('.faq-content').forEach(otherContent => {
              if (otherContent !== content && !otherContent.classList.contains('hidden')) {
                otherContent.classList.add('hidden');
                const otherButton = otherContent.previousElementSibling;
                otherButton.querySelector('.faq-icon').innerHTML = expandIcon;
                otherButton.setAttribute('aria-expanded', 'false');
                if (otherContent.querySelector('p')) {
                  otherContent.querySelector('p').innerHTML = '';
                }
              }
            });

            // Toggle actuel
            content.classList.toggle('hidden');
            icon.innerHTML = isExpanded ? collapseIcon : expandIcon;
            button.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');

            // Ajouter l'effet de typing uniquement à l'ouverture
            if (isExpanded) {
              typeAnswer(textElement, answerText, 30);
            } else {
              textElement.innerHTML = answerText;
            }
          });
        });

        // Gestion de la pagination
        paginationContainer.querySelectorAll('.faq-page-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page);
            renderFAQItems(currentPage, currentFilter);
            AOS.refresh();
          });
        });

        paginationContainer.querySelector('.faq-prev-page').addEventListener('click', () => {
          if (currentPage > 1) {
            currentPage--;
            renderFAQItems(currentPage, currentFilter);
            AOS.refresh();
          }
        });

        paginationContainer.querySelector('.faq-next-page').addEventListener('click', () => {
          if (currentPage < Math.ceil(filteredFAQ.length / ITEMS_PER_PAGE)) {
            currentPage++;
            renderFAQItems(currentPage, currentFilter);
            AOS.refresh();
          }
        });

        AOS.refresh();
      }

      // Gestion des filtres
      const filterButtons = document.querySelectorAll('.faq-filter-btn');
      filterButtons.forEach(button => {
        button.addEventListener('click', () => {
          currentFilter = button.dataset.filter;
          currentPage = 1;

          filterButtons.forEach(btn => btn.classList.remove('active', 'bg-green-500', 'text-white'));
          button.classList.add('active', 'bg-green-500', 'text-white');

          renderFAQItems(currentPage, currentFilter);
        });
      });

      // Initialisation
      renderFAQItems(currentPage, currentFilter);
    }

    

  

        /**
         * Initializes the team section with a carousel, filters, and modal functionality.
         * Ensures accessibility, lazy loading, and smooth animations for a professional experience.
         */
        function initTeamSection() {
            const teamContainer = document.getElementById('team-list');
            const modal = document.getElementById('team-modal');
            const header = document.getElementById('blurred-header');
            const modalContent = document.getElementById('modal-content');
            const modalClose = document.getElementById('modal-close');

            if (!teamContainer || !modal || !modalContent || !modalClose) {
                console.warn('Team container or modal elements not found');
                return;
            }

            let currentFilter = 'all';
            let swiperInstance = null;

            /**
             * Renders team cards based on the selected filter and reinitializes the Swiper carousel.
             * @param {string} filter - The category to filter by ('all', 'management', 'cleaning', 'technical')
             */
            function renderTeamCards(filter = 'all') {


                const filteredTeam = filter === 'all' ? MOCK_TEAM : MOCK_TEAM.filter(member => member.roleCategory === filter);


                teamContainer.innerHTML = filteredTeam.map((member, index) => `
                    <div class="swiper-slide">
                        <div class="team-card bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-start hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2" data-aos="fade-up" data-aos-delay="${index * 100}">
                            <div class="flex items-center space-x-4 mb-4">
                                <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" data-src="${member.image}" class="w-20 h-20 rounded-full object-cover border-2 border-blue-400  lazy" alt="Photo de ${member.name}" loading="lazy">
                                <div>
                                    <h4 class="text-lg font-cinzel font-semibold text-gray-900 dark:text-white">${member.name}</h4>
                                    <p class="text-sm text-blue-600 dark:text-blue-400">${member.role}</p>
                                </div>
                            </div>
                            <div class="mb-4 w-full">
                                ${member.skills.slice(0, 3).map(skill => `
                                    <div class="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-2">
                                        <span class="flex items-center">
                                            <span class="dark:text-blue-400">${skill.icon}</span>
                                            <span class="ml-2">${skill.name}</span>
                                        </span>
                                        <span>${skill.level}%</span>
                                    </div>
                                `).join('')}
                            </div>
                           <button
                              class="team-modal-btn inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 dark:bg-transparent border-blue-400 border hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                              data-member-id="${member.name.replace(/\s+/g, '-').toLowerCase()}"
                              aria-label="Voir le profil de ${member.name}"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white transition-transform duration-200 group-hover:translate-x-1" fill="currentColor" viewBox="0 0 24 24">
                               <g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.696-3.534c.63 0 1.332-.288 2.196-1.458l.911-1.22a.334.334 0 0 0-.074-.472.38.38 0 0 0-.505.06l-1.475 1.679a.241.241 0 0 1-.279.061.211.211 0 0 1-.12-.244l1.858-7.446a.499.499 0 0 0-.575-.613l-3.35.613a.35.35 0 0 0-.276.258l-.086.334a.25.25 0 0 0 .243.312h1.73l-1.476 5.922c-.054.234-.144.63-.144.918 0 .666.396 1.296 1.422 1.296zm1.83-10.536c.702 0 1.242-.414 1.386-1.044.036-.144.054-.306.054-.414 0-.504-.396-.972-1.134-.972-.702 0-1.242.414-1.386 1.044a1.868 1.868 0 0 0-.054.414c0 .504.396.972 1.134.972z" ></path></g>
                              </svg>
                              <span>En savoir plus</span>
                            </button>

                        </div>
                    </div>
                `).join('');

                // Lazy load images
                const lazyImages = document.querySelectorAll('img.lazy');
                const observer = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                            observer.unobserve(img);
                        }
                    });
                }, { rootMargin: '100px' });
                lazyImages.forEach(img => observer.observe(img));

                // Destroy existing Swiper instance if it exists
                if (swiperInstance) swiperInstance.destroy(true, true);

                // Initialize Swiper
                swiperInstance = new Swiper('.team-swiper', {
                    slidesPerView: 1,
                    spaceBetween: 16,
                    centeredSlides: true,
                    loop: filteredTeam.length >= 4,
                    autoplay: filteredTeam.length >= 4 ? { 
                        delay: 5000, 
                        disableOnInteraction: false 
                    } : false,
                    pagination: {
                        el: '.team-swiper-pagination',
                        clickable: true,
                        bulletClass: 'swiper-pagination-bullet w-3 h-3 bg-gray-300 dark:bg-gray-600 opacity-70 transition-all',
                        bulletActiveClass: 'swiper-pagination-bullet-active bg-white scale-125 opacity-100',
                      renderBullet: (index, className) => `<span class="${className} w-3 h-3 bg-gray-600 dark:bg-gray-400 rounded-full transition-all duration-300 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Aller diapositive ${index + 1}"></span>`,
    
                    },
                    breakpoints: {
                        640: { slidesPerView: 1, spaceBetween: 16, centeredSlides: true },
                        768: { slidesPerView: 2, spaceBetween: 20, centeredSlides: false },
                        1024: { slidesPerView: 3, spaceBetween: 24, centeredSlides: false },
                        1280: { slidesPerView: 4, spaceBetween: 24, centeredSlides: false }
                    },
                    a11y: {
                        enabled: true,
                        prevSlideMessage: 'Membre précédent',
                        nextSlideMessage: 'Membre suivant',
                        paginationBulletMessage: 'Aller au membre {{index}}'
                    }
                });

                if (AOS) {
                    AOS.refreshHard();
                }


                // Attach modal button listeners
                document.querySelectorAll('.team-modal-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const memberId = btn.dataset.memberId;
                        const member = MOCK_TEAM.find(m => m.name.replace(/\s+/g, '-').toLowerCase() === memberId);

                        if (member) {
                            modalContent.innerHTML = `
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                                    <!-- Colonne de gauche: Photo, images d'action, compétences, certifications -->
                                    <div class="space-y-6">
                                        <div class="text-center">
                                            <img src="${member.image}" class="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-blue-200 dark:border-gray-600 shadow-md" alt="Photo de ${member.name}">
                                            <h3 class="text-2xl font-cinzel font-bold text-gray-900 dark:text-white">${member.name}</h3>
                                            <p class="text-blue-600 dark:text-blue-400 font-medium">${member.role}</p>
                                            <div class="mt-2 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                ${member.yearsExperience} ans d'expérience
                                            </div>
                                            <div class="mt-2 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                ${member.projectsCompleted} projets réalisés
                                            </div>
                                        </div>
                                        <div class="bg-blue-50 dark:bg-gray-700 p-4 rounded-xl shadow-sm">
                                            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                En Action
                                            </h4>
                                            <div class="grid grid-cols-3 gap-2">
                                                ${member.actionImages.map(img => `
                                                    <img src="${img}" class="w-full h-20 object-cover rounded-lg" alt="Photo d'action de ${member.name}" loading="lazy">
                                                `).join('')}
                                            </div>
                                        </div>
                                        <div class="bg-blue-50 dark:bg-gray-700 p-4 rounded-xl shadow-sm">
                                            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                Compétences
                                            </h4>
                                            <div class="grid grid-cols-2 gap-4">
                                                ${member.skills.map(skill => `
                                                    <div class="flex flex-col items-center">
                                                        <div class="circular-progress">
                                                            <svg class="w-full h-full" viewBox="0 0 100 100">
                                                                <circle class="text-gray-200 dark:text-gray-600 stroke-current" stroke-width="8" cx="50" cy="50" r="40" fill="transparent" />
                                                                <circle class="circular-progress-circle text-blue-600 dark:text-blue-400 stroke-current" stroke-width="8" stroke-linecap="round" cx="50" cy="50" r="40" fill="transparent" stroke-dashoffset="251" />
                                                            </svg>
                                                            <div class="progress-value text-base font-cinzel font-bold text-gray-900 dark:text-white">0%</div>
                                                        </div>
                                                        <p class="mt-2 text-sm text-center text-gray-700 dark:text-gray-300 flex items-center justify-center">
                                                            ${skill.icon}
                                                            <span class="ml-1">${skill.name}</span>
                                                        </p>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                        <div class="bg-blue-50 dark:bg-gray-700 p-4 rounded-xl shadow-sm">
                                            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                                Certifications
                                            </h4>
                                            <ul class="space-y-2">
                                                ${member.certifications.map(cert => `
                                                    <li class="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        ${cert}
                                                    </li>
                                                `).join('')}
                                            </ul>
                                        </div>
                                    </div>
                                    <!-- Colonne de droite: Présentation, performance, et contact -->
                                    <div class="space-y-6">
                                        <div class="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm">
                                            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Présentation
                                            </h4>
                                            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${member.bio}</p>
                                            <div class="mt-4 space-y-2">
                                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                                    <span class="font-medium">Disponibilité :</span> ${member.availability}
                                                </p>
                                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                                    <span class="font-medium">Formation :</span> ${member.education.join(', ')}
                                                </p>
                                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                                    <span class="font-medium">Langues :</span> ${member.languages.join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                        <div class="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm">
                                            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                                Indicateurs de Performance
                                            </h4>
                                            <div class="grid grid-cols-2 gap-4">
                                                ${Object.entries(member.performance).map(([key, value]) => `
                                                    <div class="flex flex-col items-center">
                                                        <div class="circular-progress">
                                                            <svg class="w-full h-full" viewBox="0 0 100 100">
                                                                <circle class="text-gray-200 dark:text-gray-600 stroke-current" stroke-width="8" cx="50" cy="50" r="40" fill="transparent" />
                                                                <circle class="circular-progress-circle ${value >= 90 ? 'text-green-500' : value >= 80 ? 'text-blue-600 dark:text-blue-400' : value >= 70 ? 'text-yellow-500' : 'text-red-500'} stroke-current" stroke-width="8" stroke-linecap="round" cx="50" cy="50" r="40" fill="transparent" stroke-dashoffset="251" />
                                                            </svg>
                                                            <div class="progress-value text-base font-cinzel font-bold text-gray-900 dark:text-white">0%</div>
                                                        </div>
                                                        <p class="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">${key}</p>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                        <div class="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm">
                                            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                Contact & Réseaux
                                            </h4>
                                            <div class="flex flex-col sm:flex-row gap-3">
                                                <a href="${member.socialLinks.linkedin}" class="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors" target="_blank" rel="noopener noreferrer" aria-label="Profil LinkedIn de ${member.name}">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                                    </svg>
                                                    LinkedIn
                                                </a>
                                                <a href="mailto:${member.socialLinks.email}" class="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors" aria-label="Envoyer un email à ${member.name}">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    Email
                                                </a>
                                                <a href="tel:${member.socialLinks.phone}" class="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors" aria-label="Appeler ${member.name}">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    Téléphone
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;

                            modal.classList.add('active');
                            header.classList.toggle('z-30','');

                            document.body.style.overflow = 'hidden';

                            if (swiperInstance.autoplay.running) {
                                swiperInstance.autoplay.stop();
                            }

                            // Animation des cercles de progression
                            setTimeout(() => {
                                document.querySelectorAll('.circular-progress-circle').forEach((circle, index) => {
                                    const value = Object.values(member.performance)[index] || member.skills[index].level;
                                    const radius = circle.r.baseVal.value;
                                    const circumference = 2 * Math.PI * radius;
                                    const offset = circumference - (value / 100) * circumference;

                                    circle.style.strokeDasharray = `${circumference} ${circumference}`;
                                    circle.style.strokeDashoffset = circumference;

                                    setTimeout(() => {
                                        circle.style.strokeDashoffset = offset;
                                    }, 100);

                                    const valueDisplay = circle.parentElement.nextElementSibling;
                                    let start = 0;
                                    const end = value;
                                    const duration = 1500;
                                    const increment = end / (duration / 20);

                                    const timer = setInterval(() => {
                                        start += increment;
                                        if (start >= end) {
                                            start = end;
                                            clearInterval(timer);
                                        }
                                        valueDisplay.textContent = `${Math.round(start)}%`;
                                    }, 20);
                                });
                            }, 100);
                        }
                    });
                });
            }

            // Gestion des filtres
            const filterButtons = document.querySelectorAll('.team-filter-btn');
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    if (button.dataset.filter === currentFilter) return;
                    currentFilter = button.dataset.filter;
                    filterButtons.forEach(btn => {
                        btn.classList.remove('active', 'bg-blue-600', 'text-white');
                        btn.classList.add('bg-white', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-200');
                    });
                    button.classList.add('active', 'bg-blue-600', 'text-white');
                    button.classList.remove('bg-white', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-200');
                    renderTeamCards(currentFilter);
                   
                });
            });

      


            // Gestion de la fermeture de la modale
            function closeModal() {
                modal.classList.remove('active');
                header.classList.add('z-30');
                document.body.style.overflow = 'auto';

                setTimeout(() => {
                    if (swiperInstance && MOCK_TEAM.length >= 4) {
                        swiperInstance.autoplay.start();
                    }
                }, 500);
            }

            modalClose.addEventListener('click', closeModal);

            modal.addEventListener('click', e => {
                if (e.target === modal) {
                    closeModal();
                }
            });

            document.addEventListener('keydown', e => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    closeModal();
                }
            });

            // Initialisation
            renderTeamCards(currentFilter);
            
}



/**
         * Initialise la section Partenaires avec carrousel et tooltips
         */
          function initPartnersSection() {
            const partnersContainer = document.getElementById('partners-list');
            const tooltip = document.getElementById('partner-tooltip');
            const tooltipLogo = document.getElementById('tooltip-logo');
            const tooltipName = document.getElementById('tooltip-name');
            const tooltipDetails = document.getElementById('tooltip-details');
            const tooltipWebsite = document.getElementById('tooltip-website');
            let swiperInstance = null;

            if (!partnersContainer || !tooltip || !tooltipLogo || !tooltipName || !tooltipDetails || !tooltipWebsite) {
                console.warn('Conteneur partenaires ou éléments de tooltip non trouvés');
                return;
            }

            function showTooltip(event, partner) {
                tooltipLogo.src = partner.logo;
                tooltipLogo.alt = `Logo de ${partner.name}`;
                tooltipName.textContent = partner.name;
                tooltipDetails.textContent = partner.description;
                tooltipWebsite.href = partner.website;
                tooltipWebsite.textContent = `Visiter ${partner.name}`;
                tooltip.classList.remove('opacity-0', 'invisible', '-translate-y-2', 'translate-y-2' , 'hidden');
                tooltip.classList.add('opacity-100', 'visible', 'translate-y-0');

                const rect = event.target.getBoundingClientRect();
                let leftPos = rect.left + window.scrollX + rect.width / 2 - tooltip.offsetWidth / 2;
                let topPos = rect.top + window.scrollY - tooltip.offsetHeight - 15;

                const padding = 10;
                leftPos = Math.max(padding, Math.min(leftPos, window.innerWidth - tooltip.offsetWidth - padding));
                if (topPos < padding) {
                    topPos = rect.bottom + window.scrollY + 15;
                    tooltip.classList.remove('-translate-y-2');
                    tooltip.classList.add('translate-y-2');
                } else {
                    tooltip.classList.remove('translate-y-2');
                    tooltip.classList.add('-translate-y-2');
                }

                tooltip.style.left = `${leftPos}px`;
                tooltip.style.top = `${topPos}px`;

                if (swiperInstance && swiperInstance.autoplay.running) {
                    swiperInstance.autoplay.stop();
                }
            }

            function hideTooltip() {
                tooltip.classList.remove('opacity-100', 'visible', 'translate-y-0', 'translate-y-2');
                tooltip.classList.add('opacity-0', 'invisible', '-translate-y-2');
                if (swiperInstance && MOCK_PARTNERS.length >= 3) {
                    swiperInstance.autoplay.start();
                }
            }

            function renderPartnerCards() {
                partnersContainer.innerHTML = MOCK_PARTNERS.map((partner) => `
                    <div class="swiper-slide flex items-center justify-center h-48 sm:h-56">
                        <a href="${partner.website}" target="_blank" rel="noopener noreferrer" class="group relative block w-full h-full">
                            <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" 
                                 data-src="${partner.logo}" 
                                 class="partner-logo max-h-[8rem] w-auto object-contain mx-auto filter grayscale opacity-70 
                                        transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 
                                        bg-ll-white dark:bg-sidebar-dark rounded-lg p-3 shadow-lg-dark-custom lazy" 
                                 alt="Logo de ${partner.name}" 
                                 loading="lazy">
                            <p class="mt-3 text-center text-sm sm:text-base font-cinzel font-semibold text-ll-black dark:text-ll-white group-hover:text-ll-blue dark:group-hover:text-ll-blue transition-colors duration-300">
                                ${partner.name}
                            </p>
                        </a>
                    </div>
                `).join('');

                // Lazy load images
                const lazyImages = document.querySelectorAll('.partner-logo.lazy');
                const observer = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                            observer.unobserve(img);
                        }
                    });
                }, { rootMargin: '100px' });
                lazyImages.forEach(img => observer.observe(img));

                if (swiperInstance) swiperInstance.destroy(true, true);

                swiperInstance = new Swiper('.partners-swiper', {
                    slidesPerView: 1,
                    spaceBetween: 20,
                    loop: MOCK_PARTNERS.length >= 3,
                    centeredSlides: true,
                    autoplay: MOCK_PARTNERS.length >= 3 ? {
                        delay: 3000,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true
                    } : false,
                    pagination: {
                        el: '.partners-swiper-pagination',
                        clickable: true,
                        bulletClass: 'swiper-pagination-bullet',
                        bulletActiveClass: 'swiper-pagination-bullet-active',
                        renderBullet: (index, className) => `<span class="${className} w-3 h-3 bg-ll-medium-gray/70 dark:bg-ll-medium-gray/50 opacity-70 rounded-full transition-all duration-300 hover:bg-ll-blue" aria-label="Aller au partenaire ${index + 1}"></span>`,
                    },
                    navigation: {
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev',
                    },
                    a11y: {
                        enabled: true,
                        prevSlideMessage: 'Partenaire précédent',
                        nextSlideMessage: 'Partenaire suivant',
                        paginationBulletMessage: 'Aller au partenaire {{index}}'
                    }
                });

                document.querySelectorAll('.partner-logo').forEach((img, index) => {
                    const partner = MOCK_PARTNERS[index % MOCK_PARTNERS.length];
                    const parent = img.parentElement;
                    parent.addEventListener('mouseenter', (e) => showTooltip(e, partner));
                    parent.addEventListener('mouseleave', hideTooltip);
                    parent.addEventListener('focus', (e) => showTooltip(e, partner));
                    parent.addEventListener('blur', hideTooltip);
                });
            }

            renderPartnerCards();
        }







/**
 * Initialise la section Blog avec carrousel
 */
function initBlogSection() {
  const blogContainer = document.getElementById('blog-list');
  if (!blogContainer) {
    console.warn('Conteneur blog non trouvé');
    return;
  }

  blogContainer.innerHTML = MOCK_BLOG_POSTS.map(
    (post, index) => `
      <div class="swiper-slide">
        <div class="blog-card bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform transition-transform duration-300 hover:scale-105 hover:shadow-neon-blue" data-aos="flip-up" data-aos-delay="${index * 100}">
          <img src="${post.image}" data-src="${post.image}" class="w-full h-48 object-cover rounded-t-xl mb-4 lazy" alt="Image de l'article ${post.title}">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white">${post.title}</h4>
          <p class="text-gray-500 dark:text-gray-400 text-sm">${post.date}</p>
          <p class="text-gray-600 dark:text-gray-300 mt-2 line-clamp-3">${post.content}</p>
          <button class="mt-4 text-blue-600 hover:text-blue-700 font-semibold read-more" data-post-id="${post.id}" aria-label="Lire l'article ${post.title}">
            Lire plus
          </button>
        </div>
      </div>
    `
  ).join('');

  lazyLoadImages(document.querySelectorAll('.blog-card img.lazy'));

  const swiperOptions = {
    slidesPerView: 1,
    spaceBetween: 24,
    loop: MOCK_BLOG_POSTS.length >= 3,
    autoplay: MOCK_BLOG_POSTS.length >= 3 ? { delay: 4500, disableOnInteraction: false } : false,
    pagination: {
      el: '.blog-swiper-pagination',
      clickable: true,
      renderBullet: (index, className) =>
        `<span class="${className} w-2.5 h-2.5 bg-gray-400 dark:bg-gray-600 rounded-full transition-all duration-300 hover:bg-blue-600 shadow-neon-blue focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Aller à l'article ${index + 1}"></span>`,
    },
    breakpoints: {
      640: { slidesPerView: 2, spaceBetween: 16 },
      1024: { slidesPerView: 3, spaceBetween: 24 },
    },
    a11y: {
      enabled: true,
      prevSlideMessage: 'Article précédent',
      nextSlideMessage: 'Article suivant',
      paginationBulletMessage: 'Aller à l’article {{index}}',
    },
  };

  new Swiper('.blog-swiper', swiperOptions);

  document.querySelectorAll('.read-more').forEach(button => {
    button.addEventListener('click', () => {
      const postId = button.dataset.postId;
      const post = MOCK_BLOG_POSTS.find(p => p.id === postId);
      if (post) {
        openBlogModal(post);
      }
    });
  });
}

/**
 * Ouvre une modale pour un article de blog
 * @param {Object} post - Données de l'article
 */
function openBlogModal(post) {
  const modal = document.createElement('div');
  modal.id = 'blog-modal';
  modal.className =
    'fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 opacity-0 backdrop-blur-sm';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto transform scale-95 transition-transform duration-500 relative border border-blue-500/30 shadow-neon-blue">
      <div class="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
        <h3 class="text-xl font-cinzel font-bold text-gray-900 dark:text-white shadow-neon-blue">${post.title}</h3>
        <button class="close-blog-modal text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Fermer la modale">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18"></path><path d="M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="p-6">
        <img src="${post.image}" alt="Image de l'article ${post.title}" class="w-full h-64 object-cover rounded-xl mb-4 lazy">
        <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">${post.date}</p>
        <p class="text-gray-600 dark:text-gray-300">${post.content}</p>
        <div class="mt-6 flex justify-end">
          <button class="close-blog-modal px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-neon-blue focus:outline-none focus:ring-2 focus:ring-blue-500">
            Fermer
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  lazyLoadImages(modal.querySelectorAll('img.lazy'));

  setTimeout(() => {
    modal.classList.remove('opacity-0');
    modal.classList.add('opacity-100');
    modal.querySelector('.bg-white, .dark\\:bg-gray-800').classList.remove('scale-95');
    modal.querySelector('.bg-white, .dark\\:bg-gray-800').classList.add('scale-100');
  }, 10);

  const closeModal = () => {
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    modal.querySelector('.bg-white, .dark\\:bg-gray-800').classList.remove('scale-100');
    modal.querySelector('.bg-white, .dark\\:bg-gray-800').classList.add('scale-95');
    setTimeout(() => modal.remove(), 500);
    document.body.style.overflow = 'auto';
  };

  modal.querySelectorAll('.close-blog-modal').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  modal.addEventListener('click', e => {
    if (e.target === modal) {
      closeModal();
    }
  });

  modal.querySelector('.close-blog-modal').focus();
  document.body.style.overflow = 'hidden';
}

/**
 * Initialise la section Événements avec carrousel
 */
function initEventsSection() {
  const eventsContainer = document.getElementById('events-list');
  if (!eventsContainer) {
    console.warn('Conteneur événements non trouvé');
    return;
  }

  eventsContainer.innerHTML = MOCK_EVENTS.map(
    (event, index) => `
      <div class="swiper-slide">
        <div class="event-card bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform transition-transform duration-300 hover:scale-105 hover:shadow-neon-blue" data-aos="flip-up" data-aos-delay="${index * 100}">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white">${event.title}</h4>
          <p class="text-gray-500 dark:text-gray-400 text-sm">${event.date} - ${event.location}</p>
          <p class="text-gray-600 dark:text-gray-300 mt-2">${event.description}</p>
        </div>
      </div>
    `
  ).join('');

  const swiperOptions = {
    slidesPerView: 1,
    spaceBetween: 24,
    loop: MOCK_EVENTS.length >= 3,
    autoplay: MOCK_EVENTS.length >= 3 ? { delay: 4000, disableOnInteraction: false } : false,
    pagination: {
      el: '.events-swiper-pagination',
      clickable: true,
      renderBullet: (index, className) =>
        `<span class="${className} w-2.5 h-2.5 bg-gray-400 dark:bg-gray-600 rounded-full transition-all duration-300 hover:bg-blue-600 shadow-neon-blue focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Aller à l'événement ${index + 1}"></span>`,
    },
    breakpoints: {
      640: { slidesPerView: 2, spaceBetween: 16 },
      1024: { slidesPerView: 3, spaceBetween: 24 },
    },
    a11y: {
      enabled: true,
      prevSlideMessage: 'Événement précédent',
      nextSlideMessage: 'Événement suivant',
      paginationBulletMessage: 'Aller à l’événement {{index}}',
    },
  };

  new Swiper('.events-swiper', swiperOptions);
}

/**
 * Initialise la section Galerie avec lightbox
 */
function initGallerySection() {
  const galleryContainer = document.getElementById('gallery-list');
  if (!galleryContainer) {
    console.warn('Conteneur galerie non trouvé');
    return;
  }

  galleryContainer.innerHTML = MOCK_GALLERY.map(
    (item, index) => `
      <div class="gallery-item relative overflow-hidden rounded-xl shadow-lg transform transition-transform duration-300 hover:scale-105 hover:shadow-neon-blue" data-aos="zoom-in" data-aos-delay="${index * 100}">
        <img src="${item.src}" data-src="${item.src}" class="w-full h-64 object-cover lazy" alt="${item.alt}">
        <button class="gallery-lightbox absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500" data-image="${item.src}" aria-label="Ouvrir ${item.alt} en plein écran">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
          </svg>
        </button>
      </div>
    `
  ).join('');

  lazyLoadImages(document.querySelectorAll('.gallery-item img.lazy'));

  document.querySelectorAll('.gallery-lightbox').forEach(button => {
    button.addEventListener('click', () => {
      openLightbox(button.dataset.image);
    });
  });
}

/**
 * Initialise la section Statistiques avec animations de comptage
 */
function initStatsSection() {
  const statsContainer = document.getElementById('stats-list');
  if (!statsContainer) {
    console.warn('Conteneur statistiques non trouvé');
    return;
  }

  // Génère les cartes à partir des données
  statsContainer.innerHTML = MOCK_STATS.map((stat, index) => `
    <div class="stat-card bg-white gap-4 dark:bg-ll-black rounded-2xl shadow-lg p-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left transition-all duration-500 hover:shadow-xl hover:shadow-indigo-500/20" data-aos="fade-up" data-aos-delay="${index * 100}">
      

      <div class="relative w-[140px] h-[140px] md:w-[120px] md:h-[120px] mb-2">
                <canvas id="stats-canvas-${index}" width="140" height="140" class="absolute inset-0"></canvas>
                <div class="absolute inset-[-3px] flex items-center justify-center z-10">
                    <div class="rounded-full p-4 ">
                      ${stat.svg}
                    </div>
                </div>
            </div>

      <div class="flex-1 mt-4 sm:mt-0">
        <p class="text-lg font-semibold text-ll-black dark:text-ll-white">${stat.label}</p>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">${stat.description}</p>
        <div class="flex items-baseline mt-2">
          <span id="stats-value-${index}" class="text-4xl font-cinzel font-bold text-ll-black dark:text-ll-white mr-2">0</span>
        </div>
      </div>
    </div>
  `).join('');

  const alreadyAnimated = new Set(); // Pour ne pas relancer l'animation plusieurs fois

  MOCK_STATS.forEach((stat, index) => {
    const statCard = statsContainer.children[index];

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !alreadyAnimated.has(index)) {
          animateCanvasCounter(index, stat.value, stat.unit);
          animateStatValue(index, stat.value, stat.unit);
          alreadyAnimated.add(index); // Marque comme déjà animé
        }
      });
    }, { threshold: 0.5 });

    observer.observe(statCard);

    // Efface le canvas si hors champ
    const fadeOutObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          const canvas = document.getElementById(`stats-canvas-${index}`);
          if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      });
    }, { threshold: 0 });

    fadeOutObserver.observe(statCard);
  });

  /**
   * Animation du canvas (cercle animé avec effet de pulse)
   */
  function animateCanvasCounter(index, target, unit) {
    const canvas = document.getElementById(`stats-canvas-${index}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const radius = (size / 2) - 10;
    const centerX = size / 2;
    const centerY = size / 2;

    let current = 0;
    const increment = target / 100;
    let animationFrameId;
    let pulsePhase = 0;
    let isCountingComplete = false;

    // Détection et suivi du thème
    let themeToApply = detectTheme();
    let fontColor = getFontColor(themeToApply);
    let glowColor = themeToApply === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(37, 99, 235, 0.3)';

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#2563EB');
    gradient.addColorStop(1, '#90EE90');

    function detectTheme() {
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return savedTheme !== null ? savedTheme : (systemPrefersDark ? 'dark' : 'light');
    }

    function getFontColor(theme) {
      return theme === 'dark' ? '#FDFDFC' : '#1B1B18';
    }

    function handleThemeChange() {
      const newTheme = detectTheme();
      if (newTheme !== themeToApply) {
        themeToApply = newTheme;
        fontColor = getFontColor(themeToApply);
        glowColor = themeToApply === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(37, 99, 235, 0.3)';
      }
    }

    // Réagir aux changements de thème
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

    function draw() {
      ctx.clearRect(0, 0, size, size);

      // Cercle de fond
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = themeToApply === 'dark' ? '#374151' : '#EDEDEC';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Arc de progression
      const progress = isCountingComplete ? 1 : current / target;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, (2 * Math.PI * progress) - Math.PI / 2);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 8;
      ctx.stroke();

      // Effet de pulse
      const pulseScale = 1 + 0.05 * Math.sin(pulsePhase);
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(pulseScale, pulseScale);
      ctx.translate(-centerX, -centerY);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 4, 0, 2 * Math.PI);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      pulsePhase += 0.05;

      // Incrémentation de la valeur
      if (!isCountingComplete && current < target) {
        current += increment;
        if (current >= target) {
          current = target;
          isCountingComplete = true;
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    }

    draw();
  }

  /**
   * Animation du texte de la statistique (compteur)
   */
  function animateStatValue(index, target, unit) {
    const valueElement = document.getElementById(`stats-value-${index}`);
    if (!valueElement) return;

    let current = 0;
    const increment = target / 100;
    let animationFrameId;

    function updateValue() {
      current += increment;
      if (current >= target) {
        current = target;
        valueElement.textContent = Math.floor(current) + (unit || '');
        cancelAnimationFrame(animationFrameId);
        return;
      }
      valueElement.textContent = Math.floor(current) + (unit || '');
      animationFrameId = requestAnimationFrame(updateValue);
    }

    updateValue();
  }
}




/**
 * Initialise la section Tarification avec grille
 */
function initPricingSection() {
  const pricingContainer = document.getElementById('pricing-list');
  if (!pricingContainer) {
    console.warn('Conteneur tarification non trouvé');
    return;
  }

  pricingContainer.innerHTML = MOCK_PRICING.map(
    (plan, index) => `
      <div class="pricing-card bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform transition-transform duration-300 hover:scale-105 hover:shadow-neon-blue" data-aos="flip-up" data-aos-delay="${index * 100}">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">${plan.name}</h4>
        <p class="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">${plan.price}€</p>
        <ul class="text-gray-600 dark:text-gray-300 mt-4 space-y-2">
          ${plan.features.map(feature => `<li class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><path d="M20 6L9 17l-5-5"></path></svg>${feature}</li>`).join('')}
        </ul>
        <button class="mt-6 bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-neon-blue focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Choisir le plan ${plan.name}">
          Choisir
        </button>
      </div>
    `
  ).join('');
}

/**
 * Initialise la section Contacts avec grille
 */
function initContactsSection() {
  const contactsContainer = document.getElementById('contacts-list');
  if (!contactsContainer) {
    console.warn('Conteneur contacts non trouvé');
    return;
  }

  contactsContainer.innerHTML = MOCK_CONTACTS.map(
    (contact, index) => `
      <div class="contact-card bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform transition-transform duration-300 hover:scale-105 hover:shadow-neon-blue" data-aos="fade-up" data-aos-delay="${index * 100}">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">${contact.name}</h4>
        <p class="text-gray-600 dark:text-gray-300 mt-2"><a href="mailto:${contact.email}" class="hover:text-blue-600">${contact.email}</a></p>
        <p class="text-gray-600 dark:text-gray-300"><a href="tel:${contact.phone}" class="hover:text-blue-600">${contact.phone}</a></p>
      </div>
    `
  ).join('');
}






function initWhyUsSection() {
  const whyUsContainer = document.getElementById('why-us-list');
  if (!whyUsContainer) {
    console.warn('Conteneur "Pourquoi Nous Choisir" non trouvé');
    return;
  }

  // Assurez-vous que WHY_US_DATA.reasons existe et est un tableau
  const reasons = Object.values(WHY_US_DATA);

  whyUsContainer.innerHTML = reasons.map((reason, index) => `
   <div class="service-card group relative rounded-xl overflow-hidden h-80 bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300" data-aos="fade-up" data-aos-delay="${index * 150}"> 
      <div 
        class="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-in-out group-hover:scale-110" 
        style="background-image: url('${reason.image}');"
      ></div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

      <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div class="relative h-48">
        
          <div class="initial-content absolute bottom-0 left-0 w-full transition-all duration-500 ease-out group-hover:-translate-y-full group-hover:opacity-0">
            <div class="icon-container w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-white/10 ${reason.color || 'text-white'}">
              ${reason.icon}
            </div>
            <h3 class="text-2xl font-bold font-sans tracking-tight">${reason.title}</h3>
          </div>

          <div class="hover-content absolute bottom-0 left-0 w-full opacity-0 translate-y-8 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0">
            <h4 class="text-xl font-bold font-sans tracking-tight mb-2">${reason.title}</h4>
            <p class="text-gray-200 text-sm mb-4">${reason.description || reason.hoverDescription}</p>
            ${reason.stats ? `
              <div class="border-t border-white/20 pt-3">
                <span class="text-xs font-semibold text-gray-300 uppercase tracking-wider">${reason.stats.label}</span>
                <p class="text-2xl font-bold">${reason.stats.value}</p>
              </div>
            ` : ''}
          </div>
          
        </div>
      </div>
    </div>
  `).join('');

  // L'observateur pour l'animation de flottement reste utile
  const observers = [];
  document.querySelectorAll('.reason-card').forEach(card => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const iconContainer = card.querySelector('.icon-container');
        if (iconContainer) {
          iconContainer.style.animation = entry.isIntersecting 
            ? 'float 3s ease-in-out infinite' 
            : 'none';
        }
      });
    }, { threshold: 0.3 }); // Déclenche quand 30% de la carte est visible
    observer.observe(card);
    observers.push(observer);
  });
}

// N'oubliez pas d'appeler la fonction
// document.addEventListener('DOMContentLoaded', initWhyUsSection);

/**
 * Initialise les modales vidéo avec gestion plein écran
 */
function initVideoModal() {
  const videoModal = document.createElement('div');
  videoModal.id = 'video-modal';
  videoModal.className = 'fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 hidden transition-opacity duration-300 backdrop-blur-sm';
  videoModal.innerHTML = `
    <div class="bg-black rounded-2xl shadow-2xl max-w-4xl w-full transform scale-95 transition-transform duration-500 relative border border-blue-500/30 shadow-neon-blue">
      <button class="absolute -top-12 right-0 text-white text-2xl z-10 close-video-modal focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Fermer la modale vidéo">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6L6 18"></path><path d="M6 6l12 12"></path>
        </svg>
      </button>
      <div class="aspect-video bg-black rounded-lg overflow-hidden">
        <video id="modal-video" class="w-full h-full" controls preload="metadata">
          <source src="" type="video/mp4">
          Votre navigateur ne supporte pas la balise vidéo.
        </video>
      </div>
      <button class="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full z-10 fullscreen-video focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Passer en plein écran">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
        </svg>
      </button>
    </div>
  `;
  document.body.appendChild(videoModal);

  const modalVideo = document.getElementById('modal-video');
  const closeButton = videoModal.querySelector('.close-video-modal');
  const fullscreenButton = videoModal.querySelector('.fullscreen-video');

  document.querySelectorAll('.carousel-slide video').forEach(video => {
    const playButton = document.createElement('button');
    playButton.className =
      'absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full z-20 video-play-button hover:bg-blue-600 transition-colors shadow-neon-blue focus:outline-none focus:ring-2 focus:ring-blue-500';
    playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>';
    playButton.setAttribute('aria-label', 'Ouvrir la vidéo en plein écran');
    playButton.addEventListener('click', () => {
      videoModal.classList.remove('hidden');
      modalVideo.src = video.querySelector('source').src;
      modalVideo.play().catch(error => console.error('Erreur de lecture vidéo:', error));
      document.body.style.overflow = 'hidden';
    });
    video.parentElement.appendChild(playButton);
  });

  const closeModal = () => {
    videoModal.classList.add('hidden');
    modalVideo.pause();
    document.body.style.overflow = 'auto';
  };

  closeButton.addEventListener('click', closeModal);

  videoModal.addEventListener('click', e => {
    if (e.target === videoModal) {
      closeModal();
    }
  });

  fullscreenButton.addEventListener('click', () => {
    if (modalVideo.requestFullscreen) {
      modalVideo.requestFullscreen();
    } else if (modalVideo.webkitRequestFullscreen) {
      modalVideo.webkitRequestFullscreen();
    } else if (modalVideo.msRequestFullscreen) {
      modalVideo.msRequestFullscreen();
    }
  });

  videoModal.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !videoModal.classList.contains('hidden')) {
      closeModal();
    }
  });
}

/**
 * Initialise la modale de sélection de catégorie
 */
function initCategoryModal() {
  const categoryButton = document.getElementById('category-button');
  const categoryModal = document.getElementById('category-modal');
  const closeCategoryModal = document.getElementById('close-category-modal');
  const categorySearch = document.getElementById('category-search');
  const categoryList = document.getElementById('category-list');

  if (!categoryButton || !categoryModal || !closeCategoryModal || !categorySearch || !categoryList) {
    console.warn('Éléments de la modale de catégorie non trouvés');
    return;
  }

  function updateCategoryList(searchQuery = '') {
    const filteredCategories = MOCK_CATEGORIES.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    categoryList.innerHTML = filteredCategories.map(
      category => `
        <button class="category-item flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-neon-blue" data-category="${category.id}" tabindex="0" data-aos="fade-up" data-aos-delay="${Math.random() * 100}">
          ${category.icon}
          <span class="text-sm font-medium text-gray-900 dark:text-white">${category.name}</span>
        </button>
      `
    ).join('');
    AOS.refresh();
  }

  updateCategoryList();

  categoryButton.addEventListener('click', () => {
    categoryModal.classList.remove('hidden');
    categorySearch.focus();
    AOS.refresh();
  });

  closeCategoryModal.addEventListener('click', () => {
    categoryModal.classList.add('hidden');
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !categoryModal.classList.contains('hidden')) {
      categoryModal.classList.add('hidden');
    }
  });

  categorySearch.addEventListener('input', debounce(e => {
    updateCategoryList(e.target.value);
  }, 300));

  categoryList.addEventListener('click', e => {
    const button = e.target.closest('.category-item');
    if (button) {
      const categoryId = button.dataset.category;
      const category = MOCK_CATEGORIES.find(c => c.id === categoryId);
      if (category) {
        document.getElementById('selected-category').textContent = category.name;
        document.getElementById('category-input').value = category.id;
        categoryModal.classList.add('hidden');
        updateFilters();
      }
    }
  });

  categoryList.addEventListener('keydown', e => {
    const items = categoryList.querySelectorAll('.category-item');
    const currentItem = document.activeElement;
    const index = Array.from(items).indexOf(currentItem);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % items.length;
      items[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + items.length) % items.length;
      items[prevIndex].focus();
    } else if (e.key === 'Enter' && currentItem.classList.contains('category-item')) {
      currentItem.click();
    }
  });
}

/**
 * Initialise les sélecteurs de nombres
 */
function initNumberPicker() {
  document.querySelectorAll('.number-picker').forEach(picker => {
    const input = picker.querySelector('input[type="number"]');
    const upButton = picker.querySelector('.increase');
    const downButton = picker.querySelector('.decrease');

    if (!input || !upButton || !downButton) {
      console.warn('Éléments du sélecteur de nombres non trouvés');
      return;
    }

    const min = parseInt(input.min) || 0;
    const max = parseInt(input.max) || 1000;
    const step = parseInt(input.step) || 1;

    const updateValue = value => {
      const newValue = Math.max(min, Math.min(max, value));
      input.value = newValue;
      updateFilters();
    };

    upButton.addEventListener('click', () => {
      updateValue(parseInt(input.value || min) + step);
    });

    downButton.addEventListener('click', () => {
      updateValue(parseInt(input.value || min) - step);
    });

    input.addEventListener('input', () => {
      updateValue(parseInt(input.value) || min);
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        updateValue(parseInt(input.value || min) + step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        updateValue(parseInt(input.value || min) - step);
      }
    });
  });
}

// Toggle loading state for before/after showcase
function toggleBeforeAfterLoading(show) {
  const loadingEl = document.getElementById('before-after-loading');
  const beforeAfterList = document.getElementById('before-after-list');
  if (loadingEl && beforeAfterList) {
    loadingEl.classList.toggle('hidden', !show);
    beforeAfterList.classList.toggle('hidden', show);
  }
}

/**
 * Renders before/after showcase from JSON data.
 */
async function renderBeforeAfter() {
  const beforeAfterList = document.getElementById('before-after-list');
  const loadingEl = document.getElementById('before-after-loading');
  if (!beforeAfterList || !loadingEl) return;

  toggleBeforeAfterLoading(true);

  try {
    // Fetch JSON data securely
    const response = await fetch('/assets/json/mock/before-after.json', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const showcases = data.showcases || [];

    if (showcases.length === 0) {
      beforeAfterList.innerHTML = '<p class="text-center text-gray-500">Aucune transformation disponible pour le moment.</p>';
      toggleBeforeAfterLoading(false);
      return;
    }

    const beforeAfterItems = showcases.map((showcase, index) => {
      const before = showcase.before || { url: '', description: '' };
      const after = showcase.after || { url: '', description: '' };
      const title = showcase.title || 'Transformation';

      return `
        <div class="before-after-container relative overflow-hidden rounded-xl shadow-lg border border-black-500" data-aos="fade-up" data-aos-delay="100">
                    <img src="${before.url}" alt="${before.description}" class="before w-full h-64 object-cover">
                    <img src="${after.url}" alt="${after.description}" class="after w-full h-64 object-cover absolute top-0 left-0">
                    <div class="comparison-slider absolute top-0 h-full w-1 bg-blue-600 cursor-ew-resize"></div>
                </div>  
      `;
    });

    beforeAfterList.innerHTML = beforeAfterItems.join('');
    initBeforeAfterSliders();
  } catch (error) {
    console.error('Erreur lors du chargement des données before/after:', error);
    beforeAfterList.innerHTML = '<p class="text-center text-red-500">Erreur lors du chargement des transformations. Veuillez réessayer plus tard.</p>';
  } finally {
    toggleBeforeAfterLoading(false);
  }
}

/**
 * Initialise les sliders avant/après avec accessibilité et sécurité améliorées
 */
function initBeforeAfterSliders() {
  document.querySelectorAll('.before-after-container').forEach(container => {
    const beforeImg = container.querySelector('.before');
    const afterImg = container.querySelector('.after');
    const slider = container.querySelector('.comparison-slider');

    if (!beforeImg || !afterImg || !slider) {
      console.warn('Éléments du slider avant/après non trouvés');
      return;
    }

    let isDragging = false;

    const updateSlider = x => {
      const rect = container.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100));
      afterImg.style.clipPath = `polygon(${percentage}% 0%, 100% 0%, 100% 100%, ${percentage}% 100%)`;
      slider.style.left = `${percentage}%`;
      slider.setAttribute('aria-valuenow', percentage.toFixed(0));
    };

    const startDragging = x => {
      isDragging = true;
      updateSlider(x);
    };

    const stopDragging = () => {
      isDragging = false;
    };

    // Mouse events
    slider.addEventListener('mousedown', e => {
      e.preventDefault(); // Prevent text selection
      startDragging(e.clientX);
    });

    container.addEventListener('mousemove', e => {
      if (isDragging) {
        updateSlider(e.clientX);
      }
    });

    document.addEventListener('mouseup', stopDragging);

    // Touch events
    container.addEventListener('touchstart', e => {
      e.preventDefault(); // Prevent scrolling
      startDragging(e.touches[0].clientX);
    }, { passive: false });

    container.addEventListener('touchmove', e => {
      if (isDragging) {
        e.preventDefault(); // Prevent scrolling
        updateSlider(e.touches[0].clientX);
      }
    }, { passive: false });

    document.addEventListener('touchend', stopDragging);

    // Keyboard accessibility
    slider.setAttribute('tabindex', '0');
    slider.setAttribute('role', 'slider');
    slider.setAttribute('aria-valuemin', '0');
    slider.setAttribute('aria-valuemax', '100');
    slider.setAttribute('aria-valuenow', '50');
    slider.setAttribute('aria-label', 'Contrôle du slider avant/après');

    slider.addEventListener('keydown', e => {
      const rect = container.getBoundingClientRect();
      let percentage = parseFloat(slider.style.left || '50');
      if (e.key === 'ArrowLeft') {
        percentage = Math.max(0, percentage - 5);
      } else if (e.key === 'ArrowRight') {
        percentage = Math.min(100, percentage + 5);
      } else {
        return;
      }
      updateSlider(rect.left + (rect.width * percentage) / 100);
    });

    // Initialize slider position
    updateSlider(container.getBoundingClientRect().left + container.getBoundingClientRect().width / 2);

    // Error handling for images
    beforeImg.addEventListener('error', () => {
      beforeImg.src = '/assets/images/image.png';
      beforeImg.alt = 'Image avant indisponible';
    });

    afterImg.addEventListener('error', () => {
      afterImg.src = '/assets/images/logo.png';
      afterImg.alt = 'Image après indisponible';
    });
  });
}






/**
 * Affiche l'animation de chargement
 */
function showLoadingAnimation() {
  const servicesContainer = document.getElementById('services-list');
  if (!servicesContainer) return;

  servicesContainer.innerHTML = `
    <div class="flex justify-center items-center h-64" id="loading-animation" data-aos="zoom-in">
      <lottie-player src="/assets/json/animation.json" background="transparent" speed="1" style="width: 150px; height: 150px;" loop autoplay></lottie-player>
    </div>
  `;
}

/**
 * Affiche un message pour résultats vides
 */
function showNoResultsMessage(suggestedServices) {
  const servicesContainer = document.getElementById('services-list');
  if (!servicesContainer) return;

  servicesContainer.innerHTML = `
    <div class="text-center py-12" data-aos="fade-up">
      <h3 class="text-xl font-cinzel font-bold text-gray-900 dark:text-white mb-4 shadow-neon-blue">Aucun résultat trouvé</h3>
      <p class="text-gray-600 dark:text-gray-300 mb-8">Veuillez modifier vos filtres pour voir plus de services.</p>
      <button id="reset-filters" class="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-neon-blue focus:outline-none focus:ring-2 focus:ring-blue-500">Réinitialiser les filtres</button>
    </div>
    ${
      suggestedServices.length > 0
        ? `
      <div class="mt-12">
        <h3 class="text-xl font-cinzel font-bold text-gray-900 dark:text-white mb-6 shadow-neon-blue">Ces services pourraient vous intéresser</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ${suggestedServices
            .map(
              service => `
            <div class="service-card-enhanced bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform transition-transform duration-300 hover:scale-105 hover:shadow-neon-blue" data-aos="flip-up" data-aos-delay="${Math.random() * 100}">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">${service.title}</h4>
              <p class="text-gray-600 dark:text-gray-300 mt-2">${service.description}</p>
              <button class="mt-4 text-blue-600 hover:text-blue-700 font-semibold expand-service" data-service-id="${service.id}" aria-label="En savoir plus sur ${service.title}">
                En savoir plus
              </button>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
        : ''
    }
  `;

  document.getElementById('reset-filters')?.addEventListener('click', () => {
    const form = document.getElementById('service-filters-form');
    form.reset();
    document.getElementById('selected-category').textContent = 'Tout';
    document.getElementById('category-input').value = 'all';
    updateFilters();
  });
}

/**
 * Met à jour les filtres
 */
const updateFilters = debounce(async () => {
  const servicesContainer = document.getElementById('services-list');
  if (!servicesContainer) return;

  showLoadingAnimation();

  const filters = {
    category: document.getElementById('category-input')?.value || 'all',
    areaMin: parseInt(document.getElementById('areaMin-input')?.value) || 0,
    areaMax: parseInt(document.getElementById('areaMax-input')?.value) || 1000,
    durationMin: parseInt(document.getElementById('durationMin-input')?.value) || 0,
    durationMax: parseInt(document.getElementById('durationMax-input')?.value) || 24,
    priceMin: parseInt(document.getElementById('priceMin-input')?.value) || 0,
    priceMax: parseInt(document.getElementById('priceMax-input')?.value) || 10000,
    ecoFriendly: document.getElementById('ecoFriendly-input')?.checked || false,
  };

  try {
    const services = await loadServices(filters);
    servicesContainer.classList.add('opacity-0');
    if (services.length === 0) {
      const suggestedServices = await loadServices({ limit: 3 });
      showNoResultsMessage(suggestedServices);
    } else {
      setTimeout(() => {
        renderServices(services);
        servicesContainer.classList.remove('opacity-0');
        servicesContainer.classList.add('opacity-100');
        AOS.refresh();
        
      }, 300);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des services:', error);
    showNotification('Erreur lors du chargement des services.', 'error');
    showNoResultsMessage([]);
  }
}, 500);

/**
 * Initialise les filtres de services
 */
function initServiceFilters() {
  const form = document.getElementById('service-filters-form');
  const filterToggle = document.querySelector('.filter-toggle');
  const filterContent = document.querySelector('.filter-content');
  if (!form || !filterToggle || !filterContent) {
    console.warn('Éléments des filtres de services non trouvés');
    return;
  }

  filterToggle.addEventListener('click', () => {
    const isOpen = filterContent.classList.contains('open');
    filterContent.classList.toggle('open', !isOpen);
  });

  form.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('change', updateFilters);
    input.addEventListener('input', updateFilters);
  });

  const resetButton = document.getElementById('reset-filters');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      form.reset();
      document.getElementById('selected-category').textContent = 'Tout';
      document.getElementById('category-input').value = 'all';
      updateFilters();
    });
  }
}




/**
 * Initialise les particules interactives
 */
function initParticles() {
  if (typeof particlesJS === 'undefined' || !document.getElementById('particles-js')) {
    console.warn('particlesJS non chargé');
    return;
  }

  const particleDensity = window.innerWidth < 768 ? 50 : 100;
  particlesJS('particles-js', {
    particles: {
      number: { value: particleDensity, density: { enable: true, value_area: 800 } },
      color: { value: '#2563EB' },
      shape: { type: 'circle' },
      opacity: { value: 0.5, random: true, anim: { enable: true, speed: 1, opacity_min: 0.1 } },
      size: { value: 3, random: true, anim: { enable: true, speed: 2, size_min: 0.3 } },
      line_linked: { enable: true, distance: 150, color: '#2563EB', opacity: 0.4, width: 1 },
      move: { enable: true, speed: 3, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false },
    },
    interactivity: {
      detect_on: 'canvas',
      events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
      modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } },
    },
    retina_detect: true,
  });
}

/**
 * Initialise le formulaire de contact
 */
function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  const inputs = contactForm.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    if (input.value) {
      input.parentElement.classList.add('focused');
    }

    input.addEventListener('focus', () => {
      input.parentElement.classList.add('focused');
    });

    input.addEventListener('blur', () => {
      if (!input.value) {
        input.parentElement.classList.remove('focused');
      }
    });
  });

  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    if (!name || !email || !message) {
      showNotification('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showNotification('Veuillez entrer une adresse email valide.', 'error');
      return;
    }

    try {
      await api.contact.submit({ name, email, message });
      showNotification('Message envoyé avec succès !', 'success');
      form.reset();
      inputs.forEach(input => input.parentElement.classList.remove('focused'));
    } catch (error) {
      console.error('Échec de l’envoi du formulaire de contact:', error);
      showNotification('Erreur lors de l’envoi du message.', 'error');
    }
  });
}

/**
 * Initialise les animations de défilement
 */
function initScrollAnimations() {
  

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth',
        });
      }
    });
  });
}



function initEco(){

  const ecoContainer = document.getElementById('eco-list');
  if (!ecoContainer) {
    console.warn('Conteneur "Engagement Écologique" non trouvé');
    return;
  }

 
  const commitments = ECO_DATA.ecoCommitments;

  // Populate the eco section
  ecoContainer.innerHTML = commitments.map((commitment, index) => `
    <div class="eco-card relative group p-6 rounded-2xl border-2 border-green-500/20 bg-white dark:bg-ll-black shadow-lg hover:shadow-green-500/30 transform hover:scale-[1.03] transition-all duration-500 cursor-pointer overflow-hidden" data-aos="fade-up" data-aos-delay="${index * 100}" data-lottie-url="${commitment.lottieUrl}">
      <div class="relative w-40 h-20 mx-auto mb-4 flex items-center justify-center">
        <div class="icon-container absolute transition-opacity duration-500 group-hover:opacity-0">${commitment.icon}</div>
        <div class="lottie-container w-[100px] absolute opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
      </div>
      <h3 class="text-xl font-bold mb-2 text-center text-ll-black dark:text-ll-white group-hover:text-green-700 dark:group-hover:text-green-500 transition-colors duration-300">${commitment.title}</h3>
      <div class="content-container mt-4 overflow-hidden h-auto group-hover:h-auto transition-all duration-500 ease-in-out">
        <p class="text-center text-gray-700 dark:text-gray-300 transform  group-hover:translate-y-0 transition-transform duration-500 ease-out">${commitment.description}</p>
      </div>
      <div class="bubble-container absolute inset-0 pointer-events-none"></div>
    </div>
  `).join('');

  const cards = document.querySelectorAll('.eco-card');
  cards.forEach(card => {
    const icon = card.querySelector('.icon-container');
    const lottieContainer = card.querySelector('.lottie-container');
    const bubbleContainer = card.querySelector('.bubble-container');
    let lottieAnimation = null;
    let isHovering = false;

    // IntersectionObserver for Lottie animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !lottieAnimation) {
          const lottieUrl = card.dataset.lottieUrl;
          if (lottieUrl) {
            lottieAnimation = lottie.loadAnimation({
              container: lottieContainer,
              renderer: 'svg',
              loop: true,
              autoplay: false,
              path: lottieUrl
            });
            observer.unobserve(card);
          }
        }
      });
    }, { threshold: 0.2 });
    observer.observe(card);

    // Bubble animation on hover
    const createBubble = () => {
      const bubble = document.createElement('div');
      bubble.className = 'bubble absolute bg-green-500/10 dark:bg-green-400/10 rounded-full';
      const size = Math.random() * 20 + 10;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 100}%`;
      bubble.style.top = `${Math.random() * 100}%`;
      bubble.style.opacity = '0';
      bubbleContainer.appendChild(bubble);

      bubble.animate([
        { transform: 'translateY(0) scale(0)', opacity: 0.5 },
        { transform: `translateY(-${Math.random() * 100 + 50}px) scale(1)`, opacity: 0 }
      ], {
        duration: 1000 + Math.random() * 1000,
        easing: 'ease-out'
      }).onfinish = () => bubble.remove();
    };

    // Hover event listeners
    card.addEventListener('mouseenter', () => {
      isHovering = true;
      if (icon) icon.style.opacity = '0';
      if (lottieContainer) lottieContainer.style.opacity = '1';
      if (lottieAnimation) lottieAnimation.play();
      const bubbleInterval = setInterval(createBubble, 300);
      card.dataset.bubbleInterval = bubbleInterval;
    });

    card.addEventListener('mouseleave', () => {
      isHovering = false;
      setTimeout(() => {
        if (!isHovering) {
          if (icon) icon.style.opacity = '1';
          if (lottieContainer) lottieContainer.style.opacity = '0';
          if (lottieAnimation) lottieAnimation.stop();
          // Stop bubble animation
          clearInterval(card.dataset.bubbleInterval);
          bubbleContainer.innerHTML = '';
        }
      }, 300);
    });
  });

}

function initAbout() {
    
  


    // Gérer l'état du thème
    let themeState = {
        themeToApply: detectTheme(),
        fontColor: getFontColor(detectTheme()),
        glowColor: getGlowColor(detectTheme())
    };

    function detectTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return savedTheme !== null ? savedTheme : (systemPrefersDark ? 'dark' : 'light');
    }

    function getFontColor(theme) {
        return theme === 'dark' ? '#FDFDFC' : '#1B1B18';
    }

    function getGlowColor(theme) {
        return theme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(37, 99, 235, 0.3)';
    }

    function handleThemeChange() {
        const newTheme = detectTheme();
        if (newTheme !== themeState.themeToApply) {
            themeState.themeToApply = newTheme;
            themeState.fontColor = getFontColor(newTheme);
            themeState.glowColor = getGlowColor(newTheme);
        }
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

    // Initialisation du DOM
    const statsContainer = document.getElementById('company-stats');
    if (!statsContainer) {
        console.warn('Conteneur des statistiques non trouvé');
        return;
    }

    const uniqueStats = [];
    const seenLabels = new Set();
    MOCK_STATS.slice(0,4).forEach(stat => {
        if (!seenLabels.has(stat.label)) {
            uniqueStats.push(stat);
            seenLabels.add(stat.label);
        }
    });

    statsContainer.innerHTML = uniqueStats.map((stat, index) => `
        <div class="stat-item flex flex-col items-center" data-aos="fade-up" data-aos-delay="${500 + index * 100}">
            <div class="relative w-[140px] h-[140px] md:w-[120px] md:h-[120px] mb-2">
                <canvas id="stat-canvas-${index}" width="140" height="140" class="absolute inset-0"></canvas>
                <div class="absolute inset-[-3px] flex items-center justify-center z-10">
                    <div class="rounded-full p-4 shadow-md">
                      ${stat.svg}
                    </div>
                </div>
            </div>


            <div class="stat-number text-2xl font-cinzel font-bold text-ll-black dark:text-ll-white" id="stat-value-${index}">0</div>
            <div class="stat-label text-sm text-center text-ll-text-gray dark:text-ll-medium-gray">${stat.label}</div>
        </div>
    `).join('');

    // Reste de l'initialisation (Typing Text, Lottie Carousel)
    const typingContainer = document.getElementById('typing-text');
    if (typingContainer) {
        const paragraphs = typingContainer.querySelectorAll('p');
        let currentPara = 0;
        let currentChar = 0;
        const textArray = Array.from(paragraphs).map(p => p.textContent);
        
        paragraphs.forEach(p => p.textContent = '');

        function type() {
            if (currentPara < textArray.length) {
                const currentText = textArray[currentPara];
                if (currentChar < currentText.length) {
                    paragraphs[currentPara].textContent += currentText[currentChar];
                    currentChar++;
                    setTimeout(type, 30);
                } else {
                    currentChar = 0;
                    currentPara++;
                    setTimeout(type, 500);
                }
            }
        }
        setTimeout(type, 1000);
    }

    const lottieSlides = document.querySelectorAll('.lottie-slide');
    let currentSlide = 0;

    lottieSlides.forEach((slide, index) => {
        const lottieUrl = slide.dataset.lottieUrl;
        if (lottieUrl) {
            lottie.loadAnimation({
                container: slide,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: lottieUrl
            });
        }
    });

    function showNextSlide() {
        lottieSlides.forEach((slide, index) => {
            const anim = slide.querySelector('svg')?.parentNode?.__animation;
            if (index === currentSlide) {
                slide.style.opacity = '1';
                if (anim) anim.play();
            } else {
                slide.style.opacity = '0';
                if (anim) anim.stop();
            }
        });
        currentSlide = (currentSlide + 1) % lottieSlides.length;
        setTimeout(showNextSlide, 5000);
    }
    if (lottieSlides.length > 0) {
        showNextSlide();
    }

    // Canvas Stats Animation
    uniqueStats.forEach((stat, index) => {
        const statItem = statsContainer.children[index];
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCanvasCounter(index, stat.value, stat.unit);
                    animateStatValue(index, stat.value, stat.unit);
                    observer.unobserve(statItem);
                }
            });
        }, { threshold: 0.5 });
        observer.observe(statItem);
    });



    function animateCanvasCounter(index, target, unit) {
    const canvas = document.getElementById(`stat-canvas-${index}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    // The sizes here must match the CSS classes w-[140px] h-[140px]
    const canvasSize = 140; 
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    ctx.scale(dpr, dpr);

    const radius = 50;
    const centerX = canvas.width / (2 * dpr);
    const centerY = canvas.height / (2 * dpr);

    let current = 0;
    const increment = target / 100;
    let animationFrameId;
    let pulsePhase = 0;
    let isCountingComplete = false;

    // Détection et suivi du thème
    let themeToApply = detectTheme();
    let fontColor = getFontColor(themeToApply);
    let glowColor = themeToApply === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(37, 99, 235, 0.3)';

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#2563EB');
    gradient.addColorStop(1, '#90EE90');

    function detectTheme() {
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return savedTheme !== null ? savedTheme : (systemPrefersDark ? 'dark' : 'light');
    }

    function getFontColor(theme) {
      return theme === 'dark' ? '#FDFDFC' : '#1B1B18';
    }

    function handleThemeChange() {
      const newTheme = detectTheme();
      if (newTheme !== themeToApply) {
        themeToApply = newTheme;
        fontColor = getFontColor(themeToApply);
        glowColor = themeToApply === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(37, 99, 235, 0.3)';
      }
    }

    // Réagir aux changements de thème
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cercle de fond
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = themeToApply === 'dark' ? '#374151' : '#EDEDEC';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Arc de progression
      const progress = isCountingComplete ? 1 : current / target;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, (2 * Math.PI * progress) - Math.PI / 2);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 8;
      ctx.stroke();

      // Effet de pulse
      const pulseScale = 1 + 0.05 * Math.sin(pulsePhase);
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(pulseScale, pulseScale);
      ctx.translate(-centerX, -centerY);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 4, 0, 2 * Math.PI);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      pulsePhase += 0.05;

      // Incrémentation de la valeur
      if (!isCountingComplete && current < target) {
        current += increment;
        if (current >= target) {
          current = target;
          isCountingComplete = true;
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    }

    draw();
  }


    function animateStatValue(index, target, unit) {
        const valueElement = document.getElementById(`stat-value-${index}`);
        if (!valueElement) return;

        let current = 0;
        const increment = target / 100;
        let animationFrameId;

        function updateValue() {
            current += increment;
            if (current >= target) {
                current = target;
                valueElement.textContent = Math.floor(current) + (unit || '');
                cancelAnimationFrame(animationFrameId);
                return;
            }
            valueElement.textContent = Math.floor(current) + (unit || '');
            animationFrameId = requestAnimationFrame(updateValue);
        }

        updateValue();
    }
}

/**
 * Initialisation globale
 */
document.addEventListener('DOMContentLoaded', async () => {
  await loadMockData();



  initAbout();
  initHeroCarousel();
  initTestimonialsCarousel();
  initFAQSection();
  initTeamSection();
  initPartnersSection();
  initBlogSection();
  initEventsSection();
  initGallerySection();
  initStatsSection();
  initPricingSection();
  initContactsSection();
  initCategoryModal();
  initNumberPicker();
 // initBeforeAfterSliders();
  initServiceFilters();
  initParticles();
  initContactForm();
  initScrollAnimations();
  initVideoModal();
  initWhyUsSection();
  initEco();
  renderBeforeAfter();

  window.openLightbox = openLightbox;

  loadServices().then(services => {
    renderServices(services);
    AOS.refresh();
  });


  const heroSection = document.getElementById("hero");
  const header = document.getElementById("blurred-header");

  if (heroSection && header) {
    const onScroll = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      if (isDarkMode) return; 

      const heroBottom = heroSection.getBoundingClientRect().bottom;
      const headerHeight = header.offsetHeight;

      if (heroBottom <= headerHeight) {
        // On est passé sous le hero → applique le style clair
        header.classList.add("header-light-style");
      } else {
        // On est encore sur le hero → style transparent
        header.classList.remove("header-light-style");
      }
    };

    // Vérifie immédiatement au chargement
    onScroll();

    // Vérifie à chaque scroll
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onScroll);
  }


    // Animation de chargement initial
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                if (loadingOverlay.parentNode) {
                    loadingOverlay.parentNode.removeChild(loadingOverlay);
                }
            }, 500);
        }, 1000);
    }

    // Optimisation des performances : nettoyer les écouteurs d'événements lors du déchargement
    window.addEventListener('unload', () => {
        swiperInstance?.destroy();
    });
});



