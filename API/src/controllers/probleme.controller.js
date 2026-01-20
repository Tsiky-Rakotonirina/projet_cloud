const db = require('../models');

const problemeController = {
  async createProbleme(req, res, next) {
    try {
      const { surface, budget, entreprise_id, signalement_id, probleme_statut_id } = req.body;

      if (!signalement_id) {
        return res.sendError('signalement_id est requis', { code: 'MISSING_SIGNALEMENT_ID' }, 400);
      }

      const probleme = await db.Probleme.create({
        surface: surface || null,
        budget: budget || null,
        entreprise_id: entreprise_id || null,
        signalement_id,
        probleme_statut_id: probleme_statut_id || 1
      });

      return res.sendSuccess('Problème créé avec succès', probleme, 201);
    } catch (error) {
      next(error);
    }
  },

  async getAllProblemes(req, res, next) {
    try {
      const problemes = await db.Probleme.findAll({
        include: [
          {
            model: db.Entreprise,
            as: 'entreprise',
            attributes: ['id_entreprises', 'nom', 'adresse', 'telephone']
          },
          {
            model: db.Signalement,
            as: 'signalement',
            attributes: ['id_signalements', 'description']
          }
        ]
      });

      return res.sendSuccess('Liste des problèmes', problemes, 200);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = problemeController;
