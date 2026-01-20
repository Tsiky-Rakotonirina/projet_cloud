// src/authService.ts
import { auth } from "./services/firebase/firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User
} from "firebase/auth";
import { ref } from "vue";
import {
  SESSION_CONFIG,
  setSessionTimeout as configSetSessionTimeout,
  getSessionTimeout
} from "@/config/auth";
import { getUserByEmail, resetLoginAttempts, incrementLoginAttempts, checkAndUnblockExpiredAccounts } from "@/services/userService";

// État global de l'utilisateur
export const currentUser = ref<User | null>(null);

// Variables pour la gestion de session
let inactivityTimer: NodeJS.Timeout | null = null;
let sessionStartTime: number = 0;

// Fonction pour se connecter
export const login = async (email: string, password: string) => {
  try {
    console.log("Tentative de connexion avec :", email);

    // Vérifier si le compte est bloqué (et essayer de le débloquer automatiquement)
    const userProfile = await getUserByEmail(email);
    if (userProfile?.blocked) {
      // Essayer de débloquer automatiquement
      const unblocked = await checkAndUnblockExpiredAccounts(email);
      if (!unblocked) {
        throw new Error("Votre compte est temporairement bloqué en raison de trop nombreuses tentatives de connexion échouées. Veuillez réessayer plus tard.");
      }
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Connecté :", userCredential.user.email);
    currentUser.value = userCredential.user;

    // Réinitialiser les tentatives de connexion après une connexion réussie
    await resetLoginAttempts(email);

    startInactivityTimer(); // Démarrer le timer de session
    return userCredential.user;
  } catch (err: any) {
    console.error("Erreur login :", err.code, err.message);

    // Incrémenter les tentatives de connexion échouées
    if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      await incrementLoginAttempts(email);
    }

    throw new Error(translateAuthError(err.code));
  }
};

// Fonction pour s'inscrire
export const register = async (email: string, password: string) => {
  try {
    console.log("Tentative d'inscription avec :", email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Inscrit :", userCredential.user.email);
    currentUser.value = userCredential.user;

    // Réinitialiser les tentatives de connexion après une inscription réussie
    await resetLoginAttempts(email);

    startInactivityTimer(); // Démarrer le timer de session
    return userCredential.user;
  } catch (err: any) {
    console.error("Erreur register :", err.code, err.message);
    throw new Error(translateAuthError(err.code));
  }
};

// Fonction pour écouter l'état de connexion
export const observeAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, user => {
    console.log("Auth state changed :", user?.email || "Déconnecté");
    currentUser.value = user;
    if (user) {
      startInactivityTimer(); // Démarrer le timer si utilisateur connecté
    } else {
      stopInactivityTimer(); // Arrêter le timer si déconnecté
    }
    callback(user);
  });
};

// Fonction pour se déconnecter
export const logout = async () => {
  try {
    stopInactivityTimer(); // Arrêter le timer avant déconnexion
    await signOut(auth);
    currentUser.value = null;
    
    // Nettoyer le localStorage et sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Nettoyer les cookies de session
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    console.log("Déconnecté avec succès et session nettoyée");
  } catch (err: any) {
    console.error("Erreur lors de la déconnexion :", err.message);
  }
};

// Fonction pour obtenir l'utilisateur actuel
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Fonction pour définir la durée de vie de session (en minutes)
export const setSessionTimeout = (minutes: number) => {
  configSetSessionTimeout(minutes);
  // Redémarrer le timer si un utilisateur est connecté
  if (currentUser.value) {
    resetInactivityTimer();
  }
};

// Fonction pour obtenir la durée de session actuelle (en minutes)
export const getSessionTimeout = () => {
  return SESSION_CONFIG.TIMEOUT_INACTIVITY / (60 * 1000);
};

// Déconnexion automatique après inactivité
const startInactivityTimer = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }

  inactivityTimer = setTimeout(async () => {
    console.log("Session expirée par inactivité");
    await logout();
    // Optionnel : émettre un événement ou rediriger
    window.dispatchEvent(new CustomEvent('session-expired'));
  }, SESSION_CONFIG.TIMEOUT_INACTIVITY);
};

// Réinitialiser le timer d'inactivité
const resetInactivityTimer = () => {
  if (currentUser.value) {
    startInactivityTimer();
  }
};

// Arrêter le timer d'inactivité
const stopInactivityTimer = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
};

// Événements qui réinitialisent le timer d'inactivité
const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

// Initialiser la détection d'activité
export const initActivityDetection = () => {
  activityEvents.forEach(event => {
    window.addEventListener(event, resetInactivityTimer, { passive: true });
  });
  console.log("Détection d'activité initialisée");
};

// Nettoyer les listeners d'activité
export const cleanupActivityDetection = () => {
  activityEvents.forEach(event => {
    window.removeEventListener(event, resetInactivityTimer);
  });
  stopInactivityTimer();
  console.log("Détection d'activité nettoyée");
};

// Traduction des erreurs Firebase en français
const translateAuthError = (code: string): string => {
  const errors: { [key: string]: string } = {
    "auth/email-already-in-use": "Cet email est déjà utilisé",
    "auth/weak-password": "Le mot de passe est trop faible (min 6 caractères)",
    "auth/user-not-found": "Utilisateur non trouvé",
    "auth/wrong-password": "Mot de passe incorrect",
    "auth/invalid-email": "Email invalide",
    "auth/invalid-credential": "Email ou mot de passe incorrect"
  };
  return errors[code] || "Une erreur est survenue. Réessayez.";
};
