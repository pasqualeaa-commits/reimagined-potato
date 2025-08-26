// models/index.js
const { Sequelize } = require('sequelize'); // Aggiungi Sequelize all'import
const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Inizializza i modelli
db.users = User;
db.products = Product;

// Sincronizza il database
db.sequelize.sync({ force: true }) // 'force: true' crea le tabelle ogni volta (utile in fase di sviluppo)
  .then(() => {
    console.log('Database sincronizzato.');
  })
  .catch((err) => {
    console.error('Errore durante la sincronizzazione del database:', err);
  });

module.exports = db;