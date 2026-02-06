const bcrypt = require('bcryptjs');
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
      where: { libelle: 'Bloque' },
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
      statut: 'Bloque',
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
      where: { libelle: 'Actif' },
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
      statut: 'Actif',
      date_statut: utilisateurStatut.date_statut,
    };
  },

  async getBlockedUsers() {
    // D'abord, récupérer le dernier statut de chaque utilisateur
    const { QueryTypes } = require('sequelize');
    const sequelize = db.sequelize;
    
    // Requête pour obtenir les utilisateurs dont le DERNIER statut est "bloque"
    const blockedUsers = await sequelize.query(`
      SELECT DISTINCT ON (us.utilisateur_id)
        us.id_utilisateur_statut,
        us.utilisateur_id,
        us.date_statut,
        u.email,
        p.libelle as profil,
        s.libelle as statut
      FROM utilisateur_statuts us
      JOIN utilisateurs u ON us.utilisateur_id = u.id_utilisateurs
      JOIN statuts s ON us.statut_id = s.id_statut
      LEFT JOIN profils p ON u.profil_id = p.id_profils
      WHERE s.libelle = 'Bloque'
      AND us.id_utilisateur_statut = (
        SELECT us2.id_utilisateur_statut 
        FROM utilisateur_statuts us2 
        WHERE us2.utilisateur_id = us.utilisateur_id 
        ORDER BY us2.date_statut DESC 
        LIMIT 1
      )
      ORDER BY us.utilisateur_id, us.date_statut DESC
    `, { type: QueryTypes.SELECT });

    return blockedUsers.map((user) => ({
      id_utilisateur_statut: user.id_utilisateur_statut,
      utilisateur_id: user.utilisateur_id,
      email: user.email,
      profil: user.profil || null,
      statut: user.statut,
      date_statut: user.date_statut,
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
      where: { libelle: 'Actif' },
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

