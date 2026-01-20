import { callApi } from '@util/api';

/**
 * API pour l'authentification
 */
export const authApi = {
  /**
   * Connexion utilisateur
   */
  login: async (email, password) => {
    return await callApi('/api/auth/login', 'POST', { email, password });
  },

  /**
   * Inscription utilisateur
   */
  register: async (userData) => {
    return await callApi('/api/auth/register', 'POST', userData);
  },

  /**
   * Déconnexion
   */
  logout: async () => {
    return await callApi('/api/auth/logout', 'POST');
  },

  /**
   * Vérifier le token
   */
  verifyToken: async () => {
    return await callApi('/api/auth/verify', 'GET');
  },

  /**
   * Réinitialiser le mot de passe
   */
  resetPassword: async (email) => {
    return await callApi('/api/auth/reset-password', 'POST', { email });
  }
};

export default authApi;
