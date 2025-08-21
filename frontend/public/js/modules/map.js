//import L from 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';

/**
 * @file map.js
 * @description Module de gestion de la carte pour L&L Ouest Services.
 * Gère l'affichage des services à proximité.
 * @module map
 */

import api from '../api.js';
import { showNotification } from './utils.js';

const map = {
  init() {
    this.bindNearbyServices();
  },

  bindNearbyServices() {
    const listContainer = document.getElementById('services-list');
    if (listContainer) {
      api.map.findNearbyServices(10000).then((services) => {
        listContainer.innerHTML = services.map((service) => `
          <div>${service.name} - ${service.price}€ - ${service.category}</div>
        `).join('');
      }).catch((error) => {
        showNotification(error.message, 'error');
      });
    }
  },
};

export default map;