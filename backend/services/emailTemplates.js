/**
 * @file emailTemplates.js
 * @description Templates HTML pour les emails de L&L Ouest Services.
 * Utilise une palette de couleurs professionnelle (bleu marine, gris élégant, accents dorés),
 * une mise en page responsive et épurée, inspirée d'une lettre formelle.
 * Police 'Merriweather' pour une élégance classique et lisible, avec taille réduite (14px pour le corps).
 * Le logo est intégré via base64 pour éviter les problèmes de liens (passé via {{logoBase64}}).
 * Tous les éléments sont alignés en ligne, ordonnés, avec un design harmonieux et professionnel.
 * @module emailTemplates
 */

const colors = {
  white: '#ffffff',
  light: '#f5f6f5',
  dark: '#002147', // Bleu marine profond
  primary: '#003087', // Bleu marine principal
  accent: '#d4a017', // Doré subtil pour accents
  secondary: '#2d3748', // Gris foncé pour texte
  border: '#e2e8f0', // Gris clair pour bordures
};

const emailTemplates = {
  verification: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Open Sans', Arial, sans-serif; background-color: ${colors.light}; margin: 0; padding: 0; color: ${colors.secondary}; font-size: 14px; line-height: 1.6; }
        .container { max-width: 600px; margin: 20px auto; background-color: ${colors.white}; border: 1px solid ${colors.border}; border-radius: 6px; overflow: hidden; }
        .header { padding: 20px; border-bottom: 2px solid ${colors.primary}; text-align: center; }
        .header img { width: 60px; height: 60px; margin-bottom: 10px; }
        .header h1 { font-family: 'Merriweather', serif; font-size: 18px; color: ${colors.primary}; margin: 0; font-weight: 700; }
        .content { padding: 20px; }
        .content p { margin: 10px 0; }
        .code { display: inline-block; background-color: ${colors.light}; padding: 10px 20px; border-radius: 4px; font-size: 18px; font-weight: 600; letter-spacing: 2px; margin: 10px 0; }
        .footer { border-top: 1px solid ${colors.border}; padding: 15px; text-align: center; font-size: 12px; color: ${colors.secondary}; }
        .footer a { color: ${colors.primary}; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        @media only screen and (max-width: 600px) {
          .container { margin: 10px; padding: 10px; }
          .content { padding: 15px; }
          .code { display: block; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="data:image/png;base64,${data.logoBase64}" alt="L&L Ouest Services Logo">
          <h1>Vérification de Votre Compte</h1>
        </div>
        <div class="content">
          <p>Cher(e) ${data.name || 'Utilisateur'},</p>
          <p>Merci de vous être inscrit(e) chez L&L Ouest Services. Pour activer votre compte, veuillez utiliser le code de vérification suivant :</p>
          <p class="code">${data.code}</p>
          <p>Ce code expire dans 10 minutes. Si vous n'avez pas initié cette inscription, veuillez ignorer cet email ou contacter notre support au +33 7 56 98 45 12.</p>
          <p>Cordialement,<br>L&L Ouest Services</p>
        </div>
        <div class="footer">
          <p>L&L Ouest Services &copy; ${new Date().getFullYear()} | Tous droits réservés<br>
             <a href="https://llouestservices.fr">https://llouestservices.fr</a> | Support : +33 7 56 98 45 12</p>
        </div>
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
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Open Sans', Arial, sans-serif; background-color: ${colors.light}; margin: 0; padding: 0; color: ${colors.secondary}; font-size: 14px; line-height: 1.6; }
        .container { max-width: 600px; margin: 20px auto; background-color: ${colors.white}; border: 1px solid ${colors.border}; border-radius: 6px; overflow: hidden; }
        .header { padding: 20px; border-bottom: 2px solid ${colors.primary}; text-align: center; }
        .header img { width: 60px; height: 60px; margin-bottom: 10px; }
        .header h1 { font-family: 'Merriweather', serif; font-size: 18px; color: ${colors.primary}; margin: 0; font-weight: 700; }
        .content { padding: 20px; }
        .content p { margin: 10px 0; }
        .button { display: inline-block; background-color: ${colors.primary}; color: ${colors.white}; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 10px 0; transition: background-color 0.3s; }
        .button:hover { background-color: ${colors.accent}; }
        .footer { border-top: 1px solid ${colors.border}; padding: 15px; text-align: center; font-size: 12px; color: ${colors.secondary}; }
        .footer a { color: ${colors.primary}; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        @media only screen and (max-width: 600px) {
          .container { margin: 10px; padding: 10px; }
          .content { padding: 15px; }
          .button { display: block; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="data:image/png;base64,${data.logoBase64}" alt="L&L Ouest Services Logo">
          <h1>Réinitialisation de Votre Mot de Passe</h1>
        </div>
        <div class="content">
          <p>Cher(e) ${data.name || 'Utilisateur'},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour procéder :</p>
          <p><a href="${data.link}" class="button">Réinitialiser mon mot de passe</a></p>
          <p>Si vous n'avez pas fait cette demande, veuillez ignorer cet email ou contacter notre support au ${data.supportPhone}.</p>
          <p>Cordialement,<br>${data.company}</p>
        </div>
        <div class="footer">
          <p>${data.company} &copy; ${data.currentYear} | Tous droits réservés<br>
             <a href="${data.website}">${data.website}</a> | Support : ${data.supportPhone}</p>
        </div>
      </div>
    </body>
    </html>
  `,

  changeEmail: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Open Sans', Arial, sans-serif; background-color: ${colors.light}; margin: 0; padding: 0; color: ${colors.secondary}; font-size: 14px; line-height: 1.6; }
        .container { max-width: 600px; margin: 20px auto; background-color: ${colors.white}; border: 1px solid ${colors.border}; border-radius: 6px; overflow: hidden; }
        .header { padding: 20px; border-bottom: 2px solid ${colors.primary}; text-align: center; }
        .header img { width: 60px; height: 60px; margin-bottom: 10px; }
        .header h1 { font-family: 'Merriweather', serif; font-size: 18px; color: ${colors.primary}; margin: 0; font-weight: 700; }
        .content { padding: 20px; }
        .content p { margin: 10px 0; }
        .button { display: inline-block; background-color: ${colors.primary}; color: ${colors.white}; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 10px 0; transition: background-color 0.3s; }
        .button:hover { background-color: ${colors.accent}; }
        .footer { border-top: 1px solid ${colors.border}; padding: 15px; text-align: center; font-size: 12px; color: ${colors.secondary}; }
        .footer a { color: ${colors.primary}; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        @media only screen and (max-width: 600px) {
          .container { margin: 10px; padding: 10px; }
          .content { padding: 15px; }
          .button { display: block; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="data:image/png;base64,${data.logoBase64}" alt="L&L Ouest Services Logo">
          <h1>Changement d'Adresse Email</h1>
        </div>
        <div class="content">
          <p>Cher(e) ${data.name || 'Utilisateur'},</p>
          <p>Vous avez demandé à changer votre adresse email vers ${data.newEmail}. Veuillez confirmer ce changement en cliquant sur le bouton ci-dessous :</p>
          <p><a href="${data.link}" class="button">Changer mon email</a></p>
          <p>Si vous n'avez pas initié cette demande, veuillez ignorer cet email ou contacter notre support au ${data.supportPhone}.</p>
          <p>Cordialement,<br>${data.company}</p>
        </div>
        <div class="footer">
          <p>${data.company} &copy; ${data.currentYear} | Tous droits réservés<br>
             <a href="${data.website}">${data.website}</a> | Support : ${data.supportPhone}</p>
        </div>
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
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Open Sans', Arial, sans-serif; background-color: ${colors.light}; margin: 0; padding: 0; color: ${colors.secondary}; font-size: 14px; line-height: 1.6; }
        .container { max-width: 600px; margin: 20px auto; background-color: ${colors.white}; border: 1px solid ${colors.border}; border-radius: 6px; overflow: hidden; }
        .header { padding: 20px; border-bottom: 2px solid ${colors.primary}; text-align: center; }
        .header img { width: 60px; height: 60px; margin-bottom: 10px; }
        .header h1 { font-family: 'Merriweather', serif; font-size: 18px; color: ${colors.primary}; margin: 0; font-weight: 700; }
        .content { padding: 20px; }
        .content p { margin: 10px 0; }
        .button { display: inline-block; background-color: ${colors.primary}; color: ${colors.white}; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 10px 0; transition: background-color 0.3s; }
        .button:hover { background-color: ${colors.accent}; }
        .footer { border-top: 1px solid ${colors.border}; padding: 15px; text-align: center; font-size: 12px; color: ${colors.secondary}; }
        .footer a { color: ${colors.primary}; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        @media only screen and (max-width: 600px) {
          .container { margin: 10px; padding: 10px; }
          .content { padding: 15px; }
          .button { display: block; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="data:image/png;base64,${data.logoBase64}" alt="L&L Ouest Services Logo">
          <h1>Connexion à Votre Compte</h1>
        </div>
        <div class="content">
          <p>Cher(e) ${data.name || 'Utilisateur'},</p>
          <p>Accédez à votre compte en cliquant sur le bouton ci-dessous :</p>
          <p><a href="${data.link}" class="button">Me connecter</a></p>
          <p>Si vous n'avez pas demandé cette connexion, veuillez ignorer cet email ou contacter notre support au ${data.supportPhone}.</p>
          <p>Cordialement,<br>${data.company}</p>
        </div>
        <div class="footer">
          <p>${data.company} &copy; ${data.currentYear} | Tous droits réservés<br>
             <a href="${data.website}">${data.website}</a> | Support : ${data.supportPhone}</p>
        </div>
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
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Open Sans', Arial, sans-serif; background-color: ${colors.light}; margin: 0; padding: 0; color: ${colors.secondary}; font-size: 14px; line-height: 1.6; }
        .container { max-width: 600px; margin: 20px auto; background-color: ${colors.white}; border: 1px solid ${colors.border}; border-radius: 6px; overflow: hidden; }
        .header { padding: 20px; border-bottom: 2px solid ${colors.primary}; text-align: center; }
        .header img { width: 60px; height: 60px; margin-bottom: 10px; }
        .header h1 { font-family: 'Merriweather', serif; font-size: 18px; color: ${colors.primary}; margin: 0; font-weight: 700; }
        .content { padding: 20px; }
        .content p { margin: 10px 0; }
        .invoice-details { border: 1px solid ${colors.border}; border-radius: 4px; padding: 15px; margin-bottom: 15px; background-color: ${colors.light}; }
        .invoice-details p { margin: 5px 0; display: flex; justify-content: space-between; }
        .invoice-details p span:first-child { font-weight: 600; }
        .button { display: inline-block; background-color: ${colors.primary}; color: ${colors.white}; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 10px 0; transition: background-color 0.3s; }
        .button:hover { background-color: ${colors.accent}; }
        .footer { border-top: 1px solid ${colors.border}; padding: 15px; text-align: center; font-size: 12px; color: ${colors.secondary}; }
        .footer a { color: ${colors.primary}; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        @media only screen and (max-width: 600px) {
          .container { margin: 10px; padding: 10px; }
          .content { padding: 15px; }
          .button { display: block; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="data:image/png;base64,${data.logoBase64}" alt="L&L Ouest Services Logo">
          <h1>Facture N°${data.invoiceId}</h1>
        </div>
        <div class="content">
          <p>Cher(e) ${data.name || 'Utilisateur'},</p>
          <p>Nous vous prions de trouver ci-dessous les détails de votre facture datée du ${data.date}. La facture est jointe en pièce attachée.</p>
          <div class="invoice-details">
            <p><span>Numéro de facture :</span><span>${data.invoiceNumber}</span></p>
            <p><span>Date d'émission :</span><span>${data.date}</span></p>
            <p><span>Date d'échéance :</span><span>${data.dueDate || 'N/A'}</span></p>
            <p><span>Montant total :</span><span>${data.amount} ${data.currency}</span></p>
          </div>
          <p><a href="${data.link || '#'}" class="button">Voir la facture</a></p>
          <p>Pour toute question, contactez notre support au ${data.supportPhone}.</p>
          <p>Cordialement,<br>${data.company}</p>
        </div>
        <div class="footer">
          <p>${data.company} &copy; ${data.currentYear} | Tous droits réservés<br>
             <a href="${data.website}">${data.website}</a> | Support : ${data.supportPhone}</p>
        </div>
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
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Open Sans', Arial, sans-serif; background-color: ${colors.light}; margin: 0; padding: 0; color: ${colors.secondary}; font-size: 14px; line-height: 1.6; }
        .container { max-width: 600px; margin: 20px auto; background-color: ${colors.white}; border: 1px solid ${colors.border}; border-radius: 6px; overflow: hidden; }
        .header { padding: 20px; border-bottom: 2px solid ${colors.primary}; text-align: center; }
        .header img { width: 60px; height: 60px; margin-bottom: 10px; }
        .header h1 { font-family: 'Merriweather', serif; font-size: 18px; color: ${colors.primary}; margin: 0; font-weight: 700; }
        .content { padding: 20px; }
        .content p { margin: 10px 0; }
        .info-section { margin-bottom: 15px; }
        .info-section h2 { font-family: 'Merriweather', serif; font-size: 16px; color: ${colors.primary}; margin: 10px 0 5px; border-bottom: 1px dashed ${colors.border}; padding-bottom: 5px; }
        .info-item { display: flex; align-items: flex-start; margin-bottom: 8px; }
        .info-label { font-weight: 600; width: 120px; flex-shrink: 0; }
        .info-value { flex-grow: 1; }
        .subjects-list { list-style-type: none; padding: 0; margin: 0; }
        .subjects-list li { padding: 8px; border: 1px solid ${colors.border}; border-radius: 4px; margin-bottom: 5px; background-color: ${colors.light}; }
        .message-box { padding: 15px; border: 1px solid ${colors.border}; border-radius: 4px; background-color: ${colors.light}; margin: 15px 0; font-style: italic; }
        .button { display: inline-block; background-color: ${colors.primary}; color: ${colors.white}; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 10px 0; transition: background-color 0.3s; }
        .button:hover { background-color: ${colors.accent}; }
        .footer { border-top: 1px solid ${colors.border}; padding: 15px; text-align: center; font-size: 12px; color: ${colors.secondary}; }
        .footer a { color: ${colors.primary}; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        @media only screen and (max-width: 600px) {
          .container { margin: 10px; padding: 10px; }
          .content { padding: 15px; }
          .info-item { flex-direction: column; align-items: flex-start; }
          .info-label { width: auto; margin-bottom: 5px; }
          .button { display: block; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="data:image/png;base64,${data.logoBase64}" alt="L&L Ouest Services Logo">
          <h1>Confirmation de Réception de Votre Message</h1>
        </div>
        <div class="content">
          <p>Cher(e) ${data.name || 'Utilisateur'},</p>
          <p>Nous accusons réception de votre message envoyé le ${data.createdAt}. Notre équipe l'examinera et vous répondra dans les plus brefs délais.</p>
          <div class="info-section">
            <h2>Vos Coordonnées</h2>
            <div class="info-item">
              <span class="info-label">Nom :</span>
              <span class="info-value">${data.name || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email :</span>
              <span class="info-value">${data.email || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Téléphone :</span>
              <span class="info-value">${data.phone || 'N/A'}</span>
            </div>
          </div>
          <div class="info-section">
            <h2>Sujets Sélectionnés</h2>
            <ul class="subjects-list">
              ${data.subjects ? data.subjects.split('-').map(sub => `<li>${sub.trim()}</li>`).join('') : '<li>N/A</li>'}
            </ul>
          </div>
          <div class="info-section">
            <h2>Votre Message</h2>
            <div class="message-box">${data.message}</div>
          </div>
          <p>Pour toute question urgente, contactez notre support au ${data.supportPhone}.</p>
          <p><a href="${data.website}" class="button">Visiter notre site</a></p>
          <p>Cordialement,<br>${data.company}</p>
        </div>
        <div class="footer">
          <p>${data.company} &copy; ${data.currentYear} | Tous droits réservés<br>
             <a href="${data.website}">${data.website}</a> | Support : ${data.supportPhone}</p>
        </div>
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
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Open Sans', Arial, sans-serif; background-color: ${colors.light}; margin: 0; padding: 0; color: ${colors.secondary}; font-size: 14px; line-height: 1.6; }
        .container { max-width: 600px; margin: 20px auto; background-color: ${colors.white}; border: 1px solid ${colors.border}; border-radius: 6px; overflow: hidden; }
        .header { padding: 20px; border-bottom: 2px solid ${colors.primary}; text-align: center; }
        .header img { width: 60px; height: 60px; margin-bottom: 10px; }
        .header h1 { font-family: 'Merriweather', serif; font-size: 18px; color: ${colors.primary}; margin: 0; font-weight: 700; }
        .content { padding: 20px; }
        .content p { margin: 10px 0; }
        .info-section { margin-bottom: 15px; }
        .info-section h2 { font-family: 'Merriweather', serif; font-size: 16px; color: ${colors.primary}; margin: 10px 0 5px; border-bottom: 1px dashed ${colors.border}; padding-bottom: 5px; }
        .info-item { display: flex; align-items: flex-start; margin-bottom: 8px; }
        .info-label { font-weight: 600; width: 120px; flex-shrink: 0; }
        .info-value { flex-grow: 1; }
        .subjects-list { list-style-type: none; padding: 0; margin: 0; }
        .subjects-list li { padding: 8px; border: 1px solid ${colors.border}; border-radius: 4px; margin-bottom: 5px; background-color: ${colors.light}; }
        .message-box { padding: 15px; border: 1px solid ${colors.border}; border-radius: 4px; background-color: ${colors.light}; margin: 15px 0; font-style: italic; }
        .button { display: inline-block; background-color: ${colors.primary}; color: ${colors.white}; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 10px 5px; transition: background-color 0.3s; }
        .button:hover { background-color: ${colors.accent}; }
        .footer { border-top: 1px solid ${colors.border}; padding: 15px; text-align: center; font-size: 12px; color: ${colors.secondary}; }
        .footer a { color: ${colors.primary}; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        @media only screen and (max-width: 600px) {
          .container { margin: 10px; padding: 10px; }
          .content { padding: 15px; }
          .info-item { flex-direction: column; align-items: flex-start; }
          .info-label { width: auto; margin-bottom: 5px; }
          .button { display: block; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="data:image/png;base64,${data.logoBase64}" alt="L&L Ouest Services Logo">
          <h1>Nouveau Message de Contact (ID: ${data.id})</h1>
        </div>
        <div class="content">
          <p>Bonjour Équipe Administrative,</p>
          <p>Un nouveau message de contact a été reçu le ${data.createdAt}. Voici les détails :</p>
          <div class="info-section">
            <h2>Informations du Contact</h2>
            <div class="info-item">
              <span class="info-label">Nom :</span>
              <span class="info-value">${data.name || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email :</span>
              <span class="info-value">${data.email || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Téléphone :</span>
              <span class="info-value">${data.phone || 'N/A'}</span>
            </div>
          </div>
          <div class="info-section">
            <h2>Sujets Sélectionnés</h2>
            <ul class="subjects-list">
              ${data.subjects ? data.subjects.split('-').map(sub => `<li>${sub.trim()}</li>`).join('') : '<li>N/A</li>'}
            </ul>
          </div>
          <div class="info-section">
            <h2>Message Reçu</h2>
            <div class="message-box">${data.message}</div>
          </div>
          <p>Actions rapides :</p>
          <a href="mailto:${data.email}?subject=Re:%20${encodeURIComponent(data.subjects || 'Message de contact')}&body=Bonjour%20${encodeURIComponent(data.name || '')},%0A%0A" class="button">Répondre par Email</a>
          <a href="${data.website}/admin/contacts/${data.id}" class="button">Voir dans l'Admin</a>
        </div>
        <div class="footer">
          <p>${data.company} &copy; ${data.currentYear} | Tous droits réservés<br>
             <a href="${data.website}">${data.website}</a> | Support : ${data.supportPhone}</p>
        </div>
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
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Open Sans', Arial, sans-serif; background-color: ${colors.light}; margin: 0; padding: 0; color: ${colors.secondary}; font-size: 14px; line-height: 1.6; }
        .container { max-width: 600px; margin: 20px auto; background-color: ${colors.white}; border: 1px solid ${colors.border}; border-radius: 6px; overflow: hidden; }
        .header { padding: 20px; border-bottom: 2px solid ${colors.primary}; text-align: center; }
        .header img { width: 60px; height: 60px; margin-bottom: 10px; }
        .header h1 { font-family: 'Merriweather', serif; font-size: 18px; color: ${colors.primary}; margin: 0; font-weight: 700; }
        .content { padding: 20px; }
        .content p { margin: 10px 0; }
        .original-message { border: 1px solid ${colors.border}; border-radius: 4px; padding: 15px; margin-bottom: 15px; background-color: ${colors.light}; }
        .original-message h3 { font-family: 'Merriweather', serif; font-size: 16px; color: ${colors.primary}; margin: 0 0 10px; }
        .reply-section { border: 1px solid ${colors.border}; border-radius: 4px; padding: 15px; margin-bottom: 15px; }
        .reply-section h3 { font-family: 'Merriweather', serif; font-size: 16px; color: ${colors.primary}; margin: 0 0 10px; }
        .button { display: inline-block; background-color: ${colors.primary}; color: ${colors.white}; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 10px 0; transition: background-color 0.3s; }
        .button:hover { background-color: ${colors.accent}; }
        .footer { border-top: 1px solid ${colors.border}; padding: 15px; text-align: center; font-size: 12px; color: ${colors.secondary}; }
        .footer a { color: ${colors.primary}; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        @media only screen and (max-width: 600px) {
          .container { margin: 10px; padding: 10px; }
          .content { padding: 15px; }
          .button { display: block; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="data:image/png;base64,${data.logoBase64}" alt="L&L Ouest Services Logo">
          <h1>Réponse à Votre Message</h1>
        </div>
        <div class="content">
          <p>Cher(e) ${data.name || 'Utilisateur'},</p>
          <p>Merci pour votre message du ${data.createdAt} concernant "${data.originalSubjects || 'votre demande'}". Voici notre réponse :</p>
          <div class="original-message">
            <h3>Votre message original :</h3>
            <p>${data.originalMessage.replace(/\n/g, '<br>')}</p>
          </div>
          <div class="reply-section">
            <h3>Notre réponse :</h3>
            <p>${data.reply.replace(/\n/g, '<br>')}</p>
            ${data.repliedByName ? `<p>Répondu par : ${data.repliedByName}</p>` : ''}
          </div>
          <p>Pour toute question supplémentaire, contactez-nous au ${data.supportPhone} ou par email à <a href="mailto:contact@llouestservices.com">contact@llouestservices.com</a>.</p>
          <p><a href="${data.website}" class="button">Visiter notre site</a></p>
          <p>Cordialement,<br>${data.company}</p>
        </div>
        <div class="footer">
          <p>${data.company} &copy; ${data.currentYear} | Tous droits réservés<br>
             <a href="${data.website}">${data.website}</a> | Support : ${data.supportPhone}</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

export default emailTemplates;
