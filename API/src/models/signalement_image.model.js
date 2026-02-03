const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SignalementImage = sequelize.define(
    'SignalementImage',
    {
      id_signalement_images: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      signalement_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      date_upload: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'signalement_images',
      timestamps: false,
    }
  );

  SignalementImage.associate = (db) => {
    SignalementImage.belongsTo(db.Signalement, {
      foreignKey: 'signalement_id',
      as: 'signalement',
    });
  };

  return SignalementImage;
};
