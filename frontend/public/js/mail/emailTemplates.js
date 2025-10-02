/**
 * @file emailTemplates.js
 * @description Templates HTML pour les emails de L&L Ouest Services.
 * Design ultra-professionnel et responsive avec palette de couleurs (#3582AE bleu primaire, #23953D vert accent).
 * Mise en page mobile-first, boutons toujours en colonne, données dans des div similaires aux sujets, labels au-dessus.
 * @module emailTemplates
 * @version 2.8.0
 * @author L&L Ouest Services Team
 * @lastUpdated 2025-09-30
 * @license MIT
 * @dependencies FontAwesome, Open Sans, Cinzel
 * @changelog
 * - v2.8.0: Suppression labels info perso et sujets, boutons inline-block en colonne, message pardon étendu
 * - v2.7.0: Boutons toujours en colonne, données dans des div comme les sujets, labels au-dessus des valeurs
 * - v2.6.0: Boutons en colonne sur mobile, ligne sur desktop. Labels optimisés sans italique. Footer simplifié.
 * - v2.5.0: Design mobile-first, labels optimisés
 */

const colors = {
  white: '#FFFFFF',
  light: '#F8F9FA',
  dark: '#212529',
  primary: '#3582AE',
  accent: '#23953D',
  secondary: '#6C757D',
  border: '#DEE2E6',
  background: '#F5F7F9'
};

const company = {
  name: 'L&L Ouest Services',
  logo: 'https://i.ibb.co/WW2NGrFM/logo.jpg',
  website: 'https://llouestservices.fr',
  phone: '+33 7 56 98 45 12',
  email: 'contact@llouestservices.com',
  address: 'France'
};

const currentYear = new Date().getFullYear();

// Validation de la date pour éviter "Invalid Date"
const getFormattedDate = (createdAt) => {
  const date = new Date(createdAt || Date.now());
  if (isNaN(date.getTime())) {
    return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) +
           ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) +
         ' à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// Styles communs optimisés
