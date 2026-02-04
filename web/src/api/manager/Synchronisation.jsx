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
      problemes_pull: null,
      problemes_push: null,
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

    try {
      // Synchroniser problemes (PULL puis PUSH)
      const probPull = await fetch(`${API_BASE_URL}/api/sync/problemes/pull`, { method: 'POST' });
      results.problemes_pull = await probPull.json();
    } catch (e) {
      results.errors.push({ step: 'problemes_pull', error: e.message });
    }

    try {
      const probPush = await fetch(`${API_BASE_URL}/api/sync/problemes/push`, { method: 'POST' });
      results.problemes_push = await probPush.json();
    } catch (e) {
      results.errors.push({ step: 'problemes_push', error: e.message });
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
   * Synchroniser les problèmes (PULL + PUSH)
   */
  syncProblemes: async () => {
    const results = { pull: null, push: null };

    // PULL: PostgreSQL → Firebase
    const pullRes = await fetch(`${API_BASE_URL}/api/sync/problemes/pull`, { method: 'POST' });
    results.pull = await pullRes.json();
    
    // PUSH: Firebase → PostgreSQL
    const pushRes = await fetch(`${API_BASE_URL}/api/sync/problemes/push`, { method: 'POST' });
    results.push = await pushRes.json();
    
    return results;
  },

  /**
   * Synchroniser les entreprises (PULL + PUSH)
   */
  syncEntreprises: async () => {
    const results = { pull: null, push: null };

    const pullRes = await fetch(`${API_BASE_URL}/api/sync/entreprises/pull`, { method: 'POST' });
    results.pull = await pullRes.json();
    
    const pushRes = await fetch(`${API_BASE_URL}/api/sync/entreprises/push`, { method: 'POST' });
    results.push = await pushRes.json();
    
    return results;
  },

  /**
   * Synchroniser les villes (PULL + PUSH)
   */
  syncVilles: async () => {
    const results = { pull: null, push: null };

    const pullRes = await fetch(`${API_BASE_URL}/api/sync/villes/pull`, { method: 'POST' });
    results.pull = await pullRes.json();
    
    const pushRes = await fetch(`${API_BASE_URL}/api/sync/villes/push`, { method: 'POST' });
    results.push = await pushRes.json();
    
    return results;
  },

  /**
   * Synchroniser les profils (PULL + PUSH)
   */
  syncProfils: async () => {
    const results = { pull: null, push: null };

    const pullRes = await fetch(`${API_BASE_URL}/api/sync/profils/pull`, { method: 'POST' });
    results.pull = await pullRes.json();
    
    const pushRes = await fetch(`${API_BASE_URL}/api/sync/profils/push`, { method: 'POST' });
    results.push = await pushRes.json();
    
    return results;
  },

  /**
   * Synchroniser les statuts utilisateur (PULL + PUSH)
   */
  syncStatutsUtilisateur: async () => {
    const results = { pull: null, push: null };

    const pullRes = await fetch(`${API_BASE_URL}/api/sync/statuts-utilisateur/pull`, { method: 'POST' });
    results.pull = await pullRes.json();
    
    const pushRes = await fetch(`${API_BASE_URL}/api/sync/statuts-utilisateur/push`, { method: 'POST' });
    results.push = await pushRes.json();
    
    return results;
  },

  /**
   * Synchroniser les statuts de signalement (PULL + PUSH)
   */
  syncSignalementStatuts: async () => {
    const results = { pull: null, push: null };

    const pullRes = await fetch(`${API_BASE_URL}/api/sync/signalement-statuts/pull`, { method: 'POST' });
    results.pull = await pullRes.json();
    
    const pushRes = await fetch(`${API_BASE_URL}/api/sync/signalement-statuts/push`, { method: 'POST' });
    results.push = await pushRes.json();
    
    return results;
  },

  /**
   * Synchroniser les statuts de problème (PULL + PUSH)
   */
  syncProblemeStatuts: async () => {
    const results = { pull: null, push: null };

    const pullRes = await fetch(`${API_BASE_URL}/api/sync/probleme-statuts/pull`, { method: 'POST' });
    results.pull = await pullRes.json();
    
    const pushRes = await fetch(`${API_BASE_URL}/api/sync/probleme-statuts/push`, { method: 'POST' });
    results.push = await pushRes.json();
    
    return results;
  },

  // ============================================
  // NOUVELLES FONCTIONS AVEC TRACKING DÉTAILLÉ
  // ============================================

  /**
   * Récupérer le statut global des sessions de synchronisation
   */
  getGlobalStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/api/sync-session/global-status`);
    const data = await response.json();
    return data.data;
  },

  /**
   * Récupérer les sessions actives (en cours)
   */
  getActiveSessions: async () => {
    const response = await fetch(`${API_BASE_URL}/api/sync-session/active`);
    const data = await response.json();
    return data.data;
  },

  /**
   * Récupérer l'historique des sessions
   */
  getSessionHistory: async (page = 1, limit = 20, status = null) => {
    let url = `${API_BASE_URL}/api/sync-session/history?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.data;
  },

  /**
   * Récupérer les détails d'une session spécifique
   */
  getSessionDetails: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/api/sync-session/${sessionId}`);
    const data = await response.json();
    return data.data;
  },

  /**
   * Récupérer la liste des utilisateurs synchronisés dans une session
   */
  getSessionUsers: async (sessionId, page = 1, limit = 50, status = null, action = null) => {
    let url = `${API_BASE_URL}/api/sync-session/${sessionId}/users?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (action) url += `&action=${action}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.data;
  },

  /**
   * PUSH utilisateurs avec tracking détaillé
   */
  pushUtilisateursWithTracking: async (initiatedBy = 'web') => {
    const response = await fetch(`${API_BASE_URL}/api/sync-session/users/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initiatedBy })
    });
    const data = await response.json();
    return data;
  },

  /**
   * PULL utilisateurs avec tracking détaillé
   */
  pullUtilisateursWithTracking: async (initiatedBy = 'web') => {
    const response = await fetch(`${API_BASE_URL}/api/sync-session/users/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initiatedBy })
    });
    const data = await response.json();
    return data;
  },

  /**
   * Synchronisation complète avec tracking
   */
  syncAllWithTracking: async (initiatedBy = 'web') => {
    const response = await fetch(`${API_BASE_URL}/api/sync-session/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initiatedBy })
    });
    const data = await response.json();
    return data;
  },

  /**
   * Annuler une session en cours
   */
  cancelSession: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/api/sync-session/${sessionId}/cancel`, {
      method: 'POST'
    });
    const data = await response.json();
    return data;
  },
};

export default synchronisationApi;
