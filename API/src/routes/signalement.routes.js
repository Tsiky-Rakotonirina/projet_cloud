const express = require('express');
const signalementController = require('../controllers/signalement.controller');

const router = express.Router();

/**
 * @swagger
 * /api/signalement:
 *   get:
 *     tags:
 *       - Signalement
 *     summary: Récupérer tous les signalements
 *     description: Retourne la liste de tous les signalements avec leurs infos résumées (statut, surface, budget, nombre de problèmes)
 *     responses:
 *       200:
 *         description: Liste de tous les signalements
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_signalements:
 *                         type: integer
 *                       description:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       ville:
 *                         type: string
 *                       email_utilisateur:
 *                         type: string
 *                       statut:
 *                         type: string
 *                       nombre_problemes:
 *                         type: integer
 *                       total_surface:
 *                         type: number
 *                         description: Surface totale en m²
 *                       total_budget:
 *                         type: number
 */
router.get('/', signalementController.getAllSignalements);

/**
 * @swagger
 * /api/signalement/{signalementId}:
 *   get:
 *     tags:
 *       - Signalement
 *     summary: Récupérer les détails complets d'un signalement
 *     description: Retourne toutes les infos du signalement incluant les problèmes associés, les surfaces, budgets et entreprises
 *     parameters:
 *       - name: signalementId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Détails du signalement
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
 *                     id_signalements:
 *                       type: integer
 *                     description:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date-time
 *                     statut:
 *                       type: object
 *                       properties:
 *                         libelle:
 *                           type: string
 *                         descri:
 *                           type: string
 *                     utilisateur:
 *                       type: object
 *                       properties:
 *                         id_utilisateurs:
 *                           type: integer
 *                         email:
 *                           type: string
 *                     point:
 *                       type: object
 *                       properties:
 *                         id_points:
 *                           type: integer
 *                         geometry:
 *                           type: object
 *                           description: GeoJSON Point
 *                         ville:
 *                           type: object
 *                     problemes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id_problemes:
 *                             type: integer
 *                           surface:
 *                             type: number
 *                           budget:
 *                             type: number
 *                           entreprise:
 *                             type: object
 *                     total_surface:
 *                       type: number
 *                     total_budget:
 *                       type: number
 *       404:
 *         description: Signalement non trouvé
 */
router.get('/:signalementId', signalementController.getSignalementWithDetails);

/**
 * @swagger
 * /api/signalement/{signalementId}/statut:
 *   put:
 *     tags:
 *       - Signalement
 *     summary: Modifier le statut d'un signalement
 *     description: Change le statut d'un signalement et crée une entrée dans l'historique
 *     parameters:
 *       - name: signalementId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [statut_id, utilisateur_id]
 *             properties:
 *               statut_id:
 *                 type: integer
 *                 example: 2
 *               utilisateur_id:
 *                 type: integer
 *                 description: ID de l'utilisateur effectuant la modification
 *                 example: 1
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_signalement_historique:
 *                   type: integer
 *                 signalement_id:
 *                   type: integer
 *                 statut:
 *                   type: string
 *                 date_historique:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Signalement ou statut non trouvé
 */
router.put('/:signalementId/statut', signalementController.updateSignalementStatut);

/**
 * @swagger
 * /api/signalement/{signalementId}/historique:
 *   get:
 *     tags:
 *       - Signalement
 *     summary: Récupérer l'historique des statuts d'un signalement
 *     description: Retourne tous les changements de statut du signalement avec dates et utilisateurs responsables
 *     parameters:
 *       - name: signalementId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Historique des statuts
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       statut:
 *                         type: string
 *                       utilisateur:
 *                         type: string
 */
router.get('/:signalementId/historique', signalementController.getSignalementStatutHistory);

/**
 * @swagger
 * /api/signalement/statut/{statut}:
 *   get:
 *     tags:
 *       - Signalement
 *     summary: Récupérer tous les signalements par statut
 *     description: Filtre et retourne tous les signalements avec un statut spécifique
 *     parameters:
 *       - name: statut
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: nouveau
 *     responses:
 *       200:
 *         description: Signalements avec le statut spécifié
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
 *                   type: array
 *       404:
 *         description: Statut non trouvé
 */
router.get('/statut/:statut', signalementController.getSignalementsByStatut);

module.exports = router;
