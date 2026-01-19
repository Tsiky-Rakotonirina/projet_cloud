const visiteurService = require('../services/visiteur.service');

const visiteurController = {
  async getPointWithProbleme(req, res, next) {
    try {
      const { pointId } = req.params;
      const data = await visiteurService.getPointWithProbleme(parseInt(pointId));
      return res.sendSuccess('Infos du point et problème associé', data, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 400);
      }
      next(error);
    }
  },

  async getSummaryStats(req, res, next) {
    try {
      const stats = await visiteurService.getSummaryStats();
      return res.sendSuccess('Statistiques de récapitulation', stats, 200);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = visiteurController;
