const syncService = require('../services/sync.service');
const syncSessionService = require('../services/sync-session.service');

const syncController = {
  /**
   * PUSH: Synchroniser les utilisateurs de Firebase vers PostgreSQL
   * Synchronise également les tables associées : profils, statuts utilisateur
   */
  async pushUtilisateurs(req, res, next) {
    let session = null;
    const useTracking = req.query.track === 'true' || req.body.track === true;
    
    try {
      const results = {
        profils: null,
        statuts_utilisateur: null,
        utilisateurs: null,
        sessionId: null,
      };

      // Créer une session si le tracking est activé
      if (useTracking) {
        const initiatedBy = req.user?.email || req.body?.initiatedBy || 'api';
        session = await syncSessionService.createSession('push', 'utilisateurs', initiatedBy);
        await syncSessionService.startSession(session.id_sync_session);
        results.sessionId = session.id_sync_session;
      }

      // 1. D'abord synchroniser les profils (table de référence)
      console.log('\n🔄 === SYNC PROFILS (dépendance utilisateurs) ===');
      results.profils = await syncService.pushProfilsToPostgres();

      // 2. Synchroniser les statuts d'utilisateur (table de référence)
      console.log('\n🔄 === SYNC STATUTS UTILISATEUR (dépendance utilisateurs) ===');
      results.statuts_utilisateur = await syncService.pushStatutsUtilisateurToPostgres();

      // 3. Ensuite synchroniser les utilisateurs (avec session si tracking activé)
      console.log('\n🔄 === SYNC UTILISATEURS ===');
      results.utilisateurs = await syncService.pushUtilisateursToPostgres(session?.id_sync_session);

      // Marquer la session comme terminée
      if (session) {
        await syncSessionService.completeSession(session.id_sync_session);
      }

      return res.sendSuccess('Utilisateurs et tables associées synchronisés Firebase → PostgreSQL', {
        success: true,
        results,
      }, 200);
    } catch (error) {
      if (session) {
        await syncSessionService.failSession(session.id_sync_session, error.message);
      }
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PULL: Synchroniser les utilisateurs de PostgreSQL vers Firebase
   * Synchronise également les tables associées : profils, statuts utilisateur
   */
  async pullUtilisateurs(req, res, next) {
    let session = null;
    const useTracking = req.query.track === 'true' || req.body.track === true;
    
    try {
      const results = {
        profils: null,
        statuts_utilisateur: null,
        utilisateurs: null,
        sessionId: null,
      };

      // Créer une session si le tracking est activé
      if (useTracking) {
        const initiatedBy = req.user?.email || req.body?.initiatedBy || 'api';
        session = await syncSessionService.createSession('pull', 'utilisateurs', initiatedBy);
        await syncSessionService.startSession(session.id_sync_session);
        results.sessionId = session.id_sync_session;
      }

      // 1. D'abord synchroniser les profils (table de référence)
      console.log('\n🔄 === SYNC PROFILS (dépendance utilisateurs) ===');
      results.profils = await syncService.pullProfilsToFirebase();

      // 2. Synchroniser les statuts d'utilisateur (table de référence)
      console.log('\n🔄 === SYNC STATUTS UTILISATEUR (dépendance utilisateurs) ===');
      results.statuts_utilisateur = await syncService.pullStatutsUtilisateurToFirebase();

      // 3. Ensuite synchroniser les utilisateurs (avec session si tracking activé)
      console.log('\n🔄 === SYNC UTILISATEURS ===');
      results.utilisateurs = await syncService.pullUtilisateursToFirebase(session?.id_sync_session);

      // Marquer la session comme terminée
      if (session) {
        await syncSessionService.completeSession(session.id_sync_session);
      }

      return res.sendSuccess('Utilisateurs et tables associées synchronisés PostgreSQL → Firebase', {
        success: true,
        results,
      }, 200);
    } catch (error) {
      if (session) {
        await syncSessionService.failSession(session.id_sync_session, error.message);
      }
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PUSH: Synchroniser les signalements de Firebase vers PostgreSQL
   * Synchronise également les tables associées : signalement_statuts, utilisateurs (si besoin)
   */
  async pushSignalements(req, res, next) {
    try {
      const results = {
        signalement_statuts: null,
        villes: null,
        signalements: null,
      };

      // 1. D'abord synchroniser les statuts de signalement (table de référence)
      console.log('\n🔄 === SYNC STATUTS SIGNALEMENT (dépendance signalements) ===');
      results.signalement_statuts = await syncService.pushSignalementStatutsToPostgres();

      // 2. Synchroniser les villes (pour les points)
      console.log('\n🔄 === SYNC VILLES (dépendance points) ===');
      results.villes = await syncService.pushVillesToPostgres();

      // 3. Ensuite synchroniser les signalements
      console.log('\n🔄 === SYNC SIGNALEMENTS ===');
      results.signalements = await syncService.pushSignalementsToPostgres();

      return res.sendSuccess('Signalements et tables associées synchronisés Firebase → PostgreSQL', {
        success: true,
        results,
      }, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PULL: Synchroniser les signalements de PostgreSQL vers Firebase
   * Synchronise également les tables associées : signalement_statuts, villes
   */
  async pullSignalements(req, res, next) {
    try {
      const results = {
        signalement_statuts: null,
        villes: null,
        signalements: null,
      };

      // 1. D'abord synchroniser les statuts de signalement (table de référence)
      console.log('\n🔄 === SYNC STATUTS SIGNALEMENT (dépendance signalements) ===');
      results.signalement_statuts = await syncService.pullSignalementStatutsToFirebase();

      // 2. Synchroniser les villes (pour les points)
      console.log('\n🔄 === SYNC VILLES (dépendance points) ===');
      results.villes = await syncService.pullVillesToFirebase();

      // 3. Ensuite synchroniser les signalements
      console.log('\n🔄 === SYNC SIGNALEMENTS ===');
      results.signalements = await syncService.pullSignalementsToFirebase();

      return res.sendSuccess('Signalements et tables associées synchronisés PostgreSQL → Firebase', {
        success: true,
        results,
      }, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * Synchronisation complète bidirectionnelle
   */
  async syncAll(req, res, next) {
    try {
      const result = await syncService.syncAll();

      return res.sendSuccess('Synchronisation complète réussie', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PUSH: Synchroniser les problèmes de Firebase vers PostgreSQL
   * Synchronise également les tables associées : entreprises, probleme_statuts
   */
  async pushProblemes(req, res, next) {
    try {
      const results = {
        entreprises: null,
        probleme_statuts: null,
        problemes: null,
      };

      // 1. D'abord synchroniser les entreprises (table de référence)
      console.log('\n🔄 === SYNC ENTREPRISES (dépendance problèmes) ===');
      results.entreprises = await syncService.pushEntreprisesToPostgres();

      // 2. Synchroniser les statuts de problème (table de référence)
      console.log('\n🔄 === SYNC STATUTS PROBLÈME (dépendance problèmes) ===');
      results.probleme_statuts = await syncService.pushProblemeStatutsToPostgres();

      // 3. Ensuite synchroniser les problèmes
      console.log('\n🔄 === SYNC PROBLÈMES ===');
      results.problemes = await syncService.pushProblemesToPostgres();

      return res.sendSuccess('Problèmes et tables associées synchronisés Firebase → PostgreSQL', {
        success: true,
        results,
      }, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PULL: Synchroniser les problèmes de PostgreSQL vers Firebase
   * Synchronise également les tables associées : entreprises, probleme_statuts
   */
  async pullProblemes(req, res, next) {
    try {
      const results = {
        entreprises: null,
        probleme_statuts: null,
        problemes: null,
      };

      // 1. D'abord synchroniser les entreprises (table de référence)
      console.log('\n🔄 === SYNC ENTREPRISES (dépendance problèmes) ===');
      results.entreprises = await syncService.pullEntreprisesToFirebase();

      // 2. Synchroniser les statuts de problème (table de référence)
      console.log('\n🔄 === SYNC STATUTS PROBLÈME (dépendance problèmes) ===');
      results.probleme_statuts = await syncService.pullProblemeStatutsToFirebase();

      // 3. Ensuite synchroniser les problèmes
      console.log('\n🔄 === SYNC PROBLÈMES ===');
      results.problemes = await syncService.pullProblemesToFirebase();

      return res.sendSuccess('Problèmes et tables associées synchronisés PostgreSQL → Firebase', {
        success: true,
        results,
      }, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * Obtenir le statut de la synchronisation (amélioré avec sessions actives)
   */
  async getSyncStatus(req, res, next) {
    try {
      // Récupérer le statut de base
      const result = await syncService.getSyncStatus();
      
      // Ajouter les informations sur les sessions actives
      try {
        const activeSessions = await syncSessionService.getActiveSessions();
        const globalStatus = await syncSessionService.getGlobalSyncStatus();
        
        result.activeSessions = activeSessions;
        result.isRunning = activeSessions.length > 0;
        result.last24hStats = globalStatus.last24hStats;
        result.lastSuccessfulSyncs = globalStatus.lastSuccessful;
      } catch (sessionError) {
        // Si les tables de session n'existent pas encore, ignorer
        console.warn('Tables de session non disponibles:', sessionError.message);
        result.activeSessions = [];
        result.isRunning = false;
      }

      return res.sendSuccess('Statut de synchronisation récupéré', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PUSH: Synchroniser les entreprises de Firebase vers PostgreSQL
   */
  async pushEntreprises(req, res, next) {
    try {
      console.log('\n🔄 === SYNC ENTREPRISES ===');
      const result = await syncService.pushEntreprisesToPostgres();
      return res.sendSuccess('Entreprises synchronisées Firebase → PostgreSQL', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PULL: Synchroniser les entreprises de PostgreSQL vers Firebase
   */
  async pullEntreprises(req, res, next) {
    try {
      console.log('\n🔄 === SYNC ENTREPRISES ===');
      const result = await syncService.pullEntreprisesToFirebase();
      return res.sendSuccess('Entreprises synchronisées PostgreSQL → Firebase', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PUSH: Synchroniser les villes de Firebase vers PostgreSQL
   */
  async pushVilles(req, res, next) {
    try {
      console.log('\n🔄 === SYNC VILLES ===');
      const result = await syncService.pushVillesToPostgres();
      return res.sendSuccess('Villes synchronisées Firebase → PostgreSQL', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PULL: Synchroniser les villes de PostgreSQL vers Firebase
   */
  async pullVilles(req, res, next) {
    try {
      console.log('\n🔄 === SYNC VILLES ===');
      const result = await syncService.pullVillesToFirebase();
      return res.sendSuccess('Villes synchronisées PostgreSQL → Firebase', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PUSH: Synchroniser les profils de Firebase vers PostgreSQL
   */
  async pushProfils(req, res, next) {
    try {
      console.log('\n🔄 === SYNC PROFILS ===');
      const result = await syncService.pushProfilsToPostgres();
      return res.sendSuccess('Profils synchronisés Firebase → PostgreSQL', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PULL: Synchroniser les profils de PostgreSQL vers Firebase
   */
  async pullProfils(req, res, next) {
    try {
      console.log('\n🔄 === SYNC PROFILS ===');
      const result = await syncService.pullProfilsToFirebase();
      return res.sendSuccess('Profils synchronisés PostgreSQL → Firebase', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PUSH: Synchroniser les statuts utilisateur de Firebase vers PostgreSQL
   */
  async pushStatutsUtilisateur(req, res, next) {
    try {
      console.log('\n🔄 === SYNC STATUTS UTILISATEUR ===');
      const result = await syncService.pushStatutsUtilisateurToPostgres();
      return res.sendSuccess('Statuts utilisateur synchronisés Firebase → PostgreSQL', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PULL: Synchroniser les statuts utilisateur de PostgreSQL vers Firebase
   */
  async pullStatutsUtilisateur(req, res, next) {
    try {
      console.log('\n🔄 === SYNC STATUTS UTILISATEUR ===');
      const result = await syncService.pullStatutsUtilisateurToFirebase();
      return res.sendSuccess('Statuts utilisateur synchronisés PostgreSQL → Firebase', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PUSH: Synchroniser les statuts de signalement de Firebase vers PostgreSQL
   */
  async pushSignalementStatuts(req, res, next) {
    try {
      console.log('\n🔄 === SYNC STATUTS SIGNALEMENT ===');
      const result = await syncService.pushSignalementStatutsToPostgres();
      return res.sendSuccess('Statuts signalement synchronisés Firebase → PostgreSQL', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PULL: Synchroniser les statuts de signalement de PostgreSQL vers Firebase
   */
  async pullSignalementStatuts(req, res, next) {
    try {
      console.log('\n🔄 === SYNC STATUTS SIGNALEMENT ===');
      const result = await syncService.pullSignalementStatutsToFirebase();
      return res.sendSuccess('Statuts signalement synchronisés PostgreSQL → Firebase', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PUSH: Synchroniser les statuts de problème de Firebase vers PostgreSQL
   */
  async pushProblemeStatuts(req, res, next) {
    try {
      console.log('\n🔄 === SYNC STATUTS PROBLÈME ===');
      const result = await syncService.pushProblemeStatutsToPostgres();
      return res.sendSuccess('Statuts problème synchronisés Firebase → PostgreSQL', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PULL: Synchroniser les statuts de problème de PostgreSQL vers Firebase
   */
  async pullProblemeStatuts(req, res, next) {
    try {
      console.log('\n🔄 === SYNC STATUTS PROBLÈME ===');
      const result = await syncService.pullProblemeStatutsToFirebase();
      return res.sendSuccess('Statuts problème synchronisés PostgreSQL → Firebase', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },
};

module.exports = syncController;
