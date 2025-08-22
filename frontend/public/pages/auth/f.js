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