const commonStyles = `
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Open Sans', Arial, sans-serif;
      background-color: ${colors.background};
      margin: 0;
      padding: 10px;
      color: ${colors.dark};
      font-size: 14px;
      line-height: 1.6;
      -webkit-text-size-adjust: 100%;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${colors.white};
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    
    .email-header {
      background: linear-gradient(135deg, ${colors.primary}, #2a6a94);
      padding: 25px 20px;
      text-align: center;
      color: ${colors.white};
    }
    
    .logo-container {
      width: 120px;
      height: 120px;
      margin: 0 auto 15px;
      background: ${colors.white};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    
    .logo {
      width: 100%;
      max-width: 120px;
      height: auto;
      border-radius: 50%;
      object-fit: cover;
    }
    
    .header-title {
      font-family: 'Cinzel', serif;
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 6px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .header-subtitle {
      font-size: 15px;
      opacity: 0.9;
      font-weight: 400;
    }
    
    .email-date {
      background-color: rgba(255, 255, 255, 0.1);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      margin-top: 12px;
      display: inline-block;
    }
    
    .email-content {
      padding: 30px 25px;
    }
    
    .salutation {
      font-size: 16px;
      color: ${colors.dark};
      margin-bottom: 20px;
      font-weight: 600;
    }
    
    .message-section {
      margin-bottom: 25px;
    }
    
    .message-section p {
      margin-bottom: 12px;
      color: ${colors.secondary};
    }
    
    .code-section {
      background: ${colors.light};
      border: 2px dashed ${colors.accent};
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    
    .code-label {
      font-size: 14px;
      color: ${colors.secondary};
      margin-bottom: 8px;
      display: block;
    }
    
    .code {
      font-size: 26px;
      font-weight: 700;
      color: ${colors.primary};
      letter-spacing: 2px;
      margin: 12px 0;
      font-family: 'Courier New', monospace;
    }
    
    .info-section {
      background: ${colors.light};
      border: 1px solid ${colors.border};
      border-radius: 8px;
      padding: 18px;
      margin-bottom: 18px;
    }
    
    .info-section-title {
      font-family: 'Cinzel', serif;
      font-size: 15px;
      color: ${colors.primary};
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid ${colors.primary};
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }
    
    .info-item {
      padding: 10px 12px;
      border: 1px solid ${colors.border};
      border-radius: 6px;
      background-color: ${colors.white};
      transition: all 0.2s ease;
    }
    
    .info-item:hover {
      border-color: ${colors.primary};
      background-color: rgba(53, 130, 174, 0.05);
    }
    
    .info-value {
      font-size: 14px;
      color: ${colors.dark};
      font-weight: 500;
    }
    
    .subjects-list {
      list-style-type: none;
      padding: 0;
      margin: 0;
    }
    
    .subjects-list li {
      padding: 10px 12px;
      border: 1px solid ${colors.border};
      border-radius: 6px;
      margin-bottom: 8px;
      background-color: ${colors.white};
      display: flex;
      align-items: center;
      transition: all 0.2s ease;
    }
    
    .subjects-list li:hover {
      border-color: ${colors.primary};
      background-color: rgba(53, 130, 174, 0.05);
    }
    
    .subjects-list li:before {
      content: "•";
      color: ${colors.accent};
      font-weight: bold;
      margin-right: 8px;
      font-size: 16px;
    }
    
    .action-buttons {
      margin: 20px 0;
    }
    
    .outline-button {
      display: inline-block;
      width: 100%;
      background: transparent;
      color: ${colors.primary};
      border: 2px solid ${colors.primary};
      padding: 12px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
      text-align: center;
      backdrop-filter: blur(10px);
      cursor: pointer;
      margin-bottom: 12px;
    }
    
    .outline-button:last-child {
      margin-bottom: 0;
    }
    
    .outline-button:hover {
      background: rgba(53, 130, 174, 0.1);
      backdrop-filter: blur(20px);
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(53, 130, 174, 0.2);
    }
    
    .outline-button.accent {
      color: ${colors.accent};
      border-color: ${colors.accent};
    }
    
    .outline-button.accent:hover {
      background: rgba(35, 149, 61, 0.1);
      box-shadow: 0 4px 15px rgba(35, 149, 61, 0.2);
    }
    
    .outline-button.secondary {
      color: ${colors.secondary};
      border-color: ${colors.secondary};
    }
    
    .outline-button.secondary:hover {
      background: rgba(108, 117, 125, 0.1);
      box-shadow: 0 4px 15px rgba(108, 117, 125, 0.2);
    }
    
    .message-box {
      padding: 15px;
      border: 1px solid ${colors.border};
      border-radius: 6px;
      background-color: ${colors.light};
      margin: 12px 0;
      line-height: 1.5;
    }
    
    .message-box-title {
      font-family: 'Cinzel', serif;
      font-size: 14px;
      color: ${colors.primary};
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, ${colors.border}, transparent);
      margin: 25px 0;
    }
    
    .email-footer {
      background: linear-gradient(135deg, ${colors.primary}, #2a6a94);
      color: ${colors.white};
      padding: 25px 20px;
      text-align: center;
    }
    
    .footer-content {
      max-width: 500px;
      margin: 0 auto;
    }
    
    .company-info {
      margin-bottom: 15px;
    }
    
    .company-name {
      font-size: 17px;
      font-weight: 600;
      margin-bottom: 6px;
      color: ${colors.white};
    }
    
    .contact-info {
      font-size: 12px;
      margin-bottom: 15px;
      opacity: 0.9;
      line-height: 1.5;
    }
    
    .contact-info a {
      color: ${colors.white};
      text-decoration: none;
    }
    
    .copyright {
      font-size: 11px;
      opacity: 0.7;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    @media (min-width: 600px) {
      body {
        padding: 20px 0;
      }
      
      .email-content {
        padding: 40px;
      }
      
      .email-header {
        padding: 30px;
      }
      
      .header-title {
        font-size: 24px;
      }
      
      .logo-container {
        width: 150px;
        height: 150px;
        margin-bottom: 20px;
      }
      
      .logo {
        max-width: 150px;
      }
    }
    
    @media (max-width: 374px) {
      .email-content {
        padding: 20px 15px;
      }
      
      .email-header {
        padding: 20px 15px;
      }
      
      .header-title {
        font-size: 20px;
      }
      
      .code {
        font-size: 22px;
        letter-spacing: 1px;
      }
    }
  </style>
`;

