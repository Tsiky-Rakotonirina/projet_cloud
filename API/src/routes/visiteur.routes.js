const express = require('express');
const visiteurController = require('../controllers/visiteur.controller');

const router = express.Router();

/**
 * @swagger
 * /api/visiteur/point/{pointId}:
 *   get:
 *     tags:
 *       - Visiteur
 *     summary: Récupérer les infos d'un point avec le problème associé
 *     description: |
 *       Retourne les infos complets lors du survol d'un point sur la carte.
 *       Structure: 1 Point -> 1 Signalement -> 1 Problème
 *       Affiche: date, statut (nouveau/en_cours/terminé), surface (m²), budget, entreprise
 *     parameters:
 *       - name: pointId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Infos du point et du problème associé
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
 *                     point:
 *                       type: object
 *                       properties:
 *                         id_points:
 *                           type: integer
 *                         geometry:
 *                           type: object
 *                           description: GeoJSON Point (lat/lng)
 *                         ville:
 *                           type: object
 *                           properties:
 *                             id_villes:
 *                               type: integer
 *                             nom:
 *                               type: string
 *                     signalement:
 *                       type: object
 *                       properties:
 *                         id_signalements:
 *                           type: integer
 *                         description:
 *                           type: string
 *                         date:
 *                           type: string
 *                           format: date-time
 *                     probleme:
 *                       type: object
 *                       properties:
 *                         id_problemes:
 *                           type: integer
 *                         surface:
 *                           type: number
 *                           description: Surface en m²
 *                         budget:
 *                           type: number
 *                         date:
 *                           type: string
 *                           format: date-time
 *                         statut:
 *                           type: object
 *                           properties:
 *                             libelle:
 *                               type: string
 *                               example: en_cours
 *                             descri:
 *                               type: string
 *                             pourcentage:
 *                               type: integer
 *                               example: 50
 *                         entreprise:
 *                           type: object
 *                           properties:
 *                             id_entreprises:
 *                               type: integer
 *                             nom:
 *                               type: string
 *                             adresse:
 *                               type: string
 *                             telephone:
 *                               type: string
 *       404:
 *         description: Point non trouvé, ou aucun signalement/problème associé
 */
router.get('/point/:pointId', visiteurController.getPointWithProbleme);

/**
 * @swagger
 * /api/visiteur/stats:
 *   get:
 *     tags:
 *       - Visiteur
 *     summary: Récupérer le tableau de récapitulation actuel
 *     description: |
 *       Retourne les statistiques globales de récapitulation pour le tableau de bord:
 *       - Nombre total de points
 *       - Surface totale (somme de toutes les surfaces)
 *       - Avancement moyen en % (moyenne des pourcentages de statut de tous les problèmes)
 *       - Budget total
 *     responses:
 *       200:
 *         description: Statistiques de récapitulation
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
 *                     total_points:
 *                       type: integer
 *                       example: 25
 *                     total_surface:
 *                       type: number
 *                       description: Total en m²
 *                       example: 1250.75
 *                     total_budget:
 *                       type: number
 *                       description: Budget total en devise
 *                       example: 50000
 *                     avancement_moyen_pourcent:
 *                       type: integer
 *                       description: Moyenne des pourcentages d'avancement
 *                       example: 35
 *                     nombre_problemes:
 *                       type: integer
 *                       example: 25
 */
router.get('/stats', visiteurController.getSummaryStats);

module.exports = router;
