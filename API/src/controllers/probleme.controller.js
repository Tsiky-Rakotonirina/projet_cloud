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

      // Créer une entrée dans l'historique pour le statut initial
      await db.ProblemeHistorique.create({
        probleme_id: probleme.id_problemes,
        probleme_statut_id: probleme.probleme_statut_id,
        date_historique: new Date()
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
  },

  async getProblemeHistorique(req, res, next) {
    try {
      const { problemeId } = req.params;

      const historiques = await db.ProblemeHistorique.findAll({
        where: { probleme_id: parseInt(problemeId) },
        include: [
          {
            model: db.ProblemeStatut,
            as: 'statut',
            attributes: ['libelle', 'pourcentage']
          }
        ],
        order: [['date_historique', 'DESC']]
      });

      const result = historiques.map(h => ({
        date: h.date_historique,
        statut: h.statut?.libelle || null,
        pourcentage: h.statut?.pourcentage || 0
      }));

      return res.sendSuccess('Historique du problème', result, 200);
    } catch (error) {
      next(error);
    }
  },

  async avancerProbleme(req, res, next) {
    try {
      const { problemeId } = req.params;

      const probleme = await db.Probleme.findByPk(parseInt(problemeId), {
        include: {
          model: db.ProblemeStatut,
          as: 'statut',
          attributes: ['id_probleme_statuts', 'pourcentage']
        }
      });

      if (!probleme) {
        return res.sendError('Problème non trouvé', { code: 'PROBLEME_NOT_FOUND' }, 404);
      }

      const currentPourcentage = probleme.statut?.pourcentage || 0;

      // Trouver le prochain statut (0 -> 50 -> 100)
      let nextStatut;
      if (currentPourcentage < 50) {
        nextStatut = await db.ProblemeStatut.findOne({ where: { pourcentage: 50 } });
      } else if (currentPourcentage < 100) {
        nextStatut = await db.ProblemeStatut.findOne({ where: { pourcentage: 100 } });
      } else {
        return res.sendError('Le problème est déjà à 100%', { code: 'ALREADY_COMPLETED' }, 400);
      }

      if (!nextStatut) {
        return res.sendError('Prochain statut non trouvé', { code: 'NEXT_STATUS_NOT_FOUND' }, 500);
      }

      // Mettre à jour le problème
      await probleme.update({ probleme_statut_id: nextStatut.id_probleme_statuts });

      // Créer une entrée dans l'historique
      await db.ProblemeHistorique.create({
        probleme_id: probleme.id_problemes,
        probleme_statut_id: nextStatut.id_probleme_statuts,
        date_historique: new Date()
      });

      return res.sendSuccess('Problème avancé avec succès', {
        probleme_id: probleme.id_problemes,
        nouveau_statut: nextStatut.libelle,
        nouveau_pourcentage: nextStatut.pourcentage
      }, 200);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = problemeController;
