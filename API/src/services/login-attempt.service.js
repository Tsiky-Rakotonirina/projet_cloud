const loginAttempts = new Map();

const loginAttemptService = {
  getAttempts(email) {
    const key = email.toLowerCase();
    const attempts = loginAttempts.get(key) || {
      count: 0,
      lastAttempt: null,
      lockedUntil: null,
    };
    return attempts;
  },

  incrementAttempts(email, maxAttempts = 3, lockDuration = 2 * 60 * 1000) {
    const key = email.toLowerCase();
    const attempts = this.getAttempts(email);

    attempts.count += 1;
    attempts.lastAttempt = Date.now();

    // Vérouiller le compte si le nombre max de tentatives est dépassé
    if (attempts.count >= maxAttempts) {
      attempts.lockedUntil = Date.now() + lockDuration;
    }

    loginAttempts.set(key, attempts);

    return attempts;
  },

  resetAttempts(email) {
    const key = email.toLowerCase();
    loginAttempts.delete(key);
  },

  isLocked(email) {
    const attempts = this.getAttempts(email);
    if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      return {
        isLocked: true,
        lockedUntil: attempts.lockedUntil,
        remainingTime: Math.ceil((attempts.lockedUntil - Date.now()) / 1000),
      };
    }
    // Réinitialiser si le verrou a expiré
    if (attempts.lockedUntil && attempts.lockedUntil <= Date.now()) {
      loginAttempts.delete(email.toLowerCase());
    }
    return { isLocked: false };
  },

  getRemainingAttempts(email, maxAttempts = 3) {
    const attempts = this.getAttempts(email);
    return {
      remainingAttempts: Math.max(0, maxAttempts - attempts.count),
      totalAttempts: attempts.count,
      isLocked: this.isLocked(email).isLocked,
    };
  },

  cleanup() {
    const now = Date.now();
    for (const [key, attempts] of loginAttempts.entries()) {
      // Supprimer si verrouillé depuis plus de 1 heure
      if (attempts.lockedUntil && attempts.lockedUntil + 3600000 < now) {
        loginAttempts.delete(key);
      }
    }
  },
};

setInterval(() => loginAttemptService.cleanup(), 10 * 60 * 1000);

module.exports = loginAttemptService;
