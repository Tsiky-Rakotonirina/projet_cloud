const db = require('../models');

// Récupérer une configuration par clé
exports.getByKey = async (req, res, next) => {
  try {
    const { cle } = req.params;
    const config = await db.Configuration.findOne({ where: { cle } });
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Configuration '${cle}' non trouvée`,
      });
    }
    
    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer le prix par m2
exports.getPrixParM2 = async (req, res, next) => {
  try {
    const config = await db.Configuration.findOne({ where: { cle: 'prix_par_m2' } });
    
    res.json({
      success: true,
      data: {
        prix_par_m2: config ? parseFloat(config.valeur) : 1000,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Mettre à jour une configuration
exports.updateByKey = async (req, res, next) => {
  try {
    const { cle } = req.params;
    const { valeur } = req.body;
    
    if (valeur === undefined || valeur === null) {
      return res.status(400).json({
        success: false,
        message: 'La valeur est requise',
      });
    }
    
    const [updated] = await db.Configuration.update(
      { valeur, updated_at: new Date() },
      { where: { cle } }
    );
    
    if (updated === 0) {
      // Créer si n'existe pas
      await db.Configuration.create({ cle, valeur });
    }
    
    const config = await db.Configuration.findOne({ where: { cle } });
    
    res.json({
      success: true,
      message: `Configuration '${cle}' mise à jour`,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

// Mettre à jour le prix par m2
exports.updatePrixParM2 = async (req, res, next) => {
  try {
    const { prix_par_m2 } = req.body;
    
    if (prix_par_m2 === undefined || prix_par_m2 === null || prix_par_m2 <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le prix par m2 doit être un nombre positif',
      });
    }
    
    const [updated] = await db.Configuration.update(
      { valeur: prix_par_m2, updated_at: new Date() },
      { where: { cle: 'prix_par_m2' } }
    );
    
    if (updated === 0) {
      await db.Configuration.create({ 
        cle: 'prix_par_m2', 
        valeur: prix_par_m2,
        description: 'Prix forfaitaire par mètre carré pour le calcul du budget'
      });
    }
    
    res.json({
      success: true,
      message: 'Prix par m2 mis à jour',
      data: { prix_par_m2: parseFloat(prix_par_m2) },
    });
  } catch (error) {
    next(error);
  }
};

// Lister toutes les configurations
exports.getAll = async (req, res, next) => {
  try {
    const configs = await db.Configuration.findAll();
    res.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    next(error);
  }
};
