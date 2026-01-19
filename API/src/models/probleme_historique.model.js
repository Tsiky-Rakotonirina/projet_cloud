const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProblemeHistorique = sequelize.define(
    'ProblemeHistorique',
    {
      id_probleme_historiques: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      date_historique: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      surface: {
        type: DataTypes.NUMERIC,
        allowNull: true,
      },
      budget: {
        type: DataTypes.NUMERIC,
        allowNull: true,
      },
      utilisateur_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      probleme_statut_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      probleme_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'probleme_historiques',
      timestamps: false,
    }
  );

  ProblemeHistorique.associate = (db) => {
    ProblemeHistorique.belongsTo(db.Utilisateur, {
      foreignKey: 'utilisateur_id',
      as: 'utilisateur',
    });
    ProblemeHistorique.belongsTo(db.ProblemeStatut, {
      foreignKey: 'probleme_statut_id',
      as: 'statut',
    });
    ProblemeHistorique.belongsTo(db.Probleme, {
      foreignKey: 'probleme_id',
      as: 'probleme',
    });
  };

  return ProblemeHistorique;
};
