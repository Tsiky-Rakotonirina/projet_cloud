const bcrypt = require('bcrypt');
const { User } = require('../models');
const { generateToken } = require('../utils/jwt');

const authService = {
  async register(email, password, firstName, lastName) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new Error('Cet email est déjà utilisé');
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur
      const user = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
      });

      // Générer un token JWT
      const token = generateToken({
        id: user.id,
        email: user.email,
      });

      return {
        success: true,
        message: 'Enregistrement réussi',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      throw error;
    }
  },

  async login(email, password) {
    try {
      // Trouver l'utilisateur
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new Error('Email ou mot de passe incorrect');
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Email ou mot de passe incorrect');
      }

      // Générer un token JWT
      const token = generateToken({
        id: user.id,
        email: user.email,
      });

      return {
        success: true,
        message: 'Connexion réussie',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      throw error;
    }
  },
};

module.exports = authService;
