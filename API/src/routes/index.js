const express = require('express');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const mapRoutes = require('./map.routes');
const visiteurRoutes = require('./visiteur.routes');
const signalementRoutes = require('./signalement.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/map', mapRoutes);
router.use('/visiteur', visiteurRoutes);
router.use('/signalement', signalementRoutes);

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
