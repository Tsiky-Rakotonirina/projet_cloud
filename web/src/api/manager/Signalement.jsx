import { callApi } from '@util/api';

/**
 * API pour la gestion des signalements
 */
export const signalementApi = {
  /**
   * Récupérer tous les signalements
   */
  getAll: async (params) => {
    const response = await callApi('/api/signalement', 'GET', null, params);
    return response.data || [];
  },

  /**
   * Récupérer les nouveaux signalements (à traiter)
   */
  getNouveaux: async () => {
    const response = await callApi('/api/signalement/statut/nouveau', 'GET');
    return response.data || [];
  },

  /**
   * Récupérer les signalements sans informations
   */
  getVides: async () => {
    const response = await callApi('/api/signalement/statut/vide', 'GET');
    return response.data || [];
  },

  /**
   * Récupérer les signalements complets
   */
  getComplets: async () => {
    const response = await callApi('/api/signalement/statut/complet', 'GET');
    return response.data || [];
  },

  /**
   * Récupérer un signalement par ID
   */
  getById: async (id) => {
    const response = await callApi(`/api/signalement/${id}`, 'GET');
    return response.data || null;
  },

  /**
   * Créer un nouveau signalement
   */
  create: async (data) => {
    const response = await callApi('/api/signalement', 'POST', data);
    return response.data;
  },

  /**
   * Mettre à jour un signalement
   */
  update: async (id, data) => {
    const response = await callApi(`/api/signalement/${id}`, 'PUT', data);
    return response.data;
  },

  /**
   * Supprimer un signalement
   */
  delete: async (id) => {
    const response = await callApi(`/api/signalement/${id}`, 'DELETE');
    return response.data;
  },

  /**
   * Changer le statut d'un signalement
   */
  changeStatus: async (id, statut_id, utilisateur_id) => {
    const response = await callApi(`/api/signalement/${id}/statut`, 'PUT', { statut_id, utilisateur_id });
    return response.data;
  },

  /**
   * Récupérer l'historique des statuts d'un signalement
   */
  getHistorique: async (id) => {
    const response = await callApi(`/api/signalement/${id}/historique`, 'GET');
    return response.data || [];
  },

  /**
   * Récupérer les statistiques des signalements
   */
  getStats: async () => {
    // Pas d'endpoint stats spécifique dans l'API, on calcule depuis getAll
    const response = await callApi('/api/signalement', 'GET');
    const signalements = response.data || [];
    return {
      total: signalements.length,
      pending: signalements.filter(s => s.statut === 'nouveau').length,
      resolved: signalements.filter(s => s.statut === 'termine').length,
      urgent: signalements.filter(s => s.statut === 'urgent').length
    };
  }
};

export default signalementApi;
