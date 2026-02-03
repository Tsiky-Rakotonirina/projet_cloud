import { callApi } from '@util/api';

/**
 * API pour la gestion des problèmes
 */
export const problemeApi = {
  /**
   * Récupérer tous les problèmes
   */
  getAll: async () => {
    const response = await callApi('/api/probleme', 'GET');
    return response.data || [];
  },

  /**
   * Créer un nouveau problème
   */
  create: async (data) => {
    const response = await callApi('/api/probleme', 'POST', data);
    return response.data;
  },

  /**
   * Récupérer l'historique des statuts d'un problème
   */
  getHistorique: async (id) => {
    const response = await callApi(`/api/probleme/${id}/historique`, 'GET');
    return response.data || [];
  },

  /**
   * Avancer le statut d'un problème au niveau suivant (0% -> 50% -> 100%)
   */
  avancer: async (id) => {
    const response = await callApi(`/api/probleme/${id}/avancer`, 'PUT');
    return response.data;
  }
};

export default problemeApi;
