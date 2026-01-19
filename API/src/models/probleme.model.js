const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Probleme = sequelize.define(
    'Probleme',
    {
      id_problemes: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      surface: {
        type: DataTypes.NUMERIC,
        allowNull: true,
      },
      budget: {
        type: DataTypes.NUMERIC,
        allowNull: true,
      },
      entreprise_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      signalement_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      probleme_statut_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'problemes',
      timestamps: false,
    }
  );

  Probleme.associate = (db) => {
    Probleme.belongsTo(db.Entreprise, {
      foreignKey: 'entreprise_id',
      as: 'entreprise',
    });
    Probleme.belongsTo(db.Signalement, {
      foreignKey: 'signalement_id',
      as: 'signalement',
    });
    Probleme.belongsTo(db.ProblemeStatut, {
      foreignKey: 'probleme_statut_id',
      as: 'statut',
    });
    Probleme.hasMany(db.ProblemeHistorique, {
      foreignKey: 'probleme_id',
      as: 'historiques',
    });
  };

  return Probleme;
};
