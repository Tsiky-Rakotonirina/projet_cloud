const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Ville = sequelize.define(
    'Ville',
    {
      id_villes: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nom: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      xy: {
        type: DataTypes.GEOMETRY('POINT', 4326),
        allowNull: true,
      },
    },
    {
      tableName: 'villes',
      timestamps: false,
    }
  );

  Ville.associate = (db) => {
    Ville.hasMany(db.Rue, {
      foreignKey: 'ville_id',
      as: 'rues',
    });
    Ville.hasMany(db.Point, {
      foreignKey: 'ville_id',
      as: 'points',
    });
  };

  return Ville;
};
