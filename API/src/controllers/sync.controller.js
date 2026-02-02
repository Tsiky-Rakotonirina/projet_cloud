const syncService = require('../services/sync.service');

const syncController = {
  /**
   * PUSH: Synchroniser les utilisateurs de Firebase vers PostgreSQL
   * Synchronise également les tables associées : profils, statuts utilisateur
   */
  async pushUtilisateurs(req, res, next) {
    try {
      const results = {
        profils: null,
        statuts_utilisateur: null,
        utilisateurs: null,
      };

      // 1. D'abord synchroniser les profils (table de référence)
      console.log('\n🔄 === SYNC PROFILS (dépendance utilisateurs) ===');
      results.profils = await syncService.pushProfilsToPostgres();

      // 2. Synchroniser les statuts d'utilisateur (table de référence)
      console.log('\n🔄 === SYNC STATUTS UTILISATEUR (dépendance utilisateurs) ===');
      results.statuts_utilisateur = await syncService.pushStatutsUtilisateurToPostgres();

      // 3. Ensuite synchroniser les utilisateurs
      console.log('\n🔄 === SYNC UTILISATEURS ===');
      results.utilisateurs = await syncService.pushUtilisateursToPostgres();

      return res.sendSuccess('Utilisateurs et tables associées synchronisés Firebase → PostgreSQL', {
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
   * PULL: Synchroniser les utilisateurs de PostgreSQL vers Firebase
   * Synchronise également les tables associées : profils, statuts utilisateur
   */
  async pullUtilisateurs(req, res, next) {
    try {
      const results = {
        profils: null,
        statuts_utilisateur: null,
        utilisateurs: null,
      };

      // 1. D'abord synchroniser les profils (table de référence)
      console.log('\n🔄 === SYNC PROFILS (dépendance utilisateurs) ===');
      results.profils = await syncService.pullProfilsToFirebase();

      // 2. Synchroniser les statuts d'utilisateur (table de référence)
      console.log('\n🔄 === SYNC STATUTS UTILISATEUR (dépendance utilisateurs) ===');
      results.statuts_utilisateur = await syncService.pullStatutsUtilisateurToFirebase();

      // 3. Ensuite synchroniser les utilisateurs
      console.log('\n🔄 === SYNC UTILISATEURS ===');
      results.utilisateurs = await syncService.pullUtilisateursToFirebase();

      return res.sendSuccess('Utilisateurs et tables associées synchronisés PostgreSQL → Firebase', {
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
   * Obtenir le statut de la synchronisation
   */
  async getSyncStatus(req, res, next) {
    try {
      const result = await syncService.getSyncStatus();

      return res.sendSuccess('Statut de synchronisation récupéré', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },
};

module.exports = syncController;
