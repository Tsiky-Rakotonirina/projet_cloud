const adminService = require('../services/admin.service');

const adminController = {
  async adminLogin(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await adminService.adminLogin(email, password);

      return res.sendSuccess('Connexion admin réussie', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 400);
      }
      next(error);
    }
  },

  async blockUser(req, res, next) {
    try {
      const { utilisateur_id, raison } = req.body;

      const result = await adminService.blockUser(utilisateur_id, raison);

      return res.sendSuccess('Utilisateur bloqué avec succès', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 400);
      }
      next(error);
    }
  },

  async unblockUser(req, res, next) {
    try {
      const { utilisateur_id } = req.body;

      const result = await adminService.unblockUser(utilisateur_id);

      return res.sendSuccess('Utilisateur débloqué avec succès', result, 200);
    } catch (error) {
      if (error.code) {
        return res.sendError(error.message, { code: error.code }, error.status || 400);
      }
      next(error);
    }
  },

  async getBlockedUsers(req, res, next) {
    try {
      const result = await adminService.getBlockedUsers();

      return res.sendSuccess('Liste des utilisateurs bloqués', result, 200);
    } catch (error) {
      next(error);
    }
  },

  async getCurrentUserStatus(req, res, next) {
    try {
      const { utilisateur_id } = req.params;

      const result = await adminService.getCurrentUserStatus(parseInt(utilisateur_id));

      if (!result) {
        return res.sendError('Statut non trouvé pour cet utilisateur', { code: 'STATUS_NOT_FOUND' }, 404);
      }

      return res.sendSuccess('Statut actuel de l\'utilisateur', result, 200);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminController;