const apologyText = `
    <p class="salutation">Stakyra,</p>
          
    <div class="message-section" style="text-align: left;">
      <p>Je voulais prendre un moment pour te dire, sans détour, à quel point je suis <strong>sincèrement désolé</strong> pour la douleur que je t'ai causée. Je comprends parfaitement ta colère et les doutes que tu as sur notre relation et notre avenir.</p>

      <p>Je n'ai aucune excuse pour mes actions. Mon erreur a été de ne pas réaliser à quel point mes paroles et mes actes pouvaient te blesser, et je mesure maintenant la gravité des conséquences. Je ne peux que t'offrir ma plus profonde reconnaissance du mal que j'ai fait.</p>
    </div>
          
    <div class="info-section" style="margin-top: 30px; border-left: 4px solid ${colors.accent || '#4F46E5'}; padding-left: 15px;">
      <div class="info-section-title" style="color: ${colors.accent || '#4F46E5'}; font-weight: 700; margin-bottom: 10px;">
        <i class="fas fa-heart"></i> Ce que tu dois savoir
      </div>
      <p>Même si je respecte la distance que tu prends, il est essentiel que tu saches ceci : <strong>tu es incroyablement importante pour moi.</strong> La place que tu as dans ma vie est unique et irremplaçable. Peu importe ce qui se passera, mon respect et mon affection pour toi restent entiers.</p>
    </div>
          
    <div class="message-section" style="text-align: left; margin-top: 30px;">
      <p>Je sais que tu as besoin de temps, et je n'essaierai pas de te forcer à changer d'avis. Mon seul objectif est de <strong>regagner ta confiance</strong>, étape par étape, si tu décides un jour de me laisser cette chance.</p>

     <p>Je respecte le temps et l’espace dont tu as besoin, mais il est essentiel pour moi que tu saches à quel point <strong>tu es irremplaçable</strong> dans ma vie. Ce que nous partagions il y a une semaine me manque terriblement, et je donnerais tout pour retrouver cette harmonie, ces rires, cette tendresse et cette confiance qui rendaient notre quotidien si beau.</p>
 </div>


 <div class="message-section" style="text-align: left; margin-top: 30px;">
    <p>Je sais que rien ne se répare en un claquement de doigts, et je ne veux pas te forcer à quoi que ce soit. Mais mon plus grand souhait est de <strong>regagner ta confiance</strong>, pas à pas, et de retrouver ce que nous étions il y a quelques jours à peine. J’espère de tout cœur que tu me laisseras la chance de reconstruire ce lien si précieux.</p>

    <p>Je te laisse le temps de réfléchir, sans pression. Sache simplement que je suis là, prêt à faire tout ce qu’il faut pour que tout redevienne comme avant, pour que l’on retrouve cette complicité et cette paix qui me manquent tant.</p>
  </div>

    <div class="message-section" style="text-align: left; margin-top: 30px; background: rgba(53, 130, 174, 0.05); padding: 20px; border-radius: 8px;">

      <p>Je sais que tu diras que je suis très doué pour t'écrire des messages d'amour sur des lettres ou des emails pour m'exprimer ou me faire pardonner...</p>
      
      <p>Mais c'est le seul moyen pour moi de toujours croire en nous, de croire en toi, et de croire en l'amour que je ressens pour toi. Ce n'est pas une tentative désespérée de regagner ton cœur à tout prix, mais simplement la manière dont mon cœur s'exprime naturellement.</p>
      
      <p>Je réalise à quel point la personne que je suis, de manière naturelle, peut parfois te causer du tort sans même m'en rendre compte. Mon enthousiasme, ma passion, mon amour inconditionnel... tout cela peut sembler écrasant parfois. Mais sache que chaque mot vient du plus profond de mon être.</p>
      
      <p>Ces messages ne sont pas une stratégie, mais le reflet de mon envie de réparer, de grandir, et de te prouver que je peux être l’homme que tu mérites, pour que tout redevienne comme avant, ou même encore mieux.</p>

    </div>
          

  




    
    <div class="divider" style="margin: 30px 0;"></div>
          
    <p style="text-align: center; font-style: italic;">Avec tout mon respect et mon affection,</p>
    <p style="text-align: center; font-weight: 600;">Steve</p>
  `;

