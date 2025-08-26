const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  coverImage: {
    type: DataTypes.STRING,
  },
  images: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  sizes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
  },
  languages: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
  },
});

module.exports = Product;