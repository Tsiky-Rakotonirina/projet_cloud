const authService = require('../services/auth.service');

const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      return res.sendSuccess('Connexion réussie', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 400);
      }
      next(error);
    }
  },

  async register(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await authService.register(email, password);

      return res.sendSuccess('Enregistrement réussi', result, 201);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 400);
      }
      next(error);
    }
  },
};

module.exports = authController;
