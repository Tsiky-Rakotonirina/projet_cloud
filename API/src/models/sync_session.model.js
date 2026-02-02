module.exports = (sequelize, DataTypes) => {
  const SyncSession = sequelize.define(
    'SyncSession',
    {
      id_sync_session: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      type: {
        type: DataTypes.ENUM('push', 'pull', 'full'),
        allowNull: false,
        comment: 'Type de synchronisation: push (Firebase→PG), pull (PG→Firebase), full (bidirectionnelle)'
      },
      entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Type d\'entité: utilisateurs, signalements, problemes, all'
      },
      status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      total_items: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      processed_items: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      inserted_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      updated_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      error_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      skipped_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      current_step: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Étape actuelle de la synchronisation'
      },
      progress_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      initiated_by: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Utilisateur ou système qui a initié la sync'
      }
    },
    {
      tableName: 'sync_sessions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true
    }
  );

  SyncSession.associate = (models) => {
    SyncSession.hasMany(models.SyncItemDetail, {
      foreignKey: 'sync_session_id',
      as: 'details'
    });
  };

  return SyncSession;
};
