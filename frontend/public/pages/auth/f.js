/* ===== COMMON.JS - VERSION ULTRA COMPLÈTE ET INDEX.JS FUSIONNÉS ===== */
/**
 * Configuration globale de l'application portfolio.
 * @type {Object}
 */
const PortfolioConfig = {
  isMobile: window.innerWidth < 992,
  isTouch: 'ontouchstart' in window,
  prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,

  dom: {
    body: document.body,
    header: document.querySelector('.main-header'),
    burgerButton: document.querySelector('.burger-menu'),
    mobileMenu: document.querySelector('.mobile-menu'),
    themeToggles: document.querySelectorAll('.theme-toggle'), // Modifié pour gérer plusieurs boutons
    scrollToTop: document.querySelector('.scroll-to-top'),
    currentYear: document.querySelector('.current-year'),
    allAnimated: document.querySelectorAll('[data-animate]'),
    tooltips: document.querySelectorAll('[data-tooltip]'),
    heroSection: document.querySelector('.hero-section'),
    avatarContainer: document.querySelector('.avatar-container'),
    techIcons: document.querySelectorAll('.tech-icon'),
    galleryItems: document.querySelectorAll('.gallery-item'),
    scrollDown: document.querySelector('.scroll-down'),
    heroSubtitle: document.querySelector('.hero-subtitle'),
    navLinks:document.querySelectorAll('.nav-link, .mobile-nav-link, .footer-link'),
    contactForm: document.querySelector('#contactForm'),
    formMessage: document.querySelector('#formMessage'),

  },

  states: {
    menuOpen: false,
    darkMode: false,
    scrolled: false,
    isTyping: false,
     currentSection: '',
    currentPage: ''
  },

  storage: {
    theme: 'portfolio_theme_preference',
    visited: 'portfolio_first_visit'
  },

  typing: {
    texts: [
      "Développeuse Full-Stack",
      "Spécialiste React & Node.js",
      "Passionnée d'UI/UX",
      "Créatrice de solutions digitales"
    ],
    currentIndex: 0,
    charIndex: 0,
    isDeleting: false,
    isPaused: false,
    typingSpeed: 100,
    pauseDuration: 2000,
    deleteSpeed: 50,
    initialDelay: 1500
  },

  parallax: {
    elements: []
  }
};

/**
 * Initialise l'application portfolio.
 */
function initApp() {
  console.log('Initialisation de l\'application...');

  // Initialise les fonctionnalités globales
  initThemeSystem();
  initMobileMenu();
  initSmoothScrolling();
  initScrollEffects();
  initTooltips();
  initCurrentYear();
  initObservers();
  initAnalytics();
initActiveLinks();

  // Initialise les fonctionnalités spécifiques à la page d'accueil
  if (PortfolioConfig.dom.heroSubtitle) {
    initTypingEffect();
  }
  if (PortfolioConfig.dom.avatarContainer) {
    initAvatarInteraction();
  }
  if (PortfolioConfig.dom.galleryItems && PortfolioConfig.dom.galleryItems.length > 0) {
    initGalleryHover();
  }
  if (PortfolioConfig.dom.scrollDown) {
    initScrollDown();
  }
  if (PortfolioConfig.dom.heroSection) {
    initParallaxEffect();
  }
  initRippleEffect();
  setupEventListeners();

  // Met à jour les liens actifs au chargement
  updateActiveLinks();

  console.log('Application initialisée.');
}



/**
 * SECTION: Gestion des liens actifs
 * Met à jour les liens de navigation en fonction de la page actuelle
 */
function initActiveLinks() {
  // Obtenir le chemin de la page actuelle
  const currentPath = window.location.pathname;
  // Extraire le nom du fichier ou utiliser 'index.html' si nous sommes à la racine
  PortfolioConfig.states.currentPage = currentPath.split('/').pop() || 'index.html';
  
  // Mettre à jour les liens actifs selon la page actuelle
  updateActiveLinks();
  
  // Si la page a des sections avec IDs, initialiser l'observateur pour la navigation intra-page
  const sections = document.querySelectorAll('section[id]');
  if (sections.length > 0) {
    initActiveSectionObserver(sections);
  }
}

/**
 * SECTION: Thème Sombre/Clair
 * Gère la fonctionnalité de thème sombre et clair.
 */
function initThemeSystem() {
  const savedTheme = localStorage.getItem(PortfolioConfig.storage.theme);
  PortfolioConfig.states.darkMode = savedTheme
    ? savedTheme === 'dark'
    : PortfolioConfig.prefersDark;

  applyTheme(PortfolioConfig.states.darkMode);

  // Gestion de plusieurs boutons de thème
  PortfolioConfig.dom.themeToggles.forEach(toggle => {
    toggle.addEventListener('click', toggleTheme);
  });

  updateThemeIcons(); // Mise à jour de tous les icônes

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem(PortfolioConfig.storage.theme)) {
      applyTheme(e.matches);
    }
  });
}

function applyTheme(isDark) {
  PortfolioConfig.states.darkMode = isDark;
  PortfolioConfig.dom.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
  localStorage.setItem(PortfolioConfig.storage.theme, isDark ? 'dark' : 'light');
  updateThemeIcons();
}

function toggleTheme() {
  applyTheme(!PortfolioConfig.states.darkMode);
}

function updateThemeIcons() {
  PortfolioConfig.dom.themeToggles.forEach(toggle => {
    const icon = toggle.querySelector('i');
    if (!icon) return;
    icon.classList.toggle('fa-moon', !PortfolioConfig.states.darkMode);
    icon.classList.toggle('fa-sun', PortfolioConfig.states.darkMode);
  });
}




