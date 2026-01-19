const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Signalement = sequelize.define(
    'Signalement',
    {
      id_signalements: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      utilisateur_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      point_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      signalement_statut_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'signalements',
      timestamps: false,
    }
  );

  Signalement.associate = (db) => {
    Signalement.belongsTo(db.Utilisateur, {
      foreignKey: 'utilisateur_id',
      as: 'utilisateur',
    });
    Signalement.belongsTo(db.Point, {
      foreignKey: 'point_id',
      as: 'point',
    });
    Signalement.belongsTo(db.SignalementStatut, {
      foreignKey: 'signalement_statut_id',
      as: 'statut',
    });
    Signalement.hasMany(db.Probleme, {
      foreignKey: 'signalement_id',
      as: 'problemes',
    });
    Signalement.hasMany(db.SignalementHistorique, {
      foreignKey: 'signalement_id',
      as: 'historiques',
    });
  };

  return Signalement;
};
