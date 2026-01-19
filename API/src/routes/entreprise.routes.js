const express = require('express');
const entrepriseController = require('../controllers/entreprise.controller');

const router = express.Router();

/**
 * @swagger
 * /api/entreprises:
 *   get:
 *     tags:
 *       - Entreprises
 *     summary: Récupérer toutes les entreprises
 *     description: Retourne la liste de toutes les entreprises de travaux publics
 *     responses:
 *       200:
 *         description: Liste des entreprises
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
 *                       id_entreprises:
 *                         type: integer
 *                       nom:
 *                         type: string
 *                       adresse:
 *                         type: string
 *                       telephone:
 *                         type: string
 *   post:
 *     tags:
 *       - Entreprises
 *     summary: Créer une nouvelle entreprise
 *     description: Ajoute une nouvelle entreprise de travaux publics
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *             properties:
 *               nom:
 *                 type: string
 *                 example: SORGETRAM
 *               adresse:
 *                 type: string
 *                 example: 123 Avenue de l'Indépendance
 *               telephone:
 *                 type: string
 *                 example: '+261 20 22 123 45'
 *     responses:
 *       201:
 *         description: Entreprise créée avec succès
 *       400:
 *         description: Erreur de validation
 */
router.get('/', entrepriseController.getAllEntreprises);
router.post('/', entrepriseController.createEntreprise);

/**
 * @swagger
 * /api/entreprises/{id}:
 *   get:
 *     tags:
 *       - Entreprises
 *     summary: Récupérer une entreprise par ID
 *     description: Retourne les détails d'une entreprise et ses problèmes assignés
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Entreprise trouvée
 *       404:
 *         description: Entreprise non trouvée
 *   put:
 *     tags:
 *       - Entreprises
 *     summary: Mettre à jour une entreprise
 *     description: Modifie les informations d'une entreprise
 *     parameters:
 *       - name: id
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
 *             properties:
 *               nom:
 *                 type: string
 *               adresse:
 *                 type: string
 *               telephone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entreprise mise à jour avec succès
 *       404:
 *         description: Entreprise non trouvée
 *   delete:
 *     tags:
 *       - Entreprises
 *     summary: Supprimer une entreprise
 *     description: Supprime une entreprise et tous ses problèmes associés
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Entreprise supprimée avec succès
 *       404:
 *         description: Entreprise non trouvée
 */
router.get('/:id', entrepriseController.getEntrepriseById);
router.put('/:id', entrepriseController.updateEntreprise);
router.delete('/:id', entrepriseController.deleteEntreprise);

/**
 * @swagger
 * /api/entreprises/{id}/problemes:
 *   get:
 *     tags:
 *       - Entreprises
 *     summary: Récupérer les problèmes assignés à une entreprise
 *     description: Retourne la liste de tous les problèmes/travaux assignés à une entreprise avec leurs statuts
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Liste des problèmes de l'entreprise
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
 *                       statut:
 *                         type: object
 *       404:
 *         description: Entreprise non trouvée
 */
router.get('/:id/problemes', entrepriseController.getEntrepriseProblemes);

module.exports = router;
