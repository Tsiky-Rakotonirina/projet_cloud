const bcrypt = require('bcrypt');
const { Utilisateur, FirebaseMapping } = require('../models');
const { generateToken } = require('../utils/jwt');
const loginAttemptService = require('./login-attempt.service');

// Configuration Firebase Admin SDK
const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-admin-sdk.json');

// Vérifier si Firebase n'est pas déjà initialisé
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firebaseAuth = admin.auth();
const firebaseDB = admin.firestore();

const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS);
const LOGIN_LOCK_DURATION = parseInt(process.env.LOGIN_LOCK_DURATION);

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

  /**
   * Créer un utilisateur dans Firebase Auth ET Firestore ET PostgreSQL
   * Assure la cohérence entre les trois systèmes
   */
  async registerWithFirebase(email, password) {
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

      // 1. Créer l'utilisateur dans Firebase Auth
      let firebaseUser;
      try {
        firebaseUser = await firebaseAuth.createUser({
          email: email.toLowerCase(),
          password: password,
          emailVerified: false,
        });
        console.log(`✅ Utilisateur Firebase Auth créé: ${firebaseUser.uid}`);
      } catch (firebaseError) {
        if (firebaseError.code === 'auth/email-already-exists') {
          // L'utilisateur existe déjà dans Firebase Auth, récupérer son UID
          firebaseUser = await firebaseAuth.getUserByEmail(email.toLowerCase());
          console.log(`ℹ️ Utilisateur Firebase Auth existe déjà: ${firebaseUser.uid}`);
        } else {
          throw {
            code: 'FIREBASE_AUTH_ERROR',
            message: firebaseError.message,
            status: 400,
          };
        }
      }

      // 2. Créer/Mettre à jour le document dans Firestore (utilisateurs)
      const firestoreData = {
        email: email.toLowerCase(),
        profilId: 'profil_2',
        role: 'user',
        blocked: false,
        disabled: false,
        loginAttempts: 0,
        createdAt: new Date().toISOString(),
        synced_at: new Date().toISOString(),
      };

      await firebaseDB.collection('utilisateurs').doc(firebaseUser.uid).set(firestoreData, { merge: true });
      console.log(`✅ Document Firestore créé/mis à jour: ${firebaseUser.uid}`);

      // 3. Créer l'utilisateur dans PostgreSQL
      const hashedPassword = await bcrypt.hash(password, 10);
      
      let pgUser = await Utilisateur.findOne({
        where: { email: email.toLowerCase() },
      });

      if (!pgUser) {
        pgUser = await Utilisateur.create({
          email: email.toLowerCase(),
          mot_de_passe: hashedPassword,
          profil_id: 2,
        });
        console.log(`✅ Utilisateur PostgreSQL créé: ${pgUser.id_utilisateurs}`);
      } else {
        await pgUser.update({ mot_de_passe: hashedPassword });
        console.log(`ℹ️ Utilisateur PostgreSQL mis à jour: ${pgUser.id_utilisateurs}`);
      }

      // 4. Créer le mapping Firebase <-> PostgreSQL
      const existingMapping = await FirebaseMapping.findOne({
        where: {
          entity_type: 'utilisateur',
          postgres_id: pgUser.id_utilisateurs,
        },
      });

      if (!existingMapping) {
        await FirebaseMapping.create({
          entity_type: 'utilisateur',
          postgres_id: pgUser.id_utilisateurs,
          firebase_id: firebaseUser.uid,
        });
        console.log(`✅ Mapping créé: PG ${pgUser.id_utilisateurs} <-> Firebase ${firebaseUser.uid}`);
      } else {
        await existingMapping.update({ firebase_id: firebaseUser.uid, updated_at: new Date() });
      }

      // Générer un token JWT
      const token = generateToken({
        id: pgUser.id_utilisateurs,
        email: pgUser.email,
        firebaseUid: firebaseUser.uid,
      });

      return {
        token,
        user: {
          id: pgUser.id_utilisateurs,
          email: pgUser.email,
          firebaseUid: firebaseUser.uid,
        },
        message: 'Utilisateur créé dans Firebase Auth, Firestore et PostgreSQL',
      };
    } catch (error) {
      console.error('❌ Erreur registerWithFirebase:', error);
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
