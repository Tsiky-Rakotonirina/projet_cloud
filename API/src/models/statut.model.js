module.exports = (sequelize, DataTypes) => {
  const Statut = sequelize.define('Statut', {
    id_statut: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    libelle: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  }, {
    tableName: 'statuts',
    timestamps: false,
  });

  Statut.associate = (models) => {
    Statut.hasMany(models.UtilisateurStatut, {
      foreignKey: 'statut_id',
      as: 'utilisateur_statuts',
    });
  };

  return Statut;
};
