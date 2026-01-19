require('dotenv').config();
const app = require('./app');
const db = require('./models');

const PORT = process.env.PORT || 3000;

// Synchroniser la base de données et démarrer le serveur
db.sequelize
  .sync({ alter: false })
  .then(() => {
    console.log('✓ Base de données synchronisée');

    app.listen(PORT, () => {
      console.log(`✓ Serveur démarré sur le port ${PORT}`);
      console.log(`✓ Environnement: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    console.error('Erreur lors de la synchronisation de la base de données:', error);
    process.exit(1);
  });
