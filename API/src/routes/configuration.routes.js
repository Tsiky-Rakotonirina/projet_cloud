const express = require('express');
const router = express.Router();
const configController = require('../controllers/configuration.controller');

/**
 * @swagger
 * /api/config:
 *   get:
 *     tags:
 *       - Configuration
 *     summary: Lister toutes les configurations
 *     description: Retourne toutes les configurations système
 *     responses:
 *       200:
 *         description: Liste des configurations
 */
router.get('/', configController.getAll);

/**
 * @swagger
 * /api/config/prix-par-m2:
 *   get:
 *     tags:
 *       - Configuration
 *     summary: Récupérer le prix par m²
 *     description: Retourne le prix forfaitaire par m² utilisé pour calculer les budgets
 *     responses:
 *       200:
 *         description: Prix par m²
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
 *                     cle:
 *                       type: string
 *                       example: prix_par_m2
 *                     valeur:
 *                       type: string
 *                       example: "1000"
 */
router.get('/prix-par-m2', configController.getPrixParM2);

/**
 * @swagger
 * /api/config/prix-par-m2:
 *   put:
 *     tags:
 *       - Configuration
 *     summary: Mettre à jour le prix par m²
 *     description: Modifie le prix forfaitaire par m² (affecte le calcul des budgets futurs)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - valeur
 *             properties:
 *               valeur:
 *                 type: string
 *                 example: "1500"
 *     responses:
 *       200:
 *         description: Configuration mise à jour
 */
router.put('/prix-par-m2', configController.updatePrixParM2);

/**
 * @swagger
 * /api/config/{cle}:
 *   get:
 *     tags:
 *       - Configuration
 *     summary: Récupérer une configuration par clé
 *     parameters:
 *       - in: path
 *         name: cle
 *         required: true
 *         schema:
 *           type: string
 *         description: Clé de la configuration
 *     responses:
 *       200:
 *         description: Configuration trouvée
 *       404:
 *         description: Configuration non trouvée
 */
router.get('/:cle', configController.getByKey);

/**
 * @swagger
 * /api/config/{cle}:
 *   put:
 *     tags:
 *       - Configuration
 *     summary: Mettre à jour une configuration par clé
 *     parameters:
 *       - in: path
 *         name: cle
 *         required: true
 *         schema:
 *           type: string
 *         description: Clé de la configuration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - valeur
 *             properties:
 *               valeur:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configuration mise à jour
 */
router.put('/:cle', configController.updateByKey);

module.exports = router;
