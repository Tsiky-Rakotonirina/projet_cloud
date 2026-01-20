export const SESSION_CONFIG = {
  // Durée d'inactivité avant déconnexion automatique (en millisecondes)
  TIMEOUT_INACTIVITY: 30 * 60 * 1000, // 30 minutes

  // Durée maximale de session (en millisecondes)
  MAX_SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 heures
};

// Configuration des tentatives de connexion
export const LOGIN_ATTEMPTS_CONFIG = {
  // Nombre maximum de tentatives de connexion avant blocage
  MAX_ATTEMPTS: 3,

  // Durée du blocage après dépassement des tentatives (en millisecondes)
  BLOCK_DURATION: 15 * 60 * 1000, // 15 minutes

  // Durée avant réinitialisation des tentatives (en millisecondes)
  RESET_ATTEMPTS_AFTER: 24 * 60 * 60 * 1000, // 24 heures
};

// Fonctions utilitaires pour modifier la configuration
export const setSessionTimeout = (minutes: number) => {
  SESSION_CONFIG.TIMEOUT_INACTIVITY = minutes * 60 * 1000;
  console.log(`Durée de session définie à ${minutes} minutes`);
};

export const setMaxLoginAttempts = (max: number) => {
  LOGIN_ATTEMPTS_CONFIG.MAX_ATTEMPTS = max;
  console.log(`Nombre max de tentatives défini à ${max}`);
};

export const setBlockDuration = (minutes: number) => {
  LOGIN_ATTEMPTS_CONFIG.BLOCK_DURATION = minutes * 60 * 1000;
  console.log(`Durée de blocage définie à ${minutes} minutes`);
};

export const setResetAttemptsAfter = (hours: number) => {
  LOGIN_ATTEMPTS_CONFIG.RESET_ATTEMPTS_AFTER = hours * 60 * 60 * 1000;
  console.log(`Réinitialisation des tentatives après ${hours} heures`);
};

// Getters pour accéder aux configurations
export const getSessionTimeout = () => SESSION_CONFIG.TIMEOUT_INACTIVITY;
export const getMaxLoginAttempts = () => LOGIN_ATTEMPTS_CONFIG.MAX_ATTEMPTS;
export const getBlockDuration = () => LOGIN_ATTEMPTS_CONFIG.BLOCK_DURATION;
export const getResetAttemptsAfter = () => LOGIN_ATTEMPTS_CONFIG.RESET_ATTEMPTS_AFTER;