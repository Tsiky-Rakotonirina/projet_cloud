const db = require('../models');
const { Op } = require('sequelize');

// URL de base pour les images
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const mapService = {
  async getAllSignalements() {
    const signalements = await db.Signalement.findAll({
      attributes: [
        'id_signalements',
        'description',
        [
          db.sequelize.fn(
            'ST_AsGeoJSON',
            db.sequelize.col('point.xy')
          ),
          'geometry',
        ],
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
          as: 'statut',
          attributes: ['id_signalement_statuts', 'libelle'],
        },
        {
          model: db.Utilisateur,
          as: 'utilisateur',
          attributes: ['id_utilisateurs', 'email'],
        },
        {
          model: db.SignalementImage,
          as: 'images',
          attributes: ['id_signalement_images', 'name', 'date_upload'],
        },
      ],
    });

    return signalements.map((s) => {
      const images = s.images?.map(img => ({
        id: img.id_signalement_images,
        name: img.name,
        url: `${BASE_URL}/uploads/signalements/${img.name}`,
        date_upload: img.date_upload
      })) || [];

      // Parser la géométrie GeoJSON
      let geometry = null;
      const geometryStr = s.dataValues.geometry;
      if (geometryStr) {
        try {
          geometry = JSON.parse(geometryStr);
        } catch (e) {
          console.error('Erreur parsing geometry:', e);
        }
      }

      return {
        id_signalements: s.id_signalements,
        description: s.description,
        geometry: geometry,
        statut: s.statut?.libelle,
        email_utilisateur: s.utilisateur?.email,
        images: images
      };
    });
  },

  // Nouvelle méthode pour récupérer les signalements avec images (format simplifié)
  async getSignalementsWithImages() {
    // D'abord récupérer avec la géométrie en GeoJSON
    const signalements = await db.Signalement.findAll({
      attributes: [
        'id_signalements',
        'description',
        [
          db.sequelize.fn(
            'ST_AsGeoJSON',
            db.sequelize.col('point.xy')
          ),
          'geometry',
        ],
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
          as: 'statut',
          attributes: ['id_signalement_statuts', 'libelle'],
        },
        {
          model: db.Utilisateur,
          as: 'utilisateur',
          attributes: ['id_utilisateurs', 'email'],
        },
        {
          model: db.SignalementImage,
          as: 'images',
          attributes: ['id_signalement_images', 'name', 'date_upload'],
        },
      ],
    });

    return signalements.map((s) => {
      // Extraire les coordonnées du GeoJSON
      let lat = 0, lng = 0;
      const geometryStr = s.dataValues.geometry;
      if (geometryStr) {
        try {
          const geometry = JSON.parse(geometryStr);
          if (geometry && geometry.coordinates) {
            lng = geometry.coordinates[0];
            lat = geometry.coordinates[1];
          }
        } catch (e) {
          console.error('Erreur parsing geometry:', e);
        }
      }

      const images = s.images?.map(img => ({
        id: img.id_signalement_images,
        name: img.name,
        url: `${BASE_URL}/uploads/signalements/${img.name}`,
        date_upload: img.date_upload
      })) || [];

      return {
        id: s.id_signalements,
        description: s.description,
        lat,
        lng,
        statut: s.statut?.libelle || 'Nouveau',
        email_utilisateur: s.utilisateur?.email,
        images
      };
    });
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
          as: 'statut',
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
          db.sequelize.fn(
            'ST_AsGeoJSON',
            db.sequelize.col('signalement.point.xy')
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
          as: 'statut',
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
      statut: p['statut.libelle'],
      pourcentage: p['statut.pourcentage'],
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
          as: 'statut',
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
        as: 'statut',
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
        as: 'statut',
        attributes: ['libelle'],
      },
      group: ['probleme_statut_id', 'ProblemeStatut.id_probleme_statuts'],
      raw: true,
    });

    return {
      signalements: {
        total: totalSignalements,
        par_statut: signalementStatutCounts.map((s) => ({
          statut: s['statut.libelle'],
          count: parseInt(s.count),
        })),
      },
      problemes: {
        total: totalProblemes,
        par_statut: problemeStatutCounts.map((p) => ({
          statut: p['statut.libelle'],
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
