const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Point = sequelize.define(
    'Point',
    {
      id_points: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      xy: {
        type: DataTypes.GEOMETRY('POINT', 4326),
        allowNull: true,
      },
      ville_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'points',
      timestamps: false,
    }
  );

  Point.associate = (db) => {
    Point.belongsTo(db.Ville, {
      foreignKey: 'ville_id',
      as: 'ville',
    });
    Point.hasMany(db.Signalement, {
      foreignKey: 'point_id',
      as: 'signalements',
    });
  };

  return Point;
};
