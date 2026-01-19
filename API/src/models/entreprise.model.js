const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Entreprise = sequelize.define(
    'Entreprise',
    {
      id_entreprises: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nom: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      adresse: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      telephone: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'entreprises',
      timestamps: false,
    }
  );

  Entreprise.associate = (db) => {
    Entreprise.hasMany(db.Probleme, {
      foreignKey: 'entreprise_id',
      as: 'problemes',
    });
  };

  return Entreprise;
};
