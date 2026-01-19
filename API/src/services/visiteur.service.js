const db = require('../models');

const visiteurService = {
  async getProblemeCurrentStatut(problemeId) {
    const historique = await db.ProblemeHistorique.findOne({
      where: { probleme_id: problemeId },
      include: {
        model: db.ProblemeStatut,
        as: 'probleme_statut',
        attributes: ['libelle', 'descri', 'pourcentage'],
      },
      order: [['date_historique', 'DESC']],
    });

    return historique ? historique.probleme_statut : null;
  },

  async getSummaryStats() {
    // Compter tous les points
    const totalPoints = await db.Point.count();

    // Récupérer tous les problèmes avec leur surface et budget
    const problemes = await db.Probleme.findAll({
      attributes: ['id_problemes', 'surface', 'budget'],
      include: {
        model: db.Signalement,
        as: 'signalement',
        required: true,
        attributes: [],
      },
    });

    const totalSurface = problemes.reduce((sum, p) => sum + (p.surface || 0), 0);
    const totalBudget = problemes.reduce((sum, p) => sum + (p.budget || 0), 0);

    // Récupérer le statut actuel de chaque problème pour calculer l'avancement moyen
    const statusPercentages = await Promise.all(
      problemes.map(async (p) => {
        const statut = await this.getProblemeCurrentStatut(p.id_problemes);
        return statut?.pourcentage || 0;
      })
    );

    const averageProgression =
      statusPercentages.length > 0
        ? Math.round(statusPercentages.reduce((sum, p) => sum + p, 0) / statusPercentages.length)
        : 0;

    return {
      total_points: totalPoints,
      total_surface: parseFloat(totalSurface.toFixed(2)),
      total_budget: parseFloat(totalBudget.toFixed(2)),
      avancement_moyen_pourcent: averageProgression,
      nombre_problemes: problemes.length,
    };
  },

  async getPointWithProbleme(pointId) {
    const point = await db.Point.findByPk(pointId, {
      attributes: [
        'id_points',
        [
          db.sequelize.sequelize.fn(
            'ST_AsGeoJSON',
            db.sequelize.col('xy')
          ),
          'geometry',
        ],
      ],
      include: [
        {
          model: db.Ville,
          as: 'ville',
          attributes: ['id_villes', 'nom'],
        },
        {
          model: db.Signalement,
          as: 'signalements',
          required: true,
          attributes: ['id_signalements', 'description', 'createdAt'],
          include: [
            {
              model: db.Probleme,
              as: 'problemes',
              required: true,
              attributes: [
                'id_problemes',
                'surface',
                'budget',
                'createdAt',
              ],
              include: {
                model: db.Entreprise,
                as: 'entreprise',
                attributes: ['id_entreprises', 'nom', 'adresse', 'telephone'],
              },
            },
          ],
        },
      ],
    });

    if (!point) {
      const error = new Error('Point non trouvé');
      error.code = 'POINT_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    if (!point.signalements || point.signalements.length === 0) {
      const error = new Error('Aucun signalement associé à ce point');
      error.code = 'NO_SIGNALEMENT';
      error.status = 404;
      throw error;
    }

    const signalement = point.signalements[0];

    if (!signalement.problemes || signalement.problemes.length === 0) {
      const error = new Error('Aucun problème associé à ce signalement');
      error.code = 'NO_PROBLEME';
      error.status = 404;
      throw error;
    }

    const probleme = signalement.problemes[0];
    const statut = await this.getProblemeCurrentStatut(probleme.id_problemes);

    return {
      point: {
        id_points: point.id_points,
        geometry: point.geometry ? JSON.parse(point.geometry) : null,
        ville: point.ville
          ? {
              id_villes: point.ville.id_villes,
              nom: point.ville.nom,
            }
          : null,
      },
      signalement: {
        id_signalements: signalement.id_signalements,
        description: signalement.description,
        date: signalement.createdAt,
      },
      probleme: {
        id_problemes: probleme.id_problemes,
        surface: probleme.surface,
        budget: probleme.budget,
        date: probleme.createdAt,
        statut: statut
          ? {
              libelle: statut.libelle,
              descri: statut.descri,
              pourcentage: statut.pourcentage,
            }
          : null,
        entreprise: probleme.entreprise
          ? {
              id_entreprises: probleme.entreprise.id_entreprises,
              nom: probleme.entreprise.nom,
              adresse: probleme.entreprise.adresse,
              telephone: probleme.entreprise.telephone,
            }
          : null,
      },
    };
  },
};

module.exports = visiteurService;