/**
 * SECTION: Gestion des liens actifs
 * Met à jour les liens de navigation en fonction de la page actuelle
 */
function initActiveLinks() {
  // Obtenir le chemin de la page actuelle
  const currentPath = window.location.pathname;
  // Extraire le nom du fichier ou utiliser 'index.html' si nous sommes à la racine
  PortfolioConfig.states.currentPage = currentPath.split('/').pop() || 'index.html';
  
  // Mettre à jour les liens actifs selon la page actuelle
  updateActiveLinks();
  
  // Si la page a des sections avec IDs, initialiser l'observateur pour la navigation intra-page
  const sections = document.querySelectorAll('section[id]');
  if (sections.length > 0) {
    initActiveSectionObserver(sections);
  }
}

/**
 * Met à jour les liens de navigation en fonction de la page actuelle
 */
function updateActiveLinks() {
  const currentPage = PortfolioConfig.states.currentPage;
  
  // Sélectionner tous les liens de navigation (desktop, mobile et footer)
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link, .footer-link');
  
  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    // Le lien est actif si son href correspond à la page actuelle
    const isActive = linkPath === currentPage;
    
    // Ajouter ou supprimer la classe 'active'
    link.classList.toggle('active', isActive);
    
    // Mettre à jour l'attribut aria-current pour l'accessibilité
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

/**
 * Initialise l'observateur d'intersection pour les sections avec IDs
 * @param {NodeList} sections - Liste des sections à observer
 */
function initActiveSectionObserver(sections) {
  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        PortfolioConfig.states.currentSection = entry.target.id;
        // Pour une éventuelle mise en évidence des ancres internes
        updateInternalAnchors();
      }
    });
  }, options);

  sections.forEach(section => {
    observer.observe(section);
  });
}

/**
 * Met à jour les ancres internes en fonction de la section visible
 * (utilisé pour les liens de navigation intra-page)
 */
function updateInternalAnchors() {
  const currentSection = PortfolioConfig.states.currentSection;
  if (!currentSection) return;
  
  const internalLinks = document.querySelectorAll('a[href^="#"]');
  internalLinks.forEach(link => {
    const linkHash = link.getAttribute('href');
    // Vérifier si le lien pointe vers la section actuelle
    const isActive = linkHash === `#${currentSection}`;
    link.classList.toggle('active', isActive);
  });
}





/**
 * SECTION: Menu Mobile
 * Gère l'ouverture et la fermeture du menu mobile.
 */
function initMobileMenu() {
  if (!PortfolioConfig.dom.burgerButton || !PortfolioConfig.dom.mobileMenu) return;

  PortfolioConfig.dom.burgerButton.addEventListener('click', function() {
    PortfolioConfig.states.menuOpen = !PortfolioConfig.states.menuOpen;
    this.classList.toggle('active');
    PortfolioConfig.dom.mobileMenu.classList.toggle('active');
    PortfolioConfig.dom.body.classList.toggle('no-scroll', PortfolioConfig.states.menuOpen);
    this.setAttribute('aria-expanded', PortfolioConfig.states.menuOpen);
    
    this.querySelectorAll('.burger-line').forEach(line => {
      line.classList.toggle('active', PortfolioConfig.states.menuOpen);
    });
  });

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (PortfolioConfig.states.menuOpen) {
        PortfolioConfig.dom.burgerButton.click();
      }
    });
  });
}

/**
 * SECTION: Défilement Fluide
 * Initialise le défilement fluide vers les ancres.
 */
function initSmoothScrolling() {
  if (!('scrollBehavior' in document.documentElement.style)) {
    import('https://cdn.jsdelivr.net/npm/smoothscroll-polyfill@0.4.4/dist/smoothscroll.min.js')
      .then(() => smoothscroll.polyfill());
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    if (anchor.hash === '#') return;
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.hash);
      if (!target) return;
      
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      if (history.pushState) {
        history.pushState(null, null, this.hash);
      } else {
        window.location.hash = this.hash;
      }
      
      // Mise à jour manuelle pour les cas où l'IntersectionObserver ne détecte pas le changement
      PortfolioConfig.states.currentSection = this.hash.substring(1);
      updateActiveLinks();
    });
  });
}

/**
 * SECTION: Effets de Scroll
 * Gère les effets qui se produisent lors du défilement de la page.
 */
function initScrollEffects() {
  window.addEventListener('scroll', () => {
    PortfolioConfig.states.scrolled = window.scrollY > 100;
    PortfolioConfig.dom.header?.classList.toggle('scrolled', PortfolioConfig.states.scrolled);
  });

  if (PortfolioConfig.dom.scrollToTop) {
    window.addEventListener('scroll', () => {
      const show = window.scrollY > window.innerHeight;
      PortfolioConfig.dom.scrollToTop.classList.toggle('visible', show);
    });

    PortfolioConfig.dom.scrollToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/**
 * SECTION: Tooltips
 * Initialise les tooltips pour les éléments avec l'attribut data-tooltip.
 */
function initTooltips() {
  PortfolioConfig.dom.tooltips.forEach(element => {
    const tooltipText = element.getAttribute('data-tooltip');
    if (!tooltipText) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = tooltipText;
    document.body.appendChild(tooltip);

    const updatePosition = () => {
      const rect = element.getBoundingClientRect();
      tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
      tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
    };

    element.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1';
      updatePosition();
    });

    element.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });

    element.addEventListener('mousemove', updatePosition);
  });
}

