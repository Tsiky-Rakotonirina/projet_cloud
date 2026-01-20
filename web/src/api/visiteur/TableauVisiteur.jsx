import { callApi } from '@util/api';

/**
 * API pour gérer les tableaux visiteurs
 */
export const tableauVisiteurApi = {
  /**
   * Récupérer les statistiques visiteur
   */
  getStats: async () => {
    const response = await callApi('/api/visiteur/stats', 'GET');
    return response.data || {
      total_points: 0,
      total_surface: 0,
      total_budget: 0,
      avancement_moyen_pourcent: 0,
      nombre_problemes: 0
    };
  },

  /**
   * Récupérer tous les signalements pour le tableau
   */
  getAll: async () => {
    const response = await callApi('/api/map/signalements', 'GET');
    return response.data || [];
  },

  /**
   * Récupérer tous les problèmes pour le tableau
   */
  getAllProblemes: async () => {
    const response = await callApi('/api/map/problemes', 'GET');
    return response.data || [];
  },

  /**
   * Récupérer un signalement par ID
   */
  getById: async (id) => {
    const response = await callApi(`/api/map/signalements/${id}`, 'GET');
    return response.data || null;
  },

  /**
   * Récupérer les données du tableau de bord
   */
  getDashboard: async (params) => {
    // Utilise les stats visiteur comme base du dashboard
    const response = await callApi('/api/visiteur/stats', 'GET', null, params);
    return response.data || {
      total_points: 0,
      total_surface: 0,
      total_budget: 0,
      avancement_moyen_pourcent: 0
    };
  }
};

export default tableauVisiteurApi;
