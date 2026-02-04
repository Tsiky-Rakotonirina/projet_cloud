/**
 * Contrôleur pour la gestion des sessions de synchronisation
 */
const syncSessionService = require('../services/sync-session.service');
const syncService = require('../services/sync.service');

const syncSessionController = {
  /**
   * PUSH utilisateurs avec suivi de session amélioré
   */
  async pushUtilisateursWithTracking(req, res, next) {
    let session = null;
    try {
      const initiatedBy = req.user?.email || req.body?.initiatedBy || 'api';
      
      // Créer une session de synchronisation
      session = await syncSessionService.createSession('push', 'utilisateurs', initiatedBy);
      
      // Démarrer la session
      await syncSessionService.startSession(session.id_sync_session);
      
      // Exécuter la synchronisation avec le sessionId
      const result = await syncService.pushUtilisateursToPostgres(session.id_sync_session);
      
      // Marquer comme terminé
      await syncSessionService.completeSession(session.id_sync_session);
      
      return res.sendSuccess('Synchronisation PUSH utilisateurs terminée avec suivi', {
        sessionId: session.id_sync_session,
        ...result
      }, 200);
    } catch (error) {
      // Marquer la session comme échouée si elle existe
      if (session) {
        await syncSessionService.failSession(session.id_sync_session, error.message);
      }
      
      if (error.code === 'SYNC_IN_PROGRESS') {
        return res.sendError(error.message, { 
          code: error.code,
          activeSessionId: error.sessionId 
        }, 409);
      }
      
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PULL utilisateurs avec suivi de session amélioré
   */
  async pullUtilisateursWithTracking(req, res, next) {
    let session = null;
    try {
      const initiatedBy = req.user?.email || req.body?.initiatedBy || 'api';
      
      // Créer une session de synchronisation
      session = await syncSessionService.createSession('pull', 'utilisateurs', initiatedBy);
      
      // Démarrer la session
      await syncSessionService.startSession(session.id_sync_session);
      
      // Exécuter la synchronisation avec le sessionId
      const result = await syncService.pullUtilisateursToFirebase(session.id_sync_session);
      
      // Marquer comme terminé
      await syncSessionService.completeSession(session.id_sync_session);
      
      return res.sendSuccess('Synchronisation PULL utilisateurs terminée avec suivi', {
        sessionId: session.id_sync_session,
        ...result
      }, 200);
    } catch (error) {
      if (session) {
        await syncSessionService.failSession(session.id_sync_session, error.message);
      }
      
      if (error.code === 'SYNC_IN_PROGRESS') {
        return res.sendError(error.message, { 
          code: error.code,
          activeSessionId: error.sessionId 
        }, 409);
      }
      
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * Récupérer le statut d'une session spécifique
   */
  async getSessionStatus(req, res, next) {
    try {
      const { sessionId } = req.params;
      const status = await syncSessionService.getSessionStatus(sessionId);
      return res.sendSuccess('Statut de session récupéré', status, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * Liste des utilisateurs synchronisés dans une session
   */
  async getSessionUsers(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { page, limit, status, action } = req.query;
      
      const users = await syncSessionService.getSessionUsers(sessionId, {
        page: page || 1,
        limit: limit || 50,
        status,
        action
      });
      
      return res.sendSuccess('Liste des utilisateurs synchronisés', users, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * Récupérer les sessions actives (en cours)
   */
  async getActiveSessions(req, res, next) {
    try {
      const sessions = await syncSessionService.getActiveSessions();
      return res.sendSuccess('Sessions actives récupérées', { 
        count: sessions.length,
        sessions 
      }, 200);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Historique des sessions de synchronisation
   */
  async getSessionHistory(req, res, next) {
    try {
      const { page, limit, entityType, status } = req.query;
      
      const history = await syncSessionService.getSessionHistory({
        page: page || 1,
        limit: limit || 20,
        entityType,
        status
      });
      
      return res.sendSuccess('Historique des sessions récupéré', history, 200);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Statut global de synchronisation
   */
  async getGlobalStatus(req, res, next) {
    try {
      const status = await syncSessionService.getGlobalSyncStatus();
      return res.sendSuccess('Statut global de synchronisation', status, 200);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Annuler une session en cours
   */
  async cancelSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const session = await syncSessionService.cancelSession(sessionId);
      return res.sendSuccess('Session annulée', { sessionId: session.id_sync_session }, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * Nettoyer les anciennes sessions
   */
  async cleanupSessions(req, res, next) {
    try {
      const { daysToKeep } = req.body;
      const deleted = await syncSessionService.cleanupOldSessions(daysToKeep || 30);
      return res.sendSuccess('Anciennes sessions nettoyées', { deletedCount: deleted }, 200);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Synchronisation complète avec suivi
   */
  async syncAllWithTracking(req, res, next) {
    let session = null;
    try {
      const initiatedBy = req.user?.email || req.body?.initiatedBy || 'api';
      
      // Créer une session de synchronisation complète
      session = await syncSessionService.createSession('full', 'all', initiatedBy);
      await syncSessionService.startSession(session.id_sync_session);
      
      // Exécuter la synchronisation complète
      const result = await syncService.syncAll();
      
      await syncSessionService.completeSession(session.id_sync_session);
      
      return res.sendSuccess('Synchronisation complète terminée avec suivi', {
        sessionId: session.id_sync_session,
        ...result
      }, 200);
    } catch (error) {
      if (session) {
        await syncSessionService.failSession(session.id_sync_session, error.message);
      }
      
      if (error.code === 'SYNC_IN_PROGRESS') {
        return res.sendError(error.message, { 
          code: error.code,
          activeSessionId: error.sessionId 
        }, 409);
      }
      
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  }
};

module.exports = syncSessionController;
