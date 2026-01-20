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

module.exports = router;
