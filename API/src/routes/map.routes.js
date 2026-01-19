const express = require('express');
const mapController = require('../controllers/map.controller');

const router = express.Router();

/**
 * @swagger
 * /api/map/signalements:
 *   get:
 *     tags:
 *       - Map (Visiteur)
 *     summary: Récupérer tous les signalements
 *     description: Retourne tous les signalements avec leurs coordonnées géographiques (GeoJSON)
 *     responses:
 *       200:
 *         description: Liste des signalements
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
 *                       geometry:
 *                         type: object
 *                         description: GeoJSON Point
 *                       statut:
 *                         type: string
 *                       email_utilisateur:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 */
router.get('/signalements', mapController.getSignalements);

/**
 * @swagger
 * /api/map/signalements/{id}:
 *   get:
 *     tags:
 *       - Map (Visiteur)
 *     summary: Récupérer un signalement par ID
 *     description: Retourne les détails complets d'un signalement
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Détails du signalement
 *       404:
 *         description: Signalement non trouvé
 */
router.get('/signalements/:id', mapController.getSignalementById);

/**
 * @swagger
 * /api/map/problemes:
 *   get:
 *     tags:
 *       - Map (Visiteur)
 *     summary: Récupérer tous les problèmes
 *     description: Retourne tous les problèmes avec leurs coordonnées, surface, budget et statut
 *     responses:
 *       200:
 *         description: Liste des problèmes
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
 *                       id_problemes:
 *                         type: integer
 *                       surface:
 *                         type: number
 *                       budget:
 *                         type: number
 *                       geometry:
 *                         type: object
 *                         description: GeoJSON Point
 *                       description:
 *                         type: string
 *                       statut:
 *                         type: string
 *                       pourcentage:
 *                         type: integer
 *                       entreprise:
 *                         type: string
 */
router.get('/problemes', mapController.getProblemes);

/**
 * @swagger
 * /api/map/problemes/{id}:
 *   get:
 *     tags:
 *       - Map (Visiteur)
 *     summary: Récupérer un problème par ID
 *     description: Retourne les détails complets d'un problème avec signalement associé
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Détails du problème
 *       404:
 *         description: Problème non trouvé
 */
router.get('/problemes/:id', mapController.getProblemeById);

/**
 * @swagger
 * /api/map/rues:
 *   get:
 *     tags:
 *       - Map (Visiteur)
 *     summary: Récupérer toutes les rues
 *     description: Retourne toutes les rues avec leurs géométries (LineString) pour affichage sur la carte
 *     responses:
 *       200:
 *         description: Liste des rues
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
 *                       id_rues:
 *                         type: integer
 *                       nom:
 *                         type: string
 *                       geometry:
 *                         type: object
 *                         description: GeoJSON LineString
 *                       type:
 *                         type: string
 *                       ville:
 *                         type: string
 */
router.get('/rues', mapController.getRues);

/**
 * @swagger
 * /api/map/villes:
 *   get:
 *     tags:
 *       - Map (Visiteur)
 *     summary: Récupérer toutes les villes
 *     description: Retourne toutes les villes avec leurs coordonnées géographiques
 *     responses:
 *       200:
 *         description: Liste des villes
 */
router.get('/villes', mapController.getVilles);

/**
 * @swagger
 * /api/map/stats:
 *   get:
 *     tags:
 *       - Map (Visiteur)
 *     summary: Récupérer les statistiques de la carte
 *     description: Retourne les statistiques (total et par statut) des signalements et problèmes
 *     responses:
 *       200:
 *         description: Statistiques
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
 *                     signalements:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         par_statut:
 *                           type: array
 *                     problemes:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         par_statut:
 *                           type: array
 */
router.get('/stats', mapController.getStats);

/**
 * @swagger
 * /api/map/data:
 *   get:
 *     tags:
 *       - Map (Visiteur)
 *     summary: Récupérer toutes les données cartographiques
 *     description: Retourne signalements, problèmes, rues et statistiques en une seule requête (utile pour le offline)
 *     responses:
 *       200:
 *         description: Données complètes
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
 *                     signalements:
 *                       type: array
 *                     problemes:
 *                       type: array
 *                     rues:
 *                       type: array
 *                     stats:
 *                       type: object
 */
router.get('/data', mapController.getMapData);

module.exports = router;
