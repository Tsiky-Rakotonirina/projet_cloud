const entrepriseService = require('../services/entreprise.service');

const entrepriseController = {
  async getAllEntreprises(req, res, next) {
    try {
      const entreprises = await entrepriseService.getAllEntreprises();
      return res.sendSuccess('Entreprises récupérées', entreprises, 200);
    } catch (error) {
      next(error);
    }
  },

  async getEntrepriseById(req, res, next) {
    try {
      const { id } = req.params;
      const entreprise = await entrepriseService.getEntrepriseById(parseInt(id));

      if (!entreprise) {
        return res.sendError('Entreprise non trouvée', { code: 'ENTREPRISE_NOT_FOUND' }, 404);
      }

      return res.sendSuccess('Entreprise récupérée', entreprise, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 400);
      }
      next(error);
    }
  },

  async createEntreprise(req, res, next) {
    try {
      const { nom, adresse, telephone } = req.body;

      if (!nom) {
        return res.sendError('Le nom de l\'entreprise est requis', { code: 'MISSING_FIELD' }, 400);
      }

      const entreprise = await entrepriseService.createEntreprise({ nom, adresse, telephone });
      return res.sendSuccess('Entreprise créée', entreprise, 201);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 400);
      }
      next(error);
    }
  },

  async updateEntreprise(req, res, next) {
    try {
      const { id } = req.params;
      const entreprise = await entrepriseService.updateEntreprise(parseInt(id), req.body);
      return res.sendSuccess('Entreprise mise à jour', entreprise, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 400);
      }
      next(error);
    }
  },

  async deleteEntreprise(req, res, next) {
    try {
      const { id } = req.params;
      await entrepriseService.deleteEntreprise(parseInt(id));
      return res.sendSuccess('Entreprise supprimée', null, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 400);
      }
      next(error);
    }
  },

  async getEntrepriseProblemes(req, res, next) {
    try {
      const { id } = req.params;
      const problemes = await entrepriseService.getEntrepriseProblemes(parseInt(id));
      return res.sendSuccess('Problèmes de l\'entreprise récupérés', problemes, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 400);
      }
      next(error);
    }
  }
};

module.exports = entrepriseController;
