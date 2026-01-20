import { callApi } from '@util/api';

/**
 * API pour gérer les points visiteurs
 */
export const pointVisiteurApi = {
  /**
   * Récupérer tous les points visiteurs (via map/signalements)
   */
  getAll: async () => {
    const response = await callApi('/api/map/signalements', 'GET');
    return response.data || [];
  },

  /**
   * Récupérer un point visiteur par ID
   */
  getById: async (id) => {
    const response = await callApi(`/api/visiteur/point/${id}`, 'GET');
    return response.data || null;
  },

  /**
   * Récupérer les informations d'un point avec le problème associé
   */
  getPointWithProbleme: async (pointId) => {
    const response = await callApi(`/api/visiteur/point/${pointId}`, 'GET');
    return response.data || null;
  },

  /**
   * Récupérer tous les problèmes
   */
  getAllProblemes: async () => {
    const response = await callApi('/api/map/problemes', 'GET');
    return response.data || [];
  },

  /**
   * Récupérer un signalement spécifique
   */
  getSignalement: async (id) => {
    const response = await callApi(`/api/map/signalements/${id}`, 'GET');
    return response.data || null;
  },

  /**
   * Récupérer un problème spécifique
   */
  getProbleme: async (id) => {
    const response = await callApi(`/api/map/problemes/${id}`, 'GET');
    return response.data || null;
  }
};

export default pointVisiteurApi;
