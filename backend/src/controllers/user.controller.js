const userService = require('../services/user.service');

const userController = {
  async getMe(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await userService.getUserById(userId);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  async getAll(req, res, next) {
    try {
      const { limit = 10, offset = 0 } = req.query;
      const users = await userService.getAllUsers(parseInt(limit), parseInt(offset));

      return res.status(200).json({
        success: true,
        data: users.rows,
        total: users.count,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { firstName, lastName } = req.body;

      const user = await userService.updateUser(id, { firstName, lastName });

      return res.status(200).json({
        success: true,
        message: 'Utilisateur mis à jour',
        data: user,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);

      return res.status(200).json({
        success: true,
        message: 'Utilisateur supprimé',
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = userController;
