const logger = require('../services/loggerService');
const admin = require('../config/firebase').admin; // Assure-toi que `admin` est exporté dans config/firebase.js

const logRequest = async (req, res, next) => {
  const start = Date.now();

  // Attache un listener à la fin de la réponse
  res.on('finish', async () => {
    const duration = Date.now() - start;

    let userId = 'non authentifié';

    try {
      if (!req.user && req.headers.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = decodedToken.uid || 'firebase-uid inconnu';
      } else if (req.user?.userId) {
        userId = req.user.userId;
      }
    } catch (err) {
      
    }

    logger.logAudit('Requête traitée', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId,
    });
  });

  next();
};

module.exports = logRequest;
