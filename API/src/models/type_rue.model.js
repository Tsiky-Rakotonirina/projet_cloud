const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TypeRue = sequelize.define(
    'TypeRue',
    {
      id_types_rues: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      libelle: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: 'types_rues',
      timestamps: false,
    }
  );

  TypeRue.associate = (db) => {
    TypeRue.hasMany(db.Rue, {
      foreignKey: 'type_id',
      as: 'rues',
    });
  };

  return TypeRue;
};
