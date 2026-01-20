const express = require('express');
const syncController = require('../controllers/sync.controller');

const router = express.Router();

/**
 * @swagger
 * /api/sync/users/push:
 *   post:
 *     tags:
 *       - Synchronisation
 *     summary: PUSH utilisateurs Firebase → PostgreSQL
 *     description: Synchronise les utilisateurs depuis Firebase vers PostgreSQL (mobile vers web)
 *     responses:
 *       200:
 *         description: Synchronisation réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         inserted:
 *                           type: integer
 *                         updated:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         errors:
 *                           type: array
 *       500:
 *         description: Erreur lors de la synchronisation
 */
router.post('/users/push', syncController.pushUtilisateurs);

/**
 * @swagger
 * /api/sync/users/pull:
 *   post:
 *     tags:
 *       - Synchronisation
 *     summary: PULL utilisateurs PostgreSQL → Firebase
 *     description: Synchronise les utilisateurs depuis PostgreSQL vers Firebase (web vers mobile)
 *     responses:
 *       200:
 *         description: Synchronisation réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         inserted:
 *                           type: integer
 *                         updated:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         errors:
 *                           type: array
 *       500:
 *         description: Erreur lors de la synchronisation
 */
router.post('/users/pull', syncController.pullUtilisateurs);

/**
 * @swagger
 * /api/sync/signalements/push:
 *   post:
 *     tags:
 *       - Synchronisation
 *     summary: PUSH signalements Firebase → PostgreSQL
 *     description: Synchronise les signalements depuis Firebase vers PostgreSQL (mobile vers web)
 *     responses:
 *       200:
 *         description: Synchronisation réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         inserted:
 *                           type: integer
 *                         updated:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         errors:
 *                           type: array
 *       500:
 *         description: Erreur lors de la synchronisation
 */
router.post('/signalements/push', syncController.pushSignalements);

/**
 * @swagger
 * /api/sync/signalements/pull:
 *   post:
 *     tags:
 *       - Synchronisation
 *     summary: PULL signalements PostgreSQL → Firebase
 *     description: Synchronise les signalements depuis PostgreSQL vers Firebase (web vers mobile)
 *     responses:
 *       200:
 *         description: Synchronisation réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         inserted:
 *                           type: integer
 *                         updated:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         errors:
 *                           type: array
 *       500:
 *         description: Erreur lors de la synchronisation
 */
router.post('/signalements/pull', syncController.pullSignalements);

/**
 * @swagger
 * /api/sync/all:
 *   post:
 *     tags:
 *       - Synchronisation
 *     summary: Synchronisation complète bidirectionnelle
 *     description: Synchronise tous les utilisateurs et signalements dans les deux sens (PUSH puis PULL)
 *     responses:
 *       200:
 *         description: Synchronisation complète réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: object
 *                       properties:
 *                         utilisateurs:
 *                           type: object
 *                           properties:
 *                             push:
 *                               type: object
 *                             pull:
 *                               type: object
 *                         signalements:
 *                           type: object
 *                           properties:
 *                             push:
 *                               type: object
 *                             pull:
 *                               type: object
 *       500:
 *         description: Erreur lors de la synchronisation
 */
router.post('/all', syncController.syncAll);

/**
 * @swagger
 * /api/sync/status:
 *   get:
 *     tags:
 *       - Synchronisation
 *     summary: Statut de la synchronisation
 *     description: Retourne le nombre d'entités synchronisées et la date de dernière synchronisation
 *     responses:
 *       200:
 *         description: Statut récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: object
 *                       properties:
 *                         utilisateurs:
 *                           type: object
 *                           properties:
 *                             total_postgres:
 *                               type: integer
 *                             synchronises:
 *                               type: integer
 *                             non_synchronises:
 *                               type: integer
 *                         signalements:
 *                           type: object
 *                           properties:
 *                             total_postgres:
 *                               type: integer
 *                             synchronises:
 *                               type: integer
 *                             non_synchronises:
 *                               type: integer
 *                         derniere_synchronisation:
 *                           type: string
 *                           format: date-time
 *       500:
 *         description: Erreur lors de la récupération du statut
 */
router.get('/status', syncController.getSyncStatus);

module.exports = router;
