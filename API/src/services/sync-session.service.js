/**
 * Service de gestion des sessions de synchronisation
 * Permet de suivre l'état de synchronisation en temps réel
 */

const { SyncSession, SyncItemDetail, sequelize } = require('../models');
const { Op } = require('sequelize');

// Cache en mémoire pour la session active
let activeSessions = new Map();

const syncSessionService = {
  /**
   * Crée une nouvelle session de synchronisation
   */
  async createSession(type, entityType, initiatedBy = 'system') {
    // Vérifier s'il y a déjà une session en cours pour ce type
    const existingSession = await SyncSession.findOne({
      where: {
        entity_type: entityType,
        status: 'in_progress'
      }
    });

    if (existingSession) {
      throw {
        code: 'SYNC_IN_PROGRESS',
        message: `Une synchronisation est déjà en cours pour ${entityType}`,
        status: 409,
        sessionId: existingSession.id_sync_session
      };
    }

    const session = await SyncSession.create({
      type,
      entity_type: entityType,
      status: 'pending',
      initiated_by: initiatedBy
    });

    // Mettre en cache
    activeSessions.set(session.id_sync_session, {
      id: session.id_sync_session,
      type,
      entityType,
      status: 'pending',
      items: []
    });

    console.log(`📋 Session de synchronisation créée: ${session.id_sync_session}`);
    return session;
  },

  /**
   * Démarre une session de synchronisation
   */
  async startSession(sessionId, totalItems = 0) {
    const session = await SyncSession.findByPk(sessionId);
    if (!session) {
      throw { code: 'SESSION_NOT_FOUND', message: 'Session non trouvée', status: 404 };
    }

    await session.update({
      status: 'in_progress',
      started_at: new Date(),
      total_items: totalItems,
      progress_percentage: 0
    });

    // Mettre à jour le cache
    if (activeSessions.has(sessionId)) {
      const cached = activeSessions.get(sessionId);
      cached.status = 'in_progress';
      cached.totalItems = totalItems;
    }

    console.log(`🚀 Session ${sessionId} démarrée avec ${totalItems} éléments`);
    return session;
  },

  /**
   * Met à jour la progression de la session
   */
  async updateProgress(sessionId, processedItems, currentStep = null) {
    const session = await SyncSession.findByPk(sessionId);
    if (!session) return null;

    const progress = session.total_items > 0 
      ? Math.round((processedItems / session.total_items) * 100 * 100) / 100 
      : 0;

    await session.update({
      processed_items: processedItems,
      current_step: currentStep,
      progress_percentage: progress
    });

    return session;
  },

  /**
   * Enregistre un élément synchronisé
   */
  async recordItem(sessionId, {
    entityType,
    entityId,
    entityEmail = null,
    entityLabel = null,
    sourceId = null,
    targetId = null,
    action,
    status,
    syncDirection,
    errorMessage = null,
    dataBefore = null,
    dataAfter = null
  }) {
    try {
      const item = await SyncItemDetail.create({
        sync_session_id: sessionId,
        entity_type: entityType,
        entity_id: entityId,
        entity_email: entityEmail,
        entity_label: entityLabel,
        source_id: sourceId,
        target_id: targetId,
        action,
        status,
        sync_direction: syncDirection,
        error_message: errorMessage,
        data_before: dataBefore,
        data_after: dataAfter,
        synced_at: status === 'success' ? new Date() : null
      });

      // Mettre à jour les compteurs de la session
      const session = await SyncSession.findByPk(sessionId);
      if (session) {
        const updates = {
          processed_items: session.processed_items + 1
        };

        if (action === 'insert' && status === 'success') {
          updates.inserted_count = session.inserted_count + 1;
        } else if (action === 'update' && status === 'success') {
          updates.updated_count = session.updated_count + 1;
        } else if (status === 'failed') {
          updates.error_count = session.error_count + 1;
        } else if (action === 'skip' || status === 'skipped') {
          updates.skipped_count = session.skipped_count + 1;
        }

        // Calculer le pourcentage
        const newProcessed = updates.processed_items;
        updates.progress_percentage = session.total_items > 0 
          ? Math.round((newProcessed / session.total_items) * 100 * 100) / 100 
          : 0;

        await session.update(updates);
      }

      return item;
    } catch (error) {
      console.error('Erreur enregistrement item:', error.message);
      return null;
    }
  },

  /**
   * Termine une session de synchronisation avec succès
   */
  async completeSession(sessionId) {
    const session = await SyncSession.findByPk(sessionId);
    if (!session) return null;

    await session.update({
      status: 'completed',
      completed_at: new Date(),
      progress_percentage: 100,
      current_step: 'Terminé'
    });

    // Nettoyer le cache
    activeSessions.delete(sessionId);

    console.log(`✅ Session ${sessionId} terminée avec succès`);
    return session;
  },

  /**
   * Marque une session comme échouée
   */
  async failSession(sessionId, errorMessage) {
    const session = await SyncSession.findByPk(sessionId);
    if (!session) return null;

    await session.update({
      status: 'failed',
      completed_at: new Date(),
      error_message: errorMessage,
      current_step: 'Erreur'
    });

    // Nettoyer le cache
    activeSessions.delete(sessionId);

    console.log(`❌ Session ${sessionId} échouée: ${errorMessage}`);
    return session;
  },

  /**
   * Annule une session de synchronisation
   */
  async cancelSession(sessionId) {
    const session = await SyncSession.findByPk(sessionId);
    if (!session) return null;

    if (session.status !== 'in_progress' && session.status !== 'pending') {
      throw { code: 'INVALID_STATE', message: 'La session ne peut pas être annulée', status: 400 };
    }

    await session.update({
      status: 'cancelled',
      completed_at: new Date(),
      current_step: 'Annulé'
    });

    activeSessions.delete(sessionId);
    console.log(`🚫 Session ${sessionId} annulée`);
    return session;
  },

  /**
   * Récupère l'état d'une session
   */
  async getSessionStatus(sessionId) {
    const session = await SyncSession.findByPk(sessionId, {
      include: [{
        model: SyncItemDetail,
        as: 'details',
        order: [['created_at', 'DESC']],
        limit: 100
      }]
    });

    if (!session) {
      throw { code: 'SESSION_NOT_FOUND', message: 'Session non trouvée', status: 404 };
    }

    // Calculer les statistiques par statut
    const statsByStatus = await SyncItemDetail.findAll({
      where: { sync_session_id: sessionId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id_sync_item')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    return {
      session: {
        id: session.id_sync_session,
        type: session.type,
        entityType: session.entity_type,
        status: session.status,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        totalItems: session.total_items,
        processedItems: session.processed_items,
        insertedCount: session.inserted_count,
        updatedCount: session.updated_count,
        errorCount: session.error_count,
        skippedCount: session.skipped_count,
        currentStep: session.current_step,
        progressPercentage: parseFloat(session.progress_percentage || 0),
        errorMessage: session.error_message,
        initiatedBy: session.initiated_by
      },
      statsByStatus: statsByStatus.reduce((acc, s) => {
        acc[s.status] = parseInt(s.count);
        return acc;
      }, {}),
      recentItems: session.details || []
    };
  },

  /**
   * Liste des utilisateurs synchronisés dans une session
   */
  async getSessionUsers(sessionId, options = {}) {
    const { page = 1, limit = 50, status = null, action = null } = options;

    const whereClause = {
      sync_session_id: sessionId,
      entity_type: 'utilisateur'
    };

    if (status) whereClause.status = status;
    if (action) whereClause.action = action;

    const { count, rows } = await SyncItemDetail.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    return {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit)),
      users: rows.map(item => ({
        id: item.id_sync_item,
        entityId: item.entity_id,
        email: item.entity_email,
        label: item.entity_label,
        sourceId: item.source_id,
        targetId: item.target_id,
        action: item.action,
        status: item.status,
        direction: item.sync_direction,
        error: item.error_message,
        syncedAt: item.synced_at
      }))
    };
  },

  /**
   * Récupère les sessions actives (en cours)
   */
  async getActiveSessions() {
    const sessions = await SyncSession.findAll({
      where: {
        status: 'in_progress'
      },
      order: [['started_at', 'DESC']]
    });

    return sessions.map(s => ({
      id: s.id_sync_session,
      type: s.type,
      entityType: s.entity_type,
      status: s.status,
      progress: parseFloat(s.progress_percentage || 0),
      currentStep: s.current_step,
      processed: s.processed_items,
      total: s.total_items,
      startedAt: s.started_at
    }));
  },

  /**
   * Historique des sessions de synchronisation
   */
  async getSessionHistory(options = {}) {
    const { page = 1, limit = 20, entityType = null, status = null } = options;

    const whereClause = {};
    if (entityType) whereClause.entity_type = entityType;
    if (status) whereClause.status = status;

    const { count, rows } = await SyncSession.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    return {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit)),
      sessions: rows.map(s => ({
        id: s.id_sync_session,
        type: s.type,
        entityType: s.entity_type,
        status: s.status,
        startedAt: s.started_at,
        completedAt: s.completed_at,
        duration: s.completed_at && s.started_at 
          ? Math.round((new Date(s.completed_at) - new Date(s.started_at)) / 1000) 
          : null,
        totalItems: s.total_items,
        inserted: s.inserted_count,
        updated: s.updated_count,
        errors: s.error_count,
        skipped: s.skipped_count,
        initiatedBy: s.initiated_by
      }))
    };
  },

  /**
   * Récupère le dernier état de synchronisation global
   */
  async getGlobalSyncStatus() {
    // Sessions actives
    const activeSessions = await this.getActiveSessions();

    // Dernière session réussie par type d'entité
    const entityTypes = ['utilisateurs', 'signalements', 'problemes', 'all'];
    const lastSuccessful = {};

    for (const entityType of entityTypes) {
      const last = await SyncSession.findOne({
        where: {
          entity_type: entityType,
          status: 'completed'
        },
        order: [['completed_at', 'DESC']]
      });

      if (last) {
        lastSuccessful[entityType] = {
          sessionId: last.id_sync_session,
          completedAt: last.completed_at,
          inserted: last.inserted_count,
          updated: last.updated_count,
          errors: last.error_count
        };
      }
    }

    // Statistiques des dernières 24h
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentStats = await SyncSession.findAll({
      where: {
        created_at: { [Op.gte]: last24h }
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id_sync_session')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    return {
      activeSessions,
      isRunning: activeSessions.length > 0,
      lastSuccessful,
      last24hStats: recentStats.reduce((acc, s) => {
        acc[s.status] = parseInt(s.count);
        return acc;
      }, {})
    };
  },

  /**
   * Nettoie les anciennes sessions (plus de 30 jours)
   */
  async cleanupOldSessions(daysToKeep = 30) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const deleted = await SyncSession.destroy({
      where: {
        created_at: { [Op.lt]: cutoffDate },
        status: { [Op.in]: ['completed', 'failed', 'cancelled'] }
      }
    });

    console.log(`🧹 ${deleted} anciennes sessions supprimées`);
    return deleted;
  }
};

module.exports = syncSessionService;
