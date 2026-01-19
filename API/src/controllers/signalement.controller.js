const signalementService = require('../services/signalement.service');

const signalementController = {
  async getSignalementWithDetails(req, res, next) {
    try {
      const { signalementId } = req.params;
      const signalement = await signalementService.getSignalementWithDetails(parseInt(signalementId));

      if (!signalement) {
        return res.sendError('Signalement non trouvé', { code: 'SIGNALEMENT_NOT_FOUND' }, 404);
      }

      return res.sendSuccess('Détails du signalement récupérés', signalement, 200);
    } catch (error) {
      next(error);
    }
  },

  async getAllSignalements(req, res, next) {
    try {
      const signalements = await signalementService.getAllSignalements();
      return res.sendSuccess('Signalements récupérés', signalements, 200);
    } catch (error) {
      next(error);
    }
  },

  async updateSignalementStatut(req, res, next) {
    try {
      const { signalementId } = req.params;
      const { statut_id, utilisateur_id } = req.body;

      if (!statut_id || !utilisateur_id) {
        return res.sendError('statut_id et utilisateur_id sont requis', { code: 'MISSING_FIELDS' }, 400);
      }

      const result = await signalementService.updateSignalementStatut(
        parseInt(signalementId),
        parseInt(statut_id),
        parseInt(utilisateur_id)
      );

      return res.sendSuccess('Statut du signalement mis à jour', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 400);
      }
      next(error);
    }
  },

  async getSignalementStatutHistory(req, res, next) {
    try {
      const { signalementId } = req.params;
      const history = await signalementService.getSignalementStatutHistory(parseInt(signalementId));
      return res.sendSuccess('Historique des statuts du signalement', history, 200);
    } catch (error) {
      next(error);
    }
  },

  async getSignalementsByStatut(req, res, next) {
    try {
      const { statut } = req.params;
      const signalements = await signalementService.getSignalementsByStatut(statut);
      return res.sendSuccess(`Signalements avec statut "${statut}"`, signalements, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 400);
      }
      next(error);
    }
  },
};

module.exports = signalementController;
