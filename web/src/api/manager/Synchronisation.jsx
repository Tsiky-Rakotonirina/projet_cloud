import { callApi } from '@util/api';

// Données par défaut pour l'affichage
const defaultStatus = {
  lastSync: new Date(Date.now() - 3600000).toISOString(), // 1h ago
  status: 'idle',
  progress: 0,
  utilisateurs: { synced: 150, total: 150, lastSync: new Date(Date.now() - 7200000).toISOString() },
  points: { synced: 45, total: 52, lastSync: new Date(Date.now() - 3600000).toISOString() },
  signalements: { synced: 28, total: 30, lastSync: new Date(Date.now() - 1800000).toISOString() }
};

const defaultHistory = [
  { id: 1, type: 'full', status: 'success', startedAt: new Date(Date.now() - 86400000).toISOString(), completedAt: new Date(Date.now() - 86300000).toISOString(), itemsSynced: 225 },
  { id: 2, type: 'utilisateurs', status: 'success', startedAt: new Date(Date.now() - 172800000).toISOString(), completedAt: new Date(Date.now() - 172750000).toISOString(), itemsSynced: 150 },
  { id: 3, type: 'points', status: 'partial', startedAt: new Date(Date.now() - 259200000).toISOString(), completedAt: new Date(Date.now() - 259100000).toISOString(), itemsSynced: 40 },
];

/**
 * API pour la synchronisation des données
 */
export const synchronisationApi = {
  /**
   * Récupérer l'état de la synchronisation
   */
  getStatus: async () => {
    try {
      const data = await callApi('/api/synchronisation/status', 'GET');
      return data || defaultStatus;
    } catch (error) {
      console.warn('API Synchronisation status indisponible, données de démonstration utilisées');
      return defaultStatus;
    }
  },

  /**
   * Démarrer une synchronisation complète
   */
  syncAll: async () => {
    return await callApi('/api/synchronisation/sync-all', 'POST');
  },

  /**
   * Synchroniser les utilisateurs
   */
  syncUtilisateurs: async () => {
    return await callApi('/api/synchronisation/utilisateurs', 'POST');
  },

  /**
   * Synchroniser les points visiteurs
   */
  syncPoints: async () => {
    return await callApi('/api/synchronisation/points', 'POST');
  },

  /**
   * Synchroniser les signalements
   */
  syncSignalements: async () => {
    return await callApi('/api/synchronisation/signalements', 'POST');
  },

  /**
   * Récupérer l'historique de synchronisation
   */
  getHistory: async (params) => {
    try {
      const data = await callApi('/api/synchronisation/history', 'GET', null, params);
      return Array.isArray(data) ? data : defaultHistory;
    } catch (error) {
      console.warn('API Historique sync indisponible, données de démonstration utilisées');
      return defaultHistory;
    }
  },

  /**
   * Annuler une synchronisation en cours
   */
  cancel: async () => {
    return await callApi('/api/synchronisation/cancel', 'POST');
  }
};

export default synchronisationApi;
