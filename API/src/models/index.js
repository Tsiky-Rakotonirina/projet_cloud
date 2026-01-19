const fs = require('fs');
const path = require('path');
const sequelize = require('../config/sequelize');
const { DataTypes } = require('sequelize');

const db = {};

// Charger tous les modèles
fs.readdirSync(__dirname)
  .filter((file) => file.endsWith('.model.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// Appliquer les associations si elles existent
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = sequelize.Sequelize || require('sequelize').Sequelize;

module.exports = db;
