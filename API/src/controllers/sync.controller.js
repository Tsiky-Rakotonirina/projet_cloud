const syncService = require('../services/sync.service');

const syncController = {
  /**
   * PUSH: Synchroniser les utilisateurs de Firebase vers PostgreSQL
   */
  async pushUtilisateurs(req, res, next) {
    try {
      const result = await syncService.pushUtilisateursToPostgres();

      return res.sendSuccess('Utilisateurs synchronisés Firebase → PostgreSQL', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PULL: Synchroniser les utilisateurs de PostgreSQL vers Firebase
   */
  async pullUtilisateurs(req, res, next) {
    try {
      const result = await syncService.pullUtilisateursToFirebase();

      return res.sendSuccess('Utilisateurs synchronisés PostgreSQL → Firebase', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PUSH: Synchroniser les signalements de Firebase vers PostgreSQL
   */
  async pushSignalements(req, res, next) {
    try {
      const result = await syncService.pushSignalementsToPostgres();

      return res.sendSuccess('Signalements synchronisés Firebase → PostgreSQL', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 500);
      }
      next(error);
    }
  },

  /**
   * PULL: Synchroniser les signalements de PostgreSQL vers Firebase
   */
  async pullSignalements(req, res, next) {
    try {
      const result = await syncService.pullSignalementsToFirebase();

      return res.sendSuccess('Signalements synchronisés PostgreSQL → Firebase', result, 200);
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
