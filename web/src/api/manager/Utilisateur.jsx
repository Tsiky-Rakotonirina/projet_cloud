import { callApi } from '@util/api';

// Données par défaut pour l'affichage
const defaultUsers = [
  { id: 1, email: 'user1@example.com', githubName: 'user1_github', age: 25 },
  { id: 2, email: 'blocked@test.com', githubName: 'blocked_user', age: 32 },
  { id: 3, email: 'spam@mail.com', githubName: 'spammer123', age: 19 },
];

/**
 * API pour la gestion des utilisateurs
 */
export const utilisateurApi = {
  /**
   * Récupérer tous les utilisateurs
   */
  getAll: async (params) => {
    try {
      const data = await callApi('/api/utilisateurs', 'GET', null, params);
      return Array.isArray(data) ? data : defaultUsers;
    } catch (error) {
      console.warn('API Utilisateurs indisponible, données de démonstration utilisées');
      return defaultUsers;
    }
  },

  /**
   * Récupérer les utilisateurs bloqués
   */
  getBlocked: async () => {
    try {
      const data = await callApi('/api/utilisateurs/blocked', 'GET');
      return Array.isArray(data) ? data : defaultUsers;
    } catch (error) {
      console.warn('API Utilisateurs bloqués indisponible, données de démonstration utilisées');
      return defaultUsers;
    }
  },

  /**
   * Récupérer un utilisateur par ID
   */
  getById: async (id) => {
    try {
      return await callApi(`/api/utilisateurs/${id}`, 'GET');
    } catch (error) {
      return defaultUsers.find(u => u.id === id) || null;
    }
  },

  /**
   * Créer un nouvel utilisateur
   */
  create: async (userData) => {
    return await callApi('/api/utilisateurs', 'POST', userData);
  },

  /**
   * Mettre à jour un utilisateur
   */
  update: async (id, userData) => {
    return await callApi(`/api/utilisateurs/${id}`, 'PUT', userData);
  },

  /**
   * Supprimer un utilisateur
   */
  delete: async (id) => {
    return await callApi(`/api/utilisateurs/${id}`, 'DELETE');
  },

  /**
   * Débloquer un utilisateur
   */
  unblock: async (id) => {
    return await callApi(`/api/utilisateurs/${id}/unblock`, 'PATCH');
  },

  /**
   * Changer le statut d'un utilisateur
   */
  changeStatus: async (id, status) => {
    return await callApi(`/api/utilisateurs/${id}/status`, 'PATCH', { status });
  },

  /**
   * Changer le rôle d'un utilisateur
   */
  changeRole: async (id, role) => {
    return await callApi(`/api/utilisateurs/${id}/role`, 'PATCH', { role });
  }
};

export default utilisateurApi;
