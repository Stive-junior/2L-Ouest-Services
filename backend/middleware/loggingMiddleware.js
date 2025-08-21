const  logger  = require('../services/loggerService');

const logRequest = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logAudit('Requête traitée', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user ? req.user.userId : 'non authentifié',
    });
  });
  next();
};

module.exports = logRequest;
