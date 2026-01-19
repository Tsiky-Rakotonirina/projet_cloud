/**
 * Utilitaires généraux
 */

/**
 * Valide une adresse email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide la force du mot de passe
 * Minimum 8 caractères, au moins 1 majuscule, 1 minuscule, 1 chiffre
 */
const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Formate une réponse de succès
 */
const successResponse = (message, data = null) => {
  return {
    success: true,
    message,
    ...(data && { data }),
  };
};

/**
 * Formate une réponse d'erreur
 */
const errorResponse = (message) => {
  return {
    success: false,
    message,
  };
};

module.exports = {
  isValidEmail,
  isValidPassword,
  successResponse,
  errorResponse,
};
