/**
 * @file auth-check.js
 * @description Script de vérification d'authentification chargé en premier pour rediriger avant le chargement complet de la page.
 * Vérifie si l'utilisateur est connecté via token stocké et redirige en conséquence.
 */

(function () {
  const token = localStorage.getItem('jwt');
  const role = localStorage.getItem('userRole');
  const page = window.location.pathname.split('/').pop().replace('.html', '');

  const publicPages = [
    'signin', 'signup', 'verify-email', 'password-reset', 'change-email',
    'about', 'contact', 'mentions', 'realizations', 'services', 'reviews', 'reviews-user',
    'index', '' 
  ];
  
  const protectedPages = [
    'dashboard', 'user', 'admin', 'chat', 'doc', 'notifications'
  ];
  
  const isAuthenticated = !!token && !!role;

  // Redirection pour les pages protégées si non authentifié
  if (protectedPages.includes(page) && !isAuthenticated) {
    window.location.replace('/pages/auth/signin.html');
    return;
  }
  
  if (['signin', 'signup', 'verify-email', 'password-reset', 'change-email'].includes(page) && isAuthenticated) {
    window.location.replace('/dashboard.html');
    return;
  }
})();
