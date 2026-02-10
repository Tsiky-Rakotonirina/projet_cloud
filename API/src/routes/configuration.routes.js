const express = require('express');
const router = express.Router();
const configController = require('../controllers/configuration.controller');

// GET /api/config - Lister toutes les configurations
router.get('/', configController.getAll);

// GET /api/config/prix-par-m2 - Récupérer le prix par m2
router.get('/prix-par-m2', configController.getPrixParM2);

// PUT /api/config/prix-par-m2 - Mettre à jour le prix par m2
router.put('/prix-par-m2', configController.updatePrixParM2);

// GET /api/config/:cle - Récupérer une configuration par clé
router.get('/:cle', configController.getByKey);

// PUT /api/config/:cle - Mettre à jour une configuration par clé
router.put('/:cle', configController.updateByKey);

module.exports = router;
