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
import loadServicesModule, { getServiceIndex, setServiceIndex } from '../injection/loadService.js';
const { loadServices, renderServicesSidebar, renderServiceDetail, navigateService, toggleServicesLoading } = loadServicesModule;


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
let currentServiceIndex = getServiceIndex();
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
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    sidebarMessage: 'Nettoyage professionnel à Angers pour un espace éclatant.'
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    title: 'Professionnels du Nettoyage',
    subtitle: 'Solutions sur mesure pour entreprises et particuliers dans l’Ouest de la France',
    thumbnail: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    sidebarMessage: 'Découvrez nos services personnalisés pour tous vos besoins.'
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    title: 'Nettoyage Écologique',
    subtitle: 'Produits biodégradables pour un avenir durable à Angers',
    thumbnail: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    sidebarMessage: 'Un nettoyage respectueux de l’environnement.'
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    title: 'Avant & Après',
    subtitle: 'Transformez vos espaces avec nos services professionnels',
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    sidebarMessage: 'Voyez la différence avec nos nettoyages.'
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    title: 'Outils Modernes',
    subtitle: 'Technologie de pointe pour des résultats impeccables',
    thumbnail: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    sidebarMessage: 'Des outils innovants pour un nettoyage optimal.'
  },
  {
    type: 'video',
    src: '/assets/videos/hamburgeur.mp4',
    poster: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    title: 'Technologie de Nettoyage',
    subtitle: 'Découvrez nos outils modernes pour un nettoyage optimal',
    thumbnail: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    sidebarMessage: 'Technologie avancée pour des résultats éclatants.'
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    title: 'Service Personnalisé',
    subtitle: 'Des solutions adaptées à vos besoins spécifiques à Angers',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    sidebarMessage: 'Des services sur mesure pour vous.'
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    title: 'Engagement Communautaire',
    subtitle: 'Nous soutenons les initiatives locales à Angers',
    thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    sidebarMessage: 'Soutien aux projets locaux pour un avenir meilleur.'
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    title: 'Équipe Professionnelle',
    subtitle: 'Rencontrez nos experts dédiés à votre satisfaction',
    thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    sidebarMessage: 'Une équipe dévouée pour des résultats parfaits.'
  },
  {
    type: 'image',
    src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    title: 'Partenariats de Qualité',
    subtitle: 'Collaborez avec nos partenaires pour des résultats optimaux',
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

  // Generate Slides
  slidesContainer.innerHTML = HERO_SLIDES.map((slide, index) => `
    <div class="swiper-slide relative w-full h-full flex items-center justify-center" role="group" aria-label="Slide ${index + 1}">
      ${slide.type === 'video' ? `
        <div class="absolute inset-0 z-0">
          <video class="w-full h-full object-cover" poster="${slide.poster}" muted loop playsinline preload="auto" src="${slide.src}">
            <source src="${slide.src}" type="video/mp4">
          </video>
        </div>
        <div class="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70 z-[5]"></div>
      ` : `
        <div class="absolute inset-0 z-0 bg-cover bg-center" style="background-image: url('${slide.src}');"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70"></div>
      `}
      <div class="relative z-10 flex flex-col justify-center items-center text-center text-white h-full px-6">
        <h1 class="text-4xl md:text-6xl font-cinzel font-bold mb-4 tracking-tight gradiant">${slide.title}</h1>
        <p class="text-lg md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed font-light">${slide.subtitle}</p>


    <a href="#contact" class="btn-container btn-right text-ll-white hover:text-ll-white py-4 px-8 rounded-xl font-semibold shadow-lg !bg-transparent border-1 hover:!border-0 !border-ll-medium-gray py-4 px-6 rounded-xl font-semibold shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ll-blue/50 transition-all duration-300 transform flex items-center justify-center min-h-[56px] hover:bg-ll-light-bg dark:hover:bg-sidebar-dark">
        <div class="progress-fill bg-gradient-to-r from-ll-dark-blue to-ll-blue rounded-xl"></div>
        <div class="btn-content shine-effect">
          
            <div class="icon-wrapper mr-4">
                <svg class="icon-default" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <svg class="icon-hover" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="10 8 16 12 10 16 10 8"></polygon>
                </svg>
            </div>
              <span class="btn-text">Contactez nous</span>
        </div>
    </a>

      </div>
    </div>
  `).join('');

  // Generate Thumbnails
  thumbnailList.innerHTML = HERO_SLIDES.map((slide, index) => `
    <div class="thumbnail-item relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent transition-border duration-300 snap-center shadow-lg" 
         data-slide-index="${index}"
         data-sidebar-message="${slide.sidebarMessage}">
      <img src="${slide.thumbnail}" alt="Aperçu ${index + 1}" class="w-full h-full object-cover transition-transform duration-300 transform hover:scale-105">
    </div>
  `).join('');

  // DOM Variables
  const thumbnails = document.querySelectorAll('.thumbnail-item');
  const thumbContainer = document.getElementById('thumbnail-container');
  const parchmentInfo = document.getElementById('parchment-info');
  const navUp = document.getElementById('thumb-nav-up');
  const navDown = document.getElementById('thumb-nav-down');
  const viewport = document.getElementById('thumbnail-viewport');
  const scrollAmount = 80;

  // Parchment Timer
  let parchmentTimer;
  const parchmentDelay = 300;

  // Functions
  function updateThumbnails(activeIndex) {
    thumbnails.forEach((thumb, idx) => {
      thumb.classList.toggle('border-white', idx === activeIndex);
      thumb.classList.toggle('border-transparent', idx !== activeIndex);
    });
    showParchmentInfo(thumbnails[activeIndex]);
  }

  function handleSlideMedia(swiper) {
    swiper.slides.forEach((slide, idx) => {
      const video = slide.querySelector('video');
      if (video) {
        if (idx === swiper.activeIndex) {
          video.play().catch(() => console.log("Video autoplay blocked."));
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }

  function checkScrollButtons() {
    navUp.classList.toggle('hidden', viewport.scrollTop <= 10);
    navDown.classList.toggle('hidden', viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 10);
  }

  function showParchmentInfo(thumb) {
    clearTimeout(parchmentTimer);
    parchmentTimer = setTimeout(() => {
      const message = thumb.dataset.sidebarMessage;
      parchmentInfo.innerHTML = `
        <div class="flex items-start mb-2">
          <div class="text-xl mr-2">📜</div>
          <p class="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200">${message}</p>
        </div>
      `;
      parchmentInfo.classList.remove('hidden');
      parchmentInfo.classList.add('block', 'glass-effect', 'border', 'border-gray-400', 'dark:border-gray-600');
    }, parchmentDelay);
  }

  function hideParchmentInfo() {
    clearTimeout(parchmentTimer);
    parchmentInfo.classList.add('hidden');
    parchmentInfo.classList.remove('block', 'glass-effect', 'border', 'border-gray-400', 'dark:border-gray-600');
  }

  // Initialize Swiper
  const swiper = new Swiper('[data-carousel]', {
    effect: 'fade',
    fadeEffect: { crossFade: true },
    loop: true,
    autoplay: { delay: 7000, disableOnInteraction: false },
    resizeObserver: true,
    on: {
      slideChange: (swiper) => {
        updateThumbnails(swiper.realIndex);
        handleSlideMedia(swiper);
      },
      init: (swiper) => {
        updateThumbnails(swiper.realIndex);
        handleSlideMedia(swiper);
        checkScrollButtons();
      },
      resize: (swiper) => {
        swiper.update(); // Mettre à jour Swiper pour recalculer les dimensions
        checkScrollButtons();
        hideParchmentInfo();
      },
    },
    a11y: { enabled: true, prevSlideMessage: 'Précédent', nextSlideMessage: 'Suivant' },
  });

  // Débogage du redimensionnement
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      swiper.update(); // Recalculer les dimensions de Swiper
      slidesContainer.style.height = `${window.innerHeight}px`; // Ajuster la hauteur du conteneur
      checkScrollButtons();
    }, 100); // Débouncer pour éviter les recalculs excessifs
  });

  // Thumbnail Event Listeners
  thumbnails.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      swiper.slideToLoop(parseInt(thumb.dataset.slideIndex));
    });
    thumb.addEventListener('mouseenter', () => {
      showParchmentInfo(thumb);
    });
    thumb.addEventListener('mouseleave', () => {
      if (parseInt(thumb.dataset.slideIndex) !== swiper.realIndex) {
        hideParchmentInfo();
      }
    });
  });

  // Navigation Buttons
  navUp.addEventListener('click', () => {
    viewport.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
  });

  navDown.addEventListener('click', () => {
    viewport.scrollBy({ top: scrollAmount, behavior: 'smooth' });
  });

  // Scroll Detection
  viewport.addEventListener('scroll', checkScrollButtons);

  // Autoplay Control
  thumbContainer.addEventListener('mouseenter', () => {
    swiper.autoplay.stop();
    if (parchmentInfo.classList.contains('block')) {
      const activeIndex = swiper.realIndex;
      const hoveredThumbnail = Array.from(thumbnails).find(t => parseInt(t.dataset.slideIndex) === activeIndex);
      if (!hoveredThumbnail) {
        hideParchmentInfo();
      }
    }
  });

  thumbContainer.addEventListener('mouseleave', () => {
    swiper.autoplay.start();
    hideParchmentInfo();
  });

  // Hide parchment on hero section mouseleave
  document.getElementById('hero').addEventListener('mouseleave', () => {
    hideParchmentInfo();
  });
}


/**
 * Initialise le carrousel des témoignages avec un design futuriste et une boucle infinie
 */
