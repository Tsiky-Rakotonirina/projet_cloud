const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Profil = sequelize.define(
    'Profil',
    {
      id_profils: {
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
      tableName: 'profils',
      timestamps: false,
    }
  );

  Profil.associate = (db) => {
    Profil.hasMany(db.Utilisateur, {
      foreignKey: 'profil_id',
      as: 'utilisateurs',
    });
  };

  return Profil;
};
