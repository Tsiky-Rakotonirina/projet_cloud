const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Configuration = sequelize.define(
    'Configuration',
    {
      id_configurations: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      cle: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      valeur: {
        type: DataTypes.NUMERIC,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'configurations',
      timestamps: false,
    }
  );

  return Configuration;
};
