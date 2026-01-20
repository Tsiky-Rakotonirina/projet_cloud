import { callApi } from '@util/api';

/**
 * API pour la gestion des utilisateurs
 */
export const utilisateurApi = {
  /**
   * Récupérer tous les utilisateurs
   */
  getAll: async (params) => {
    const response = await callApi('/api/admin/blocked-users', 'GET', null, params);
    return response.data || [];
  },

  /**
   * Récupérer les utilisateurs bloqués
   */
  getBlocked: async () => {
    const response = await callApi('/api/admin/blocked-users', 'GET');
    return response.data || [];
  },

  /**
   * Récupérer un utilisateur par ID
   */
  getById: async (id) => {
    const response = await callApi(`/api/admin/user-status/${id}`, 'GET');
    return response.data || null;
  },

  /**
   * Bloquer un utilisateur
   */
  block: async (utilisateur_id, raison) => {
    const response = await callApi('/api/admin/block', 'POST', { utilisateur_id, raison });
    return response.data;
  },

  /**
   * Débloquer un utilisateur
   */
  unblock: async (utilisateur_id) => {
    const response = await callApi('/api/admin/unblock', 'POST', { utilisateur_id });
    return response.data;
  },

  /**
   * Obtenir le statut d'un utilisateur
   */
  getStatus: async (utilisateur_id) => {
    const response = await callApi(`/api/admin/user-status/${utilisateur_id}`, 'GET');
    return response.data;
  },
  /**
   * Inscrire un nouvel utilisateur (admin only)
   */
  register: async (email, password, date_naissance = null, profil_id = 2) => {
    const response = await callApi('/api/admin/register', 'POST', { 
      email, 
      password, 
      date_naissance, 
      profil_id 
    });
    return response.data;
  },};

export default utilisateurApi;
