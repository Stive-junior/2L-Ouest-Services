/**
 * @file loggerService.js
 * @description Service de journalisation avancé utilisant Winston pour gérer les logs
 * de l'application avec plusieurs transports (console, fichiers, rotation, audit).
 * Supporte des couleurs personnalisées, animations subtiles, emojis dans un tableau avec index,
 * et une présentation ultra professionnelle des métadonnées avec clés colorées.
 * @module loggerService
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { combine, timestamp, printf, errors, colorize } = winston.format;
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

// Contexte global pour les logs
let logContext = {};

// Palette de couleurs personnalisées pour chaque niveau de log (en gras)
const levelColors = {
  info: '\x1b[1;32m',   // Vert vif
  error: '\x1b[1;31m',  // Rouge vif
  warn: '\x1b[1;33m',   // Jaune vif
  debug: '\x1b[1;36m',  // Cyan
  fatal: '\x1b[1;35m',  // Magenta
  audit: '\x1b[1;34m',  // Bleu
};

// Mapping des niveaux de log aux index
const levelToIndex = {
  info: 1,
  error: 2,
  warn: 3,
  debug: 4,
  fatal: 5,
  audit: 6,
};

// Emojis par niveau de log (tableau avec index, caractères de secours pour terminaux non compatibles)
const levelEmojis = [
  '[UNKNOWN]', // Index 0 (niveau inconnu)
  process.stdout.isTTY && process.platform !== 'win32' ? '✅' : '[INFO]',  
  process.stdout.isTTY && process.platform !== 'win32' ? '🚨' : '[ERROR]', 
  process.stdout.isTTY && process.platform !== 'win32' ? '⚠️' : '[WARN]', 
  process.stdout.isTTY && process.platform !== 'win32' ? '🔍' : '[DEBUG]', 
  process.stdout.isTTY && process.platform !== 'win32' ? '💥' : '[FATAL]', 
  process.stdout.isTTY && process.platform !== 'win32' ? '📋' : '[AUDIT]',
];

// Motifs animés pour le terminal (rotation simple pour dynamisme)
const animationFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let animationIndex = 0;

/**
 * @constant {Object} sensitiveFields
 * @description Champs à masquer dans les logs pour éviter les fuites de données sensibles.
 */
const sensitiveFields = ['password', 'pass', 'token', 'jwt', 'privateKey', 'smtpPass', ];

/**
 * @function sanitizeMetadata
 * @description Masque les champs sensibles dans les métadonnées des logs.
 * @param {Object} metadata - Métadonnées à sanitiser.
 * @returns {Object} Métadonnées sanitizées.
 */
const sanitizeMetadata = (metadata) => {
  const sanitized = { ...metadata };
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '****';
    }
  });
  return sanitized;
};

/**
 * @function stripAnsi
 * @description Supprime les codes ANSI d'une chaîne pour éviter les interférences avec la correspondance des niveaux.
 * @param {string} str - Chaîne à nettoyer.
 * @returns {string} Chaîne sans codes ANSI.
 */
const stripAnsi = (str = '') => str.replace(/\x1b\[[0-9;]*m/g, '');

/**
 * @function formatMetadata
 * @description Formate les métadonnées avec clés colorées en bleu, valeurs en blanc, et style console de navigation.
 * @param {Object} metadata - Métadonnées à formater.
 * @returns {string} Métadonnées formatées.
 */
const formatMetadata = (metadata) => {
  const sanitized = sanitizeMetadata(metadata);
  if (Object.keys(sanitized).length === 0) return '';
  const jsonString = JSON.stringify(sanitized, null, 2)
    .split('\n')
    .map(line => {
      // Colorer les clés en bleu (\x1b[1;34m) et les valeurs en blanc, avec style italique
      const match = line.match(/^(\s*"[^"]*":\s*)(.*)$/);
      if (match) {
        return `\x1b[3m│ \x1b[1;34m${match[1]}\x1b[0m\x1b[3m${match[2]}\x1b[0m`;
      }
      return `\x1b[3m│ ${line}\x1b[0m`;
    })
    .join('\n');
  return `\n\x1b[3m╭────────────────── Métadonnées ──────────────────╮\x1b[0m\n${jsonString}\n\x1b[3m╰─────────────────────────────────────────────────╯\x1b[0m`;
};

/**
 * @constant {Object} customFormat
 * @description Format personnalisé pour les logs avec timestamp, niveau, emoji, animation, et métadonnées stylisées.
 */
const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const formattedTimestamp = new Date(timestamp).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const levelKey = stripAnsi(level).toLowerCase().trim();
  const emojiIndex = levelToIndex[levelKey] || 0;
  const emoji = levelEmojis[emojiIndex];
  const color = levelColors[levelKey] || '\x1b[1;37m'; // Blanc par défaut
  const levelStyled = levelKey.toUpperCase().padEnd(8); // Espacement fixe pour alignement
  const animation = config.nodeEnv === 'development' && process.stdout.isTTY ? animationFrames[animationIndex++ % animationFrames.length] : '';
  const contextStr = Object.keys(logContext).length > 0 ? formatMetadata(logContext) : '';
  const filteredMetadata = sanitizeMetadata(
    Object.fromEntries(
      Object.entries(metadata).filter(([key]) => !['level', 'timestamp', 'splat'].includes(key))
    )
  );
  const metaStr = formatMetadata(filteredMetadata);
  return `${color}${emoji} [2L-Ouest-Services] ${formattedTimestamp} ${emoji}| ${animation} ${levelStyled} | ${message}\x1b[0m${contextStr}${metaStr}`;
});


