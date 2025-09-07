/**
 * @file theme.js
 * @description Gère le basculement entre les thèmes clair et sombre,
 * et sauvegarde la préférence de l'utilisateur dans le localStorage.
 * @module theme
 */

class ThemeManager {
  /**
   * Crée une instance de ThemeManager.
   */
  constructor() {
    this.html = document.documentElement;
    this.themeToggles = [
      document.getElementById('theme-toggle'),
      document.getElementById('theme-toggle-header'),
      document.getElementById('toggle-theme')
    ].filter(Boolean);

    this.initTheme();
    this.setupListeners();
  }

  /**
   * Initialise le thème de l'application au chargement de la page.
   * Priorise le localStorage, puis les préférences du système.
   */
  initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const themeToApply = savedTheme !== null ? savedTheme : (systemPrefersDark ? 'dark' : 'light');
    this.applyTheme(themeToApply, false, true);
  }

  /**
   * Configure les écouteurs d'événements pour le basculement du thème.
   */
  setupListeners() {
    this.themeToggles.forEach(toggle => {
      toggle?.addEventListener('click', () => this.toggleTheme());
    });

    window.addEventListener('storage', (e) => {
      if (e.key === 'theme') {
        this.applyTheme(e.newValue || 'light', false);
      }
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.applyTheme(e.matches ? 'dark' : 'light', false);
      }
    });
  }

  /**
   * Bascule le thème actuel (sombre vers clair ou vice versa).
   */
  toggleTheme() {
    const newTheme = this.html.classList.contains('dark') ? 'light' : 'dark';
    this.applyTheme(newTheme, true);
  }

  /**
   * Applique un thème spécifique à l'élément HTML racine.
   * @param {string} theme - 'dark' ou 'light'.
   * @param {boolean} saveToStorage - Indique s'il faut sauvegarder le thème dans le localStorage.
   * @param {boolean} isInitial - Indique si c'est l'initialisation pour désactiver la transition.
   */
  applyTheme(theme, saveToStorage = true, isInitial = false) {
    if (!isInitial) {
      this.html.classList.add('theme-transition-disabled');
    }

    if (theme === 'dark') {
      this.html.classList.add('dark');
    } else {
      this.html.classList.remove('dark');
    }

    if (saveToStorage) {
      localStorage.setItem('theme', theme);
    }

    this.updateToggleIcons();

    if (!isInitial) {
      setTimeout(() => {
        this.html.classList.remove('theme-transition-disabled');
      }, 50);
    }
  }

  /**
   * Met à jour les icônes des boutons de basculement du thème.
   */
  updateToggleIcons() {
    const isDark = this.html.classList.contains('dark');
    this.themeToggles.forEach(toggle => {
      if (!toggle) return;
      const icon = toggle.querySelector('i, svg');
      if (!icon) return;

      if (icon.tagName.toLowerCase() === 'svg') {
        const path = icon.querySelector('path') || document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('d', isDark
          ? 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
          : 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
        );
        if (!icon.contains(path)) {
          icon.appendChild(path);
        }
      } else if (icon.classList.contains('fa')) {
        icon.classList.toggle('fa-sun', !isDark);
        icon.classList.toggle('fa-moon', isDark);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => new ThemeManager());
