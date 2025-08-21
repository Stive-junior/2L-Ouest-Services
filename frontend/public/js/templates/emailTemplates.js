/**
 * @file emailTemplates.js
 * @description Templates HTML pour les emails de L&L Ouest Services.
 * Utilise une palette de couleurs professionnelle et une mise en page responsive.
 * Intègre la police Roboto via Google Fonts pour une apparence cohérente.
 * @module emailTemplates
 */

const colors = {
  primary: '#0077B6', // Bleu
  dark: '#023E8A', // Bleu foncé
  white: '#FFFFFF', // Blanc
  accent: '#90BE6D', // Vert
};

const emailTemplates = {
  verification: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Roboto', Arial, sans-serif; background-color: ${colors.white}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: ${colors.white}; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
        .header { background-color: ${colors.dark}; color: ${colors.white}; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; color: #333; }
        .content p { font-size: 16px; line-height: 1.6; margin: 10px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: ${colors.primary}; color: ${colors.white}; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold; }
        .button:hover { background-color: ${colors.accent}; }
        .footer { background-color: ${colors.dark}; color: ${colors.white}; padding: 10px; text-align: center; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; font-size: 12px; }
        @media only screen and (max-width: 600px) {
          .container { width: 100%; margin: 10px; }
          .button { width: 100%; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>L&L Ouest Services</h1>
        </div>
        <div class="content">
          <p>Bonjour ${data.name || 'Utilisateur'},</p>
          <p>Merci de vous être inscrit chez L&L Ouest Services. Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :</p>
          <p><a href="${data.link}" class="button">Vérifier mon email</a></p>
          <p>Si vous n'avez pas demandé cette vérification, veuillez ignorer cet email.</p>
        </div>
        <div class="footer">
          <p>L&L Ouest Services &copy; ${new Date().getFullYear()} | Tous droits réservés</p>
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
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Roboto', Arial, sans-serif; background-color: ${colors.white}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: ${colors.white}; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
        .header { background-color: ${colors.dark}; color: ${colors.white}; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; color: #333; }
        .content p { font-size: 16px; line-height: 1.6; margin: 10px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: ${colors.primary}; color: ${colors.white}; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold; }
        .button:hover { background-color: ${colors.accent}; }
        .footer { background-color: ${colors.dark}; color: ${colors.white}; padding: 10px; text-align: center; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; font-size: 12px; }
        @media only screen and (max-width: 600px) {
          .container { width: 100%; margin: 10px; }
          .button { width: 100%; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>L&L Ouest Services</h1>
        </div>
        <div class="content">
          <p>Bonjour ${data.name || 'Utilisateur'},</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour procéder :</p>
          <p><a href="${data.link}" class="button">Réinitialiser mon mot de passe</a></p>
          <p>Si vous n'avez pas fait cette demande, veuillez ignorer cet email.</p>
        </div>
        <div class="footer">
          <p>L&L Ouest Services &copy; ${new Date().getFullYear()} | Tous droits réservés</p>
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
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Roboto', Arial, sans-serif; background-color: ${colors.white}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: ${colors.white}; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
        .header { background-color: ${colors.dark}; color: ${colors.white}; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; color: #333; }
        .content p { font-size: 16px; line-height: 1.6; margin: 10px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: ${colors.primary}; color: ${colors.white}; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold; }
        .button:hover { background-color: ${colors.accent}; }
        .footer { background-color: ${colors.dark}; color: ${colors.white}; padding: 10px; text-align: center; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; font-size: 12px; }
        @media only screen and (max-width: 600px) {
          .container { width: 100%; margin: 10px; }
          .button { width: 100%; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>L&L Ouest Services</h1>
        </div>
        <div class="content">
          <p>Bonjour ${data.name || 'Utilisateur'},</p>
          <p>Vous avez demandé à changer votre adresse email vers ${data.newEmail}. Cliquez sur le bouton ci-dessous pour vérifier et confirmer ce changement :</p>
          <p><a href="${data.link}" class="button">Changer mon email</a></p>
          <p>Si vous n'avez pas demandé ce changement, veuillez ignorer cet email.</p>
        </div>
        <div class="footer">
          <p>L&L Ouest Services &copy; ${new Date().getFullYear()} | Tous droits réservés</p>
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
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Roboto', Arial, sans-serif; background-color: ${colors.white}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: ${colors.white}; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
        .header { background-color: ${colors.dark}; color: ${colors.white}; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; color: #333; }
        .content p { font-size: 16px; line-height: 1.6; margin: 10px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: ${colors.primary}; color: ${colors.white}; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold; }
        .button:hover { background-color: ${colors.accent}; }
        .footer { background-color: ${colors.dark}; color: ${colors.white}; padding: 10px; text-align: center; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; font-size: 12px; }
        @media only screen and (max-width: 600px) {
          .container { width: 100%; margin: 10px; }
          .button { width: 100%; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>L&L Ouest Services</h1>
        </div>
        <div class="content">
          <p>Bonjour ${data.name || 'Utilisateur'},</p>
          <p>Connectez-vous à votre compte en cliquant sur le bouton ci-dessous :</p>
          <p><a href="${data.link}" class="button">Me connecter</a></p>
          <p>Si vous n'avez pas demandé cette connexion, veuillez ignorer cet email.</p>
        </div>
        <div class="footer">
          <p>L&L Ouest Services &copy; ${new Date().getFullYear()} | Tous droits réservés</p>
        </div>
      </div>
    </body>
    </html>
  `,

  contactConfirmation: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Roboto', Arial, sans-serif; background-color: ${colors.white}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: ${colors.white}; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
        .header { background-color: ${colors.dark}; color: ${colors.white}; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; color: #333; }
        .content p { font-size: 16px; line-height: 1.6; margin: 10px 0; }
        .message-box { border-left: 4px solid ${colors.primary}; padding: 10px; background-color: #f9f9f9; margin: 10px 0; border-radius: 4px; }
        .footer { background-color: ${colors.dark}; color: ${colors.white}; padding: 10px; text-align: center; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; font-size: 12px; }
        @media only screen and (max-width: 600px) {
          .container { width: 100%; margin: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>L&L Ouest Services</h1>
        </div>
        <div class="content">
          <p>Bonjour ${data.name || 'Utilisateur'},</p>
          <p>Nous avons bien reçu votre message. Voici un récapitulatif :</p>
          <div class="message-box">
            <p><strong>Sujet :</strong> ${data.subject || 'Nouveau message de contact'}</p>
            <p><strong>Message :</strong> ${data.message}</p>
          </div>
          <p>Nous vous répondrons dans les plus brefs délais. Merci de votre confiance.</p>
        </div>
        <div class="footer">
          <p>L&L Ouest Services &copy; ${new Date().getFullYear()} | Tous droits réservés</p>
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
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Roboto', Arial, sans-serif; background-color: ${colors.white}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: ${colors.white}; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
        .header { background-color: ${colors.dark}; color: ${colors.white}; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; color: #333; }
        .content p { font-size: 16px; line-height: 1.6; margin: 10px 0; }
        .invoice-details { border: 1px solid ${colors.primary}; padding: 10px; border-radius: 4px; }
        .invoice-details p { margin: 5px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: ${colors.primary}; color: ${colors.white}; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold; }
        .button:hover { background-color: ${colors.accent}; }
        .footer { background-color: ${colors.dark}; color: ${colors.white}; padding: 10px; text-align: center; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; font-size: 12px; }
        @media only screen and (max-width: 600px) {
          .container { width: 100%; margin: 10px; }
          .button { width: 100%; text-align: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>L&L Ouest Services</h1>
        </div>
        <div class="content">
          <p>Bonjour ${data.name || 'Utilisateur'},</p>
          <p>Vous trouverez ci-joint votre facture n°${data.invoiceId} datée du ${data.date}.</p>
          <div class="invoice-details">
            <p><strong>Montant :</strong> ${data.amount} €</p>
            <p><strong>Date d'émission :</strong> ${data.date}</p>
          </div>
          <p><a href="${data.link || '#'}" class="button">Voir la facture</a></p>
          <p>Merci pour votre confiance en L&L Ouest Services.</p>
        </div>
        <div class="footer">
          <p>L&L Ouest Services &copy; ${new Date().getFullYear()} | Tous droits réservés</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

export default emailTemplates;
