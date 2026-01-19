const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SignalementHistorique = sequelize.define(
    'SignalementHistorique',
    {
      id_signalement_historiques: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      date_historique: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      utilisateur_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      signalement_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      signalement_statut_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'signalement_historiques',
      timestamps: false,
    }
  );

  SignalementHistorique.associate = (db) => {
    SignalementHistorique.belongsTo(db.Utilisateur, {
      foreignKey: 'utilisateur_id',
      as: 'utilisateur',
    });
    SignalementHistorique.belongsTo(db.Signalement, {
      foreignKey: 'signalement_id',
      as: 'signalement',
    });
    SignalementHistorique.belongsTo(db.SignalementStatut, {
      foreignKey: 'signalement_statut_id',
      as: 'statut',
    });
  };

  return SignalementHistorique;
};
