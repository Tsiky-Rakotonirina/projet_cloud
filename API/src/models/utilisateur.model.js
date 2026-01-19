const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Utilisateur = sequelize.define(
    'Utilisateur',
    {
      id_utilisateurs: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.TEXT,
        allowNull: true,
        unique: true,
      },
      github: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      mot_de_passe: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      date_naissance: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      profil_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'utilisateurs',
      timestamps: false,
    }
  );

  Utilisateur.associate = (db) => {
    Utilisateur.belongsTo(db.Profil, {
      foreignKey: 'profil_id',
      as: 'profil',
    });
    Utilisateur.hasMany(db.Signalement, {
      foreignKey: 'utilisateur_id',
      as: 'signalements',
    });
    Utilisateur.hasMany(db.SignalementHistorique, {
      foreignKey: 'utilisateur_id',
      as: 'signalementHistoriques',
    });
    Utilisateur.hasMany(db.ProblemeHistorique, {
      foreignKey: 'utilisateur_id',
      as: 'problemeHistoriques',
    });
  };

  return Utilisateur;
};
