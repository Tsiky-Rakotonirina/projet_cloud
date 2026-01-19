const bcrypt = require('bcrypt');
const { Utilisateur } = require('../models');
const { generateToken } = require('../utils/jwt');
const loginAttemptService = require('./login-attempt.service');

const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '3', 10);
const LOGIN_LOCK_DURATION = parseInt(process.env.LOGIN_LOCK_DURATION || '900000', 10);

const authService = {
  async login(email, password) {
    try {
      // Vérifier si le compte est verrouillé
      const lockStatus = loginAttemptService.isLocked(email);
      if (lockStatus.isLocked) {
        throw {
          code: 'ACCOUNT_LOCKED',
          message: `Compte verrouillé. Réessayez dans ${lockStatus.remainingTime} secondes`,
          remainingTime: lockStatus.remainingTime,
          status: 429,
        };
      }

      // Validation des paramètres
      if (!email || !password) {
        throw {
          code: 'INVALID_CREDENTIALS',
          message: 'Email et mot de passe sont obligatoires',
          status: 400,
        };
      }

      // Trouver l'utilisateur
      const user = await Utilisateur.findOne({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        loginAttemptService.incrementAttempts(email, MAX_LOGIN_ATTEMPTS, LOGIN_LOCK_DURATION);
        const remaining = loginAttemptService.getRemainingAttempts(
          email,
          MAX_LOGIN_ATTEMPTS
        );
        throw {
          code: 'INVALID_CREDENTIALS',
          message: 'Email ou mot de passe incorrect',
          remainingAttempts: remaining.remainingAttempts,
          status: 401,
        };
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.mot_de_passe);
      if (!isPasswordValid) {
        loginAttemptService.incrementAttempts(email, MAX_LOGIN_ATTEMPTS, LOGIN_LOCK_DURATION);
        const remaining = loginAttemptService.getRemainingAttempts(
          email,
          MAX_LOGIN_ATTEMPTS
        );
        throw {
          code: 'INVALID_CREDENTIALS',
          message: 'Email ou mot de passe incorrect',
          remainingAttempts: remaining.remainingAttempts,
          status: 401,
        };
      }

      // Génération du token
      const token = generateToken({
        id: user.id_utilisateurs,
        email: user.email,
      });

      // Réinitialiser les tentatives échouées
      loginAttemptService.resetAttempts(email);

      return {
        token,
        user: {
          id: user.id_utilisateurs,
          email: user.email,
        },
      };
    } catch (error) {
      if (error.code) {
        throw error;
      }
      throw {
        code: 'AUTH_ERROR',
        message: error.message || 'Erreur d\'authentification',
        status: 500,
      };
    }
  },

  async register(email, password) {
    try {
      // Validation des paramètres
      if (!email || !password) {
        throw {
          code: 'INVALID_INPUT',
          message: 'Email et mot de passe sont obligatoires',
          status: 400,
        };
      }

      // Valider le format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw {
          code: 'INVALID_EMAIL',
          message: 'Format d\'email invalide',
          status: 400,
        };
      }

      // Valider la longueur du mot de passe
      if (password.length < 6) {
        throw {
          code: 'WEAK_PASSWORD',
          message: 'Le mot de passe doit contenir au moins 6 caractères',
          status: 400,
        };
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await Utilisateur.findOne({
        where: { email: email.toLowerCase() },
      });
      if (existingUser) {
        throw {
          code: 'EMAIL_EXISTS',
          message: 'Cet email est déjà utilisé',
          status: 409,
        };
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur
      const user = await Utilisateur.create({
        email: email.toLowerCase(),
        mot_de_passe: hashedPassword,
      });

      // Générer un token JWT
      const token = generateToken({
        id: user.id_utilisateurs,
        email: user.email,
      });

      return {
        token,
        user: {
          id: user.id_utilisateurs,
          email: user.email,
        },
      };
    } catch (error) {
      if (error.code) {
        throw error;
      }
      throw {
        code: 'REGISTRATION_ERROR',
        message: error.message || 'Erreur d\'enregistrement',
        status: 500,
      };
    }
  },
};

module.exports = authService;
