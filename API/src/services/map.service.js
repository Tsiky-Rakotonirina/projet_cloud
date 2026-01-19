const db = require('../models');
const { Op } = require('sequelize');

const mapService = {
  async getAllSignalements() {
    const signalements = await db.Signalement.findAll({
      attributes: [
        'id_signalements',
        'description',
        [
          db.sequelize.sequelize.fn(
            'ST_AsGeoJSON',
            db.sequelize.col('Point.xy')
          ),
          'geometry',
        ],
        'createdAt',
      ],
      include: [
        {
          model: db.Point,
          as: 'point',
          attributes: [],
          required: true,
        },
        {
          model: db.SignalementStatut,
          as: 'signalement_statut',
          attributes: ['id_signalement_statuts', 'libelle'],
        },
        {
          model: db.Utilisateur,
          as: 'utilisateur',
          attributes: ['id_utilisateurs', 'email'],
        },
      ],
      raw: true,
    });

    return signalements.map((s) => ({
      id_signalements: s.id_signalements,
      description: s.description,
      geometry: s.geometry ? JSON.parse(s.geometry) : null,
      statut: s['signalement_statut.libelle'],
      email_utilisateur: s['utilisateur.email'],
      date: s.createdAt,
    }));
  },

  async getSignalementById(id) {
    const signalement = await db.Signalement.findByPk(id, {
      include: [
        {
          model: db.Point,
          as: 'point',
          include: {
            model: db.Ville,
            as: 'ville',
            attributes: ['id_villes', 'nom'],
          },
        },
        {
          model: db.SignalementStatut,
          as: 'signalement_statut',
          attributes: ['id_signalement_statuts', 'libelle', 'descri'],
        },
        {
          model: db.Utilisateur,
          as: 'utilisateur',
          attributes: ['id_utilisateurs', 'email'],
        },
      ],
    });

    if (!signalement) {
      const error = new Error('Signalement non trouvé');
      error.code = 'SIGNALEMENT_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    return signalement;
  },

  async getAllProblemes() {
    const problemes = await db.Probleme.findAll({
      attributes: [
        'id_problemes',
        'surface',
        'budget',
        [
          db.sequelize.sequelize.fn(
            'ST_AsGeoJSON',
            db.sequelize.col('Signalement.Point.xy')
          ),
          'geometry',
        ],
      ],
      include: [
        {
          model: db.Signalement,
          as: 'signalement',
          attributes: ['id_signalements', 'description'],
          include: {
            model: db.Point,
            as: 'point',
            attributes: [],
          },
        },
        {
          model: db.ProblemeStatut,
          as: 'probleme_statut',
          attributes: ['id_probleme_statuts', 'libelle', 'pourcentage'],
        },
        {
          model: db.Entreprise,
          as: 'entreprise',
          attributes: ['id_entreprises', 'nom'],
        },
      ],
      raw: true,
    });

    return problemes.map((p) => ({
      id_problemes: p.id_problemes,
      surface: p.surface,
      budget: p.budget,
      geometry: p.geometry ? JSON.parse(p.geometry) : null,
      description: p['signalement.description'],
      statut: p['probleme_statut.libelle'],
      pourcentage: p['probleme_statut.pourcentage'],
      entreprise: p['entreprise.nom'],
    }));
  },

  async getProblemeById(id) {
    const probleme = await db.Probleme.findByPk(id, {
      include: [
        {
          model: db.Signalement,
          as: 'signalement',
          include: [
            {
              model: db.Point,
              as: 'point',
              include: {
                model: db.Ville,
                as: 'ville',
                attributes: ['id_villes', 'nom'],
              },
            },
          ],
        },
        {
          model: db.ProblemeStatut,
          as: 'probleme_statut',
          attributes: ['id_probleme_statuts', 'libelle', 'descri', 'pourcentage'],
        },
        {
          model: db.Entreprise,
          as: 'entreprise',
          attributes: ['id_entreprises', 'nom', 'adresse', 'telephone'],
        },
      ],
    });

    if (!probleme) {
      const error = new Error('Probleme non trouvé');
      error.code = 'PROBLEME_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    return probleme;
  },

  async getMapStats() {
    const totalSignalements = await db.Signalement.count();
    const totalProblemes = await db.Probleme.count();

    const signalementStatutCounts = await db.Signalement.findAll({
      attributes: [
        [db.sequelize.col('signalement_statut_id'), 'statut_id'],
        [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'count'],
      ],
      include: {
        model: db.SignalementStatut,
        as: 'signalement_statut',
        attributes: ['libelle'],
      },
      group: ['signalement_statut_id', 'SignalementStatut.id_signalement_statuts'],
      raw: true,
    });

    const problemeStatutCounts = await db.Probleme.findAll({
      attributes: [
        [db.sequelize.col('probleme_statut_id'), 'statut_id'],
        [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'count'],
      ],
      include: {
        model: db.ProblemeStatut,
        as: 'probleme_statut',
        attributes: ['libelle'],
      },
      group: ['probleme_statut_id', 'ProblemeStatut.id_probleme_statuts'],
      raw: true,
    });

    return {
      signalements: {
        total: totalSignalements,
        par_statut: signalementStatutCounts.map((s) => ({
          statut: s['signalement_statut.libelle'],
          count: parseInt(s.count),
        })),
      },
      problemes: {
        total: totalProblemes,
        par_statut: problemeStatutCounts.map((p) => ({
          statut: p['probleme_statut.libelle'],
          count: parseInt(p.count),
        })),
      },
    };
  },

  async getMapData() {
    const signalements = await this.getAllSignalements();
    const problemes = await this.getAllProblemes();
    const stats = await this.getMapStats();

    return {
      signalements,
      problemes,
      stats,
    };
  },

  async getVilles() {
    const villes = await db.Ville.findAll({
      attributes: [
        'id_villes',
        'nom',
        [
          db.sequelize.sequelize.fn(
            'ST_AsGeoJSON',
            db.sequelize.col('xy')
          ),
          'geometry',
        ],
      ],
      raw: true,
    });

    return villes.map((v) => ({
      id_villes: v.id_villes,
      nom: v.nom,
      geometry: v.geometry ? JSON.parse(v.geometry) : null,
    }));
  },
};

module.exports = mapService;
