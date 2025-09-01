/**
 * @file auth-check.js
 * @description Script de vérification d'authentification chargé en premier pour rediriger avant le chargement complet de la page.
 * Vérifie si l'utilisateur est connecté via un jeton stocké et si un code de vérification est requis pour certaines pages.
 */

(function () {
  const token = localStorage.getItem('jwt');
  const role = localStorage.getItem('userRole');
  const codeCheckType = localStorage.getItem('codeCheckType');
  const codeCheckEmail = localStorage.getItem('codeCheckEmail');
  const page = window.location.pathname.split('/').pop().replace('.html', '');

  const publicPages = [
    'signin',
    'signup',
    'verify-email',
    'password-reset',
    'change-email',
    'code-check',
    'about',
    'contact',
    'mentions',
    'realizations',
    'services',
    'reviews',
    'reviews-user',
    'index',
    '',
  ];

  const protectedPages = ['dashboard', 'user', 'admin', 'chat', 'doc', 'notifications'];

  const isAuthenticated = !!token && !!role;

  // Redirection pour les pages protégées si non authentifié
  if (protectedPages.includes(page) && !isAuthenticated) {
    window.location.replace('/pages/auth/signin.html');
    return;
  }

  // Redirection pour les pages d'authentification si authentifié
  if (
    ['signin', 'signup', 'verify-email', 'password-reset', 'change-email'].includes(page) &&
    isAuthenticated
  ) {
    window.location.replace('/dashboard.html');
    return;
  }
  
})();
