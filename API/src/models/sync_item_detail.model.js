module.exports = (sequelize, DataTypes) => {
  const SyncItemDetail = sequelize.define(
    'SyncItemDetail',
    {
      id_sync_item: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      sync_session_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Type: utilisateur, signalement, probleme, etc.'
      },
      entity_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'ID de l\'entité (postgres_id ou firebase_id selon direction)'
      },
      entity_email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Email de l\'utilisateur (pour affichage)'
      },
      entity_label: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Libellé descriptif de l\'entité'
      },
      source_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'ID dans la source'
      },
      target_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'ID dans la cible'
      },
      action: {
        type: DataTypes.ENUM('insert', 'update', 'skip', 'error'),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'success', 'failed', 'skipped'),
        defaultValue: 'pending'
      },
      sync_direction: {
        type: DataTypes.ENUM('firebase_to_postgres', 'postgres_to_firebase'),
        allowNull: false
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      data_before: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Données avant synchronisation'
      },
      data_after: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Données après synchronisation'
      },
      synced_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'sync_item_details',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true
    }
  );

  SyncItemDetail.associate = (models) => {
    SyncItemDetail.belongsTo(models.SyncSession, {
      foreignKey: 'sync_session_id',
      as: 'session'
    });
  };

  return SyncItemDetail;
};
