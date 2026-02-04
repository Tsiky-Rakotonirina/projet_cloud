const express = require('express');
const problemeController = require('../controllers/probleme.controller');

const router = express.Router();

/**
 * @swagger
 * /api/probleme:
 *   post:
 *     tags:
 *       - Probleme
 *     summary: Créer un nouveau problème
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [signalement_id]
 *             properties:
 *               surface:
 *                 type: number
 *               budget:
 *                 type: number
 *               entreprise_id:
 *                 type: integer
 *               signalement_id:
 *                 type: integer
 *               probleme_statut_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Problème créé
 */
router.post('/', problemeController.createProbleme);

/**
 * @swagger
 * /api/probleme:
 *   get:
 *     tags:
 *       - Probleme
 *     summary: Récupérer tous les problèmes
 *     responses:
 *       200:
 *         description: Liste des problèmes
 */
router.get('/', problemeController.getAllProblemes);

/**
 * @swagger
 * /api/probleme/{problemeId}/historique:
 *   get:
 *     tags:
 *       - Probleme
 *     summary: Récupérer l'historique des statuts d'un problème
 *     parameters:
 *       - in: path
 *         name: problemeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du problème
 *     responses:
 *       200:
 *         description: Historique du problème
 */
router.get('/:problemeId/historique', problemeController.getProblemeHistorique);

/**
 * @swagger
 * /api/probleme/{problemeId}/avancer:
 *   put:
 *     tags:
 *       - Probleme
 *     summary: Avancer le statut d'un problème au niveau suivant (0% -> 50% -> 100%)
 *     parameters:
 *       - in: path
 *         name: problemeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du problème
 *     responses:
 *       200:
 *         description: Problème avancé
 */
router.put('/:problemeId/avancer', problemeController.avancerProbleme);

module.exports = router;
