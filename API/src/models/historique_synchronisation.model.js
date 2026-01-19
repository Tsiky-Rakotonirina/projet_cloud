module.exports = (sequelize, DataTypes) => {
  const HistoriqueSynchronisation = sequelize.define(
    'HistoriqueSynchronisation',
    {
      id_historique_synchronisation: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      date_synchronisation: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      description: {
        type: DataTypes.TEXT
      }
    },
    {
      tableName: 'historique_synchronisations',
      timestamps: false,
      underscored: true
    }
  );

  return HistoriqueSynchronisation;
};
