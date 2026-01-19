const express = require('express');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Connexion administrateur
 *     description: Authentifie un administrateur avec email et mot de passe (pas de gestion de tentatives)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Connexion réussie
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
 *                     id_utilisateurs:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     profil:
 *                       type: string
 *       401:
 *         description: Email ou mot de passe incorrect
 *       403:
 *         description: Droits administrateur requis
 *       400:
 *         description: Erreur de validation
 */
router.post('/login', adminController.adminLogin);

/**
 * @swagger
 * /api/admin/block:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Bloquer un utilisateur
 *     description: Change le statut d'un utilisateur à "bloque"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [utilisateur_id]
 *             properties:
 *               utilisateur_id:
 *                 type: integer
 *                 example: 1
 *               raison:
 *                 type: string
 *                 example: Trop de tentatives de connexion échouées
 *     responses:
 *       200:
 *         description: Utilisateur bloqué avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_utilisateur_statut:
 *                   type: integer
 *                 utilisateur_id:
 *                   type: integer
 *                 statut:
 *                   type: string
 *                 raison:
 *                   type: string
 *                 date_statut:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Utilisateur non trouvé
 *       400:
 *         description: Erreur de validation
 */
router.post('/block', adminController.blockUser);

/**
 * @swagger
 * /api/admin/unblock:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Débloquer un utilisateur
 *     description: Change le statut d'un utilisateur à "actif"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [utilisateur_id]
 *             properties:
 *               utilisateur_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Utilisateur débloqué avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_utilisateur_statut:
 *                   type: integer
 *                 utilisateur_id:
 *                   type: integer
 *                 statut:
 *                   type: string
 *                 date_statut:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Utilisateur non trouvé
 *       400:
 *         description: Erreur de validation
 */
router.post('/unblock', adminController.unblockUser);

/**
 * @swagger
 * /api/admin/blocked-users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Lister les utilisateurs bloqués
 *     description: Récupère tous les utilisateurs avec statut "bloque"
 *     responses:
 *       200:
 *         description: Liste des utilisateurs bloqués
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
 *                       id_utilisateur_statut:
 *                         type: integer
 *                       utilisateur_id:
 *                         type: integer
 *                       email:
 *                         type: string
 *                       profil:
 *                         type: string
 *                       statut:
 *                         type: string
 *                       date_statut:
 *                         type: string
 *                         format: date-time
 */
router.get('/blocked-users', adminController.getBlockedUsers);

/**
 * @swagger
 * /api/admin/user-status/{utilisateur_id}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Obtenir le statut actuel d'un utilisateur
 *     description: Récupère le dernier statut assigné à un utilisateur
 *     parameters:
 *       - name: utilisateur_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Statut de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 utilisateur_id:
 *                   type: integer
 *                 statut:
 *                   type: string
 *                 date_statut:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Statut non trouvé
 */
router.get('/user-status/:utilisateur_id', adminController.getCurrentUserStatus);

module.exports = router;
