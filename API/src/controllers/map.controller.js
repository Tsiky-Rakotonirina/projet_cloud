const mapService = require('../services/map.service');

const mapController = {
  async getSignalements(req, res, next) {
    try {
      const signalements = await mapService.getAllSignalements();
      return res.sendSuccess('Signalements récupérés', signalements, 200);
    } catch (error) {
      next(error);
    }
  },

  async getSignalementById(req, res, next) {
    try {
      const { id } = req.params;
      const signalement = await mapService.getSignalementById(parseInt(id));
      return res.sendSuccess('Signalement récupéré', signalement, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 400);
      }
      next(error);
    }
  },

  async getProblemes(req, res, next) {
    try {
      const problemes = await mapService.getAllProblemes();
      return res.sendSuccess('Problemes récupérés', problemes, 200);
    } catch (error) {
      next(error);
    }
  },

  async getProblemeById(req, res, next) {
    try {
      const { id } = req.params;
      const probleme = await mapService.getProblemeById(parseInt(id));
      return res.sendSuccess('Probleme récupéré', probleme, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 400);
      }
      next(error);
    }
  },

  async getVilles(req, res, next) {
    try {
      const villes = await mapService.getVilles();
      return res.sendSuccess('Villes récupérées', villes, 200);
    } catch (error) {
      next(error);
    }
  },

  async getStats(req, res, next) {
    try {
      const stats = await mapService.getMapStats();
      return res.sendSuccess('Statistiques récupérées', stats, 200);
    } catch (error) {
      next(error);
    }
  },

  async getMapData(req, res, next) {
    try {
      const data = await mapService.getMapData();
      return res.sendSuccess('Données cartographiques récupérées', data, 200);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = mapController;
