module.exports = (sequelize, DataTypes) => {
  const FirebaseMapping = sequelize.define(
    'FirebaseMapping',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Type d\'entité: utilisateur, signalement, statut, etc.',
      },
      postgres_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID de l\'enregistrement PostgreSQL',
      },
      firebase_id: {
        type: DataTypes.STRING(128),
        allowNull: false,
        comment: 'ID du document Firebase',
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      tableName: 'firebase_mapping',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['entity_type', 'postgres_id'],
        },
        {
          unique: true,
          fields: ['entity_type', 'firebase_id'],
        },
      ],
    }
  );

  return FirebaseMapping;
};
