const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProblemeStatut = sequelize.define(
    'ProblemeStatut',
    {
      id_probleme_statuts: {
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
      pourcentage: {
        type: DataTypes.NUMERIC,
        allowNull: true,
      },
    },
    {
      tableName: 'probleme_statuts',
      timestamps: false,
    }
  );

  ProblemeStatut.associate = (db) => {
    ProblemeStatut.hasMany(db.Probleme, {
      foreignKey: 'probleme_statut_id',
      as: 'problemes',
    });
    ProblemeStatut.hasMany(db.ProblemeHistorique, {
      foreignKey: 'probleme_statut_id',
      as: 'historiques',
    });
  };

  return ProblemeStatut;
};