const emailTemplates = {
  verification: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      ${commonStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="logo-container">
            <img src="${company.logo}" alt="${company.name}" class="logo">
          </div>
          <h1 class="header-title">Vérification de Votre Compte</h1>
          <p class="header-subtitle">Activez votre compte en toute sécurité</p>
          <div class="email-date">
            ${getFormattedDate(data.createdAt)}
          </div>
        </div>
        
        <div class="email-content">
          <p class="salutation">Cher(e) ${data.name || 'Client'},</p>
          
          <div class="message-section">
            <p>Nous vous remercions d'avoir choisi ${company.name}. Pour finaliser la création de votre compte, veuillez utiliser le code de vérification ci-dessous :</p>
          </div>
          
          <div class="code-section">
            <i class="fas fa-shield-alt fa-2x" style="color: ${colors.accent}; margin-bottom: 12px;"></i>
            <span class="code-label">Votre code de vérification</span>
            <div class="code">${data.code}</div>
            <a href="javascript:void(0)" class="outline-button" onclick="navigator.clipboard.writeText('${data.code}');alert('Code copié avec succès !');">
              <i class="fas fa-copy"></i> Copier le code
            </a>
          </div>
          
          <div class="info-section">
            <div class="info-section-title">
              <i class="fas fa-exclamation-circle"></i> Informations importantes
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-value">Validité : 10 minutes</span>
              </div>
              <div class="info-item">
                <span class="info-value">Utilisation : Page de vérification</span>
              </div>
              <div class="info-item">
                <span class="info-value">Support : ${company.phone}</span>
              </div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <p>Si vous n'avez pas initié cette demande, veuillez ignorer cet email ou contacter notre service client.</p>
          
          <div class="action-buttons">
            <a href="${company.website}/pages/auth/code-check.html" class="outline-button accent">
              <i class="fas fa-check-circle"></i> Vérifier mon compte
            </a>
            <a href="${company.website}/contact" class="outline-button secondary">
              <i class="fas fa-headset"></i> Contacter le support
            </a>
          </div>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `,

  passwordReset: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      ${commonStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="logo-container">
            <img src="${company.logo}" alt="${company.name}" class="logo">
          </div>
          <h1 class="header-title">Réinitialisation de Mot de Passe</h1>
          <p class="header-subtitle">Sécurisez votre accès</p>
          <div class="email-date">
            ${getFormattedDate(data.createdAt)}
          </div>
        </div>
        
        <div class="email-content">
          <p class="salutation">Cher(e) ${data.name || 'Client'},</p>
          
          <div class="message-section">
            <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte. Utilisez le code suivant pour créer un nouveau mot de passe :</p>
          </div>
          
          <div class="code-section">
            <i class="fas fa-lock fa-2x" style="color: ${colors.accent}; margin-bottom: 12px;"></i>
            <span class="code-label">Votre code de sécurité</span>
            <div class="code">${data.code}</div>
            <a href="javascript:void(0)" class="outline-button" onclick="navigator.clipboard.writeText('${data.code}');alert('Code copié avec succès !');">
              <i class="fas fa-copy"></i> Copier le code
            </a>
          </div>
          
          <div class="info-section">
            <div class="info-section-title">
              <i class="fas fa-shield-alt"></i> Sécurité
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-value">Validité : 10 minutes</span>
              </div>
              <div class="info-item">
                <span class="info-value">Confidentialité : Ne partagez pas ce code</span>
              </div>
              <div class="info-item">
                <span class="info-value">Support : ${company.phone}</span>
              </div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <p>Si vous n'êtes pas à l'origine de cette demande, contactez-nous immédiatement.</p>
          
          <div class="action-buttons">
            <a href="${company.website}/pages/auth/code-check.html" class="outline-button accent">
              <i class="fas fa-key"></i> Réinitialiser
            </a>
            <a href="tel:${company.phone}" class="outline-button secondary">
              <i class="fas fa-phone"></i> Appeler le support
            </a>
          </div>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `,

  contactClientConfirmation: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      ${commonStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="logo-container">
            <img src="${company.logo}" alt="${company.name}" class="logo">
          </div>
          <h1 class="header-title">Confirmation de Réception</h1>
          <p class="header-subtitle">Votre message a bien été reçu</p>
          <div class="email-date">
            ${getFormattedDate(data.createdAt)}
          </div>
        </div>
        
        <div class="email-content">
          <p class="salutation">Cher(e) ${data.name || 'Client'},</p>
          
          <div class="message-section">
            <p>Nous accusons réception de votre message et vous remercions pour votre intérêt. Notre équipe l'examinera et vous répondra dans les plus brefs délais.</p>
          </div>
          
          <div class="info-section">
            <div class="info-section-title">
              <i class="fas fa-user-circle"></i> Coordonnées
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-value">${data.name || 'Non spécifié'}</span>
              </div>
              <div class="info-item">
                <span class="info-value">${data.email || 'Non spécifié'}</span>
              </div>
              ${data.phone ? `
              <div class="info-item">
                <span class="info-value">${data.phone}</span>
              </div>
              ` : ''}
            </div>
          </div>
          
          ${data.subjects ? `
          <div class="info-section">
            <div class="info-section-title">
              <i class="fas fa-tags"></i> Sujets abordés
            </div>
            <div class="info-grid">
              ${data.subjects.split('-').map(subject => `
                <div class="info-item">
                  <span class="info-value">${subject.trim()}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          ${data.message ? `
          <div class="message-box">
            <div class="message-box-title">
              <i class="fas fa-comment-alt"></i> Votre Message
            </div>
            <p>${data.message}</p>
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <div class="action-buttons">
            <a href="${company.website}" class="outline-button">
              <i class="fas fa-globe"></i> Notre site
            </a>
            <a href="${company.website}/services" class="outline-button accent">
              <i class="fas fa-concierge-bell"></i> Nos services
            </a>
            <a href="tel:${company.phone}" class="outline-button secondary">
              <i class="fas fa-phone"></i> Nous appeler
            </a>
          </div>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `,

  apologyTemplate: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Cinzel:wght{400;700}&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      ${commonStyles}
      <style>
          .email-content p {
              line-height: 1.6;
          }
          .header-title {
              font-family: 'Cinzel', serif;
          }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="logo-container">
          <img src="https://i.ibb.co/jv4MszX3/img1.jpg" alt="img1"  class="logo">
          </div>
          <h1 class="header-title">Un Mot Sincère</h1>
          <p class="header-subtitle">J'suis desolé</p>
          <div class="email-date">
            ${getFormattedDate(new Date())}
          </div>
        </div>
        
        <div class="email-content">
          ${apologyText}
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `,

  contactAdminNotification: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      ${commonStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="logo-container">
            <img src="${company.logo}" alt="${company.name}" class="logo">
          </div>
          <h1 class="header-title">Nouveau Message de Contact</h1>
          <p class="header-subtitle">Action requise</p>
          <div class="email-date">
            ${getFormattedDate(data.createdAt)}
          </div>
        </div>
        
        <div class="email-content">
          <p class="salutation">Cher administrateur,</p>
          
          <div class="message-section">
            <p>Un nouveau message de contact a été reçu et nécessite votre attention.</p>
          </div>
          
          <div class="info-section">
            <div class="info-section-title">
              <i class="fas fa-user-tie"></i> Informations contact
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-value">${data.name || 'Non spécifié'}</span>
              </div>
              <div class="info-item">
                <span class="info-value">${data.email || 'Non spécifié'}</span>
              </div>
              ${data.phone ? `
              <div class="info-item">
                <span class="info-value">${data.phone}</span>
              </div>
              ` : ''}
              <div class="info-item">
                <span class="info-value">${getFormattedDate(data.createdAt)}</span>
              </div>
            </div>
          </div>
          
          ${data.subjects ? `
          <div class="info-section">
            <div class="info-section-title">
              <i class="fas fa-tags"></i> Sujets abordés
            </div>
            <div class="info-grid">
              ${data.subjects.split('-').map(subject => `
                <div class="info-item">
                  <span class="info-value">${subject.trim()}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          ${data.message ? `
          <div class="message-box">
            <div class="message-box-title">
              <i class="fas fa-envelope-open-text"></i> Message reçu
            </div>
            <p>${data.message}</p>
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <div class="action-buttons">
            <a href="mailto:${data.email}?subject=Re:%20${encodeURIComponent(data.subjects || 'Votre message')}" class="outline-button accent">
              <i class="fas fa-reply"></i> Répondre
            </a>
            <a href="${company.website}/admin/contacts/${data.id}" class="outline-button">
              <i class="fas fa-eye"></i> Voir dans l'admin
            </a>
            <a href="tel:${data.phone || company.phone}" class="outline-button secondary">
              <i class="fas fa-phone"></i> Appeler
            </a>
          </div>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `,

  emailChangeVerification: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      ${commonStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="logo-container">
            <img src="${company.logo}" alt="${company.name}" class="logo">
          </div>
          <h1 class="header-title">Changement d'Email</h1>
          <p class="header-subtitle">Confirmez votre nouvelle adresse</p>
          <div class="email-date">
            ${getFormattedDate(data.createdAt)}
          </div>
        </div>
        
        <div class="email-content">
          <p class="salutation">Cher(e) ${data.name || 'Client'},</p>
          
          <div class="message-section">
            <p>Vous avez demandé à modifier l'adresse email associée à votre compte. Pour confirmer cette modification, veuillez utiliser le code de vérification suivant :</p>
          </div>
          
          <div class="code-section">
            <i class="fas fa-envelope fa-2x" style="color: ${colors.accent}; margin-bottom: 12px;"></i>
            <span class="code-label">Code de vérification</span>
            <div class="code">${data.code}</div>
            <a href="javascript:void(0)" class="outline-button" onclick="navigator.clipboard.writeText('${data.code}');alert('Code copié avec succès !');">
              <i class="fas fa-copy"></i> Copier le code
            </a>
          </div>
          
          <div class="info-section">
            <div class="info-section-title">
              <i class="fas fa-info-circle"></i> Détails
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-value">${data.newEmail}</span>
              </div>
              <div class="info-item">
                <span class="info-value">Validité : 10 minutes</span>
              </div>
              <div class="info-item">
                <span class="info-value">Support : ${company.phone}</span>
              </div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <p>Si vous n'avez pas demandé ce changement, contactez immédiatement notre service client.</p>
          
          <div class="action-buttons">
            <a href="${company.website}/pages/auth/code-check.html" class="outline-button accent">
              <i class="fas fa-check-circle"></i> Confirmer
            </a>
            <a href="${company.website}/contact" class="outline-button secondary">
              <i class="fas fa-headset"></i> Support
            </a>
          </div>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `,

  emailLinkSignIn: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      ${commonStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="logo-container">
            <img src="${company.logo}" alt="${company.name}" class="logo">
          </div>
          <h1 class="header-title">Connexion à Votre Compte</h1>
          <p class="header-subtitle">Accédez rapidement à vos services</p>
          <div class="email-date">
            ${getFormattedDate(data.createdAt)}
          </div>
        </div>
        
        <div class="email-content">
          <p class="salutation">Cher(e) ${data.name || 'Client'},</p>
          
          <div class="message-section">
            <p>Cliquez sur le bouton ci-dessous pour vous connecter instantanément à votre compte ${company.name} :</p>
          </div>
          
          <div class="action-buttons">
            <a href="${data.link}" class="outline-button accent">
              <i class="fas fa-sign-in-alt"></i> Se connecter
            </a>
          </div>
          
          <div class="info-section">
            <div class="info-section-title">
              <i class="fas fa-shield-alt"></i> Sécurité
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-value">Lien unique - expire dans 15 min</span>
              </div>
              <div class="info-item">
                <span class="info-value">Ne partagez pas ce lien</span>
              </div>
              <div class="info-item">
                <span class="info-value">Support : ${company.phone}</span>
              </div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <p>Si vous n'avez pas demandé cette connexion, veuillez ignorer cet email.</p>
          
          <div class="action-buttons">
            <a href="${company.website}/contact" class="outline-button secondary">
              <i class="fas fa-headset"></i> Support
            </a>
          </div>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `,

  invoice: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      ${commonStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="logo-container">
            <img src="${company.logo}" alt="${company.name}" class="logo">
          </div>
          <h1 class="header-title">Facture N°${data.invoiceNumber}</h1>
          <p class="header-subtitle">Votre reçu de paiement</p>
          <div class="email-date">
            ${getFormattedDate(data.createdAt)}
          </div>
        </div>
        
        <div class="email-content">
          <p class="salutation">Cher(e) ${data.name || 'Client'},</p>
          
          <div class="message-section">
            <p>Nous vous remercions pour votre confiance. Voici le détail de votre facture :</p>
          </div>
          
          <div class="info-section">
            <div class="info-section-title">
              <i class="fas fa-file-invoice"></i> Détails facture
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-value">${data.invoiceNumber}</span>
              </div>
              <div class="info-item">
                <span class="info-value">${data.date}</span>
              </div>
              <div class="info-item">
                <span class="info-value" style="font-weight: 700; color: ${colors.primary}; font-size: 16px;">${data.amount} ${data.currency}</span>
              </div>
              ${data.dueDate ? `
              <div class="info-item">
                <span class="info-value">${data.dueDate}</span>
              </div>
              ` : ''}
              ${data.service ? `
              <div class="info-item">
                <span class="info-value">${data.service}</span>
              </div>
              ` : ''}
            </div>
          </div>
          
          <div class="divider"></div>
          
          <p>Pour consulter le détail complet de votre facture ou la télécharger :</p>
          
          <div class="action-buttons">
            <a href="${data.link || '#'}" class="outline-button accent">
              <i class="fas fa-eye"></i> Voir facture
            </a>
            <a href="${company.website}/contact" class="outline-button secondary">
              <i class="fas fa-headset"></i> Comptabilité
            </a>
          </div>
          
          <div class="info-section">
            <div class="info-section-title">
              <i class="fas fa-question-circle"></i> Assistance
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-value">${company.phone}</span>
              </div>
              <div class="info-item">
                <span class="info-value">${company.email}</span>
              </div>
            </div>
          </div>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `,

  contactReply: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      ${commonStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="logo-container">
            <img src="${company.logo}" alt="${company.name}" class="logo">
          </div>
          <h1 class="header-title">Réponse à Votre Message</h1>
          <p class="header-subtitle">Notre équipe vous répond</p>
          <div class="email-date">
            ${getFormattedDate(data.createdAt)}
          </div>
        </div>
        
        <div class="email-content">
          <p class="salutation">Cher(e) ${data.name || 'Client'},</p>
          
          <div class="message-section">
            <p>Nous vous remercions pour votre message concernant "${data.originalSubjects || 'votre demande'}". Voici notre réponse :</p>
          </div>
          
          <div class="message-box">
            <div class="message-box-title">
              <i class="fas fa-quote-left"></i> Votre message
            </div>
            <p>${data.originalMessage.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div class="message-box" style="border-color: ${colors.accent}; background: rgba(35, 149, 61, 0.05);">
            <div class="message-box-title" style="color: ${colors.accent};">
              <i class="fas fa-reply"></i> Notre réponse
            </div>
            <div style="line-height: 1.6;">
              ${data.reply.replace(/\n/g, '<br>')}
            </div>
            ${data.repliedByName ? `
            <div class="info-grid" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${colors.border};">
              <div class="info-item">
                <span class="info-value">${data.repliedByName}</span>
              </div>
              <div class="info-item">
                <span class="info-value">${company.name}</span>
              </div>
            </div>
            ` : ''}
          </div>
          
          <div class="info-section">
            <div class="info-section-title">
              <i class="fas fa-headset"></i> Assistance
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-value">${company.phone}</span>
              </div>
              <div class="info-item">
                <span class="info-value">${company.email}</span>
              </div>
              <div class="info-item">
                <span class="info-value">${company.website}</span>
              </div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="action-buttons">
            <a href="${company.website}/contact" class="outline-button accent">
              <i class="fas fa-envelope"></i> Nouveau message
            </a>
            <a href="${company.website}" class="outline-button">
              <i class="fas fa-globe"></i> Site web
            </a>
            <a href="tel:${company.phone}" class="outline-button secondary">
              <i class="fas fa-phone"></i> Nous appeler
            </a>
          </div>
        </div>
        
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `
};

function getEmailFooter() {
  return `
    <div class="email-footer">
      <div class="footer-content">
        <div class="company-info">
          <div class="company-name">${company.name}</div>
          <div class="contact-info">
            ${company.phone} • <a href="mailto:${company.email}">${company.email}</a><br>
            ${company.address}
          </div>
        </div>
        
        <div class="copyright">
          &copy; ${currentYear} ${company.name}. Tous droits réservés.
        </div>
      </div>
    </div>
  `;
}

export default emailTemplates;