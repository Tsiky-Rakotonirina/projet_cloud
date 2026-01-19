const authService = require('../services/auth.service');

const authController = {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validation de base
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe sont obligatoires',
        });
      }

      const result = await authService.register(email, password, firstName, lastName);

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validation de base
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe sont obligatoires',
        });
      }

      const result = await authService.login(email, password);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = authController;
