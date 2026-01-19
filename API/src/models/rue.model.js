const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Rue = sequelize.define(
    'Rue',
    {
      id_rues: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nom: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      xy: {
        type: DataTypes.GEOMETRY('LINESTRING', 4326),
        allowNull: true,
      },
      ville_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'rues',
      timestamps: false,
    }
  );

  Rue.associate = (db) => {
    Rue.belongsTo(db.TypeRue, {
      foreignKey: 'type_id',
      as: 'type',
    });
    Rue.belongsTo(db.Ville, {
      foreignKey: 'ville_id',
      as: 'ville',
    });
  };

  return Rue;
};
