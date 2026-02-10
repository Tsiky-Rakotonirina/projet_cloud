import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Contexte global pour le suivi de la progression de synchronisation
 * Persiste à travers les changements de page
 */
const SyncProgressContext = createContext();

export const SyncProgressProvider = ({ children }) => {
  // État de la synchronisation
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [currentProgress, setCurrentProgress] = useState({
    percentage: 0,
    currentStep: '',
    totalItems: 0,
    processedItems: 0,
    entityType: '',
    type: ''
  });
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState(null);
  
  // Référence pour l'intervalle de polling
  const pollingIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Charge les sessions actives depuis l'API
   */
  const fetchActiveSessions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sync-session/active`);
      if (!response.ok) return;
      
      const data = await response.json();
      const sessions = Array.isArray(data.data) ? data.data : (data.data?.sessions || []);
      
      if (!isMountedRef.current) return;
      
      setActiveSessions(sessions);
      
      // Mettre à jour le statut de synchronisation
      if (sessions.length > 0) {
        setIsSyncing(true);
        
        // Calculer la progression globale
        const totalProgress = sessions.reduce((acc, session) => {
          return acc + (session.progress_percentage || 0);
        }, 0);
        
        const avgProgress = totalProgress / sessions.length;
        const latestSession = sessions[0]; // Prendre la session la plus récente
        
        setCurrentProgress({
          percentage: Math.round(avgProgress * 100) / 100,
          currentStep: latestSession.current_step || 'Synchronisation en cours...',
          totalItems: sessions.reduce((acc, s) => acc + (s.total_items || 0), 0),
          processedItems: sessions.reduce((acc, s) => acc + (s.processed_items || 0), 0),
          entityType: latestSession.entity_type || '',
          type: latestSession.type || '',
          sessionsCount: sessions.length
        });
      } else {
        // Pas de session active
        if (isSyncing) {
          // La sync vient de se terminer
          setIsSyncing(false);
          setCurrentProgress(prev => ({ ...prev, percentage: 100 }));
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des sessions actives:', err);
    }
  }, [isSyncing]);

  /**
   * Démarre le polling pour suivre la progression
   */
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    
    // Polling toutes les 1.5 secondes
    pollingIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchActiveSessions();
      }
    }, 1500);
  }, [fetchActiveSessions]);

  /**
   * Arrête le polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  /**
   * Démarre une synchronisation avec suivi de progression
   */
  const startSync = useCallback(async (syncType = 'all') => {
    setIsSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    setCurrentProgress({
      percentage: 0,
      currentStep: 'Démarrage de la synchronisation...',
      totalItems: 0,
      processedItems: 0,
      entityType: syncType,
      type: 'bidirectional'
    });

    // Démarrer le polling
    startPolling();

    try {
      // Faire les appels API selon le type de sync
      const results = await performSync(syncType);
      
      setSyncResult(results);
      setCurrentProgress(prev => ({
        ...prev,
        percentage: 100,
        currentStep: 'Synchronisation terminée'
      }));
      
      // Attendre un peu puis arrêter
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsSyncing(false);
          stopPolling();
        }
      }, 2000);
      
      return results;
    } catch (err) {
      console.error('Erreur de synchronisation:', err);
      setSyncError(err.message || 'Erreur lors de la synchronisation');
      setCurrentProgress(prev => ({
        ...prev,
        currentStep: 'Erreur de synchronisation'
      }));
      
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsSyncing(false);
          stopPolling();
        }
      }, 3000);
      
      throw err;
    }
  }, [startPolling, stopPolling]);

  /**
   * Exécute les appels de synchronisation
   */
  const performSync = async (syncType) => {
    const results = {
      type: syncType,
      steps: [],
      errors: []
    };

    const syncSteps = getSyncSteps(syncType);
    
    for (let i = 0; i < syncSteps.length; i++) {
      const step = syncSteps[i];
      
      setCurrentProgress(prev => ({
        ...prev,
        currentStep: step.label,
        percentage: Math.round((i / syncSteps.length) * 100)
      }));

      try {
        const response = await fetch(`${API_BASE_URL}${step.endpoint}`, { method: 'POST' });
        const data = await response.json();
        results.steps.push({ step: step.name, success: true, data });
      } catch (err) {
        results.errors.push({ step: step.name, error: err.message });
        results.steps.push({ step: step.name, success: false, error: err.message });
      }
    }

    return results;
  };

  /**
   * Obtient les étapes de synchronisation selon le type
   */
  const getSyncSteps = (syncType) => {
    const allSteps = [
      { name: 'users_pull', endpoint: '/api/sync/users/pull', label: 'Pull utilisateurs...' },
      { name: 'users_push', endpoint: '/api/sync/users/push', label: 'Push utilisateurs...' },
      { name: 'signalements_pull', endpoint: '/api/sync/signalements/pull', label: 'Pull signalements...' },
      { name: 'signalements_push', endpoint: '/api/sync/signalements/push', label: 'Push signalements...' },
      { name: 'problemes_pull', endpoint: '/api/sync/problemes/pull', label: 'Pull problèmes...' },
      { name: 'problemes_push', endpoint: '/api/sync/problemes/push', label: 'Push problèmes...' },
    ];

    switch (syncType) {
      case 'utilisateurs':
        return allSteps.filter(s => s.name.includes('users'));
      case 'signalements':
        return allSteps.filter(s => s.name.includes('signalements'));
      case 'problemes':
        return allSteps.filter(s => s.name.includes('problemes'));
      default:
        return allSteps;
    }
  };

  /**
   * Annuler/masquer la barre de progression
   */
  const dismissProgress = useCallback(() => {
    setIsSyncing(false);
    setSyncResult(null);
    setSyncError(null);
    stopPolling();
  }, [stopPolling]);

  // Vérifier les sessions actives au montage
  useEffect(() => {
    isMountedRef.current = true;
    fetchActiveSessions();
    
    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [fetchActiveSessions, stopPolling]);

  // Démarrer le polling si des sessions sont actives
  useEffect(() => {
    if (activeSessions.length > 0) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [activeSessions.length, startPolling, stopPolling]);

  const value = {
    isSyncing,
    activeSessions,
    currentProgress,
    syncResult,
    syncError,
    startSync,
    dismissProgress,
    refreshSessions: fetchActiveSessions
  };

  return (
    <SyncProgressContext.Provider value={value}>
      {children}
    </SyncProgressContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte de progression de synchronisation
 */
export const useSyncProgress = () => {
  const context = useContext(SyncProgressContext);
  if (!context) {
    throw new Error('useSyncProgress doit être utilisé à l\'intérieur de SyncProgressProvider');
  }
  return context;
};

export default SyncProgressContext;
