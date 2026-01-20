const db = require('../models');

const signalementService = {
  async getSignalementCurrentStatut(signalementId) {
    const historique = await db.SignalementHistorique.findOne({
      where: { signalement_id: signalementId },
      include: {
        model: db.SignalementStatut,
        as: 'statut',
        attributes: ['libelle', 'descri'],
      },
      order: [['date_historique', 'DESC']],
    });

    return historique ? historique.statut : null;
  },

  async getSignalementWithDetails(signalementId) {
    const signalement = await db.Signalement.findByPk(signalementId, {
      include: [
        {
          model: db.Point,
          as: 'point',
          attributes: [
            'id_points',
            [
              db.sequelize.sequelize.fn(
                'ST_AsGeoJSON',
                db.sequelize.col('point.xy')
              ),
              'geometry',
            ],
          ],
          include: {
            model: db.Ville,
            as: 'ville',
            attributes: ['id_villes', 'nom'],
          },
        },
        {
          model: db.Utilisateur,
          as: 'utilisateur',
          attributes: ['id_utilisateurs', 'email'],
        },
        {
          model: db.Probleme,
          as: 'problemes',
          attributes: ['id_problemes', 'surface', 'budget'],
          include: {
            model: db.Entreprise,
            as: 'entreprise',
            attributes: ['id_entreprises', 'nom', 'adresse', 'telephone'],
          },
        },
      ],
    });

    if (!signalement) {
      return null;
    }

    const statut = await this.getSignalementCurrentStatut(signalementId);

    const problemes = signalement.problemes.map((p) => ({
      id_problemes: p.id_problemes,
      surface: p.surface,
      budget: p.budget,
      entreprise: p.entreprise
        ? {
            id_entreprises: p.entreprise.id_entreprises,
            nom: p.entreprise.nom,
            adresse: p.entreprise.adresse,
            telephone: p.entreprise.telephone,
          }
        : null,
    }));

    return {
      id_signalements: signalement.id_signalements,
      description: signalement.description,
      statut: statut
        ? {
            libelle: statut.libelle,
            descri: statut.descri,
          }
        : null,
      utilisateur: signalement.utilisateur
        ? {
            id_utilisateurs: signalement.utilisateur.id_utilisateurs,
            email: signalement.utilisateur.email,
          }
        : null,
      point: signalement.point
        ? {
            id_points: signalement.point.id_points,
            geometry: signalement.point.geometry ? JSON.parse(signalement.point.geometry) : null,
            ville: signalement.point.ville
              ? {
                  id_villes: signalement.point.ville.id_villes,
                  nom: signalement.point.ville.nom,
                }
              : null,
          }
        : null,
      problemes: problemes,
      total_surface: problemes.reduce((sum, p) => sum + (p.surface || 0), 0),
      total_budget: problemes.reduce((sum, p) => sum + (p.budget || 0), 0),
    };
  },

  async getAllSignalements() {
    const signalements = await db.Signalement.findAll({
      include: [
        {
          model: db.Point,
          as: 'point',
          attributes: ['id_points'],
          include: {
            model: db.Ville,
            as: 'ville',
            attributes: ['nom'],
          },
        },
        {
          model: db.Utilisateur,
          as: 'utilisateur',
          attributes: ['email'],
        },
        {
          model: db.Probleme,
          as: 'problemes',
          attributes: ['id_problemes', 'surface', 'budget'],
        },
      ],
    });

    const result = await Promise.all(
      signalements.map(async (s) => {
        const statut = await this.getSignalementCurrentStatut(s.id_signalements);
        return {
          id_signalements: s.id_signalements,
          description: s.description,
          ville: s.point?.ville?.nom || null,
          email_utilisateur: s.utilisateur?.email || null,
          statut: statut?.libelle || null,
          nombre_problemes: s.problemes?.length || 0,
          total_surface: s.problemes?.reduce((sum, p) => sum + (p.surface || 0), 0) || 0,
          total_budget: s.problemes?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0,
        };
      })
    );

    return result;
  },

  async updateSignalementStatut(signalementId, statutId, utilisateurId) {
    const signalement = await db.Signalement.findByPk(signalementId);

    if (!signalement) {
      const error = new Error('Signalement non trouvé');
      error.code = 'SIGNALEMENT_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    const statut = await db.SignalementStatut.findByPk(statutId);

    if (!statut) {
      const error = new Error('Statut non trouvé');
      error.code = 'STATUT_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    // Créer une entrée dans l'historique
    const historique = await db.SignalementHistorique.create({
      utilisateur_id: utilisateurId,
      signalement_id: signalementId,
      signalement_statut_id: statutId,
      date_historique: new Date(),
    });

    return {
      id_signalement_historique: historique.id_signalement_historiques,
      signalement_id: signalementId,
      statut: statut.libelle,
      date_historique: historique.date_historique,
    };
  },

  async getSignalementStatutHistory(signalementId) {
    const historiques = await db.SignalementHistorique.findAll({
      where: { signalement_id: signalementId },
      include: [
        {
          model: db.SignalementStatut,
          as: 'statut',
          attributes: ['libelle', 'descri'],
        },
        {
          model: db.Utilisateur,
          as: 'utilisateur',
          attributes: ['email'],
        },
      ],
      order: [['date_historique', 'DESC']],
    });

    return historiques.map((h) => ({
      date: h.date_historique,
      statut: h.statut?.libelle || null,
      utilisateur: h.utilisateur?.email || null,
    }));
  },

  async getSignalementsByStatut(statut) {
    const statutObj = await db.SignalementStatut.findOne({
      where: { libelle: statut },
    });

    if (!statutObj) {
      const error = new Error('Statut non trouvé');
      error.code = 'STATUT_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    const signalements = await db.Signalement.findAll({
      include: [
        {
          model: db.Point,
          as: 'point',
          attributes: ['id_points'],
          include: {
            model: db.Ville,
            as: 'ville',
            attributes: ['nom'],
          },
        },
        {
          model: db.Utilisateur,
          as: 'utilisateur',
          attributes: ['email'],
        },
        {
          model: db.Probleme,
          as: 'problemes',
          attributes: ['surface', 'budget'],
        },
      ],
    });

    const filtered = [];
    for (const s of signalements) {
      const currentStatut = await this.getSignalementCurrentStatut(s.id_signalements);
      if (currentStatut?.libelle === statut) {
        filtered.push({
          id_signalements: s.id_signalements,
          description: s.description,
          ville: s.point?.ville?.nom || null,
          email_utilisateur: s.utilisateur?.email || null,
          statut: currentStatut.libelle,
          total_surface: s.problemes?.reduce((sum, p) => sum + (p.surface || 0), 0) || 0,
          total_budget: s.problemes?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0,
        });
      }
    }

    return filtered;
  },
};

module.exports = signalementService;
