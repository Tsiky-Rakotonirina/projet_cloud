const errorMiddleware = (err, req, res, next) => {
  console.error('Erreur:', err);

  const status = err.status || 500;
  const message = err.message || 'Erreur serveur interne';

  res.status(status).json({
    message,
    success: false,
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
};

module.exports = errorMiddleware;
