/**
 * @file routes/config.js
 * @description Routes pour fournir les configurations publiques au client.
 */

const express = require('express');
const router = express.Router();
const config = require('../config/config');
const { logInfo } = require('../services/loggerService');

/**
 * @route GET /api/config
 * @description Fournit les configurations publiques Firebase pour le client.
 * @access Public
 */
router.get('/firebase', (req, res) => {
  logInfo('Fourniture des configurations publiques au client');
  res.status(200).json({
    status: 'success',
    data: {
      apiKey: config.firebase.apiKey,
      authDomain: 'll-ouest-services.firebaseapp.com',
      databaseURL: config.firebase.databaseURL,
      projectId: config.firebase.projectId,
      storageBucket: config.firebase.storageBucket,
      messagingSenderId: config.firebase.senderId,
      appId: config.firebase.appId,
      measurementId: config.firebase.measurementId,
      vapidKey: config.firebase.vapidKey
    },
  });
});

module.exports = router;