/**
 * @constant {Object} fileFormat
 * @description Format personnalisé pour les logs avec timestamp, niveau, emoji, animation, et métadonnées stylisées.
 */
const fileFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const formattedTimestamp = new Date(timestamp).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const levelKey = stripAnsi(level).toLowerCase().trim();
  const emojiIndex = levelToIndex[levelKey] || 0;
  const emoji = levelEmojis[emojiIndex];
  const filteredMetadata = sanitizeMetadata(
    Object.fromEntries(
      Object.entries(metadata).filter(([key]) => !['level', 'timestamp', 'splat'].includes(key))
    )
  );
  const metaStr = Object.keys(filteredMetadata).length > 0 ? JSON.stringify(filteredMetadata, null, 2) : '';
  return `${emoji} [2L-Ouest-Services] ${formattedTimestamp} | ${levelKey.toUpperCase().padEnd(8)} | ${message}${metaStr ? '\n' + metaStr : ''}`;
});


/**
 * @constant {Object} logger
 * @description Instance Winston configurée pour le logging avec couleurs et animations.
 */
const logger = winston.createLogger({
  level: config.logging.level || 'debug',
  levels: {
    ...winston.config.npm.levels,
    audit: 0,
    fatal: 0,
  },
  format: combine(
    timestamp(),
    errors({ stack: true }),
    config.nodeEnv === 'production' ? winston.format.json() : customFormat
  ),
  transports: [
    // Console pour le développement avec couleurs dynamiques
    new winston.transports.Console({
      level: 'debug',
      format: combine(
        colorize({
          all: true,
          colors: {
            info: 'green',
            error: 'red',
            warn: 'yellow',
            debug: 'cyan',
            fatal: 'magenta',
            audit: 'blue',
          },
        }),
        customFormat
      ),
    }),
    // Fichier pour les erreurs
    new DailyRotateFile({
      filename: `${config.logging.filePath}-error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format: combine(timestamp(), errors({ stack: true }), fileFormat)
    }),
    // Fichier combiné pour tous les logs
    new DailyRotateFile({
      filename: `${config.logging.filePath}-combined-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(timestamp(), errors({ stack: true }), fileFormat)
    }),
    // Fichier pour les logs d'audit
    new DailyRotateFile({
      filename: `${config.logging.filePath}-audit-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'audit',
      format: combine(timestamp(), errors({ stack: true }), fileFormat)
    }),
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: `${config.logging.filePath}-exceptions-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(timestamp(), errors({ stack: true }), fileFormat)
      
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: `${config.logging.filePath}-rejections-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(timestamp(), errors({ stack: true }), fileFormat)
    }),
  ],
});

/**
 * @function setContext
 * @description Définit le contexte global pour les logs (ex: requestId, userId).
 * @param {Object} context - Contexte à ajouter.
 */
const setContext = (context = {}) => {
  logContext = { requestId: uuidv4(), ...sanitizeMetadata(context) };
};

/**
 * @function clearContext
 * @description Réinitialise le contexte global.
 */
const clearContext = () => {
  logContext = {};
};

/**
 * @function logInfo
 * @description Log un message de niveau 'info'.
 * @param {string} message - Message à logger.
 * @param {Object} [meta] - Métadonnées supplémentaires.
 */
const logInfo = (message, meta = {}) => {
  logger.info(String(message), { ...logContext, ...sanitizeMetadata(meta) });
};

/**
 * @function logError
 * @description Log un message de niveau 'error'.
 * @param {string} message - Message à logger.
 * @param {Object} [meta] - Métadonnées supplémentaires.
 */
const logError = (message, meta = {}) => {
  logger.error(String(message), { ...logContext, ...sanitizeMetadata(meta) });
};

/**
 * @function logWarn
 * @description Log un message de niveau 'warn'.
 * @param {string} message - Message à logger.
 * @param {Object} [meta] - Métadonnées supplémentaires.
 */
const logWarn = (message, meta = {}) => {
  logger.warn(String(message), { ...logContext, ...sanitizeMetadata(meta) });
};

/**
 * @function logDebug
 * @description Log un message de niveau 'debug' (uniquement en développement).
 * @param {string} message - Message à logger.
 * @param {Object} [meta] - Métadonnées supplémentaires.
 */
const logDebug = (message, meta = {}) => {
  logger.debug(String(message), { ...logContext, ...sanitizeMetadata(meta) });
};

/**
 * @function logFatal
 * @description Log un message de niveau 'fatal' pour les erreurs critiques.
 * @param {string} message - Message à logger.
 * @param {Object} [meta] - Métadonnées supplémentaires.
 */
const logFatal = (message, meta = {}) => {
  logger.log('fatal', String(message), { ...logContext, ...sanitizeMetadata(meta) });
};

/**
 * @function logAudit
 * @description Log un message de niveau 'audit' pour les actions critiques (ex: admin).
 * @param {string} message - Message à logger.
 * @param {Object} [meta] - Métadonnées supplémentaires.
 */
const logAudit = (message, meta = {}) => {
  logger.log('audit', String(message), { ...logContext, ...sanitizeMetadata(meta) });
};

/**
 * @function overrideConsole
 * @description Redirige les appels à console.log vers le logger Winston.
 */
const overrideConsole = () => {
  const originalConsoleLog = console.log;
  console.log = (message, ...args) => {
    const meta = args.length > 0 ? { args: sanitizeMetadata(args) } : {};
    logInfo(String(message), meta);
  };
  return originalConsoleLog;
};

// Initialiser la redirection de console.log
overrideConsole();

module.exports = {
  logger,
  setContext,
  clearContext,
  logInfo,
  logError,
  logWarn,
  logDebug,
  logFatal,
  logAudit,
};
