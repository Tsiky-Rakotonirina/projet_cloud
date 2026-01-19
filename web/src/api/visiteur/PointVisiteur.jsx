import { callApi } from '@util/api';

// Données par défaut pour l'affichage (région Antananarivo)
const defaultPoints = [
  { id: 1, lng: 47.5161, lat: -18.8883, name: 'Route RN7 - Km 5', status: 'en_cours', description: 'Réfection en cours' },
  { id: 2, lng: 47.5250, lat: -18.8750, name: 'Carrefour Analakely', status: 'planifie', description: 'Travaux planifiés Q2 2026' },
  { id: 3, lng: 47.4950, lat: -18.8950, name: 'Boulevard de l\'Indépendance', status: 'termine', description: 'Travaux terminés' },
  { id: 4, lng: 47.5350, lat: -18.8650, name: 'Route vers Ivato', status: 'en_cours', description: 'Élargissement en cours' },
  { id: 5, lng: 47.5100, lat: -18.9000, name: 'Avenue de France', status: 'planifie', description: 'Réhabilitation prévue' },
  { id: 6, lng: 47.5200, lat: -18.8600, name: 'RN2 Sortie Nord', status: 'termine', description: 'Achevé en 2025' },
];

/**
 * API pour gérer les points visiteurs
 */
export const pointVisiteurApi = {
  /**
   * Récupérer tous les points visiteurs
   */
  getAll: async () => {
    try {
      const data = await callApi('/api/points-visiteurs', 'GET');
      return Array.isArray(data) ? data : defaultPoints;
    } catch (error) {
      console.warn('API Points visiteurs indisponible, données de démonstration utilisées');
      return defaultPoints;
    }
  },

  /**
   * Récupérer un point visiteur par ID
   */
  getById: async (id) => {
    try {
      return await callApi(`/api/points-visiteurs/${id}`, 'GET');
    } catch (error) {
      return defaultPoints.find(p => p.id === id) || null;
    }
  },

  /**
   * Créer un nouveau point visiteur
   */
  create: async (data) => {
    return await callApi('/api/points-visiteurs', 'POST', data);
  },

  /**
   * Mettre à jour un point visiteur
   */
  update: async (id, data) => {
    return await callApi(`/api/points-visiteurs/${id}`, 'PUT', data);
  },

  /**
   * Supprimer un point visiteur
   */
  delete: async (id) => {
    return await callApi(`/api/points-visiteurs/${id}`, 'DELETE');
  },

  /**
   * Rechercher des points par critères
   */
  search: async (params) => {
    try {
      const data = await callApi('/api/points-visiteurs/search', 'GET', null, params);
      return Array.isArray(data) ? data : defaultPoints;
    } catch (error) {
      return defaultPoints;
    }
  },

  /**
   * Récupérer les points par région
   */
  getByRegion: async (region) => {
    try {
      const data = await callApi(`/api/points-visiteurs/region/${region}`, 'GET');
      return Array.isArray(data) ? data : defaultPoints;
    } catch (error) {
      return defaultPoints;
    }
  }
};

export default pointVisiteurApi;
