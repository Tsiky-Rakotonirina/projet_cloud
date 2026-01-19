const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SignalementStatut = sequelize.define(
    'SignalementStatut',
    {
      id_signalement_statuts: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      libelle: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      descri: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'signalement_statuts',
      timestamps: false,
    }
  );

  SignalementStatut.associate = (db) => {
    SignalementStatut.hasMany(db.Signalement, {
      foreignKey: 'signalement_statut_id',
      as: 'signalements',
    });
    SignalementStatut.hasMany(db.SignalementHistorique, {
      foreignKey: 'signalement_statut_id',
      as: 'historiques',
    });
  };

  return SignalementStatut;
};
