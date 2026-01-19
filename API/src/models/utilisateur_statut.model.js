module.exports = (sequelize, DataTypes) => {
  const UtilisateurStatut = sequelize.define('UtilisateurStatut', {
    id_utilisateur_statut: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    utilisateur_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'utilisateurs',
        key: 'id_utilisateurs',
      },
    },
    statut_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'statuts',
        key: 'id_statut',
      },
    },
    date_statut: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'utilisateur_statuts',
    timestamps: false,
  });

  UtilisateurStatut.associate = (models) => {
    UtilisateurStatut.belongsTo(models.Utilisateur, {
      foreignKey: 'utilisateur_id',
      as: 'utilisateur',
    });
    UtilisateurStatut.belongsTo(models.Statut, {
      foreignKey: 'statut_id',
      as: 'statut',
    });
  };

  return UtilisateurStatut;
};
