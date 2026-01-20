import { callApi } from '@util/api';

/**
 * API pour la synchronisation des données
 * Note: Les endpoints de synchronisation ne sont pas implémentés dans l'API backend.
 * Ces fonctions retournent des erreurs pour l'instant.
 */
export const synchronisationApi = {
  /**
   * Récupérer l'état de la synchronisation
   */
  getStatus: async () => {
    throw new Error('Endpoint de synchronisation non implémenté dans l\'API');
  },

  /**
   * Démarrer une synchronisation complète
   */
  syncAll: async () => {
    throw new Error('Endpoint de synchronisation non implémenté dans l\'API');
  },

  /**
   * Synchroniser les utilisateurs
   */
  syncUtilisateurs: async () => {
    throw new Error('Endpoint de synchronisation non implémenté dans l\'API');
  },

  /**
   * Synchroniser les points visiteurs
   */
  syncPoints: async () => {
    throw new Error('Endpoint de synchronisation non implémenté dans l\'API');
  },

  /**
   * Synchroniser les signalements
   */
  syncSignalements: async () => {
    throw new Error('Endpoint de synchronisation non implémenté dans l\'API');
  },

  /**
   * Récupérer l'historique de synchronisation
   */
  getHistory: async (params) => {
    throw new Error('Endpoint de synchronisation non implémenté dans l\'API');
  },

  /**
   * Annuler une synchronisation en cours
   */
  cancel: async () => {
    throw new Error('Endpoint de synchronisation non implémenté dans l\'API');
  }
};

export default synchronisationApi;
