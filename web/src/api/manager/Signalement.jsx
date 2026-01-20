import { callApi } from '@util/api';

// Données par défaut pour l'affichage
const defaultNouveaux = [
  { id: 1, point: { lat: -18.9137, lng: 47.5361 }, email: 'user1@mail.com', description: 'Route endommagée près du marché' },
  { id: 2, point: { lat: -18.9200, lng: 47.5400 }, email: 'user2@mail.com', description: 'Nid de poule dangereux' },
];

const defaultVides = [
  { id: 3, point: { lat: -18.9100, lng: 47.5300 }, email: 'user3@mail.com', description: 'Tronçon à réhabiliter' },
  { id: 4, point: { lat: -18.9050, lng: 47.5450 }, email: 'user4@mail.com', description: 'Carrefour problématique' },
];

const defaultComplets = [
  { id: 5, point: { lat: -18.9180, lng: 47.5380 }, description: 'Réfection complète', budget: 50000000, surface: 1200, entreprise: 'Colas Madagascar', statut: 'planifié' },
  { id: 6, point: { lat: -18.9220, lng: 47.5420 }, description: 'Élargissement route', budget: 120000000, surface: 3500, entreprise: 'SOGEA SATOM', statut: 'en_cours' },
];

const defaultStats = { total: 6, pending: 2, resolved: 2, urgent: 1 };

/**
 * API pour la gestion des signalements
 */
export const signalementApi = {
  /**
   * Récupérer tous les signalements
   */
  getAll: async (params) => {
    try {
      const data = await callApi('/api/signalements', 'GET', null, params);
      return Array.isArray(data) ? data : [...defaultNouveaux, ...defaultVides, ...defaultComplets];
    } catch (error) {
      console.warn('API Signalements indisponible, données de démonstration utilisées');
      return [...defaultNouveaux, ...defaultVides, ...defaultComplets];
    }
  },

  /**
   * Récupérer les nouveaux signalements (à traiter)
   */
  getNouveaux: async () => {
    try {
      const data = await callApi('/api/signalements/nouveaux', 'GET');
      return Array.isArray(data) ? data : defaultNouveaux;
    } catch (error) {
      console.warn('API Signalements nouveaux indisponible, données de démonstration utilisées');
      return defaultNouveaux;
    }
  },

  /**
   * Récupérer les signalements sans informations
   */
  getVides: async () => {
    try {
      const data = await callApi('/api/signalements/vides', 'GET');
      return Array.isArray(data) ? data : defaultVides;
    } catch (error) {
      console.warn('API Signalements vides indisponible, données de démonstration utilisées');
      return defaultVides;
    }
  },

  /**
   * Récupérer les signalements complets
   */
  getComplets: async () => {
    try {
      const data = await callApi('/api/signalements/complets', 'GET');
      return Array.isArray(data) ? data : defaultComplets;
    } catch (error) {
      console.warn('API Signalements complets indisponible, données de démonstration utilisées');
      return defaultComplets;
    }
  },

  /**
   * Récupérer un signalement par ID
   */
  getById: async (id) => {
    try {
      return await callApi(`/api/signalements/${id}`, 'GET');
    } catch (error) {
      const all = [...defaultNouveaux, ...defaultVides, ...defaultComplets];
      return all.find(s => s.id === id) || null;
    }
  },

  /**
   * Créer un nouveau signalement
   */
  create: async (data) => {
    return await callApi('/api/signalements', 'POST', data);
  },

  /**
   * Mettre à jour un signalement
   */
  update: async (id, data) => {
    return await callApi(`/api/signalements/${id}`, 'PUT', data);
  },

  /**
   * Supprimer un signalement
   */
  delete: async (id) => {
    return await callApi(`/api/signalements/${id}`, 'DELETE');
  },

  /**
   * Approuver un signalement
   */
  approuver: async (id) => {
    return await callApi(`/api/signalements/${id}/approuver`, 'PATCH');
  },

  /**
   * Refuser un signalement
   */
  refuser: async (id) => {
    return await callApi(`/api/signalements/${id}/refuser`, 'PATCH');
  },

  /**
   * Mettre les infos d'un signalement
   */
  mettreInfos: async (id, data) => {
    return await callApi(`/api/signalements/${id}/infos`, 'PATCH', data);
  },

  /**
   * Upgrade un signalement (avancement)
   */
  upgrade: async (id) => {
    return await callApi(`/api/signalements/${id}/upgrade`, 'PATCH');
  },

  /**
   * Changer le statut d'un signalement
   */
  changeStatus: async (id, status) => {
    return await callApi(`/api/signalements/${id}/status`, 'PATCH', { status });
  },

  /**
   * Traiter un signalement
   */
  traiter: async (id, resolution) => {
    return await callApi(`/api/signalements/${id}/traiter`, 'POST', { resolution });
  },

  /**
   * Récupérer les statistiques des signalements
   */
  getStats: async () => {
    try {
      const data = await callApi('/api/signalements/stats', 'GET');
      return data || defaultStats;
    } catch (error) {
      console.warn('API Stats signalements indisponible, données de démonstration utilisées');
      return defaultStats;
    }
  }
};

export default signalementApi;
