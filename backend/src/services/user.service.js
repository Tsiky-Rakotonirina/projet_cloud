const { User } = require('../models');

const userService = {
  async getUserById(id) {
    try {
      const user = await User.findByPk(id, {
        attributes: ['id', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt'],
      });

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      return user;
    } catch (error) {
      throw error;
    }
  },

  async getAllUsers(limit = 10, offset = 0) {
    try {
      const users = await User.findAndCountAll({
        attributes: ['id', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt'],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return users;
    } catch (error) {
      throw error;
    }
  },

  async updateUser(id, data) {
    try {
      const user = await User.findByPk(id);

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      await user.update(data);

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    } catch (error) {
      throw error;
    }
  },

  async deleteUser(id) {
    try {
      const user = await User.findByPk(id);

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      await user.destroy();

      return { message: 'Utilisateur supprimé avec succès' };
    } catch (error) {
      throw error;
    }
  },
};

module.exports = userService;