/**
 * SECTION: Année Courante
 * Met à jour l'année courante dans les éléments spécifiés.
 */
function initCurrentYear() {
  if (PortfolioConfig.dom.currentYear) {
    PortfolioConfig.dom.currentYear.textContent = new Date().getFullYear();
  }
}

/**
 * SECTION: Observers Intersection
 * Initialise les observers pour les animations et le lazy loading.
 */
function initObservers() {
  const animateObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
        animateObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  PortfolioConfig.dom.allAnimated.forEach(el => {
    animateObserver.observe(el);
  });

  if ('IntersectionObserver' in window) {
    const lazyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const lazyElement = entry.target;
          if (lazyElement.dataset.src) {
            lazyElement.src = lazyElement.dataset.src;
          }
          if (lazyElement.dataset.srcset) {
            lazyElement.srcset = lazyElement.dataset.srcset;
          }
          lazyObserver.unobserve(lazyElement);
        }
      });
    });

    document.querySelectorAll('[data-src], [data-srcset]').forEach(el => {
      lazyObserver.observe(el);
    });
  }
}

/**
 * SECTION: Google Analytics
 * Initialise Google Analytics si la fonction gtag est définie.
 */
function initAnalytics() {
  if (typeof gtag !== 'undefined') {
    console.log('Google Analytics initialisé.');
  }
}

/**
 * SECTION: Écouteurs d'Événements Globaux
 * Configure les écouteurs d'événements pour la fenêtre et le document.
 */
function setupEventListeners() {
  // Redimensionnement de la fenêtre
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      PortfolioConfig.isMobile = window.innerWidth < 992;
      console.log(`Taille de l'écran mise à jour: Mobile? ${PortfolioConfig.isMobile}`);
    }, 250);
  });

  // Clic en dehors du menu mobile
  document.addEventListener('click', (e) => {
    if (PortfolioConfig.states.menuOpen &&
        !e.target.closest('.mobile-menu') &&
        !e.target.closest('.burger-menu')) {
      PortfolioConfig.dom.burgerButton.click();
    }
  });

  // Touche Escape pour fermer le menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && PortfolioConfig.states.menuOpen) {
      PortfolioConfig.dom.burgerButton.click();
    }
  });

  // Transition entre les pages (empêche le rechargement complet)
  const links = document.querySelectorAll('a:not([target="_blank"]):not([href^="#"]):not([href^="mailto:"]):not([href^="tel:])');
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      if (link.href === window.location.href) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      // Ici, vous pouvez ajouter une animation de transition avant de changer de page
      window.location.href = link.href;
    });
  });
}

/**
 * SECTION: Effet de Texte Tapé (Page d'Accueil)
 * Gère l'animation de l'effet de texte tapé sur la sous-titre de la section héroïque.
 */
function initTypingEffect() {
  if (!PortfolioConfig.dom.heroSubtitle || PortfolioConfig.states.isTyping) return;
  PortfolioConfig.states.isTyping = true;

  const type = () => {
    if (PortfolioConfig.typing.isPaused) return;

    const currentText = PortfolioConfig.typing.texts[PortfolioConfig.typing.currentIndex];
    let displayText;

    if (PortfolioConfig.typing.isDeleting) {
      displayText = currentText.substring(0, PortfolioConfig.typing.charIndex - 1);
      PortfolioConfig.typing.charIndex--;
      PortfolioConfig.typing.typingSpeed = PortfolioConfig.typing.deleteSpeed;
    } else {
      displayText = currentText.substring(0, PortfolioConfig.typing.charIndex + 1);
      PortfolioConfig.typing.charIndex++;
      PortfolioConfig.typing.typingSpeed = PortfolioConfig.typing.charIndex % 3 === 0 ? 150 : 100;
    }

    PortfolioConfig.dom.heroSubtitle.textContent = displayText;

    if (!PortfolioConfig.typing.isDeleting && PortfolioConfig.typing.charIndex === currentText.length) {
      PortfolioConfig.typing.isPaused = true;
      setTimeout(() => {
        PortfolioConfig.typing.isPaused = false;
        PortfolioConfig.typing.isDeleting = true;
        setTimeout(type, 200);
      }, PortfolioConfig.typing.pauseDuration);
    } else if (PortfolioConfig.typing.isDeleting && PortfolioConfig.typing.charIndex === 0) {
      PortfolioConfig.typing.isDeleting = false;
      PortfolioConfig.typing.currentIndex = (PortfolioConfig.typing.currentIndex + 1) % PortfolioConfig.typing.texts.length;
      setTimeout(type, 500);
    } else {
      setTimeout(type, PortfolioConfig.typing.typingSpeed);
    }
  };

  setTimeout(type, PortfolioConfig.typing.initialDelay);
}

/**
 * SECTION: Interaction Avatar (Page d'Accueil)
 * Gère l'effet de survol interactif sur l'avatar.
 */