function initTestimonialsCarousel() {
  const testimonialsContainer = document.getElementById('testimonials-list');
  const loadingIndicator = document.getElementById('testimonials-loading');
  if (!testimonialsContainer) {
    //console.log('Conteneur des témoignages non trouvé');
    return;
  }

  if (MOCK_TESTIMONIALS.length === 0) {
    loadingIndicator?.classList.add('hidden');
    document.getElementById('no-testimonials')?.classList.remove('hidden');
    return;
  }

  testimonialsContainer.innerHTML = MOCK_TESTIMONIALS.map((testimonial, index) => {
    const rating = Math.min(Math.max(Number(testimonial.rating), 0), 5);
    const expandIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    const collapseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><polyline points="18 15 12 9 6 15"></polyline></svg>`;

    return `
      <div class="swiper-slide">
        <div class="testimonial-card-futuristic relative p-6 bg-ll-white-800 dark:bg-ll-black-950 rounded-3xl border border-blue-600/20 dark:border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out h-full flex flex-col justify-between transform hover:-translate-y-2" data-aos="fade-up" data-aos-delay="${index * 100}">
          <div class="flex items-center mb-4">
            <img src="${testimonial.image}" data-src="${testimonial.image}" class="w-16 h-16 rounded-full object-cover mr-4 border-2 border-blue-500 lazy" alt="Photo de ${testimonial.author}">
            <div>
              <p class="font-bold text-lg text-white-400">${testimonial.author}</p>
              <p class="text-sm text-gray-400">${testimonial.title}</p>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">${testimonial.location} - ${new Date(testimonial.submitted_at).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          <div class="flex items-center mb-4">
            ${Array(rating).fill('<i class="fas fa-star text-yellow-400" aria-hidden="true"></i>').join('')}
            ${Array(5 - rating).fill('<i class="fas fa-star text-gray-600" aria-hidden="true"></i>').join('')}
          </div>
          <p class="text-base italic text-ll-black-300 dark:text-ll-white flex-grow transition-all duration-300 testimonial-text line-clamp-3">${testimonial.text}</p>
          
          <div class="text-center mt-6 flex justify-between items-center">
            <button class="view-full-testimonial flex items-center back-text bg-ll-blue text-ll-white py-2 px-4 rounded-full font-semibold hover:bg-ll-dark-blue transition-colors"
                    data-testimonial-id="${testimonial.id}" aria-label="Voir le témoignage complet de ${testimonial.author}">
                    ${expandIcon}
             <span class="ml-2"> Voir le complet </span>
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
<div class="modal-content bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full mx-auto overflow-hidden max-h-[90vh] overflow-y-auto transform scale-95 transition-transform duration-500">
      <button class="modal-close absolute top-4 right-4 z-10 bg-white dark:bg-gray-700 rounded-xl p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-md" aria-label="Fermer la modale">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    
      <div class="grid grid-cols-1 gap-6 p-6 md:p-8">
      <div class="flex flex-row items-center text-center space-y-2">
          <img src="${testimonial.image}" class="w-32 h-32 rounded-full object-cover mb-4 border-4 border-blue-200 dark:border-gray-600 shadow-md" alt="Photo de ${testimonial.author}">
          <div>
          <h3 class="text-2xl font-sans font-bold text-gray-900 dark:text-white">${testimonial.author}</h3>
          <p class="text-blue-600 dark:text-blue-400 font-medium">${testimonial.title}</p>
          <div class="mt-2 flex justify-center">
            ${Array(testimonial.rating).fill('<svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.098 9.397c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.97z"/></svg>').join('')}
            ${Array(5 - testimonial.rating).fill('<svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.098 9.397c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.97z"/></svg>').join('')}
          </div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">${testimonial.location} - ${new Date(testimonial.submitted_at).toLocaleDateString('fr-FR')}</p>
        </div>
        </div>
        <div class="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Témoignage Complet
          </h4>
          <p class="text-gray-700 dark:text-gray-300 italic leading-relaxed mb-4">${testimonial.text}</p>
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${testimonial.details}</p>
        </div>
        <div class="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Images du Travail Réalisé
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            ${testimonial.workImages.map(img => `
              <a href="${img}" target="_blank" rel="noopener noreferrer">
                <img src="${img}" class="w-full h-32 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300" alt="Image du travail réalisé pour ${testimonial.author}" loading="lazy">
              </a>
            `).join('')}
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
       // console.warn('Conteneur FAQ ou pagination non trouvé');
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
               // console.warn('Team container or modal elements not found');
                return;
            }

            let currentFilter = 'all';
            let swiperInstance = null;

            /**
             * Anime le cercle de progression.
             * @param {HTMLElement} circleElement - L'élément <circle> à animer.
             * @param {number} value - La valeur cible (0-100).
             */
            function animateCircularProgress(circleElement, value) {
                const radius = circleElement.r.baseVal.value;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (value / 100) * circumference;

                circleElement.style.strokeDasharray = `${circumference} ${circumference}`;
                // Initialise l'offset pour l'animation
                circleElement.style.strokeDashoffset = circumference; 

                // Démarre l'animation CSS
                setTimeout(() => {
                    circleElement.style.transition = 'stroke-dashoffset 1.5s ease-out';
                    circleElement.style.strokeDashoffset = offset;
                }, 50); // Petit délai pour garantir l'application du style initial

                // Animation du compteur de valeur
                const valueDisplay = circleElement.closest('.circular-progress').querySelector('.progress-value');
                if (valueDisplay) {
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
                }
            }


            /**
             * Renders team cards based on the selected filter and reinitializes the Swiper carousel.
             * @param {string} filter - The category to filter by ('all', 'management', 'cleaning', 'technical')
             */
            function renderTeamCards(filter = 'all') {


                const filteredTeam = filter === 'all' ? MOCK_TEAM : MOCK_TEAM.filter(member => member.roleCategory === filter);


                teamContainer.innerHTML = filteredTeam.map((member, index) => `
                    <div class="swiper-slide">
                        <div class="team-card bg-white dark:bg-gray-800 rounded-2xl border border-ll-black/20 dark:border-white/50 shadow-lg p-6 flex flex-col items-start hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2" data-aos="fade-up" data-aos-delay="${index * 100}">
                            <div class="flex items-center space-x-4 mb-4">
                                <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" data-src="${member.image}" class="w-20 h-20 rounded-full object-cover border-2 border-blue-400 lazy" alt="Photo de ${member.name}" loading="lazy">
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
                            // Génération des classes de couleur dynamiques pour la performance
                            const getPerformanceColorClass = (value) => {
                                if (value >= 90) return 'text-green-500';
                                if (value >= 80) return 'text-blue-600 dark:text-blue-400';
                                if (value >= 70) return 'text-yellow-500';
                                return 'text-red-500';
                            };

                            modalContent.innerHTML = `
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
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
                                            <div id="skills-progress" class="grid grid-cols-2 gap-4">
                                                ${member.skills.map(skill => `
                                                    <div class="flex flex-col items-center" data-skill-level="${skill.level}">
                                                        <div class="circular-progress w-20 h-20">
                                                            <svg class="w-full h-full" viewBox="0 0 100 100">
                                                                <circle class="text-gray-200 dark:text-gray-600 stroke-current" stroke-width="8" cx="50" cy="50" r="40" fill="transparent" />
                                                                <circle class="circular-progress-circle skill-progress-circle text-blue-600 dark:text-blue-400 stroke-current" stroke-width="8" stroke-linecap="round" cx="50" cy="50" r="40" fill="transparent" style="transition: stroke-dashoffset 1.5s ease-out;" />
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
                                            <div id="performance-progress" class="grid grid-cols-2 gap-4">
                                                ${Object.entries(member.performance).map(([key, value]) => `
                                                    <div class="flex flex-col items-center" data-performance-value="${value}">
                                                        <div class="circular-progress w-20 h-20">
                                                            <svg class="w-full h-full" viewBox="0 0 100 100">
                                                                <circle class="text-gray-200 dark:text-gray-600 stroke-current" stroke-width="8" cx="50" cy="50" r="40" fill="transparent" />
                                                                <circle class="circular-progress-circle performance-progress-circle ${getPerformanceColorClass(value)} stroke-current" stroke-width="8" stroke-linecap="round" cx="50" cy="50" r="40" fill="transparent" style="transition: stroke-dashoffset 1.5s ease-out;" />
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
                            header.classList.remove('z-30'); // Supprimer la classe 'z-30' pour éviter un conflit de z-index avec la modale
                            document.body.style.overflow = 'hidden';

                            if (swiperInstance.autoplay.running) {
                                swiperInstance.autoplay.stop();
                            }

                            // **CORRECTION DES ANIMATIONS DES CERLCE DE PROGRESSION**

                            setTimeout(() => {
                                // 1. Animation des Compétences
                                const skillContainers = modalContent.querySelectorAll('#skills-progress > div');
                                skillContainers.forEach(container => {
                                    const circle = container.querySelector('.skill-progress-circle');
                                    const value = parseInt(container.dataset.skillLevel);
                                    if (circle) animateCircularProgress(circle, value);
                                });

                                // 2. Animation des Indicateurs de Performance
                                const performanceContainers = modalContent.querySelectorAll('#performance-progress > div');
                                performanceContainers.forEach(container => {
                                    const circle = container.querySelector('.performance-progress-circle');
                                    const value = parseInt(container.dataset.performanceValue);
                                    if (circle) animateCircularProgress(circle, value);
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
                header.classList.remove('z-30'); // Retirer la classe 'z-30' si la modale est inactive
                document.body.style.overflow = 'auto';

                // Nettoyer les styles d'animation pour les prochaines ouvertures
                modalContent.querySelectorAll('.circular-progress-circle').forEach(circle => {
                    circle.style.transition = 'none';
                    circle.style.strokeDashoffset = circle.r.baseVal.value * 2 * Math.PI; // Réinitialiser
                });
                modalContent.querySelectorAll('.progress-value').forEach(el => el.textContent = '0%');


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
 * Initialise la section Partenaires avec deux lignes de défilement infini et modal au clic
 */
function initPartnersSection() {
  const partnersSection = document.getElementById('partners');
  if (!partnersSection) return;

  // Create modal element if not exists
  let modal = document.getElementById('partner-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'partner-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
    modal.innerHTML = `
      <div class="modal-content bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 overflow-hidden max-h-[90vh] overflow-y-auto transform scale-95 transition-transform duration-500">
    
      <button id="close-modal" class="modal-close absolute top-4 right-4 z-10 bg-white dark:bg-gray-700 rounded-xl p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-md" aria-label="Fermer la modale">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
        <div class="text-center mb-6">
          <img id="modal-logo" class="w-24 h-24 mx-auto rounded-full object-cover border-4 border-ll-blue shadow-md" alt="Logo Partenaire">
          <h3 id="modal-name" class="text-2xl font-cinzel font-bold text-ll-black dark:text-ll-white mt-4"></h3>
        </div>
        <div class="space-y-4">
          <h4 class="text-lg font-semibold text-ll-blue dark:text-ll-blue flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Notre Partenariat
          </h4>
          <p id="modal-description" class="text-ll-text-gray dark:text-ll-medium-gray leading-relaxed"></p>
          <a id="modal-website" href="#" target="_blank" rel="noopener noreferrer" class="block bg-ll-blue text-white py-3 rounded-lg hover:bg-ll-dark-blue transition-colors duration-300 shadow-md flex items-center justify-center gap-2 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-18 0m18 0a9 9 0 00-18 0m18 0v.01M3 12a9 9 0 0118 0m-18 0v-.01" />
            </svg>
            Visiter le site
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.getElementById('close-modal').addEventListener('click', closeModal);
  }

  function closeModal() {
    const modalContent = modal.querySelector('div');
    modalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
      modalContent.classList.remove('scale-95', 'opacity-0');
    }, 300);
  }

  function openModal(partner) {
    document.getElementById('modal-logo').src = partner.logo;
    document.getElementById('modal-name').textContent = partner.name;
    document.getElementById('modal-description').textContent = partner.description;
    document.getElementById('modal-website').href = partner.website;
    modal.classList.remove('hidden');
    const modalContent = modal.querySelector('div');
    setTimeout(() => {
      modalContent.classList.remove('scale-95', 'opacity-0');
    }, 10);
  }

  // Create two marquee lines
  const marqueeContainer = document.createElement('div');
  marqueeContainer.className = 'space-y-8 marquee-container';
  marqueeContainer.innerHTML = `
    <div class="marquee-wrapper relative flex overflow-hidden">
      <ul class="marquee flex animate-marquee-left"></ul>
    </div>
    <div class="marquee-wrapper relative flex overflow-hidden">
      <ul class="marquee flex animate-marquee-right"></ul>
    </div>
  `;

  document.getElementById('partners-list').replaceWith(marqueeContainer);

  const marqueeLeft = marqueeContainer.querySelector('.animate-marquee-left');
  const marqueeRight = marqueeContainer.querySelector('.animate-marquee-right');

  function renderPartners(marquee, partners) {
    const items = partners.map(partner => `
      <li class="flex-shrink-0 mx-8 partner-item" role="button" tabindex="0" aria-label="${partner.name}">
        <img src="${partner.logo}" alt="${partner.name}" class="w-32 h-auto object-contain cursor-pointer filter grayscale rounded rounded-xl hover:grayscale-0 transition-filter duration-300">
        <p class="text-sm text-ll-black dark:text-ll-white mt-2 text-center font-semibold">${partner.name}</p>
      </li>
    `).join('');
    marquee.innerHTML = items + items;
  }

  renderPartners(marqueeLeft, MOCK_PARTNERS);
  renderPartners(marqueeRight, MOCK_PARTNERS.slice().reverse()); // Reverse for opposite direction

  // Tooltip (simple)
  const tooltipEl = document.createElement('div');
  tooltipEl.id = 'partner-tooltip';
  tooltipEl.className = 'fixed hidden bg-ll-white dark:bg-sidebar-dark p-4 rounded-lg shadow-lg z-50 transition-opacity duration-300 max-w-xs w-fit text-sm';
  document.body.appendChild(tooltipEl);

  let tooltipTimeout;

// Affiche le tooltip
function showTooltip(e, partner) {
  clearTimeout(tooltipTimeout);

  const rect = e.currentTarget.getBoundingClientRect();

  tooltipEl.innerHTML = `
    <h4 class="font-bold text-base">${partner.name}</h4>
    <p class="text-sm mt-1">${partner.description.slice(0, 100)}...</p>
  `;

  tooltipEl.classList.remove('hidden');
  tooltipEl.style.opacity = '0';

  const offset = 12;
  tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
  tooltipEl.style.top = `${rect.top - offset}px`;
  tooltipEl.style.transform = 'translate(-50%, -100%)';

  setTimeout(() => {
    tooltipEl.style.opacity = '1';
  }, 10);
}

// Cache le tooltip avec délai
function hideTooltip() {
  tooltipEl.style.opacity = '0';
  tooltipTimeout = setTimeout(() => {
    tooltipEl.classList.add('hidden');
  }, 200);
}

// Event listeners
marqueeContainer.querySelectorAll('.partner-item').forEach(li => {
  const index = Array.from(li.parentElement.children).indexOf(li) % MOCK_PARTNERS.length;
  const partner = MOCK_PARTNERS[index];

  li.addEventListener('mouseenter', (e) => {
    li.parentElement.style.animationPlayState = 'paused';
    showTooltip(e, partner);
  });

  li.addEventListener('mouseleave', () => {
    li.parentElement.style.animationPlayState = 'running'; // reprend immédiatement
    hideTooltip();
  });

  li.addEventListener('click', () => openModal(partner));

  li.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') openModal(partner);
  });
});


}






/**
 * Initialise la section Blog avec carrousel
 */
function initBlogSection() {
  const blogContainer = document.getElementById('blog-list');
  if (!blogContainer) {
   // console.warn('Conteneur blog non trouvé');
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
   // console.warn('Conteneur événements non trouvé');
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
    //console.warn('Conteneur galerie non trouvé');
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
  const loadingIndicator = document.getElementById('stats-loading');
  if (!statsContainer) {
    // console.warn('Conteneur statistiques non trouvé');
    return;
  }

  // Génère les cartes à partir des données
  statsContainer.innerHTML = MOCK_STATS.map((stat, index) => `
    <div class="stat-card bg-white gap-4 dark:bg-ll-black rounded-2xl border border-ll-black/20 dark:border-white/50 shadow-lg p-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left transition-all duration-500 hover:shadow-xl hover:shadow-indigo-500/20" data-aos="fade-up" data-aos-delay="${index * 100}">
      
      <div class="relative w-[140px] h-[140px] mb-2">
                <canvas id="stats-canvas-${index}" class="w-full h-full absolute inset-0"></canvas>
                <div class="absolute inset-0 flex items-center justify-center z-10">
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

  loadingIndicator?.classList.add('hidden');

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

    // Réagir aux changements de thème
    const handleThemeChange = () => {
      const canvas = document.getElementById(`stats-canvas-${index}`);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Réinitialiser et relancer l'animation si déjà animé
        if (alreadyAnimated.has(index)) {
          animateCanvasCounter(index, stat.value, stat.unit);
        }
      }
    };

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

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
  //  console.warn('Conteneur tarification non trouvé');
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
   // console.warn('Conteneur contacts non trouvé');
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
   // console.warn('Conteneur "Pourquoi Nous Choisir" non trouvé');
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
            <div class="icon-container w-14 h-14 rounded-full flex items-center justify-center mb-4  ${reason.color || 'text-white'}">
              ${reason.icon === 'team' ? '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 508 508" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle style="fill:#90DFAA;" cx="254" cy="254" r="254"></circle> <g> <path style="fill:#2C9984;" d="M379.2,408c0,0,2,7.6-0.8,9.6c0,0-2.8,0.8-2.8,4.8c0,0,0,4.8-6,4.4c0,0-16.4,2-18.8-2 c0,0-1.6-2-0.8-5.6l18.8-7.2L379.2,408z"></path> <path style="fill:#2C9984;" d="M376.8,396.8c0,0,7.2,6,2,14c0,0-3.6,5.2-4,7.6c0,0,0.4,8-8,6c0,0-8.4-6-14.4-1.2 c0,0-4.4-0.4-2.4-6.4c0,0,4.8-6,7.6-11.6c0,0,1.6-1.2,0.8-5.6L376.8,396.8z"></path> <path style="fill:#2C9984;" d="M396,408c0,0-2,7.6,0.8,9.6c0,0,2.8,0.8,2.8,4.8c0,0,0,4.8,6,4.4c0,0,16.4,2,18.8-2 c0,0,1.6-2,0.8-5.6l-18.8-7.2L396,408z"></path> <path style="fill:#2C9984;" d="M398.4,396.8c0,0-7.2,6-2,14c0,0,3.6,5.2,4,7.6c0,0-0.4,8,8,6c0,0,8.4-6,14.4-1.2 c0,0,4.4-0.4,2.4-6.4c0,0-4.8-6-7.6-11.6c0,0-1.6-1.2-0.8-5.6L398.4,396.8z"></path> <polygon style="fill:#2C9984;" points="370.4,131.2 386.8,195.2 403.2,131.2 "></polygon> <polygon style="fill:#2C9984;" points="391.6,138 393.6,131.2 381.6,131.2 383.6,138 "></polygon> <polygon style="fill:#2C9984;" points="391.6,138 387.6,138 383.6,138 375.6,186.8 387.6,195.2 399.6,186.8 "></polygon> <path style="fill:#2C9984;" d="M356.8,220.8c-2.8,16.8-6.4,46.4-0.8,81.2c0,0,5.2,79.6,0.4,97.2c0,0,9.6,16.8,26,0 c0,0,0.4-131.2,4.8-136.4v-42H356.8z"></path> <path style="fill:#2C9984;" d="M387.6,220.8v41.6c4.4,5.6,4.8,136.4,4.8,136.4c16.8,16.8,26,0,26,0c-4.8-17.6,0.4-97.2,0.4-97.2 c5.6-34.8,2.4-64.4-0.8-81.2h-30.4V220.8z"></path> <polygon style="fill:#2C9984;" points="400.4,122.4 374.4,122.4 370.8,131.2 402.8,131.2 "></polygon> <path style="fill:#2C9984;" d="M372,128l-29.2,10.8c0,0,17.6,53.6,10,89.6c0,0-3.2,18.4-0.8,32.4c0,0,20.4,14.8,28,1.2 c0,0,10.4-32.4,8.4-64l-9.2-24.4L372,128z"></path> <path style="fill:#2C9984;" d="M374.4,122.4l-14,15.2l5.2,2.4l-4,4c0,0,13.2,40.4,26.8,54.4C388.4,198,373.6,135.6,374.4,122.4z"></path> <path style="fill:#2C9984;" d="M403.2,128l29.2,10.8c0,0-17.6,53.6-10,89.6c0,0,3.2,18.4,0.8,32.4c0,0-20.4,14.8-28,1.2 c0,0-10.4-32.4-8.4-64l9.2-24.4L403.2,128z"></path> <path style="fill:#2C9984;" d="M400.4,122.4l14,15.2l-5.2,2.4l4,4c0,0-13.2,40.4-26.8,54.4C386.4,198,401.2,135.6,400.4,122.4z"></path> <circle style="fill:#2C9984;" cx="391.6" cy="200.8" r="2.8"></circle> <polygon style="fill:#2C9984;" points="405.2,177.2 410,169.2 417.6,174.8 "></polygon> <rect x="403.171" y="174.42" transform="matrix(-0.9789 0.2042 -0.2042 -0.9789 850.0986 265.1172)" style="fill:#2C9984;" width="16.4" height="4"></rect> <path style="fill:#2C9984;" d="M434,256c0.4,3.2,0.4,5.6,0.4,5.6c0.8,0.8,2.8,3.6,2.8,3.6c4,3.2,2,5.6,2,5.6l0.4,2.4 c0.8,1.2,0.4,3.2,0.4,3.2c-2,4-3.6,0.8-3.6,0.8c-2.4,2.8-3.6-0.8-3.6-0.8c-2.8,1.2-3.6-1.6-3.6-1.6s-4.8,0.8-4-10.4 c0.4-2.8,0.4-5.6,0-8.4L434,256L434,256z"></path> <path style="fill:#2C9984;" d="M429.6,267.2c0-0.4,0.4-2,0.4-2c-0.8,2.4,2,3.6,2,3.6c-0.4,0-0.4-1.6-0.4-1.6c0.4,2,3.6,3.2,3.6,3.2 c0.4-1.2,1.6-2,1.6-2c-0.8,1.2-0.8,2-0.8,2c0.4,0,1.2,0.8,1.2,0.8c-0.8-0.8-1.2,0-1.2,0c1.6,0.4,1.2,2,1.2,2c0-1.6-0.8-1.2-0.8-1.2 c0.8,0.8,0.4,1.6,0.4,1.6c0-1.2-1.6-1.2-1.6-1.2c0.8-1.2,0-0.8,0-0.8c-1.2-2-2,0-2,0.8h-0.4c0.8-2,0-2.4,0-2.4 c-1.2-1.2-1.6,0.8-1.6,0.8c0,3.2-2,4.4-2,4.4h-0.4c1.2-0.4,2-2.4,2-2.4c1.2-3.2-0.4-3.2-0.4-3.2c-2.4-0.4-2,2-2,2 c-0.8,0.4-2.4,0-2.4,0c0.4,0,1.2-0.4,1.2-0.4c0.8-0.8-0.4-2.4-0.4-2.4c0.8,0.8,3.6,0.8,3.6,0.8C431.2,268.8,430,267.6,429.6,267.2 l-0.4,0.8c0-0.4-0.8-2.4-0.8-2.4C428.8,265.6,429.6,266.8,429.6,267.2z"></path> <path style="fill:#2C9984;" d="M439.2,271.6c0,0-0.4,0.4-1.2,2.4c0,0-0.4,0.4-0.4,0.8c-0.4,0.4-0.8,0.8-1.6,0.8 c-0.8-0.4-2-0.4-2.8-0.4c0,0-0.8,0-1.6,0c-0.4,0-0.8-0.4-0.8-0.8c0.4-0.8,0.8-1.6,2-2c0,0,1.6-0.4,2,0c0,0-2.4-0.8-3.6,0.8 c0,0-1.6,1.6-0.4,2c0,0,3.6,0,4,0.4c0,0,1.6,0.8,2.4-0.4c0,0,0.4-1.6,2-1.2c0,0-0.4-0.4-1.2-0.4 C438.4,273.6,438.8,272.4,439.2,271.6z"></path> <path style="fill:#2C9984;" d="M436,275.2c0,0.8,0.4,2.8,0.4,2.8c-0.4-0.4-0.4-0.8-0.4-0.8c0,0.4-0.4,0.4-0.4,0.4 c0.4-1.2,0-2.4,0-2.4H436z"></path> <path style="fill:#2C9984;" d="M432.8,276.8C432.4,276.8,432.4,276.8,432.8,276.8c-0.4-0.4-0.4-0.4-0.4,0c0.4-0.8,0.4-2,0.4-2h0.4 C433.2,276,432.8,276.8,432.8,276.8z"></path> <rect x="423.6" y="250.4" style="fill:#2C9984;" width="12" height="8.4"></rect> <path style="fill:#2C9984;" d="M341.6,256c-0.4,3.2-0.4,5.6-0.4,5.6c-1.2,0.4-3.2,3.6-3.2,3.6c-4,3.2-2,5.6-2,5.6l-0.4,2.4 c-0.8,1.2-0.4,3.2-0.4,3.2c2,4,3.6,0.8,3.6,0.8c2.4,2.8,3.6-0.8,3.6-0.8c2.8,1.2,3.6-1.6,3.6-1.6s4.8,0.8,4-10.4 c-0.4-2.8-0.4-5.6,0-8.4L341.6,256L341.6,256z"></path> <path style="fill:#2C9984;" d="M345.6,267.2c0-0.4-0.4-2-0.4-2c0.8,2.4-2,3.6-2,3.6c0.4,0,0.4-1.6,0.4-1.6c-0.4,2-3.6,3.2-3.6,3.2 c-0.4-1.2-1.6-2-1.6-2c0.8,1.2,0.8,2,0.8,2c-0.4,0-1.2,0.8-1.2,0.8c0.8-0.8,1.2,0,1.2,0c-1.6,0.4-1.2,2-1.2,2 c0-1.6,0.8-1.2,0.8-1.2c-0.8,0.8-0.4,1.6-0.4,1.6c0-1.2,1.6-1.2,1.6-1.2c-0.8-1.2,0-0.8,0-0.8c1.2-2,2,0,2,0.8h0.4 c-0.8-2,0-2.4,0-2.4c1.2-1.2,1.6,0.8,1.6,0.8c0,3.2,2,4.4,2,4.4h0.4c-1.2-0.4-2-2.4-2-2.4c-1.2-3.2,0.4-3.2,0.4-3.2 c2.4-0.4,2,2,2,2c0.8,0.4,2.4,0,2.4,0c-0.4,0-1.2-0.4-1.2-0.4c-0.8-0.8,0.4-2.4,0.4-2.4c-0.8,0.8-3.6,0.8-3.6,0.8 C344.4,268.8,345.6,267.6,345.6,267.2l0.4,0.8c0-0.4,0.8-2.4,0.8-2.4C346.4,265.6,346,266.8,345.6,267.2z"></path> <path style="fill:#2C9984;" d="M336,271.6c0,0,0.4,0.4,1.2,2.4c0,0,0,0.4,0.4,0.8s0.8,0.8,1.6,0.8c0.8-0.4,2-0.4,2.8-0.4 c0,0,0.8,0,1.6,0c0.4,0,0.8-0.4,0.8-0.8c-0.4-0.8-0.8-1.6-2-2c0,0-1.6-0.4-2,0c0,0,2.4-0.8,3.6,0.8c0,0,1.6,1.6,0.4,2 c0,0-3.6,0-4,0.4c0,0-1.6,0.8-2.4-0.4c0,0-0.4-1.6-2-1.2c0,0,0.4-0.4,1.2-0.4C336.8,273.6,336.8,272.4,336,271.6z"></path> <path style="fill:#2C9984;" d="M339.2,275.2c0,0.8-0.4,2.8-0.4,2.8c0.4-0.4,0.4-0.8,0.4-0.8c0,0.4,0.4,0.4,0.4,0.4 c-0.4-1.2,0-2.4,0-2.4H339.2z"></path> <path style="fill:#2C9984;" d="M342.8,276.8C342.8,276.8,343.2,276.8,342.8,276.8c0.4-0.4,0.4-0.4,0.4,0c-0.4-0.8-0.4-2-0.4-2h-0.4 C342.4,276,342.8,276.8,342.8,276.8z"></path> <rect x="340" y="250.4" style="fill:#2C9984;" width="12" height="8.4"></rect> <path style="fill:#2C9984;" d="M438,255.2h-16.8c0,0-0.4-43.6,2-51.6c0,0,0.8-8.4-1.2-15.2c2.8-26,10.4-49.2,10.8-49.6 C432.4,138.4,440.8,160,438,255.2z"></path> <path style="fill:#2C9984;" d="M336.8,255.2H354c0,0,0.4-43.6-2-51.6c0,0-0.8-8.4,1.2-15.2c-2.8-26-10.4-49.2-10.8-49.6 C342.8,138.4,334.4,160,336.8,255.2z"></path> <ellipse style="fill:#2C9984;" cx="387.6" cy="119.2" rx="11.2" ry="12"></ellipse> <path style="fill:#2C9984;" d="M398.4,117.2c0,0,2,10.4-10.8,14.4c0,0,7.2,1.6,10.4,10.4C398,142,406.8,128,398.4,117.2z"></path> <path style="fill:#2C9984;" d="M376.8,117.2c0,0-2,10.4,10.8,14.4c0,0-7.2,1.6-10.4,10.4C377.2,142,368.4,128,376.8,117.2z"></path> <path style="fill:#2C9984;" d="M403.2,108c-1.6,4.4-2,7.2-2.4,8l0,0c-3.6,4.8-8,8-13.2,8c-4.8,0-8.8-2.8-12.4-7.2 c-7.2-9.2-2.4-25.6-2.4-25.6c3.6,4.4,15.6,4.4,15.6,4.4c-4.8-0.8-6-4.4-6-4.8c0.8,2.4,12.4,4,12.4,4 C407.2,96.4,403.2,108,403.2,108z"></path> <path style="fill:#2C9984;" d="M380.8,73.6c0,0,16.4-6.4,24.4,8.4c8.8,15.6-2.4,32.8-4.4,34c0,0,0.4-2.8,2.4-8c0,0,4-11.6-8-13.6 c0,0-11.6-1.6-12.4-4c0,0,0.8,4,6,5.2c0,0-12-0.4-15.6-4.4c0,0-5.2,16.8,2.4,25.6c0,0-12.8-10.4-11.2-26 C364.4,90.8,363.6,69.2,380.8,73.6z"></path> </g> <g> <path style="fill:#E6E9EE;" d="M318.8,414.4c0,0,2,7.6-0.8,10c0,0-3.2,0.8-2.8,5.2c0,0,0,4.8-6.4,4.8c0,0-17.2,2-19.6-2 c0,0-2-2.4-0.8-5.6l19.6-7.2L318.8,414.4z"></path> <path style="fill:#E6E9EE;" d="M316.4,402.8c0,0,7.2,6.4,2,14.4c0,0-4,5.2-4,8c0,0,0.4,8.4-8.4,6.4c0,0-8.8-6.4-15.2-1.2 c0,0-4.4-0.4-2.4-6.8c0,0,5.2-6.4,8-12.4c0,0,1.6-1.2,0.8-5.6L316.4,402.8z"></path> <path style="fill:#E6E9EE;" d="M336.4,414.4c0,0-2,7.6,0.8,10c0,0,3.2,0.8,2.8,5.2c0,0,0,4.8,6.4,4.8c0,0,17.2,2,19.6-2 c0,0,2-2.4,0.8-5.6l-19.6-7.2L336.4,414.4z"></path> <path style="fill:#E6E9EE;" d="M339.2,402.8c0,0-7.2,6.4-2,14.4c0,0,4,5.2,4,8c0,0-0.4,8.4,8.4,6.4c0,0,8.8-6.4,15.2-1.2 c0,0,4.4-0.4,2.4-6.8c0,0-5.2-6.4-8-12.4c0,0-1.6-1.2-0.8-5.6L339.2,402.8z"></path> <polygon style="fill:#E6E9EE;" points="309.6,126.4 326.8,192.8 344,126.4 "></polygon> <polygon style="fill:#E6E9EE;" points="331.6,133.6 334,126.4 321.2,126.4 323.6,133.6 "></polygon> <polygon style="fill:#E6E9EE;" points="331.6,133.6 327.6,133.6 323.6,133.6 314.8,184 327.6,192.8 340.4,184 "></polygon> <path style="fill:#E6E9EE;" d="M295.6,219.6c-3.2,17.2-6.4,48.4-0.8,84.4c0,0,5.2,83.2,0.4,101.6c0,0,9.6,17.6,27.2,0 c0,0,0.4-136.8,5.2-142.4v-43.6H295.6z"></path> <path style="fill:#E6E9EE;" d="M327.6,219.6v43.6c4.8,5.6,5.2,142.4,5.2,142.4c17.2,17.6,27.2,0,27.2,0 c-4.8-18.4,0.4-101.6,0.4-101.6c5.6-36,2.4-67.2-0.8-84.4H327.6z"></path> <polygon style="fill:#E6E9EE;" points="341.2,116.8 314,116.8 310,126.4 343.2,126.4 "></polygon> <path style="fill:#E6E9EE;" d="M311.2,122.8L280.8,134c0,0,18.4,56,10.4,93.6c0,0-3.2,18.8-0.8,33.6c0,0,21.2,15.2,29.2,1.2 c0,0,10.8-33.6,8.8-66.4l-9.6-25.6L311.2,122.8z"></path> <path style="fill:#E6E9EE;" d="M314,116.8l-14.8,15.6l5.6,2.4l-4.4,4c0,0,13.6,42,28,56.4C328.4,195.6,313.2,130.4,314,116.8z"></path> <path style="fill:#E6E9EE;" d="M344,122.8l30.4,11.2c0,0-18.4,56-10.4,93.6c0,0,3.2,18.8,0.8,33.6c0,0-21.2,15.2-29.2,1.2 c0,0-10.8-33.6-8.8-66.4l9.6-25.6L344,122.8z"></path> <path style="fill:#E6E9EE;" d="M341.2,116.8l14.8,15.6l-5.6,2.4l4.4,4c0,0-13.6,42-28,56.4C326.4,195.6,342,130.4,341.2,116.8z"></path> <circle style="fill:#E6E9EE;" cx="332" cy="198.8" r="3.2"></circle> <polygon style="fill:#E6E9EE;" points="346,174 351.2,165.6 359.2,171.6 "></polygon> <rect x="343.946" y="171.214" transform="matrix(-0.9789 0.2042 -0.2042 -0.9789 733.0341 270.786)" style="fill:#E6E9EE;" width="17.2" height="4"></rect> <path style="fill:#E6E9EE;" d="M376,256.4c0.4,3.2,0.4,5.6,0.4,5.6c0.8,0.8,3.2,4,3.2,4c4.4,3.6,2,6,2,6l0.4,2.8 c1.2,1.2,0.4,3.2,0.4,3.2c-2,4.4-4,0.8-4,0.8c-2.4,3.2-4-0.8-4-0.8c-2.8,1.2-3.6-1.6-3.6-1.6s-5.2,0.8-4-11.2c0.4-2.8,0.4-6,0-8.8 H376z"></path> <path style="fill:#E6E9EE;" d="M371.6,268c0-0.4,0.4-2.4,0.4-2.4c-0.8,2.4,2,4,2,4c-0.4,0-0.4-1.6-0.4-1.6c0.4,2,4,3.6,4,3.6 c0.4-1.2,1.6-2,1.6-2c-1.2,0.8-1.2,2-1.2,2c0.8,0,1.2,0.8,1.2,0.8c-0.8-0.8-1.2,0-1.2,0c1.6,0.4,1.2,2,1.2,2c0-1.6-1.2-1.6-1.2-1.6 c0.8,0.8,0.4,1.6,0.4,1.6c0-1.2-1.6-1.6-1.6-1.6c0.8-1.2,0-0.8,0-0.8c-1.2-2-2,0-2,0.8h-0.4c0.8-2,0-2.4,0-2.4 c-1.6-1.2-1.6,0.8-1.6,0.8c0,3.2-2,4.4-2,4.4H370c1.2-0.4,2-2.4,2-2.4c1.2-3.2-0.4-3.6-0.4-3.6c-2.8-0.4-2,2-2,2 c-1.2,0.4-2.4,0-2.4,0c0.4,0,1.2-0.8,1.2-0.8c0.8-0.8-0.4-2.8-0.4-2.8c0.8,0.8,3.6,0.8,3.6,0.8c1.6,0,0.4-1.6,0.4-1.6l-0.8,0.4 c0-0.4-0.8-2.4-0.8-2.4C370.8,266.4,371.2,267.6,371.6,268z"></path> <path style="fill:#E6E9EE;" d="M381.6,272.4c0,0-0.4,0.4-1.2,2.4c0,0-0.4,0.4-0.4,0.8c-0.4,0.8-0.8,0.8-1.6,0.8 c-0.8-0.4-2-0.4-2.8-0.4c0,0-0.8,0-1.6,0c-0.4,0-0.8-0.4-0.8-0.8c0.4-0.8,0.8-1.6,2.4-2c0,0,1.6-0.4,2,0c0,0-2.4-0.8-4,0.8 c0,0-1.6,1.6-0.4,2.4c0,0,4,0,4,0.4c0,0,1.6,0.8,2.4-0.4c0,0,0.4-1.6,2-1.6c0,0-0.4-0.4-1.2-0.4 C380.8,274.4,380.8,273.2,381.6,272.4z"></path> <path style="fill:#E6E9EE;" d="M378.4,276.4c-0.4,0.8,0.4,2.8,0.4,2.8c-0.4-0.4-0.4-0.8-0.4-0.8c0,0.4-0.4,0.4-0.4,0.4 c0.4-1.2,0-2.8,0-2.8h0.4V276.4z"></path> <path style="fill:#E6E9EE;" d="M374.4,278L374.4,278c0,0,0,0-0.4,0c0.4-0.8,0.4-2,0.4-2h0.4C375.2,276.8,374.4,278,374.4,278z"></path> <rect x="365.2" y="250.4" style="fill:#E6E9EE;" width="12.8" height="8.8"></rect> <path style="fill:#E6E9EE;" d="M279.6,256.4c-0.4,3.2-0.4,5.6-0.4,5.6c-0.8,0.8-3.2,4-3.2,4c-4.4,3.6-2,6-2,6v2.4 c-1.2,1.2-0.4,3.2-0.4,3.2c2,4.4,4,0.8,4,0.8c2.4,3.2,4-0.8,4-0.8c2.8,1.2,3.6-1.6,3.6-1.6s5.2,0.8,4-11.2c-0.4-2.8-0.4-6,0-8.8 h-9.6V256.4z"></path> <path style="fill:#E6E9EE;" d="M284,268c0-0.4-0.4-2.4-0.4-2.4c0.8,2.4-2,4-2,4c0.4,0,0.4-1.6,0.4-1.6c-0.4,2-4,3.6-4,3.6 c-0.4-1.2-1.6-2-1.6-2c0.8,1.2,1.2,2,1.2,2c-0.8,0-1.2,0.8-1.2,0.8c0.8-0.8,1.2,0,1.2,0c-1.6,0.4-1.2,2-1.2,2 c0-1.6,1.2-1.6,1.2-1.6c-0.8,0.8-0.4,1.6-0.4,1.6c0-1.2,1.6-1.6,1.6-1.6c-0.8-1.2,0-0.8,0-0.8c1.2-2,2,0,2,0.8h0.4 c-0.8-2,0-2.4,0-2.4c1.6-1.2,1.6,0.8,1.6,0.8c0,3.2,2,4.4,2,4.4h0.8c-1.6-0.4-2-2.4-2-2.4c-1.2-3.2,0.4-3.6,0.4-3.6 c2.8-0.4,2,2,2,2c1.2,0.4,2.4,0,2.4,0c-0.4,0-1.2-0.8-1.2-0.8c-0.8-0.8,0.4-2.8,0.4-2.8c-0.4,2-3.6,2-3.6,2c-1.6,0-0.4-1.6-0.4-1.6 l0.8,0.4c0-0.4,0.8-2.4,0.8-2.4C284.8,266.4,284.4,267.6,284,268z"></path> <path style="fill:#E6E9EE;" d="M274,272.4c0,0,0.4,0.4,1.2,2.4c0,0,0.4,0.4,0.4,0.8c0.4,0.8,0.8,0.8,1.6,0.8c0.8-0.4,2-0.4,2.8-0.4 c0,0,0.8,0,1.6,0c0.4,0,0.8-0.4,0.8-0.8c-0.4-0.8-0.8-1.6-2.4-2c0,0-1.6-0.4-2,0c0,0,2.4-0.8,4,0.8c0,0,1.6,1.6,0.4,2.4 c0,0-4,0-4,0.4c0,0-1.6,0.8-2.4-0.4c0,0-0.4-1.6-2-1.6c0,0,0.4-0.4,1.2-0.4C274.8,274.4,274.8,273.2,274,272.4z"></path> <path style="fill:#E6E9EE;" d="M277.2,276.4c0.4,0.8-0.4,2.8-0.4,2.8c0.4-0.4,0.4-0.8,0.4-0.8c0,0.4,0.4,0.4,0.4,0.4 c-0.4-1.2,0-2.8,0-2.8h-0.4V276.4z"></path> <path style="fill:#E6E9EE;" d="M281.2,278L281.2,278c0.4-0.4,0.4-0.4,0.4,0c-0.4-0.8-0.4-2-0.4-2h-0.4 C280.4,276.8,281.2,278,281.2,278z"></path> <rect x="278" y="250.4" style="fill:#E6E9EE;" width="12.8" height="8.8"></rect> <path style="fill:#E6E9EE;" d="M380.4,255.6h-17.6c0,0-0.4-45.2,2-54c0,0,0.8-8.8-1.6-16c3.2-27.2,10.8-51.2,11.2-52 C374.4,134,383.2,156.4,380.4,255.6z"></path> <path style="fill:#E6E9EE;" d="M274.8,255.6h17.6c0,0,0.4-45.2-2-54c0,0-0.8-8.8,1.6-16c-3.2-27.2-10.8-51.2-11.2-52 C280.8,134,272,156.4,274.8,255.6z"></path> <ellipse style="fill:#E6E9EE;" cx="327.6" cy="113.6" rx="11.6" ry="12.4"></ellipse> <path style="fill:#E6E9EE;" d="M338.8,111.6c0,0,2.4,10.8-11.2,14.8c0,0,7.6,1.6,10.8,10.8C338.8,137.2,347.6,123.2,338.8,111.6z"></path> <path style="fill:#E6E9EE;" d="M316.4,111.6c0,0-2.4,10.8,11.2,14.8c0,0-7.6,1.6-10.8,10.8C316.8,137.2,308,123.2,316.4,111.6z"></path> <path style="fill:#E6E9EE;" d="M344,102c-1.6,4.8-2,7.6-2.4,8l0,0c-3.6,5.2-8.4,8.4-13.6,8.4c-4.8,0-9.2-2.8-12.8-7.6 c-7.6-9.6-2.4-26.8-2.4-26.8c4,4.4,16.4,4.8,16.4,4.8c-5.2-0.8-6-4.8-6.4-5.2C324,86,335.6,88,335.6,88C348,90,344,102,344,102z"></path> <path style="fill:#E6E9EE;" d="M320.8,66c0,0,16.8-6.8,25.6,8.4c9.2,16.4-2.4,34-4.8,35.6c0,0,0.8-2.8,2.4-8.4c0,0,4-12-8.4-14 c0,0-12-1.6-12.8-4.4c0,0,0.8,4.4,6.4,5.2c0,0-12.4-0.4-16.4-4.8c0,0-5.2,17.6,2.4,26.8c0,0-13.2-10.8-11.6-27.2 C303.6,84,302.8,61.6,320.8,66z"></path> </g> <g> <path style="fill:#2C9984;" d="M128.8,408c0,0-2,7.6,0.8,9.6c0,0,2.8,0.8,2.8,4.8c0,0,0,4.8,6,4.4c0,0,16.4,2,18.8-2 c0,0,1.6-2,0.8-5.6l-18.8-7.2L128.8,408z"></path> <path style="fill:#2C9984;" d="M131.2,396.8c0,0-7.2,6-2,14c0,0,3.6,5.2,4,7.6c0,0-0.4,8,8,6c0,0,8.4-6,14.4-1.2 c0,0,4.4-0.4,2.4-6.4c0,0-4.8-6-7.6-11.6c0,0-1.6-1.2-0.8-5.6L131.2,396.8z"></path> <path style="fill:#2C9984;" d="M112,408c0,0,2,7.6-0.8,9.6c0,0-2.8,0.8-2.8,4.8c0,0,0,4.8-6,4.4c0,0-16.4,2-18.8-2 c0,0-1.6-2-0.8-5.6l18.8-7.2L112,408z"></path> <path style="fill:#2C9984;" d="M109.6,396.8c0,0,7.2,6,2,14c0,0-3.6,5.2-4,7.6c0,0,0.4,8-8,6c0,0-8.4-6-14.4-1.2 c0,0-4.4-0.4-2.4-6.4c0,0,4.8-6,7.6-11.6c0,0,1.6-1.2,0.8-5.6L109.6,396.8z"></path> <polygon style="fill:#2C9984;" points="137.6,131.2 121.2,195.2 104.8,131.2 "></polygon> <polygon style="fill:#2C9984;" points="116.4,138 114.4,131.2 126.4,131.2 124.4,138 "></polygon> <polygon style="fill:#2C9984;" points="116.4,138 120.4,138 124.4,138 132.4,186.8 120.4,195.2 108.4,186.8 "></polygon> <path style="fill:#2C9984;" d="M151.2,220.8c2.8,16.8,6.4,46.4,0.8,81.2c0,0-5.2,79.6-0.4,97.2c0,0-9.6,16.8-26,0 c0,0-0.4-131.2-4.8-136.4v-42H151.2z"></path> <path style="fill:#2C9984;" d="M120.4,220.8v41.6c-4.4,5.6-4.8,136.4-4.8,136.4c-16.8,16.8-26,0-26,0c4.4-17.2-0.4-96.8-0.4-96.8 c-5.6-34.8-2.4-64.4,0.8-81.2H120.4z"></path> <polygon style="fill:#2C9984;" points="107.6,122.4 133.6,122.4 137.2,131.2 105.2,131.2 "></polygon> <path style="fill:#2C9984;" d="M136,128l29.2,10.8c0,0-17.6,53.6-10,89.6c0,0,3.2,18.4,0.8,32.4c0,0-20.4,14.8-28,1.2 c0,0-10.4-32.4-8.4-64l9.2-24.4L136,128z"></path> <path style="fill:#2C9984;" d="M133.6,122.4l14,15.2l-5.2,2.4l4,4c0,0-13.2,40.4-26.8,54.4C119.6,198,134.4,135.6,133.6,122.4z"></path> <path style="fill:#2C9984;" d="M104.8,128l-29.2,10.8c0,0,17.6,53.6,10,89.6c0,0-3.2,18.4-0.8,32.4c0,0,20.4,14.8,28,1.2 c0,0,10.4-32.4,8.4-64l-9.2-24.4L104.8,128z"></path> <path style="fill:#2C9984;" d="M107.6,122.4l-14,15.2l5.2,2.4l-4,4c0,0,13.2,40.4,26.8,54.4C121.6,198,106.8,135.6,107.6,122.4z"></path> <circle style="fill:#2C9984;" cx="116.4" cy="200.8" r="2.8"></circle> <polygon style="fill:#2C9984;" points="102.8,177.2 98,169.2 90.4,174.8 "></polygon> <rect x="88.15" y="174.55" transform="matrix(0.9789 0.2042 -0.2042 0.9789 38.0829 -15.9549)" style="fill:#2C9984;" width="16.4" height="4"></rect> <path style="fill:#2C9984;" d="M74,256c-0.4,3.2-0.4,5.6-0.4,5.6c-0.8,0.8-2.8,3.6-2.8,3.6c-4,3.2-2,5.6-2,5.6l-0.4,2.4 c-0.8,1.2-0.4,3.2-0.4,3.2c2,4,3.6,0.8,3.6,0.8c2.4,2.8,3.6-0.8,3.6-0.8c2.8,1.2,3.6-1.6,3.6-1.6s4.8,0.8,4-10.4 c-0.4-2.8-0.4-5.6,0-8.4L74,256L74,256z"></path> <path style="fill:#2C9984;" d="M78.4,267.2c0-0.4-0.4-2-0.4-2c0.8,2.4-2,3.6-2,3.6c0.4,0,0.4-1.6,0.4-1.6c-0.4,2-3.6,3.2-3.6,3.2 c-0.4-1.2-1.6-2-1.6-2c0.8,1.2,0.8,2,0.8,2c-0.4,0-1.2,0.8-1.2,0.8c0.8-0.8,1.2,0,1.2,0c-1.6,0.4-1.2,2-1.2,2 c0-1.6,0.8-1.2,0.8-1.2c-0.8,0.8-0.4,1.6-0.4,1.6c0-1.2,1.6-1.2,1.6-1.2c-0.8-1.2,0-0.8,0-0.8c1.2-2,2,0,2,0.8h0.4 c-0.8-2,0-2.4,0-2.4c1.2-1.2,1.6,0.8,1.6,0.8c0,3.2,2,4.4,2,4.4h0.4c-1.2-0.4-2-2.4-2-2.4c-1.2-3.2,0.4-3.2,0.4-3.2 c2.4-0.4,2,2,2,2c0.8,0.4,2.4,0,2.4,0c-0.4,0-1.2-0.4-1.2-0.4c-0.4-1.2,1.2-2.8,1.2-2.8c-0.8,0.8-3.6,0.8-3.6,0.8 C76.8,268.8,78,267.6,78.4,267.2l0.4,0.8c0-0.4,0.8-2.4,0.8-2.4C79.2,265.6,78.4,266.8,78.4,267.2z"></path> <path style="fill:#2C9984;" d="M68.8,271.6c0,0,0.4,0.4,1.2,2.4c0,0,0.4,0.4,0.4,0.8c0.4,0.4,0.8,0.8,1.6,0.8 c0.8-0.4,2-0.4,2.8-0.4c0,0,0.8,0,1.6,0c0.4,0,0.8-0.4,0.8-0.8c-0.4-0.8-0.8-1.6-2-2c0,0-1.6-0.4-2,0c0,0,2.4-0.8,3.6,0.8 c0,0,1.6,1.6,0.4,2c0,0-3.6,0-4,0.4c0,0-1.6,0.8-2.4-0.4c0,0-0.4-1.6-2-1.2c0,0,0.4-0.4,1.2-0.4C69.6,273.6,69.2,272.4,68.8,271.6z "></path> <path style="fill:#2C9984;" d="M72,275.2c0,0.8-0.4,2.8-0.4,2.8c0.4-0.4,0.4-0.8,0.4-0.8c0,0.4,0.4,0.4,0.4,0.4 c-0.4-1.2,0-2.4,0-2.4H72z"></path> <path style="fill:#2C9984;" d="M75.2,276.8C75.6,276.8,75.6,276.8,75.2,276.8c0.4-0.4,0.4-0.4,0.4,0c-0.4-0.8-0.4-2-0.4-2h-0.4 C74.8,276,75.2,276.8,75.2,276.8z"></path> <rect x="72.4" y="250.4" style="fill:#2C9984;" width="12" height="8.4"></rect> <path style="fill:#2C9984;" d="M166.4,256c0.4,3.2,0.4,5.6,0.4,5.6c0.8,0.8,2.8,3.6,2.8,3.6c4,3.2,2,5.6,2,5.6l0.4,2.4 c0.8,1.2,0.4,3.2,0.4,3.2c-2,4-3.6,0.8-3.6,0.8c-2.4,2.8-3.6-0.8-3.6-0.8c-2.8,1.2-3.6-1.6-3.6-1.6s-4.8,0.8-4-10.4 c0.4-2.8,0.4-5.6,0-8.4L166.4,256L166.4,256z"></path> <path style="fill:#2C9984;" d="M162.4,267.2c0-0.4,0.4-2,0.4-2c-0.8,2.4,2,3.6,2,3.6c-0.4,0-0.4-1.6-0.4-1.6c0.4,2,3.6,3.2,3.6,3.2 c0.4-1.2,1.6-2,1.6-2c-0.8,1.2-0.8,2-0.8,2c0.4,0,1.2,0.8,1.2,0.8c-0.8-0.8-1.2,0-1.2,0c1.6,0.4,1.2,2,1.2,2c0-1.6-0.8-1.2-0.8-1.2 c0.8,0.8,0.4,1.6,0.4,1.6c0-1.2-1.6-1.2-1.6-1.2c0.8-1.2,0-0.8,0-0.8c-1.2-2-2,0-2,0.8h-0.4c0.8-2,0-2.4,0-2.4 c-1.2-1.2-1.6,0.8-1.6,0.8c0,3.2-2,4.4-2,4.4h-0.4c1.2-0.4,2-2.4,2-2.4c1.2-3.2-0.4-3.2-0.4-3.2c-2.4-0.4-2,2-2,2 c-0.8,0.4-2.4,0-2.4,0c0.4,0,1.2-0.4,1.2-0.4c0.8-0.8-0.4-2.4-0.4-2.4c0.8,0.8,3.6,0.8,3.6,0.8 C163.6,268.8,162.4,267.6,162.4,267.2L162,268c0-0.4-0.8-2.4-0.8-2.4C161.6,265.6,162,266.8,162.4,267.2z"></path> <path style="fill:#2C9984;" d="M172,271.6c0,0-0.4,0.4-1.2,2.4c0,0,0,0.4-0.4,0.8s-0.8,0.8-1.6,0.8c-0.8-0.4-2-0.4-2.8-0.4 c0,0-0.8,0-1.6,0c-0.4,0-0.8-0.4-0.8-0.8c0.4-0.8,0.8-1.6,2-2c0,0,1.6-0.4,2,0c0,0-2.4-0.8-3.6,0.8c0,0-1.6,1.6-0.4,2 c0,0,3.6,0,4,0.4c0,0,1.6,0.8,2.4-0.4c0,0,0.4-1.6,2-1.2c0,0-0.4-0.4-1.2-0.4C171.2,273.6,171.2,272.4,172,271.6z"></path> <path style="fill:#2C9984;" d="M168.8,275.2c0,0.8,0.4,2.8,0.4,2.8c-0.4-0.4-0.4-0.8-0.4-0.8c0,0.4-0.4,0.4-0.4,0.4 c0.4-1.2,0-2.4,0-2.4H168.8z"></path> <path style="fill:#2C9984;" d="M165.2,276.8C165.2,276.8,164.8,276.8,165.2,276.8c-0.4-0.4-0.4-0.4-0.4,0c0.4-0.8,0.4-2,0.4-2h0.4 C165.6,276,165.2,276.8,165.2,276.8z"></path> <rect x="156" y="250.4" style="fill:#2C9984;" width="12" height="8.4"></rect> <path style="fill:#2C9984;" d="M70,255.2h16.8c0,0,0.4-43.6-2-51.6c0,0-0.8-8.4,1.2-15.2c-2.8-26-10.4-49.2-10.8-49.6 C75.6,138.4,67.2,160,70,255.2z"></path> <path style="fill:#2C9984;" d="M171.2,255.2H154c0,0-0.4-43.6,2-51.6c0,0,0.8-8.4-1.2-15.2c2.8-26,10.4-49.2,10.8-49.6 C165.2,138.4,173.6,160,171.2,255.2z"></path> <ellipse style="fill:#2C9984;" cx="120.4" cy="119.2" rx="11.2" ry="12"></ellipse> <path style="fill:#2C9984;" d="M109.6,117.2c0,0-2,10.4,10.8,14.4c0,0-7.2,1.6-10.4,10.4C110,142,101.2,128,109.6,117.2z"></path> <path style="fill:#2C9984;" d="M131.2,117.2c0,0,2,10.4-10.8,14.4c0,0,7.2,1.6,10.4,10.4C130.8,142,139.6,128,131.2,117.2z"></path> <path style="fill:#2C9984;" d="M104.8,108c1.6,4.4,2,7.2,2.4,8l0,0c3.6,4.8,8,8,13.2,8c4.8,0,8.8-2.8,12.4-7.2 c7.2-9.2,2.4-25.6,2.4-25.6c-3.6,4.4-15.6,4.4-15.6,4.4c4.8-0.8,6-4.4,6-4.8c-0.8,2.4-12.4,4-12.4,4 C100.8,96.4,104.8,108,104.8,108z"></path> <path style="fill:#2C9984;" d="M127.2,73.6c0,0-16.4-6.4-24.4,8.4c-8.8,15.6,2.4,32.8,4.4,34c0,0-0.4-2.8-2.4-8c0,0-4-11.6,8-13.6 c0,0,11.6-1.6,12.4-4c0,0-0.8,4-6,5.2c0,0,12-0.4,15.6-4.4c0,0,5.2,16.8-2.4,25.6c0,0,12.8-10.4,11.2-26 C143.6,90.8,144.4,69.2,127.2,73.6z"></path> </g> <g> <path style="fill:#E6E9EE;" d="M189.2,414.4c0,0-2,7.6,0.8,10c0,0,3.2,0.8,2.8,5.2c0,0,0,4.8,6.4,4.8c0,0,17.2,2,19.6-2 c0,0,2-2.4,0.8-5.6l-19.6-7.2L189.2,414.4z"></path> <path style="fill:#E6E9EE;" d="M191.6,402.8c0,0-7.2,6.4-2,14.4c0,0,4,5.2,4,8c0,0-0.4,8.4,8.4,6.4c0,0,8.8-6.4,15.2-1.2 c0,0,4.4-0.4,2.4-6.8c0,0-5.2-6.4-8-12.4c0,0-1.6-1.2-0.8-5.6L191.6,402.8z"></path> <path style="fill:#E6E9EE;" d="M171.6,414.4c0,0,2,7.6-0.8,10c0,0-3.2,0.8-2.8,5.2c0,0,0,4.8-6.4,4.8c0,0-17.2,2-19.6-2 c0,0-2-2.4-0.8-5.6l19.6-7.2L171.6,414.4z"></path> <path style="fill:#E6E9EE;" d="M168.8,402.8c0,0,7.2,6.4,2,14.4c0,0-4,5.2-4,8c0,0,0.4,8.4-8.4,6.4c0,0-8.8-6.4-15.2-1.2 c0,0-4.4-0.4-2.4-6.8c0,0,5.2-6.4,8-12.4c0,0,1.6-1.2,0.8-5.6L168.8,402.8z"></path> <polygon style="fill:#E6E9EE;" points="198.4,126.4 181.2,192.8 164,126.4 "></polygon> <polygon style="fill:#E6E9EE;" points="176.4,133.6 174,126.4 186.8,126.4 184.4,133.6 "></polygon> <polygon style="fill:#E6E9EE;" points="176.4,133.6 180.4,133.6 184.4,133.6 193.2,184 180.4,192.8 167.6,184 "></polygon> <path style="fill:#E6E9EE;" d="M212.4,219.6c3.2,17.2,6.4,48.4,0.8,84.4c0,0-5.2,83.2-0.4,101.6c0,0-9.6,17.6-27.2,0 c0,0-0.4-136.8-5.2-142.4v-43.6H212.4z"></path> <path style="fill:#E6E9EE;" d="M180.4,219.6v43.6c-4.8,5.6-5.2,142.4-5.2,142.4c-17.2,17.6-27.2,0-27.2,0 c4.8-18.4-0.4-101.6-0.4-101.6c-5.6-36-2.4-67.2,0.8-84.4H180.4z"></path> <polygon style="fill:#E6E9EE;" points="166.8,116.8 194,116.8 198,126.4 164.8,126.4 "></polygon> <path style="fill:#E6E9EE;" d="M196.8,122.8l30.4,11.2c0,0-18.4,56-10.4,93.6c0,0,3.2,18.8,0.8,33.6c0,0-21.2,15.2-29.2,1.2 c0,0-10.8-33.6-8.8-66.4l9.6-25.6L196.8,122.8z"></path> <path style="fill:#E6E9EE;" d="M194,116.8l14.8,15.6l-5.6,2.4l4.4,4c0,0-13.6,42-28,56.4C179.6,195.6,194.8,130.4,194,116.8z"></path> <path style="fill:#E6E9EE;" d="M164,122.8L133.6,134c0,0,18.4,56,10.4,93.6c0,0-3.2,18.8-0.8,33.6c0,0,21.2,15.2,29.2,1.2 c0,0,10.8-33.6,8.8-66.4l-9.6-25.6L164,122.8z"></path> <path style="fill:#E6E9EE;" d="M166.8,116.8L152,132.4l5.6,2.4l-4.4,4c0,0,13.6,42,28,56.4C181.6,195.6,166,130.4,166.8,116.8z"></path> <circle style="fill:#E6E9EE;" cx="176" cy="198.8" r="3.2"></circle> <polygon style="fill:#E6E9EE;" points="162,174 156.8,165.6 148.8,171.6 "></polygon> <rect x="146.805" y="171.596" transform="matrix(0.9789 0.2042 -0.2042 0.9789 38.7239 -28.0766)" style="fill:#E6E9EE;" width="17.2" height="4"></rect> <path style="fill:#E6E9EE;" d="M132,256.4c-0.4,3.2-0.4,5.6-0.4,5.6c-0.8,0.8-3.2,4-3.2,4c-4.4,3.6-2,6-2,6l-0.4,2.8 c-1.2,1.2-0.4,3.2-0.4,3.2c2,4.4,4,0.8,4,0.8c2.4,3.2,4-0.8,4-0.8c2.8,1.2,3.6-1.6,3.6-1.6s5.2,0.8,4-11.2c-0.4-2.8-0.4-6,0-8.8 H132z"></path> <path style="fill:#E6E9EE;" d="M136.4,268c0-0.4-0.4-2.4-0.4-2.4c0.8,2.4-2,4-2,4c0.4,0,0.4-1.6,0.4-1.6c-0.4,2-4,3.6-4,3.6 c-0.4-1.2-1.6-2-1.6-2c0.8,1.2,1.2,2,1.2,2c-0.8,0-1.2,0.8-1.2,0.8c0.8-0.8,1.2,0,1.2,0c-1.6,0.4-1.2,2-1.2,2 c0-1.6,1.2-1.6,1.2-1.6c-0.8,0.8-0.4,1.6-0.4,1.6c0-1.2,1.6-1.6,1.6-1.6c-0.8-1.2,0-0.8,0-0.8c1.2-2,2,0,2,0.8h0.4 c-0.8-2,0-2.4,0-2.4c1.6-1.2,1.6,0.8,1.6,0.8c0,3.2,2,4.4,2,4.4h0.8c-1.2-0.4-2-2.4-2-2.4c-1.2-3.2,0.4-3.6,0.4-3.6 c2.8-0.4,2,2,2,2c1.2,0.4,2.4,0,2.4,0c-0.4,0-1.2-0.8-1.2-0.8c-0.8-0.8,0.4-2.8,0.4-2.8c-0.4,2-3.6,2-3.6,2c-1.6,0-0.4-1.6-0.4-1.6 l0.8,0.4c0-0.4,0.8-2.4,0.8-2.4C137.2,266.4,136.8,267.6,136.4,268z"></path> <path style="fill:#E6E9EE;" d="M126.4,272.4c0,0,0.4,0.4,1.2,2.4c0,0,0.4,0.4,0.4,0.8c0.4,0.8,0.8,0.8,1.6,0.8 c0.8-0.4,2-0.4,2.8-0.4c0,0,0.8,0,1.6,0c0.4,0,0.8-0.4,0.8-0.8c-0.4-0.8-0.8-1.6-2.4-2c0,0-1.6-0.4-2,0c0,0,2.4-0.8,4,0.8 c0,0,1.6,1.6,0.4,2.4c0,0-4,0-4,0.4c0,0-1.6,0.8-2.4-0.4c0,0-0.4-1.6-2-1.6c0,0,0.4-0.4,1.2-0.4 C127.2,274.4,127.2,273.2,126.4,272.4z"></path> <path style="fill:#E6E9EE;" d="M129.6,276.4c0.4,0.8-0.4,2.8-0.4,2.8c0.4-0.4,0.4-0.8,0.4-0.8c0,0.4,0.4,0.4,0.4,0.4 c-0.4-1.2,0-2.8,0-2.8h-0.4V276.4z"></path> <path style="fill:#E6E9EE;" d="M133.6,278L133.6,278c0.4-0.4,0.4-0.4,0.4,0c-0.4-0.8-0.4-2-0.4-2h-0.4 C132.8,276.8,133.6,278,133.6,278z"></path> <rect x="130.4" y="250.4" style="fill:#E6E9EE;" width="12.8" height="8.8"></rect> <path style="fill:#E6E9EE;" d="M228.4,256.4c0.4,3.2,0.4,5.6,0.4,5.6c0.8,0.8,3.2,4,3.2,4c4.4,3.6,2,6,2,6l0.4,2.8 c1.2,1.2,0.4,3.2,0.4,3.2c-2,4.4-4,0.8-4,0.8c-2.4,3.2-4-0.8-4-0.8c-2.8,1.2-3.6-1.6-3.6-1.6s-5.2,0.8-4-11.2c0.4-2.8,0.4-6,0-8.8 H228.4z"></path> <path style="fill:#E6E9EE;" d="M224,268c0-0.4,0.4-2.4,0.4-2.4c-0.8,2.4,2,4,2,4c-0.4,0-0.4-1.6-0.4-1.6c0.4,2,4,3.6,4,3.6 c0.4-1.2,1.6-2,1.6-2c-0.8,1.2-1.2,2-1.2,2c0.8,0,1.2,0.8,1.2,0.8c-0.8-0.8-1.2,0-1.2,0c1.6,0.4,1.2,2,1.2,2c0-1.6-1.2-1.6-1.2-1.6 c0.8,0.8,0.4,1.6,0.4,1.6c0-1.2-1.6-1.6-1.6-1.6c0.8-1.2,0-0.8,0-0.8c-1.2-2-2,0-2,0.8h-0.4c0.8-2,0-2.4,0-2.4 c-1.6-1.2-1.6,0.8-1.6,0.8c0,3.2-2,4.4-2,4.4h-0.8c1.6-0.4,2-2.4,2-2.4c1.2-3.2-0.4-3.6-0.4-3.6c-2.4,0.4-2,2.8-2,2.8 c-1.2,0.4-2.4,0-2.4,0c0.4,0,1.2-0.8,1.2-0.8c0.8-0.8-0.4-2.8-0.4-2.8c0.8,0.8,3.6,0.8,3.6,0.8c1.6,0,0.4-1.6,0.4-1.6l-0.8,0.4 c0-0.4-0.8-2.4-0.8-2.4C223.2,266.4,223.6,267.6,224,268z"></path> <path style="fill:#E6E9EE;" d="M234,272.4c0,0-0.4,0.4-1.2,2.4c0,0-0.4,0.4-0.4,0.8c-0.4,0.8-0.8,0.8-1.6,0.8 c-0.8-0.4-2-0.4-2.8-0.4c0,0-0.8,0-1.6,0c-0.4,0-0.8-0.4-0.8-0.8c0.4-0.8,0.8-1.6,2.4-2c0,0,1.6-0.4,2,0c0,0-2.4-0.8-4,0.8 c0,0-1.6,1.6-0.4,2.4c0,0,4,0,4,0.4c0,0,1.6,0.8,2.4-0.4c0,0,0.4-1.6,2-1.6c0,0-0.4-0.4-1.2-0.4C233.2,274.4,233.2,273.2,234,272.4 z"></path> <path style="fill:#E6E9EE;" d="M230.8,276.4c-0.4,0.8,0.4,2.8,0.4,2.8c-0.4-0.4-0.4-0.8-0.4-0.8c0,0.4-0.4,0.4-0.4,0.4 c0.4-1.2,0-2.8,0-2.8h0.4V276.4z"></path> <path style="fill:#E6E9EE;" d="M226.8,278L226.8,278c-0.4-0.4-0.4-0.4-0.4,0c0.4-0.8,0.4-2,0.4-2h0.4 C227.6,276.8,226.8,278,226.8,278z"></path> <rect x="217.6" y="250.4" style="fill:#E6E9EE;" width="12.8" height="8.8"></rect> <path style="fill:#E6E9EE;" d="M127.6,255.6h17.6c0,0,0.4-45.2-2-54c0,0-0.8-8.8,1.6-16c-2.8-27.2-10.8-51.2-11.2-51.6 C133.6,134,124.8,156.4,127.6,255.6z"></path> <path style="fill:#E6E9EE;" d="M233.2,255.6h-17.6c0,0-0.4-45.2,2-54c0,0,0.8-8.8-1.6-16c3.2-27.2,10.8-51.2,11.2-52 C227.2,134,236,156.4,233.2,255.6z"></path> <ellipse style="fill:#E6E9EE;" cx="180.4" cy="113.6" rx="11.6" ry="12.4"></ellipse> <path style="fill:#E6E9EE;" d="M169.2,111.6c0,0-2.4,10.8,11.2,14.8c0,0-7.6,1.6-10.8,10.8C169.2,137.2,160.4,123.2,169.2,111.6z"></path> <path style="fill:#E6E9EE;" d="M191.6,111.6c0,0,2.4,10.8-11.2,14.8c0,0,7.6,1.6,10.8,10.8C191.2,137.2,200,123.2,191.6,111.6z"></path> <path style="fill:#E6E9EE;" d="M164,102c1.6,4.8,2,7.6,2.4,8l0,0c3.6,5.2,8.4,8.4,13.6,8.4c4.8,0,9.2-2.8,12.8-7.6 c7.6-9.6,2.4-26.8,2.4-26.8c-4,4.4-16.4,4.8-16.4,4.8c5.2-0.8,6-4.8,6.4-5.2C184,86,172.4,88,172.4,88C160,90,164,102,164,102z"></path> <path style="fill:#E6E9EE;" d="M187.2,66c0,0-16.8-6.8-25.6,8.4c-9.2,16.4,2.4,34,4.8,35.6c0,0-0.8-2.8-2.4-8.4c0,0-4-12,8.4-14 c0,0,12-1.6,12.8-4.4c0,0-0.8,4.4-6.4,5.2c0,0,12.4-0.4,16.4-4.8c0,0,5.2,17.6-2.4,26.8c0,0,13.2-10.8,11.6-27.2 C204.4,84,205.2,61.6,187.2,66z"></path> </g> <g> <path style="fill:#324A5E;" d="M242.8,453.6c0,0,2.8,9.6-1.2,12.4c0,0-4,0.8-3.6,6.4c0,0,0,6-8,5.6c0,0-21.2,2.4-24-2.4 c0,0-2.4-2.8-0.8-7.2l24.4-9.2L242.8,453.6z"></path> <path style="fill:#324A5E;" d="M239.6,439.2c0,0,9.2,7.6,2.4,18c0,0-4.8,6.4-4.8,10c0,0,0.8,10.4-10.4,8c0,0-11.2-8-18.4-1.2 c0,0-5.6-0.4-2.8-8c0,0,6.4-8,10-15.2c0,0,2.4-1.6,1.2-7.2L239.6,439.2z"></path> <path style="fill:#324A5E;" d="M264.8,453.6c0,0-2.8,9.6,1.2,12.4c0,0,4,0.8,3.6,6.4c0,0,0,6,8,5.6c0,0,21.2,2.4,24-2.4 c0,0,2.4-2.8,0.8-7.2l-24.4-9.2L264.8,453.6z"></path> <path style="fill:#324A5E;" d="M268,439.2c0,0-9.2,7.6-2.4,18c0,0,4.8,6.4,4.8,10c0,0-0.8,10.4,10.4,8c0,0,11.2-8,18.4-1.2 c0,0,5.6-0.4,2.8-8c0,0-6.4-8-10-15.2c0,0-2.4-1.6-1.2-7.2L268,439.2z"></path> </g> <polygon style="fill:#E6E9EE;" points="231.6,96.8 252.8,179.2 273.6,96.8 "></polygon> <polygon style="fill:#F1543F;" points="258.8,106 261.6,96.8 246,96.8 248.8,106 "></polygon> <polygon style="fill:#FF7058;" points="258.8,106 254,106 248.8,106 238,168.4 254,179.2 269.6,168.4 "></polygon> <g> <path style="fill:#2B3B4E;" d="M214,212.4c-4,21.6-8,60-0.8,104.4c0,0,6.4,102.8,0.4,125.6c0,0,12,21.6,33.6,0 c0,0,0.8-169.2,6.4-176v-54H214z"></path> <path style="fill:#2B3B4E;" d="M253.6,212.4v54c5.6,7.2,6.4,176,6.4,176c21.6,21.6,33.6,0,33.6,0c-6-22.8,0.4-125.6,0.4-125.6 c7.2-44.8,2.8-83.2-0.8-104.4H253.6z"></path> </g> <polygon style="fill:#CED5E0;" points="270.4,85.6 236.8,85.6 232,96.8 273.2,96.8 "></polygon> <path style="fill:#324A5E;" d="M233.6,92.8L196,106.4c0,0,22.8,69.2,12.8,115.6c0,0-4,23.6-0.8,41.6c0,0,26,18.8,36.4,1.2 c0,0,13.2-41.6,11.2-82.4L244,150.8L233.6,92.8z"></path> <path style="fill:#2B3B4E;" d="M236.8,85.6l-18.4,19.6l6.8,3.2l-5.2,4.8c0,0,17.2,52,34.8,70C254.8,182.8,236,102.4,236.8,85.6z"></path> <path style="fill:#324A5E;" d="M274,92.8l37.6,13.6c0,0-22.8,69.2-12.8,115.6c0,0,4,23.6,0.8,41.6c0,0-26,18.8-36.4,1.2 c0,0-13.2-41.6-11.2-82.4l11.6-31.6L274,92.8z"></path> <g> <path style="fill:#2B3B4E;" d="M270.4,85.6l18.4,19.6L282,108l5.2,4.8c0,0-17.2,52-34.8,70C252.4,182.8,271.6,102.4,270.4,85.6z"></path> <circle style="fill:#2B3B4E;" cx="258.8" cy="186.8" r="3.6"></circle> </g> <polygon style="fill:#FFFFFF;" points="276.8,156.4 282.8,145.6 292.8,152.8 "></polygon> <rect x="274.018" y="152.807" transform="matrix(-0.9789 0.2042 -0.2042 -0.9789 594.9732 249.4189)" style="fill:#2B3B4E;" width="21.199" height="5.2"></rect> <g> <path style="fill:#FFD05B;" d="M313.6,258c0.4,4,0.4,6.8,0.4,6.8c1.2,1.2,4,4.8,4,4.8c5.2,4.4,2.4,7.6,2.4,7.6l0.4,3.2 c1.2,1.6,0.4,4,0.4,4c-2.8,5.2-4.8,0.8-4.8,0.8c-3.2,3.6-4.8-0.8-4.8-0.8c-3.6,1.6-4.8-2-4.8-2s-6.4,0.8-4.8-13.6 c0.4-3.2,0.4-7.2,0-11.2h11.6V258z"></path> <path style="fill:#FFD05B;" d="M308,272.4c0-0.8,0.4-2.8,0.4-2.8c-0.8,2.8,2.4,4.8,2.4,4.8c-0.4,0-0.4-2-0.4-2 c0.4,2.4,4.8,4.4,4.8,4.4c0.8-1.6,2-2.8,2-2.8c-1.2,1.2-1.2,2.8-1.2,2.8c0.8,0,1.6,0.8,1.6,0.8c-1.2-0.8-1.6,0-1.6,0 c2,0.4,1.2,2.4,1.2,2.4c0-2-1.2-1.6-1.2-1.6c1.2,0.8,0.8,2,0.8,2c0-1.6-2-1.6-2-1.6c0.8-1.2,0.4-1.2,0.4-1.2 c-1.6-2.4-2.4,0.4-2.8,1.2c-0.4,0-0.4,0-0.8,0.4c1.2-2.4,0-2.8,0-2.8c-1.6-1.6-2,0.8-2,0.8c0,4-2.8,5.6-2.8,5.6H306 c1.6-0.8,2.4-2.8,2.4-2.8c1.6-4-0.4-4.4-0.4-4.4c-3.2-0.4-2.4,2.4-2.4,2.4c-1.2,0.4-2.8,0.4-2.8,0.4c0.8-0.4,1.2-0.8,1.2-0.8 c1.2-1.2-0.8-3.2-0.8-3.2c0.8,0.8,4.4,0.8,4.4,0.8c1.6,0,0.4-2,0.4-2l-0.8,0.4c0-0.4-0.8-2.8-0.8-2.8 C307.2,270.4,308,272,308,272.4z"></path> <path style="fill:#FFD05B;" d="M320.8,278c0,0-0.8,0.4-1.6,2.8c0,0-0.4,0.4-0.4,1.2c-0.4,0.8-1.2,1.2-2,0.8 c-1.2-0.4-2.4-0.8-3.6-0.4c0,0-1.2,0-2,0s-1.2-0.4-0.8-1.2c0.4-0.8,1.2-2,2.8-2.4c0,0,2-0.4,2.8,0c0,0-3.2-1.2-4.8,0.8 c0,0-2,2-0.4,2.8c0,0,4.8,0,5.2,0.4c0,0,2,0.8,2.8-0.4c0,0,0.4-2,2.4-1.6c0,0-0.8-0.4-1.6-0.4C319.6,280.4,320,279.2,320.8,278z"></path> <path style="fill:#FFD05B;" d="M316.4,282.8c-0.4,0.8,0.8,3.6,0.8,3.6c-0.4-0.4-0.8-0.8-0.8-0.8c-0.4,0.4-0.4,0.4-0.8,0.8 c0.4-1.2,0-3.2,0-3.2h0.8V282.8z"></path> <path style="fill:#FFD05B;" d="M312,284.8C311.6,284.8,311.6,284.4,312,284.8c-0.4-0.4-0.4-0.4-0.4-0.4c0.4-0.8,0.4-2.4,0.4-2.4 h0.8C312.8,283.6,312,284.8,312,284.8z"></path> </g> <rect x="300" y="250.4" style="fill:#FFFFFF;" width="15.6" height="10.8"></rect> <g> <path style="fill:#FFD05B;" d="M194.4,258c-0.4,4-0.4,6.8-0.4,6.8c-1.2,1.2-4,4.8-4,4.8c-5.2,4.4-2.4,7.6-2.4,7.6l-0.4,3.2 c-1.2,1.6-0.4,4-0.4,4c2.8,5.2,4.8,0.8,4.8,0.8c3.2,3.6,4.8-0.8,4.8-0.8c3.6,1.6,4.8-2,4.8-2s6.4,0.8,4.8-13.6 c-0.4-3.2-0.4-7.2,0-11.2h-11.6V258z"></path> <path style="fill:#FFD05B;" d="M200,272.4c0-0.8-0.4-2.8-0.4-2.8c0.8,2.8-2.4,4.8-2.4,4.8c0.4,0,0.4-2,0.4-2 c-0.4,2.4-4.8,4.4-4.8,4.4c-0.8-1.6-2-2.8-2-2.8c1.2,1.2,1.2,2.8,1.2,2.8c-0.8,0-1.6,0.8-1.6,0.8c1.2-0.8,1.6,0,1.6,0 c-2,0.4-1.2,2.4-1.2,2.4c0-2,1.2-1.6,1.2-1.6c-1.2,0.8-0.8,2-0.8,2c0-1.6,2-1.6,2-1.6c-0.8-1.2-0.4-1.2-0.4-1.2 c1.6-2.4,2.4,0.4,2.8,1.2c0.4,0,0.4,0,0.8,0.4c-1.2-2.4,0-2.8,0-2.8c1.6-1.6,2,0.8,2,0.8c0,4,2.8,5.6,2.8,5.6h0.8 c-1.6-0.8-2.4-2.8-2.4-2.8c-1.6-4,0.4-4.4,0.4-4.4c3.2-0.4,2.4,2.4,2.4,2.4c1.2,0.4,2.8,0.4,2.8,0.4c-0.8-0.4-1.2-0.8-1.2-0.8 c-1.2-1.2,0.8-3.2,0.8-3.2c-0.8,0.8-4.4,0.8-4.4,0.8c-1.6,0-0.4-2-0.4-2l0.8,0.4c0-0.4,0.8-2.8,0.8-2.8 C200.8,270.4,200,272,200,272.4z"></path> <path style="fill:#FFD05B;" d="M187.2,278c0,0,0.8,0.4,1.6,2.8c0,0,0.4,0.4,0.4,1.2c0.4,0.8,1.2,1.2,2,0.8c1.2-0.4,2.4-0.8,3.6-0.4 c0,0,1.2,0,2,0s1.2-0.4,0.8-1.2c-0.4-0.8-1.2-2-2.8-2.4c0,0-2-0.4-2.8,0c0,0,3.2-1.2,4.8,0.8c0,0,2,2,0.4,2.8c0,0-4.8,0-5.2,0.4 c0,0-2,0.8-2.8-0.4c0,0-0.4-2-2.4-1.6c0,0,0.8-0.4,1.6-0.4C188.4,280.4,188,279.2,187.2,278z"></path> <path style="fill:#FFD05B;" d="M191.6,282.8c0.4,0.8-0.8,3.6-0.8,3.6c0.4-0.4,0.8-0.8,0.8-0.8c0.4,0.4,0.4,0.4,0.8,0.8 c-0.4-1.2,0-3.2,0-3.2h-0.8V282.8z"></path> <path style="fill:#FFD05B;" d="M196,284.8C196.4,284.8,196.4,284.4,196,284.8c0.4-0.4,0.4-0.4,0.4-0.4c-0.4-0.8-0.4-2.4-0.4-2.4 h-0.8C195.2,283.6,196,284.8,196,284.8z"></path> </g> <rect x="192" y="250.4" style="fill:#FFFFFF;" width="15.6" height="10.8"></rect> <g> <path style="fill:#324A5E;" d="M319.2,256.8h-22c0,0-0.4-56,2.4-66.8c0,0,0.8-11.2-1.6-19.6c4-33.6,13.6-63.6,13.6-64 C311.6,106.4,322.4,134,319.2,256.8z"></path> <path style="fill:#324A5E;" d="M188.4,256.8h22c0,0,0.4-56-2.4-66.8c0,0-0.8-11.2,1.6-19.6c-4-33.6-13.6-63.6-13.6-64 C196,106.4,184.8,134,188.4,256.8z"></path> </g> <ellipse style="fill:#F9B54C;" cx="254" cy="81.6" rx="14.4" ry="15.6"></ellipse> <g> <path style="fill:#FFFFFF;" d="M267.6,78.4c0,0,2.8,13.6-14,18.4c0,0,9.6,2,13.6,13.6C267.6,110.4,278.4,92.8,267.6,78.4z"></path> <path style="fill:#FFFFFF;" d="M240,78.4c0,0-2.8,13.6,14,18.4c0,0-9.6,2-13.6,13.6C240.4,110.4,229.2,92.8,240,78.4z"></path> </g> <path style="fill:#FFD05B;" d="M274,66.8c-2,6-2.8,9.2-2.8,10l0,0c-4.4,6.4-10.4,10.4-16.8,10.4c-6,0-11.6-3.6-16-9.2 c-9.6-11.6-2.8-33.2-2.8-33.2c4.8,5.6,20,5.6,20,5.6c-6.4-0.8-7.6-6-7.6-6.4c1.2,3.2,16,5.2,16,5.2C279.2,52,274,66.8,274,66.8z"></path> <path style="fill:#324A5E;" d="M245.2,22.4c0,0,20.8-8.4,31.6,10.8c11.2,20.4-2.8,42.4-6,44c0,0,0.8-3.6,2.8-10.4 c0,0,5.2-15.2-10.4-17.2c0,0-14.8-2-16-5.2c0,0,1.2,5.6,7.6,6.4c0,0-15.2-0.4-20-5.6c0,0-6.4,21.6,2.8,33.2c0,0-16.4-13.2-14.4-33.6 C224,44.8,222.8,16.8,245.2,22.4z"></path> </g></svg>' : reason.icon}
            </div>
            <h3 class="text-2xl font-bold font-sans tracking-tight">${reason.title}</h3>
            <p class="text-gray-200 text-sm mb-4">${reason.description}</p>
          </div>

          <div class="hover-content absolute bottom-0 left-0 w-full opacity-0 translate-y-8 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0">
            <h4 class="text-xl font-bold font-sans tracking-tight mb-2">${reason.title}</h4>
            <p class="text-gray-200 text-sm mb-4">${reason.hoverDescription}</p>
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
        <div class="before-after-container relative overflow-hidden rounded-xl shadow-lg border border-ll-black/20 dark:border-white/50" data-aos="fade-up" data-aos-delay="100">
                    <img src="${before.url}" alt="${before.description}" class="before w-full h-64 object-cover">
                    <img src="${after.url}" alt="${after.description}" class="after w-full h-64 object-cover absolute top-0 left-0">
                    <div class="comparaison-slider absolute top-0 h-full w-1 bg-blue-600 cursor-ew-resize"></div>
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
    const slider = container.querySelector('.comparaison-slider');

    if (!beforeImg || !afterImg || !slider) {
      console.warn('Éléments du slider avant/après non trouvés');
      return;
    }

    let isDragging = false;
    let startX = 0;

    const updateSlider = x => {
      const rect = container.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100));
      afterImg.style.clipPath = `polygon(${percentage}% 0%, 100% 0%, 100% 100%, ${percentage}% 100%)`;
      slider.style.left = `${percentage}%`;
      slider.setAttribute('aria-valuenow', percentage.toFixed(0));
    };

    const startDragging = e => {
      e.preventDefault();
      isDragging = true;
      startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
      document.body.style.touchAction = 'none'; // Prevent page scroll while dragging
    };

    const dragging = e => {
      if (!isDragging) return;
      const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
      const deltaX = clientX - startX;
      const deltaY = e.type.includes('touch') ? e.touches[0].clientY - startY : 0;

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        stopDragging();
        return;
      }

      e.preventDefault();
      updateSlider(clientX);
      startX = clientX; // Update start for smoother drag
    };

    const stopDragging = () => {
      isDragging = false;
      document.body.style.touchAction = 'auto'; // Restore page scroll
    };

    // Attach events only to slider handle
    slider.addEventListener('mousedown', startDragging);
    slider.addEventListener('touchstart', startDragging, { passive: false });

    document.addEventListener('mousemove', dragging);
    document.addEventListener('touchmove', dragging, { passive: false });

    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchend', stopDragging);
    document.addEventListener('touchcancel', stopDragging);

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







let reviewsModal = null;
let categoryModal = null;
let filterInactivityTimer = null;
const INACTIVITY_CLOSE_DELAY = 5000; 

/**
 * Initialise les modales vidéo avec gestion plein écran et effets futuristes
 * Mise à jour complète : Positionnement optimisé du bouton de fermeture (top-right fixe et responsive)
 * Contrôles vidéo personnalisés : Barre de progression interactive, play/pause, volume slider, fullscreen
 */
export function initVideoModal() {
    const videoModal = document.createElement('div');
    videoModal.id = 'video-modal';
    videoModal.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 transition-all duration-500 backdrop-blur-xl hidden modal-overlay';
    
    videoModal.innerHTML = `
        <div class="modal-content bg-gradient-to-b from-black/80 to-black/100 text-white max-w-6xl w-full max-h-[95vh] relative overflow-hidden neon-glow rounded-2xl">
            <!-- Titre de la vidéo : Positionnement top-left optimisé, responsive et accessible -->
            <h2 id="video-title" class="absolute top-4 left-4 z-10 text-xl md:text-2xl font-bold text-white truncate max-w-[70%] sm:max-w-[60%] lg:max-w-[50%] bg-black/30 px-3 py-1 rounded-lg backdrop-blur-sm" aria-label="Titre de la vidéo"></h2>
            
            <!-- Bouton de fermeture : Positionnement top-right optimisé, responsive et accessible -->
            <button class="close-video-modal modal-close absolute top-4 right-4 z-10 bg-white dark:bg-gray-700 rounded-xl p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-md" aria-label="Fermer la modale vidéo">
            
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6L6 18"></path><path d="M6 6l12 12"></path>
                </svg>
            </button>
            
            <!-- Conteneur vidéo avec overlay gradient -->
            <div class="relative w-full h-full flex items-center justify-center">
                <video id="modal-video" class="w-full h-full max-h-[80vh] object-contain rounded-xl shadow-2xl" preload="metadata" poster="/assets/images/video-poster.jpg" muted>
                    <source src="" type="video/mp4">
                    Votre navigateur ne supporte pas la balise vidéo.
                </video>
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none rounded-xl"></div>
            </div>
            
            <!-- Contrôles vidéo personnalisés : Barre en bas, semi-transparente avec hover reveal -->
            <div class="video-controls absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-all duration-300 group-hover:opacity-100 pointer-events-none group-hover/parent:pointer-events-auto neon-glow">
                <div class="flex items-center justify-between w-full">
                    <!-- Play/Pause -->
                    <button id="play-pause-btn" class="play-pause-btn text-white p-3 rounded-full hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 neon-glow" aria-label="Lecture/Pause">
                        <svg id="play-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden">
                            <circle cx="12" cy="12" r="10"></circle><polygon points="10,8 16,12 10,16"></polygon>
                        </svg>
                        <svg id="pause-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                    </button>
                    
                    <!-- Barre de progression -->
                    <div class="progress-container flex-1 mx-4 relative">
                        <div class="progress-bar bg-white/20 rounded-full h-2 cursor-pointer relative overflow-hidden" id="progress-bar">
                            <div class="progress-fill bg-blue-500 h-full rounded-full transition-all duration-200" id="progress-fill" style="width: 0%"></div>
                            <div class="progress-thumb absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full transform -translate-y-1/2 opacity-0 transition-opacity duration-200" id="progress-thumb"></div>
                        </div>
                        <div class="time-display text-xs text-white/70 mt-1 flex justify-between">
                            <span id="current-time">0:00</span>
                            <span id="duration">0:00</span>
                        </div>
                    </div>
                    
                    <!-- Volume -->
                    <div class="volume-container flex items-center gap-2">
                        <button id="volume-btn" class="volume-btn text-white p-2 rounded-full hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 neon-glow" aria-label="Volume">
                            <svg id="volume-high-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19"></polygon><polygon points="22 9 17 4 17 20 22 15"></polygon>
                            </svg>
                            <svg id="volume-low-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19"></polygon>
                            </svg>
                            <svg id="volume-mute-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>
                            </svg>
                        </button>
                        <input type="range" id="volume-slider" min="0" max="1" step="0.1" value="1" class="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider-neon [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none" />
                    </div>
                    
                    <!-- Fullscreen -->
                    <button class="fullscreen-video bg-black/60 text-white p-3 rounded-xl hover:bg-black/80 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 neon-glow" aria-label="Passer en plein écran">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(videoModal);

    // Éléments DOM
    const modalVideo = document.getElementById('modal-video');
    const videoTitle = document.getElementById('video-title');
    const closeButton = videoModal.querySelector('.close-video-modal');
    const fullscreenButton = videoModal.querySelector('.fullscreen-video');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    const progressThumb = document.getElementById('progress-thumb');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const volumeBtn = document.getElementById('volume-btn');
    const volumeHighIcon = document.getElementById('volume-high-icon');
    const volumeLowIcon = document.getElementById('volume-low-icon');
    const volumeMuteIcon = document.getElementById('volume-mute-icon');
    const volumeSlider = document.getElementById('volume-slider');

    // Fonction pour formater le temps
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Gestion play/pause
    const togglePlayPause = () => {
        if (modalVideo.paused) {
            modalVideo.play().catch(error => console.error('Erreur de lecture vidéo:', error));
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        } else {
            modalVideo.pause();
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }
    };
    playPauseBtn.addEventListener('click', togglePlayPause);

    // Gestion barre de progression
    const updateProgress = () => {
        if (modalVideo.duration) {
            const progress = (modalVideo.currentTime / modalVideo.duration) * 100;
            progressFill.style.width = `${progress}%`;
            currentTimeEl.textContent = formatTime(modalVideo.currentTime);
            durationEl.textContent = formatTime(modalVideo.duration);
            progressThumb.style.left = `${progress}%`;
            progressThumb.classList.toggle('opacity-100', modalVideo.paused || progress >= 100);
        }
    };
    modalVideo.addEventListener('timeupdate', updateProgress);
    modalVideo.addEventListener('loadedmetadata', updateProgress);

    // Seek sur clic/drag
    const handleProgressClick = (e) => {
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        modalVideo.currentTime = pos * modalVideo.duration;
    };
    progressBar.addEventListener('click', handleProgressClick);
    let isDragging = false;
    progressBar.addEventListener('mousedown', () => isDragging = true);
    document.addEventListener('mouseup', () => isDragging = false);
    document.addEventListener('mousemove', (e) => {
        if (isDragging) handleProgressClick(e);
    });

    // Gestion volume
    const updateVolumeIcon = () => {
        const vol = modalVideo.volume;
        volumeHighIcon.classList.toggle('hidden', vol < 0.5);
        volumeLowIcon.classList.toggle('hidden', vol === 0 || vol >= 0.5);
        volumeMuteIcon.classList.toggle('hidden', vol > 0);
    };
    volumeSlider.addEventListener('input', (e) => {
        modalVideo.volume = e.target.value;
        updateVolumeIcon();
    });
    volumeBtn.addEventListener('click', () => {
        modalVideo.muted = !modalVideo.muted;
        volumeSlider.value = modalVideo.muted ? 0 : 1;
        updateVolumeIcon();
    });
    updateVolumeIcon(); // Init

    // Hover pour révéler contrôles
    const modalContent = videoModal.querySelector('.modal-content');
    modalContent.addEventListener('mouseenter', () => modalContent.classList.add('group'));
    modalContent.addEventListener('mouseleave', () => modalContent.classList.remove('group'));

    // Fullscreen
    fullscreenButton.addEventListener('click', () => {
        if (modalVideo.requestFullscreen) {
            modalVideo.requestFullscreen();
        } else if (modalVideo.webkitRequestFullscreen) {
            modalVideo.webkitRequestFullscreen();
        } else if (modalVideo.msRequestFullscreen) {
            modalVideo.msRequestFullscreen();
        }
    });

    // Fermeture de la modale
    const closeModal = () => {
        videoModal.classList.remove('open');
        setTimeout(() => {
            videoModal.classList.add('hidden');
            modalVideo.pause();
            modalVideo.currentTime = 0;
            modalVideo.muted = false;
            document.body.style.overflow = 'auto';
            modalContent.classList.remove('group');
        }, 500); // Durée ajustée pour transition-all
    };

    closeButton.addEventListener('click', closeModal);

    videoModal.addEventListener('click', e => {
        if (e.target === videoModal) {
            closeModal();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !videoModal.classList.contains('hidden')) {
            closeModal();
        } else if (e.key === ' ') {
            e.preventDefault();
            togglePlayPause();
        } else if (e.key === 'ArrowRight') {
            modalVideo.currentTime += 5;
        } else if (e.key === 'ArrowLeft') {
            modalVideo.currentTime -= 5;
        } else if (e.key === 'ArrowUp') {
            modalVideo.volume = Math.min(1, modalVideo.volume + 0.1);
            volumeSlider.value = modalVideo.volume;
            updateVolumeIcon();
        } else if (e.key === 'ArrowDown') {
            modalVideo.volume = Math.max(0, modalVideo.volume - 0.1);
            volumeSlider.value = modalVideo.volume;
            updateVolumeIcon();
        }
    });

    // Video ended event
    modalVideo.addEventListener('ended', () => {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        setTimeout(closeModal, 2000);
    });

    // Exposer la fonction pour ouvrir la modale vidéo
    window.openVideoModal = (videoSrc , title) => {
        videoModal.classList.remove('hidden');
        setTimeout(() => videoModal.classList.add('open'), 10);
        modalVideo.src = videoSrc;
        videoTitle.textContent = title || '';
        modalVideo.load();
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        progressFill.style.width = '0%';
        currentTimeEl.textContent = '0:00';
        durationEl.textContent = '0:00';
        modalVideo.play().catch(error => console.error('Erreur de lecture vidéo:', error));
        document.body.style.overflow = 'hidden';
    };
}

/**
 * Crée et initialise la modale pour les avis minimum (étoiles) - Combinaison des deux approches
 * Logique du deuxième pour survol/clic sur étoiles SVG avec seuils de mise à jour, intégrant le tableau stars du premier (0-5 niveaux)
 */
function initReviewsModal() {
    let reviewsModal = document.createElement('div');
    reviewsModal.className = 'fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4';
    reviewsModal.innerHTML = `
        <div class="modal-content absolute  bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden neon-glow max-h-[90vh] overflow-y-auto transform transition-transform duration-500 scale-95 opacity-0">
         
            <h3 class="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Sélectionner le nombre minimum d'avis</h3>
            <div id="modal-reviews-grid" class="space-y-6">
                <!-- Option pour 0 étoiles (Aucun filtre) -->
                <button id="zero-reviews-option" class="reviews-option flex items-center justify-center p-4 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-all duration-300 w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 group glass-effect" data-reviews="0">
                    <div class="flex items-center gap-3">
                        <span class="text-lg">☆☆☆☆☆</span> <!-- Icône vide pour 0 -->
                        <span id="zero-reviews-name" class="text-sm font-medium text-gray-900 dark:text-white">0 étoiles (Tous les services)</span>
                    </div>
                </button>
                <!-- Rangée d'étoiles SVG pour niveaux 1-5 -->
                <div class="star-row flex justify-center gap-2" id="star-row">
                    ${[...Array(5)].map((_, i) => `
                        <svg class="star-svg cursor-pointer transition-all duration-300" data-level="${i + 1}" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                    `).join('')}
                </div>
            </div>
            <div class="selection-label text-center mt-4 text-gray-600 dark:text-gray-300" id="selection-label">
                Cliquez sur une étoile pour sélectionner
            </div>
            <div class="tooltip text-center mt-2 text-sm text-gray-500 dark:text-gray-400 hidden" id="tooltip">
                <!-- Tooltip will be updated here -->
            </div>
            <div class="flex justify-center mt-6 gap-4">
                <button id="reviews-modal-cancel" class="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-xl hover:bg-gray-400 dark:hover:bg-gray-500 transition-all">Annuler</button>
                <button id="reviews-modal-confirm" class="px-6 py-2 bg-ll-blue text-white rounded-xl hover:shadow-lg neon-glow transition-all">Confirmer</button>
            </div>
        </div>
    `;
    document.body.appendChild(reviewsModal);

    // Intégration du tableau stars du premier pour les noms et icônes (adapté pour seuils)
    const stars = [
        { id: 0, name: '0 étoiles (Tous les services)', icon: '☆☆☆☆☆', minReviews: 0, filled: false }, // Adapté pour 0
        { id: 1, name: '1 étoile', icon: '⭐☆☆☆☆', minReviews: 10, filled: true },
        { id: 2, name: '2 étoiles', icon: '⭐⭐☆☆☆', minReviews: 25, filled: true },
        { id: 3, name: '3 étoiles', icon: '⭐⭐⭐☆☆', minReviews: 50, filled: true },
        { id: 4, name: '4 étoiles', icon: '⭐⭐⭐⭐☆', minReviews: 75, filled: true },
        { id: 5, name: '5 étoiles', icon: '⭐⭐⭐⭐⭐', minReviews: 100, filled: true }
    ];

    const starRow = reviewsModal.querySelector('#star-row');
    const selectionLabel = reviewsModal.querySelector('#selection-label');
    const tooltip = reviewsModal.querySelector('#tooltip');
    const zeroOption = reviewsModal.querySelector('#zero-reviews-option');
    const content = reviewsModal.querySelector('.modal-content');

    // Seuils par niveau (basé sur le deuxième, adapté pour 0)
    const reviewLevels = {
        0: { min: 0, label: stars[0].name },
        1: { min: 10, label: stars[1].name },
        2: { min: 25, label: stars[2].name },
        3: { min: 50, label: stars[3].name },
        4: { min: 75, label: stars[4].name },
        5: { min: 100, label: stars[5].name }
    };

    // Map pour récupérer le niveau depuis minReviews
    const levelMap = Object.fromEntries(Object.entries(reviewLevels).map(([k, v]) => [v.min, parseInt(k)]));

    // Fonction pour mettre à jour l'affichage des étoiles SVG (remplissage)
    function updateStarDisplay(hoveredLevel = null, selectedLevel = null) {
        const fillLevel = hoveredLevel || selectedLevel || 0;

        starRow.querySelectorAll('.star-svg').forEach(star => {
            const level = parseInt(star.dataset.level);
            if (level <= fillLevel) {
                star.setAttribute('fill', '#fbbf24');
                star.setAttribute('stroke', '#fbbf24');
            } else {
                star.setAttribute('fill', 'none');
                star.setAttribute('stroke', '#d1d5db');
            }
        });

        // Mettre à jour le label et tooltip basé sur le niveau
        const currentLevel = hoveredLevel || selectedLevel || 0;
        selectionLabel.textContent = reviewLevels[currentLevel].label;
        if (hoveredLevel) {
            tooltip.textContent = `Survolez pour voir : au moins ${reviewLevels[currentLevel].min} avis.`;
            tooltip.classList.remove('hidden');
        } else if (selectedLevel) {
            tooltip.textContent = `Filtre actif : au moins ${reviewLevels[currentLevel].min} avis.`;
            tooltip.classList.remove('hidden');
        } else {
            tooltip.classList.add('hidden');
        }

        // Mettre à jour l'icône et nom pour l'option 0 si sélectionnée
        const zeroIconSpan = zeroOption.querySelector('span.text-lg');
        if (currentLevel === 0) {
            zeroOption.classList.add('selected', 'bg-ll-blue', 'text-white');
            zeroIconSpan.textContent = stars[0].icon;
            document.getElementById('zero-reviews-name').textContent = stars[0].name;
        } else {
            zeroOption.classList.remove('selected', 'bg-ll-blue', 'text-white');
        }
    }

    // Gestion du clic sur l'option 0
    zeroOption.addEventListener('click', () => {
        // Désélectionner les étoiles
        starRow.querySelectorAll('.star-svg').forEach(star => star.classList.remove('selected'));
        updateStarDisplay(null, 0); // Sélection 0
    });

    // Hover effects sur les étoiles (logique du deuxième)
    starRow.addEventListener('mouseenter', (e) => {
        const hoveredStar = e.target.closest('.star-svg');
        if (hoveredStar) {
            const level = parseInt(hoveredStar.dataset.level);
            updateStarDisplay(level); // Survol
        }
    }, true);

    starRow.addEventListener('mouseleave', () => {
        // Remettre à l'état sélectionné seulement
        let selectedLevel = null;
        starRow.querySelectorAll('.star-svg').forEach(star => {
            if (star.classList.contains('selected')) {
                selectedLevel = parseInt(star.dataset.level);
            }
        });
        updateStarDisplay(null, selectedLevel || 0);
    });

    // Sélection par clic sur étoiles (logique du deuxième, adapté pour niveaux 1-5)
    starRow.addEventListener('click', (e) => {
        const clickedStar = e.target.closest('.star-svg');
        if (clickedStar) {
            // Désélectionner tous les étoiles
            starRow.querySelectorAll('.star-svg').forEach(star => star.classList.remove('selected'));
            // Sélectionner la cliquée
            clickedStar.classList.add('selected');
            const level = parseInt(clickedStar.dataset.level);
            updateStarDisplay(null, level); // Mise à jour avec sélection
        }
    });

    // Boutons
    reviewsModal.querySelector('#reviews-modal-cancel').addEventListener('click', closeReviewsModal);
    reviewsModal.querySelector('#reviews-modal-confirm').addEventListener('click', confirmReviewsSelection);

    function closeReviewsModal() {
        content.classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            reviewsModal.classList.add('hidden');
            // Reset display au niveau initial (basé sur filtre courant)
            let currentMinReviews = getCurrentFilters().reviews || 0;
            let currentLevel = levelMap[currentMinReviews] || 0;
            updateStarDisplay(null, currentLevel);
        }, 300);
    }

    function confirmReviewsSelection() {
        let selectedLevel = 0;
        const selectedStar = starRow.querySelector('.star-svg.selected');
        if (selectedStar) {
            selectedLevel = parseInt(selectedStar.dataset.level);
        } // else if zeroOption selected, level=0 already

        const minReviews = reviewLevels[selectedLevel].min;
        const reviewsName = reviewLevels[selectedLevel].label;

        // Mettre à jour le span sélectionné
        document.getElementById('selected-reviews').textContent = reviewsName;

        // Update hidden input (name="reviews" comme dans le premier, value=minReviews)
        let input = document.querySelector('input[name="reviews"]');
        if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'reviews';
            document.getElementById('reviews-trigger').appendChild(input);
        }
        input.value = minReviews;

        updateActiveFilters();
        updateServices();
        closeReviewsModal();
    }

    // Ouvrir depuis trigger (adapté pour le nouveau bouton)
    document.getElementById('reviews-trigger').addEventListener('click', (e) => {
        e.stopPropagation();
        reviewsModal.classList.remove('hidden');
        setTimeout(() => {
            content.classList.add('scale-100', 'opacity-100');
            // Initial display basé sur filtre courant
            let currentMinReviews = getCurrentFilters().reviews || 0;
            let currentLevel = levelMap[currentMinReviews] || 0;
            if (currentLevel > 0) {
                starRow.querySelector(`[data-level="${currentLevel}"]`).classList.add('selected');
            }
            updateStarDisplay(null, currentLevel);
        }, 10);
    });

    // Close on overlay click
    reviewsModal.addEventListener('click', (e) => {
        if (e.target === reviewsModal) closeReviewsModal();
    });
}

/**
 * Crée et initialise la modale pour les catégories (6x sur desktop, 4x sur mobile)
 */
function initCategoryModal() {
    let categoryModal = document.createElement('div');
    categoryModal.className = 'fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4';
    categoryModal.innerHTML = `
        <div class="modal-content absolute bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl max-w-5xl w-full mx-auto overflow-hidden max-h-[90vh] overflow-y-auto transform transition-transform duration-500 scale-95 opacity-0">
            <h3 class="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Sélectionner une catégorie</h3>
            <input type="text" id="modal-category-search" class="w-full p-3 mb-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ll-blue text-gray-900 dark:text-gray-100" placeholder="Rechercher une catégorie...">
            <div id="modal-category-grid" class="category-grid"></div>
            <div class="flex justify-center mt-6 gap-4">
                <button id="category-modal-cancel" class="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-xl hover:bg-gray-400 dark:hover:bg-gray-500 transition-all">Annuler</button>
                <button id="category-modal-confirm" class="px-6 py-2 bg-ll-blue text-white rounded-xl hover:shadow-lg neon-glow transition-all">Confirmer</button>
            </div>
        </div>
    `;
    document.body.appendChild(categoryModal);

    const content = categoryModal.querySelector('.modal-content');

    // Remplir la grille
    const categories = [
        { id: 'bureaux', name: 'Bureaux', icon: '🏢' },
        { id: 'residentiel', name: 'Résidentiel', icon: '🏠' },
        { id: 'commercial', name: 'Commercial', icon: '🛍️' },
        { id: 'industriel', name: 'Industriel', icon: '🏭' },
        { id: 'medical', name: 'Médical', icon: '🏥' },
        { id: 'hotelier', name: 'Hôtelier', icon: '🏨' },
        { id: 'education', name: 'Éducation', icon: '🎓' },
        { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
        { id: 'sport', name: 'Sport & Fitness', icon: '💪' },
        { id: 'evenementiel', name: 'Événementiel', icon: '🎪' }
    ];

    const grid = categoryModal.querySelector('#modal-category-grid');
    grid.innerHTML = categories.map(category => `
        <button class="category-option flex items-center gap-3 p-4 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-all duration-300 w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 group glass-effect ${category.id === getCurrentFilters().category ? 'selected bg-ll-blue text-white' : ''}" data-category="${category.id}">
            <span class="text-2xl transform group-hover:scale-110 transition-transform">${category.icon}</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white flex-1">${category.name}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path>
            </svg>
        </button>
    `).join('');

    // Recherche dans modale
    const searchInput = categoryModal.querySelector('#modal-category-search');
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        grid.querySelectorAll('.category-option').forEach(option => {
            const name = option.querySelector('span:nth-child(2)').textContent.toLowerCase();
            option.style.display = name.includes(term) ? 'flex' : 'none';
        });
    });

    // Sélection
    grid.addEventListener('click', (e) => {
        const option = e.target.closest('.category-option');
        if (option) {
            grid.querySelectorAll('.category-option').forEach(s => s.classList.remove('selected', 'bg-ll-blue', 'text-white'));
            option.classList.add('selected', 'bg-ll-blue', 'text-white');
        }
    });

    // Boutons
    categoryModal.querySelector('#category-modal-cancel').addEventListener('click', closeCategoryModal);
    categoryModal.querySelector('#category-modal-confirm').addEventListener('click', confirmCategorySelection);

    function closeCategoryModal() {
        content.classList.remove('scale-100', 'opacity-100');
        setTimeout(() => categoryModal.classList.add('hidden'), 300);
    }

    function confirmCategorySelection() {
        const selected = grid.querySelector('.category-option.selected');
        if (selected) {
            const categoryId = selected.dataset.category;
            const categoryName = selected.querySelector('span:nth-child(2)').textContent;
            document.getElementById('selected-category').textContent = categoryName;
            // Update hidden input
            let input = document.querySelector('input[name="category"]');
            if (!input) {
                input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'category';
                document.getElementById('category-trigger').appendChild(input);
            }
            input.value = categoryId;
            updateActiveFilters();
            updateServices();
        }
        closeCategoryModal();
    }

    // Ouvrir depuis trigger
    const categoryTrigger = document.getElementById('category-trigger');
    if (categoryTrigger) {
        categoryTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            categoryModal.classList.remove('hidden');
            setTimeout(() => content.classList.add('scale-100', 'opacity-100'), 10);
        });
    }

    // Close on overlay click
    categoryModal.addEventListener('click', (e) => {
        if (e.target === categoryModal) closeCategoryModal();
    });
}
/**
 * Crée et initialise la modale pour la fréquence
 */
function initFrequencyModal() {
  let frequencyModal = document.createElement('div');
  frequencyModal.className = 'fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4';
  frequencyModal.innerHTML = `
    <div class="modal-content absolute  bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden max-h-[90vh] overflow-y-auto transform transition-transform duration-500 scale-95 opacity-0">
      <h3 class="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Sélectionner une fréquence</h3>
      <div id="modal-frequency-grid" class="space-y-3"></div>
      <div class="flex justify-center mt-6 gap-4">
        <button id="frequency-modal-cancel" class="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-xl hover:bg-gray-400 dark:hover:bg-gray-500 transition-all">Annuler</button>
        <button id="frequency-modal-confirm" class="px-6 py-2 bg-ll-blue text-white rounded-xl hover:shadow-lg neon-glow transition-all">Confirmer</button>
      </div>
    </div>
  `;
  document.body.appendChild(frequencyModal);

  const content = frequencyModal.querySelector('.modal-content');

  // Remplir la grille
  const frequencies = [
    { id: 'all', name: 'Toutes', icon: '🌐' },
    { id: 'régulier', name: 'Régulier', icon: '🔄' },
    { id: 'ponctuel', name: 'Ponctuel', icon: '📅' }
  ];

  const grid = frequencyModal.querySelector('#modal-frequency-grid');
  grid.innerHTML = frequencies.map(freq => `
    <label class="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-4 rounded-xl transition-all w-full ${freq.id === getCurrentFilters().frequency ? 'bg-ll-blue text-white' : ''}">
      <input type="radio" name="frequency" value="${freq.id}" class="form-radio text-ll-blue focus:ring-ll-blue sr-only" ${freq.id === getCurrentFilters().frequency ? 'checked' : ''}>
      <div class="flex items-center gap-3 ml-3 flex-1">
        <span class="text-2xl">${freq.icon}</span>
        <span class="text-sm font-medium text-gray-900 dark:text-white">${freq.name}</span>
      </div>
    </label>
  `).join('');

  // Permet la sélection au clic sur toute la ligne
  grid.querySelectorAll('label').forEach(label => {
    label.addEventListener('click', function (e) {
      // Empêche double déclenchement si clic sur input
      if (e.target.tagName.toLowerCase() === 'input') return;
      grid.querySelectorAll('input[type="radio"]').forEach(input => input.checked = false);
      this.querySelector('input[type="radio"]').checked = true;
      grid.querySelectorAll('label').forEach(l => l.classList.remove('bg-ll-blue', 'text-white'));
      this.classList.add('bg-ll-blue', 'text-white');
    });
  });

  // Boutons
  frequencyModal.querySelector('#frequency-modal-cancel').addEventListener('click', closeFrequencyModal);
  frequencyModal.querySelector('#frequency-modal-confirm').addEventListener('click', confirmFrequencySelection);

  function closeFrequencyModal() {
    content.classList.remove('scale-100', 'opacity-100');
    setTimeout(() => frequencyModal.classList.add('hidden'), 300);
  }

  function confirmFrequencySelection() {
    const selectedRadio = grid.querySelector('input[name="frequency"]:checked');
    if (selectedRadio) {
      const freqName = selectedRadio.closest('label').querySelector('span:last-child').textContent;
      document.getElementById('selected-frequency').textContent = freqName;
      let input = document.querySelector('input[name="frequency"]');
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'frequency';
        document.getElementById('frequency-trigger').appendChild(input);
      }
      input.value = selectedRadio.value;
      updateActiveFilters();
      updateServices();
    }
    closeFrequencyModal();
  }

  // Ouvrir depuis trigger
  document.getElementById('frequency-trigger').addEventListener('click', (e) => {
    e.stopPropagation();
    frequencyModal.classList.remove('hidden');
    setTimeout(() => content.classList.add('scale-100', 'opacity-100'), 10);
  });

  // Close on overlay click
  frequencyModal.addEventListener('click', (e) => {
    if (e.target === frequencyModal) closeFrequencyModal();
  });
}

/**
 * Crée et initialise la modale pour la difficulté
 */
function initDifficultyModal() {
  let difficultyModal = document.createElement('div');
  difficultyModal.className = 'fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4';
  difficultyModal.innerHTML = `
    <div class="modal-content absolute  bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden max-h-[90vh] overflow-y-auto transform transition-transform duration-500 scale-95 opacity-0">
      <h3 class="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Sélectionner un niveau de difficulté</h3>
      <div id="modal-difficulty-grid" class="space-y-3"></div>
      <div class="flex justify-center mt-6 gap-4">
        <button id="difficulty-modal-cancel" class="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-xl hover:bg-gray-400 dark:hover:bg-gray-500 transition-all">Annuler</button>
        <button id="difficulty-modal-confirm" class="px-6 py-2 bg-ll-blue text-white rounded-xl hover:shadow-lg neon-glow transition-all">Confirmer</button>
      </div>
    </div>
  `;
  document.body.appendChild(difficultyModal);

  const content = difficultyModal.querySelector('.modal-content');

  // Remplir la grille
  const difficulties = [
    { id: 'all', name: 'Tous', icon: '📊' },
    { id: 'easy', name: 'Facile', icon: '😊' },
    { id: 'medium', name: 'Moyen', icon: '😐' },
    { id: 'hard', name: 'Difficile', icon: '😤' }
  ];

  const grid = difficultyModal.querySelector('#modal-difficulty-grid');
  grid.innerHTML = difficulties.map(diff => `
    <label class="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-4 rounded-xl transition-all w-full ${diff.id === getCurrentFilters().difficulty ? 'bg-ll-blue text-white' : ''}">
      <input type="radio" name="difficulty" value="${diff.id}" class="form-radio text-ll-blue focus:ring-ll-blue sr-only" ${diff.id === getCurrentFilters().difficulty ? 'checked' : ''}>
      <div class="flex items-center gap-3 ml-3 flex-1">
        <span class="text-2xl">${diff.icon}</span>
        <span class="text-sm font-medium text-gray-900 dark:text-white">${diff.name}</span>
      </div>
    </label>
  `).join('');

  // Permet la sélection au clic sur toute la ligne
  grid.querySelectorAll('label').forEach(label => {
    label.addEventListener('click', function (e) {
      if (e.target.tagName.toLowerCase() === 'input') return;
      grid.querySelectorAll('input[type="radio"]').forEach(input => input.checked = false);
      this.querySelector('input[type="radio"]').checked = true;
      grid.querySelectorAll('label').forEach(l => l.classList.remove('bg-ll-blue', 'text-white'));
      this.classList.add('bg-ll-blue', 'text-white');
    });
  });

  // Boutons
  difficultyModal.querySelector('#difficulty-modal-cancel').addEventListener('click', closeDifficultyModal);
  difficultyModal.querySelector('#difficulty-modal-confirm').addEventListener('click', confirmDifficultySelection);

  function closeDifficultyModal() {
    content.classList.remove('scale-100', 'opacity-100');
    setTimeout(() => difficultyModal.classList.add('hidden'), 300);
  }

  function confirmDifficultySelection() {
    const selectedRadio = grid.querySelector('input[name="difficulty"]:checked');
    if (selectedRadio) {
      const diffName = selectedRadio.closest('label').querySelector('span:last-child').textContent;
      document.getElementById('selected-difficulty').textContent = diffName;
      let input = document.querySelector('input[name="difficulty"]');
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'difficulty';
        document.getElementById('difficulty-trigger').appendChild(input);
      }
      input.value = selectedRadio.value;
      updateActiveFilters();
      updateServices();
    }
    closeDifficultyModal();
  }

  // Ouvrir depuis trigger
  document.getElementById('difficulty-trigger').addEventListener('click', (e) => {
    e.stopPropagation();
    difficultyModal.classList.remove('hidden');
    setTimeout(() => content.classList.add('scale-100', 'opacity-100'), 10);
  });

  // Close on overlay click
  difficultyModal.addEventListener('click', (e) => {
    if (e.target === difficultyModal) closeDifficultyModal();
  });
}


/**
 * Initialise le timer d'inactivité - ROBUSTE
 */
function initFilterInactivityTimer() {
    const filterPanel = document.getElementById('filter-panel');
    if (!filterPanel) return;

    const resetTimer = () => {
        clearTimeout(filterInactivityTimer);
        filterInactivityTimer = setTimeout(() => {
            filterPanel.classList.add('hidden');
        }, INACTIVITY_CLOSE_DELAY);
    };

    filterPanel.addEventListener('mousemove', resetTimer);
    filterPanel.addEventListener('click', resetTimer);
    filterPanel.addEventListener('scroll', resetTimer);

    const openBtn = document.getElementById('open-filter-panel');
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            if (filterPanel.classList.contains('hidden')) {
                filterPanel.classList.remove('hidden');
                resetTimer();
            } else {
                filterPanel.classList.add('hidden');
                clearTimeout(filterInactivityTimer);
            }
        });
    }
}

/**
 * Initialise la recherche - DEBOUNCE ET AUTO-UPDATE (sidebar + detail complet à chaque saisie)
 */
function initSearch() {
    const searchInput = document.getElementById('service-search');
    const clearButton = document.getElementById('clear-search');
    if (!searchInput || !clearButton) return;

    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            await updateServices(); 
        }, 300);
        
        if (e.target.value) {
            searchInput.parentElement?.classList.add('neon-glow');
            clearButton.classList.remove('hidden');
        } else {
            searchInput.parentElement?.classList.remove('neon-glow');
            clearButton.classList.add('hidden');
        }
    });

    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        clearButton.classList.add('hidden');
        updateServices();
    });
}

/**
 * Initialise interactions - AVEC AUTO-UPDATE SUR FILTRES
 */
export function initServiceInteractions() {
    initFilterInactivityTimer();
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);
    
    initCategoryModal(); 
    initReviewsModal(); 
    initFrequencyModal();
    initDifficultyModal();

    initSearch(); 
    
    document.querySelectorAll('input[name="frequency"], input[name="difficulty"]').forEach(radio => {
        radio.addEventListener('change', updateServices);
    });
}

/**
 * Met à jour l'affichage des filtres actifs - AVEC AUTO-UPDATE
 */
function updateActiveFilters() {
    const activeFiltersContainer = document.getElementById('active-filters');
    if (!activeFiltersContainer) return;

    const filters = getCurrentFilters();
    const activeFilters = [];

    if (filters.category && filters.category !== 'all') {
        const categoryName = document.getElementById('selected-category')?.textContent || 'Catégorie';
        activeFilters.push({ type: 'category', value: filters.category, label: categoryName, color: 'blue' });
    }

    if (filters.frequency && filters.frequency !== 'all') {
        const frequencyName = document.getElementById('selected-frequency')?.textContent || 'Fréquence';
        activeFilters.push({ type: 'frequency', value: filters.frequency, label: frequencyName, color: 'green' });
    }

    if (filters.difficulty && filters.difficulty !== 'all') {
        const difficultyName = document.getElementById('selected-difficulty')?.textContent || 'Difficulté';
        activeFilters.push({ type: 'difficulty', value: filters.difficulty, label: difficultyName, color: 'purple' });
    }

    if (filters.reviewsMin > 0) {
        activeFilters.push({ type: 'reviews', value: filters.reviewsMin, label: `Min. ${filters.reviewsMin} avis`, color: 'yellow' });
    }

    if (activeFilters.length > 0) {
        activeFiltersContainer.innerHTML = activeFilters.map(filter => `
            <span class="inline-flex items-center gap-2 bg-${filter.color}-100/50 dark:bg-${filter.color}-900/50 text-${filter.color}-800 dark:text-${filter.color}-200 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 cursor-pointer remove-filter glass-effect neon-glow" data-type="${filter.type}">
                ${filter.label}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hover:scale-110 transition-transform">
                    <path d="M18 6L6 18"></path><path d="M6 6l12 12"></path>
                </svg>
            </span>
        `).join('');
        activeFiltersContainer.classList.remove('hidden');
        
        // Remove listeners et add new
        document.querySelectorAll('.remove-filter').forEach(button => {
            button.addEventListener('click', function() {
                const filterType = this.dataset.type;
                removeFilter(filterType);
            });
        });
    } else {
        activeFiltersContainer.classList.add('hidden');
    }
}

/**
 * Supprime un filtre et AUTO-UPDATE
 */
function removeFilter(filterType) {
    switch (filterType) {
        case 'category':
            if (document.getElementById('selected-category')) document.getElementById('selected-category').textContent = 'Toutes les catégories';
            document.querySelector('input[name="category"]')?.remove();
            break;
        case 'frequency':
            if (document.getElementById('selected-frequency')) document.getElementById('selected-frequency').textContent = 'Toutes les fréquences';
            const freqAll = document.querySelector('input[name="frequency"][value="all"]');
            if (freqAll) freqAll.checked = true;
            break;
        case 'difficulty':
            if (document.getElementById('selected-difficulty')) document.getElementById('selected-difficulty').textContent = 'Tous les niveaux';
            const diffAll = document.querySelector('input[name="difficulty"][value="all"]');
            if (diffAll) diffAll.checked = true;
            break;
        case 'reviews':
            const reviewsInput = document.getElementById('reviewsMin-input');
            if (reviewsInput) reviewsInput.value = 0;
            const display = document.getElementById('reviews-star-display');
            if (display) display.innerHTML = renderStarRatingForReviews(0);
            break;
    }
    updateActiveFilters();
    updateServices();
}

/**
 * Récupère les filtres actuels - ROBUSTE
 */
function getCurrentFilters() {
    return {
        category: document.querySelector('input[name="category"]')?.value || 'all',
        frequency: document.querySelector('input[name="frequency"]:checked')?.value || 'all',
        difficulty: document.querySelector('input[name="difficulty"]:checked')?.value || 'all',
        reviewsMin: parseInt(document.getElementById('reviewsMin-input')?.value || 0) || 0,
        search: document.getElementById('service-search')?.value || ''
    };
}

/**
 * Rend les étoiles pour l'affichage des avis min (similaire à renderStarRating)
 */
function renderStarRatingForReviews(rating) {
    return Array.from({ length: 5 }, (_, i) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${i < rating / 20 ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" class="text-yellow-400">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
    `).join('');
}

/**
 * Initialise l'affichage des étoiles pour reviews
 */
function initReviewsDisplay() {
    const display = document.getElementById('reviews-star-display');
    if (display) {
        display.innerHTML = renderStarRatingForReviews(0);
    }
}

/**
 * Réinitialise tous les filtres et AUTO-UPDATE
 */
function resetAllFilters() {
    // Reset category
    if (document.getElementById('selected-category')) document.getElementById('selected-category').textContent = 'Toutes les catégories';
    document.querySelector('input[name="category"]')?.remove();
    
    // Reset frequency
    if (document.getElementById('selected-frequency')) document.getElementById('selected-frequency').textContent = 'Toutes les fréquences';
    const freqAll = document.querySelector('input[name="frequency"][value="all"]');
    if (freqAll) freqAll.checked = true;
    
    // Reset difficulty
    if (document.getElementById('selected-difficulty')) document.getElementById('selected-difficulty').textContent = 'Tous les niveaux';
    const diffAll = document.querySelector('input[name="difficulty"][value="all"]');
    if (diffAll) diffAll.checked = true;
    
    // Reset reviews
    const reviewsInput = document.getElementById('reviewsMin-input');
    if (reviewsInput) reviewsInput.value = 0;
    const display = document.getElementById('reviews-star-display');
    if (display) display.innerHTML = renderStarRatingForReviews(0);
    
    // Reset search
    const searchInput = document.getElementById('service-search');
    const clearBtn = document.getElementById('clear-search');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    
    updateActiveFilters();
    updateServices();
}


/**
 * Met à jour l'affichage des services - ULTRA SYNCHRO: Sidebar + Details + Pagination + Index Reset + Toggle No-Services
 * Mise à jour: Cache/Supprime message no-services IMMÉDIATEMENT si services trouvés, re-render détails.
 */
async function updateServices() {
    toggleServicesLoading(true);
    
    try {
        const filters = getCurrentFilters();
        const services = await loadServices(filters); 
        
        renderServicesSidebar(services);
        updateActiveFilters();
        
        if (services.length > 0) {

            hideNoServicesMessage();
            setServiceIndex(currentServiceIndex);
            renderServiceDetail(services[currentServiceIndex], currentServiceIndex, services.length);
            // S'assurer contenu visible après render
            const existingContent = document.querySelector('#service-detail-container .service-detail-content');
            if (existingContent) {
                existingContent.classList.remove('hidden');
                existingContent.style.zIndex = '0';
            }
        } else {
            // Seulement si pas déjà affiché
            showNoServicesMessage();
        }

        const servicesCount = document.getElementById('services-count');
        if (servicesCount) servicesCount.textContent = services.length;
        
        // Refresh global pour fluidité
        if (typeof AOS !== 'undefined') AOS.refresh();
        
    } catch (error) {
        console.error('Erreur lors du chargement des services:', error);
        showNotification('Erreur lors du chargement des services.', 'error');
       
        renderServicesSidebar([]);
        showNoServicesMessage();
    } finally {
        toggleServicesLoading(false);
    }
}

/**
 * Affiche message no services - ROBUSTE ET OPAQUE: Remplace le contenu services par le message
 * Mise à jour: Cache la grille entière des services via nouveau ID, affiche message en bloc simple sans overlay/shadow.
 * Ajout : Nouveau ID 'services-display-grid' requis sur la div grid des services.
 */
export function showNoServicesMessage() {
  const grid = document.getElementById('services-display-grid');
  if (!grid) return;

  // 1. Masquer la grille entière (sidebar + détails)
  grid.classList.add('hidden');

  // 2. Créer ou afficher le div message simple (sans shadow, juste padding)
  let noServicesDiv = document.getElementById('no-services-display');
  if (!noServicesDiv) {
    noServicesDiv = document.createElement('div');
    noServicesDiv.id = 'no-services-display';
    noServicesDiv.className = 'hidden col-span-full text-center py-20';
    noServicesDiv.innerHTML = `
      <div class="max-w-md mx-auto p-8">
        <svg class="text-gray-400 dark:text-white mx-auto mb-6 animate-pulse" width="80" height="80" viewBox="0 0 74.34 74.34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path fill="currentColor" d="M29.52,53.303h-8.945c-0.552,0-1,0.448-1,1v8.104c0,0.343,0.176,0.662,0.466,0.845l4.473,2.826 c0.163,0.103,0.349,0.155,0.534,0.155s0.371-0.052,0.534-0.155l4.473-2.826c0.29-0.183,0.466-0.502,0.466-0.845v-8.104 C30.52,53.751,30.072,53.303,29.52,53.303z M28.52,61.856l-3.473,2.194l-3.473-2.194v-6.553h6.945V61.856z M22.81,28.413 c0.925,8.32,7.514,12.07,11.993,12.07c4.479,0,11.067-3.75,11.993-12.07c1.333-0.702,3.13-2.447,3.039-5.548 c-0.018-0.599-0.071-2.419-1.406-2.924c-1.313-0.497-2.638,0.819-2.891,1.088c-0.377,0.404-0.356,1.037,0.047,1.414 s1.037,0.357,1.414-0.047c0.175-0.187,0.482-0.424,0.686-0.521c0.056,0.151,0.134,0.462,0.151,1.05 c0.085,2.891-2.028,3.759-2.238,3.838l-3.894,0.853c-4.581-0.493-9.221-0.493-13.801,0l-3.901-0.854 c-0.295-0.116-2.315-1.014-2.232-3.836c0.017-0.588,0.095-0.899,0.151-1.05c0.192,0.092,0.486,0.311,0.686,0.521 c0.377,0.403,1.01,0.423,1.414,0.047c0.403-0.377,0.424-1.01,0.047-1.414c-0.252-0.269-1.572-1.589-2.891-1.088 c-1.335,0.504-1.389,2.325-1.406,2.924C19.679,25.967,21.477,27.712,22.81,28.413z M24.92,29.009l1.998,0.438l0.589,5.339 C26.295,33.365,25.331,31.47,24.92,29.009z M42.097,34.785l0.589-5.339l1.998-0.438C44.273,31.47,43.309,33.365,42.097,34.785z M40.667,29.515l-0.795,7.198c-0.002,0.017,0.005,0.032,0.004,0.048c-1.835,1.225-3.776,1.722-5.074,1.722 c-1.296,0-3.232-0.496-5.064-1.716l-0.8-7.252C32.833,29.149,36.77,29.149,40.667,29.515z M29.438,42.722l-2.902,1.362l-0.255-4.656 c-0.03-0.552-0.509-0.976-1.053-0.944c-0.551,0.03-0.974,0.502-0.944,1.053l0.053,0.972c-3.428,1.238-6.537,3.485-8.878,6.368 c-0.137-0.803-0.428-1.572-1.058-2.206c-0.255-0.257-0.565-0.466-0.905-0.648v-7.55c0.279,0.079,0.586,0.216,0.861,0.458 c0.67,0.587,1.009,1.63,1.009,3.101V43.2c0,0.552,0.448,1,1,1s1-0.448,1-1v-3.167c0-2.072-0.569-3.621-1.691-4.604 c-0.728-0.638-1.544-0.897-2.185-0.996c-0.016-0.538-0.452-0.971-0.994-0.971H1c-0.552,0-1,0.448-1,1V37.5c0,0.552,0.448,1,1,1h3.09 c0.14,1.476,0.632,4.212,2.33,5.737c-0.201,0.135-0.402,0.269-0.568,0.436c-1.194,1.201-1.185,2.886-1.177,4.372l0.001,6.94 c0,1.83,0.909,3.448,2.297,4.437c-0.578,0.87-1.148,1.603-1.145,1.603c-3.024,3.302-2.698,9.679-2.683,9.949 c0.03,0.529,0.468,0.943,0.999,0.943h13.131c0.53,0,0.968-0.414,0.999-0.943c0.015-0.27,0.341-6.648-2.662-9.925 c-0.011-0.013-0.945-1.112-1.641-2.204c0.992-0.987,1.606-2.353,1.606-3.86l0.001-5.84c2.064-3.39,5.257-6.083,8.874-7.535 l0.168,3.065c0.018,0.332,0.2,0.633,0.485,0.804c0.158,0.094,0.335,0.142,0.513,0.142c0.145,0,0.29-0.031,0.425-0.095l4.245-1.992 c0.5-0.235,0.715-0.83,0.48-1.33C30.533,42.702,29.937,42.489,29.438,42.722z M2,35.461h1.13V36.5H2V35.461z M9.391,43.338 c-3.29,0-3.357-5.784-3.357-5.842C6.03,36.98,5.633,36.57,5.13,36.519v-1.059h6.366v7.879l-1.361-0.001c-0.003,0-0.006,0-0.009,0 c-0.003,0-0.005,0-0.008,0L9.391,43.338z M6.675,49.034c-0.006-1.203-0.013-2.34,0.595-2.951c0.49-0.493,1.448-0.743,2.845-0.744 l0.024,0c1.397,0.002,2.355,0.251,2.844,0.744c0.406,0.409,0.536,1.054,0.577,1.795h-2.325c-0.552,0-1,0.448-1,1s0.448,1,1,1h2.343 l0,1.821h-2.343c-0.552,0-1,0.448-1,1s0.448,1,1,1h2.342l0,1.688h-2.342c-0.552,0-1,0.448-1,1s0.448,1,1,1h2.037 c-0.539,1.204-1.743,2.047-3.145,2.047c-1.902,0-3.45-1.548-3.45-3.45L6.675,49.034z M5.133,70.917 c0.007-0.393,0.031-0.897,0.079-1.451h10.995c0.048,0.553,0.071,1.058,0.078,1.451H5.133z M14.115,63.374 c0.974,1.063,1.509,2.608,1.808,4.091H5.501c0.305-1.494,0.853-3.057,1.852-4.149c0.037-0.047,0.767-0.981,1.456-2.049 c0.423,0.105,0.862,0.168,1.317,0.168c0.78,0,1.52-0.167,2.191-0.464C13.089,62.17,14.047,63.296,14.115,63.374z M21.2,16.754v1.046 c0,0.552,0.448,1,1,1s1-0.448,1-1v-1.37c2.995-1.182,7.331-2.308,11.602-2.308c4.271,0,8.607,1.126,11.602,2.308v1.37 c0,0.552,0.448,1,1,1s1-0.448,1-1v-1.046c0.266-0.186,0.428-0.489,0.428-0.815V5.24c0-0.395-0.232-0.753-0.594-0.914 c-3.156-1.404-8.343-2.904-13.436-2.904c-5.094,0-10.281,1.5-13.436,2.904c-0.361,0.161-0.594,0.519-0.594,0.914v10.698 C20.772,16.264,20.935,16.567,21.2,16.754z M22.772,5.9c2.999-1.241,7.556-2.477,12.03-2.477c4.474,0,9.03,1.236,12.03,2.477v8.546 c-3.169-1.208-7.635-2.325-12.03-2.325c-4.396,0-8.86,1.117-12.03,2.325V5.9z M73.34,32.94h-25.23c-0.552,0-1,0.448-1,1v3.523 c0,0.552,0.448,1,1,1h2.335l9.721,6.916v9.426c-1.676,0.08-2.913,0.494-3.715,1.301c-1.194,1.201-1.185,2.886-1.177,4.372 l0.001,6.94c0,3.005,2.445,5.45,5.45,5.45s5.45-2.445,5.45-5.45l0.001-6.94c0.008-1.486,0.017-3.171-1.177-4.372 c-0.658-0.662-1.595-1.068-2.833-1.239v-9.516c4.234-3.308,7.866-6.118,8.861-6.888h2.313c0.552,0,1-0.448,1-1V33.94 C74.34,33.387,73.892,32.94,73.34,32.94z M64.176,60.468l-0.001,6.951c0,1.902-1.548,3.45-3.45,3.45 c-1.402,0-2.606-0.844-3.145-2.047h2.037c0.552,0,1-0.448,1-1s-0.448-1-1-1h-2.342l0-1.688h2.342c0.552,0,1-0.448,1-1s-0.448-1-1-1 h-2.343l0-1.821h2.343c0.552,0,1-0.448,1-1s-0.448-1-1-1h-2.325c0.041-0.741,0.171-1.386,0.577-1.795 c0.491-0.494,1.453-0.745,2.856-0.745s2.365,0.25,2.856,0.745C64.189,58.128,64.183,59.264,64.176,60.468z M72.34,36.463h-1.654 c-0.221,0-0.436,0.073-0.611,0.208c0,0-4.039,3.119-8.937,6.944l-9.794-6.968c-0.169-0.12-0.372-0.185-0.58-0.185h-1.654V34.94 h23.23V36.463z M45.023,42.462l-0.176,3.212c-0.018,0.332-0.2,0.633-0.485,0.804c-0.158,0.094-0.335,0.142-0.513,0.142 c-0.145,0-0.29-0.031-0.425-0.095l-4.245-1.992c-0.5-0.235-0.715-0.83-0.48-1.33c0.234-0.501,0.831-0.715,1.33-0.48l2.902,1.362 l0.255-4.656c0.03-0.552,0.502-0.974,1.053-0.944c0.551,0.03,0.974,0.502,0.944,1.053l-0.046,0.835 c5.806,1.963,10.629,6.745,12.592,12.492c0.179,0.522-0.101,1.091-0.623,1.27c-0.107,0.037-0.216,0.054-0.323,0.054 c-0.416,0-0.804-0.262-0.946-0.677C54.129,48.515,50.015,44.334,45.023,42.462z M35.802,47.247v24.44c0,0.552-0.448,1-1,1 s-1-0.448-1-1v-24.44c0-0.552,0.448-1,1-1S35.802,46.695,35.802,47.247z M48.725,30.049h24c0.552,0,1,0.448,1,1s-0.448,1-1,1h-24 c-0.552,0-1-0.448-1-1S48.172,30.049,48.725,30.049z"/>
          </g>
        </svg>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Aucun service trouvé</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-8">Aucun service ne correspond à vos critères de recherche. Essayez de modifier vos filtres.</p>
        <button id="reset-search-filters" class="bg-gradient-to-r from-ll-blue to-blue-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-ll-dark-blue transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 neon-glow">
          Réinitialiser les filtres
        </button>
      </div>
    `;
    grid.parentNode.insertBefore(noServicesDiv, grid.nextSibling);
  }
  noServicesDiv.classList.remove('hidden');

  // 3. Event listener pour bouton (idempotent)
  const resetBtn = document.getElementById('reset-search-filters');
  if (resetBtn && !resetBtn._listenerAdded) {
    if (typeof resetAllFilters === 'function') {
      resetBtn.addEventListener('click', resetAllFilters);
    } else {
      resetBtn.addEventListener('click', () => console.log('Filtres réinitialisés.'));
    }
    resetBtn._listenerAdded = true;
  }
}

/**
 * Cache le message "Aucun service trouvé" et réaffiche les détails - IMMÉDIAT
 * Appelée quand des services sont trouvés pour toggle instantané.
 */
export function hideNoServicesMessage() {
  const grid = document.getElementById('services-display-grid');
  const noServicesDiv = document.getElementById('no-services-display');
  if (!grid) return;

  // 1. Réafficher la grille
  grid.classList.remove('hidden');

  // 2. Masquer le message
  if (noServicesDiv) {
    noServicesDiv.classList.add('hidden');
  }

  // 3. Refresh AOS pour animations fluides
  if (typeof AOS !== 'undefined') AOS.refresh();
}


/**
 * Initialise les particules interactives
 */
function initParticles() {
  if (typeof particlesJS === 'undefined' || !document.getElementById('particles-js')) {
    //console.warn('particlesJS non chargé');
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
    //console.warn('Conteneur "Engagement Écologique" non trouvé');
    return;
  }

 
  const commitments = ECO_DATA.ecoCommitments;

  // Populate the eco section
  ecoContainer.innerHTML = commitments.map((commitment, index) => `
    <div class="eco-card relative group p-6 rounded-2xl border border-ll-black/20 dark:border-white/50 bg-white dark:bg-ll-black shadow-lg hover:shadow-green-500/30 transform hover:scale-[1.03] transition-all duration-500 cursor-pointer overflow-hidden" data-aos="fade-up" data-aos-delay="${index * 100}" data-lottie-url="${commitment.lottieUrl}">
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
       // console.warn('Conteneur des statistiques non trouvé');
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
            <div class="relative w-[140px] h-[140px] aspect-square  mb-2">
                <canvas id="stat-canvas-${index}"  class="w-full h-full absolute "></canvas>
                <div class="absolute inset-0 flex items-center justify-center z-10">
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

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const size = rect.width; // largeur réelle du parent
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);
        return size;
    }

    let size = resizeCanvas();
    const radius = size / 2.8; // rayon ajusté dynamiquement
    const centerX = size / 2;
    const centerY = size / 2;

    let current = 0;
    const increment = target / 100;
    let pulsePhase = 0;
    let isCountingComplete = false;

    let themeToApply = detectTheme();
    let fontColor = getFontColor(themeToApply);
    let glowColor = themeToApply === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(37, 99, 235, 0.3)';

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#2563EB');
    gradient.addColorStop(1, '#90EE90');

    function handleThemeChange() {
        const newTheme = detectTheme();
        if (newTheme !== themeToApply) {
            themeToApply = newTheme;
            fontColor = getFontColor(themeToApply);
            glowColor = themeToApply === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(37, 99, 235, 0.3)';
        }
    }

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

        // Arc progression
        const progress = isCountingComplete ? 1 : current / target;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, (2 * Math.PI * progress) - Math.PI / 2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 8;
        ctx.stroke();

        // Effet pulse
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

        // Incrément valeur
        if (!isCountingComplete && current < target) {
            current += increment;
            if (current >= target) {
                current = target;
                isCountingComplete = true;
            }
        }

        requestAnimationFrame(draw);
    }

    draw();

    // Gérer redimensionnement (responsivité)
    const resizeObserver = new ResizeObserver(() => {
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
        size = resizeCanvas();
    });
    resizeObserver.observe(canvas);
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
 // initBeforeAfterSliders();
  initParticles();
  initScrollAnimations();
  initVideoModal();
  initWhyUsSection();
  initEco();
  renderBeforeAfter();

  



    initReviewsDisplay();
    initServiceInteractions();
    await updateServices();
   
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up', 'neon-glow');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observer les éléments de services
    document.querySelectorAll('.service-card, .glass-effect').forEach(el => {
        observer.observe(el);
    });

    // Animation pour étoiles sur hover
    document.addEventListener('mouseover', (e) => {
        if (e.target.classList.contains('star-filled') || e.target.classList.contains('star-empty')) {
            e.target.style.transform = 'scale(1.2) rotate(5deg)';
            e.target.style.filter = 'drop-shadow(0 0 10px #fbbf24)';
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.classList.contains('star-filled') || e.target.classList.contains('star-empty')) {
            e.target.style.transform = 'scale(1)';
            e.target.style.filter = 'none';
        }
    });

    // Refresh AOS after dynamic content
    window.addEventListener('load', () => {
        AOS.refresh();
    });



// Sélectionne les images pour lightbox, en excluant celles de sections spécifiques (ex. : footer, header, ou avec classe .no-lightbox)
const images = Array.from(
  document.querySelectorAll(
    'img.lightbox-img, #services img, .gallery img, img' 
    + ':not(.no-lightbox):not(#partners img):not(.footer img):not(#footer img)'
  )
);

if (images.length === 0) return;

const srcList = images.map(el => el.getAttribute('data-src') || el.src);
const altList = images.map(el => el.getAttribute('alt') || '');

if (srcList.length === 0) return;

images.forEach((img, index) => {
  img.style.cursor = 'zoom-in';
  img.addEventListener('click', () => {
    openLightbox(srcList, index, altList);
  });
});

const heroSection = document.getElementById("hero");
const services = document.getElementById("services");
const header = document.getElementById("blurred-header");
const name = document.getElementById("name-entreprise");
const entreprise = document.getElementById("entreprise");

if (heroSection && header && services) {
  const onScroll = () => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    const servicesRect = services.getBoundingClientRect();
    const headerHeight = header.offsetHeight;

    // ✅ Vérifie si le header est sous le hero
    const isPastHero = heroBottom <= headerHeight;

    // ✅ Vérifie si on est dans la zone "services"
    const isOnServices = servicesRect.top <= headerHeight;

    // --- Application des styles ---
    if (isPastHero || isOnServices) {
      entreprise.classList.add("gradiant");
      entreprise.classList.remove("header-btn");
      name.classList.remove("back-text");
    } else {
      name.classList.add("back-text");
      entreprise.classList.add("header-btn");
      entreprise.classList.remove("gradiant");
    }

    if (isDarkMode) return;

    if (isPastHero || isOnServices) {
      header.classList.add("header-light-style");
      entreprise.classList.add("gradiant");
      entreprise.classList.remove("header-btn");
      name.classList.remove("back-text");
    } else {
      header.classList.remove("header-light-style");
      name.classList.add("back-text");
      entreprise.classList.add("header-btn");
      entreprise.classList.remove("gradiant");
    }
  };

  onScroll();
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



