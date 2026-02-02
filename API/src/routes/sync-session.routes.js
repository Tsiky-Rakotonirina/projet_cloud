const express = require('express');
const syncSessionController = require('../controllers/sync-session.controller');

const router = express.Router();

/**
 * @swagger
 * /api/sync-session/users/push:
 *   post:
 *     tags:
 *       - Synchronisation Avancée
 *     summary: PUSH utilisateurs avec suivi détaillé
 *     description: Synchronise les utilisateurs Firebase → PostgreSQL avec tracking en temps réel de chaque utilisateur
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               initiatedBy:
 *                 type: string
 *                 description: Identifiant de l'utilisateur/système qui initie la sync
 *     responses:
 *       200:
 *         description: Synchronisation terminée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       format: uuid
 *                     stats:
 *                       type: object
 *       409:
 *         description: Une synchronisation est déjà en cours
 */
router.post('/users/push', syncSessionController.pushUtilisateursWithTracking);

/**
 * @swagger
 * /api/sync-session/users/pull:
 *   post:
 *     tags:
 *       - Synchronisation Avancée
 *     summary: PULL utilisateurs avec suivi détaillé
 *     description: Synchronise les utilisateurs PostgreSQL → Firebase avec tracking en temps réel de chaque utilisateur
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               initiatedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Synchronisation terminée
 *       409:
 *         description: Une synchronisation est déjà en cours
 */
router.post('/users/pull', syncSessionController.pullUtilisateursWithTracking);

/**
 * @swagger
 * /api/sync-session/all:
 *   post:
 *     tags:
 *       - Synchronisation Avancée
 *     summary: Synchronisation complète avec suivi
 *     description: Synchronise toutes les entités dans les deux sens avec tracking
 *     responses:
 *       200:
 *         description: Synchronisation complète terminée
 */
router.post('/all', syncSessionController.syncAllWithTracking);

/**
 * @swagger
 * /api/sync-session/active:
 *   get:
 *     tags:
 *       - Synchronisation Avancée
 *     summary: Sessions actives
 *     description: Récupère toutes les sessions de synchronisation en cours
 *     responses:
 *       200:
 *         description: Liste des sessions actives
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                           progress:
 *                             type: number
 *                           currentStep:
 *                             type: string
 */
router.get('/active', syncSessionController.getActiveSessions);

/**
 * @swagger
 * /api/sync-session/global-status:
 *   get:
 *     tags:
 *       - Synchronisation Avancée
 *     summary: Statut global de synchronisation
 *     description: Vue d'ensemble de l'état de synchronisation (sessions actives, dernières sync réussies, stats 24h)
 *     responses:
 *       200:
 *         description: Statut global récupéré
 */
router.get('/global-status', syncSessionController.getGlobalStatus);

/**
 * @swagger
 * /api/sync-session/history:
 *   get:
 *     tags:
 *       - Synchronisation Avancée
 *     summary: Historique des sessions
 *     description: Récupère l'historique des sessions de synchronisation
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [utilisateurs, signalements, problemes, all]
 *         description: Filtrer par type d'entité
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, failed, cancelled]
 *         description: Filtrer par statut
 *     responses:
 *       200:
 *         description: Historique récupéré
 */
router.get('/history', syncSessionController.getSessionHistory);

/**
 * @swagger
 * /api/sync-session/{sessionId}:
 *   get:
 *     tags:
 *       - Synchronisation Avancée
 *     summary: Détails d'une session
 *     description: Récupère le statut détaillé d'une session de synchronisation spécifique
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Détails de la session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         status:
 *                           type: string
 *                         progressPercentage:
 *                           type: number
 *                         totalItems:
 *                           type: integer
 *                         processedItems:
 *                           type: integer
 *                         insertedCount:
 *                           type: integer
 *                         updatedCount:
 *                           type: integer
 *                         errorCount:
 *                           type: integer
 *                     recentItems:
 *                       type: array
 *       404:
 *         description: Session non trouvée
 */
router.get('/:sessionId', syncSessionController.getSessionStatus);

/**
 * @swagger
 * /api/sync-session/{sessionId}/users:
 *   get:
 *     tags:
 *       - Synchronisation Avancée
 *     summary: Liste des utilisateurs synchronisés
 *     description: Récupère la liste paginée des utilisateurs synchronisés dans une session
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, success, failed, skipped]
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [insert, update, skip, error]
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           email:
 *                             type: string
 *                           action:
 *                             type: string
 *                           status:
 *                             type: string
 *                           syncedAt:
 *                             type: string
 *                             format: date-time
 */
router.get('/:sessionId/users', syncSessionController.getSessionUsers);

/**
 * @swagger
 * /api/sync-session/{sessionId}/cancel:
 *   post:
 *     tags:
 *       - Synchronisation Avancée
 *     summary: Annuler une session
 *     description: Annule une session de synchronisation en cours
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Session annulée
 *       400:
 *         description: La session ne peut pas être annulée
 */
router.post('/:sessionId/cancel', syncSessionController.cancelSession);

/**
 * @swagger
 * /api/sync-session/cleanup:
 *   post:
 *     tags:
 *       - Synchronisation Avancée
 *     summary: Nettoyer les anciennes sessions
 *     description: Supprime les sessions terminées de plus de X jours
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysToKeep:
 *                 type: integer
 *                 default: 30
 *     responses:
 *       200:
 *         description: Sessions nettoyées
 */
router.post('/cleanup', syncSessionController.cleanupSessions);

module.exports = router;