function initAvatarInteraction() {
  if (!PortfolioConfig.dom.avatarContainer || PortfolioConfig.isTouch) return;

  const avatarImage = PortfolioConfig.dom.avatarContainer.querySelector('.avatar-image');
  const hoverEffect = document.createElement('div');
  hoverEffect.className = 'avatar-hover-effect';
  PortfolioConfig.dom.avatarContainer.appendChild(hoverEffect);

  PortfolioConfig.dom.avatarContainer.addEventListener('mousemove', (e) => {
    const rect = PortfolioConfig.dom.avatarContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = (x - centerX) / 15;
    const rotateX = (centerY - y) / 15;
    PortfolioConfig.dom.avatarContainer.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    const glowX = (x / rect.width) * 100;
    const glowY = (y / rect.height) * 100;
    hoverEffect.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(71, 181, 255, 0.3), transparent)`;
  });

  PortfolioConfig.dom.avatarContainer.addEventListener('mouseleave', () => {
    PortfolioConfig.dom.avatarContainer.style.transform = `rotateY(0) rotateX(0)`;
    hoverEffect.style.opacity = '0';
    setTimeout(() => {
      hoverEffect.style.background = 'transparent';
      hoverEffect.style.opacity = '1';
    }, 300);
  });
}

/**
 * SECTION: Hover Galerie (Page d'Accueil)
 * Gère les effets de survol sur les éléments de la galerie de projets.
 */
function initGalleryHover() {
  PortfolioConfig.dom.galleryItems.forEach(item => {
    const image = item.querySelector('.gallery-image');
    const overlay = item.querySelector('.gallery-overlay');

    if (image && image.dataset.src) {
      image.src = image.dataset.src;
    }

    item.addEventListener('mouseenter', () => {
      if (PortfolioConfig.isTouch) return;
      item.style.zIndex = '10';
      overlay.style.transform = 'translateY(0)';
      image.style.transform = 'scale(1.1)';
    });

    item.addEventListener('mouseleave', () => {
      item.style.zIndex = '1';
      overlay.style.transform = 'translateY(100%)';
      image.style.transform = 'scale(1)';
    });

    if (PortfolioConfig.isTouch) {
      item.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        PortfolioConfig.dom.galleryItems.forEach(i => {
          i.classList.remove('active');
          i.querySelector('.gallery-overlay').style.transform = 'translateY(100%)';
          i.querySelector('.gallery-image').style.transform = 'scale(1)';
        });
        if (!isActive) {
          item.classList.add('active');
          overlay.style.transform = 'translateY(0)';
          image.style.transform = 'scale(1.1)';
        }
      });
    }
  });
}

/**
 * SECTION: Animation Scroll Down (Page d'Accueil)
 * Anime le bouton "scroll down" pour indiquer la direction du défilement.
 */
function initScrollDown() {
  if (!PortfolioConfig.dom.scrollDown) return;

  PortfolioConfig.dom.scrollDown.addEventListener('click', (e) => {
    e.preventDefault();
    const gallerySection = document.querySelector('.gallery-section');
    if (gallerySection) {
      gallerySection.scrollIntoView({ behavior: 'smooth' });
    }
  });

  setInterval(() => {
    if (window.scrollY === 0) {
      PortfolioConfig.dom.scrollDown.style.transform = 'translateY(0)';
      setTimeout(() => {
        PortfolioConfig.dom.scrollDown.style.transform = 'translateY(-10px)';
      }, 1000);
    }
  }, 2000);
}

/**
 * SECTION: Effet Parallaxe (Page d'Accueil)
 * Applique un effet de parallaxe aux éléments de la section héroïque lors du défilement.
 */
function initParallaxEffect() {
  if (PortfolioConfig.isMobile || !PortfolioConfig.dom.heroSection) return;

  PortfolioConfig.parallax.elements = [
    { element: PortfolioConfig.dom.heroSection.querySelector('.hero-title'), factor: 0.1 },
    { element: PortfolioConfig.dom.heroSection.querySelector('.hero-subtitle'), factor: 0.15 },
    { element: PortfolioConfig.dom.avatarContainer, factor: 0.2 },
    { element: PortfolioConfig.dom.heroSection.querySelector('.tech-stack'), factor: 0.05 }
  ];

  window.addEventListener('scroll', () => {
    if (PortfolioConfig.states.isScrolling) return;
    PortfolioConfig.states.isScrolling = true;
    const scrollPosition = window.scrollY;

    requestAnimationFrame(() => {
      PortfolioConfig.parallax.elements.forEach(item => {
        if (!item.element) return;
        const position = (scrollPosition * item.factor);
        item.element.style.transform = `translateY(${position}px)`;
      });
      PortfolioConfig.states.isScrolling = false;
    });
  });
}

/**
 * SECTION: Effet Ripple sur les Boutons
 * Ajoute un effet de vague visuel lors du clic sur les boutons.
 */
function initRippleEffect() {
  const buttons = document.querySelectorAll('.btn:not(.no-ripple)');

  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      this.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 1000);
    });
  });
}

// Initialisation de l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', initApp);

// Export pour les tests (si module)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initApp,
    applyTheme,
    toggleTheme,
    PortfolioConfig
  };
}



let formData = {
        name: "",
        email: "",
        country: "FR",
        dialCode: "+33",
        phone: "",
        city: "",
        street: "",
        postalCode: "",
        password: "",
        confirmPassword: ""
    };

    let countriesData = [];
    let citiesData = {};
    let streetsData = {};

    document.addEventListener('DOMContentLoaded', function() {
        

        // Charger les pays depuis le fichier JSON
        fetch('/assets/json/countries.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur de chargement des pays');
                }
                return response.json();
            })
            .then(data => {
                countriesData = data;
                populateCountryGrid(data);
                // Définir la France par défaut
                const france = data.find(country => country.code === 'FR');
                if (france) {
                    selectCountry(france.code, `${france.flag} ${france.name}`, france.dial_code);
                    // Charger les villes pour la France par défaut et définir Angers
                    fetch('/assets/json/fr.json')
                        .then(resp => {
                            if (!resp.ok) {
                                throw new Error('Erreur de chargement des villes pour la France');
                            }
                            return resp.json();
                        })
                        .then(cities => {
                            citiesData['fr'] = cities;
                            const angers = cities.find(city => city.name === 'Angers');
                            if (angers) {
                                selectCity(angers.id, angers.name, angers.postalCode);
                                // Charger les rues pour Angers et définir une rue par défaut (la première)
                                fetch(`/assets/json/${angers.id}.json`)
                                    .then(streetResp => {
                                        if (!streetResp.ok) {
                                            throw new Error('Erreur de chargement des rues pour Angers');
                                        }
                                        return streetResp.json();
                                    })
                                    .then(streets => {
                                        streetsData[angers.id] = streets;
                                        if (streets.length > 0) {
                                            const defaultStreet = streets[0];
                                            selectStreet(defaultStreet.id, defaultStreet.name);
                                        }
                                    })
                                    .catch(() => {
                                        loadFallbackStreets(angers.id);
                                        const streets = streetsData[angers.id];
                                        if (streets && streets.length > 0) {
                                            const defaultStreet = streets[0];
                                            selectStreet(defaultStreet.id, defaultStreet.name);
                                        }
                                    });
                            }
                        })
                        .catch(() => {
                            loadFallbackCities('fr');
                            const cities = citiesData['fr'];
                            const angers = cities.find(city => city.name === 'Angers');
                            if (angers) {
                                selectCity(angers.id, angers.name, angers.postalCode);
                                loadFallbackStreets(angers.id);
                                const streets = streetsData[angers.id];
                                if (streets && streets.length > 0) {
                                    const defaultStreet = streets[0];
                                    selectStreet(defaultStreet.id, defaultStreet.name);
                                }
                            }
                        });
                }
            })
            .catch(error => {
                console.error('Erreur lors du chargement des pays:', error);
                // Charger des données de secours
                loadFallbackCountries();
            });

        // Ajouter les écouteurs pour validation en temps réel
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const postalCodeInput = document.getElementById('postalCode');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        nameInput.addEventListener('blur', () => {
            if (!nameInput.value.trim()) {
                showError(nameInput, 'Le nom est requis');
            } else {
                clearError(nameInput);
                formData.name = nameInput.value.trim();
            }
        });

        emailInput.addEventListener('blur', () => {
            const value = emailInput.value.trim();
            if (!value) {
                showError(emailInput, 'L\'email est requis');
            } else if (!isValidEmail(value)) {
                showError(emailInput, 'Veuillez entrer un email valide');
            } else {
                clearError(emailInput);
                formData.email = value;
            }
        });

        phoneInput.addEventListener('blur', () => {
            const value = phoneInput.value.trim();
            if (!value) {
                showError(phoneInput, 'Le numéro de téléphone est requis');
            } else if (!isValidPhone(value)) {
                showError(phoneInput, 'Veuillez entrer un numéro de téléphone valide');
            } else {
                clearError(phoneInput);
                formData.phone = value;
            }
        });

        postalCodeInput.addEventListener('blur', () => {
            if (!postalCodeInput.value.trim()) {
                showError(postalCodeInput, 'Le code postal est requis');
            } else {
                clearError(postalCodeInput);
                formData.postalCode = postalCodeInput.value.trim();
            }
        });

        passwordInput.addEventListener('blur', () => {
            const value = passwordInput.value;
            if (!value) {
                showError(passwordInput, 'Le mot de passe est requis');
            } else if (value.length < 8) {
                showError(passwordInput, 'Le mot de passe doit contenir au moins 8 caractères');
            } else {
                clearError(passwordInput);
                formData.password = value;
            }
            // Vérifier aussi la confirmation si déjà remplie
            if (confirmPasswordInput.value) {
                validateConfirmPassword();
            }
        });

        confirmPasswordInput.addEventListener('blur', validateConfirmPassword);

        // Ouvrir le modal pour sélectionner le pays
        document.getElementById('country').addEventListener('click', function() {
            document.getElementById('country-modal').classList.remove('hidden');
            document.body.classList.add('modal-active');
        });

        // Fermer le modal pays
        document.getElementById('close-country-modal').addEventListener('click', function() {
            document.getElementById('country-modal').classList.add('hidden');
            document.body.classList.remove('modal-active');
        });

        // Recherche dans le grid des pays
        document.getElementById('country-search').addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filteredCountries = countriesData.filter(country => 
                country.name.toLowerCase().includes(searchTerm) || 
                country.code.toLowerCase().includes(searchTerm)
            );
            populateCountryGrid(filteredCountries);
        });

        // Ouvrir le modal pour sélectionner la ville
        document.getElementById('city').addEventListener('click', function() {
            if (!formData.country) {
                showNotification('Veuillez d\'abord sélectionner un pays', 'error');
                return;
            }
            loadCities(formData.country.toLowerCase());
            document.getElementById('city-modal').classList.remove('hidden');
            document.body.classList.add('modal-active');
        });

        // Fermer le modal ville
        document.getElementById('close-city-modal').addEventListener('click', function() {
            document.getElementById('city-modal').classList.add('hidden');
            document.body.classList.remove('modal-active');
        });

        // Recherche dans la liste des villes
        document.getElementById('city-search').addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const cityList = document.getElementById('city-list');
            const cities = citiesData[formData.country.toLowerCase()] || [];
            
            cityList.innerHTML = '';
            
            const filteredCities = cities.filter(city => 
                city.name.toLowerCase().includes(searchTerm) || 
                city.postalCode.includes(searchTerm)
            );
            
            if (filteredCities.length === 0) {
                cityList.innerHTML = '<div class="p-4 text-center text-gray-500">Aucune ville trouvée</div>';
                return;
            }
            
            filteredCities.forEach(city => {
                const div = document.createElement('div');
                div.className = 'p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 city-item';
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

        // Ouvrir le modal pour sélectionner la rue
        document.getElementById('street').addEventListener('click', function() {
            if (!formData.city) {
                showNotification('Veuillez d\'abord sélectionner une ville', 'error');
                return;
            }
            loadStreets(formData.city);
            document.getElementById('street-modal').classList.remove('hidden');
            document.body.classList.add('modal-active');
        });

        // Fermer le modal rue
        document.getElementById('close-street-modal').addEventListener('click', function() {
            document.getElementById('street-modal').classList.add('hidden');
            document.body.classList.remove('modal-active');
        });

        // Recherche dans la liste des rues
        document.getElementById('street-search').addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const streetList = document.getElementById('street-list');
            const streets = streetsData[formData.city] || [];
            
            streetList.innerHTML = '';
            
            const filteredStreets = streets.filter(street => 
                street.name.toLowerCase().includes(searchTerm)
            );
            
            if (filteredStreets.length === 0) {
                streetList.innerHTML = '<div class="p-4 text-center text-gray-500">Aucune rue trouvée</div>';
                return;
            }
            
            filteredStreets.forEach(street => {
                const div = document.createElement('div');
                div.className = 'p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 street-item';
                div.dataset.id = street.id;
                div.dataset.name = street.name;
                div.innerHTML = `
                    <div class="font-medium">${street.name}</div>
                `;
                div.addEventListener('click', () => selectStreet(street.id, street.name));
                streetList.appendChild(div);
            });
        });

        // Navigation entre les étapes
        document.querySelectorAll('.next-step').forEach(button => {
            button.addEventListener('click', function() {
                const currentStep = this.closest('.step');
                const nextStepId = this.dataset.next;
                const nextStep = document.getElementById(`step-${nextStepId}`);
                
                if (validateStep(currentStep.id)) {
                    // Mettre à jour les indicateurs d'étape
                    updateStepIndicators(parseInt(nextStepId));
                    
                    // Animation de transition entre les étapes
                    currentStep.classList.add('hidden');
                    nextStep.classList.remove('hidden');
                    
                    // Mettre à jour le résumé
                    updateSummary();
                    
                    // Scroll to top of form
                    nextStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
        
        document.querySelectorAll('.prev-step').forEach(button => {
            button.addEventListener('click', function() {
                const currentStep = this.closest('.step');
                const prevStepId = this.dataset.prev;
                const prevStep = document.getElementById(`step-${prevStepId}`);
                
                // Mettre à jour les indicateurs d'étape
                updateStepIndicators(parseInt(prevStepId));
                
                // Animation de transition entre les étapes
                currentStep.classList.add('hidden');
                prevStep.classList.remove('hidden');
                
                // Scroll to top of form
                prevStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
        
        // Fonctionnalité pour afficher/masquer les mots de passe
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                const icon = this.querySelector('i');
                
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
        
        // Vérification de la force du mot de passe
        document.getElementById('password').addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
        
        // Soumission du formulaire
        document.getElementById('signup-form').addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateStep('step-4')) {
                // Afficher l'animation de chargement
                const submitButton = document.getElementById('submit-button');
                const originalContent = submitButton.innerHTML;
                submitButton.innerHTML = '<span class="loading-spinner"></span> Traitement...';
                submitButton.disabled = true;
                
                // Simuler l'envoi des données
                setTimeout(() => {
                    showNotification('Inscription réussie! Bienvenue chez L&L Ouest Services.', 'success');
                    submitButton.innerHTML = originalContent;
                    submitButton.disabled = false;
                    
                    resetForm();
                }, 2000);
            }
        });
        
        // Écouter les changements sur les champs pour mettre à jour formData
        document.getElementById('name').addEventListener('input', function() {
            formData.name = this.value;
            updateSummary();
        });
        
        document.getElementById('email').addEventListener('input', function() {
            formData.email = this.value;
            updateSummary();
        });
        
        document.getElementById('phone').addEventListener('input', function() {
            formData.phone = this.value;
            updateSummary();
        });
        
        document.getElementById('postalCode').addEventListener('input', function() {
            formData.postalCode = this.value;
            updateSummary();
        });
    });
    
    // Fonction pour peupler le grid des pays
    function populateCountryGrid(countries) {
        const grid = document.getElementById('country-grid');
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
    
    // Sélectionner un pays
    function selectCountry(code, display, dialCode) {
        formData.country = code;
        formData.dialCode = dialCode;
        
        document.getElementById('country').value = display;
        document.getElementById('dialCode').value = dialCode;
        document.getElementById('country-modal').classList.add('hidden');
        document.body.classList.remove('modal-active');
        
        // Réinitialiser les sélecteurs de ville et rue
        formData.city = "";
        formData.street = "";
        formData.postalCode = "";
        
        document.getElementById('city').value = "Sélectionnez une ville";
        document.getElementById('street').value = "Sélectionnez une rue";
        document.getElementById('postalCode').value = "";
        
        // Charger les villes pour le pays sélectionné
        loadCities(code.toLowerCase());
        
        // Mettre à jour le résumé
        updateSummary();
        
        // Repeupler la grille pour mettre en évidence le pays sélectionné
        populateCountryGrid(countriesData);
    }
    
    // Charger les villes pour un pays
    function loadCities(countryCode) {
        // Vérifier si les villes sont déjà en cache
        if (citiesData[countryCode]) {
            displayCities(citiesData[countryCode], countryCode);
            return;
        }
        
        // Charger depuis le fichier JSON
        fetch(`/assets/json/${countryCode}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur de chargement des villes');
                }
                return response.json();
            })
            .then(cities => {
                // Mettre en cache les données
                citiesData[countryCode] = cities;
                displayCities(cities, countryCode);
            })
            .catch(error => {
                console.error('Erreur lors du chargement des villes:', error);
                // Charger des données de secours
                loadFallbackCities(countryCode);
            });
    }
    
    // Afficher les villes dans le modal
    function displayCities(cities, countryCode) {
        const cityList = document.getElementById('city-list');
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
    
    // Sélectionner une ville
    function selectCity(id, name, postalCode) {
        formData.city = id;
        formData.postalCode = postalCode;
        
        document.getElementById('city').value = name;
        document.getElementById('postalCode').value = postalCode;
        document.getElementById('city-modal').classList.add('hidden');
        document.body.classList.remove('modal-active');
        
        // Réinitialiser le sélecteur de rue
        formData.street = "";
        document.getElementById('street').value = "Sélectionnez une rue";
        
        // Charger les rues pour la ville sélectionnée
        loadStreets(id);
        
        // Mettre à jour le résumé
        updateSummary();
    }
    
    // Charger les rues pour une ville
    function loadStreets(cityId) {
        // Vérifier si les rues sont déjà en cache
        if (streetsData[cityId]) {
            displayStreets(streetsData[cityId]);
            return;
        }
        
        // Déterminer le code pays à partir des données du formulaire
        const countryCode = formData.country.toLowerCase();
        
        // Charger depuis le fichier JSON
        fetch(`/assets/json/${cityId}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur de chargement des rues');
                }
                return response.json();
            })
            .then(streets => {
                // Mettre en cache les données
                streetsData[cityId] = streets;
                displayStreets(streets);
            })
            .catch(error => {
                console.error('Erreur lors du chargement des rues:', error);
                // Charger des données de secours
                loadFallbackStreets(cityId);
            });
    }
    
    // Afficher les rues dans le modal
    function displayStreets(streets) {
        const streetList = document.getElementById('street-list');
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
            div.innerHTML = `
                <div class="font-medium">${street.name}</div>
            `;
            div.addEventListener('click', () => selectStreet(street.id, street.name));
            streetList.appendChild(div);
        });
    }
    
    // Sélectionner une rue
    function selectStreet(id, name) {
        formData.street = id;
        
        document.getElementById('street').value = name;
        document.getElementById('street-modal').classList.add('hidden');
        document.body.classList.remove('modal-active');
        
        // Mettre à jour le résumé
        updateSummary();
    }
    
    // Mettre à jour les indicateurs d'étape
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
    
    // Valider une étape du formulaire
    function validateStep(stepId) {
        let isValid = true;
        
        if (stepId === 'step-1') {
            const name = document.getElementById('name');
            const email = document.getElementById('email');
            
            if (!name.value.trim()) {
                showError(name, 'Le nom est requis');
                isValid = false;
            } else {
                clearError(name);
                formData.name = name.value.trim();
            }
            
            const emailValue = email.value.trim();
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
            const phoneValue = phone.value.trim();
            
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
            if (!postalCode.value.trim()) {
                showError(postalCode, 'Le code postal est requis');
                isValid = false;
            } else {
                clearError(postalCode);
                formData.postalCode = postalCode.value.trim();
            }
        } else if (stepId === 'step-4') {
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirmPassword');
            
            if (!password.value) {
                showError(password, 'Le mot de passe est requis');
                isValid = false;
            } else if (password.value.length < 8) {
                showError(password, 'Le mot de passe doit contenir au moins 8 caractères');
                isValid = false;
            } else {
                clearError(password);
                formData.password = password.value;
            }
            
            if (!confirmPassword.value) {
                showError(confirmPassword, 'Veuillez confirmer votre mot de passe');
                isValid = false;
            } else if (confirmPassword.value !== password.value) {
                showError(confirmPassword, 'Les mots de passe ne correspondent pas');
                isValid = false;
            } else {
                clearError(confirmPassword);
                formData.confirmPassword = confirmPassword.value;
            }
        }
        
        return isValid;
    }
    
    // Valider la confirmation du mot de passe
    function validateConfirmPassword() {
        const confirmPassword = document.getElementById('confirmPassword');
        const password = document.getElementById('password');
        
        if (!confirmPassword.value) {
            showError(confirmPassword, 'Veuillez confirmer votre mot de passe');
        } else if (confirmPassword.value !== password.value) {
            showError(confirmPassword, 'Les mots de passe ne correspondent pas');
        } else {
            clearError(confirmPassword);
        }
    }
    
    // Afficher une erreur de champ
    function showError(field, message) {
        const errorElement = field.parentElement.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.textContent = message;
        }
        field.classList.add('border-red-500');
    }
    
    // Effacer l'erreur d'un champ
    function clearError(field) {
        const errorElement = field.parentElement.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.textContent = '';
        }
        field.classList.remove('border-red-500');
    }
    
    // Vérifier si l'email est valide
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Vérifier si le numéro de téléphone est valide
    function isValidPhone(phone) {
        const re = /^[0-9+\s()-]{10,}$/;
        return re.test(phone);
    }
    
    // Vérifier la force du mot de passe
    function checkPasswordStrength(password) {
        const strengthElement = document.getElementById('password-strength');
        let strength = 0;
        let message = '';
        let color = '';
        
        if (password.length === 0) {
            strengthElement.textContent = '';
            return;
        }
        
        // Vérifier la longueur
        if (password.length > 7) strength++;
        
        // Vérifier la présence de minuscules et majuscules
        if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) strength++;
        
        // Vérifier la présence de chiffres
        if (password.match(/([0-9])/)) strength++;
        
        // Vérifier la présence de caractères spéciaux
        if (password.match(/([!,@,#,$,%,^,&,*,?,_,~])/)) strength++;
        
        switch(strength) {
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
    
    // Mettre à jour le résumé des informations
    function updateSummary() {
        document.getElementById('summary-name').textContent = formData.name || 'Non renseigné';
        document.getElementById('summary-email').textContent = formData.email || 'Non renseigné';
        
        const phoneText = formData.phone ? `${formData.dialCode} ${formData.phone}` : 'Non renseigné';
        document.getElementById('summary-phone').textContent = phoneText;
        
        const selectedCountry = countriesData.find(country => country.code === formData.country);
        const countryText = selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'Non renseigné';
        document.getElementById('summary-country').textContent = countryText;
        
        const cityElement = document.getElementById('city');
        const streetElement = document.getElementById('street');
        const postalCodeElement = document.getElementById('postalCode');
        
        let addressText = 'Non renseigné';
        if (formData.city && formData.street && formData.postalCode) {
            addressText = `${streetElement.value}, ${postalCodeElement.value} ${cityElement.value}`;
        } else if (formData.city && formData.postalCode) {
            addressText = `${postalCodeElement.value} ${cityElement.value}`;
        }
        
        document.getElementById('summary-address').textContent = addressText;
    }
    
    // Afficher une notification
    function showNotification(message, type = 'info') {
        // Créer l'élément de notification
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
        
        // Ajouter à la page
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.classList.add('translate-x-0');
        }, 10);
        
        // Supprimer après 5 secondes
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
    
    // Réinitialiser le formulaire
    function resetForm() {
        formData = {
            name: "",
            email: "",
            country: "FR",
            dialCode: "+33",
            phone: "",
            city: "",
            street: "",
            postalCode: "",
            password: "",
            confirmPassword: ""
        };
        
        // Réinitialiser les champs
        document.getElementById('name').value = "";
        document.getElementById('email').value = "";
        document.getElementById('phone').value = "";
        document.getElementById('postalCode').value = "";
        document.getElementById('password').value = "";
        document.getElementById('confirmPassword').value = "";
        
        // Réinitialiser les sélecteurs avec valeurs par défaut
        const france = countriesData.find(country => country.code === 'FR');
        if (france) {
            selectCountry(france.code, `${france.flag} ${france.name}`, france.dial_code);
        }
        document.getElementById('city').value = "Sélectionnez une ville";
        document.getElementById('street').value = "Sélectionnez une rue";
        
        // Revenir à la première étape
        document.querySelectorAll('.step').forEach(step => {
            step.classList.add('hidden');
        });
        document.getElementById('step-1').classList.remove('hidden');
        
        // Réinitialiser les indicateurs d'étape
        updateStepIndicators(1);
        
        // Mettre à jour le résumé
        updateSummary();
        
        // Réinitialiser les erreurs
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        document.querySelectorAll('input').forEach(input => input.classList.remove('border-red-500'));
    }
    
    // Données de secours pour les pays
    function loadFallbackCountries() {
        const fallbackCountries = [
            { name: "France", flag: "🇫🇷", code: "FR", dial_code: "+33" },
            { name: "Belgique", flag: "🇧🇪", code: "BE", dial_code: "+32" },
            { name: "Suisse", flag: "🇨🇭", code: "CH", dial_code: "+41" }
        ];
        
        countriesData = fallbackCountries;
        populateCountryGrid(fallbackCountries);
        
        // Définir la France par défaut
        const france = fallbackCountries.find(country => country.code === 'FR');
        if (france) {
            selectCountry(france.code, `${france.flag} ${france.name}`, france.dial_code);
        }
    }
    
    // Données de secours pour les villes
    function loadFallbackCities(countryCode) {
        const fallbackCities = {
            fr: [
                { id: "angers", name: "Angers", postalCode: "49000" },
                { id: "nantes", name: "Nantes", postalCode: "44000" },
                { id: "rennes", name: "Rennes", postalCode: "35000" }
            ],
            be: [
                { id: "bruxelles", name: "Bruxelles", postalCode: "1000" },
                { id: "liege", name: "Liège", postalCode: "4000" }
            ],
            ch: [
                { id: "geneve", name: "Genève", postalCode: "1200" },
                { id: "zurich", name: "Zurich", postalCode: "8000" }
            ]
        };
        
        const cities = fallbackCities[countryCode] || [];
        citiesData[countryCode] = cities;
        displayCities(cities, countryCode);
    }
    
    // Données de secours pour les rues
    function loadFallbackStreets(cityId) {
        const fallbackStreets = {
            angers: [
                { id: "rue-bressigny", name: "Rue Bressigny" },
                { id: "bd-ayrault", name: "Boulevard Ayrault" }
            ],
            nantes: [
                { id: "rue-crete", name: "Rue de la Crée" },
                { id: "bd-graslin", name: "Boulevard Graslin" }
            ],
            rennes: [
                { id: "rue-de-paris", name: "Rue de Paris" },
                { id: "rue-de-brest", name: "Rue de Brest" }
            ]
        };
        
        const streets = fallbackStreets[cityId] || [];
        streetsData[cityId] = streets;
        displayStreets(streets);
    }