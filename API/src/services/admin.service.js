const bcrypt = require('bcrypt');
const db = require('../models');

const adminService = {
  async adminLogin(email, password) {
    if (!email || !password) {
      const error = new Error('Email et mot de passe sont requis');
      error.code = 'MISSING_FIELDS';
      error.status = 400;
      throw error;
    }

    const utilisateur = await db.Utilisateur.findOne({
      where: { email },
      include: {
        model: db.Profil,
        as: 'profil',
      },
    });

    if (!utilisateur) {
      const error = new Error('Email ou mot de passe incorrect');
      error.code = 'INVALID_CREDENTIALS';
      error.status = 401;
      throw error;
    }

    if (!utilisateur.mot_de_passe) {
      const error = new Error('Utilisateur non authentifié via email/password');
      error.code = 'INVALID_AUTH_METHOD';
      error.status = 401;
      throw error;
    }

    // Vérifier que c'est un admin
    if (utilisateur.profil_id !== 1) {
      const error = new Error('Accès refusé - droits administrateur requis');
      error.code = 'INSUFFICIENT_PERMISSIONS';
      error.status = 403;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, utilisateur.mot_de_passe);

    if (!isPasswordValid) {
      const error = new Error('Email ou mot de passe incorrect');
      error.code = 'INVALID_CREDENTIALS';
      error.status = 401;
      throw error;
    }

    return {
      id_utilisateurs: utilisateur.id_utilisateurs,
      email: utilisateur.email,
      profil: utilisateur.profil.libelle,
    };
  },

  async blockUser(utilisateurId, raison) {
    if (!utilisateurId) {
      const error = new Error('ID utilisateur requis');
      error.code = 'MISSING_USER_ID';
      error.status = 400;
      throw error;
    }

    const utilisateur = await db.Utilisateur.findByPk(utilisateurId);

    if (!utilisateur) {
      const error = new Error('Utilisateur non trouvé');
      error.code = 'USER_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    // Récupérer le statut "bloque"
    const statutBloque = await db.Statut.findOne({
      where: { libelle: 'bloque' },
    });

    if (!statutBloque) {
      const error = new Error('Statut "bloque" non trouvé');
      error.code = 'STATUS_NOT_FOUND';
      error.status = 500;
      throw error;
    }

    // Créer une entrée dans utilisateur_statuts
    const utilisateurStatut = await db.UtilisateurStatut.create({
      utilisateur_id: utilisateurId,
      statut_id: statutBloque.id_statut,
      date_statut: new Date(),
    });

    return {
      id_utilisateur_statut: utilisateurStatut.id_utilisateur_statut,
      utilisateur_id: utilisateurId,
      statut: 'bloque',
      date_statut: utilisateurStatut.date_statut,
    };
  },

  async unblockUser(utilisateurId) {
    if (!utilisateurId) {
      const error = new Error('ID utilisateur requis');
      error.code = 'MISSING_USER_ID';
      error.status = 400;
      throw error;
    }

    const utilisateur = await db.Utilisateur.findByPk(utilisateurId);

    if (!utilisateur) {
      const error = new Error('Utilisateur non trouvé');
      error.code = 'USER_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    // Récupérer le statut "actif"
    const statutActif = await db.Statut.findOne({
      where: { libelle: 'actif' },
    });

    if (!statutActif) {
      const error = new Error('Statut "actif" non trouvé');
      error.code = 'STATUS_NOT_FOUND';
      error.status = 500;
      throw error;
    }

    // Créer une nouvelle entrée de statut "actif"
    const utilisateurStatut = await db.UtilisateurStatut.create({
      utilisateur_id: utilisateurId,
      statut_id: statutActif.id_statut,
      date_statut: new Date(),
    });

    return {
      id_utilisateur_statut: utilisateurStatut.id_utilisateur_statut,
      utilisateur_id: utilisateurId,
      statut: 'actif',
      date_statut: utilisateurStatut.date_statut,
    };
  },

  async getBlockedUsers() {
    const blockedUsers = await db.UtilisateurStatut.findAll({
      include: [
        {
          model: db.Utilisateur,
          as: 'utilisateur',
          attributes: ['id_utilisateurs', 'email'],
          include: {
            model: db.Profil,
            as: 'profil',
            attributes: ['libelle'],
          },
        },
        {
          model: db.Statut,
          as: 'statut',
          attributes: ['libelle'],
          where: { libelle: 'bloque' },
        },
      ],
      order: [['date_statut', 'DESC']],
    });

    return blockedUsers.map((us) => ({
      id_utilisateur_statut: us.id_utilisateur_statut,
      utilisateur_id: us.utilisateur.id_utilisateurs,
      email: us.utilisateur.email,
      profil: us.utilisateur.profil?.libelle || null,
      statut: us.statut.libelle,
      date_statut: us.date_statut,
    }));
  },

  async getCurrentUserStatus(utilisateurId) {
    const currentStatus = await db.UtilisateurStatut.findOne({
      where: { utilisateur_id: utilisateurId },
      include: {
        model: db.Statut,
        as: 'statut',
      },
      order: [['date_statut', 'DESC']],
    });

    if (!currentStatus) {
      return null;
    }

    return {
      utilisateur_id: currentStatus.utilisateur_id,
      statut: currentStatus.statut.libelle,
      date_statut: currentStatus.date_statut,
    };
  },

  async registerUser(email, password, dateNaissance, profilId = 2) {
    if (!email || !password) {
      const error = new Error('Email et mot de passe sont requis');
      error.code = 'MISSING_FIELDS';
      error.status = 400;
      throw error;
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.Utilisateur.findOne({
      where: { email },
    });

    if (existingUser) {
      const error = new Error('Un utilisateur avec cet email existe déjà');
      error.code = 'USER_EXISTS';
      error.status = 409;
      throw error;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const newUser = await db.Utilisateur.create({
      email,
      mot_de_passe: hashedPassword,
      date_naissance: dateNaissance || null,
      profil_id: profilId,
    });

    // Créer le statut initial (actif)
    const statutActif = await db.Statut.findOne({
      where: { libelle: 'actif' },
    });

    if (statutActif) {
      await db.UtilisateurStatut.create({
        utilisateur_id: newUser.id_utilisateurs,
        statut_id: statutActif.id_statut,
      });
    }

    return {
      id_utilisateurs: newUser.id_utilisateurs,
      email: newUser.email,
      profil_id: newUser.profil_id,
      message: 'Utilisateur créé avec succès',
    };
  },
};

module.exports = adminService;

