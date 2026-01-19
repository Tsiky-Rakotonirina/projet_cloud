const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');

const router = express.Router();

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes utilisateur
router.use('/users', userRoutes);

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Check API health
 *     responses:
 *       200:
 *         description: API is running
 */
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'API is running' });
});

module.exports = router;
