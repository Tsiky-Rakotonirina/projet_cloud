import { callApi } from '@util/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * API pour la synchronisation des données Firebase <-> PostgreSQL
 */
export const synchronisationApi = {
  /**
   * Récupérer l'état de la synchronisation
   */
  getStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/api/sync/status`);
    const data = await response.json();
    return {
      lastSync: data.data?.status?.derniere_synchronisation,
      utilisateurs: data.data?.status?.utilisateurs,
      signalements: data.data?.status?.signalements
    };
  },

  /**
   * Démarrer une synchronisation complète (PULL + PUSH)
   */
  syncAll: async () => {
    const results = {
      utilisateurs_pull: null,
      utilisateurs_push: null,
      signalements_pull: null,
      signalements_push: null,
      errors: []
    };

    try {
      // Synchroniser utilisateurs (PULL puis PUSH)
      const userPull = await fetch(`${API_BASE_URL}/api/sync/users/pull`, { method: 'POST' });
      results.utilisateurs_pull = await userPull.json();
    } catch (e) {
      results.errors.push({ step: 'utilisateurs_pull', error: e.message });
    }

    try {
      const userPush = await fetch(`${API_BASE_URL}/api/sync/users/push`, { method: 'POST' });
      results.utilisateurs_push = await userPush.json();
    } catch (e) {
      results.errors.push({ step: 'utilisateurs_push', error: e.message });
    }

    try {
      // Synchroniser signalements (PULL puis PUSH)
      const sigPull = await fetch(`${API_BASE_URL}/api/sync/signalements/pull`, { method: 'POST' });
      results.signalements_pull = await sigPull.json();
    } catch (e) {
      results.errors.push({ step: 'signalements_pull', error: e.message });
    }

    try {
      const sigPush = await fetch(`${API_BASE_URL}/api/sync/signalements/push`, { method: 'POST' });
      results.signalements_push = await sigPush.json();
    } catch (e) {
      results.errors.push({ step: 'signalements_push', error: e.message });
    }

    return results;
  },

  /**
   * Synchroniser les utilisateurs (PULL + PUSH)
   */
  syncUtilisateurs: async () => {
    const results = { pull: null, push: null };

    // PULL: PostgreSQL → Firebase
    const pullRes = await fetch(`${API_BASE_URL}/api/sync/users/pull`, { method: 'POST' });
    results.pull = await pullRes.json();
    
    // PUSH: Firebase → PostgreSQL
    const pushRes = await fetch(`${API_BASE_URL}/api/sync/users/push`, { method: 'POST' });
    results.push = await pushRes.json();
    
    return results;
  },

  /**
   * Synchroniser les points visiteurs
   */
  syncPoints: async () => {
    return { message: 'Synchronisation des points non implémentée' };
  },

  /**
   * Synchroniser les signalements (PULL + PUSH)
   */
  syncSignalements: async () => {
    const results = { pull: null, push: null };

    // PULL: PostgreSQL → Firebase
    const pullRes = await fetch(`${API_BASE_URL}/api/sync/signalements/pull`, { method: 'POST' });
    results.pull = await pullRes.json();
    
    // PUSH: Firebase → PostgreSQL
    const pushRes = await fetch(`${API_BASE_URL}/api/sync/signalements/push`, { method: 'POST' });
    results.push = await pushRes.json();
    
    return results;
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
